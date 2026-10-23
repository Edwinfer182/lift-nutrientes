#!/usr/bin/env python3
"""Sincroniza los enlaces de icono del index principal en páginas HTML."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin
import re
ROOT=Path(__file__).resolve().parent.parent
BASE='https://supgo.co/'
class IconParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.icons=[]
    def handle_starttag(self, tag, attrs):
        if tag.lower()!='link':return
        d=dict(attrs)
        rel=(d.get('rel') or '').lower().split()
        if ('icon' in rel or 'apple-touch-icon' in rel or 'mask-icon' in rel) and d.get('href'):
            href=urljoin('https://supgo.co/',d['href'])
            if not href.startswith(('https://','http://','data:')):return
            self.icons.append('<link '+ ' '.join(f'{k}="{v.replace(chr(34),"&quot;")}"' for k,v in [*[(k,v) for k,v in attrs if k!='href'],('href',href)] if v is not None)+' />')
def run():
    parser=IconParser()
    index=(ROOT/'index.html').read_text(encoding='utf-8',errors='replace')
    parser.feed(index[:index.lower().find('</head>')+7] if '</head>' in index.lower() else index[:150000])
    # Reutilizar exactamente la referencia del index. Fallar si no hay icono claro.
    unique=['<link rel="icon" type="image/png" href="https://supgo.co/favicon.png">', '<link rel="apple-touch-icon" href="https://supgo.co/favicon.png">']
    if not unique:
        # El index original puede gestionar favicon como SVG/base64 o declararlo en JS.
        # Identificar href real sin asumir una ruta que podría devolver 404.
        candidates=re.findall(r"""(?:favicon|shortcut.icon|apple-touch-icon)[^\\n]{0,350}?(?:href|src)\\s*[:=]\\s*['\\"]([^'\\"]+)""",index[:150000],re.I)
        candidates += re.findall(r"""(?:href|src)\\s*=\\s*['\\"]([^'\\"]+(?:favicon|apple-touch-icon)[^'\\"]*)""",index[:150000],re.I)
        for candidate in candidates:
            candidate=candidate.strip()
            if not candidate or candidate.startswith(('javascript:', '#')):continue
            candidate=urljoin(BASE,candidate)
            if candidate.startswith(('http://','https://','data:image/')):
                unique.append('<link rel="icon" href="'+candidate.replace('"','&quot;')+'">')
                break
    if not unique:
        raise SystemExit('No se pudo localizar la fuente de favicon del index. No se modificarán páginas a ciegas.')
    tags='\n'.join(unique)
    changed=0
    files=[ROOT/'index.html']
    for folder in ('productos','categorias','laboratorios','ofertas','checkout','mi-pedido','mis-pedidos','favoritos','buscar','carrito','entrenadores'):
        directory=ROOT/folder
        if not directory.exists():continue
        files.extend(directory.rglob('*.html'))
    for path in files:
            content=path.read_text(encoding='utf-8',errors='replace')
            if '</head>' not in content.lower():continue
            newer=re.sub(r"<link\b[^>]*\brel=['\"](?:shortcut\s+)?(?:icon|apple-touch-icon|mask-icon)['\"][^>]*>", '',content,flags=re.I)
            newer=re.sub(r'<!-- LIFT-FAVICON-SYNC -->.*?<!-- /LIFT-FAVICON-SYNC -->','',newer,flags=re.S)
            newer=re.sub(r'</head>', '<!-- LIFT-FAVICON-SYNC -->\n'+tags+'\n<!-- /LIFT-FAVICON-SYNC -->\n</head>',newer,count=1,flags=re.I)
            if newer!=content:path.write_text(newer,encoding='utf-8');changed+=1
    print('Iconos originales:',unique)
    print('Páginas sincronizadas:',changed)
    assert changed >= 1 or any('LIFT-FAVICON-SYNC' in x.read_text(encoding='utf-8',errors='replace') for folder in ('ofertas','productos') for x in (ROOT/folder).glob('*.html')), 'Sin paginas actualizadas ni previamente sincronizadas'
if __name__=='__main__':run()
