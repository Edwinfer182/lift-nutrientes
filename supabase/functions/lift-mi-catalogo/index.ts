// Catálogo PDF propio de SUPGO: da una URL firmada para subir el PDF generado en CONTROL
// y guarda la información de lo publicado. Requiere la clave de administración.
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type", "Access-Control-Allow-Methods": "POST,OPTIONS", "Content-Type": "application/json" };
const out = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: cors });
const BUCKET = "supgo-catalogo-publico";
const VERSIONS: Record<string, string> = { publico: "supgo-catalogo.pdf", entrenador: "supgo-catalogo-entrenador.pdf" };
function db() {
  const u = Deno.env.get("SUPABASE_URL")!;
  const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
  return createClient(u, k);
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ error: "Método no permitido" }, 405);
  try {
    const b = await req.json();
    const c = db();
    const { data: h, error: he } = await c.rpc("lift_admin_hash");
    if (he || !/^[0-9a-f]{64}$/.test(String(h || ""))) return out({ error: "No se pudo validar la clave" }, 500);
    if ((await sha(String(b.password || ""))) !== String(h)) return out({ error: "Clave incorrecta" }, 401);
    const action = String(b.action || "");
    if (action === "estado") {
      const { data } = await c.from("lift_catalog_config").select("valor").eq("clave", "mi_catalogo").maybeSingle();
      return out({ ok: true, estado: data?.valor || {} });
    }
    const version = String(b.version || "");
    const file = VERSIONS[version];
    if (!file) return out({ error: "Versión no válida" }, 400);
    if (action === "upload-url") {
      const { data, error } = await c.storage.from(BUCKET).createSignedUploadUrl(file, { upsert: true });
      if (error) throw error;
      return out({ ok: true, signedUrl: data.signedUrl, path: data.path });
    }
    if (action === "publicado") {
      const { data: cur } = await c.from("lift_catalog_config").select("valor").eq("clave", "mi_catalogo").maybeSingle();
      const val = { ...(cur?.valor || {}) } as Record<string, unknown>;
      val[version] = { actualizado: new Date().toISOString(), productos: Number(b.productos) || 0, paginas: Number(b.paginas) || 0, bytes: Number(b.bytes) || 0, filtros: String(b.filtros || "").slice(0, 300) };
      const { error } = await c.from("lift_catalog_config").upsert({ clave: "mi_catalogo", valor: val, updated_at: new Date().toISOString() }, { onConflict: "clave" });
      if (error) throw error;
      return out({ ok: true, estado: val });
    }
    return out({ error: "Acción no válida" }, 400);
  } catch (e) {
    return out({ error: (e as Error)?.message || "Error" }, 500);
  }
});
