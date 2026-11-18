import {createClient} from "npm:@supabase/supabase-js@2";
let __adminHashCache=null;
async function adminHash(){if(__adminHashCache&&Date.now()-__adminHashCache.t<60000)return __adminHashCache.h;const k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;const {data,error}=await createClient(Deno.env.get("SUPABASE_URL"),k,{auth:{persistSession:false}}).rpc("lift_admin_hash");if(error||!/^[0-9a-f]{64}$/.test(String(data||"")))throw new Error("No se pudo validar la clave de administración");__adminHashCache={h:String(data),t:Date.now()};return __adminHashCache.h}
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{...cors,"Content-Type":"application/json"}});
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
// Catálogos de proveedores: PDF o imágenes (JPG, PNG, WebP, HEIC).
const EXT=/\.(pdf|jpe?g|png|webp|heic|heif)$/i;
const extOf=(name)=>{const m=String(name||"").toLowerCase().match(EXT);return m?(m[1]==="jpeg"?"jpg":m[1]):""};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 try{
  const b=await req.json();
  if(await sha(String(b.password||""))!==await adminHash())return reply({error:"No autorizado"},403);
  const db=createClient(Deno.env.get("SUPABASE_URL"),Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false}});
  const bucket=db.storage.from("lift-catalogos-proveedores");
  const action=String(b.action||"");
  if(action==="list"){
   const {data,error}=await db.from("lift_catalogos_proveedores").select("id,nombre,archivo_nombre,actualizado_en").order("nombre");
   if(error)throw error;
   const {data:links,error:le}=await db.from("lift_enlaces_proveedores").select("id,nombre,titulo,url,creado_en").order("creado_en",{ascending:false});
   if(le)throw le;
   const {data:providers,error:pe}=await db.from("lift_proveedores").select("id,nombre").order("nombre");
   if(pe)throw pe;
   return reply({catalogos:data||[],enlaces:links||[],proveedores:providers||[]});
  }
  const nombre=String(b.nombre||"").trim().slice(0,100);
  if(!nombre)throw Error("Falta proveedor");
  if(action==="create_provider"){
   if(nombre.length<2)return reply({error:"Nombre demasiado corto"},400);
   const {data:existing,error:ee}=await db.from("lift_proveedores").select("id,nombre");
   if(ee)throw ee;
   if((existing||[]).some(x=>x.nombre.trim().toLowerCase()===nombre.toLowerCase()))return reply({error:"El proveedor ya existe"},409);
   const {data,error}=await db.from("lift_proveedores").insert({nombre}).select("id,nombre").single();
   if(error)throw error;
   return reply({ok:true,proveedor:data});
  }
  if(action==="add_link"){
   const titulo=String(b.titulo||"").trim().slice(0,150);
   const url=String(b.url||"").trim();
   let parsed;try{parsed=new URL(url)}catch{return reply({error:"Enlace inválido"},400)}
   if(parsed.protocol!=="https:"||!titulo||url.length>2048||parsed.username||parsed.password)return reply({error:"Escribe un título y enlace HTTPS válido"},400);
   const {data,error}=await db.from("lift_enlaces_proveedores").insert({nombre,titulo,url}).select().single();
   if(error)throw error;
   return reply({ok:true,enlace:data});
  }
  if(action==="delete_link"){
   const {data,error}=await db.from("lift_enlaces_proveedores").delete().eq("id",String(b.id||"")).eq("nombre",nombre).select("id");
   if(error)throw error;
   if(!data?.length)return reply({error:"Enlace no encontrado"},404);
   return reply({ok:true});
  }
  if(action==="upload"){
   const ext=extOf(b.archivo_nombre||"catalogo.pdf");
   if(!ext)throw Error("Solo PDF o imágenes (JPG, PNG, WebP)");
   const path="proveedores/"+(await sha(nombre.toLowerCase()))+"/"+crypto.randomUUID()+"."+ext;
   const {data,error}=await bucket.createSignedUploadUrl(path);
   if(error)throw error;
   return reply({path,token:data.token,upload_url:data.signedUrl});
  }
  if(action==="save"){
   const path=String(b.path||"");
   if(!path.startsWith("proveedores/"+await sha(nombre.toLowerCase())+"/")||!EXT.test(path))throw Error("Ruta inválida");
   const {error}=await db.from("lift_catalogos_proveedores").insert({nombre,archivo_path:path,archivo_nombre:String(b.archivo_nombre||"Catalogo.pdf").slice(0,200),actualizado_en:new Date().toISOString()});
   if(error)throw error;
   return reply({ok:true});
  }
  if(action==="open"){
   const {data:row,error:e}=await db.from("lift_catalogos_proveedores").select("archivo_path").eq("id",String(b.id||"")).eq("nombre",nombre).maybeSingle();
   if(e)throw e;
   if(!row)return reply({error:"Sin archivo"},404);
   const {data,error}=await bucket.createSignedUrl(row.archivo_path,300);
   if(error)throw error;
   return reply({url:data.signedUrl});
  }
  if(action==="delete"){
   const docid=String(b.id||"");
   const {data:row,error:e}=await db.from("lift_catalogos_proveedores").select("archivo_path").eq("id",docid).eq("nombre",nombre).maybeSingle();
   if(e)throw e;
   if(!row)return reply({error:"Documento no encontrado"},404);
   const {error:de}=await db.from("lift_catalogos_proveedores").delete().eq("id",docid).eq("nombre",nombre);
   if(de)throw de;
   const {error:se}=await bucket.remove([row.archivo_path]);
   if(se)console.error("storage-remove",se.message);
   return reply({ok:true});
  }
  return reply({error:"Acción desconocida"},400);
 }catch(e){return reply({error:String(e.message||e)},400)}
});
