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

import sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from seo_listados_textos import TEXTOS  # noqa: E402

# Norma sanitaria (Decreto 3249 de 2006): los textos propios no pueden prometer efectos.
PALABRAS_PROHIBIDAS = re.compile(
    r"\b(beneficio\w*|mejora\w*|aumenta\w*|quema\w*|adelgaz\w*|fortalec\w*|previen\w*|prevenir|cura\w*|"
    r"rendimiento|masa muscular|definici[oó]n muscular|inmun\w*|antioxidante\w*|desinflama\w*|"
    r"recuperaci[oó]n muscular|resultados garantizados|el mejor|la mejor|los mejores|las mejores|milagro\w*)\b", re.I)
# Nombres propios de categorías que contienen palabras de la lista y sí pueden aparecer.
NOMBRES_PERMITIDOS = re.compile(r"\bquemadores\b|categor[ií]a quemadores", re.I)


def revisar_textos():
    for key, t in TEXTOS.items():
        partes = [t.get("title", ""), t.get("meta", ""), t.get("h1", ""), t.get("intro", "")]
        partes += [h + " " + b for h, b in t.get("secciones", [])] + [q + " " + a for q, a in t.get("faq", [])]
        plano = NOMBRES_PERMITIDOS.sub(" ", re.sub(r"<[^>]+>", " ", " ".join(partes)))
        hit = PALABRAS_PROHIBIDAS.search(plano)
        if hit:
            raise SystemExit(f"ERROR: el texto SEO de {key} usa «{hit.group(0)}», que puede leerse como promesa de efectos")
        if len(t.get("meta", "")) > 160:
            raise SystemExit(f"ERROR: la meta descripción de {key} supera 160 caracteres")

# Versión de los assets de cuadrícula: se lee del JS para que HTML, CSS y JS siempre coincidan.
ASSET_V = (re.search(r"ASSET_V='([^']+)'", (pathlib.Path(__file__).resolve().parent.parent / 'paginas' / 'supgo-pages.js').read_text(encoding='utf-8')) or [None, 'v1'])[1]

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = os.getenv("SUPABASE_URL", "https://vdxkknftyssjyfbdieqa.supabase.co").rstrip("/") + "/rest/v1/lift_productos"
KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh")


def slug(value):
    raw = unicodedata.normalize("NFD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", raw))


BASE = "https://supgo.co"
HIDDEN_BRANDS = {"venom-pharma"}
NOINDEX_SLUGS = {"pruebas"}
LIST_STYLE = (".seo-productos{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}"
              ".seo-productos a{display:block;border:1px solid #e7e7e7;border-radius:9px;padding:12px 14px;font-weight:500;line-height:1.35}"
              ".seo-productos a:hover{border-color:#16a34a}.seo-productos small{display:block;color:#777;font-size:11px;font-weight:400}"
              ".seo-grupo{margin:28px 0 10px;font-size:19px}"
              ".seo-guias{margin:4px 0 18px}.seo-guias h2{font-size:15px;margin:0 0 8px}.seo-guias nav{display:flex;flex-wrap:wrap;gap:8px}"
              ".seo-guias a{border:1px solid #e2e2e2;border-radius:30px;padding:7px 13px;font-size:13px}.seo-guias a:hover{border-color:#16a34a;color:#16a34a}"
              ".seo-rel{margin:4px 0 16px}.seo-rel h2{font-size:15px;margin:0 0 8px}.seo-rel nav{display:flex;flex-wrap:wrap;gap:8px}"
              ".seo-rel a,.seo-rel span{border:1px solid #e2e2e2;border-radius:30px;padding:7px 13px;font-size:13px}.seo-rel a:hover{border-color:#16a34a;color:#16a34a}.seo-rel small{color:#888;margin-left:4px}"
              ".seo-texto{margin:36px 0 10px;padding-top:22px;border-top:1px solid #ececec;line-height:1.7;max-width:820px}.seo-texto h2{font-size:20px;margin:22px 0 8px}"
              ".seo-texto ul{padding-left:20px}.seo-texto li{margin:4px 0}.seo-texto a{color:#15803d;text-decoration:underline}"
              ".seo-faq details{border:1px solid #e7e7e7;border-radius:10px;padding:12px 14px;margin:8px 0}.seo-faq summary{font-weight:600;cursor:pointer}.seo-faq p{margin:8px 0 0}")


