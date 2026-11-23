// SUPGO · Pago contra entrega por pedido.
// - El administrador lo habilita en cada pedido (y decide si el envío se paga antes).
// - El cliente lo elige en /mi-pedido aceptando las condiciones.
import { createClient } from "npm:@supabase/supabase-js@2";

const COD_MAX = 300000;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};
const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });

function db() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
  return createClient(url, key);
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function isAdmin(c: any, password: unknown) {
  const { data, error } = await c.rpc("lift_admin_hash");
  if (error || !/^[0-9a-f]{64}$/.test(String(data || ""))) return false;
  return (await sha(String(password || ""))) === String(data);
}
const money = (v: unknown) => "$" + Math.round(Number(v || 0)).toLocaleString("es-CO");

async function notifyAdmin(p: any, previo: boolean) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "SUPGO <onboarding@resend.dev>";
  const cliente = (Array.isArray(p.lift_clientes) ? p.lift_clientes[0] : p.lift_clientes) || {};
  const text = [
    `El cliente eligió PAGO CONTRA ENTREGA en el pedido #${p.id}.`,
    `Cliente: ${cliente.nombre || ""}`,
    `Celular: ${cliente.celular || ""}`,
    previo
      ? `Envío por pagar en línea: ${money(p.envio)}. El pedido queda confirmado cuando entre ese pago.\nCobrar en efectivo al entregar: ${money(Number(p.total) - Number(p.envio))}`
      : `Cobrar en efectivo al entregar: ${money(p.total)}`,
    `Total del pedido: ${money(p.total)}`,
    "",
    "El cliente aceptó: entrega sin hora fija, debe haber alguien en la dirección y el segundo intento de envío tiene costo.",
  ].join("\n");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: ["edwinfdo182@gmail.com"], subject: `💵 Contra entrega elegida · Pedido #${p.id}`, text }),
    });
  } catch (e) {
    console.error("COD_ADMIN_EMAIL_FAILED", String(e));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respond({ error: "Método no permitido" }, 405);
  try {
    const b = await req.json().catch(() => ({}));
    const action = String(b.action || "");
    const c = db();

    // ---------- Cliente ----------
    if (action === "elegir" || action === "cancelar") {
      const id = Number(b.pedido_id), token = String(b.token || "").trim();
      if (!Number.isSafeInteger(id) || id <= 0 || token.length < 16) return respond({ error: "Acceso inválido" }, 400);
      const { data: p, error } = await c.from("lift_pedidos")
        .select("id,total,envio,estado_operativo,token_publico,pago_estado,contraentrega_habilitada,contraentrega_envio_previo,contraentrega_elegida,lift_clientes(nombre,celular)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      if (!p || p.token_publico !== token) return respond({ error: "Pedido no encontrado" }, 404);
      if (p.estado_operativo !== "pendiente_pago") return respond({ error: "El pago de este pedido todavía no está habilitado" }, 409);
      if (["aprobado", "contraentrega", "por_verificar"].includes(String(p.pago_estado || ""))) return respond({ error: "Este pedido ya tiene un pago registrado" }, 409);

      if (action === "cancelar") {
        const { error: eu } = await c.from("lift_pedidos").update({ contraentrega_elegida: false, contraentrega_aceptada_at: null }).eq("id", id);
        if (eu) throw eu;
        return respond({ ok: true, elegida: false });
      }

      if (!p.contraentrega_habilitada) return respond({ error: "El pago contra entrega no está habilitado para este pedido" }, 403);
      if (Number(p.total) > COD_MAX) return respond({ error: "El pago contra entrega está disponible para pedidos de hasta " + money(COD_MAX) }, 409);
      if (b.acepta !== true) return respond({ error: "Debes aceptar las condiciones del pago contra entrega" }, 400);

      const previo = Boolean(p.contraentrega_envio_previo) && Number(p.envio) > 0;
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = previo
        ? { contraentrega_elegida: true, contraentrega_aceptada_at: now }
        : {
          contraentrega_elegida: true, contraentrega_aceptada_at: now,
          medio_pago_cliente: "efectivo", forma_pago: "efectivo", pago_estado: "contraentrega",
          abono_inicial: 0, saldo_pendiente: Number(p.total),
        };
      const { error: eu } = await c.from("lift_pedidos").update(patch).eq("id", id);
      if (eu) throw eu;
      await notifyAdmin(p, previo);
      return respond({
        ok: true, elegida: true, envio_previo: previo,
        pagar_en_linea: previo ? Number(p.envio) : 0,
        pagar_al_recibir: previo ? Number(p.total) - Number(p.envio) : Number(p.total),
      });
    }

    // ---------- Administración ----------
    if (!(await isAdmin(c, b.password))) return respond({ error: "Clave incorrecta" }, 401);

    if (action === "admin-list") {
      const { data, error } = await c.from("lift_pedidos")
        .select("id,total,envio,pago_estado,contraentrega_habilitada,contraentrega_envio_previo,contraentrega_elegida")
        .order("fecha", { ascending: false }).limit(1000);
      if (error) throw error;
      return respond({ ok: true, tope: COD_MAX, pedidos: data || [] });
    }

    if (action === "admin-set") {
      const id = Number(b.pedido_id);
      if (!Number.isSafeInteger(id) || id <= 0) return respond({ error: "Pedido inválido" }, 400);
      const patch: Record<string, unknown> = {};
      if (typeof b.habilitada === "boolean") patch.contraentrega_habilitada = b.habilitada;
      if (typeof b.envio_previo === "boolean") patch.contraentrega_envio_previo = b.envio_previo;
      if (patch.contraentrega_habilitada === false) { patch.contraentrega_elegida = false; patch.contraentrega_aceptada_at = null; }
      if (Object.keys(patch).length) {
        const { error } = await c.from("lift_pedidos").update(patch).eq("id", id);
        if (error) throw error;
      }
      const { data, error } = await c.from("lift_pedidos")
        .select("id,total,envio,pago_estado,contraentrega_habilitada,contraentrega_envio_previo,contraentrega_elegida")
        .eq("id", id).single();
      if (error) throw error;
      return respond({ ok: true, tope: COD_MAX, pedido: data });
    }

    return respond({ error: "Acción no válida" }, 400);
  } catch (e) {
    console.error("COD_ERROR", e instanceof Error ? e.message : String(e));
    return respond({ error: "No se pudo completar la operación" }, 500);
  }
});
