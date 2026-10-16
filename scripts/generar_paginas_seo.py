#!/usr/bin/env python3
"""Genera fichas SEO estáticas desde Supabase. No elimina páginas existentes."""
import os, json, re, html, urllib.request, urllib.parse, pathlib, unicodedata
from datetime import datetime, timezone
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/"productos"
BASE="https://supgo.co"
URL=os.getenv("SUPABASE_URL","https://vdxkknftyssjyfbdieqa.supabase.co").rstrip("/")
KEY=os.getenv("SUPABASE_ANON_KEY","sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh")
def slug(s):
 s=unicodedata.normalize("NFKD",str(s or "")).encode("ascii","ignore").decode().lower()
 return re.sub(r"(^-|-$)","",re.sub(r"[^a-z0-9]+","-",s))[:110]
def esc(v): return html.escape(str(v or ""),quote=True)
def fetch():
 rows=[]
 for offset in range(0,100000,500):
  query=urllib.parse.urlencode({"select":"id,product,activo","order":"id.asc","limit":"500","offset":str(offset)})
  req=urllib.request.Request(URL+"/rest/v1/lift_productos?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
  with urllib.request.urlopen(req,timeout=40) as res: batch=json.load(res)
  rows+=batch
  if len(batch)<500: break
 return rows
def fetch_seo():
 """Lee SEO editable desde la tabla de Supabase; los campos vacíos usan valores automáticos."""
 result={}
 for offset in range(0,100000,500):
  query=urllib.parse.urlencode({"select":"producto_id,titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo","limit":"500","offset":str(offset)})
  req=urllib.request.Request(URL+"/rest/v1/lift_producto_seo?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
  with urllib.request.urlopen(req,timeout=40) as res: batch=json.load(res)
  for item in batch: result[str(item["producto_id"])]=item
  if len(batch)<500:break
 return result

def fetch_offers():
 query=urllib.parse.urlencode({"select":"valor","clave":"eq.weekly_offers","limit":"1"})
 req=urllib.request.Request(URL+"/rest/v1/lift_catalog_config?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
 with urllib.request.urlopen(req,timeout=40) as res: rows=json.load(res)
 value=rows[0].get("valor") if rows else {}
 if isinstance(value,str):value=json.loads(value)
 return value if isinstance(value,dict) else {}

def active_offer(row):
 o=row.get("_offer")
 if not isinstance(o,dict):return None
 until=o.get("promoUntil")
 if until:
  try:
   expiry=datetime.fromisoformat(str(until).replace("Z","+00:00"))
   if expiry.tzinfo is None:expiry=expiry.replace(tzinfo=timezone.utc)
   if datetime.now(timezone.utc)>expiry:return None
  except ValueError:pass
 try:
  base=float(row["product"].get("price") or row["product"].get("precio") or 0)
  sale=float(o.get("price"))
  if sale<=0 or base<=sale:return None
 except (TypeError,ValueError):return None
 return base,sale

def fetch_allowed_brands():
 """La selección de marcas se administra en Supabase."""
 result=set()
 for offset in range(0,100000,500):
  query=urllib.parse.urlencode({"select":"marca,habilitada","limit":"500","offset":str(offset)})
  req=urllib.request.Request(URL+"/rest/v1/lift_seo_marcas?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
  with urllib.request.urlopen(req,timeout=40) as res: batch=json.load(res)
  for item in batch:
   if item.get("habilitada") is True: result.add(str(item["marca"]).strip().casefold())
  if len(batch)<500:break
 if not result:raise RuntimeError("No hay marcas SEO habilitadas en Supabase")
 return result

def allowed(row):
 p=row.get("product")
 if not isinstance(p,dict) or not (p.get("name") or p.get("nombre")):return False
 if row.get("activo") is False or p.get("__deleted") or p.get("__private") or p.get("adminOnly") or p.get("hidden") or p.get("oculto"):return False
 return True
def build(row):
 p=row["product"]; seo_data=row.get("_seo") or {}; name=str(p.get("name") or p.get("nombre")); pid=row["id"]
 key=slug(name) or "producto"; filename=f"{key}-{pid}.html"
 canonical=f"{BASE}/productos/{filename}"
 brand=str(p.get("brand") or p.get("marca") or "")
 description=str(p.get("description") or p.get("descripcion") or "").strip()
 image=str(seo_data.get("imagen_seo") or p.get("image") or p.get("imagen") or "").strip()
 if image.startswith("//"):image="https:"+image
 elif image.startswith("/"):image=BASE+image
 elif image and not image.startswith(("https://","http://")):image=""
 price=p.get("price",p.get("precio"))
 promotion=active_offer(row)
 try: amount=float(price); valid_price=amount>0
 except (ValueError,TypeError):valid_price=False;amount=0
 title=str(seo_data.get("titulo_seo") or (name+" | Lift Nutrientes"))[:140]
 meta=str(seo_data.get("meta_descripcion") or description or f"Consulta {name} de {brand} en Lift Nutrientes. Presentaciones, precio y disponibilidad en Colombia.")[:160]
 product_schema={"@context":"https://schema.org","@type":"Product","name":name,"url":canonical,"sku":str(pid)}
 if brand:product_schema["brand"]={"@type":"Brand","name":brand}
 if image:product_schema["image"]=[image]
 if description or seo_data.get("meta_descripcion"):product_schema["description"]=description or str(seo_data["meta_descripcion"])
 # Datos estructurados verificables: no inventar stock, reseñas ni identificadores.
 for source,target in (("gtin13","gtin13"),("gtin12","gtin12"),("gtin14","gtin14"),("mpn","mpn")):
  value=p.get(source)
  if value: product_schema[target]=str(value).strip()
 if promotion:amount=promotion[1]
 if valid_price:
  offer={"@type":"Offer","url":canonical,"priceCurrency":"COP","price":int(amount) if amount.is_integer() else amount,"seller":{"@type":"Organization","name":"Lift Nutrientes","url":BASE}}
  stock=p.get("stock")
  if stock is True or (isinstance(stock,(int,float)) and not isinstance(stock,bool) and stock>0):
   offer["availability"]="https://schema.org/InStock"
  elif stock is False or (isinstance(stock,(int,float)) and not isinstance(stock,bool) and stock==0):
   offer["availability"]="https://schema.org/OutOfStock"
  elif str(p.get("availability") or "").lower() in ("instock","in_stock","disponible"):
   offer["availability"]="https://schema.org/InStock"
  elif str(p.get("availability") or "").lower() in ("outofstock","out_of_stock","agotado"):
   offer["availability"]="https://schema.org/OutOfStock"
  product_schema["offers"]=offer
 schema=json.dumps(product_schema,ensure_ascii=False).replace("<","\\u003c")
 # SEO legible incluso si falla JavaScript. La experiencia interactiva se abre en el catálogo.
 img=f'<img src="{esc(image)}" alt="{esc(name)}" loading="eager" width="420" style="width:100%;max-height:430px;object-fit:contain">' if image else ""
 price_html=f'<p class="price">$ {int(amount):,}</p>'.replace(",","\u002e") if valid_price else "<p>Consultar precio</p>"
 if promotion:
  original=("$ {:,.0f}".format(promotion[0])).replace(",",".")
  discounted=("$ {:,.0f}".format(promotion[1])).replace(",",".")
  price_html='<p><del style="color:#777;margin-right:12px">'+original+'</del><strong style="color:#168451;font-size:26px">'+discounted+'</strong></p>'
 return filename, f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(meta)}">
<link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="product">
<meta property="og:title" content="{esc(name)}"><meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:site_name" content="Lift Nutrientes"><meta property="og:locale" content="es_CO">
{f'<meta property="og:image" content="{esc(image)}"><meta property="og:image:alt" content="{esc(name)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{esc(image)}">' if image else '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="{esc(name)}"><meta name="twitter:description" content="{esc(meta)}">
{f'<meta property="product:price:amount" content="{amount:g}"><meta property="product:price:currency" content="COP">' if valid_price else ''}
<script type="application/ld+json">{schema}</script>
<style>body{{margin:0;color:#151515;background:#fff;font-family:Poppins,Arial,sans-serif}}header{{background:#090909;color:white;padding:20px 5%}}header a{{color:white;text-decoration:none;font-weight:700}}nav{{padding:16px 5%;border-bottom:1px solid #ddd;display:flex;gap:20px;flex-wrap:wrap}}nav a{{color:#222;text-decoration:none}}main{{max-width:1150px;margin:35px auto;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:35px}}h1{{font-size:30px}}.price{{font-size:26px;font-weight:bold}}.btn{{display:inline-block;background:#111;color:white;padding:14px 20px;text-decoration:none;margin:8px 8px 8px 0}}footer{{padding:35px 5%;border-top:1px solid #ddd}}@media(max-width:700px){{main{{grid-template-columns:1fr}}}}</style>
</head><body><header><a href="{BASE}/">LIFT NUTRIENTES</a></header>
<nav><a href="{BASE}/">Inicio</a><a href="{BASE}/?ofertas=1">Ofertas</a><a href="{BASE}/?categoria={urllib.parse.quote(str(p.get('category') or ''))}">Categoría: {esc(p.get('category') or 'Ver todas')}</a><a href="{BASE}/?marca={urllib.parse.quote(brand)}">Laboratorio: {esc(brand or 'Ver todos')}</a></nav>
<main><section>{img}</section><section><p>{esc(brand)}</p><h1>{esc(name)}</h1>{price_html}
<p>{esc(description or "Consulta presentaciones, sabores y disponibilidad de este producto.")}</p>
<a class="btn" href="{BASE}/?producto={pid}">Ver opciones y agregar al carrito</a>
<a class="btn" href="{BASE}/?ofertas=1">Ver ofertas</a></section></main>
<footer>Lift Nutrientes · <a href="{BASE}/">supgo.co</a></footer></body></html>'''

def build_direct(row, shared):
 """Ficha individual real, sin iframe, basada en el index y sus controles."""
 filename, seo=build(row)
 pid=str(row["id"])
 name=str(row["product"].get("name") or row["product"].get("nombre"))
 head_meta=seo.split("<head>",1)[1].split("</head>",1)[0]
 head_meta=re.sub(r"<style>.*?</style>","",head_meta,flags=re.S)
 head_meta=re.sub(r"<script type=\"application/ld\\+json\">",'<script type="application/ld+json">',head_meta)
 # Quitar metadatos sociales genéricos del catálogo para que el bot encuentre
 # una sola imagen, título y URL correspondientes al producto compartido.
 page=re.sub(r'<meta\\b(?=[^>]*(?:property|name)\\s*=\\s*["\\'](?:og:[^"\\']+|twitter:[^"\\']+|description)["\\'])[^>]*>', '', shared, flags=re.I)
 page=re.sub(r'<link\\b(?=[^>]*rel\\s*=\\s*["\\']canonical["\\'])[^>]*>', '', page, flags=re.I)
 page=page.replace("</head>",head_meta+"</head>",1)
 page=page.replace("</body>",'''
<style id="lift-seo-direct-layout">
body.liftIndividualPage .layout{align-items:start!important;min-height:0!important}
body.liftIndividualPage .sidebar{display:block!important;position:sticky!important;top:76px!important;align-self:start!important;height:calc(100vh - 90px)!important;max-height:calc(100vh - 90px)!important;overflow-y:auto!important;overscroll-behavior:contain!important}
body.liftIndividualPage .content{min-width:0!important;padding:10px 14px 35px!important}
body.liftIndividualPage .content > :not(#liftMonoOff):not(#liftIndividualStatus){display:none!important}
body.liftIndividualPage #liftMonoBackdrop{display:none!important}
body.liftIndividualPage #liftMonoOff,body.liftIndividualPage #liftMonoOff.open{position:relative!important;inset:auto!important;transform:none!important;opacity:1!important;visibility:visible!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;box-shadow:none!important;border:0!important;overflow:visible!important;display:block!important}
body.liftIndividualPage #liftMonoBody{height:auto!important;max-height:none!important;overflow:visible!important;padding:0!important}
body.liftIndividualPage #liftMonoClose,body.liftIndividualPage .liftMonoPageLink{display:none!important}
body.liftIndividualPage .liftMonoBody{padding:16px!important}
body.liftIndividualPage{overflow-x:hidden!important;overflow-y:auto!important}
body.liftIndividualPage .top{position:sticky!important;top:0!important;z-index:1000!important}
body.liftIndividualPage .layout{position:relative!important;z-index:1!important}
body.liftIndividualPage .content{position:relative!important;z-index:1!important;overflow:visible!important}
body.liftIndividualPage #liftMonoOff,body.liftIndividualPage #liftMonoOff.open{z-index:1!important;isolation:isolate!important;pointer-events:auto!important}
body.liftIndividualPage #liftMonoBody{position:static!important;overscroll-behavior:auto!important}
body.liftIndividualPage .liftMonoBtns{position:relative!important;bottom:auto!important}
body.liftIndividualPage .sidebar{z-index:2!important}
body.liftIndividualPage .sidebar .filterItem,body.liftIndividualPage .sidebar button{pointer-events:auto!important}
body.liftIndividualPage .searchResults{z-index:1100!important}

/* El carrito es un panel global: debe quedar por encima del encabezado sticky. */
body.liftIndividualPage .overlay,
body.liftIndividualPage #overlay,
body.liftIndividualPage .off.right,
body.liftIndividualPage .off.left,
body.liftIndividualPage #cartOff,
body.liftIndividualPage #cartOverlay,
body.liftIndividualPage .cartDrawer,
body.liftIndividualPage .cartBackdrop{z-index:2100!important}
body.liftIndividualPage .checkoutModal,
body.liftIndividualPage #checkoutModal{z-index:2200!important}

/* La ficha es una página, no un modal: sin botón de cerrar ni tirador superior. */
body.liftIndividualPage #liftMonoClose,
body.liftIndividualPage .liftMonoClose,
body.liftIndividualPage #liftMonoOff .liftMonoClose,
body.liftIndividualPage #liftMonoOff [aria-label="Cerrar"],
body.liftIndividualPage #liftMonoOff .liftMonoHandle,
body.liftIndividualPage #liftMonoOff .liftMonoDragHandle{display:none!important}
body.liftIndividualPage .top .cartDesktop{display:flex!important;visibility:visible!important;opacity:1!important}
@media(max-width:760px){
 body.liftIndividualPage .top .bar .cartDesktop{display:flex!important;visibility:visible!important;opacity:1!important;order:4!important;min-width:42px!important;min-height:40px!important;padding:0 10px!important}
 body.liftIndividualPage .top .search{order:5!important;flex-basis:100%!important}
 body.liftIndividualPage #liftMonoOff .liftMonoNav{z-index:2!important}
}


@media(max-width:760px){body.liftIndividualPage .layout{display:block!important}body.liftIndividualPage .sidebar{display:none!important}body.liftIndividualPage .content{padding:6px!important}body.liftIndividualPage .liftMonoBody{padding:12px!important}}
</style>
<script id="lift-seo-direct-init">
(function(){
 const ID=__LIFT_ID__;
 function init(){
  document.body.classList.add('liftIndividualPage');
  const main=document.querySelector('.content');
  if(!main)return;
  const status=document.createElement('p');
  status.id='liftIndividualStatus';status.textContent='Cargando ficha del producto…';main.prepend(status);
  let tries=0;
  const timer=setInterval(function(){
   const product=(window.PRODUCTS||[]).find(p=>String(p.id)===String(ID));
   if(product&&typeof window.openLiftProductById==='function'){
    // Esperar a que Supabase termine de cargar los grupos de sabores.
    // No abrir prematuramente una ficha aislada si pertenece a un grupo.
    const group=typeof window.liftGroupByProductId==='function'?window.liftGroupByProductId(ID):null;
    const groupsReady=typeof window.liftGroupByProductId==='function';
    if(!groupsReady&&tries<50)return;
    if(group&&typeof window.liftGroupVariants==='function'){
     const variants=window.liftGroupVariants(group)||[];
     const selected=variants.find(v=>String(v.id)===String(ID)||String(v.producto_id)===String(ID)||String(v.productId)===String(ID));
     if(selected){
      window.LIFT_SELECTED_GROUP_VARIANT=window.LIFT_SELECTED_GROUP_VARIANT||{};
      window.LIFT_SELECTED_GROUP_VARIANT[String(group.id)]=String(selected.id);
     }
    }
    window.openLiftProductById(ID);
    const panel=document.getElementById('liftMonoOff');
    if(panel){
     clearInterval(timer);main.appendChild(panel);panel.classList.add('open');
     document.querySelectorAll('#liftMonoBackdrop,.liftMonoOverlay,#liftMonoOverlay').forEach(el=>el.classList.remove('open','show'));
     document.body.style.overflow='';status.remove();
     panel.querySelectorAll('#liftMonoClose,.liftMonoClose,.liftMonoHandle,.liftMonoDragHandle,[aria-label="Cerrar"]').forEach(x=>x.remove());
     document.querySelectorAll('.top .cartDesktop').forEach(x=>{x.style.setProperty('display','flex','important');x.style.setProperty('visibility','visible','important');});
     
    }
   }
   if(++tries>120){clearInterval(timer);status.innerHTML='No se pudo cargar la ficha. <a href="https://supgo.co/?producto='+ID+'">Abrir en el catálogo</a>';}
  },200);
  function goHome(type,value){
   const u=new URL('https://supgo.co/');
   if(type&&value)u.searchParams.set(type,String(value));
   window.location.assign(u.toString());
  }
  function selectedFilter(el){
   const button=el.closest('[onclick]');
   const code=button?.getAttribute('onclick')||'';
   const match=code.match(/(?:setBrand|setCat|selectLaboratoryVisual)\\s*\\(\\s*(['"])(.*?)\\1\\s*\\)/);
   if(match)return {type:/setCat/.test(code)?'categoria':'marca',value:match[2]};
   const label=button?.querySelector('span')?.textContent?.trim()||button?.textContent?.trim();
   if(button?.classList.contains('filterItem')&&label)return {type:button.closest('#catList,#categoriesList')?'categoria':'marca',value:label};
   return null;
  }
  document.addEventListener('click',function(e){
   const el=e.target.closest('button,a,[role="button"],.brand,.filterItem,.labVisualCard,.labCard,.categoryCard');
   if(!el)return;
   const sidebar=el.closest('.sidebar');
   if(sidebar){
    if(el.closest('input,.searchInput')||el.matches('input'))return;
    const selected=selectedFilter(el);
    if(!selected)return;
    e.preventDefault();e.stopImmediatePropagation();goHome(selected.type,selected.value);return;
   }
   if(el.closest('.labVisualCard,.categoryCard')&&!el.closest('.sidebar')){
    const selected=selectedFilter(el);
    if(selected){e.preventDefault();e.stopImmediatePropagation();goHome(selected.type,selected.value);return;}
   }
   if(el.closest('.top')){
    const cls=(el.className?.baseVal||el.className||'').toString();
    const label=(el.textContent||'').trim();
    const isLogo=!!el.closest('.brand')||/logo/i.test(cls);
    const isOffers=/offersBtn/i.test(cls)||/ofertas/i.test(label);
    if(isLogo||isOffers){e.preventDefault();e.stopImmediatePropagation();goHome();return;}
   }
  },true);
  document.addEventListener('keydown',function(e){
   if(e.key!=='Enter')return;
   const input=e.target.closest('.top input[type="search"],.top .search input');
   if(input&&input.value.trim()){e.preventDefault();e.stopImmediatePropagation();goHome();}
  },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
</script></body>'''.replace('__LIFT_ID__',pid),1)
 page=re.sub(r'<title>.*?</title>', '',page,count=1,flags=re.S)
 return filename,page

def shared_template():
 source=(ROOT/"index.html").read_text(encoding="utf-8")
 # Extrae scripts y estilos a archivos compartidos, sin cambiar su orden de ejecución.
 assets=ROOT/"productos-assets";assets.mkdir(exist_ok=True)
 import hashlib
 def externalize(match):
  tag,body,closing=match.group(1),match.group(2),match.group(3)
  if not body.strip():return match.group(0)
  kind="js" if tag.lower().startswith("<script") else "css"
  if kind=="js" and ("src=" in tag.lower() or "application/ld+json" in tag.lower()):return match.group(0)
  digest=hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]
  name=f"shared-{digest}.{kind}"
  (assets/name).write_text(body,encoding="utf-8")
  if kind=="css":return '<link rel="stylesheet" href="/productos-assets/'+name+'">'
  return '<script src="/productos-assets/'+name+'"></script>'
 return re.sub(r'(<script\\b[^>]*>|<style\\b[^>]*>)(.*?)(</script>|</style>)',externalize,source,flags=re.S|re.I)

def main():
 rows=fetch()
 seo_rows=fetch_seo()
 offers=fetch_offers()
 for row in rows:
  row["_seo"]=seo_rows.get(str(row["id"]),{})
  row["_offer"]=offers.get(str(row["id"]))
 allowed_brands=fetch_allowed_brands()
 valid=[r for r in rows if allowed(r) and str((r["product"].get("brand") or r["product"].get("marca") or "SIN MARCA")).strip().casefold() in allowed_brands]
 brand_only=os.getenv("SEO_BRAND_ONLY","").strip().casefold()
 if brand_only:
  if brand_only not in allowed_brands:raise RuntimeError("Marca no habilitada para SEO: "+brand_only)
  valid=[r for r in valid if str((r["product"].get("brand") or r["product"].get("marca") or "")).strip().casefold()==brand_only]
 preview_id=os.getenv("SEO_PREVIEW_ID","").strip()
 if preview_id:
  valid=[r for r in valid if str(r["id"])==preview_id]
  if not valid: raise RuntimeError("Producto de prueba no encontrado: "+preview_id)
 if not valid: raise RuntimeError("No hay productos validos para generar")
 OUT.mkdir(exist_ok=True)
 shared=shared_template()
 urls=[]
 for row in valid:
  filename,content=build_direct(row,shared)
  (OUT/filename).write_text(content,encoding="utf-8")
  urls.append(BASE+"/productos/"+filename)
 sitemap='<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'+''.join("<url><loc>"+esc(u)+"</loc></url>\\n" for u in urls)+"</urlset>\\n"
 if not preview_id and not brand_only: (ROOT/"sitemap-productos.xml").write_text(sitemap,encoding="utf-8")
 print("Generadas",len(urls),"fichas completas sin iframe con recursos compartidos.")
if __name__=="__main__": main()
