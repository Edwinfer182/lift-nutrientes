// SUPGO · Calculadora de calorías: perfil, registros de peso, metas, puntos y canjes.
// Usa la misma sesión de la cuenta (token de lift-cuenta). Las tablas lift_fit_* solo se tocan desde aquí.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info", "Access-Control-Allow-Methods": "POST,OPTIONS" };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
class Fail extends Error { status: number; constructor(m: string, s = 400) { super(m); this.status = s; } }
function db() {
  const u = Deno.env.get("SUPABASE_URL")!;
  const l = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (l) return createClient(u, l);
  return createClient(u, JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default);
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const likeEsc = (v: string) => v.replace(/[\\%_]/g, (m) => "\\" + m);
const TZ = "America/Bogota";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T12:00:00Z"));
const num = (v: unknown, min: number, max: number) => { const n = Number(v); if (!Number.isFinite(n) || n < min || n > max) return null; return Math.round(n * 10) / 10; };
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
// Lunes de la semana de una fecha (clave de semana).
function weekOf(d: string) { const t = new Date(d + "T12:00:00Z"); const wd = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - wd); return t.toISOString().slice(0, 10); }

// Mismo orden de pedidos que la cuenta (desde que existen las cuentas).
const PEDIDOS_DESDE = "2026-10-31T13:30:00Z";

// ---------------- Reglas de puntos ----------------
const PTS = { perfil: 50, primeraMeta: 30, pesoSemana: 10, racha4: 50, metaCumplida: 200, porMilPesos: 1 };
// Canjes: puntos → valor del cupón (COP). Mínimo de compra = 2 × valor del cupón.
const NIVELES = [
  { puntos: 500, valor: 10000 },
  { puntos: 1200, valor: 30000 },
  { puntos: 2000, valor: 55000 },
];

// ---------------- Cálculo de calorías ----------------
const FACTOR: Record<string, number> = { sedentario: 1.2, ligero: 1.375, moderado: 1.55, alto: 1.725, muy_alto: 1.9 };
const SUPERAVIT: Record<string, number> = { suave: 250, moderado: 450 };
const DEFICIT: Record<string, number> = { suave: 300, moderado: 500 };
// Mínimo de calorías al bajar de peso (no se recomienda comer menos sin supervisión).
const PISO: Record<string, number> = { h: 1500, m: 1200 };
const imc = (peso: number, cm: number) => peso / ((cm / 100) ** 2);
function edad(nac: string) { const n = new Date(nac + "T12:00:00Z"), h = new Date(today() + "T12:00:00Z"); let a = h.getUTCFullYear() - n.getUTCFullYear(); if (h.getUTCMonth() < n.getUTCMonth() || (h.getUTCMonth() === n.getUTCMonth() && h.getUTCDate() < n.getUTCDate())) a--; return a; }
function plan(p: any, peso: number, objetivo: string, ritmo: string) {
  const e = edad(p.fecha_nacimiento), h = Number(p.estatura_cm), g = p.grasa_pct == null ? null : Number(p.grasa_pct);
  const tmb = g != null ? 370 + 21.6 * peso * (1 - g / 100) : 10 * peso + 6.25 * h - 5 * e + (p.sexo === "h" ? 5 : -161);
  const mant = tmb * (FACTOR[p.actividad] || 1.2);
  const ajuste = objetivo === "ganar" ? SUPERAVIT[ritmo] || 250 : objetivo === "bajar" ? -(DEFICIT[ritmo] || 300) : 0;
  let cal = Math.round((mant + ajuste) / 10) * 10;
  if (objetivo === "bajar") cal = Math.max(cal, PISO[p.sexo] || 1200);
  const prot = Math.round(peso * (objetivo === "mantener" ? 1.8 : 2));
  const gra = Math.round(peso * (objetivo === "bajar" ? 0.8 : 0.9));
  const carb = Math.max(0, Math.round((cal - prot * 4 - gra * 9) / 4));
  return { tmb: Math.round(tmb), mantenimiento: Math.round(mant / 10) * 10, calorias: cal, proteina_g: prot, grasa_g: gra, carbos_g: carb, formula: g != null ? "Katch-McArdle" : "Mifflin-St Jeor" };
}

