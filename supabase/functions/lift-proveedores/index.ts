import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
let __adminHashCache:{h:string,t:number}|null=null;
async function adminHash():Promise<string>{if(__adminHashCache&&Date.now()-__adminHashCache.t<60000)return __adminHashCache.h;const {data,error}=await db().rpc("lift_admin_hash");if(error||!/^[0-9a-f]{64}$/.test(String(data||"")))throw new Error("No se pudo validar la clave de administración");__adminHashCache={h:String(data),t:Date.now()};return __adminHashCache.h}
async function hash(s:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function db(){const u=Deno.env.get("SUPABASE_URL")!;const k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;return createClient(u,k)}
const n=(v:any)=>Math.max(0,Math.round(Number(v)||0));
function signed(m:any){
 if(m.tipo==="compra_credito"||m.tipo==="ajuste_deuda") return n(m.valor);
 if(m.tipo==="pago_proveedor"||m.tipo==="ajuste_favor") return -n(m.valor);
 if(m.tipo==="efectivo_cobrado") return n(m.costo_proveedor)-n(m.valor_cobrado);
 return 0;
}
async function balance(c:any,id:number){
 const {data,error}=await c.from("lift_movimientos_proveedores").select("tipo,valor,costo_proveedor,valor_cobrado").eq("proveedor_id",id);if(error)throw error;
 return (data||[]).reduce((a:number,x:any)=>a+signed(x),0);
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 const h={...corsHeaders,"Content-Type":"application/json"};
 const ok=(d:any)=>new Response(JSON.stringify({ok:true,...d}),{headers:h});
 try{
  const b=await req.json();
  if(await hash(String(b.password||""))!==await adminHash())return new Response(JSON.stringify({error:"Clave incorrecta"}),{status:401,headers:h});
  const c=db(), action=String(b.action||"");
  if(action==="providers"){
   const {data:p,error:e}=await c.from("lift_proveedores").select("id,nombre,celular,activo,notas").eq("activo",true).order("nombre");if(e)throw e;
   const {data:m,error:e2}=await c.from("lift_movimientos_proveedores").select("id,proveedor_id,fecha,tipo,valor,costo_proveedor,valor_cobrado,cliente,referencia,nota").order("fecha",{ascending:false}).order("id",{ascending:false});if(e2)throw e2;
   const balances:any={};for(const x of m||[])balances[x.proveedor_id]=(balances[x.proveedor_id]||0)+signed(x);
   let pedidos:any[]=[];
   if(b.con_pedidos){
     const {data:pd}=await c.from("lift_pedidos").select("id,created_at,total,estado_operativo,proveedor_disponibilidad_nombre,referencia").not("proveedor_disponibilidad_nombre","is",null).order("id",{ascending:false}).limit(300);
     pedidos=pd||[];
   }
   return ok({proveedores:(p||[]).map(x=>({...x,balance:balances[x.id]||0})),movimientos:m||[],pedidos});
  }
  if(action==="provider-movement"){
   const proveedor_id=Number(b.proveedor_id),tipo=String(b.tipo||"");
   if(!Number.isFinite(proveedor_id))throw new Error("Proveedor inválido");
   if(!["compra_credito","pago_proveedor","efectivo_cobrado","ajuste_favor","ajuste_deuda"].includes(tipo))throw new Error("Tipo de movimiento inválido");
   let valor=n(b.valor);
   const before=await balance(c,proveedor_id);
   if(tipo==="pago_proveedor" && b.saldar===true){
     if(before<=0)throw new Error("Este proveedor no tiene deuda pendiente");
     valor=before;
   }
   const row:any={proveedor_id,tipo,valor,costo_proveedor:n(b.costo_proveedor),valor_cobrado:n(b.valor_cobrado),cliente:String(b.cliente||"").trim(),referencia:String(b.referencia||"").trim(),nota:String(b.nota||"").trim()};
   if(typeof b.fecha==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(b.fecha))row.fecha=new Date(b.fecha+"T12:00:00-05:00").toISOString();
   if(tipo==="efectivo_cobrado" && row.valor_cobrado<=0)throw new Error("Indica cuánto efectivo cobró el proveedor");
   if(tipo!=="efectivo_cobrado" && row.valor<=0)throw new Error("Indica el valor del movimiento");
   const {data,error}=await c.from("lift_movimientos_proveedores").insert(row).select("id,fecha").single();if(error)throw error;
   const after=await balance(c,proveedor_id);
   return ok({movimiento:data,balance_anterior:before,balance:after,valor_aplicado:valor});
  }
  if(action==="provider-payoff"){
   const proveedor_id=Number(b.proveedor_id);if(!Number.isFinite(proveedor_id))throw new Error("Proveedor inválido");
   const before=await balance(c,proveedor_id);
   if(before<=0)throw new Error(before<0?"Tienes saldo a favor con este proveedor":"La cuenta ya está en cero");
   const row={proveedor_id,tipo:"pago_proveedor",valor:before,costo_proveedor:0,valor_cobrado:0,cliente:"",referencia:String(b.referencia||"").trim(),nota:String(b.nota||"Abono para saldar cuenta").trim()};
   const {data,error}=await c.from("lift_movimientos_proveedores").insert(row).select("id,fecha").single();if(error)throw error;
   return ok({movimiento:data,balance_anterior:before,balance:0,valor_aplicado:before});
  }
  if(action==="movement-delete"){
   // Solo para corregir errores recientes: movimientos de los últimos 7 días.
   const id=Number(b.id);if(!Number.isFinite(id))throw new Error("Movimiento inválido");
   const {data:m,error:e}=await c.from("lift_movimientos_proveedores").select("id,proveedor_id,created_at").eq("id",id).single();if(e)throw e;
   if(Date.now()-new Date(m.created_at).getTime()>7*864e5)throw new Error("Solo se pueden anular movimientos de los últimos 7 días; registra un ajuste");
   const {error}=await c.from("lift_movimientos_proveedores").delete().eq("id",id);if(error)throw error;
   return ok({balance:await balance(c,m.proveedor_id)});
  }
  if(action==="provider-update"){
   const id=Number(b.id);if(!Number.isFinite(id))throw new Error("Proveedor inválido");
   const patch:any={updated_at:new Date().toISOString()};
   if(Object.prototype.hasOwnProperty.call(b,"celular"))patch.celular=String(b.celular||"").replace(/\D/g,"");
   if(Object.prototype.hasOwnProperty.call(b,"notas"))patch.notas=String(b.notas||"");
   if(Object.prototype.hasOwnProperty.call(b,"nombre")){const nm=String(b.nombre||"").trim();if(!nm)throw new Error("Escribe el nombre");patch.nombre=nm.slice(0,80)}
   if(b.archivar===true){if(await balance(c,id)!==0)throw new Error("Solo puedes archivar proveedores con la cuenta en cero");patch.activo=false}
   const {error}=await c.from("lift_proveedores").update(patch).eq("id",id);if(error)throw error;
   return ok({});
  }
  if(action==="provider-create"){
   const nombre=String(b.nombre||"").trim().slice(0,80);if(!nombre)throw new Error("Escribe el nombre del proveedor");
   const {data:ex}=await c.from("lift_proveedores").select("id,activo").ilike("nombre",nombre).maybeSingle();
   if(ex){if(ex.activo)throw new Error("Ya existe un proveedor con ese nombre");await c.from("lift_proveedores").update({activo:true,updated_at:new Date().toISOString()}).eq("id",ex.id);return ok({id:ex.id,reactivado:true})}
   const {data,error}=await c.from("lift_proveedores").insert({nombre,celular:String(b.celular||"").replace(/\D/g,""),notas:String(b.notas||""),activo:true}).select("id").single();if(error)throw error;
   return ok({id:data.id});
  }
  return new Response(JSON.stringify({error:"Acción no válida"}),{status:400,headers:h});
 }catch(e){return new Response(JSON.stringify({error:e?.message||String(e)}),{status:400,headers:h})}
});