def load():
    """Lee el catálogo activo. SUPGO_ROWS_FILE permite probar sin red con un JSON local."""
    local = os.getenv("SUPGO_ROWS_FILE")
    if local:
        return json.loads(pathlib.Path(local).read_text(encoding="utf-8"))
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


def approved_urls():
    """URLs de fichas indexables según el sitemap que publica generar_paginas_seo.py."""
    path = ROOT / "sitemap-productos.xml"
    if not path.exists():
        return set()
    return set(re.findall(r"<loc>\s*(https://supgo\.co/productos/[^<\s]+)\s*</loc>", path.read_text(encoding="utf-8")))


def product_path(row):
    name = read(row, "name", "nombre")
    return f"/productos/{slug(name) or 'producto'}-{row.get('id')}.html"


def linkable(rows, approved):
    """Productos con ficha publicada e indexable: (nombre, ruta, marca, categoría)."""
    items = []
    seen = set()
    for row in rows:
        if slug(read(row, "brand", "marca")) in HIDDEN_BRANDS:
            continue
        path = product_path(row)
        if BASE + path not in approved or path in seen or not (ROOT / path.lstrip("/")).exists():
            continue
        seen.add(path)
        items.append((read(row, "name", "nombre"), path, read(row, "brand", "marca"), read(row, "category", "categoria")))
    return sorted(items, key=lambda x: x[0].casefold())


def product_list(items, show_brand=True):
    """Lista estática de enlaces: Google la ve sin ejecutar JavaScript.
    supgo-pages.js la sustituye por la cuadrícula interactiva al cargar."""
    if not items:
        return ""
    lis = "".join(
        f'<li><a href="{escape(path, quote=True)}">{escape(name)}'
        + (f"<small>{escape(brand)}</small>" if show_brand and brand else "")
        + "</a></li>"
        for name, path, brand, _ in items
    )
    return f'<ul class="seo-productos">{lis}</ul>'


def load_guides():
    """Registro de guías que escribe scripts/generar_guias.py."""
    try:
        return json.loads((ROOT / "guias" / "guias.json").read_text(encoding="utf-8"))
    except Exception:
        return []


GUIDES = load_guides()


def guides_block(kind, url_slug):
    field = "categorias" if kind == "categoria" else "marcas"
    own = [g for g in GUIDES if url_slug in (g.get(field) or [])]
    if not own:
        return ""
    links = "".join(f'<a href="{escape(g["url"], quote=True)}">{escape(g["titulo"])}</a>' for g in own[:6])
    return f'<section class="seo-guias" aria-label="Guías de compra"><h2>Guías de compra</h2><nav>{links}</nav></section>'


