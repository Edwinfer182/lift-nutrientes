#!/usr/bin/env python3
"""SUPGO · Une en Google las fichas que solo cambian de sabor.

Varias fichas indexables del mismo producto (misma marca, mismo nombre y
presentación, distinto sabor) compiten entre sí y Google termina mostrando una
sola, no siempre la mejor. Aquí se elige una ficha principal por grupo y las
demás declaran su canonical hacia ella. Todas siguen funcionando para comprar.

Reglas conservadoras para no unir productos distintos:
  - misma marca (schema Product.brand) y mismo nombre sin el sabor;
  - el nombre de archivo (sin el ID final ni el sabor) también debe coincidir;
  - la presentación (lb, g, servicios, cápsulas...) forma parte del nombre,
    así que 2 lb y 5 lb nunca se unen.
Es idempotente y no usa red: se puede ejecutar tras cada generación.
"""
from pathlib import Path
import json
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "productos"
BASE = "https://supgo.co"

FLAVORS = [
    "cookies and cream", "cookies & cream", "cookies n cream", "cookies cream", "fruit punch", "frutos rojos", "blue razz",
    "blue raspberry", "green apple", "sin sabor", "pina colada", "piña colada", "mango maracuya", "fresa banano",
    "vainilla", "vanilla", "chocolate", "fresa", "strawberry", "limon", "limón", "lemon", "lemonade", "sandia", "sandía",
    "watermelon", "brownie", "naranja", "orange", "mango", "uva", "grape", "pina", "piña", "cereza", "cherry", "tropical",
    "manzana", "unflavored", "neutro", "natural", "cafe", "café", "coffee", "caramelo", "caramel", "mora", "frambuesa",
    "raspberry", "banano", "banana", "mani", "maní", "peanut", "maracuya", "maracuyá", "lulo", "coco", "coconut", "berry",
    "berries", "punch", "candy", "rainbow", "durazno", "peach", "cookies", "cream", "mocha", "moka", "capuccino", "cappuccino",
    "cinnamon", "canela", "galleta", "arequipe", "dulce de leche", "pistacho", "kiwi", "tamarindo", "gummy", "bubble gum",
    "chicle", "icy", "blast", "fruit", "frutas", "sabor",
]
FLAVOR_RE = re.compile(r"\b(" + "|".join(sorted((re.escape(f) for f in FLAVORS), key=len, reverse=True)) + r")\b")
ROBOTS_RE = re.compile(r'<meta\s+name=["\']robots["\'][^>]*>', re.I)
CANONICAL_RE = re.compile(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']*)["\']\s*/?>', re.I)
MARK = "<!-- supgo-variante -->"


def plain(text):
    text = unicodedata.normalize("NFD", str(text or "").lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def base_name(text):
    t = plain(text).split(" · sabor:")[0]
    t = FLAVOR_RE.sub(" ", t)
    return " ".join(re.findall(r"[a-z0-9]+", t))


def file_base(name):
    stem = re.sub(r"-\d+$", "", name[:-5])
    return base_name(stem.replace("-", " "))


def head(html):
    return html.split("</head>", 1)[0]


def product(html):
    for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        if isinstance(data, dict) and data.get("@type") == "Product":
            brand = data.get("brand") or {}
            if isinstance(brand, dict):
                brand = brand.get("name") or ""
            offers = data.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            return str(data.get("name") or ""), str(brand), str((offers or {}).get("availability") or ""), bool(data.get("image"))
    return "", "", "", False


def consolidate(dry=False):
    pages = []
    for path in sorted(PRODUCTS.glob("*.html")):
        if path.name == "index.html":
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        h = head(html)
        robots = ROBOTS_RE.search(h)
        if robots and "noindex" in robots.group(0).lower():
            continue
        url = f"{BASE}/productos/{path.name}"
        can = CANONICAL_RE.search(h)
        current = can.group(1).strip() if can else ""
        # Solo fichas canónicas de sí mismas o ya unidas por este script.
        if current != url and MARK not in html:
            continue
        name, brand, availability, has_image = product(html)
        if not name:
            continue
        key = (plain(brand).strip(), base_name(name), file_base(path.name))
        if len(key[1].split()) < 2:
            continue
        pages.append({"path": path, "url": url, "name": name, "key": key, "html": html,
                      "instock": "InStock" in availability, "image": has_image,
                      "generic": FLAVOR_RE.search(plain(name).split(" · sabor:")[0]) is None and " · Sabor:" not in name,
                      "id": int((re.search(r"-(\d+)\.html$", path.name) or [0, 0])[1] or 0)})
    groups = {}
    for p in pages:
        groups.setdefault(p["key"], []).append(p)
    merged = changed = 0
    report = []
    for key, items in groups.items():
        if len(items) < 2:
            # Si antes estaba unida y ya no tiene grupo, vuelve a ser canónica de sí misma.
            p = items[0]
            if MARK in p["html"]:
                html = CANONICAL_RE.sub(f'<link rel="canonical" href="{p["url"]}">', p["html"].replace(MARK, ""), count=1)
                if not dry:
                    p["path"].write_text(html, encoding="utf-8")
                changed += 1
            continue
        # Principal: en stock, con imagen, nombre sin sabor y luego la de ID más bajo (más antigua).
        main = sorted(items, key=lambda p: (not p["instock"], not p["image"], not p["generic"], p["id"] or 10**9, p["path"].name))[0]
        report.append((main["path"].name, [p["path"].name for p in items if p is not main]))
        for p in items:
            html = p["html"]
            if p is main:
                new = CANONICAL_RE.sub(f'<link rel="canonical" href="{p["url"]}">', html.replace(MARK, ""), count=1)
            else:
                new = CANONICAL_RE.sub(f'<link rel="canonical" href="{main["url"]}">', html, count=1)
                if MARK not in new:
                    new = new.replace("</head>", MARK + "\n</head>", 1)
                merged += 1
            if new != html:
                changed += 1
                if not dry:
                    p["path"].write_text(new, encoding="utf-8")
    print(f"Variantes de sabor: {len(report)} grupos, {merged} fichas apuntan a su principal ({changed} archivos actualizados)")
    return report, merged


def merged_urls():
    """URL de fichas unidas a otra (para que el sitemap no las cuente como errores)."""
    out = set()
    for path in PRODUCTS.glob("*.html"):
        html = path.read_text(encoding="utf-8", errors="replace")
        if MARK in head(html):
            out.add(f"{BASE}/productos/{path.name}")
    return out


if __name__ == "__main__":
    rep, _ = consolidate(dry="--dry" in sys.argv)
    if "--dry" in sys.argv:
        for main, others in rep:
            print(main, "<-", ", ".join(others))
