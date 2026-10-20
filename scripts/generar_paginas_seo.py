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
def seo_plain(v):
 return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', ' ', str(v or '')))).strip()
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

def fetch_merchant_settings():
 """Configuración comercial SEO opcional en lift_catalog_config: seo_merchant_settings."""
 query=urllib.parse.urlencode({"select":"valor","clave":"eq.seo_merchant_settings","limit":"1"})
 req=urllib.request.Request(URL+"/rest/v1/lift_catalog_config?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
 with urllib.request.urlopen(req,timeout=40) as res: rows=json.load(res)
 value=rows[0].get("valor") if rows else {}
 if isinstance(value,str):value=json.loads(value)
 return value if isinstance(value,dict) else {}

def merchant_policy(offer, settings):
 """No publicar tiempos, tarifas o plazos de devolución sin configuración comprobada."""
 shipping=settings.get("shipping")
 if isinstance(shipping,list):
  details=[]
  for entry in shipping:
   if not isinstance(entry,dict):continue
   country=str(entry.get("country") or "").strip()
   currency=str(entry.get("currency") or "COP").strip()
   cost=entry.get("cost")
   if not country or not currency or cost is None:continue
   try: cost=float(cost)
   except (TypeError,ValueError):continue
   if cost<0:continue
   delivery={"@type":"OfferShippingDetails","shippingRate":{"@type":"MonetaryAmount","value":cost,"currency":currency},"shippingDestination":{"@type":"DefinedRegion","addressCountry":country}}
   region=entry.get("region")
   if region:delivery["shippingDestination"]["addressRegion"]=region
   handling=entry.get("handling_days")
   transit=entry.get("transit_days")
   if isinstance(handling,list) and len(handling)==2 and all(isinstance(n,int) and n>=0 for n in handling):
    delivery.setdefault("deliveryTime",{"@type":"ShippingDeliveryTime"})["handlingTime"]={"@type":"QuantitativeValue","minValue":handling[0],"maxValue":handling[1],"unitCode":"DAY"}
   if isinstance(transit,list) and len(transit)==2 and all(isinstance(n,int) and n>=0 for n in transit):
    delivery.setdefault("deliveryTime",{"@type":"ShippingDeliveryTime"})["transitTime"]={"@type":"QuantitativeValue","minValue":transit[0],"maxValue":transit[1],"unitCode":"DAY"}
   details.append(delivery)
  if details:offer["shippingDetails"]=details
 returns=settings.get("returns")
 if isinstance(returns,dict) and returns.get("country") and returns.get("category"):
  valid_categories={"https://schema.org/MerchantReturnFiniteReturnWindow","https://schema.org/MerchantReturnNotPermitted","https://schema.org/MerchantReturnUnlimitedWindow"}
  if returns["category"] in valid_categories:
   policy={"@type":"MerchantReturnPolicy","applicableCountry":returns["country"],"returnPolicyCategory":returns["category"]}
   if returns["category"].endswith("FiniteReturnWindow") and isinstance(returns.get("days"),int) and returns["days"]>=0:
    policy["merchantReturnDays"]=returns["days"]
   if returns.get("method") in ("https://schema.org/ReturnByMail","https://schema.org/ReturnInStore","https://schema.org/ReturnAtKiosk"):policy["returnMethod"]=returns["method"]
   if returns.get("fees") in ("https://schema.org/FreeReturn","https://schema.org/ReturnFeesCustomerResponsibility","https://schema.org/ReturnShippingFees"):policy["returnFees"]=returns["fees"]
   if returns["category"]!="https://schema.org/MerchantReturnFiniteReturnWindow" or "merchantReturnDays" in policy:
    offer["hasMerchantReturnPolicy"]=policy

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
def seo_availability(row):
 """Prioriza inventario explícito; si falta, usa el estado activo del catálogo."""
 p=row.get("product") or {}
 stock=p.get("stock")
 if stock is True or (isinstance(stock,(int,float)) and not isinstance(stock,bool) and stock>0):
  return "https://schema.org/InStock"
 if stock is False or (isinstance(stock,(int,float)) and not isinstance(stock,bool) and stock<=0):
  return "https://schema.org/OutOfStock"
 state=str(p.get("availability") or p.get("status") or p.get("estado") or "").strip().lower()
 if state in ("instock","in_stock","disponible","available","en stock"):
  return "https://schema.org/InStock"
 if state in ("outofstock","out_of_stock","agotado","sin stock","unavailable"):
  return "https://schema.org/OutOfStock"
 if row.get("activo") is True:
  return "https://schema.org/InStock"
 if row.get("activo") is False:
  return "https://schema.org/OutOfStock"
 return None

def build(row):
 p=row["product"]; seo_data=row.get("_seo") or {}; name=str(p.get("name") or p.get("nombre")); pid=row["id"]
 key=slug(name) or "producto"; filename=f"{key}-{pid}.html"
 embedded=p.get("seo") if isinstance(p.get("seo"),dict) else {}
 canonical=f"{BASE}/productos/{filename}"
 brand=str(p.get("brand") or p.get("marca") or "")
 description=str(p.get("description") or p.get("descripcion") or "").strip()
 image=str(embedded.get("image") or seo_data.get("imagen_seo") or p.get("image") or p.get("imagen") or "").strip()
 if image.startswith("//"):image="https:"+image
 elif image.startswith("/"):image=BASE+image
 elif image and not image.startswith(("https://","http://")):image=""
 price=p.get("price",p.get("precio"))
 promotion=active_offer(row)
 try: amount=float(price); valid_price=amount>0
 except (ValueError,TypeError):valid_price=False;amount=0
 title=str(embedded.get("title") or seo_data.get("titulo_seo") or (name+" | Supgo"))[:140]
 seo_description=seo_plain(embedded.get("html") or seo_data.get("descripcion_larga_html"))
 meta=str(embedded.get("meta") or seo_data.get("meta_descripcion") or description or seo_description or f"Consulta {name} de {brand} en Supgo. Presentaciones, precio y disponibilidad en Colombia.")[:160]
 product_schema={"@context":"https://schema.org","@type":"Product","name":name,"url":canonical,"sku":str(embedded.get("sku") or p.get("sku") or pid)}
 settings=row.get("_merchant_settings") or {}
 for source,target in (("gtin","gtin"),("gtin8","gtin8"),("color","color"),("material","material"),("size","size")):
  value=p.get(source)
  if isinstance(value,(str,int,float)) and str(value).strip():product_schema[target]=str(value).strip()
 presentation=p.get("presentation") or p.get("presentacion")
 if presentation and not product_schema.get("size"):product_schema["size"]=str(presentation)
 if p.get("flavor"):product_schema["additionalProperty"]=[{"@type":"PropertyValue","name":"Sabor","value":str(p["flavor"])}]
 if settings.get("item_condition")=="https://schema.org/NewCondition":product_schema["itemCondition"]=settings["item_condition"]
 if brand:product_schema["brand"]={"@type":"Brand","name":brand}
 if embedded.get("gtin"):product_schema["gtin"]=str(embedded["gtin"])
 if embedded.get("manufacturer"):product_schema["manufacturer"]={"@type":"Organization","name":brand,"url":str(embedded["manufacturer"])} if str(embedded["manufacturer"]).startswith(("https://","http://")) else {"@type":"Organization","name":str(embedded["manufacturer"])}
 if image:product_schema["image"]=[image]
 product_schema["description"]=(seo_description or description or meta)[:5000]
 # Datos estructurados verificables: no inventar stock, reseñas ni identificadores.
 for source,target in (("gtin13","gtin13"),("gtin12","gtin12"),("gtin14","gtin14"),("mpn","mpn")):
  value=p.get(source)
  if value: product_schema[target]=str(value).strip()
 if promotion:amount=promotion[1]
 if valid_price:
  offer={"@type":"Offer","url":canonical,"priceCurrency":"COP","price":int(amount) if amount.is_integer() else amount,"seller":{"@type":"Organization","name":"Lift Nutrientes","url":BASE}}
  availability=seo_availability(row)
  if availability:offer["availability"]=availability
  merchant_policy(offer,settings)
  product_schema["offers"]=offer
 breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":BASE+"/"},{"@type":"ListItem","position":2,"name":name,"item":canonical}]}
 breadcrumb_json=json.dumps(breadcrumb,ensure_ascii=False).replace("<","\\u003c")
 schema=json.dumps(product_schema,ensure_ascii=False).replace("<","\\u003c")
 # SEO legible incluso si falla JavaScript. La experiencia interactiva se abre en el catálogo.
 img=f'<img src="{esc(image)}" alt="{esc(embedded.get("alt1") or name)}" loading="eager" width="420" style="width:100%;max-height:430px;object-fit:contain">' if image else ""
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
<script type="application/ld+json">{schema}</script><script type="application/ld+json">{breadcrumb_json}</script>
<style>body{{margin:0;color:#151515;background:#fff;font-family:Poppins,Arial,sans-serif}}header{{background:#090909;color:white;padding:20px 5%}}header a{{color:white;text-decoration:none;font-weight:700}}nav{{padding:16px 5%;border-bottom:1px solid #ddd;display:flex;gap:20px;flex-wrap:wrap}}nav a{{color:#222;text-decoration:none}}main{{max-width:1150px;margin:35px auto;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:35px}}h1{{font-size:30px}}.price{{font-size:26px;font-weight:bold}}.btn{{display:inline-block;background:#111;color:white;padding:14px 20px;text-decoration:none;margin:8px 8px 8px 0}}footer{{padding:35px 5%;border-top:1px solid #ddd}}@media(max-width:700px){{main{{grid-template-columns:1fr}}}}</style>
</head><body><header><a href="{BASE}/">LIFT NUTRIENTES</a></header>
<nav><a href="{BASE}/">Inicio</a><a href="{BASE}/?ofertas=1">Ofertas</a><a href="{BASE}/?categoria={urllib.parse.quote(str(p.get('category') or ''))}">Categoría: {esc(p.get('category') or 'Ver todas')}</a><a href="{BASE}/?marca={urllib.parse.quote(brand)}">Laboratorio: {esc(brand or 'Ver todos')}</a></nav>
<main><section>{img}</section><section><p>{esc(brand)}</p><h1>{esc(name)}</h1>{price_html}
<p>{esc(seo_description or description or "Consulta presentaciones, sabores y disponibilidad de este producto.")}</p>
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
 # Remover titulo generico antes de colocar el titulo exclusivo del producto.
 shared=re.sub(r'<title>.*?</title>', '', shared, count=1, flags=re.S|re.I)
 page=re.sub(r"""<meta\b(?=[^>]*(?:property|name)\s*=\s*["'](?:og:[^"']+|twitter:[^"']+|description)["'])[^>]*>""", "", shared, flags=re.I)
 page=re.sub(r"""<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*>""", "", page, flags=re.I)
 # Evitar que instrucciones de administracion se indexen en fichas publicas.
 page=page.replace('Selecciona primero 2 o más productos en la pestaña <b>Productos</b>. Aquí se crea una sola ficha padre sin borrar los productos originales. Cada fila conserva su ID y puede tener su propia imagen.', 'Administración de variaciones')
 p=row["product"]
 brand=str(p.get("brand") or p.get("marca") or "")
 description=str(p.get("description") or p.get("descripcion") or "").strip()
 seo_description=seo_plain((p.get("seo") or {}).get("html") or (row.get("_seo") or {}).get("descripcion_larga_html"))
 image=str((row.get("_seo") or {}).get("imagen_seo") or p.get("image") or p.get("imagen") or "").strip()
 if image.startswith("//"): image="https:"+image
 elif image.startswith("/"): image=BASE+image
 elif image and not image.startswith(("http://","https://")): image=""
 img=f'<img src="{esc(image)}" alt="{esc((p.get("seo") or {}).get("alt1") or name)}" width="360" height="360" style="max-width:100%;object-fit:contain">' if image else ""
 seo_html=str((p.get("seo") or {}).get("html") or (row.get("_seo") or {}).get("descripcion_larga_html") or "").strip()
 seo_html=re.sub(r"(?is)<script[^>]*>.*?</script>","",seo_html)
 seo_html=re.sub(r"(?is)<iframe[^>]*>.*?</iframe>","",seo_html)
 seo_html=re.sub(r"(?is)<(style|svg|object|embed|form)[^>]*>.*?</\\1>","",seo_html)
 seo_html=re.sub(r"(?i)\\s+on[a-z]+\\s*=\\s*(?:\\x22[^\\x22]*\\x22|\\x27[^\\x27]*\\x27|[^\\s>]+)","",seo_html)
 seo_html=re.sub(r"(?i)(href|src)\\s*=\\s*([\\x22\\x27])\\s*(?:javascript:|data:)[^\\x22\\x27]*\\2",r"\\1=\\2#\\2",seo_html)
 price=row["product"].get("price",row["product"].get("precio"))
 try: amount=float(price);valid_price=amount>0
 except (ValueError,TypeError): amount=0;valid_price=False
 offer=active_offer(row)
 if offer: amount=offer[1]
 price_html=("$ "+format(amount,",.0f").replace(",",".")) if valid_price else "Consultar precio"
 stock="Disponible" if seo_availability(row)=="https://schema.org/InStock" else "Consultar disponibilidad"
 extra=[]
 for label,keys in (("Presentación",("presentation","presentacion")),("Sabor",("flavor","sabor")),("Ingredientes",("ingredients","ingredientes")),("Modo de uso",("usage","modo_uso")),("Características",("features","caracteristicas"))):
  value=next((row["product"].get(k) for k in keys if row["product"].get(k)),None)
  if value: extra.append("<p><b>"+esc(label)+":</b> "+esc(value)+"</p>")
 static_section=("<main id=\"liftSEOStatic\" style=\"max-width:1100px;margin:24px auto;padding:20px;font:15px/1.7 Arial,sans-serif\">"
  +"<p>"+esc(brand)+"</p><h1>"+esc(name)+"</h1>"+img+"<p><strong>"+esc(price_html)+"</strong></p><p>"+esc(stock)+"</p>"
  +"".join(extra)+'<section id="liftSEODescription" class="liftSEODescription"><h2>Descripción del producto</h2>'+(seo_html or "<p>"+esc(description)+"</p>")+"</section>"
  +"<p><a href=\""+BASE+"/?producto="+urllib.parse.quote(pid)+"\">Consultar producto y agregar al carrito</a></p></main>")
 page=page.replace("<body>", "<body>"+static_section,1)
 # Los robots de WhatsApp/Facebook leen primero el comienzo del HEAD.
 # Añadir metadatos y JSON-LD en el HEAD antes de los scripts del catálogo.
 page=page.replace("<head>","<head>\n"+head_meta+"\n",1)
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
     const staticSEO=document.getElementById('liftSEOStatic');
     const descriptionSEO=document.getElementById('liftSEODescription');
     if(descriptionSEO){
      const detailBody=panel.querySelector('#liftMonoBody')||panel;
      detailBody.appendChild(descriptionSEO);
      descriptionSEO.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;max-width:1100px;margin:30px auto;padding:20px;line-height:1.75;overflow-wrap:anywhere';
     }
     // Boton de enlace de venta para Instagram en fichas individuales.
     if(!panel.querySelector('#liftInstagramBuyLink')){
      const linkButton=document.createElement('button');
      linkButton.id='liftInstagramBuyLink';
      linkButton.type='button';
      linkButton.textContent='Copiar enlace para Instagram';
      linkButton.style.cssText='display:block;width:100%;max-width:440px;margin:16px auto;padding:14px 18px;background:#111;color:white;border:0;border-radius:4px;font-weight:700;cursor:pointer';
      linkButton.addEventListener('click',async()=>{
       const url=window.location.origin+window.location.pathname;
       try{await navigator.clipboard.writeText(url);linkButton.textContent='Enlace copiado';}
       catch(e){window.prompt('Copia el enlace del producto',url);}
       setTimeout(()=>{linkButton.textContent='Copiar enlace para Instagram'},2000);
      });
      const actions=panel.querySelector('#liftMonoBody')||panel;
      actions.insertBefore(linkButton,actions.firstChild);
     }
     staticSEO?.remove();
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
 if page.lower().count('<title>') != 1: raise RuntimeError('SEO sin titulo unico: '+filename)
 return filename,page

def shared_template():
 """Una única skin CSS compartida por todas las fichas; scripts originales en su orden."""
 source=(ROOT/"index.html").read_text(encoding="utf-8")
 assets=ROOT/"productos-assets";assets.mkdir(exist_ok=True)
 import hashlib
 # Consolidar únicamente estilos inline; conservar intacta la lógica del catálogo.
 css_parts=[]
 def collect_css(m):
  css_parts.append(m.group(2))
  return '<!-- CSS compartido de ficha -->'
 source=re.sub(r'(<style\b[^>]*>)(.*?)(</style>)',collect_css,source,flags=re.S|re.I)
 if css_parts:
  css="\n".join(css_parts)
  digest=hashlib.sha256(css.encode("utf-8")).hexdigest()[:16]
  css_name=f"supgo-productos-{digest}.css"
  (assets/css_name).write_text(css,encoding="utf-8")
  css_link='<link rel="stylesheet" href="/productos-assets/'+css_name+'">'
  source=source.replace("</head>",css_link+"\n</head>",1)
 # Los scripts se mantienen en su posición para no alterar dependencias ni checkout.
 def externalize_js(m):
  opening,body,closing=m.group(1),m.group(2),m.group(3)
  if not body.strip() or "src=" in opening.lower() or "application/ld+json" in opening.lower():return m.group(0)
  digest=hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]
  name=f"shared-{digest}.js"
  (assets/name).write_text(body,encoding="utf-8")
  return '<script src="/productos-assets/'+name+'"></script>'
 return re.sub(r'(<script\b[^>]*>)(.*?)(</script>)',externalize_js,source,flags=re.S|re.I)

def main():
 rows=fetch()
 seo_rows=fetch_seo()
 offers=fetch_offers()
 merchant_settings=fetch_merchant_settings()
 for row in rows:
  row["_seo"]=seo_rows.get(str(row["id"]),{})
  row["_offer"]=offers.get(str(row["id"]))
  row["_merchant_settings"]=merchant_settings
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
  destination=OUT/filename
  # Protección: nunca reemplazar fichas existentes salvo autorización explícita.
  if not destination.exists() or os.getenv("SEO_OVERWRITE_EXISTING","0")=="1":
   destination.write_text(content,encoding="utf-8")
  urls.append(BASE+"/productos/"+filename)
 sitemap=('<?xml version="1.0" encoding="UTF-8"?>' + chr(10) + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + chr(10) + ''.join("<url><loc>"+esc(u)+"</loc></url>"+chr(10) for u in urls) + "</urlset>" + chr(10))
 if not preview_id and not brand_only: (ROOT/"sitemap-productos.xml").write_text(sitemap,encoding="utf-8")
 print("Generadas",len(urls),"fichas completas sin iframe con recursos compartidos.")
if __name__=="__main__": main()
