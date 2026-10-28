#!/usr/bin/env python3
"""Genera páginas individuales SEO de categorías y laboratorios de SUPGO."""
# Actualización de metadatos sociales: volver a generar los listados mediante GitHub Actions.
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


def load_logos():
    """Lee los mismos logos públicos usados por /laboratorios/."""
    config_api = API.replace("/lift_productos", "/lift_catalog_config")
    query = urllib.parse.urlencode({"select": "valor", "clave": "eq.laboratories_v1", "limit": 1})
    try:
        req = urllib.request.Request(config_api + "?" + query, headers={"apikey": KEY})
        with urllib.request.urlopen(req, timeout=40) as response:
            rows = json.load(response)
        config = rows[0].get("valor") if rows else {}
        if isinstance(config, str):
            config = json.loads(config)
        items = config
        if isinstance(items, dict):
            items = items.get("laboratories", items.get("items", items))
        if isinstance(items, dict):
            items = [{"name": key, **(value if isinstance(value, dict) else {"logo": value})} for key, value in items.items()]
        logos = {}
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict):
                continue
            name = next((item[k] for k in ("name", "nombre", "brand", "marca", "laboratorio") if item.get(k)), "")
            url = next((item[k] for k in ("logo_url", "logoUrl", "logo", "image_url", "imageUrl", "image", "url") if item.get(k)), "")
            if name and isinstance(url, str) and urllib.parse.urlparse(url).scheme in ("https", "http") and urllib.parse.urlparse(url).netloc:
                logos[slug(name)] = url
        return logos
    except Exception as error:
        print(f"No se pudieron cargar logos de laboratorios: {error}")
        return {}


def read(record, *keys):
    p = record.get("product") or {}
    for key in keys:
        if p.get(key):
            return str(p[key]).strip()
    return ""


def template(kind, title, url_slug, count, image_url=''):
    plural = "categorias" if kind == "categoria" else "laboratorios"
    heading = escape(title)
    description = (f"Compra suplementos de {title} en Medellín con Lift Nutrientes. Consulta productos, precios y disponibilidad. Envíos a Bogotá, Cali y Colombia." if kind == "laboratorio" else f"Compra {title} en Medellín con Lift Nutrientes. Encuentra suplementos, precios y presentaciones. Envíos a Bogotá, Cali y toda Colombia.")[:160]
    if kind == "laboratorio" and url_slug == "nutramerican-pharma":
        description = "Compra suplementos Nutramerican Pharma en Medellín. Explora el catálogo, compara presentaciones y consulta precios y disponibilidad en SUPGO."
    canonical = f"https://supgo.co/{plural}/{url_slug}/"
    safe_title = escape(f"{title} en Medellín | SUPGO" if kind == "laboratorio" else f"{title} | SUPGO", quote=True)
    if kind == "laboratorio" and url_slug == "nutramerican-pharma":
        safe_title = escape("Nutramerican Pharma en Medellín | Suplementos SUPGO", quote=True)
    safe_description = escape(description, quote=True)
    social = f"""<meta property="og:type" content="website">
<meta property="og:site_name" content="SUPGO">
<meta property="og:locale" content="es_CO">
<meta property="og:title" content="{safe_title}">
<meta property="og:description" content="{safe_description}">
<meta property="og:url" content="{canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{safe_title}">
<meta name="twitter:description" content="{safe_description}">"""
    if image_url:
        url = escape(image_url, quote=True)
        social += f'\n<meta property="og:image" content="{url}"><meta name="twitter:image" content="{url}">'
    data = json.dumps({"@context": "https://schema.org", "@type": "CollectionPage", "name": title, "url": canonical, "description": description}, ensure_ascii=False)
    safe_json = data.replace("<", "\\u003c")
    extra_content = ""
    h1 = heading
    if kind == "laboratorio" and url_slug == "nutramerican-pharma":
        h1 = "Suplementos Nutramerican Pharma en Medellín"
        extra_content = """<section class="seo-laboratorio" aria-label="Información sobre Nutramerican Pharma" style="margin:22px 0 28px;line-height:1.75">
<h2>Comprar Nutramerican Pharma en Medellín</h2>
<p>Explora el catálogo de suplementos deportivos Nutramerican Pharma en SUPGO. Desde Medellín puedes consultar las referencias publicadas, revisar sus presentaciones y comparar los precios mostrados en cada ficha. La disponibilidad se confirma al realizar el pedido, porque el inventario puede cambiar.</p>
<h2>Suplementos deportivos y presentaciones</h2>
<p>Si buscas productos Nutramerican Pharma, revisa la información de cada referencia antes de comprar: nombre, presentación, ingredientes y condiciones de uso indicadas por el fabricante. Entre las búsquedas habituales de la marca están los ganadores de masa como Mass Gainer; comprueba las opciones efectivamente listadas en el catálogo, sin asumir que todas las presentaciones estén disponibles.</p>
<h2>Pedidos desde Medellín y otras ciudades de Colombia</h2>
<p>Medellín es nuestra ubicación principal de atención. También puedes consultar opciones de compra y envío hacia Bogotá, Cali, Barranquilla, Cartagena, Bucaramanga y Pereira. El costo y la cobertura se determinan al confirmar tu pedido.</p>
<h2>Encuentra el suplemento que buscas</h2>
<p>Explora <a href="/laboratorios/">otras marcas de suplementos</a>, compara <a href="/categorias/">categorías de productos</a>, utiliza el <a href="/buscar/">buscador de suplementos</a> o consulta las <a href="/ofertas/">ofertas disponibles</a>. Estos cuatro accesos te permiten navegar por el catálogo sin perder la página del laboratorio.</p>
</section>"""
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{safe_title}</title><meta name="description" content="{escape(description, quote=True)}">
<link rel="canonical" href="{canonical}">\n{social}
<script type="application/ld+json">{safe_json}</script>
<link rel="stylesheet" href="/paginas/supgo-pages.css"></head>
<body data-page="{kind}" data-slug="{escape(url_slug, quote=True)}">
<header class="topbar"><div class="topinner"><a class="logo" href="/">SUPGO</a>
<nav class="nav"><a href="/categorias/">Categorías</a><a href="/laboratorios/">Laboratorios</a><a href="/buscar/">Buscar</a><a href="/favoritos/">♡ Favoritos</a><a href="/carrito/">🛒 <span id="cartcount">0</span></a><a href="/mis-pedidos/">Mis pedidos</a></nav></div></header>
<main class="site"><h1>{h1}</h1><p class="muted">{escape(description)}</p>\n{extra_content}
<div class="toolbar"><label for="sort">Ordenar:</label><select id="sort" onchange="window.supgoPages?.render()"><option value="">Nombre</option><option value="asc">Menor precio</option><option value="desc">Mayor precio</option></select></div>
<div id="content"><p class="loading">Cargando {count} productos…</p></div></main>
<script defer src="/paginas/supgo-pages.js"></script></body></html>"""


def main():
    rows = load()
    logos = load_logos()
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
            dest.write_text(template(kind, name, slug(name), count, logos.get(slug(name), "") if kind == "laboratorio" else ""), encoding="utf-8")
            total += 1
    print(f"Generadas {total} páginas individuales de categorías y laboratorios.")


if __name__ == "__main__":
    main()
