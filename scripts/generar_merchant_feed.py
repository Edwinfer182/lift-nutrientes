#!/usr/bin/env python3
"""Feed Google Merchant Center: solo referencias revisadas explícitamente."""
import os, sys, json, re, pathlib, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from generar_paginas_seo import fetch, slug, allowed, seo_plain, fetch_allowed_brands
BASE="https://supgo.co"
ROOT=pathlib.Path(__file__).resolve().parent.parent
ET.register_namespace("g","http://base.google.com/ns/1.0")
G="{http://base.google.com/ns/1.0}"
def field(item,name,value):
 ET.SubElement(item,G+name).text=str(value)
def main():
 # Indexable = marca habilitada en lift_seo_marcas, misma regla del sitemap SEO.
 indexable_brands=fetch_allowed_brands()
 # Exclusiones prudenciales para sustancias reguladas y reclamos médicos.
 blocked=re.compile(r"(?:tadalafil|sildenafil|proviron|masteron|trenbol|trembol|testosteron|anabol|steroid|oxandrol|nandrol|clenbuterol|semaglut|tirzepat|retatrut|yohimb|ephedr|efedr|sarms|ostarine|rad.?140|mk.?677|peptide|péptido|hgh|hcg|dianabol|winstrol|anavar|viagra|cialis)",re.I)
 channel=ET.Element("rss",{"version":"2.0"})
 ch=ET.SubElement(channel,"channel")
 for k,v in (("title","Supgo - productos revisados"),("link",BASE),("description","Catálogo de productos elegibles revisados para Google Merchant Center")): ET.SubElement(ch,k).text=v
 count=0
 for row in fetch():
  p=row.get("product") or {}
  pid=str(row.get("id"))
  if not allowed(row) or row.get("activo") is not True:continue
  if str(p.get("brand") or p.get("marca") or "").strip().casefold() not in indexable_brands:continue
  if blocked.search(" ".join(str(p.get(k) or "") for k in ("name","nombre","description","descripcion","category","categoria"))):continue
  name=str(p.get("name") or p.get("nombre") or "").strip()
  brand=str(p.get("brand") or p.get("marca") or "").strip()
  image=str(p.get("image") or p.get("imagen") or "").strip()
  if image.startswith("//"):image="https:"+image
  elif image.startswith("/"):image=BASE+image
  try:price=float(p.get("price") or p.get("precio") or 0)
  except (ValueError,TypeError):continue
  if not name or not brand or not image.startswith("https://") or price<=0:continue
  # Revisión humana requerida para todos los IDs incluidos en lista positiva.
  item=ET.SubElement(ch,"item")
  field(item,"id",pid)
  field(item,"title",name[:150])
  field(item,"description",seo_plain(p.get("description") or p.get("descripcion") or name)[:5000])
  field(item,"link",f"{BASE}/productos/{slug(name)}-{pid}.html")
  field(item,"image_link",image)
  field(item,"price",f"{price:.2f} COP")
  stock=p.get("stock")
  status=str(p.get("availability") or p.get("status") or p.get("estado") or "").lower()
  if stock is False or (isinstance(stock,(int,float)) and not isinstance(stock,bool) and stock<=0) or status in ("agotado","sin stock","out_of_stock","outofstock","unavailable"): availability="out_of_stock"
  else: availability="in_stock"
  field(item,"availability",availability)
  field(item,"condition","new")
  field(item,"brand",brand)
  if p.get("gtin"):field(item,"gtin",p["gtin"])
  elif p.get("mpn"):field(item,"mpn",p["mpn"])
  else:pass  # Sin identificador conocido: Google evalúa marca y otros atributos.
  count+=1
 tree=ET.ElementTree(channel)
 ET.indent(tree,space="  ")
 tree.write(ROOT/"merchant-feed.xml",encoding="utf-8",xml_declaration=True)
 print(f"Feed generado: {count} productos de marcas indexables (con filtro de seguridad)")
if __name__=="__main__":main()
