#!/usr/bin/env python3
"""Integra atención general en el index real del checkout de GitHub Actions."""
from pathlib import Path
import re
p=Path("index.html")
if not p.is_file() or p.stat().st_size<1000:
    raise SystemExit("ERROR: index.html no disponible o demasiado pequeño. No se modifica.")
s=p.read_text(encoding="utf-8")
if not re.search(r"</body\s*>",s,re.I):
    raise SystemExit("ERROR: Falta </body>. Se cancela sin modificar el index.")
tag='<script defer src="/componentes/whatsapp-general.js?v=20261021-4"></script>'
if '/componentes/whatsapp-general.js' not in s:
    s=re.sub(r"</body\s*>",tag+"\n</body>",s,count=1,flags=re.I)
p.write_text(s,encoding="utf-8")
assert p.stat().st_size>1000
print("Componente de atención integrado; index intacto fuera de la etiqueta añadida.")
