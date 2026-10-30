#!/usr/bin/env python3
"""Sitemap verificado SUPGO v2. No altera las fichas ni URLs."""
from pathlib import Path
from collections import Counter
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "productos"
BASE = "https://supgo.co"
OUT = ROOT / "sitemap-v2.xml"
REPORT = ROOT / "sitemap-v2-reporte.txt"
def attr(tag, name):
    m = re.search(r'\b' + re.escape(name) + r'\s*=\s*([\x22\x27])(.*?)\1', tag, re.I | re.S)
    return m.group(2).strip() if m else ""
def head_tag(html, tagname, key, value):
    for m in re.finditer(r"<" + tagname + r"\b[^>]*>", html, re.I|re.S):
        if attr(m.group(),key).lower()==value:
            return m.group()
    return ""
def main():
    good=[]
    rejected=[]
    for page in sorted(PAGES.glob("*.html")):
        html=page.read_text(encoding="utf-8", errors="replace")
        head=html.split("</head>",1)[0]
        robots=head_tag(head,"meta","name","robots")
        robots_content=attr(robots,"content").lower()
        canonical_tag=head_tag(head,"link","rel","canonical")
        canonical=attr(canonical_tag,"href")
        expected=BASE+"/productos/"+page.name
        title=re.search(r"<title\b[^>]*>(.*?)</title>",head,re.I|re.S)
        reasons=[]
        if not title or not re.sub(r"<[^>]+>","",title.group(1)).strip():
            reasons.append("sin_titulo")
        if "noindex" in robots_content:
            reasons.append("noindex")
        if not robots or ("index" not in robots_content and "noindex" not in robots_content):
            reasons.append("robots_no_explicito")
        if canonical!=expected:
            reasons.append("canonical_incorrecto")
        if "<h1" not in html.lower():
            reasons.append("sin_h1")
        if reasons:
            rejected.append((page.name, ",".join(reasons)))
        else:
            good.append(expected)
    if not good:
        sys.exit("ERROR: ninguna ficha valida, se conserva el sitemap anterior")
    if len(good)!=len(set(good)):
        sys.exit("ERROR: URLs duplicadas")
    ET.register_namespace("","http://www.sitemaps.org/schemas/sitemap/0.9")
    root=ET.Element("{http://www.sitemaps.org/schemas/sitemap/0.9}urlset")
    for url in good:
        ET.SubElement(ET.SubElement(root,"{http://www.sitemaps.org/schemas/sitemap/0.9}url"),"{http://www.sitemaps.org/schemas/sitemap/0.9}loc").text=url
    tree=ET.ElementTree(root)
    ET.indent(tree, space="  ")
    import io
    f=io.BytesIO()
    tree.write(f,encoding="utf-8",xml_declaration=True)
    if len(f.getvalue())>50_000_000 or len(good)>50_000:
        sys.exit("ERROR: sitemap excede limite")
    OUT.write_bytes(f.getvalue())
    counts=Counter(reason for _,codes in rejected for reason in codes.split(","))
    summary=[f"Validas: {len(good)}",f"Excluidas: {len(rejected)}",f"Razones: {dict(counts)}","", "Excluidas (archivo | motivos):"]
    summary.extend(f"{name} | {reason}" for name,reason in rejected)
    REPORT.write_text("\n".join(summary)+"\n",encoding="utf-8")
    print("\n".join(summary[:4]))
if __name__=="__main__":
    main()
