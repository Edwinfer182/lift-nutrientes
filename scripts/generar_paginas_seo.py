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
def allowed(row):
 p=row.get("product")
 if not isinstance(p,dict) or not (p.get("name") or p.get("nombre")):return False
 if row.get("activo") is False or p.get("__deleted") or p.get("__private") or p.get("adminOnly") or p.get("hidden") or p.get("oculto"):return False
 return True
def build(row):
 p=row["product"]; name=str(p.get("name") or p.get("nombre")); pid=row["id"]
 key=slug(name) or "producto"; filename=f"{key}-{pid}.html"
 canonical=f"{BASE}/productos/{filename}"
 brand=str(p.get("brand") or p.get("marca") or "")
 description=str(p.get("description") or p.get("descripcion") or "").strip()
 image=str(p.get("image") or p.get("imagen") or "")
 price=p.get("price",p.get("precio"))
 try: amount=float(price); valid_price=amount>0
 except (ValueError,TypeError):valid_price=False;amount=0
 title=(name+" | Lift Nutrientes")[:140]
 meta=(description or f"Consulta {name} de {brand} en Lift Nutrientes. Presentaciones, precio y disponibilidad en Colombia.")[:160]
 product_schema={"@context":"https://schema.org","@type":"Product","name":name,"url":canonical,"sku":str(pid)}
 if brand:product_schema["brand"]={"@type":"Brand","name":brand}
 if image:product_schema["image"]=[image]
 if description:product_schema["description"]=description
 if valid_price:product_schema["offers"]={"@type":"Offer","url":canonical,"priceCurrency":"COP","price":int(amount) if amount.is_integer() else amount,"availability":"https://schema.org/InStock" if p.get("stock") is True else "https://schema.org/LimitedAvailability"}
 schema=json.dumps(product_schema,ensure_ascii=False).replace("<","\\u003c")
 # SEO legible incluso si falla JavaScript. La experiencia interactiva se abre en el catálogo.
 img=f'<img src="{esc(image)}" alt="{esc(name)}" loading="eager" width="420" style="width:100%;max-height:430px;object-fit:contain">' if image else ""
 price_html=f'<p class="price">$ {int(amount):,}</p>'.replace(",","\u002e") if valid_price else "<p>Consultar precio</p>"
 return filename, f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(meta)}">
<link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="product">
<meta property="og:title" content="{esc(name)}"><meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{esc(canonical)}"><meta property="og:image" content="{esc(image)}">
<script type="application/ld+json">{schema}</script>
<style>body{{margin:0;color:#151515;background:#fff;font-family:Poppins,Arial,sans-serif}}header{{background:#090909;color:white;padding:20px 5%}}header a{{color:white;text-decoration:none;font-weight:700}}nav{{padding:16px 5%;border-bottom:1px solid #ddd;display:flex;gap:20px;flex-wrap:wrap}}nav a{{color:#222;text-decoration:none}}main{{max-width:1150px;margin:35px auto;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:35px}}h1{{font-size:30px}}.price{{font-size:26px;font-weight:bold}}.btn{{display:inline-block;background:#111;color:white;padding:14px 20px;text-decoration:none;margin:8px 8px 8px 0}}footer{{padding:35px 5%;border-top:1px solid #ddd}}@media(max-width:700px){{main{{grid-template-columns:1fr}}}}</style>
</head><body><header><a href="{BASE}/">LIFT NUTRIENTES</a></header>
<nav><a href="{BASE}/">Inicio</a><a href="{BASE}/?ofertas=1">Ofertas</a><a href="{BASE}/?categoria={urllib.parse.quote(str(p.get('category') or ''))}">Categoría: {esc(p.get('category') or 'Ver todas')}</a><a href="{BASE}/?marca={urllib.parse.quote(brand)}">Laboratorio: {esc(brand or 'Ver todos')}</a></nav>
<main><section>{img}</section><section><p>{esc(brand)}</p><h1>{esc(name)}</h1>{price_html}
<p>{esc(description or "Consulta presentaciones, sabores y disponibilidad de este producto.")}</p>
<a class="btn" href="{BASE}/?producto={pid}">Ver opciones y agregar al carrito</a>
<a class="btn" href="{BASE}/?ofertas=1">Ver ofertas</a></section></main>
<footer>Lift Nutrientes · <a href="{BASE}/">supgo.co</a></footer></body></html>'''

def main():
 rows=fetch()
 valid=[r for r in rows if allowed(r)]
 preview_id=os.getenv("SEO_PREVIEW_ID","").strip()
 if preview_id:
  valid=[r for r in valid if str(r["id"])==preview_id]
  if not valid: raise RuntimeError("Producto de prueba no encontrado: "+preview_id)
 if not valid: raise RuntimeError("No hay productos validos para generar")
 OUT.mkdir(exist_ok=True)
 urls=[]
 for row in valid:
  filename,content=build(row)
  (OUT/filename).write_text(content,encoding="utf-8")
  urls.append(BASE+"/productos/"+filename)
 sitemap='<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'+''.join("<url><loc>"+esc(u)+"</loc></url>\\n" for u in urls)+"</urlset>\\n"
 if not preview_id: (ROOT/"sitemap-productos.xml").write_text(sitemap,encoding="utf-8")
 print("Generadas",len(urls),"paginas HTML sin iframe; no se eliminaron archivos anteriores.")
if __name__=="__main__": main()