def template(kind, title, url_slug, count, image_url='', items=(), related=()):
    plural = "categorias" if kind == "categoria" else "laboratorios"
    heading = escape(title)
    description = (f"Compra suplementos de {title} en Medellín en SUPGO. Consulta productos, precios y disponibilidad. Envíos a Bogotá, Cali y Colombia." if kind == "laboratorio" else f"Compra {title} en Medellín en SUPGO. Encuentra suplementos, precios y presentaciones. Envíos a Bogotá, Cali y toda Colombia.")[:160]
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
    texto = TEXTOS.get((kind, url_slug))
    after_content = ""
    intro = description
    if texto:
        description = texto["meta"]
        safe_title = escape(texto["title"], quote=True)
        safe_description = escape(description, quote=True)
        h1 = escape(texto["h1"])
        intro = texto["intro"]
        extra_content = ""
        social = re.sub(r'(og:title|twitter:title)" content="[^"]*"', lambda m: m.group(1) + '" content="' + safe_title + '"', social)
        social = re.sub(r'(og:description|twitter:description)" content="[^"]*"', lambda m: m.group(1) + '" content="' + safe_description + '"', social)
        data = json.dumps({"@context": "https://schema.org", "@type": "CollectionPage", "name": texto["h1"], "url": canonical, "description": description}, ensure_ascii=False)
        safe_json = data.replace("<", "\\u003c")
        secciones = "".join(f"<h2>{escape(h)}</h2>{body}" for h, body in texto.get("secciones", []))
        faq = "".join(f"<details><summary>{escape(q)}</summary><p>{escape(a)}</p></details>" for q, a in texto.get("faq", []))
        after_content = (f'<section class="seo-texto" aria-label="Información de compra">{secciones}'
                         + (f'<div class="seo-faq"><h2>Preguntas frecuentes</h2>{faq}</div>' if faq else "")
                         + '<p style="color:#888;font-size:12px;margin-top:18px">La información describe presentaciones, datos de etiqueta y condiciones de compra; no constituye una recomendación de uso. Lee siempre el rótulo del producto.</p></section>')
    related_html = ""
    if related:
        label = "Marcas en esta categoría" if kind == "categoria" else "Categorías de esta marca"
        chips = "".join((f'<a href="{escape(url, quote=True)}">{escape(name)}<small>{n}</small></a>' if url else f'<span>{escape(name)}<small>{n}</small></span>') for name, url, n in related[:12])
        related_html = f'<section class="seo-rel" aria-label="{label}"><h2>{label}</h2><nav>{chips}</nav></section>'
    indexable = url_slug not in NOINDEX_SLUGS
    robots = '<meta name="robots" content="index, follow">\n' if indexable else '<meta name="robots" content="noindex, follow">\n'
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{safe_title}</title><meta name="description" content="{escape(description, quote=True)}">
{robots}<link rel="canonical" href="{canonical}">\n{social}
<script type="application/ld+json">{safe_json}</script>
<link rel="stylesheet" href="/paginas/supgo-pages.css?v={ASSET_V}"><style>{LIST_STYLE}</style></head>
<body data-page="{kind}" data-slug="{escape(url_slug, quote=True)}">
<header class="topbar"><div class="topinner"><a class="logo" href="/">SUPGO</a>
<nav class="nav"><a href="/categorias/">Categorías</a><a href="/laboratorios/">Laboratorios</a><a href="/buscar/">Buscar</a><a href="/favoritos/">♡ Favoritos</a><a href="/carrito/">🛒 <span id="cartcount">0</span></a><a href="/mi-pedido/">Mi pedido</a></nav></div></header>
<main class="site"><h1>{h1}</h1><p class="muted">{escape(intro)}</p>\n{extra_content}{related_html}{guides_block(kind, url_slug)}
<div class="toolbar"><label for="sort">Ordenar:</label><select id="sort" onchange="window.supgoPages?.render()"><option value="">Nombre</option><option value="asc">Menor precio</option><option value="desc">Mayor precio</option></select></div>
<div id="content"><p class="loading">Cargando {count} productos…</p>{product_list(items, kind == "categoria")}</div>{after_content}</main>
<script defer src="/paginas/supgo-pages.js?v={ASSET_V}"></script></body></html>"""


def page_shell(title, description, canonical, body):
    safe_title = escape(title, quote=True)
    safe_description = escape(description, quote=True)
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{safe_title}</title><meta name="description" content="{safe_description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="SUPGO"><meta property="og:locale" content="es_CO">
<meta property="og:title" content="{safe_title}"><meta property="og:description" content="{safe_description}"><meta property="og:url" content="{canonical}">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/paginas/supgo-pages.css?v={ASSET_V}"><style>{LIST_STYLE}</style></head>
<body data-page="listado-estatico">
<header class="topbar"><div class="topinner"><a class="logo" href="/">SUPGO</a>
<nav class="nav"><a href="/categorias/">Categorías</a><a href="/laboratorios/">Laboratorios</a><a href="/buscar/">Buscar</a><a href="/ofertas/">Ofertas</a><a href="/carrito/">🛒 Carrito</a></nav></div></header>
<main class="site">{body}</main></body></html>
"""


