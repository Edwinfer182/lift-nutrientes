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

def fetch_product_images():
 """Imágenes secundarias ordenadas, incluidas tablas nutricionales."""
 result={}
 for offset in range(0,100000,500):
  query=urllib.parse.urlencode({"select":"producto_id,imagen_url,orden","order":"orden.asc","limit":"500","offset":str(offset)})
  req=urllib.request.Request(URL+"/rest/v1/lift_producto_imagenes?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
  with urllib.request.urlopen(req,timeout=40) as res:batch=json.load(res)
  for item in batch:
   url=str(item.get("imagen_url") or "").strip()
   if url.startswith("//"):url="https:"+url
   elif url.startswith("/"):url=BASE+url
   if url.startswith(("https://","http://")):result.setdefault(str(item["producto_id"]),[]).append(url)
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
  catalog_price=float(row["product"].get("price") or row["product"].get("precio") or 0)
  sale=float(o.get("price"))
  configured_original=o.get("originalPrice")
  original=float(configured_original) if configured_original not in (None,"") else catalog_price
  if sale<=0 or original<=sale:return None
 except (TypeError,ValueError):return None
 return original,sale

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

SEO_HEADER_CSS=(ROOT/'componentes'/'header-public.css').read_text(encoding='utf-8')
# El menú se crea dentro de body, mientras el antiguo CSS apunta al header.
# Aislar el panel del layout SEO y forzar la capa blanca por encima de la ficha.
SEO_MENU_FIX = """
body .supgo-menu:not([hidden]){position:fixed!important;top:0!important;left:0!important;right:auto!important;bottom:0!important;width:min(92vw,460px)!important;height:100dvh!important;max-height:100dvh!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#fff!important;background-image:none!important;z-index:2147483646!important;padding:0!important;border:0!important;border-radius:0!important;box-sizing:border-box!important}
body .supgo-menu:not([hidden]) .supgo-menu-inner{flex:1!important;min-height:0!important;overflow-y:auto!important;background:#fff!important}
body .supgo-menu:not([hidden]) .supgo-menu-head{flex:none!important;background:#fff!important}
body .supgo-menu-shade:not([hidden]){position:fixed!important;inset:0!important;display:block!important;background:rgba(0,0,0,.65)!important;z-index:2147483645!important}
body .supgo-menu .supgo-links.is-brands{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
body .supgo-menu .supgo-brand-card{background:#fff!important}
body .supgo-menu[hidden],body .supgo-menu-shade[hidden]{display:none!important}
"""

def fetch_lab_logos():
 """Copia los logos públicos a nuestro dominio para evitar bloqueos de hotlink en Safari."""
 import hashlib
 query=urllib.parse.urlencode({"select":"valor","clave":"eq.laboratories_v1","limit":"1"})
 req=urllib.request.Request(URL+"/rest/v1/lift_catalog_config?"+query,headers={"apikey":KEY,"Authorization":"Bearer "+KEY,"Accept":"application/json"})
 try:
  with urllib.request.urlopen(req,timeout=40) as res: entries=json.load(res)
  value=entries[0].get("valor") if entries else {}
  if isinstance(value,str):value=json.loads(value)
  if not isinstance(value,dict):return {}
 except Exception as exc:
  print("Aviso: configuración de laboratorios no disponible:",exc)
  return {}
 directory=ROOT/"productos-assets"/"logos"
 directory.mkdir(parents=True,exist_ok=True)
 result={}
 for name,settings in value.items():
  if not isinstance(settings,dict):continue
  url=str(settings.get("image") or "").strip()
  if not url.startswith(("https://","http://")):continue
  key=hashlib.sha256(url.encode("utf-8")).hexdigest()[:18]
  existing=next((directory/(key+ext) for ext in (".png",".jpg",".webp",".gif",".svg") if (directory/(key+ext)).is_file()),None)
  if existing:
   result[str(name).strip().casefold()]="/productos-assets/logos/"+existing.name
   continue
  try:
   request=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; SUPGO-SEO/1.0)","Accept":"image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*"})
   with urllib.request.urlopen(request,timeout=12) as response:
    content_type=response.headers.get("Content-Type","").split(";")[0].lower().strip()
    data=response.read(1000001)
   extensions={"image/png":".png","image/jpeg":".jpg","image/webp":".webp","image/gif":".gif","image/svg+xml":".svg"}
   extension=extensions.get(content_type)
   if not extension or len(data)>1000000 or len(data)<100:raise ValueError("Imagen inválida o muy grande")
   target=directory/(key+extension)
   target.write_bytes(data)
   result[str(name).strip().casefold()]="/productos-assets/logos/"+target.name
  except Exception as exc:
   print("Aviso: no se pudo alojar el logo de",name,":",str(exc)[:100])
   result[str(name).strip().casefold()]=url
 return result

