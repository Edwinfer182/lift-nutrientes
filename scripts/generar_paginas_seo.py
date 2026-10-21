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
 variants_html=''.join('<a class="option'+(' selected' if str(v["id"])==str(pid) else '')+'" href="'+esc(v["url"])+'" title="'+esc(v["label"])+'">'+('<span class="option-photo"><img src="'+esc(v["image"])+'" alt="'+esc(v["label"])+'" loading="lazy"></span>' if v["image"] else '<span class="option-photo option-empty">Sin foto</span>')+'<span class="option-label">'+esc(v["label"])+'</span></a>' for v in variants)
 related_html=''.join('<a class="related-item" href="'+esc(v["url"])+'">'+('<img loading="lazy" src="'+esc(v["image"])+'" alt="'+esc(v["name"])+'">' if v["image"] else '')+'<strong>'+esc(v["name"])+'</strong><small>'+esc(v["brand"])+'</small></a>' for v in related)
 product_json=json.dumps({"id":str(pid),"name":name,"image":image,"price":amount,"url":canonical},ensure_ascii=False).replace("<","\\u003c")
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
@media(max-width:760px){{.product-page{{padding:12px 12px 48px}}.product-card{{grid-template-columns:1fr;border-radius:12px}}.product-media{{min-height:0;aspect-ratio:1.1;border-right:0;border-bottom:1px solid var(--line);padding:25px}}.product-media img{{max-height:370px}}.product-info{{padding:28px 24px 36px}}h1{{margin-bottom:20px}}}}
.seo-description{{width:100%;border-bottom:1px solid var(--line);margin:6px 0 20px}}.seo-description summary{{display:flex;align-items:center;justify-content:space-between;gap:16px;list-style:none;cursor:pointer;padding:16px 0;font-size:15px;font-weight:650}}.seo-description summary::-webkit-details-marker{{display:none}}.seo-chevron{{height:9px;width:9px;border-right:1.7px solid currentColor;border-bottom:1.7px solid currentColor;transform:rotate(45deg);transition:transform .2s;margin-right:5px}}.seo-description[open] .seo-chevron{{transform:rotate(225deg)}}.seo-description .product-description{{padding:2px 0 20px;margin:0;max-width:100%;overflow-wrap:anywhere}}.seo-description .product-description p{{margin:0 0 14px}}.seo-description .product-description h2,.seo-description .product-description h3{{font-size:18px;line-height:1.35;color:#222;margin:22px 0 10px}}.seo-description .product-description ul,.seo-description .product-description ol{{padding-left:22px;margin:10px 0 18px}}.seo-description .product-description img{{max-width:100%;height:auto}}.seo-description .product-description table{{display:block;max-width:100%;overflow-x:auto}}.option{{display:inline-flex;flex-direction:column;align-items:center;gap:7px;vertical-align:top;width:100px;max-width:calc(33.333% - 12px);padding:9px;border:1px solid #e5e5e5;border-radius:7px;text-decoration:none;color:#222;margin:5px;font-size:12px;text-align:center;background:#fff}}.option-photo{{width:76px;height:76px;display:grid;place-items:center;background:#fafafa;border-radius:4px;overflow:hidden}}.option-photo img{{width:100%;height:100%;object-fit:contain}}.option-empty{{font-size:10px;color:#aaa}}.option-label{{width:100%;line-height:1.3;overflow-wrap:anywhere}}.option.selected{{background:#111;color:white}}.actions{{display:flex;gap:10px;margin-top:22px;width:100%}}button{{cursor:pointer;font:inherit}}.add{{background:#111;color:#fff;border:0;border-radius:5px;padding:14px 20px;flex:1;font-weight:600}}.fav{{background:white;border:1px solid #ddd;border-radius:5px;padding:10px 16px;font-size:23px}}.related{{margin-top:45px}}.related-grid{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}}.related-item{{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #eee;padding:14px;text-decoration:none;color:#111;border-radius:6px}}.related-item img{{height:160px;width:100%;object-fit:contain}}.related-item strong{{font-size:14px}}.related-item small{{color:#777}}@media(max-width:760px){{.related-grid{{grid-template-columns:repeat(2,1fr)}}.related-item img{{height:115px}}}}

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
.option{{margin:0;width:110px;max-width:none;padding:10px 8px;gap:6px;border-radius:14px;border:1px solid #dedede;background:white;font-size:12px;transition:border-color .15s,box-shadow .15s}}
.option:hover{{border-color:#888}}
.option.selected{{background:white;color:#111;border:2px solid #111;box-shadow:0 2px 5px rgba(0,0,0,.07);padding:9px 7px}}
.option-photo{{width:90px;height:90px;background:transparent}}
.option-label{{font-size:12px;line-height:1.25}}
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
@media(max-width:700px){{.product-page{{padding:12px 12px 40px}}.product-card{{grid-template-columns:1fr;gap:22px}}.product-media{{aspect-ratio:1.15;min-height:0;border-radius:18px;padding:22px}}.product-media img{{max-height:380px}}.product-info{{padding:0 3px}}.product-info h1{{font-size:30px}}.variant-panel{{padding:12px}}.variant-grid{{gap:8px}}.option{{width:calc(33.333% - 6px)}}.option-photo{{width:100%;height:76px}}.related-grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}.related-item img{{height:120px}}}}

.product-gallery{{min-width:0}}.product-gallery .product-media{{width:100%;height:auto}}.zoom-image{{display:flex;position:relative;align-items:center;justify-content:center;width:100%;height:100%;min-height:inherit;padding:0;background:transparent;border:0;cursor:zoom-in}}.zoom-image img{{max-width:100%;max-height:510px;object-fit:contain}}.zoom-hint{{position:absolute;right:8px;bottom:8px;font-size:11px;background:#fff;border:1px solid #eee;border-radius:20px;padding:7px 10px;color:#444}}.gallery-thumbs{{display:flex;gap:9px;overflow-x:auto;padding:13px 2px 3px}}.gallery-thumb{{flex:0 0 72px;width:72px;height:72px;border:1px solid #ddd;border-radius:9px;background:#fff;padding:6px;cursor:pointer}}.gallery-thumb.active{{border:2px solid #111;padding:5px}}.gallery-thumb img{{width:100%;height:100%;object-fit:contain}}.zoom-overlay[hidden]{{display:none!important}}.zoom-overlay{{position:fixed;inset:0;z-index:99999;background:rgba(12,12,14,.94);display:flex;align-items:center;justify-content:center;padding:50px 70px}}.zoom-photo{{max-width:100%;max-height:calc(100vh - 110px);object-fit:contain;user-select:none}}.zoom-close,.zoom-arrow{{position:absolute;border:0;background:rgba(255,255,255,.12);color:white;cursor:pointer;border-radius:50%;display:grid;place-items:center}}.zoom-close{{right:18px;top:16px;width:43px;height:43px;font-size:30px}}.zoom-arrow{{top:50%;transform:translateY(-50%);width:45px;height:45px;font-size:35px}}.zoom-prev{{left:15px}}.zoom-next{{right:15px}}.zoom-counter{{position:absolute;bottom:17px;color:white;font-size:13px}}@media(max-width:700px){{.zoom-overlay{{padding:60px 42px}}.zoom-arrow{{width:34px;height:34px;font-size:28px}}.zoom-prev{{left:4px}}.zoom-next{{right:4px}}.gallery-thumb{{flex-basis:62px;width:62px;height:62px}}}}

/* Ficha SEO: ajustes móviles para impedir imágenes gigantes y desbordamientos */
@media(max-width:700px){{
 html,body{{width:100%;max-width:100%;overflow-x:hidden}}
 .product-page{{width:100%;max-width:100%;padding:12px 14px 42px;margin:0 auto}}
 .product-card{{display:flex;flex-direction:column;gap:18px;width:100%;min-width:0;overflow:visible}}
 .product-gallery{{width:100%;min-width:0;max-width:100%;overflow:hidden}}
 .product-gallery .product-media{{width:100%;min-height:0!important;height:auto!important;aspect-ratio:1 / 1!important;padding:16px!important;border:1px solid #ededed;border-radius:17px;box-shadow:none;overflow:hidden;display:flex;align-items:center;justify-content:center}}
 .product-gallery .zoom-image{{display:flex;width:100%;height:100%;min-height:0!important;max-height:100%;align-items:center;justify-content:center;overflow:hidden}}
 .product-gallery .zoom-image img{{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;mix-blend-mode:normal}}
 .zoom-hint{{right:8px;bottom:8px;padding:6px 9px;font-size:11px;line-height:1.2}}
 .gallery-thumbs{{display:flex;gap:9px;padding:12px 1px 3px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin}}
 .gallery-thumb{{flex:0 0 62px;width:62px;height:62px;padding:5px;border-radius:10px}}
 .gallery-thumb img{{width:100%;height:100%;object-fit:contain}}
 .product-info{{width:100%;min-width:0;padding:0 2px;align-items:stretch}}
 .product-brand{{margin:0 0 8px;font-size:11px;letter-spacing:.11em}}
 .product-info h1{{font-size:clamp(25px,7vw,33px);line-height:1.2;margin:0 0 10px;letter-spacing:-.03em}}
 .product-price{{font-size:clamp(26px,7vw,33px);margin:0 0 15px}}
 .product-price strong{{font-size:clamp(26px,7vw,33px)!important}}
 .variant-panel{{margin:0 0 16px;padding:12px;border-radius:13px}}
 .variant-grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}}
 .option{{width:100%;max-width:100%;margin:0;min-width:0;padding:7px 5px;border-radius:10px}}
 .option.selected{{padding:6px 4px}}
 .option-photo{{width:100%;height:66px}}
 .option-label{{font-size:11px}}
 .seo-description{{margin:0 0 16px}}
 .seo-description summary{{padding:16px 3px;font-size:14px}}
 .actions{{gap:9px;margin-top:0;width:100%}}
 .add{{min-width:0;padding:14px 12px;border-radius:11px;font-size:13px}}
 .fav{{min-width:54px;padding:9px;border-radius:11px;font-size:21px}}
 .related{{margin-top:28px}}
 .related-grid{{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}}
 .related-item{{min-width:0;padding:10px;border-radius:11px}}
 .related-item img{{height:120px}}
 .zoom-overlay{{padding:65px 38px}}
 .zoom-photo{{max-width:100%;max-height:calc(100dvh - 140px)}}
}}

</style>
</head><body>
<script defer src="/componentes/header-loader.js?v=20261020-filter-layout12"></script>

<main class="product-page">
<article class="product-card">
<section class="product-gallery"><div class="product-media"><button type="button" id="openZoom" class="zoom-image" aria-label="Ampliar imagen del producto">{img}<span class="zoom-hint">⌕ Ampliar</span></button></div>{f'<div class="gallery-thumbs">{gallery_html}</div>' if len(gallery)>1 else ''}</section>
<section class="product-info">
<p class="product-brand">{esc(brand)}</p>
<h1>{esc(name)}</h1><div class="product-price">{price_html}</div>
{f'<div class="variant-panel"><h3>Sabor: {esc(next((v["label"] for v in variants if str(v["id"])==str(pid)), ""))}</h3><div class="variant-grid">{variants_html}</div></div>' if len(variants)>1 else ''}
<div class="product-rule"></div>
<details class="seo-description"><summary>Descripción completa <span class="seo-chevron" aria-hidden="true"></span></summary><div class="product-description">{description_body}</div></details>
<div class="actions"><button id="add" class="add" type="button">Agregar al carrito</button><button id="fav" class="fav" type="button" aria-label="Favoritos">♡</button></div><p id="notice" aria-live="polite"></p>
</section></article>
{f'<section class="related"><h2>Productos relacionados</h2><div class="related-grid">{related_html}</div></section>' if related_html else ''}
</main>
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
document.getElementById('add').onclick=()=>{{
 const key=String(p.id),cartKey='liftCartV2',metaKey='liftCartMetaV1';
 let cart={{}},meta={{}};
 try{{cart=JSON.parse(localStorage.getItem(cartKey)||'{{}}')||{{}};meta=JSON.parse(localStorage.getItem(metaKey)||'{{}}')||{{}};}}catch(error){{}}
 const previous=cart[key],qty=Number(typeof previous==='object'?(previous.quantity??previous.qty):previous)||0;
 cart[key]=qty+1;meta[key]={{name:p.name,image:p.image,price:p.price}};
 localStorage.setItem(cartKey,JSON.stringify(cart));localStorage.setItem(metaKey,JSON.stringify(meta));
 window.dispatchEvent(new Event('supgo-cart-change'));
 note.textContent='Agregado al carrito';
 const button=document.querySelector('#supgo-global-header .cartDesktop');if(button)button.click();
}};
paint();
}})();</script>
</body></html>'''

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
 def info(item):
  p=item["product"];name=str(p.get("name") or p.get("nombre") or "")
  return {"id":item["id"],"name":name,"brand":str(p.get("brand") or p.get("marca") or ""),"image":str(p.get("image") or p.get("imagen") or ""),"url":BASE+"/productos/"+(slug(name) or "producto")+"-"+str(item["id"])+".html","label":str(p.get("flavor") or p.get("sabor") or p.get("presentation") or p.get("presentacion") or name)}
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
 for item,d in entries:
  variants=families[family_key(item)]
  item["_variants"]=variants[:24]
  excluded={str(v["id"]) for v in variants}
  p=item["product"]
  cat=str(p.get("category") or p.get("categoria") or "").casefold();brand=d["brand"].casefold()
  item["_related"]=[v for other,v in entries if str(v["id"]) not in excluded and ((cat and str(other["product"].get("category") or other["product"].get("categoria") or "").casefold()==cat) or (brand and v["brand"].casefold()==brand))][:4]
 OUT.mkdir(exist_ok=True)
 shared=None  # Las fichas usan estilos propios y no heredan la skin del index.
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
 print("Generadas",len(urls),"fichas SEO independientes sin skin.")
if __name__=="__main__": main()
