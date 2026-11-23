import {createClient} from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
function db(){const url=Deno.env.get("SUPABASE_URL")!;const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;return createClient(url,key);}
// Contra entrega con envío previo: en línea solo se cobra el envío; los productos se pagan en efectivo.
function esContraentregaPrevia(p){return Boolean(p.contraentrega_habilitada&&p.contraentrega_elegida&&p.contraentrega_envio_previo&&Number(p.envio)>0);}
function montoEnLinea(p){return esContraentregaPrevia(p)?Number(p.envio):Number(p.total);}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return respond({error:"Método no permitido"},405);
 try{
  const {pedido_id,token,accion="crear",ambiente="test"}=await req.json();
  if(!["test","production"].includes(ambiente))return respond({error:"Ambiente inválido"},400);
  // Diagnóstico de solo lectura: comprueba la autenticación de producción
  // usando un ID de enlace de pruebas; nunca crea enlaces ni modifica pedidos.
  const diagnostic=accion==="validar_credencial_produccion";
  if(ambiente==="production" && !diagnostic && Deno.env.get("BOLD_PRODUCTION_ENABLED")!=="true" && !(Number(pedido_id)===201 && (accion==="crear" || accion==="consultar")))return respond({error:"Pagos reales pendientes de activación segura"},403);
  if(!Number.isSafeInteger(Number(pedido_id))||Number(pedido_id)<=0||typeof token!=="string"||token.length<16)return respond({error:"Datos inválidos"},400);
  const c=db();
  const {data:p,error:pe}=await c.from("lift_pedidos").select("id,total,envio,token_publico,estado_operativo,pago_estado,contraentrega_habilitada,contraentrega_elegida,contraentrega_envio_previo").eq("id",Number(pedido_id)).maybeSingle();
  if(pe||!p||p.token_publico!==token)return respond({error:"Pedido no encontrado"},404);
  const expected=montoEnLinea(p);
  if(diagnostic){
   if(ambiente!=="production")return respond({error:"Ambiente inválido"},400);
   const prodKey=Deno.env.get("BOLD_IDENTITY_KEY");
   if(!prodKey)return respond({diagnostico:"clave_ausente"},503);
   const {data:testLink,error:tlError}=await c.from("lift_bold_pagos").select("bold_link_id").eq("ambiente","test").not("bold_link_id","is",null).order("created_at",{ascending:false}).limit(1).maybeSingle();
   if(tlError||!testLink?.bold_link_id)return respond({diagnostico:"sin_enlace_prueba"},503);
   const res=await fetch("https://integrations.api.bold.co/online/link/v1/"+encodeURIComponent(testLink.bold_link_id),{headers:{"Authorization":"x-api-key "+prodKey}});
   console.info("BOLD_PRODUCTION_KEY_DIAGNOSTIC",{httpStatus:res.status,readOnly:true});
   return respond({diagnostico:res.status===401||res.status===403?"credencial_rechazada":res.status===404?"credencial_posiblemente_valida":res.ok?"respuesta_exitosa_inesperada":"no_concluyente",codigo_http:res.status,solo_lectura:true});
  }
  const {data:existing,error:ee}=await c.from("lift_bold_pagos").select("*").eq("pedido_id",p.id).eq("ambiente",ambiente).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(ee)throw ee;
  const key=Deno.env.get(ambiente==="test"?"BOLD_TEST_IDENTITY_KEY":"BOLD_IDENTITY_KEY");
  if(!key)return respond({error:"No está configurada la llave del ambiente seleccionado"},503);
  if(accion==="consultar"){
   if(!existing?.bold_link_id)return respond({estado:"sin_link"});
   const response=await fetch("https://integrations.api.bold.co/online/link/v1/"+encodeURIComponent(existing.bold_link_id),{headers:{"Authorization":"x-api-key "+key}});
   if(!response.ok)return respond({error:"No se pudo consultar Bold"},502);
   const raw=await response.json();const data=raw.payload||raw;const status=String(data.status||"UNKNOWN").toUpperCase();
   console.info("BOLD_LINK_DIAGNOSTIC",{pedido_id:p.id,status,fields:Object.keys(data).filter(k=>["status","amount","amount_type","payment_link","reference","payments","transactions","currency"].includes(k)),amountFields:data.amount&&typeof data.amount==="object"?Object.keys(data.amount):[],expectedAmount:expected,savedAmount:Number(existing.monto)});
   // La consulta de un enlace debe corresponder al mismo pedido y moneda.
   const referenceOk=typeof data.reference==="string" && data.reference===existing.referencia;
   const currencyOk=data.currency==="COP" || data.amount?.currency==="COP";
   const localAmountOk=Number.isSafeInteger(expected) && expected>0 && Number(existing.monto)===expected;
   const boldAmount=data.amount?.total_amount ?? data.amount?.total;
   const boldAmountOk=boldAmount==null || (Number.isSafeInteger(boldAmount) && boldAmount===expected);
   if(!referenceOk || !currencyOk || !localAmountOk || !boldAmountOk) {
    console.warn("BOLD_LINK_RECONCILIATION_REJECTED",{referenceOk,currencyOk,localAmountOk,boldAmountOk});
    return respond({error:"La respuesta de Bold no coincide con el pedido"},422);
   }
   // En pruebas, PAID solo actualiza el registro simulado, nunca la cartera.
   const nextStatus=ambiente==="test" && status==="PAID" ? "TEST_APPROVED" : status;
   const {error:updateError}=await c.from("lift_bold_pagos").update({estado:nextStatus,updated_at:new Date().toISOString()}).eq("id",existing.id);
   if(updateError)return respond({error:"No se pudo guardar la consulta"},500);
   return respond({estado:nextStatus,modo:ambiente,pagado_simulado:ambiente==="test"&&status==="PAID"});
  }
  if(accion!=="crear")return respond({error:"Acción no válida"},400);
  if(p.estado_operativo!=="pendiente_pago"||p.pago_estado==="aprobado"||p.pago_estado==="contraentrega")return respond({error:"El pedido no está habilitado para pagar"},409);
  const amount=expected;
  if(!Number.isSafeInteger(amount)||amount<1000||amount>5000000)return respond({error:"Monto fuera del rango permitido"},400);
  // Un pago en curso nunca se reemplaza (evita cobros dobles).
  if(existing?.url&&existing.estado==="PROCESSING")return respond({url:existing.url,monto:Number(existing.monto),comision:0,modo:ambiente});
  // Reutilizar el enlace solo si es por el valor ACTUAL del pedido.
  if(existing?.url&&["ACTIVE","creando"].includes(existing.estado)&&Number(existing.monto)===amount)return respond({url:existing.url,monto:amount,comision:0,modo:ambiente});
  if(existing?.id&&["ACTIVE","creando"].includes(existing.estado)&&Number(existing.monto)!==amount){
   await c.from("lift_bold_pagos").update({estado:"REEMPLAZADO",updated_at:new Date().toISOString()}).eq("id",existing.id);
   console.info("BOLD_LINK_REPLACED",{pedido_id:p.id,old:Number(existing.monto),nuevo:amount});
  }
  const referencia="LIFT-"+p.id+"-"+crypto.randomUUID().replaceAll("-","").slice(0,12);
  // Al terminar en Bold el cliente vuelve directo a su pedido (con su token), no a una búsqueda.
  const callback="https://supgo.co/mi-pedido/?pedido="+p.id+"&token="+encodeURIComponent(token)+"&pago=bold";
  const description=esContraentregaPrevia(p)?"Envío pedido SUPGO "+p.id+" (contra entrega)":"Pedido SUPGO "+p.id;
  const body={amount_type:"CLOSE",amount:{currency:"COP",total_amount:amount,tip_amount:0},reference:referencia,description,callback_url:callback};
  const result=await fetch("https://integrations.api.bold.co/online/link/v1",{method:"POST",headers:{"Authorization":"x-api-key "+key,"Content-Type":"application/json"},body:JSON.stringify(body)});
  const response=await result.json().catch(()=>({}));
  if(!result.ok||!response?.payload?.payment_link||!response?.payload?.url)return respond({error:"Bold no generó el enlace",detalle:response?.errors||[]},502);
  const link=response.payload.payment_link,url=response.payload.url;
  if(!/^https:\/\/checkout\.bold\.co\//.test(url))return respond({error:"URL de Bold inválida"},502);
  const {error:se}=await c.from("lift_bold_pagos").insert({pedido_id:p.id,bold_link_id:link,url,referencia,monto:amount,estado:"ACTIVE",ambiente});
  if(se)throw se;
  return respond({url,monto:amount,comision:0,modo:"pruebas"});
 }catch(e){return respond({error:"No fue posible preparar el pago de prueba"},500);}
});
