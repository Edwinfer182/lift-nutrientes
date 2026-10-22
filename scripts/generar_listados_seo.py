#!/usr/bin/env python3
"""Genera páginas individuales SEO de categorías y laboratorios de SUPGO."""
import json
import os
import pathlib
import re
import unicodedata
import urllib.parse
import urllib.request
from html import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = os.getenv("SUPABASE_URL", "https://vdxkknftyssjyfbdieqa.supabase.co").rstrip("/") + "/rest/v1/lift_productos"
KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh")


def slug(value):
    raw = unicodedata.normalize("NFD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", raw))


def load():
    records = []
    for offset in range(0, 5000, 500):
        query = urllib.parse.urlencode({"select": "id,product,activo", "activo": "eq.true", "limit": 500, "offset": offset})
        req = urllib.request.Request(API + "?" + query, headers={"apikey": KEY})
        with urllib.request.urlopen(req, timeout=40) as response:
            page = json.load(response)
        records.extend(page)
        if len(page) < 500:
            break
    return records


def read(record, *keys):
    p = record.get("product") or {}
    for key in keys:
        if p.get(key):
            return str(p[key]).strip()
    return ""


def template(kind, title, url_slug, count):
    plural = "categorias" if kind == "categoria" else "laboratorios"
    heading = escape(title)
    description = f"Compra productos de {title} en SUPGO. Consulta suplementos disponibles, precios y presentaciones."
    canonical = f"https://supgo.co/{plural}/{url_slug}/"
    data = json.dumps({"@context": "https://schema.org", "@type": "CollectionPage", "name": title, "url": canonical, "description": description}, ensure_ascii=False)
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{heading} | SUPGO</title><meta name="description" content="{escape(description, quote=True)}">
<link rel="canonical" href="{canonical}">
<script type="application/ld+json">{data.replace('<', '\\u003c')}</script>
<link rel="stylesheet" href="/paginas/supgo-pages.css"></head>
<body data-page="{kind}" data-slug="{escape(url_slug, quote=True)}">
<header class="topbar"><div class="topinner"><a class="logo" href="/">SUPGO</a>
<nav class="nav"><a href="/categorias/">Categorías</a><a href="/laboratorios/">Laboratorios</a><a href="/buscar/">Buscar</a><a href="/favoritos/">♡ Favoritos</a><a href="/carrito/">🛒 <span id="cartcount">0</span></a><a href="/mis-pedidos/">Mis pedidos</a></nav></div></header>
<main class="site"><h1>{heading}</h1><p class="muted">{escape(description)}</p>
<div class="toolbar"><label for="sort">Ordenar:</label><select id="sort" onchange="window.supgoPages?.render()"><option value="">Nombre</option><option value="asc">Menor precio</option><option value="desc">Mayor precio</option></select></div>
<div id="content"><p class="loading">Cargando {count} productos…</p></div></main>
<script defer src="/paginas/supgo-pages.js"></script></body></html>"""


def main():
    rows = load()
    total = 0
    for kind, plural, keys in [
        ("categoria", "categorias", ("category", "categoria")),
        ("laboratorio", "laboratorios", ("brand", "marca")),
    ]:
        groups = {}
        for row in rows:
            name = read(row, *keys)
            if name and not (kind == "laboratorio" and slug(name) == "venom-pharma"):
                groups.setdefault(name, 0)
                groups[name] += 1
        for name, count in groups.items():
            dest = ROOT / plural / slug(name) / "index.html"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(template(kind, name, slug(name), count), encoding="utf-8")
            total += 1
    print(f"Generadas {total} páginas individuales de categorías y laboratorios.")


if __name__ == "__main__":
    main()