def seo_filter_data(rows,logos=None):
 brands, categories = {}, {}
 total=0
 for item in rows:
  if item.get("activo") is not True: continue
  p=item.get("product") or {}
  total+=1
  for source, value in ((brands,p.get("brand") or p.get("marca")), (categories,p.get("category") or p.get("categoria"))):
   name=str(value or "").strip()
   if name: source[name]=source.get(name,0)+1
 return {"brands":[[name,count,(logos or {}).get(name.casefold(),"")] for name,count in sorted(brands.items(),key=lambda x:x[0].casefold())],"categories":sorted(categories.items(),key=lambda x:x[0].casefold()),"total":total}

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
 # Meta única por ficha: prioridad a nombre y marca, con enfoque local real.
 # No reutilizar textos heredados de WordPress ni descripciones genéricas.
 product_label=name if not brand or brand.casefold() in name.casefold() else f"{name} de {brand}"
 meta=f"Compra {product_label} en Medellín con Lift Nutrientes. Consulta precio, presentaciones y disponibilidad. Envíos a Bogotá, Cali y Colombia."
 if len(meta)>160:
  meta=f"Compra {product_label} en Medellín con Lift Nutrientes. Consulta precios y disponibilidad. Envíos a toda Colombia."
 if len(meta)>160:
  prefix="Compra "
  suffix=" en Medellín con Lift Nutrientes. Envíos a Colombia."
  meta=prefix+product_label[:160-len(prefix)-len(suffix)].rstrip()+suffix
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
  if promotion:
   original_price=promotion[0]
   offer["priceSpecification"]={"@type":"UnitPriceSpecification","price":int(original_price) if original_price.is_integer() else original_price,"priceCurrency":"COP","priceType":"https://schema.org/StrikethroughPrice"}
  merchant_policy(offer,settings)
  product_schema["offers"]=offer
 breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"SUPGO","item":BASE+"/"},{"@type":"ListItem","position":2,"name":"Laboratorios","item":BASE+"/laboratorios/"},{"@type":"ListItem","position":3,"name":name,"item":canonical}]}
 breadcrumb_json=json.dumps(breadcrumb,ensure_ascii=False).replace("<","\\u003c")
 schema=json.dumps(product_schema,ensure_ascii=False).replace("<","\\u003c")
 # SEO legible incluso si falla JavaScript. La experiencia interactiva se abre en el catálogo.
 img=f'<img src="{esc(image)}" alt="{esc(embedded.get("alt1") or name)}" loading="eager" width="420" style="width:100%;max-height:430px;object-fit:contain">' if image else ""
 price_html=f'<p class="price">$ {int(amount):,}</p>'.replace(",","\u002e") if valid_price else "<p>Consultar precio</p>"
 if promotion:
  original=("$ {:,.0f}".format(promotion[0])).replace(",",".")
  discounted=("$ {:,.0f}".format(promotion[1])).replace(",",".")
  price_html='<div class="seo-offer-price"><span class="seo-offer-label">OFERTA</span><del>'+original+'</del><strong>'+discounted+'</strong><span class="seo-offer-saving">Ahorras '+("$ {:,.0f}".format(max(0,promotion[0]-promotion[1]))).replace(",",".")+'</span></div>'
 # Información adicional de la oferta: vencimiento y regalo asociado en Lift.
 offer_extra_html=""
 if promotion:
  offer_data=row.get("_offer") or {}
  until=offer_data.get("promoUntil")
  if until:
   try:
    deadline=datetime.fromisoformat(str(until).replace("Z","+00:00"))
    if deadline.tzinfo is None:deadline=deadline.replace(tzinfo=timezone.utc)
    date_label=deadline.strftime("%d/%m/%Y")
    offer_extra_html+='<span class="seo-offer-until">Válida hasta el '+esc(date_label)+'</span>'
   except (ValueError,TypeError):pass
  if offer_data.get("gift"):
   gift_id=str(offer_data.get("giftProductId") or "").strip()
   gift_product=(row.get("_products_by_id") or {}).get(gift_id) or {}
   gift_name=str(offer_data.get("giftName") or gift_product.get("name") or gift_product.get("nombre") or "").strip()
   gift_image=str(gift_product.get("image") or gift_product.get("imagen") or "").strip()
   if gift_image.startswith("//"):gift_image="https:"+gift_image
   elif gift_image.startswith("/"):gift_image=BASE+gift_image
   if not gift_image.startswith(("https://","http://")):gift_image=""
   try:gift_qty=max(1,int(offer_data.get("giftQty") or 1))
   except (ValueError,TypeError):gift_qty=1
   if gift_name:
    gift_img_html=f'<img src="{esc(gift_image)}" alt="{esc(gift_name)}" loading="lazy" width="54" height="54">' if gift_image else ""
    offer_extra_html+=f'<div class="seo-offer-gift">{gift_img_html}<div><span class="seo-gift-tag">REGALO INCLUIDO</span><strong>{gift_qty} × {esc(gift_name)}</strong></div></div>'
 if offer_extra_html:offer_extra_html='<div class="seo-offer-extras">'+offer_extra_html+'</div>'
 # Mostrar la descripción larga como HTML real dentro de un acordeón nativo.
 # El contenido viene del editor SEO; se eliminan scripts y eventos inline.
 long_html=str(embedded.get("html") or seo_data.get("descripcion_larga_html") or "").strip()
 long_html=re.sub(r"(?is)<(script|iframe|object|embed|form|style|svg)\\b[^>]*>.*?</\\1\\s*>","",long_html)
 long_html=re.sub(r"(?is)<(script|iframe|object|embed|form|style|svg)\\b[^>]*/?>","",long_html)
 long_html=re.sub(r"(?i)\\s+on[a-z]+\\s*=\\s*(?:\\\"[^\\\"]*\\\"|'[^']*'|[^\\s>]+)","",long_html)
 long_html=re.sub(r"(?i)javascript\\s*:","",long_html)
 long_html=re.sub(r"(?i)<\\s*/?details\\b[^>]*>","",long_html)
 long_html=re.sub(r"(?i)<\\s*/?summary\\b[^>]*>","",long_html)
 description_body=long_html if long_html else '<p>'+esc(description or "Consulta presentaciones, sabores y disponibilidad de este producto.")+'</p>'
 gallery=[]
 for url in [image]+row.get("_images",[]):
  if url and url not in gallery:gallery.append(url)
 gallery_html=''.join('<button type="button" class="gallery-thumb'+(' active' if index==0 else '')+'" data-index="'+str(index)+'" aria-label="Ver imagen '+str(index+1)+'"><img src="'+esc(url)+'" alt="'+esc(name)+' - imagen '+str(index+1)+'" loading="lazy"></button>' for index,url in enumerate(gallery))
 gallery_json=json.dumps(gallery,ensure_ascii=False).replace("<","\\u003c")
 variants=row.get("_variants",[])
 related=row.get("_related",[])
 variants_html=''.join('<a class="option'+(' selected' if str(v["id"])==str(pid) else '')+'" href="'+esc(v["url"])+'" title="'+esc(v["label"])+'">'+('<span class="option-photo"><img src="'+esc(v["image"])+'" alt="'+esc(v["label"])+'" loading="lazy"></span>' if v["image"] else '<span class="option-photo option-empty">Sin foto</span>')+'<span class="option-label">'+esc(v["label"])+'</span>'+('<span class="option-offer">Oferta</span>' if v.get('on_offer') else '')+'</a>' for v in variants)
 related_html=''.join('<a class="related-item" href="'+esc(v["url"])+'">'+('<img loading="lazy" src="'+esc(v["image"])+'" alt="'+esc(v["name"])+'">' if v["image"] else '')+'<strong>'+esc(v["name"])+'</strong><small>'+esc(v["brand"])+'</small></a>' for v in related)
 title_brand_html = (' <span class="seo-title-brand">' + esc(brand) + '</span>') if brand else ''
 product_json=json.dumps({"id":str(pid),"name":name,"image":image,"price":amount,"url":canonical,"on_offer":bool(promotion),"promoUntil":(row.get("_offer") or {}).get("promoUntil") if promotion else None},ensure_ascii=False).replace("<","\\u003c")
 return filename, f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(meta)}">\n<meta name="robots" content="{'index, follow' if row.get('_indexable', True) else 'noindex, follow'}">