async function session(c: any, token: unknown) {
  const t = String(token || "");
  if (!/^[0-9a-f]{64}$/.test(t)) throw new Fail("Tu sesión terminó. Vuelve a entrar.", 401);
  const { data } = await c.from("lift_cuenta_sesiones").select("cuenta_id,expira_en,lift_cuentas(id,email,nombre,celular)").eq("token_hash", await sha(t)).maybeSingle();
  if (!data || new Date(data.expira_en).getTime() < Date.now() || !data.lift_cuentas) throw new Fail("Tu sesión terminó. Vuelve a entrar.", 401);
  return data.lift_cuentas as any;
}

// Inserta un premio solo si esa clave no existe todavía. Devuelve true si se otorgó.
async function award(c: any, cuenta: number, puntos: number, motivo: string, clave: string) {
  if (puntos <= 0) return false;
  const { error } = await c.from("lift_fit_puntos").insert({ cuenta_id: cuenta, puntos, motivo, clave });
  if (error) { if (String(error.code) !== "23505") console.error("award", error.message); return false; }
  return true;
}

async function registros(c: any, cuenta: number, limit = 400) {
  const { data } = await c.from("lift_fit_registros").select("id,fecha,peso_kg,grasa_pct").eq("cuenta_id", cuenta).order("fecha", { ascending: false }).limit(limit);
  return (data || []).map((r: any) => ({ ...r, peso_kg: Number(r.peso_kg), grasa_pct: r.grasa_pct == null ? null : Number(r.grasa_pct) }));
}

// Racha: semanas seguidas (hasta la actual o la anterior) con al menos un registro.
function racha(regs: any[]) {
  const weeks = new Set(regs.map((r) => weekOf(r.fecha)));
  let w = weekOf(today());
  const prev = (x: string) => { const t = new Date(x + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() - 7); return t.toISOString().slice(0, 10); };
  if (!weeks.has(w)) w = prev(w);
  let n = 0; while (weeks.has(w)) { n++; w = prev(w); }
  return n;
}

// Revisa premios automáticos: compras entregadas y metas cumplidas.
async function sync(c: any, acct: any, regs: any[]) {
  const nuevos: string[] = [];
  // Compras entregadas
  const ids = ((await c.from("lift_clientes").select("id").ilike("email", likeEsc(acct.email))).data || []).map((x: any) => Number(x.id));
  const reqs = [c.from("lift_pedidos").select("id,total").ilike("email_destino", likeEsc(acct.email)).eq("estado_operativo", "entregado").gte("fecha", PEDIDOS_DESDE).limit(300)];
  if (ids.length) reqs.push(c.from("lift_pedidos").select("id,total").in("cliente_id", ids).eq("estado_operativo", "entregado").gte("fecha", PEDIDOS_DESDE).limit(300));
  const peds = new Map<number, number>();
  (await Promise.all(reqs)).forEach((r: any) => (r.data || []).forEach((p: any) => peds.set(Number(p.id), Number(p.total) || 0)));
  for (const [id, total] of peds) {
    const p = Math.floor(total / 1000) * PTS.porMilPesos;
    if (await award(c, acct.id, p, `Compra #${id} entregada`, `pedido-${id}`)) nuevos.push(`+${p} por tu compra #${id}`);
  }
  // Meta activa cumplida
  const { data: meta } = await c.from("lift_fit_metas").select("*").eq("cuenta_id", acct.id).eq("estado", "activa").maybeSingle();
  if (meta && regs.length) {
    const creada = new Date(meta.created_at).toLocaleDateString("en-CA", { timeZone: TZ });
    const dias = daysBetween(creada, today());
    const despues = regs.filter((r) => r.fecha >= creada);
    let ok = false;
    if (meta.objetivo === "ganar") ok = dias >= 21 && despues.length > 0 && despues[0].peso_kg >= Number(meta.peso_meta);
    else if (meta.objetivo === "bajar") ok = dias >= 21 && despues.length > 0 && despues[0].peso_kg <= Number(meta.peso_meta);
    else {
      // Mantener: 4 semanas distintas con registros dentro de ±1,5 kg de la meta, desde hace al menos 28 días.
      const semanas = new Set(despues.filter((r) => Math.abs(r.peso_kg - Number(meta.peso_meta)) <= 1.5).map((r) => weekOf(r.fecha)));
      ok = dias >= 28 && semanas.size >= 4;
    }
    if (ok) {
      await c.from("lift_fit_metas").update({ estado: "cumplida", cerrada_en: new Date().toISOString() }).eq("id", meta.id).eq("estado", "activa");
      if (await award(c, acct.id, PTS.metaCumplida, "Meta cumplida 🎉", `meta-${meta.id}`)) nuevos.push(`+${PTS.metaCumplida} por cumplir tu meta`);
    }
  }
  return nuevos;
}

