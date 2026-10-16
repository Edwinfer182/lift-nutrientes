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
<nav><a href="{BASE}/">Inicio</a><a href="{BASE}/?ofertas=1">Ofertas</a><a href="{BASE}/">Categorías y laboratorios</a></nav>
<main><section>{img}</section><section><p>{esc(brand)}</p><h1>{esc(name)}</h1>{price_html}
<p>{esc(description or "Consulta presentaciones, sabores y disponibilidad de este producto.")}</p>
<a class="btn" href="{BASE}/?producto={pid}">Ver opciones y agregar al carrito</a>
<a class="btn" href="{BASE}/?ofertas=1">Ver ofertas</a></section></main>
<footer>Lift Nutrientes · <a href="{BASE}/">supgo.co</a></footer></body></html>'''

def build_viewer():
 """Una sola copia de la interfaz real; cada ficha la carga con su ID."""
 source=(ROOT/"index.html").read_text(encoding="utf-8")
 css=r"""
<style id="seo-product-viewer">
body.seoProductView .hero,body.seoProductView .liftBanners,body.seoProductView #grid,
body.seoProductView .status,body.seoProductView .chips{display:none!important}
body.seoProductView .layout{display:grid!important;grid-template-columns:var(--side,292px) minmax(0,1fr)!important;max-width:1500px!important;margin:auto!important}
body.seoProductView .sidebar{display:block!important;position:sticky!important;top:12px!important;align-self:start!important;height:calc(100vh - 32px)!important;max-height:calc(100vh - 32px)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;scrollbar-width:thin!important}
body.seoProductView .content{width:100%!important;min-width:0!important;margin:0!important;max-width:none!important;padding:15px!important}
body.seoProductView #liftMonoBackdrop,body.seoProductView #liftMonoClose,body.seoProductView .liftMonoPageLink,body.seoProductView .liftMonoClose,body.seoProductView .liftMonoOverlay{display:none!important;visibility:hidden!important;pointer-events:none!important}
body.seoProductView #liftMonoOff,body.seoProductView #liftMonoOff.open{position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;inset:auto!important;transform:none!important;opacity:1!important;visibility:visible!important;width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;min-height:450px!important;overflow:visible!important;box-shadow:none!important;border:0!important;border-radius:0!important;display:block!important;z-index:auto!important;margin:0!important;padding:0!important;background:#fff!important}
body.seoProductView #liftMonoBody{height:auto!important;max-height:none!important;overflow:visible!important}body.seoProductView #liftMonoOff header,body.seoProductView #liftMonoOff .liftMonoHead{position:relative!important}body.seoProductView .content #liftMonoOff{isolation:isolate!important}html:has(body.seoProductView),body.seoProductView{height:auto!important;min-height:0!important;overflow-y:hidden!important}body.seoProductView #liftMonoOff,body.seoProductView #liftMonoBody{overflow-y:visible!important}html:has(body.seoProductView){overflow:hidden!important}body.seoProductView{overflow:hidden!important}body.seoProductView footer{position:relative!important}
@media(max-width:760px){body.seoProductView .layout{display:block!important}body.seoProductView .sidebar{display:block!important;position:relative!important;top:auto!important;height:220px!important;max-height:220px!important;overflow-y:auto!important;overflow-x:hidden!important}body.seoProductView .content{padding:5px!important}}
</style>
"""
 js=r"""
<script id="seo-product-viewer-script">
(function(){
 const id=new URLSearchParams(location.search).get('id');
 document.documentElement.style.setProperty('overflow','hidden','important');
 const base='https://supgo.co/';
 function resize(){try{const h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,document.body.getBoundingClientRect().height);parent.postMessage({type:'liftSeoHeight',height:h+12},location.origin)}catch(e){}}
 function start(){
  document.body.classList.add('seoProductView');
  document.body.style.setProperty('overflow','hidden','important');
  const main=document.querySelector('.content');
  if(!main||!id)return;
  let count=0;
  const timer=setInterval(function(){
   const p=(window.PRODUCTS||[]).find(x=>String(x.id)===String(id));
   if(p&&typeof window.openLiftProductById==='function'){
    window.openLiftProductById(id);
    const panel=document.getElementById('liftMonoOff');
    if(panel){
     main.appendChild(panel);panel.classList.remove('open');
     document.getElementById('liftMonoBackdrop')?.classList.remove('open');
     document.getElementById('liftMonoBackdrop')?.remove();
     document.getElementById('liftMonoClose')?.remove();
     panel.querySelectorAll('.liftMonoClose,.liftMonoPageLink').forEach(el=>el.remove());
     document.body.style.setProperty('overflow','hidden','important');
     clearInterval(timer);resize();
     if(window.ResizeObserver)new ResizeObserver(resize).observe(document.body);
     setTimeout(resize,1000);setTimeout(resize,3000);setInterval(resize,1500);
    }
   }
   if(++count>120)clearInterval(timer);
  },200);
  document.addEventListener('click',function(e){
   const el=e.target.closest('a[href],button,[role="button"]');
   if(!el)return;
   const href=el.getAttribute('href');
   if(href&&!href.startsWith('#')&&!href.startsWith('javascript:')){e.preventDefault();e.stopImmediatePropagation();parent.location.assign(new URL(href,base).href);return;}
   const label=((el.textContent||'')+' '+(el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'')).trim().toLowerCase();
   const offers=/ofertas/.test(label);
   const logo=!!el.closest('header')&&(/inicio|logo|lift nutrientes/.test(label)||!!el.querySelector('img'));
   if(offers||logo){e.preventDefault();e.stopImmediatePropagation();parent.location.assign(base+(offers?'?ofertas=1':''));return;}
   document.getElementById('liftMonoBackdrop')?.classList.remove('open');
   setTimeout(resize,100);
  },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
</script>
"""
 # El visor se basa en el index original; no modifica el index publicado.
 source=source.replace("</head>",css+"</head>",1)
 source=source.replace("</body>",js+"</body>",1)
 (ROOT/"producto-vista.html").write_text(source,encoding="utf-8")

def wrap_product(row):
 """HTML SEO legible en origen y visor compartido con el diseño del catálogo."""
 p=row["product"];pid=row["id"]
 filename,original=build(row)
 # Conserva las etiquetas SEO y los datos estructurados del HTML original.
 head=original.split("</head>",1)[0]+"</head>"
 name=str(p.get("name") or p.get("nombre"))
 description=str(p.get("description") or p.get("descripcion") or "")
 image=str(p.get("image") or p.get("imagen") or "")
 brand=str(p.get("brand") or p.get("marca") or "")
 img=('<img loading="lazy" width="200" alt="'+esc(name)+'" src="'+esc(image)+'">') if image else ""
 return filename,head+"""
<body style="margin:0;font-family:Poppins,Arial,sans-serif">
<iframe id="liftProductFrame" title="Ficha de producto y opciones de compra" src="/producto-vista.html?id="""+str(pid)+"""" scrolling="no" style="display:block;width:100%;height:1200px;border:0;overflow:hidden" loading="eager"></iframe>
<script>
window.addEventListener('message',function(e){
 if(e.origin!==location.origin||e.source!==document.getElementById('liftProductFrame').contentWindow)return;
 if(e.data&&e.data.type==='liftSeoHeight'&&Number.isFinite(e.data.height))
  document.getElementById('liftProductFrame').style.height=Math.min(30000,Math.max(650,e.data.height))+'px';
});
</script></body></html>"""

def main():
 rows=fetch();valid=[r for r in rows if allowed(r)]
 if not valid:raise RuntimeError("No se recibieron productos válidos")
 build_viewer()
 OUT.mkdir(exist_ok=True)
 urls=[]
 for row in valid:
  filename,content=wrap_product(row)
  (OUT/filename).write_text(content,encoding="utf-8")
  urls.append(BASE+"/productos/"+filename)
 sitemap='<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'+''.join("<url><loc>"+esc(u)+"</loc></url>\\n" for u in urls)+"</urlset>\\n"
 (ROOT/"sitemap-productos.xml").write_text(sitemap,encoding="utf-8")
 print("Generadas",len(urls),"páginas con visor compartido. Sin eliminar archivos anteriores.")
if __name__=="__main__":main()