<link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="product">
<meta property="og:title" content="{esc(name)}"><meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:site_name" content="Lift Nutrientes"><meta property="og:locale" content="es_CO">
{f'<meta property="og:image" content="{esc(image)}"><meta property="og:image:alt" content="{esc(name)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{esc(image)}">' if image else '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="{esc(name)}"><meta name="twitter:description" content="{esc(meta)}">
{f'<meta property="product:price:amount" content="{amount:g}"><meta property="product:price:currency" content="COP">' if valid_price else ''}
<script type="application/ld+json">{schema}</script><script type="application/ld+json">{breadcrumb_json}</script>
<style>
:root{{--ink:#151515;--muted:#737373;--line:#eaeaea;--paper:#fff;--canvas:#f8f8f8}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--canvas);color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;-webkit-font-smoothing:antialiased}}
.product-page{{max-width:1160px;margin:0 auto;padding:clamp(22px,4vw,60px) 22px 80px}}
.product-card{{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr);background:var(--paper);border:1px solid var(--line);border-radius:18px;overflow:hidden}}
.product-media{{min-height:480px;background:#fafafa;display:flex;align-items:center;justify-content:center;padding:clamp(30px,5vw,65px);border-right:1px solid var(--line)}}
.product-media img{{display:block;width:100%;max-width:440px;max-height:510px;object-fit:contain;mix-blend-mode:multiply}}
.product-info{{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:clamp(30px,5vw,66px)}}
.product-brand{{font-size:12px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#777;margin:0 0 18px}}
h1{{font-size:clamp(29px,3.3vw,46px);line-height:1.13;letter-spacing:-.04em;font-weight:700;margin:0 0 26px;overflow-wrap:anywhere}}
.product-price{{font-size:clamp(27px,3vw,38px);font-weight:700;letter-spacing:-.035em;margin:0 0 25px}}
.product-price .price{{margin:0}}
.product-price del{{display:block;font-size:16px;font-weight:400;color:#888;letter-spacing:0;margin-bottom:8px}}
.product-price strong{{color:#151515!important;font-size:clamp(27px,3vw,38px)!important}}
.product-rule{{height:1px;background:var(--line);width:100%;margin-bottom:23px}}
.product-description{{font-size:15px;line-height:1.85;color:#565656;overflow-wrap:anywhere}}
.product-description p{{margin:0}}


.seo-description{{width:100%;border-bottom:1px solid var(--line);margin:6px 0 20px}}.seo-description summary{{display:flex;align-items:center;justify-content:space-between;gap:16px;list-style:none;cursor:pointer;padding:16px 0;font-size:15px;font-weight:650}}.seo-description summary::-webkit-details-marker{{display:none}}.seo-chevron{{height:9px;width:9px;border-right:1.7px solid currentColor;border-bottom:1.7px solid currentColor;transform:rotate(45deg);transition:transform .2s;margin-right:5px}}.seo-description[open] .seo-chevron{{transform:rotate(225deg)}}.seo-description .product-description{{padding:2px 0 20px;margin:0;max-width:100%;overflow-wrap:anywhere}}.seo-description .product-description p{{margin:0 0 14px}}.seo-description .product-description h2,.seo-description .product-description h3{{font-size:18px;line-height:1.35;color:#222;margin:22px 0 10px}}.seo-description .product-description ul,.seo-description .product-description ol{{padding-left:22px;margin:10px 0 18px}}.seo-description .product-description img{{max-width:100%;height:auto}}.seo-description .product-description table{{display:block;max-width:100%;overflow-x:auto}}.option{{display:inline-flex;flex-direction:column;align-items:center;gap:7px;vertical-align:top;width:100px;max-width:calc(33.333% - 12px);padding:9px;border:1px solid #e5e5e5;border-radius:7px;text-decoration:none;color:#222;margin:5px;font-size:12px;text-align:center;background:#fff}}.option-photo{{width:76px;height:76px;display:grid;place-items:center;background:#fafafa;border-radius:4px;overflow:hidden}}.option-photo img{{width:100%;height:100%;object-fit:contain}}.option-empty{{font-size:10px;color:#aaa}}.option-label{{width:100%;line-height:1.3;overflow-wrap:anywhere}}.option.selected{{background:#111;color:white}}.actions{{display:flex;gap:8px;margin-top:22px;width:100%;align-items:stretch}}.seo-qty{{display:flex;align-items:center;border:1px solid #dedede;border-radius:7px;overflow:hidden;flex:none;height:50px}}.seo-qty button{{width:35px;height:100%;border:0;background:#f8f8f8;color:#111;font-size:20px;font-weight:400}}.seo-qty output{{width:27px;text-align:center;font-size:15px;font-weight:600;line-height:1}}@media(max-width:390px){{.actions{{gap:6px}}.seo-qty button{{width:29px}}.seo-qty output{{width:22px}}.actions .add{{padding:10px 7px;font-size:12px}}.actions .fav{{padding:8px!important}}}}button{{cursor:pointer;font:inherit}}.add{{background:#111;color:#fff;border:0;border-radius:5px;padding:14px 20px;flex:1;font-weight:600}}.fav{{background:white;border:1px solid #ddd;border-radius:5px;padding:10px 16px;font-size:23px}}.related{{margin-top:45px}}.related-grid{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}}.related-item{{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #eee;padding:14px;text-decoration:none;color:#111;border-radius:6px}}.related-item img{{height:160px;width:100%;object-fit:contain}}.related-item strong{{font-size:14px}}.related-item small{{color:#777}}@media(max-width:760px){{.related-grid{{grid-template-columns:repeat(2,1fr)}}.related-item img{{height:115px}}}}

/* Diseño de ficha SEO inspirado en la ficha interactiva de SUPGO */
body{{background:#fff;color:#111;font-family:Poppins,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
.product-page{{max-width:1460px;padding:24px 30px 64px;margin:0 auto}}
.product-card{{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);align-items:start;gap:44px;border:0;border-radius:0;overflow:visible;background:transparent}}
.product-media{{position:relative;min-height:500px;aspect-ratio:1.22;background:#fbfbfd;border:1px solid #ebebed;border-radius:22px;padding:34px;box-shadow:0 8px 30px rgba(0,0,0,.035)}}
.product-media img{{width:100%;max-width:560px;max-height:520px;mix-blend-mode:normal;object-fit:contain}}
.product-info{{padding:8px 0;justify-content:flex-start;align-items:stretch;min-width:0}}
.product-brand{{margin:0 0 13px;color:#777;font-size:12px;letter-spacing:.12em;font-weight:500}}
.product-info h1{{font-size:clamp(28px,3vw,43px);line-height:1.2;letter-spacing:-.035em;font-weight:600;margin:0 0 12px}}
.product-price{{font-size:clamp(27px,2.8vw,36px);margin:0 0 18px;font-weight:650}}
.product-price strong{{font-size:clamp(27px,2.8vw,36px)!important}}
.product-info h3{{font-size:14px;font-weight:650;margin:0 0 10px}}
.variant-panel{{border:1px solid #e5e5e5;border-radius:17px;padding:15px;margin:6px 0 16px}}
.variant-grid{{display:flex;flex-wrap:wrap;gap:10px}}
.option{{position:relative;margin:0;width:110px;max-width:none;padding:10px 8px;gap:6px;border-radius:14px;border:1px solid #dedede;background:white;font-size:12px;transition:border-color .15s,box-shadow .15s}}
.option:hover{{border-color:#888}}
.option.selected{{background:white;color:#111;border:2px solid #111;box-shadow:0 2px 5px rgba(0,0,0,.07);padding:9px 7px}}
.option-photo{{width:90px;height:90px;background:transparent}}
.option-label{{font-size:12px;line-height:1.25}}
.option-offer{{position:absolute;top:5px;right:5px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:auto;max-width:calc(100% - 10px);padding:3px 6px;border-radius:999px;background:#b91c1c;color:#fff;font-size:9px;font-weight:700;line-height:1;letter-spacing:.02em;box-shadow:0 1px 3px rgba(0,0,0,.12)}}
.product-rule{{display:none}}
.seo-description{{border-top:1px solid #eee;border-bottom:1px solid #eee;margin:0 0 16px}}
.seo-description summary{{padding:18px 5px;font-size:14px}}
.actions{{margin:0;gap:10px;align-items:stretch}}
.add{{border-radius:13px;padding:16px 20px;font-size:14px}}
.fav{{border-radius:13px;min-width:57px}}
.related{{margin-top:38px;padding-top:18px;border-top:1px solid #eee}}
.related h2{{font-size:16px;font-weight:650;margin:0 0 16px}}
.related-grid{{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}}
.related-item{{border:1px solid #e4e4e4;border-radius:16px;padding:13px;gap:7px}}
.related-item img{{height:140px}}
.related-item strong{{font-size:12px;font-weight:500;line-height:1.5}}
.related-item small{{font-size:11px}}
#notice{{font-size:12px;color:#555}}
@media(max-width:900px){{.product-card{{gap:24px}}.product-page{{padding:18px 18px 50px}}.product-media{{min-height:350px}}.option{{width:96px}}.option-photo{{width:76px;height:76px}}}}


.product-gallery{{min-width:0}}.product-gallery .product-media{{width:100%;height:auto}}.zoom-image{{display:flex;position:relative;align-items:center;justify-content:center;width:100%;height:100%;min-height:inherit;padding:0;background:transparent;border:0;cursor:zoom-in}}.zoom-image img{{max-width:100%;max-height:510px;object-fit:contain}}.zoom-hint{{position:absolute;right:8px;bottom:8px;font-size:11px;background:#fff;border:1px solid #eee;border-radius:20px;padding:7px 10px;color:#444}}.zoom-overlay[hidden]{{display:none!important}}.zoom-overlay{{position:fixed;inset:0;z-index:99999;background:rgba(12,12,14,.94);display:flex;align-items:center;justify-content:center;padding:50px 70px}}.zoom-photo{{max-width:100%;max-height:calc(100vh - 110px);object-fit:contain;user-select:none}}.zoom-close,.zoom-arrow{{position:absolute;border:0;background:rgba(255,255,255,.12);color:white;cursor:pointer;border-radius:50%;display:grid;place-items:center}}.zoom-close{{right:18px;top:16px;width:43px;height:43px;font-size:30px}}.zoom-arrow{{top:50%;transform:translateY(-50%);width:45px;height:45px;font-size:35px}}.zoom-prev{{left:15px}}.zoom-next{{right:15px}}.zoom-counter{{position:absolute;bottom:17px;color:white;font-size:13px}}@media(max-width:700px){{.zoom-overlay{{padding:60px 42px}}.zoom-arrow{{width:34px;height:34px;font-size:28px}}.zoom-prev{{left:4px}}.zoom-next{{right:4px}}}}

/* Ficha SEO: ajustes móviles para impedir imágenes gigantes y desbordamientos */


/* Galería SEO: estilo único de miniaturas verticales en la esquina superior izquierda. */
.product-gallery{{position:relative;min-width:0}}
.product-gallery .gallery-thumbs{{position:absolute;top:8px;left:8px;z-index:4;display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-height:calc(100% - 16px);overflow-x:hidden;overflow-y:auto;padding:2px;margin:0}}
.product-gallery .gallery-thumb{{flex:0 0 48px;width:48px;height:48px;border:1px solid #ddd;border-radius:6px;background:white;padding:4px;cursor:pointer}}
.product-gallery .gallery-thumb.active{{border:2px solid #111;padding:3px}}
.product-gallery .gallery-thumb img{{width:100%;height:100%;object-fit:contain}}
@media(max-width:760px){{
 .product-gallery .gallery-thumb{{flex-basis:42px;width:42px;height:42px;padding:3px}}
 .product-gallery .gallery-thumb.active{{padding:2px}}
 .product-gallery .product-media{{padding-left:58px!important}}
}}

/* Título compacto: marca junto al nombre, sin renglón independiente. */
.product-info h1{{font-family:Poppins,Arial,sans-serif;font-size:clamp(21px,2.15vw,29px);font-weight:500;line-height:1.33;letter-spacing:-.012em;margin:0 0 13px}}
.product-info h1 .seo-title-brand{{display:inline;font-size:.58em;font-weight:500;letter-spacing:0;color:#777;white-space:normal;vertical-align:baseline}}
@media(max-width:760px){{
 body .product-page .product-info h1{{font-size:17px!important;line-height:1.35!important;letter-spacing:0!important;font-weight:500!important;margin:0 0 10px!important}}
 body .product-page .product-info h1 .seo-title-brand{{font-size:11px!important;font-weight:500!important;color:#777}}
}}

/* ÚNICO BLOQUE RESPONSIVO DE LA FICHA SEO. */
@media screen and (max-width:760px){{
 html,body{{max-width:100%;overflow-x:hidden}}
 body .product-page{{width:100%;max-width:100%;margin:0 auto;padding:10px 12px 110px}}
 body .product-page .product-card{{display:flex;flex-direction:column;gap:12px;min-width:0;border-radius:10px;overflow:visible}}
 body .product-page .product-card .product-gallery{{width:100%;min-width:0;max-width:100%;overflow:hidden}}
 body .product-page .product-card .product-gallery .product-media{{width:100%;min-height:0;height:auto;aspect-ratio:1.26;padding:12px;border:1px solid #eee;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden}}
 body .product-page .product-card .product-gallery .zoom-image{{display:flex;width:100%;height:100%;min-height:0;align-items:center;justify-content:center;overflow:hidden}}
 body .product-page .product-card .product-gallery .zoom-image img{{display:block;width:100%;height:100%;max-width:100%;max-height:300px;object-fit:contain;mix-blend-mode:normal}}
 
 
 body .product-page .product-card .product-info{{width:100%;min-width:0;padding:13px 14px 20px;align-items:stretch}}
 body .product-page .product-card .product-info .product-brand{{font-size:10px;font-weight:500;letter-spacing:.08em;margin:0 0 7px;color:#777}}
 body .product-page .product-card .product-info h1{{font-size:17px;line-height:1.35;letter-spacing:0;font-weight:500;margin:0 0 10px}}
 body .product-page .product-card .product-info .product-price{{font-size:25px;line-height:1.2;margin:0 0 13px}}
 body .product-page .product-card .product-info .product-price strong{{font-size:25px!important;font-weight:650;letter-spacing:-.02em}}
 body .product-page .product-card .product-info .product-price del{{font-size:13px;margin:0 0 5px}}
 body .product-page .product-card .product-info .product-rule{{margin-bottom:12px}}
 body .product-page .product-card .product-info .seo-description{{margin:3px 0 14px}}
 body .product-page .product-card .product-info .seo-description summary{{font-size:13px;padding:12px 0;font-weight:600}}
 body .product-page .variant-panel{{margin:0 0 14px;padding:10px;border-radius:10px}}
 body .product-page .variant-grid{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}}
 body .product-page .option{{width:100%;max-width:100%;min-width:0;padding:5px 3px;gap:3px;border-radius:9px;margin:0}}
  body .product-page .option.selected{{padding:4px 2px}}
 body .product-page .option-photo{{width:100%;height:60px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:2px;background:transparent}}\n  body .product-page .option-photo img{{display:block;width:auto;max-width:100%;height:auto;max-height:100%;object-fit:contain;object-position:center}}
 body .product-page .option-label{{font-size:10px;line-height:1.2}}
  body .product-page .option-offer{{top:4px;right:4px;padding:3px 5px;font-size:8px}}
 body .product-page .related-grid{{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}}
 body .product-page .related-item img{{height:120px}}
 body .product-page .product-info .actions{{position:fixed!important;left:0;right:0;bottom:0;z-index:950;display:flex;align-items:center;gap:10px;width:100%;margin:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e8e8e8;box-shadow:0 -5px 18px rgba(0,0,0,.07)}}
 body .product-page .product-info .actions #add{{flex:1;min-height:46px;padding:11px 14px;font-size:14px;letter-spacing:0}}
 body .product-page .product-info .actions #fav{{flex:0 0 46px;min-width:46px;height:46px;padding:0}}
 .zoom-overlay{{padding:60px 38px}}
 .zoom-arrow{{width:34px;height:34px;font-size:28px}}
 .zoom-prev{{left:4px}}
 .zoom-next{{right:4px}}
 .zoom-photo{{max-width:100%;max-height:calc(100dvh - 140px)}}
}}

/* iOS Safari: evitar que los contenedores de la ficha reserven altura vacía
   al desplazar las tarjetas relacionadas y la barra de compra fija. */
@media screen and (max-width:760px){{
 html{{height:auto;min-height:0;overflow-x:clip;overflow-y:auto}}
 body{{height:auto!important;min-height:0!important;display:flow-root}}
 body > main.product-page{{height:auto!important;min-height:0!important;max-height:none!important;display:flow-root;padding-bottom:calc(90px + env(safe-area-inset-bottom))}}
 body > main.product-page .product-card,
 body > main.product-page .related{{height:auto!important;min-height:0!important;max-height:none!important}}
 body > main.product-page .related:last-child{{margin-bottom:0!important;padding-bottom:0!important}}
}}

</style>
<style id="seo-related-carousel">
.product-page .related-under-image{{margin:14px 0 0!important;padding:12px 0 0!important;border-top:1px solid #e9eaec;min-width:0;max-width:100%}}
.product-page .related-heading{{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}}
.product-page .related-heading h2{{font-size:13px;font-weight:600;margin:0}}
.product-page .related-controls{{display:flex;gap:6px}}
.product-page .related-controls button{{width:29px;height:29px;padding:0;border:1px solid #e2e4e8;border-radius:50%;background:#fff;color:#222;font-size:20px;line-height:1;cursor:pointer}}
.product-page .related-under-image .related-grid{{display:flex!important;gap:9px!important;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;padding:2px 1px 8px}}
.product-page .related-under-image .related-grid::-webkit-scrollbar{{display:none}}
.product-page .related-under-image .related-item{{flex:0 0 132px;min-width:0;max-width:132px;scroll-snap-align:start;padding:8px;border:1px solid #e6e8eb;border-radius:11px;gap:4px;box-shadow:none}}
.product-page .related-under-image .related-item img{{height:90px!important;width:100%;object-fit:contain}}
.product-page .related-under-image .related-item strong{{font-size:10px;font-weight:500;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.product-page .related-under-image .related-item small{{font-size:9px;color:#7b7f86}}
@media(max-width:900px){{.product-page .related-under-image .related-item{{flex-basis:112px;max-width:112px}}.product-page .related-under-image .related-item img{{height:76px!important}}}}
</style>
<style id="seo-breadcrumb-style">
.product-page .seo-breadcrumb{{display:flex;align-items:center;gap:6px;max-width:100%;overflow:hidden;white-space:nowrap;padding:2px 0 11px;margin:0;font:400 11px/1.35 Poppins,Arial,sans-serif;color:#848991}}
.product-page .seo-breadcrumb a{{color:#666e79;text-decoration:none;flex-shrink:0}}
.product-page .seo-breadcrumb a:hover{{color:#111;text-decoration:underline}}
.product-page .seo-breadcrumb-brand{{flex-shrink:0;color:#6c7480}}
.product-page .seo-breadcrumb-current{{overflow:hidden;text-overflow:ellipsis;min-width:0;color:#30353b}}
@media(max-width:600px){{.product-page .seo-breadcrumb{{font-size:10px;gap:5px;padding-bottom:8px}}.product-page .seo-breadcrumb-brand{{max-width:90px;overflow:hidden;text-overflow:ellipsis}}}}
</style>
<style id="seo-offer-extras">
.product-page .seo-offer-extras{{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;width:100%;margin:-4px 0 12px;font-size:11px}}
.product-page .seo-offer-until{{font-size:11px;color:#5c626a}}
.product-page .seo-offer-gift{{display:flex;align-items:center;gap:9px;padding:7px 10px;border:1px solid #dbeee0;border-radius:10px;background:#f6fbf7;max-width:100%}}
.product-page .seo-offer-gift img{{width:48px;height:48px;object-fit:contain;border-radius:6px;background:#fff;flex:none}}
.product-page .seo-offer-gift>div{{display:flex;flex-direction:column;gap:2px}}
.product-page .seo-gift-tag{{font-size:9px;font-weight:650;color:#17804a}}
.product-page .seo-offer-gift strong{{font-size:11px;font-weight:500;color:#252b27}}
@media(max-width:600px){{.product-page .seo-offer-extras{{margin:-2px 0 9px}}}}
</style>
<style id="seo-price-hierarchy">
.product-page .product-info h1{{margin:0 0 5px!important;line-height:1.25!important}}
.product-page .product-info .product-brand{{margin:0 0 6px!important}}
.product-page .product-info .product-price{{margin:6px 0 12px!important;line-height:1.2!important}}
.product-page .product-info .seo-offer-price{{display:flex!important;flex-flow:row wrap!important;align-items:baseline!important;justify-content:flex-start!important;gap:5px 12px!important;padding:9px 12px!important;background:#f2faf5;border:1px solid #d9eee0;border-radius:10px;width:100%;max-width:none!important;box-sizing:border-box}}
.product-page .product-info .seo-offer-label{{flex:0 0 auto!important;width:auto!important;order:0;background:#18844c;color:#fff;font-size:10px;font-weight:600;padding:3px 7px;border-radius:5px;letter-spacing:.01em}}
.product-page .product-info .seo-offer-price del{{flex:0 0 auto!important;order:1;display:inline!important;margin:0!important;font-size:13px!important;color:#747a7c!important}}
.product-page .product-info .seo-offer-price strong{{flex:0 0 auto!important;order:2;display:inline!important;font-size:clamp(25px,2.2vw,32px)!important;font-weight:700!important;color:#121a14!important;line-height:1.15!important}}
.product-page .product-info .seo-offer-saving{{flex:0 0 auto!important;order:3;font-size:11px;font-weight:500;color:#167643}}
@media(min-width:901px){{.product-page .product-card{{display:grid!important;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr)!important;align-items:start!important;gap:clamp(20px,3vw,44px)!important}}.product-page .product-card .product-gallery{{width:100%!important;min-width:0}}.product-page .product-card .product-info{{width:100%!important;min-width:0}}}}
@media(max-width:600px){{.product-page .product-info .seo-offer-price{{padding:8px 10px!important;gap:4px 9px!important}}.product-page .product-info .seo-offer-price strong{{font-size:25px!important}}}}
</style>
<style id="seo-compact-variants">
.product-page .variant-panel{{padding:11px!important;border-radius:12px!important}}
.product-page .variant-panel h3{{font-size:12px!important;font-weight:500!important;margin:0 0 9px!important}}
.product-page .variant-grid{{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(72px,82px))!important;justify-content:start!important;gap:7px!important}}
.product-page .variant-grid .option{{width:82px!important;max-width:82px!important;min-width:0!important;margin:0!important;padding:6px 4px!important;gap:4px!important;border-radius:9px!important;font-size:10px!important}}
.product-page .variant-grid .option.selected{{padding:5px 3px!important}}
.product-page .variant-grid .option-photo{{width:100%!important;height:49px!important;padding:1px!important}}
.product-page .variant-grid .option-photo img{{max-height:47px!important}}
.product-page .variant-grid .option-label{{font-size:9px!important;line-height:1.25!important;font-weight:400!important}}
@media(max-width:600px){{.product-page .variant-grid{{grid-template-columns:repeat(auto-fill,minmax(62px,70px))!important;gap:6px!important}}.product-page .variant-grid .option{{width:70px!important;max-width:70px!important;padding:4px 3px!important}}.product-page .variant-grid .option-photo{{height:43px!important}}.product-page .variant-grid .option-photo img{{max-height:41px!important}}.product-page .variant-grid .option-label{{font-size:8px!important}}}}
</style>
<style id="seo-buy-assurance-css">
.seo-buy-assurance{{margin:16px 0 20px;border:1px solid #e8eaed;border-radius:14px;background:#fff;padding:15px;font-family:Poppins,Arial,sans-serif;color:#1c1e22}}
.seo-info-fold{{border-bottom:1px solid #edf0f2}}.seo-info-fold:last-child{{border-bottom:0}}.seo-info-fold summary{{display:flex;align-items:center;gap:8px;min-height:34px;padding:4px 0;cursor:pointer;list-style:none;font-size:11px;line-height:1.25}}.seo-info-fold summary::-webkit-details-marker{{display:none}}.seo-info-fold summary strong{{font-size:11px;font-weight:500;flex:1}}.seo-info-icon{{width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:6px;background:#f2f5f3;font-size:11px}}.seo-info-chevron{{font-size:13px;color:#6b7280;transition:transform .2s}}.seo-info-fold[open] .seo-info-chevron{{transform:rotate(180deg)}}.seo-info-body{{padding:1px 0 8px 30px;font-size:10px;line-height:1.45;color:#60666e}}.seo-payment-image-wrap{{padding:6px 0 10px 0!important}}.seo-payment-image-wrap a{{display:block;max-width:350px}}.seo-payment-image-wrap img{{display:block;width:100%;height:auto;max-height:490px;object-fit:contain;object-position:left top;border-radius:9px;border:1px solid #e7e9ec}}.seo-info-body p{{margin:5px 0}}.seo-info-body .seo-shipping-table-wrap{{margin:6px 0}}.seo-info-body .seo-shipping-table th,.seo-info-body .seo-shipping-table td{{padding:5px 4px}}@media(max-width:600px){{.seo-info-body{{padding-left:30px}}}}
.seo-buy-assurance-grid{{display:grid;gap:11px}}
.seo-buy-benefit{{display:flex;align-items:flex-start;gap:10px;font-size:14px}}
.seo-buy-benefit>span{{width:28px;height:28px;flex:none;display:grid;place-items:center;background:#f2f5f3;border-radius:9px;font-size:14px;color:#15834b}}
.seo-buy-benefit strong{{display:block;font-size:12px;font-weight:500;line-height:1.5}}
.seo-buy-benefit small{{display:block;color:#62666d;font-size:11px;line-height:1.6;font-weight:400}}
.seo-shipping-table-wrap{{width:100%;overflow-x:auto;margin:9px 0 4px}}.seo-shipping-table{{width:100%;border-collapse:collapse;font-size:11px;text-align:left}}.seo-shipping-table th,.seo-shipping-table td{{padding:9px 7px;border-bottom:1px solid #edf0f2;vertical-align:middle}}.seo-shipping-table th{{font-size:10px;font-weight:600;color:#555b63;background:#f7f8fa}}.seo-shipping-table td{{font-weight:400}}.seo-shipping-table td:first-child{{font-weight:600}}.seo-shipping-note{{font-size:10px!important;color:#62666d;line-height:1.6;margin:7px 0 11px}}@media(max-width:600px){{.seo-shipping-table th,.seo-shipping-table td{{padding:7px 4px;font-size:10px}}}}
.seo-payments{{margin-top:13px;border-top:1px solid #eceef0;padding-top:12px}}
.seo-payments summary{{cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;list-style:none}}
.seo-payments summary::-webkit-details-marker{{display:none}}
.seo-payments-content{{display:grid;gap:10px;padding-top:13px;font-size:12px}}
.seo-payments-content>div{{background:#f8f9fa;padding:10px 12px;border-radius:9px}}
.seo-payments-content strong{{font-size:12px;font-weight:600}}
.seo-payments-content p{{font-size:11px;line-height:1.6;margin:4px 0 0;color:#5d6269}}
.seo-payments-content .seo-payment-note{{margin:0;color:#747880;font-size:10px}}
@media(max-width:600px){{.seo-buy-assurance{{padding:12px;margin:12px 0}}.seo-buy-benefit{{gap:8px}}}}
</style>
<style id="seo-header-css">{SEO_HEADER_CSS}\n{SEO_MENU_FIX}</style>



</head><body>
<script>window.__supgoSeoFilters={json.dumps(row.get("_filter_counts",{}),ensure_ascii=False).replace("<","\\u003c")};</script>

<script defer src="/componentes/header-loader.js?v=20261022-oculto-inicial6"></script>

<main class="product-page">
<nav class="seo-breadcrumb" aria-label="Ruta de navegación"><a href="/">SUPGO</a><span aria-hidden="true">›</span><a href="/laboratorios/">Laboratorios</a>{f'<span aria-hidden="true">›</span><a class="seo-breadcrumb-brand" href="/laboratorios/{slug(brand)}/">{esc(brand)}</a>' if brand else ''}<span aria-hidden="true">›</span><span class="seo-breadcrumb-current" aria-current="page">{esc(name)}</span></nav>
<article class="product-card">
<section class="product-gallery">{f'<div class="gallery-thumbs">{gallery_html}</div>' if len(gallery)>1 else ''}<div class="product-media"><button type="button" id="openZoom" class="zoom-image" aria-label="Ampliar imagen del producto">{img}<span class="zoom-hint">⌕ Ampliar</span></button></div>{f'<section class="related related-under-image"><div class="related-heading"><h2>Más de esta categoría</h2><div class="related-controls"><button type="button" class="related-prev" aria-label="Anteriores">‹</button><button type="button" class="related-next" aria-label="Siguientes">›</button></div></div><div class="related-grid">{related_html}</div></section>' if related_html else ''}</section>
<section class="product-info">
<h1>{esc(name)}{title_brand_html}</h1><div class="product-price">{price_html}</div>{offer_extra_html}
{f'<div class="variant-panel"><h3>Sabor: {esc(next((v["label"] for v in variants if str(v["id"])==str(pid)), ""))}</h3><div class="variant-grid">{variants_html}</div></div>' if len(variants)>1 else ''}
<div class="product-rule"></div>
<details class="seo-description"><summary>Descripción completa <span class="seo-chevron" aria-hidden="true"></span></summary><div class="product-description">{description_body}</div></details>
<div class="actions"><div class="seo-qty" aria-label="Seleccionar unidades"><button type="button" id="qtyMinus" aria-label="Restar unidad">−</button><output id="qtyValue" aria-live="polite">1</output><button type="button" id="qtyPlus" aria-label="Sumar unidad">+</button></div><button id="add" class="add" type="button">Agregar al carrito</button><button id="fav" class="fav" type="button" aria-label="Favoritos">♡</button></div><p id="notice" aria-live="polite"></p>
<section class="seo-buy-assurance" aria-label="Compra, envíos y pagos"><details class="seo-info-fold"><summary><span class="seo-info-icon" aria-hidden="true">✓</span><strong>Compra con confianza</strong><span class="seo-info-chevron" aria-hidden="true">⌄</span></summary><div class="seo-info-body">Confirma disponibilidad y presentación antes de pagar.</div></details>
<details class="seo-info-fold"><summary><span class="seo-info-icon" aria-hidden="true">🚚</span><strong>Envíos en Medellín y Colombia</strong><span class="seo-info-chevron" aria-hidden="true">⌄</span></summary><div class="seo-info-body">El costo se calcula por unidades del pedido.<div class="seo-shipping-table-wrap"><table class="seo-shipping-table"><thead><tr><th>Unidades</th><th>Medellín</th><th>Otras ciudades</th></tr></thead><tbody><tr><td>1</td><td>$11.000</td><td>$15.000</td></tr><tr><td>2</td><td>$7.000</td><td>$12.000</td></tr><tr><td>3</td><td>Gratis</td><td>$10.000</td></tr><tr><td>4+</td><td>Gratis</td><td>Gratis</td></tr></tbody></table></div><p>Medellín: pedidos confirmados antes de las 2:00 p. m. pueden salir en ruta el mismo día hábil. Ciudades principales: aproximadamente 1 día hábil desde la guía; otras zonas: 2 a 3 días hábiles, según cobertura.</p></div></details>
<details class="seo-info-fold"><summary><span class="seo-info-icon" aria-hidden="true">🔒</span><strong>Pago seguro</strong><span class="seo-info-chevron" aria-hidden="true">⌄</span></summary><div class="seo-info-body">Selecciona el medio de pago durante el proceso de compra.</div></details>
<details class="seo-info-fold"><summary><span class="seo-info-icon" aria-hidden="true">💳</span><strong>Medios de pago disponibles</strong><span class="seo-info-chevron" aria-hidden="true">⌄</span></summary><div class="seo-info-body seo-payment-image-wrap"><a href="https://static.wixstatic.com/media/251da0_0d41a59ba74a42959a1fb3a7e6ef28fd~mv2.jpg" target="_blank" rel="noopener noreferrer" aria-label="Ampliar medios de pago"><img src="https://static.wixstatic.com/media/251da0_0d41a59ba74a42959a1fb3a7e6ef28fd~mv2.jpg" alt="Medios de pago Lift Nutrientes: Bold, Apple Pay, tarjetas, Bre-B, Bancolombia, Nequi y PSE" loading="lazy" decoding="async"></a></div></details></section>
</section></article>

</main>
<style>
#seo-wa-float{{position:fixed;right:16px;bottom:calc(112px + env(safe-area-inset-bottom,0px));z-index:2147482000;font-family:Poppins,Arial,sans-serif}}
#seo-wa-toggle{{width:54px;height:54px;border:0;border-radius:50%;background:#25d366;color:#fff;box-shadow:0 5px 16px #0003;display:grid;place-items:center;cursor:pointer}}
#seo-wa-panel{{position:absolute;right:0;bottom:64px;width:min(315px,calc(100vw - 32px));box-sizing:border-box;padding:13px;background:#fff;border:1px solid #e2e2e2;border-radius:13px;box-shadow:0 8px 28px #0003}}
#seo-wa-panel[hidden]{{display:none!important}}
#seo-wa-message{{box-sizing:border-box;width:100%;min-height:80px;padding:11px;border:1px solid #ddd;border-radius:8px;font:14px/1.5 Poppins,Arial,sans-serif;color:#222;background:#fff;resize:vertical}}
#seo-wa-send{{margin-top:9px;width:100%;padding:11px;background:#25d366;color:white;border:0;border-radius:8px;font:600 14px Poppins,Arial,sans-serif}}
@media(min-width:768px){{#seo-wa-float{{bottom:26px;right:24px}}}}
</style>
<div id="seo-wa-float"><div id="seo-wa-panel" hidden><textarea id="seo-wa-message" aria-label="Mensaje para WhatsApp"></textarea><button id="seo-wa-send" type="button">Enviar por WhatsApp</button></div><button id="seo-wa-toggle" type="button" aria-label="Consultar por WhatsApp" aria-expanded="false" aria-controls="seo-wa-panel"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="29" height="29" fill="currentColor" aria-hidden="true"><path d="M16 .8A15.1 15.1 0 0 0 3 23.5L.8 31.2l7.9-2.1A15.2 15.2 0 1 0 16 .8Zm0 27.6a12.2 12.2 0 0 1-6.2-1.7l-.4-.2-4.7 1.2L6 23.1l-.3-.4A12.3 12.3 0 1 1 16 28.4Zm6.8-9.2c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.6c.2-.2.3-.4.4-.6.1-.3 0-.5 0-.7-.1-.2-.8-2-1.2-2.8-.3-.7-.6-.6-.8-.6h-.7c-.3 0-.7.1-1 .5s-1.3 1.3-1.3 3.1 1.4 3.6 1.6 3.9c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.4.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.7-.4Z"/></svg></button></div>
<div id="zoomOverlay" class="zoom-overlay" role="dialog" aria-modal="true" aria-label="Galería del producto" hidden><button type="button" id="zoomClose" class="zoom-close" aria-label="Cerrar galería">×</button><button type="button" id="zoomPrev" class="zoom-arrow zoom-prev" aria-label="Imagen anterior">‹</button><img id="zoomPhoto" class="zoom-photo" alt="{esc(name)}"><button type="button" id="zoomNext" class="zoom-arrow zoom-next" aria-label="Imagen siguiente">›</button><div id="zoomCounter" class="zoom-counter"></div></div>
<script>(function(){{
const gallery={gallery_json};
let current=0;
const overlay=document.getElementById('zoomOverlay'),zoomPhoto=document.getElementById('zoomPhoto'),mainPhoto=document.querySelector('.zoom-image img'),counter=document.getElementById('zoomCounter');
function display(i){{if(!gallery.length)return;current=(i+gallery.length)%gallery.length;zoomPhoto.src=gallery[current];counter.textContent=(current+1)+' / '+gallery.length;document.querySelectorAll('.gallery-thumb').forEach((b,n)=>b.classList.toggle('active',n===current));if(mainPhoto)mainPhoto.src=gallery[current];}}
document.querySelectorAll('.gallery-thumb').forEach(b=>b.addEventListener('click',()=>display(Number(b.dataset.index))));
document.getElementById('openZoom').addEventListener('click',()=>{{if(!gallery.length)return;display(current);overlay.hidden=false;document.body.style.overflow='hidden';}});
function closeZoom(){{overlay.hidden=true;document.body.style.overflow='';}}
document.getElementById('zoomClose').addEventListener('click',closeZoom);
document.getElementById('zoomPrev').addEventListener('click',()=>display(current-1));
document.getElementById('zoomNext').addEventListener('click',()=>display(current+1));
overlay.addEventListener('click',e=>{{if(e.target===overlay)closeZoom();}});
document.addEventListener('keydown',e=>{{if(overlay.hidden)return;if(e.key==='Escape')closeZoom();if(e.key==='ArrowLeft')display(current-1);if(e.key==='ArrowRight')display(current+1);}});
}})();</script>
<script>(function(){{
const p={product_json};const f=document.getElementById('fav'),note=document.getElementById('notice');
function read(k){{try{{const a=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(a)?a:[]}}catch(e){{return []}}}}
function paint(){{f.textContent=read('supgo_seo_favorites').some(x=>x.id===p.id)?'♥':'♡'}}
f.onclick=()=>{{let a=read('supgo_seo_favorites');a=a.some(x=>x.id===p.id)?a.filter(x=>x.id!==p.id):[...a,p];localStorage.setItem('supgo_seo_favorites',JSON.stringify(a));paint();note.textContent='Favoritos actualizados';}};
let selectedQuantity=1; const qtyValue=document.getElementById('qtyValue');const showQuantity=()=>{{qtyValue.textContent=String(selectedQuantity);}};document.getElementById('qtyMinus').onclick=()=>{{selectedQuantity=Math.max(1,selectedQuantity-1);showQuantity();}};document.getElementById('qtyPlus').onclick=()=>{{selectedQuantity=Math.min(99,selectedQuantity+1);showQuantity();}};document.getElementById('add').onclick=()=>{{
 const key=String(p.id),cartKey='liftCartV2',metaKey='liftCartMetaV1';
 let cart={{}},meta={{}};
 try{{cart=JSON.parse(localStorage.getItem(cartKey)||'{{}}')||{{}};meta=JSON.parse(localStorage.getItem(metaKey)||'{{}}')||{{}};}}catch(error){{}}
 const previous=cart[key],qty=Number(typeof previous==='object'?(previous.quantity??previous.qty):previous)||0;
 cart[key]=qty+selectedQuantity;meta[key]={{name:p.name,image:p.image,price:p.price}};
 localStorage.setItem(cartKey,JSON.stringify(cart));localStorage.setItem(metaKey,JSON.stringify(meta));
 window.dispatchEvent(new Event('supgo-cart-change'));
 note.textContent=selectedQuantity+' unidad(es) agregada(s) al carrito';selectedQuantity=1;showQuantity();
 const button=document.querySelector('#supgo-global-header .cartDesktop');if(button)button.click();
}};
paint();
}})();</script>
<script>
(()=>{{
 const button=document.getElementById('seo-wa-toggle'),panel=document.getElementById('seo-wa-panel'),field=document.getElementById('seo-wa-message'),send=document.getElementById('seo-wa-send');
 if(!button||!panel||!field||!send)return;
 const name=document.querySelector('.product-info h1')?.childNodes[0]?.textContent?.trim()||'este producto';
 field.value='Hola, estoy interesado en '+name+'. ¿Está disponible?';
 button.addEventListener('click',()=>{{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));}});
 send.addEventListener('click',()=>{{location.href='https://api.whatsapp.com/send?phone=573137380766&text='+encodeURIComponent(field.value+'\\n'+location.href);}});
}})();
</script>
<script>
document.addEventListener('DOMContentLoaded',function(){{if(window.matchMedia('(max-width:700px)').matches){{var gallery=document.querySelector('.product-card .product-gallery');var card=document.querySelector('.product-card');var related=gallery&&gallery.querySelector('.related-under-image');if(card&&related)card.insertAdjacentElement('afterend',related);}}}});
document.addEventListener('DOMContentLoaded',function(){{document.querySelectorAll('.related-under-image').forEach(function(section){{var track=section.querySelector('.related-grid');if(!track)return;section.querySelector('.related-prev').addEventListener('click',function(){{track.scrollBy({{left:-track.clientWidth*.75,behavior:'smooth'}});}});section.querySelector('.related-next').addEventListener('click',function(){{track.scrollBy({{left:track.clientWidth*.75,behavior:'smooth'}});}});}});}});
</script></body></html>'''

def build_direct(row, shared):
  """Ficha SEO independiente sin encabezados añadidos."""
  return build(row)

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
 images_by_product=fetch_product_images()
 offers=fetch_offers()
 merchant_settings=fetch_merchant_settings()
 for row in rows:
  row["_images"]=images_by_product.get(str(row["id"]),[])
  row["_seo"]=seo_rows.get(str(row["id"]),{})
  row["_offer"]=offers.get(str(row["id"]))
  row["_merchant_settings"]=merchant_settings
 products_by_id={str(row["id"]):row["product"] for row in rows}
 for row in rows:row["_products_by_id"]=products_by_id
 filter_counts=seo_filter_data(rows,fetch_lab_logos())
 for row in rows: row["_filter_counts"]=filter_counts
 allowed_brands=fetch_allowed_brands()
 valid=[r for r in rows if allowed(r)]
 for r in valid:
  r['_indexable']=str((r['product'].get('brand') or r['product'].get('marca') or 'SIN MARCA')).strip().casefold() in allowed_brands
 brand_only=os.getenv("SEO_BRAND_ONLY","").strip().casefold()
 if brand_only:
  if brand_only not in allowed_brands:raise RuntimeError("Marca no habilitada para SEO: "+brand_only)
  valid=[r for r in valid if str((r["product"].get("brand") or r["product"].get("marca") or "")).strip().casefold()==brand_only]
 preview_id=os.getenv("SEO_PREVIEW_ID","").strip()
 if preview_id:
  valid=[r for r in valid if str(r["id"])==preview_id]
  if not valid: raise RuntimeError("Producto de prueba no encontrado: "+preview_id)
 if not valid: raise RuntimeError("No hay productos validos para generar")
 def info(item):
  p=item["product"];name=str(p.get("name") or p.get("nombre") or "")
  return {"id":item["id"],"name":name,"brand":str(p.get("brand") or p.get("marca") or ""),"image":str(p.get("image") or p.get("imagen") or ""),"url":BASE+"/productos/"+(slug(name) or "producto")+"-"+str(item["id"])+".html","label":str(p.get("flavor") or p.get("sabor") or p.get("presentation") or p.get("presentacion") or name),"on_offer":active_offer(item) is not None}
 # Agrupar sabores por familia y presentación sin mezclar tamaños diferentes.
 # Priorizar el identificador padre cuando existe; en su ausencia, eliminar
 # exclusivamente el sabor declarado en Supabase del final del nombre.
 def family_key(item):
  p=item["product"]
  brand=slug(p.get("brand") or p.get("marca") or "")
  parent=str(p.get("parent_id") or p.get("producto_padre_id") or p.get("id_padre_sabor") or "").strip()
  if parent:return ("parent",brand,parent)
  name=slug(p.get("name") or p.get("nombre") or "")
  flavor=slug(p.get("flavor") or p.get("sabor") or "")
  if flavor:
   if name.endswith("-"+flavor):name=name[:-(len(flavor)+1)]
   else:
    # Los nombres abreviados pueden contener solo el inicio del sabor.
    words=flavor.split("-")
    for count in range(len(words)-1,0,-1):
     short="-".join(words[:count])
     if name.endswith("-"+short):
      name=name[:-(len(short)+1)]
      break
  return ("name",brand,name)
 entries=[(item,info(item)) for item in valid]
 families={}
 for item,d in entries:
  families.setdefault(family_key(item),[]).append(d)
 # Recuperar variaciones cuyo campo sabor no coincide con su nombre.
 # Se exige igual marca y prefijo completo de familia (incluye presentacion).
 for item,d in entries:
  key=family_key(item)
  if key[0]!="name" or len(families[key])!=1:continue
  name_slug=slug(d["name"])
  possible=[k for k,v in families.items() if k!=key and k[0]=="name" and k[1]==key[1] and len(v)>=2 and name_slug.startswith(k[2]+"-")]
  if possible:
   target=max(possible,key=lambda k:len(k[2]))
   families[target].append(d)
   families[key].remove(d)
 group_by_id={str(v["id"]):group for group in families.values() for v in group}
 for item,d in entries:
  variants=group_by_id[str(item["id"])]
  # Si la ficha dice Brownie pero el sabor almacenado dice Chocolate,
  # mostrar el sabor real deducido del nombre, sin cambiar Supabase.
  if len(variants)>1:
   group_key=next((k for k,v in families.items() if v is variants and k[0]=="name"),None)
   if group_key:
    count=len(group_key[2].split("-"))
    for v in variants:
     if slug(v["name"]).startswith(group_key[2]+"-"):
      suffix=" ".join(v["name"].split()[count:]).strip()
      if suffix:v["label"]=suffix
  item["_variants"]=variants[:24]
  # Compartir imágenes secundarias entre sabores de una misma familia/presentación.
  # Nunca sustituir la imagen principal de cada variante.
  shared_secondary=[]
  for sibling in variants:
   sibling_row=next((candidate for candidate,info in entries if str(candidate["id"])==str(sibling["id"])),None)
   if sibling_row is None:continue
   for secondary in sibling_row.get("_images",[]):
    if secondary and secondary not in shared_secondary:
     shared_secondary.append(secondary)
  own_primary=str(p.get("image") or p.get("imagen") or "") if (p:=item["product"]) else ""
  own_secondary=item.get("_images",[])
  item["_images"]=list(dict.fromkeys([u for u in own_secondary+shared_secondary if u and u!=own_primary]))
  excluded={str(v["id"]) for v in variants}
  p=item["product"]
  cat=str(p.get("category") or p.get("categoria") or "").casefold();brand=d["brand"].casefold()
  item["_related"]=[v for other,v in entries if str(v["id"]) not in excluded and (cat and str(other["product"].get("category") or other["product"].get("categoria") or "").casefold()==cat)][:12]
 OUT.mkdir(exist_ok=True)
 shared=None  # Las fichas usan estilos propios y no heredan la skin del index.
 urls=[]
 for row in valid:
  filename,content=build_direct(row,shared)
  # Mantener la URL histórica de Hyper ID 450, pero usar la plantilla SEO vigente.
  # La ficha heredada apuntaba a /catalogo/assets/producto.css y .js inexistentes.
  if str(row["id"])=="450":
   legacy_filename="factor-sabor-lemon-lychee-30serv-bcaa-hyper.html"
   generated_url=BASE+"/productos/"+filename
   legacy_url=BASE+"/productos/"+legacy_filename
   content=content.replace(generated_url,legacy_url)
   filename=legacy_filename
  destination=OUT/filename
  # Protección: nunca reemplazar fichas existentes salvo autorización explícita.
  if not destination.exists() or os.getenv("SEO_OVERWRITE_EXISTING","0")=="1":
   destination.write_text(content,encoding="utf-8")
  if row.get("_indexable",True): urls.append(BASE+"/productos/"+filename)
 sitemap=('<?xml version="1.0" encoding="UTF-8"?>' + chr(10) + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + chr(10) + ''.join("<url><loc>"+esc(u)+"</loc></url>"+chr(10) for u in urls) + "</urlset>" + chr(10))
 if not preview_id and not brand_only: (ROOT/"sitemap-productos.xml").write_text(sitemap,encoding="utf-8")
 print("Generadas",len(urls),"fichas SEO independientes sin skin.")
if __name__=="__main__": main()

# SEO SUPGO: regenerar páginas tras actualizar las nueve fichas ISO100 Medellín (2026-10-21).
