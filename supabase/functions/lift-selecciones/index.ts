import { createClient } from "npm:@supabase/supabase-js@2.58.0";
const cors={"Access-Control-Allow-Origin":"https://supgo.co","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"content-type, apikey, authorization","Vary":"Origin"};
const headers={...cors,"Content-Type":"application/json","Cache-Control":"no-store"};
const OWNER_ACCOUNT_ID=1;
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers})}
function client(){
 const url=Deno.env.get("SUPABASE_URL");
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 if(!url||!secret)throw Error("Configuración de servidor incompleta");
 return createClient(url,secret,{auth:{persistSession:false}});
}
async function owner(db,token){
 if(typeof token!=="string"||!/^[0-9a-f]{64}$/.test(token))return false;
 const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))].map(b=>b.toString(16).padStart(2,"0")).join("");
 const {data,error}=await db.from("lift_cuenta_sesiones").select("cuenta_id,expira_en").eq("token_hash",hash).gt("expira_en",new Date().toISOString()).maybeSingle();
 if(error)throw error;
 return Number(data?.cuenta_id)===OWNER_ACCOUNT_ID;
}
function randomToken(){
 const bytes=new Uint8Array(9);crypto.getRandomValues(bytes);
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(request.method!=="POST")return reply({error:"Método no permitido"},405);
 try{
   const b=await request.json().catch(()=>({}));
   const action=String(b.action||"");
   const db=client();
   if(action==="get"){
     const token=String(b.token||"");
     if(!/^[A-Za-z0-9_-]{12}$/.test(token))return reply({error:"Selección no encontrada"},404);
     const {data,error}=await db.from("lift_selecciones_rapidas").select("productos,expira_en").eq("token",token).gt("expira_en",new Date().toISOString()).maybeSingle();
     if(error)throw error;
     if(!data)return reply({error:"Selección no disponible o vencida"},404);
     return reply({productos:data.productos||[]});
   }
   if(action==="can-create")return reply({canCreate:await owner(db,b.session_token)});
   if(action!=="create")return reply({error:"Acción no válida"},400);
   if(!await owner(db,b.session_token))return reply({error:"No tienes autorización para crear selecciones"},403);
   const raw=Array.isArray(b.productos)?b.productos:[];
   if(raw.length<1||raw.length>25)return reply({error:"Selecciona entre 1 y 25 productos"},400);
   const ids=[...new Set(raw.map(Number))];
   if(ids.length<1||ids.length>25||ids.some(id=>!Number.isSafeInteger(id)||id<=0))return reply({error:"Productos inválidos"},400);
   const {data:found,error:findError}=await db.from("lift_productos").select("id,activo,slug,product").in("id",ids);
   if(findError)throw findError;
   const allowed=(found||[]).filter(r=>{
      const p=r.product||{};
      return r.activo===true && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(r.slug||"")) &&
        !p.__deleted&&!p.__private&&!p.adminOnly&&!p.hidden&&!p.oculto&&p.visibility!=="admin" &&
        !!String(p.name||p.nombre||"").trim() && !["venom-pharma","lift-nutrientes"].includes(String(p.brand||p.marca||"").trim().toLowerCase().replace(/\s+/g,"-"));
   });
   if(allowed.length!==ids.length)return reply({error:"Algún producto está oculto, inactivo o no existe"},400);
   const since=new Date(Date.now()-86400000).toISOString();
   const {count,error:countError}=await db.from("lift_selecciones_rapidas").select("token",{head:true,count:"exact"}).eq("cuenta_id",OWNER_ACCOUNT_ID).gte("creado_en",since);
   if(countError)throw countError;
   if((count||0)>=40)return reply({error:"Has alcanzado el máximo de selecciones por hoy"},429);
   for(let i=0;i<3;i++){
      const token=randomToken();
      const {error}=await db.from("lift_selecciones_rapidas").insert({token,cuenta_id:OWNER_ACCOUNT_ID,productos:ids});
      if(!error)return reply({url:"https://supgo.co/s/"+token,token});
      if(error.code!=="23505")throw error;
   }
   return reply({error:"No pudimos generar el enlace. Inténtalo de nuevo"},500);
 }catch(e){console.error("lift-selecciones",String(e));return reply({error:"Ocurrió un error. Inténtalo nuevamente"},500)}
});