async function load(c: any, acct: any, avisos: string[] = []) {
  const regs = await registros(c, acct.id);
  avisos = avisos.concat(await sync(c, acct, regs));
  const [perfil, metas, pts, canjes] = await Promise.all([
    c.from("lift_fit_perfil").select("sexo,fecha_nacimiento,estatura_cm,actividad,grasa_pct").eq("cuenta_id", acct.id).maybeSingle(),
    c.from("lift_fit_metas").select("id,objetivo,ritmo,peso_inicial,peso_meta,fecha_limite,calorias,proteina_g,grasa_g,carbos_g,estado,created_at,cerrada_en").eq("cuenta_id", acct.id).order("created_at", { ascending: false }).limit(20),
    c.from("lift_fit_puntos").select("puntos,motivo,created_at").eq("cuenta_id", acct.id).order("created_at", { ascending: false }).limit(1000),
    c.from("lift_fit_canjes").select("puntos,valor,created_at,lift_cupones(codigo,vence_en,activo)").eq("cuenta_id", acct.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const p = perfil.data ? { ...perfil.data, estatura_cm: Number(perfil.data.estatura_cm), grasa_pct: perfil.data.grasa_pct == null ? null : Number(perfil.data.grasa_pct) } : null;
  const lista = pts.data || [];
  const saldo = lista.reduce((s: number, x: any) => s + Number(x.puntos), 0);
  const cupIds: string[] = [];
  const canj = (canjes.data || []).map((x: any) => { if (x.lift_cupones?.codigo) cupIds.push(x.lift_cupones.codigo); return { puntos: x.puntos, valor: Number(x.valor), fecha: x.created_at, codigo: x.lift_cupones?.codigo || "", vence_en: x.lift_cupones?.vence_en || null, minimo: Number(x.valor) * 2 }; });
  // ¿Ya se usó cada cupón?
  if (cupIds.length) {
    const { data: usos } = await c.from("lift_cupon_usos").select("lift_cupones!inner(codigo)").in("lift_cupones.codigo", cupIds);
    const usados = new Set((usos || []).map((u: any) => u.lift_cupones?.codigo));
    canj.forEach((x: any) => x.usado = usados.has(x.codigo));
  }
  const activa = (metas.data || []).find((m: any) => m.estado === "activa") || null;
  const ultimo = regs[0]?.peso_kg;
  return {
    ok: true,
    cuenta: { email: acct.email, nombre: acct.nombre || "" },
    perfil: p,
    registros: regs.slice(0, 180),
    meta: activa,
    metas: metas.data || [],
    plan_actual: p && ultimo ? { bajar_suave: plan(p, ultimo, "bajar", "suave"), bajar_moderado: plan(p, ultimo, "bajar", "moderado"), mantener: plan(p, ultimo, "mantener", "suave"), ganar_suave: plan(p, ultimo, "ganar", "suave"), ganar_moderado: plan(p, ultimo, "ganar", "moderado") } : null,
    racha: racha(regs),
    puntos: { saldo, historial: lista.slice(0, 40) },
    canjes: canj,
    niveles: NIVELES,
    reglas: PTS,
    avisos,
  };
}

function codigoCanje(nombre: string) {
  const base = String(nombre || "SUPGO").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "SUPGO";
  const a = new Uint8Array(3); crypto.getRandomValues(a);
  return "PTS" + base + [...a].map((x) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x % 32]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") throw new Fail("Método no permitido", 405);
    const b = await req.json().catch(() => ({}));
    const c = db();
    const action = String(b.action || "");
    const acct = await session(c, b.token);

    if (action === "load") return out(await load(c, acct));

    if (action === "perfil-save") {
      const x = b.perfil || {};
      const sexo = x.sexo === "h" || x.sexo === "m" ? x.sexo : null;
      const nac = isDate(x.fecha_nacimiento) ? x.fecha_nacimiento : null;
      const est = num(x.estatura_cm, 120, 230);
      const act = Object.hasOwn(FACTOR, x.actividad) ? x.actividad : null;
      const gra = x.grasa_pct === "" || x.grasa_pct == null ? null : num(x.grasa_pct, 3, 60);
      if (!sexo || !nac || !est || !act) throw new Fail("Completa sexo, fecha de nacimiento, estatura y actividad.");
      const e = edad(nac); if (e < 15 || e > 90) throw new Fail("La calculadora es para personas entre 15 y 90 años.");
      if (x.grasa_pct !== "" && x.grasa_pct != null && gra == null) throw new Fail("El % de grasa debe estar entre 3 y 60.");
      const { error } = await c.from("lift_fit_perfil").upsert({ cuenta_id: acct.id, sexo, fecha_nacimiento: nac, estatura_cm: est, actividad: act, grasa_pct: gra, updated_at: new Date().toISOString() });
      if (error) throw error;
      const avisos: string[] = [];
      if (await award(c, acct.id, PTS.perfil, "Perfil completo", "perfil")) avisos.push(`+${PTS.perfil} por completar tu perfil`);
      // Si mandó peso con el perfil, se guarda como registro de hoy.
      const peso = num(x.peso_kg, 30, 300);
      if (peso) {
        await c.from("lift_fit_registros").upsert({ cuenta_id: acct.id, fecha: today(), peso_kg: peso, grasa_pct: gra }, { onConflict: "cuenta_id,fecha" });
        if (await award(c, acct.id, PTS.pesoSemana, "Registro de peso semanal", "peso-" + weekOf(today()))) avisos.push(`+${PTS.pesoSemana} por registrar tu peso esta semana`);
      }
      return out(await load(c, acct, avisos));
    }

    if (action === "peso-save") {
      const fecha = isDate(b.fecha) ? b.fecha : today();
      const peso = num(b.peso_kg, 30, 300);
      const gra = b.grasa_pct === "" || b.grasa_pct == null ? null : num(b.grasa_pct, 3, 60);
      if (!peso) throw new Fail("Escribe un peso entre 30 y 300 kg.");
      if (fecha > today()) throw new Fail("No puedes registrar fechas futuras.");
      if (daysBetween(fecha, today()) > 365) throw new Fail("Solo puedes registrar el último año.");
      const { error } = await c.from("lift_fit_registros").upsert({ cuenta_id: acct.id, fecha, peso_kg: peso, grasa_pct: gra }, { onConflict: "cuenta_id,fecha" });
      if (error) throw error;
      const avisos: string[] = [];
      // Solo dan puntos los registros de esta semana (no se pueden ganar llenando semanas pasadas).
      if (weekOf(fecha) === weekOf(today())) {
        if (await award(c, acct.id, PTS.pesoSemana, "Registro de peso semanal", "peso-" + weekOf(fecha))) avisos.push(`+${PTS.pesoSemana} por registrar tu peso esta semana`);
        const r = racha(await registros(c, acct.id));
        if (r > 0 && r % 4 === 0 && await award(c, acct.id, PTS.racha4, `Racha de ${r} semanas 🔥`, "racha-" + weekOf(fecha))) avisos.push(`+${PTS.racha4} por tu racha de ${r} semanas`);
      }
      return out(await load(c, acct, avisos));
    }

    if (action === "peso-delete") {
      await c.from("lift_fit_registros").delete().eq("id", Number(b.id)).eq("cuenta_id", acct.id);
      return out(await load(c, acct));
    }

    if (action === "meta-save") {
      const objetivo = ["ganar", "mantener", "bajar"].includes(b.objetivo) ? String(b.objetivo) : null;
      const ritmo = b.ritmo === "moderado" ? "moderado" : "suave";
      if (!objetivo) throw new Fail("Elige tu objetivo.");
      const { data: perfil } = await c.from("lift_fit_perfil").select("*").eq("cuenta_id", acct.id).maybeSingle();
      if (!perfil) throw new Fail("Primero completa tu perfil.");
      const regs = await registros(c, acct.id, 1);
      if (!regs.length) throw new Fail("Primero registra tu peso actual.");
      const actual = regs[0].peso_kg;
      const metaPeso = objetivo === "mantener" ? actual : num(b.peso_meta, 30, 300);
      if (!metaPeso) throw new Fail("Escribe tu peso meta.");
      if (objetivo === "ganar" && metaPeso <= actual) throw new Fail("Para ganar masa, el peso meta debe ser mayor a tu peso actual (" + actual + " kg).");
      if (objetivo === "ganar" && metaPeso > actual * 1.3) throw new Fail("Esa meta es muy alta para un solo plan. Ponte una meta intermedia.");
      if (objetivo === "bajar") {
        const est = Number(perfil.estatura_cm);
        if (imc(actual, est) < 18.5) throw new Fail("Con tu peso y estatura actuales no recomendamos bajar más. Habla con un profesional de la salud.");
        if (metaPeso >= actual) throw new Fail("Para bajar de peso, el peso meta debe ser menor a tu peso actual (" + actual + " kg).");
        const minimo = Math.ceil(18.5 * (est / 100) ** 2 * 10) / 10;
        if (metaPeso < minimo) throw new Fail("Esa meta queda por debajo de un peso saludable para tu estatura. El mínimo recomendado es " + minimo + " kg.");
        if (metaPeso < actual * 0.85) throw new Fail("Esa meta es muy baja para un solo plan. Ponte una meta intermedia.");
      }
      const limite = isDate(b.fecha_limite) && b.fecha_limite > today() ? b.fecha_limite : null;
      const pl = plan(perfil, actual, objetivo, ritmo);
      await c.from("lift_fit_metas").update({ estado: "cancelada", cerrada_en: new Date().toISOString() }).eq("cuenta_id", acct.id).eq("estado", "activa");
      const { error } = await c.from("lift_fit_metas").insert({ cuenta_id: acct.id, objetivo, ritmo, peso_inicial: actual, peso_meta: metaPeso, fecha_limite: limite, calorias: pl.calorias, proteina_g: pl.proteina_g, grasa_g: pl.grasa_g, carbos_g: pl.carbos_g });
      if (error) throw error;
      const avisos: string[] = [];
      if (await award(c, acct.id, PTS.primeraMeta, "Primera meta creada", "primera-meta")) avisos.push(`+${PTS.primeraMeta} por crear tu primera meta`);
      return out(await load(c, acct, avisos));
    }

    if (action === "meta-cancel") {
      await c.from("lift_fit_metas").update({ estado: "cancelada", cerrada_en: new Date().toISOString() }).eq("cuenta_id", acct.id).eq("estado", "activa");
      return out(await load(c, acct));
    }

    if (action === "canjear") {
      const nivel = NIVELES.find((n) => n.puntos === Number(b.puntos));
      if (!nivel) throw new Fail("Ese canje no existe.");
      let r: any = null;
      for (let i = 0; i < 5; i++) {
        const { data, error } = await c.rpc("lift_fit_canjear", { p_cuenta: acct.id, p_puntos: nivel.puntos, p_valor: nivel.valor, p_codigo: codigoCanje(acct.nombre) });
        if (error) { if (String(error.code) === "23505") continue; throw error; }
        r = data; break;
      }
      if (!r) throw new Fail("No pudimos crear el cupón. Inténtalo de nuevo.", 500);
      if (!r.ok) throw new Fail("Aún no tienes puntos suficientes para este canje.");
      return out(await load(c, acct, ["¡Listo! Tu cupón ya está en la sección de canjes."]));
    }

    throw new Fail("Acción no válida");
  } catch (e) {
    const s = e instanceof Fail ? e.status : 500;
    if (s === 500) console.error("lift-progreso", String((e as any)?.message || e));
    return out({ ok: false, error: e instanceof Fail ? e.message : "Ocurrió un error. Inténtalo de nuevo." }, s);
  }
});
