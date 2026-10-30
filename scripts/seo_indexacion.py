#!/usr/bin/env python3
"""Indexación SUPGO: limpia fichas duplicadas y publica el sitemap índice.

Funciona sin red, solo con los HTML del repositorio. Es idempotente: se puede
ejecutar tras cada generación de páginas.

1. Fichas fuera de sitemap-productos.xml que Google podía indexar:
   - si existe la ficha vigente del mismo producto (mismo SKU), su canonical
     pasa a apuntar a ella;
   - si no existe, se marcan noindex, follow.
2. Sitemaps con <lastmod>:
   sitemap.xml (índice) -> sitemaps/paginas.xml, sitemaps/guias.xml, sitemaps/productos.xml
   Solo entran URLs que existen, no tienen noindex y son canónicas de sí mismas.
   lastmod cambia únicamente cuando cambia el texto visible de la página
   (estado guardado en sitemaps/estado.json).
"""
from datetime import date
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://supgo.co"
PRODUCTS = ROOT / "productos"
APPROVED = ROOT / "sitemap-productos.xml"
OUT_DIR = ROOT / "sitemaps"
STATE = OUT_DIR / "estado.json"
TODAY = date.today().isoformat()

# Páginas públicas que no son fichas. Lo demás (carrito, checkout, admin...) queda fuera.
PAGE_GLOBS = [
    "home/index.html",
    "productos/index.html",
    "categorias/index.html",
    "categorias/*/index.html",
    "laboratorios/index.html",
    "laboratorios/*/index.html",
    "ofertas/index.html",
    "politica-de-devoluciones/index.html",
    "tratamiento-de-datos/index.html",
]
GUIDE_GLOBS = ["guias/index.html", "guias/*.html"]

ROBOTS_RE = re.compile(r'<meta\s+name=["\']robots["\'][^>]*>', re.I)
CANONICAL_RE = re.compile(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']*)["\']\s*/?>', re.I)


def head(html):
    return html.split("</head>", 1)[0]


def is_noindex(html):
    tag = ROBOTS_RE.search(head(html))
    return bool(tag and "noindex" in tag.group(0).lower())


def canonical(html):
    match = CANONICAL_RE.search(head(html))
    return match.group(1).strip() if match else ""


def url_for(path):
    rel = path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    return f"{BASE}/{rel}"


def product_info(html):
    """(sku, nombre) del schema Product."""
    for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        if isinstance(data, dict) and data.get("@type") == "Product":
            return str(data.get("sku") or ""), str(data.get("name") or "")
    return "", ""


def tokens(text):
    import unicodedata
    raw = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode().lower()
    stop = {"de", "con", "x", "y", "en", "la", "el", "serv", "servicios", "caps", "lb", "lbs", "gr", "g", "mg"}
    return {t for t in re.findall(r"[a-z0-9]+", raw) if t not in stop}


def same_product(name_a, name_b):
    """Los ID del catálogo anterior se reutilizaron para otros productos:
    solo se unifica si los nombres coinciden de verdad."""
    a, b = tokens(name_a), tokens(name_b)
    if not a or not b:
        return False
    small, big = (a, b) if len(a) <= len(b) else (b, a)
    return len(small & big) / len(small) >= 0.8


def set_noindex(html):
    tag = '<meta name="robots" content="noindex, follow">'
    if ROBOTS_RE.search(head(html)):
        return ROBOTS_RE.sub(tag, html, count=1)
    return html.replace("</head>", tag + "\n</head>", 1)


def clean_duplicates(approved):
    sku_to_url = {}
    for url in approved:
        path = PRODUCTS / url.rsplit("/", 1)[1]
        if path.exists():
            sku, name = product_info(path.read_text(encoding="utf-8", errors="replace"))
            if sku:
                sku_to_url[sku] = (url, name)
    redirected = noindexed = 0
    for path in sorted(PRODUCTS.glob("*.html")):
        if path.name == "index.html":
            continue
        url = url_for(path)
        if url in approved:
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        if is_noindex(html):
            continue
        sku, name = product_info(html)
        target, target_name = sku_to_url.get(sku, ("", ""))
        if target and target != url and same_product(name, target_name):
            if canonical(html) == target:
                continue
            if CANONICAL_RE.search(head(html)):
                updated = CANONICAL_RE.sub(f'<link rel="canonical" href="{target}">', html, count=1)
            else:
                updated = html.replace("</head>", f'<link rel="canonical" href="{target}">\n</head>', 1)
            redirected += 1
        else:
            updated = set_noindex(html)
            noindexed += 1
        path.write_text(updated, encoding="utf-8")
    print(f"Fichas duplicadas con canonical a la vigente: {redirected}; fichas sin vigente marcadas noindex: {noindexed}")


