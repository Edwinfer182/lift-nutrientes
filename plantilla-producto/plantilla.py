"""Adaptador dinámico de la plantilla original de fichas SUPGO."""
import copy
import sys
sys.dont_write_bytecode = True
import threading
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import generar_paginas_seo as generator
from generar_paginas_seo import (fetch, fetch_seo, fetch_product_images, fetch_offers,
    fetch_reviews, fetch_merchant_settings, seo_filter_data, fetch_lab_logos,
    fetch_allowed_brands, allowed, fetch_seo_blocked, active_offer, slug, BASE,
    seo_contenido)
_cache = None
_cache_time = 0
_lock = threading.Lock()

def prepare_rows():
 rows=fetch()
 seo_rows=fetch_seo()
 images_by_product=fetch_product_images()
 offers=fetch_offers()
 generator.REVIEWS=fetch_reviews()
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
 blocked_ids=fetch_seo_blocked()
 for r in valid:
  r['_indexable']=str((r['product'].get('brand') or r['product'].get('marca') or 'SIN MARCA')).strip().casefold() in allowed_brands and str(r['id']) not in blocked_ids
 def info(item):
  p=item["product"];name=str(p.get("name") or p.get("nombre") or "")
  promo=active_offer(item)
  try:regular=float(p.get("price") or p.get("precio") or 0)
  except (TypeError,ValueError):regular=0
  commercial={"price":regular,"sale":promo[1] if promo else None,"pct":round((1-promo[1]/promo[0])*100) if promo else 0,"until":(item.get("_offer") or {}).get("promoUntil") if promo else None}
  return {**commercial,"id":item["id"],"name":name,"brand":str(p.get("brand") or p.get("marca") or ""),"image":str(p.get("image") or p.get("imagen") or ""),"url":BASE+"/productos/"+(slug(name) or "producto")+"-"+str(item["id"])+".html","label":str(p.get("flavor") or p.get("sabor") or p.get("presentation") or p.get("presentacion") or name),"on_offer":active_offer(item) is not None}
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
  # Enlaces de texto para el contenido automático: solo fichas indexables con precio,
  # una por familia de sabores, elegidas de forma estable y distinta por ficha.
  def firsts(cands):
   seen=set();out=[]
   for other,v in cands:
    fam=id(group_by_id[str(v["id"])])
    if fam in seen:continue
    seen.add(fam);out.append(v)
   return out
  pool=[(other,v) for other,v in entries if str(v["id"]) not in excluded and other.get("_indexable",True) and v["price"]>0]
  same_brand=firsts([(o,v) for o,v in pool if brand and v["brand"].casefold()==brand])
  item["_mas_marca"]=seo_contenido.seleccionar(same_brand,item["id"],4)
  same_cat=firsts([(o,v) for o,v in pool if cat and v["brand"].casefold()!=brand and str(o["product"].get("category") or o["product"].get("categoria") or "").casefold()==cat])
  item["_alternativas"]=seo_contenido.seleccionar(same_cat,item["id"],4)
 return valid

def render_product(product_id=None, product_slug=None):
    global _cache, _cache_time
    with _lock:
        if _cache is None or time.monotonic() - _cache_time > 60:
            _cache = prepare_rows()
            _cache_time = time.monotonic()
        candidates = [r for r in _cache if (str(r['id']) == str(product_id) if product_id else
            (r['product'].get('seo') or {}).get('slug') == product_slug)]
        if not candidates:
            raise LookupError('Producto no disponible.')
        if len(candidates) != 1:
            raise ValueError('Slug duplicado. Abre el producto por ID.')
        row = copy.deepcopy(candidates[0])
        brand = str(row['product'].get('brand') or '').casefold()
        if brand in ('bsn', 'applied nutrition'):
            links = []
            for other in _cache:
                if str(other['id']) == str(row['id']) or str(other['product'].get('brand') or '').casefold() != brand:
                    continue
                name = other['product'].get('name') or ''
                links.append({'name': name, 'url': BASE + '/productos/' + (slug(name) or 'producto') + '-' + str(other['id']) + '.html'})
            row['_bsn_links' if brand == 'bsn' else '_applied_links'] = links[:3]
        row['_indexable'] = False
        # Keep this separate test route outside the search index.
        _, document = generator.build(row)
        return document
