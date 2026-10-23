#!/usr/bin/env python3
"""Export discovery feed for Lift Nutrientes from Supabase + published product pages."""
import csv, io, json, os, re, unicodedata, urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"feeds"
OUT.mkdir(exist_ok=True)
BLOCKED=re.compile(r"(?i)(tadalafil|sildenafil|proviron|provibolic|masteron|mastenom|trembol|trembon|testosteron|testonom|anabol|esteroide|yk.?11|sarms|oxandrol|nandrol|clenbuterol|hgh|hormona|peptid|retatrutide|yohimbina|lipodrene|ephedra|efedrina|cbd|thc|cannabis|melatonina|burner|quemador|psychotic|lipodry|hydroxycut)")
class ProductParser(HTMLParser):
    def __init__(self):
        super().__init__();self.in_script=False;self.scripts=[];self.buf=""
    def handle_starttag(self,tag,attrs):
        if tag=="script" and dict(attrs).get("type")=="application/ld+json":self.in_script=True;self.buf=""
    def handle_data(self,data):
        if self.in_script:self.buf+=data
    def handle_endtag(self,tag):
        if tag=="script" and self.in_script:self.scripts.append(self.buf);self.in_script=False
def fetch_supabase():
    base=os.environ.get("SUPABASE_URL","").rstrip("/")
    key=os.environ.get("SUPABASE_ANON_KEY","")
    if not base or not key: raise RuntimeError("Configurar SUPABASE_URL y SUPABASE_ANON_KEY en GitHub Actions")
    result=[];offset=0
    while True:
        url=f"{base}/rest/v1/lift_productos?select=id,nombre,marca,categoria,precio,imagen,activo,product&order=id.asc&limit=1000&offset={offset}"
        req=urllib.request.Request(url,headers={"apikey":key,"Authorization":"Bearer "+key,"Accept":"application/json"})
        with urllib.request.urlopen(req,timeout=45) as response: batch=json.load(response)
        if not isinstance(batch,list):raise ValueError("Respuesta de Supabase no es una lista")
        result+=batch
        if len(batch)<1000:break
        offset+=1000
    if not result:raise ValueError("Supabase devolvió 0 productos: revisar permisos de lectura")
    return result
def find_static_pages():
    data={}
    for path in (ROOT/"productos").glob("*.html"):
        m=re.search(r"-(\d+)\.html$",path.name)
        if not m:continue
        parser=ProductParser()
        parser.feed(path.read_text(encoding="utf-8",errors="replace"))
        for raw in parser.scripts:
            try:o=json.loads(raw)
            except ValueError:continue
            if o.get("@type")=="Product" and o.get("sku")==m.group(1):
                data[int(m.group(1))]=o
                break
    return data
def status(p):
    # Unknown is correct when the provider has not supplied actual inventory.
    val=p.get("stock",p.get("inventory"))
    if isinstance(val,(int,float)) and not isinstance(val,bool):return "in_stock" if val>0 else "out_of_stock"
    for key in ("agotado","outOfStock","soldOut"):
        if p.get(key) is True:return "out_of_stock"
    return "unknown"
def export():
    pages=find_static_pages()
    products=fetch_supabase()
    rows=[]
    for item in products:
        id=item.get("id")
        data=item.get("product") or {}
        if not isinstance(data,dict):data={}
        page=pages.get(id)
        if not page or item.get("activo") is not True:continue
        name=(item.get("nombre") or "").strip()
        brand=(item.get("marca") or "").strip()
        image=item.get("imagen") or (page.get("image") or [""])[0]
        url=page.get("url","")
        price=item.get("precio")
        if not all((name,brand,image,url)) or not str(image).startswith("https://") or not url.startswith("https://supgo.co/productos/"):continue
        if BLOCKED.search(" ".join((name,brand,item.get("categoria") or ""))):continue
        if not isinstance(price,(int,float)) or price<=0:continue
        description=re.sub(r"\s+"," ",re.sub(r"<[^>]*>"," ",data.get("description") or page.get("description") or name)).strip()[:5000]
        record={"item_id":str(id),"title":name[:150],"description":description,"url":url,"brand":brand,"seller_name":"Lift Nutrientes","image_url":image,"price":f"{int(price)} COP","availability":status(data)}
        rows.append(record)
    if len(rows)<600:raise ValueError(f"Feed incompleto ({len(rows)} filas); se conserva el feed anterior")
    fields=["item_id","title","description","url","brand","seller_name","image_url","price","availability"]
    with (OUT/"productos-chatgpt.csv").open("w",encoding="utf-8",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
    with (OUT/"productos-chatgpt.jsonl").open("w",encoding="utf-8") as f:
        for row in rows:f.write(json.dumps(row,ensure_ascii=False)+"\n")
    summary={"productos_publicados":len(rows),"sin_stock_verificado":sum(x["availability"]=="unknown" for x in rows),"excluidos_o_sin_pagina":len(products)-len(rows)}
    (OUT/"estado-feed.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))
if __name__=="__main__":export()