def visible_text(html):
    body = html.split("<body", 1)[-1]
    body = re.sub(r"<(script|style|noscript)\b.*?</\1>", " ", body, flags=re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)).strip()


def collect(paths, state, problems):
    urls = []
    for path in paths:
        html = path.read_text(encoding="utf-8", errors="replace")
        url = url_for(path)
        if is_noindex(html):
            continue
        if canonical(html) != url:
            problems.append(f"{path.relative_to(ROOT)}: canonical {canonical(html) or '(ninguno)'}")
            continue
        digest = hashlib.sha1(visible_text(html).encode("utf-8")).hexdigest()[:16]
        entry = state.get(url)
        if not entry or entry.get("h") != digest:
            entry = {"h": digest, "d": TODAY}
        state[url] = entry
        urls.append((url, entry["d"]))
    return urls


def expand(globs):
    found = []
    for pattern in globs:
        for path in sorted(ROOT.glob(pattern)):
            if path.is_file() and path not in found:
                found.append(path)
    return found


def write_urlset(name, urls):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    lines += [f"<url><loc>{u}</loc><lastmod>{d}</lastmod></url>" for u, d in urls]
    lines.append("</urlset>")
    (OUT_DIR / name).write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    if not APPROVED.exists():
        sys.exit("ERROR: falta sitemap-productos.xml")
    approved = set(re.findall(r"<loc>\s*(https://supgo\.co/productos/[^<\s]+)\s*</loc>", APPROVED.read_text(encoding="utf-8")))
    if not approved:
        sys.exit("ERROR: sitemap-productos.xml sin URLs")

    clean_duplicates(approved)

    OUT_DIR.mkdir(exist_ok=True)
    try:
        old_state = json.loads(STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        old_state = {}
    state = {}
    for url, entry in old_state.items():
        state[url] = entry
    problems = []
    pages = collect(expand(PAGE_GLOBS), state, problems)
    guides = collect(expand(GUIDE_GLOBS), state, problems)
    product_paths = [PRODUCTS / u.rsplit("/", 1)[1] for u in sorted(approved) if (PRODUCTS / u.rsplit("/", 1)[1]).exists()]
    products = collect(product_paths, state, problems)
    if len(products) < len(approved) * 0.9:
        sys.exit(f"ERROR: solo {len(products)} de {len(approved)} fichas son válidas; se conserva el sitemap anterior")

    published = {u for u, _ in pages + guides + products}
    state = {u: e for u, e in state.items() if u in published}
    write_urlset("paginas.xml", pages)
    write_urlset("guias.xml", guides)
    write_urlset("productos.xml", products)

    def newest(urls):
        return max((d for _, d in urls), default=TODAY)
    index = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for name, urls in (("paginas.xml", pages), ("guias.xml", guides), ("productos.xml", products)):
        index.append(f"<sitemap><loc>{BASE}/sitemaps/{name}</loc><lastmod>{newest(urls)}</lastmod></sitemap>")
    index.append("</sitemapindex>")
    (ROOT / "sitemap.xml").write_text("\n".join(index) + "\n", encoding="utf-8")
    STATE.write_text(json.dumps(state, ensure_ascii=False, sort_keys=True, indent=0) + "\n", encoding="utf-8")

    robots = ROOT / "robots.txt"
    text = robots.read_text(encoding="utf-8") if robots.exists() else "User-agent: *\nAllow: /\n"
    text = re.sub(r"(?im)^Sitemap:.*\n?", "", text).rstrip() + f"\n\nSitemap: {BASE}/sitemap.xml\n"
    robots.write_text(text, encoding="utf-8")

    print(f"Sitemap índice: {len(pages)} páginas, {len(guides)} guías, {len(products)} fichas")
    if problems:
        print(f"Excluidas por canonical distinto ({len(problems)}):")
        print("\n".join("  " + p for p in problems[:40]))


if __name__ == "__main__":
    main()