def write_all_products(items):
    """/productos/ es la miga de pan de todas las fichas; antes devolvía 404."""
    groups = {}
    for item in items:
        groups.setdefault(item[3] or "Otros", []).append(item)
    sections = []
    for category in sorted(groups, key=str.casefold):
        cat_slug = slug(category)
        heading = f'<a href="/categorias/{cat_slug}/">{escape(category)}</a>' if (ROOT / "categorias" / cat_slug / "index.html").exists() else escape(category)
        sections.append(f'<h2 class="seo-grupo">{heading}</h2>{product_list(groups[category])}')
    body = ("<h1>Todos los productos</h1><p class=\"muted\">Catálogo completo de suplementos SUPGO: proteínas, creatinas, "
            "preentrenos, vitaminas y más, con envíos en Medellín y toda Colombia.</p>" + "".join(sections))
    html = page_shell("Todos los productos | SUPGO", "Catálogo completo de suplementos deportivos SUPGO. Envíos en Medellín y toda Colombia.",
                      BASE + "/productos/", body)
    (ROOT / "productos" / "index.html").write_text(html, encoding="utf-8")


LAB_ALIAS = {"basic-supplements": "basic", "insane-labz": "insane", "optimum-nutrition": "on", "hi-tech-pharmaceuticals": "hitech"}


def write_hub(plural, groups, logos):
    """Lista inicial de /categorias/ y /laboratorios/ en el HTML: se ve al instante
    y Google la lee. supgo-pages.js la reemplaza con datos frescos al cargar."""
    path = ROOT / plural / "index.html"
    if not path.exists() or not groups:
        return
    if plural == "laboratorios":
        # Lista de páginas de laboratorio existentes: el home la usa para enlazar los logos.
        (ROOT / plural / "slugs.json").write_text(json.dumps(sorted(slug(n) for n in groups)), encoding="utf-8")
    html = path.read_text(encoding="utf-8")
    cards = []
    for name in sorted(groups, key=lambda x: x.casefold()):
        key = slug(name)
        label = escape(name)
        count = f"<small>{groups[name]} productos</small>"
        if plural == "laboratorios":
            logo = logos.get(key) or logos.get(LAB_ALIAS.get(key, ""), "")
            img = (f'<img class="labLogo" src="{escape(logo, quote=True)}" alt="Logo de {label}" loading="lazy" decoding="async" onerror="this.remove()">' if logo else "")
            cards.append(f'<a class="labLogoCard" href="/{plural}/{key}/">{img}{label}<span class="labViewButton">Ver productos →</span>{count}</a>')
        else:
            cards.append(f'<a href="/{plural}/{key}/">{label}{count}</a>')
    block = '<div id="content"><div class="links">' + "".join(cards) + "</div></div>"
    updated, n = re.subn(r'<div id="content">.*?</div>(?=</main>)', lambda m: block, html, count=1, flags=re.S)
    if n and updated != html:
        path.write_text(updated, encoding="utf-8")


HOME_START = "<!-- SEO-EXPLORA:INICIO (generado por scripts/generar_listados_seo.py) -->"
HOME_END = "<!-- SEO-EXPLORA:FIN -->"


def guide_links():
    links = []
    for path in sorted((ROOT / "guias").glob("*.html")):
        if path.name == "index.html":
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        match = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
        if not match or re.search(r'<meta[^>]+robots[^>]+noindex', html, re.I):
            continue
        title = re.sub(r"\s*\|.*$", "", re.sub(r"<[^>]+>", "", match.group(1))).strip()
        links.append((title, f"/guias/{path.name}"))
    return links


