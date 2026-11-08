// Sube fotos de productos desde el Catálogo de SUPGO CONTROL.
// Requiere la clave de administración; guarda en el bucket público "lift-productos".
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
const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out({ error: "Método no permitido" }, 405);
  try {
    const b = await req.json();
    const c = db();
    const { data: h, error: he } = await c.rpc("lift_admin_hash");
    if (he || !/^[0-9a-f]{64}$/.test(String(h || ""))) return out({ error: "No se pudo validar la clave" }, 500);
    if ((await sha(String(b.password || ""))) !== String(h)) return out({ error: "Clave incorrecta" }, 401);
    const ext = TYPES[String(b.type || "")];
    if (!ext) return out({ error: "Formato no permitido (usa JPG, PNG o WebP)" }, 400);
    const raw = String(b.data || "").replace(/^data:[^,]+,/, "");
    const bytes = Uint8Array.from(atob(raw), (ch) => ch.charCodeAt(0));
    if (bytes.length < 100 || bytes.length > 5 * 1024 * 1024) return out({ error: "La imagen debe pesar menos de 5 MB" }, 400);
    const pid = String(b.producto_id || "nuevo").replace(/[^0-9a-z-]/gi, "").slice(0, 20) || "nuevo";
    const d = new Date();
    const path = `catalogo/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}/${pid}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await c.storage.from("lift-productos").upload(path, bytes, { contentType: String(b.type), cacheControl: "31536000", upsert: false });
    if (error) throw error;
    const { data } = c.storage.from("lift-productos").getPublicUrl(path);
    return out({ ok: true, url: data.publicUrl });
  } catch (e) {
    return out({ error: (e as Error)?.message || "No se pudo subir la imagen" }, 500);
  }
});
