// Productividad de SUPGO CONTROL: actividades por persona y resultados reales del negocio.
// Requiere la clave de administración (la misma de CONTROL).
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type", "Access-Control-Allow-Methods": "POST,OPTIONS", "Content-Type": "application/json" };
const out = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: cors });
function db() {
  const u = Deno.env.get("SUPABASE_URL")!;
  const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
  return createClient(u, k);
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const TZ = "America/Bogota";
const dayOf = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }) : "";
const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const cleanName = (s: unknown) => String(s || "").trim().slice(0, 40);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ error: "Método no permitido" }, 405);
  try {
    const b = await req.json();
    const c = db();
    const { data: h, error: he } = await c.rpc("lift_admin_hash");
    if (he || !/^[0-9a-f]{64}$/.test(String(h || ""))) return out({ error: "No se pudo validar la clave" }, 500);
    if ((await sha(String(b.password || ""))) !== String(h)) return out({ error: "Clave incorrecta" }, 401);
    const a = String(b.action || "");

    if (a === "load") {
      const persona = cleanName(b.persona);
      const hasta = isDate(b.hasta) ? b.hasta : new Date().toLocaleDateString("en-CA", { timeZone: TZ });
      const desde = isDate(b.desde) ? b.desde : (() => { const d = new Date(hasta + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 90); return d.toISOString().slice(0, 10); })();
      const from = new Date(desde + "T00:00:00-05:00").toISOString();
      const [cfg, dias, equipo, ped, prog, seg, cot, car] = await Promise.all([
        c.from("lift_productividad_config").select("actividades,personas").eq("id", 1).single(),
        persona ? c.from("lift_productividad_dias").select("fecha,valores,nota").eq("persona", persona).gte("fecha", desde).lte("fecha", hasta) : Promise.resolve({ data: [] }),
        c.from("lift_productividad_dias").select("persona,valores").eq("fecha", hasta),
        c.from("lift_pedidos").select("created_at,total,origen,estado_operativo").gte("created_at", from).neq("estado_operativo", "cancelado").limit(5000),
        c.from("lift_pedidos").select("fecha_programado").gte("fecha_programado", from).limit(5000),
        c.from("lift_pedidos").select("fecha_seguimiento").gte("fecha_seguimiento", from).limit(5000),
        c.from("lift_cotizaciones").select("created_at,seguimiento_at,total").or(`created_at.gte.${from},seguimiento_at.gte.${from}`).limit(5000),
        c.from("lift_carritos_abandonados").select("actualizado_en,total").gte("actualizado_en", from).limit(5000),
      ]);
      if (cfg.error) throw cfg.error;
      const m: Record<string, Record<string, number>> = {};
      const add = (d: string, k: string, v = 1) => { if (!d) return; (m[d] ||= {}); m[d][k] = (m[d][k] || 0) + v; };
      for (const p of ped.data || []) {
        if (["proveedor", "whatsapp_historico"].includes(String(p.origen))) continue;
        const d = dayOf(p.created_at);
        add(d, "pedidos"); add(d, "ventas", Number(p.total) || 0);
        add(d, String(p.origen) === "checkout-publico" ? "pedidos_web" : "pedidos_admin");
      }
      for (const p of prog.data || []) add(dayOf(p.fecha_programado), "programados");
      for (const p of seg.data || []) add(dayOf(p.fecha_seguimiento), "seguimientos");
      for (const q of cot.data || []) {
        if (q.created_at && q.created_at >= from) { add(dayOf(q.created_at), "cotizaciones"); add(dayOf(q.created_at), "cotizado", Number(q.total) || 0); }
        if (q.seguimiento_at && q.seguimiento_at >= from) add(dayOf(q.seguimiento_at), "cotizaciones_seguidas");
      }
      for (const x of car.data || []) add(dayOf(x.actualizado_en), "carritos");
      return out({ ok: true, config: cfg.data, dias: dias.data || [], equipo: equipo.data || [], metricas: m, desde, hasta });
    }

    if (a === "save-day") {
      const persona = cleanName(b.persona);
      if (!persona || !isDate(b.fecha)) return out({ error: "Datos inválidos" }, 400);
      const valores: Record<string, number> = {};
      for (const [k, v] of Object.entries(b.valores || {})) {
        const n = Math.max(0, Math.min(100000, Math.round(Number(v) || 0)));
        if (n && /^[a-z0-9_-]{1,40}$/i.test(k)) valores[k] = n;
      }
      const { error } = await c.from("lift_productividad_dias").upsert({ persona, fecha: b.fecha, valores, nota: String(b.nota || "").slice(0, 2000), updated_at: new Date().toISOString() });
      if (error) throw error;
      return out({ ok: true });
    }

    if (a === "import-days") {
      const persona = cleanName(b.persona);
      const rows = (Array.isArray(b.dias) ? b.dias : []).filter((d: any) => isDate(d?.fecha)).slice(0, 400).map((d: any) => ({ persona, fecha: d.fecha, valores: d.valores || {}, nota: String(d.nota || "").slice(0, 2000) }));
      if (!persona || !rows.length) return out({ ok: true, n: 0 });
      // No pisa días que ya existan en Supabase.
      const { data: ex } = await c.from("lift_productividad_dias").select("fecha").eq("persona", persona).in("fecha", rows.map((r: any) => r.fecha));
      const have = new Set((ex || []).map((r: any) => r.fecha));
      const fresh = rows.filter((r: any) => !have.has(r.fecha));
      if (fresh.length) { const { error } = await c.from("lift_productividad_dias").insert(fresh); if (error) throw error; }
      return out({ ok: true, n: fresh.length });
    }

    if (a === "save-config") {
      const acts = (Array.isArray(b.actividades) ? b.actividades : []).slice(0, 80).map((x: any) => ({
        id: String(x.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || crypto.randomUUID().slice(0, 8),
        nombre: String(x.nombre || "").trim().slice(0, 120), categoria: String(x.categoria || "General").trim().slice(0, 30),
        meta: Math.max(1, Math.min(1000, Math.round(Number(x.meta) || 1))), xp: Math.max(1, Math.min(500, Math.round(Number(x.xp) || 10))),
        auto: ["", "pedidos", "programados", "seguimientos", "cotizaciones", "cotizaciones_seguidas"].includes(String(x.auto || "")) ? String(x.auto || "") : "",
        pasos: (Array.isArray(x.pasos) ? x.pasos : []).map((s: any) => String(s).trim().slice(0, 300)).filter(Boolean).slice(0, 10),
        enlace: String(x.enlace || "").trim().slice(0, 300), dias: Array.isArray(x.dias) ? x.dias.map(Number).filter((n: number) => n >= 0 && n <= 6) : [],
      })).filter((x: any) => x.nombre);
      const personas = [...new Set((Array.isArray(b.personas) ? b.personas : []).map(cleanName).filter(Boolean))].slice(0, 20);
      if (!personas.length) return out({ error: "Debe haber al menos una persona" }, 400);
      const { error } = await c.from("lift_productividad_config").upsert({ id: 1, actividades: acts, personas, updated_at: new Date().toISOString() });
      if (error) throw error;
      return out({ ok: true, actividades: acts, personas });
    }
    return out({ error: "Acción no válida" }, 400);
  } catch (e) {
    return out({ error: (e as Error)?.message || "Error" }, 500);
  }
});
