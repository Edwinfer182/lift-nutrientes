#!/usr/bin/env python3
"""Feed Google Merchant Center: solo referencias revisadas explícitamente."""
import os, sys, json, re, pathlib, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from generar_paginas_seo import fetch, slug, active_offer, allowed, seo_plain
BASE="https://supgo.co"
ROOT=pathlib.Path(__file__).resolve().parent.parent
ET.register_namespace("g","http://base.google.com/ns/1.0")
G="{http://base.google.com/ns/1.0}"
def field(item,name,value):
 ET.SubElement(item,G+name).text=str(value)
def main():
 # Lista positiva: no enviar suplementos sin revisión de elegibilidad.
 allow_file=ROOT/"merchant-approved-ids.json"
 approved=json.loads(allow_file.read_text(encoding="utf-8"))
 ids={str(x) for x in approved.get("approved_product_ids",[])}
 channel=ET.Element("rss",{"version":"2.0"})
 ch=ET.SubElement(channel,"channel")
 for k,v in (("title","Supgo - productos revisados"),("link",BASE),("description","Catálogo de productos elegibles revisados para Google Merchant Center")): ET.SubElement(ch,k).text=v
 count=0
 for row in fetch():
  p=row.get("product") or {}
  pid=str(row.get("id"))
  if pid not in ids or not allowed(row) or row.get("activo") is not True:continue
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
  field(item,"availability","in_stock")
  field(item,"condition","new")
  field(item,"brand",brand)
  if p.get("gtin"):field(item,"gtin",p["gtin"])
  elif p.get("mpn"):field(item,"mpn",p["mpn"])
  else:field(item,"identifier_exists","no")
  count+=1
 tree=ET.ElementTree(channel)
 ET.indent(tree,space="  ")
 tree.write(ROOT/"merchant-feed.xml",encoding="utf-8",xml_declaration=True)
 print(f"Feed generado: {count} productos revisados")
if __name__=="__main__":main()