def write_home_block(categories, labs):
    """Enlaces rastreables desde la portada hacia categorías, marcas y guías."""
    home = ROOT / "home" / "index.html"
    if not home.exists():
        return
    def links(pairs):
        return "".join(f'<a href="{escape(url, quote=True)}">{escape(text)}</a>' for text, url in pairs)
    block = (HOME_START
        + '<section class="seo-explora" aria-labelledby="seo-explora-titulo"><style>'
        + ".seo-explora{margin:46px 0 10px}.seo-explora h2{font-size:clamp(21px,3vw,28px);letter-spacing:-.04em;margin:0 0 6px}"
        + ".seo-explora h3{font-size:15px;margin:22px 0 10px}.seo-explora nav{display:flex;flex-wrap:wrap;gap:8px}"
        + ".seo-explora nav a{border:1px solid #e5e5e5;border-radius:30px;padding:7px 13px;font-size:12.5px}.seo-explora nav a:hover{border-color:#16a34a;color:#16a34a}"
        + ".seo-explora details{margin-top:22px}.seo-explora summary{cursor:pointer;font-weight:600;font-size:15px;list-style:none;display:flex;align-items:center;gap:8px}.seo-explora summary::-webkit-details-marker{display:none}.seo-explora summary::after{content:'⌄';color:#16a34a}.seo-explora details[open] summary::after{content:'⌃'}.seo-explora details nav{margin-top:10px}"
        + '</style><h2 id="seo-explora-titulo">Explora el catálogo</h2>'
        + '<p>Encuentra suplementos por categoría, marca o guía de compra. <a href="/productos/"><b>Ver todos los productos →</b></a></p>'
        + f'<details><summary>Categorías ({len(categories)})</summary><nav aria-label="Categorías">{links(categories)}</nav></details>'
        + f'<details><summary>Marcas ({len(labs)})</summary><nav aria-label="Marcas">{links(labs)}</nav></details>'
        + f'<details open><summary>Guías de compra</summary><nav aria-label="Guías">{links(guide_links())}</nav></details>'
        + "</section>" + HOME_END)
    html = home.read_text(encoding="utf-8")
    if HOME_START in html and HOME_END in html:
        start = html.index(HOME_START)
        end = html.index(HOME_END) + len(HOME_END)
        updated = html[:start] + block + html[end:]
    elif '<footer class="footer">' in html:
        updated = html.replace('<footer class="footer">', block + '\n<footer class="footer">', 1)
    elif "</main>" in html:
        updated = html.replace("</main>", block + "\n</main>", 1)
    else:
        print("ADVERTENCIA: no se encontró dónde insertar enlaces en home/index.html")
        return
    if updated != html:
        home.write_text(updated, encoding="utf-8")


def related_groups(rows, kind):
    """Para cada categoría: sus marcas; para cada marca: sus categorías (nombre, URL o '', productos)."""
    own_keys, other_keys = (("category", "categoria"), ("brand", "marca")) if kind == "categoria" else (("brand", "marca"), ("category", "categoria"))
    other_plural = "laboratorios" if kind == "categoria" else "categorias"
    counts = {}
    for row in rows:
        a, b = read(row, *own_keys), read(row, *other_keys)
        if not a or not b or slug(b) in HIDDEN_BRANDS or slug(b) in NOINDEX_SLUGS or slug(a) in HIDDEN_BRANDS:
            continue
        counts.setdefault(slug(a), {}).setdefault(b, 0)
        counts[slug(a)][b] += 1
    out = {}
    for key, others in counts.items():
        lst = []
        for name, n in sorted(others.items(), key=lambda x: (-x[1], x[0].casefold())):
            url = f"/{other_plural}/{slug(name)}/"
            lst.append((name, url if (ROOT / other_plural / slug(name) / "index.html").exists() else "", n))
        out[key] = lst
    return out


def main():
    revisar_textos()
    rows = load()
    logos = load_logos()
    approved = approved_urls()
    items = linkable(rows, approved)
    print(f"Fichas indexables enlazables: {len(items)} de {len(approved)} en sitemap-productos.xml")
    if approved and len(items) < len(approved) * 0.5:
        raise SystemExit("ERROR: menos de la mitad de las fichas del sitemap coinciden con el catálogo; no se publica")
    hub = {"categoria": [], "laboratorio": []}
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
        write_hub(plural, {k: v for k, v in groups.items() if slug(k) not in NOINDEX_SLUGS}, logos)
        index = 3 if kind == "categoria" else 2
        rel = related_groups(rows, kind)
        for name, count in groups.items():
            dest = ROOT / plural / slug(name) / "index.html"
            dest.parent.mkdir(parents=True, exist_ok=True)
            own = [item for item in items if slug(item[index]) == slug(name)]
            dest.write_text(template(kind, name, slug(name), count, logos.get(slug(name), "") if kind == "laboratorio" else "", own, rel.get(slug(name), [])), encoding="utf-8")
            if slug(name) not in NOINDEX_SLUGS:
                hub[kind].append((name, f"/{plural}/{slug(name)}/"))
            total += 1
    print(f"Generadas {total} páginas individuales de categorías y laboratorios.")
    if items:
        write_all_products(items)
        write_home_block(sorted(hub["categoria"], key=lambda x: x[0].casefold()),
                         sorted(hub["laboratorio"], key=lambda x: x[0].casefold()))
        print("Generados /productos/ y bloque de enlaces de la portada.")


if __name__ == "__main__":
    main()
