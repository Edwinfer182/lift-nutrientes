#!/usr/bin/env python3
"""Mantiene una sola identidad de tienda (SUPGO) en las páginas que ya tienen el bloque marcado.

Solo actualiza bloques existentes: no inserta el bloque en páginas nuevas (las fichas,
el panel y el admin tienen sus propios datos estructurados)."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MARK_START = "<!-- LIFT-STORE-IDENTITY:START -->"
MARK_END = "<!-- LIFT-STORE-IDENTITY:END -->"
identity = {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": "https://supgo.co/#organization",
    "name": "SUPGO",
    "alternateName": "SUPlementos GO",
    "logo": "https://supgo.co/favicon.png",
    "url": "https://supgo.co/",
    "description": "Tienda en línea de suplementos deportivos, proteínas, creatinas y vitaminas. Atiende pedidos en Medellín y realiza envíos a otras ciudades de Colombia.",
    "areaServed": [
        {"@type": "City", "name": "Medellín"},
        {"@type": "Country", "name": "Colombia"}
    ],
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Catálogo de suplementos deportivos",
        "url": "https://supgo.co/"
    }
}
block = MARK_START + "\n<script type=\"application/ld+json\">" + json.dumps(identity, ensure_ascii=False, separators=(",", ":")) + "</script>\n" + MARK_END
changed = 0
checked = 0
for path in ROOT.rglob("*.html"):
    if any(p.startswith(".") for p in path.relative_to(ROOT).parts):
        continue
    if "node_modules" in path.parts or "vendor" in path.parts:
        continue
    html = path.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"</head\s*>", html, flags=re.I):
        continue
    checked += 1
    if MARK_START in html and MARK_END in html:
        new = re.sub(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), lambda _: block, html, count=1, flags=re.S)
    else:
        continue
    if new != html:
        path.write_text(new, encoding="utf-8")
        changed += 1
print(f"HTML revisados: {checked}; actualizados: {changed}")
