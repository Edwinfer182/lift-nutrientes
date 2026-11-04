#!/usr/bin/env python3
"""Unifica enlaces internos con fichas existentes, sin depender de la indexación."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, html
ROOT=Path(__file__).resolve().parents[1]
BASE="https://supgo.co"
PRODUCTS=ROOT/"productos"
LEGACY=ROOT/"scripts/fichas_heredadas.json"
MARK="<!-- supgo-redireccion -->"
HREF=re.compile(r'(?P<prefix>\b(?:href|data-href)\s*=\s*)(?P<quote>["\'])(?P<url>[^"\']+)(?P=quote)',re.I)
CANON=re.compile(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)',re.I)
def existing(url):
    parts=urlsplit(html.unescape(url))
    if parts.netloc and parts.netloc.lower() not in ("supgo.co","www.supgo.co"):return None
    path=unquote(parts.path)
    if not path.startswith("/productos/") or not path.endswith(".html"):return None
    name=path.rsplit("/",1)[-1]
    if "/" in name or name in (".",".."):return None
    return name,parts
def main():
    pages={p.name:p for p in PRODUCTS.glob("*.html")}
    mapping={}
    if LEGACY.exists():
        for old,target in json.loads(LEGACY.read_text(encoding="utf-8")).items():
            if old not in pages:continue
            parsed=existing(target)
            if parsed and parsed[0] in pages and parsed[0]!=old:
                mapping[old]=parsed[0]
    # Las fichas redirigidas anteriormente también son referencias válidas.
    for name,path in pages.items():
        raw=path.read_text(encoding="utf-8",errors="replace")
        if MARK not in raw:continue
        m=CANON.search(raw)
        parsed=existing(m.group(1)) if m else None
        if parsed and parsed[0] in pages and parsed[0]!=name:mapping[name]=parsed[0]
    def resolve(name):
        seen=set()
        while name in mapping:
            if name in seen:return None
            seen.add(name);name=mapping[name]
        return name if name in pages else None
    mapping={old:resolve(old) for old in mapping}
    mapping={old:dest for old,dest in mapping.items() if dest and old!=dest}
    changed=links=0
    # No se alteran rutas a marcas, categorías, imágenes, ni enlaces externos.
    for path in sorted(ROOT.rglob("*.html")):
        if any(part.startswith(".") for part in path.relative_to(ROOT).parts):continue
        if path.name in mapping and path.parent==PRODUCTS:continue
        original=path.read_text(encoding="utf-8",errors="replace")
        def replace(m):
            nonlocal links
            parsed=existing(m.group("url"))
            if not parsed or parsed[0] not in mapping:return m.group(0)
            old,parts=parsed
            new=("/productos/"+mapping[old]) if not parts.netloc else BASE+"/productos/"+mapping[old]
            new+=("?"+parts.query if parts.query else "")+("#"+parts.fragment if parts.fragment else "")
            links+=1
            return m.group("prefix")+m.group("quote")+new+m.group("quote")
        updated=HREF.sub(replace,original)
        if updated!=original:path.write_text(updated,encoding="utf-8");changed+=1
    redirects=0
    for old,new in sorted(mapping.items()):
        path=pages[old];target=BASE+"/productos/"+new
        original=path.read_text(encoding="utf-8",errors="replace")
        if MARK in original and f'content="0; url={target}"' in original:continue
        document=('<!doctype html><html lang="es"><head><meta charset="utf-8">'
                  '<meta name="robots" content="noindex, follow">'
                  '<title>Producto trasladado | SUPGO</title>'
                  f'<link rel="canonical" href="{target}">'
                  f'<meta http-equiv="refresh" content="0; url={target}">'
                  f'{MARK}<script>location.replace({json.dumps(target)}+location.search+location.hash)</script>'
                  f'</head><body><a href="{target}">Ver producto actual</a></body></html>\n')
        path.write_text(document,encoding="utf-8");redirects+=1
    report={"enlaces_actualizados":links,"archivos_actualizados":changed,"redirecciones":redirects,"mapa_productos":len(mapping)}
    print(json.dumps(report,ensure_ascii=False))
    (ROOT/"scripts/reporte_enlaces_vigentes.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":main()
