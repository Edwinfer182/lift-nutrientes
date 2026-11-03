import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, OPTIONS"};
const MAX=12*1024*1024;

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:CORS});
 if(req.method!=="GET") return new Response("Method not allowed",{status:405,headers:CORS});
 try{
  const u=new URL(req.url), source=u.searchParams.get("url");
  if(!source) return new Response("Missing url",{status:400,headers:CORS});
  let parsed:URL; try{parsed=new URL(source)}catch{return new Response("Invalid url",{status:400,headers:CORS})}
  if(parsed.protocol!=="https:") return new Response("Only HTTPS images are allowed",{status:400,headers:CORS});

  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Seguridad: el proxy solo acepta URLs que realmente estén registradas en el catálogo:
  // imágenes principales, JSON product, variantes, grupos, imágenes secundarias
  // y productos privados (solo admin, pero sus fotos aparecen en las imágenes de pedidos).
  const [main,productJson,variant,extra,group,privateJson]=await Promise.all([
   sb.from("lift_productos").select("id").eq("imagen",source).limit(1),
   sb.from("lift_productos").select("id").contains("product",{image:source}).limit(1),
   sb.from("lift_producto_variantes").select("id").eq("imagen",source).limit(1),
   sb.from("lift_producto_imagenes").select("id").eq("imagen_url",source).limit(1),
   sb.from("lift_producto_grupos").select("id").eq("imagen",source).limit(1),
   sb.from("lift_private_productos").select("id").contains("product",{image:source}).limit(1)
  ]);
  const allowed=[main,productJson,variant,extra,group,privateJson].some(x=>!x.error && x.data && x.data.length);
  if(!allowed) return new Response("Image is not registered in catalog",{status:403,headers:CORS});

  const upstream=await fetch(source,{headers:{
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
    "Accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Referer":parsed.origin+"/"
  },redirect:"follow"});
  if(!upstream.ok) return new Response("Upstream image failed: "+upstream.status,{status:502,headers:CORS});
  const ct=(upstream.headers.get("content-type")||"").toLowerCase();
  if(!ct.startsWith("image/")) return new Response("Upstream did not return an image",{status:502,headers:CORS});
  const len=Number(upstream.headers.get("content-length")||0);
  if(len>MAX) return new Response("Image too large",{status:413,headers:CORS});
  const bytes=await upstream.arrayBuffer();
  if(bytes.byteLength>MAX) return new Response("Image too large",{status:413,headers:CORS});
  return new Response(bytes,{headers:{...CORS,"Content-Type":ct,"Cache-Control":"public, max-age=604800, s-maxage=604800","X-Content-Type-Options":"nosniff"}});
 }catch(e){console.error(e);return new Response("Unexpected error",{status:500,headers:CORS})}
});
