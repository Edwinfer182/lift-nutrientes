#!/usr/bin/env python3
"""Mapa de fichas heredadas (URL antiguas) hacia su página vigente.

Contexto: las fichas antiguas de /productos/ (las que Google ya tenía
indexadas) quedaron con «noindex» al regenerarse con la plantilla nueva, y su
producto pasó a otra URL. Google las quitó del índice y la URL nueva empezó sin
historial. Este script decide, una sola vez y sin red, a dónde debe redirigir
cada ficha heredada para que Google traslade su posicionamiento:

  1. a la ficha vigente del MISMO producto (misma marca, mismo nombre y misma
     presentación), o
  2. si el producto ya no existe, a la página de su marca en /laboratorios/.

Si no hay destino seguro, la ficha se deja como está (noindex).

El resultado se guarda en scripts/fichas_heredadas.json para revisarlo. Quien
aplica las redirecciones es seo_indexacion.redirect_legacy().

Uso:  python scripts/mapear_fichas_heredadas.py
"""
from pathlib import Path
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "productos"
LABS = ROOT / "laboratorios"
APPROVED = ROOT / "sitemap-productos.xml"
OUT = Path(__file__).resolve().parent / "fichas_heredadas.json"
BASE = "https://supgo.co"

ROBOTS_RE = re.compile(r'<meta\s+name=["\']robots["\'][^>]*>', re.I)
UNIT = {
    "lbs": "lb", "lb": "lb", "libras": "lb", "libra": "lb",
    "serv": "serv", "servicios": "serv", "servicio": "serv", "srv": "serv", "porciones": "serv",
    "caps": "caps", "cap": "caps", "capsulas": "caps", "capsules": "caps", "capsula": "caps",
    "tabs": "tabs", "tab": "tabs", "tabletas": "tabs", "tablets": "tabs",
    "gr": "g", "g": "g", "gramos": "g", "grs": "g", "kg": "kg", "mg": "mg", "mcg": "mcg", "iu": "iu",
    "softgels": "softgels", "softgel": "softgels", "ml": "ml", "oz": "oz",
    "und": "und", "unidades": "und", "unidad": "und",
}
STOP = {"de", "con", "x", "y", "en", "la", "el", "del", "por", "para", "sabor", "the", "and", "a"}
# Páginas de marca demasiado genéricas para servir de destino.
GENERIC_LABS = {"varias-marcas", "sin-laboratorio", "index.html"}


def tokens(text):
    """(palabras, presentaciones). Las presentaciones unen número y unidad: 2lb, 30serv."""
    raw = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode().lower()
    raw = re.sub(r"(\d)([a-z])", r"\1 \2", raw)
    parts = re.findall(r"[a-z]+|\d+(?:[.,]\d+)?", raw)
    words, qty, i = set(), set(), 0
    while i < len(parts):
        w = parts[i]
        if w[0].isdigit():
            nxt = parts[i + 1] if i + 1 < len(parts) else ""
            if nxt in UNIT:
                qty.add(w.replace(",", ".") + UNIT[nxt])
                i += 2
                continue
            words.add(w)
        elif w not in UNIT and w not in STOP:
            words.add(w)
        i += 1
    return words, qty


def product(html):
    for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        if isinstance(data, dict) and data.get("@type") == "Product":
            brand = data.get("brand") or {}
            brand = brand.get("name") if isinstance(brand, dict) else brand
            return str(data.get("name") or ""), str(brand or "")
    return "", ""


def is_noindex(html):
    tag = ROBOTS_RE.search(html.split("</head>", 1)[0])
    return bool(tag and "noindex" in tag.group(0).lower())


def slug_name(filename):
    """Nombre del producto según la URL antigua (el contenido pudo sobrescribirse
    con otro producto cuando se reutilizaron ID, la URL no)."""
    parts = filename[:-5].split("-")
    if len(parts) > 3 and parts[-1].isdigit() and not parts[-2].isdigit() and parts[-2] not in UNIT:
        parts = parts[:-1]  # ID antiguo al final
    return " ".join(parts)


def is_legacy(path, html):
    """Ficha heredada: título con la marca antigua en formato «| Supgo» o
    nombre de archivo que no termina en el SKU del producto."""
    if re.search(r"<title>[^<]*\| Supgo</title>", html):
        return True
    sku = re.search(r'"sku"\s*:\s*"([^"]+)"', html)
    return not (sku and path.name.endswith(f"-{sku.group(1)}.html"))


def main():
    approved = set(re.findall(r"<loc>\s*(https://supgo\.co/productos/[^<\s]+)\s*</loc>", APPROVED.read_text(encoding="utf-8")))
    targets = []
    for url in sorted(approved):
        path = PRODUCTS / url.rsplit("/", 1)[1]
        if not path.exists():
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        if is_noindex(html):
            continue
        name, brand = product(html)
        nw, nq = tokens(name)
        bw, _ = tokens(brand)
        targets.append((path.name, name, nw, nq, bw))

    labs = sorted(
        (d.name for d in LABS.iterdir()
         if d.is_dir() and d.name not in GENERIC_LABS and (d / "index.html").exists()
         and not is_noindex((d / "index.html").read_text(encoding="utf-8", errors="replace"))),
        key=len, reverse=True)

    def best_product(filename):
        sw, sq = tokens(slug_name(filename))
        best = None
        for tname, name, nw, nq, bw in targets:
            if not bw or not bw <= sw:  # la marca vigente debe aparecer en la URL antigua
                continue
            core, tcore = sw - bw, (nw - bw) or nw
            if not core or not tcore:
                continue
            inter = len(core & tcore)
            cov, rev = inter / len(core), inter / len(tcore)
            same_size = bool(sq and nq and sq == nq)
            strong = same_size and rev >= 0.99           # mismo nombre y presentación; la URL antigua trae palabras extra
            weak = cov >= 0.8 and rev >= 0.6 and not (sq and nq and sq != nq)
            if not (strong or weak):
                continue
            score = cov + rev + (0.5 if same_size else 0) - 0.01 * len(name)
            if not best or score > best[0]:
                best = (score, tname, name)
        return best

    def brand_page(filename):
        stem = re.sub(r"-\d+$", "", filename[:-5])
        for lab in labs:
            if stem.endswith("-" + lab) or f"-{lab}-" in stem + "-":
                return lab
        return None

    mapping, report = {}, {"producto": 0, "marca": 0, "sin_destino": 0}
    for path in sorted(PRODUCTS.glob("*.html")):
        if path.name == "index.html" or f"{BASE}/productos/{path.name}" in approved:
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        if "<!-- supgo-redireccion -->" in html:
            pass  # ya redirigida en una ejecución anterior: se vuelve a calcular
        elif not is_noindex(html) or not is_legacy(path, html):
            continue
        match = best_product(path.name)
        if match:
            mapping[path.name] = f"/productos/{match[1]}"
            report["producto"] += 1
            continue
        lab = brand_page(path.name)
        if lab:
            mapping[path.name] = f"/laboratorios/{lab}/"
            report["marca"] += 1
        else:
            report["sin_destino"] += 1

    OUT.write_text(json.dumps(dict(sorted(mapping.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Fichas heredadas → producto vigente: {report['producto']}; → página de marca: {report['marca']}; "
          f"sin destino seguro (siguen noindex): {report['sin_destino']}")


if __name__ == "__main__":
    main()
