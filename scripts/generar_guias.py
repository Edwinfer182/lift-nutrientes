#!/usr/bin/env python3
"""Guías y comparativas de compra de SUPGO, con datos reales del catálogo.

Escribe:
  guias/<slug>.html        Guías nuevas con tablas de precios actualizadas a diario.
  guias/index.html         Índice de todas las guías.
  guias/guias.json         Registro guía -> categorías / marcas / productos. Lo leen
                           generar_listados_seo.py (categorías y marcas) y
                           generar_paginas_seo.py (fichas) para enlazar de vuelta.
  Bloque "Sigue explorando" en las guías antiguas (entre comentarios marcados).

Regla legal (Decreto 3249 de 2006, art. 24 y 25): los textos solo describen
composición declarada en la etiqueta, presentaciones, tamaños, sabores, precios,
envíos y pagos. Nunca efectos, beneficios, usos preventivos o terapéuticos, ni
comparaciones que desmeriten un producto. FORBIDDEN_WORDS lo verifica al generar.

Precios: precio del catálogo, o el de weekly_offers si es menor y no ha vencido.
Solo se enlazan fichas publicadas e indexables (presentes en sitemap-productos.xml).
Sin red: SUPGO_ROWS_FILE y SUPGO_OFFERS_FILE apuntan a JSON locales.
"""
import json
import os
import pathlib
import re
import statistics
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from html import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://supgo.co"
SB = os.getenv("SUPABASE_URL", "https://vdxkknftyssjyfbdieqa.supabase.co").rstrip("/")
KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh")
BOGOTA = timezone(timedelta(hours=-5))
NOW = datetime.now(BOGOTA)
YEAR = NOW.year
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
UPDATED = f"{NOW.day} de {MONTHS[NOW.month - 1]} de {NOW.year}"
HIDDEN_BRANDS = {"venom-pharma"}
LINKS_START, LINKS_END = "<!--guia-enlaces-->", "<!--/guia-enlaces-->"

# Palabras que no pueden aparecer en el texto visible de una guía nueva.
FORBIDDEN_WORDS = re.compile(
    r"\b(beneficio\w*|mejora\w*|aumenta\w*|quema\w*|adelgaz\w*|fortalec\w*|previen\w*|prevenir|cura\w*|"
    r"rendimiento|masa muscular|definici[oó]n muscular|inmun\w*|antioxidante\w*|desinflama\w*|"
    r"recuperaci[oó]n muscular|resultados garantizados|el mejor|la mejor|los mejores|las mejores|milagro\w*)\b", re.I)


def slug(value):
    raw = unicodedata.normalize("NFD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", raw))


def norm(value):
    return unicodedata.normalize("NFD", str(value or "")).encode("ascii", "ignore").decode().lower()


def cop(n):
    return "$ " + f"{int(round(n)):,}".replace(",", ".")


# ---------------------------------------------------------------- datos

def get_json(url):
    req = urllib.request.Request(url, headers={"apikey": KEY, "Authorization": "Bearer " + KEY, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as res:
        return json.load(res)


def load_rows():
    local = os.getenv("SUPGO_ROWS_FILE")
    if local:
        return json.loads(pathlib.Path(local).read_text(encoding="utf-8"))
    rows = []
    for offset in range(0, 6000, 1000):
        q = urllib.parse.urlencode({"select": "id,product,activo", "activo": "eq.true", "order": "id.asc", "limit": 1000, "offset": offset})
        page = get_json(f"{SB}/rest/v1/lift_productos?{q}")
        rows.extend(page)
        if len(page) < 1000:
            break
    return rows


def load_offers():
    local = os.getenv("SUPGO_OFFERS_FILE")
    if local:
        return json.loads(pathlib.Path(local).read_text(encoding="utf-8"))
    try:
        rows = get_json(f"{SB}/rest/v1/lift_catalog_config?select=valor&clave=eq.weekly_offers&limit=1")
        value = rows[0]["valor"] if rows else {}
        return json.loads(value) if isinstance(value, str) else (value or {})
    except Exception as error:  # sin ofertas se usa el precio del catálogo
        print("Aviso: no se pudieron leer las ofertas:", error)
        return {}


def approved_paths():
    path = ROOT / "sitemap-productos.xml"
    if not path.exists():
        return set()
    return set(re.findall(r"<loc>\s*https://supgo\.co(/productos/[^<\s]+)\s*</loc>", path.read_text(encoding="utf-8")))


def sale_price(pid, price, offers):
    o = offers.get(str(pid)) or {}
    try:
        sale = float(o.get("price") or 0)
    except (TypeError, ValueError):
        sale = 0
    if 0 < sale < price:
        until = str(o.get("promoUntil") or "")
        try:
            end = datetime.fromisoformat(until.replace("Z", "+00:00")) if until else None
        except ValueError:
            end = None
        if end is None or NOW <= end:
            return sale, True
    return price, False


def parse_size(text):
    """Gramos, libras, servicios y unidades declarados en el nombre o la presentación."""
    t = norm(text).replace(",", ".")
    grams = None
    m = re.search(r"(\d+(?:\.\d+)?)\s*(kg|kilo)", t)
    if m:
        grams = float(m.group(1)) * 1000
    else:
        m = re.search(r"(\d+(?:\.\d+)?)\s*(lb|lbs|libra)", t)
        if m:
            grams = float(m.group(1)) * 453.592
        else:
            m = re.search(r"(\d+(?:\.\d+)?)\s*(g|gr|grs|grm|gramos)\b", t)
            if m and float(m.group(1)) >= 50:
                grams = float(m.group(1))
    servings = None
    m = re.search(r"(\d+)\s*(serv|servicios|porciones|srv|servings)", t)
    if m:
        servings = int(m.group(1))
    units = None
    m = re.search(r"(\d+)\s*(caps|capsulas|tabletas|tabs|gomitas|gummies|unidades|sachets|chews)", t)
    if m:
        units = int(m.group(1))
    return grams, servings, units


def products(rows, offers):
    approved = approved_paths()
    items, seen = [], set()
    for r in rows:
        p = r.get("product") or {}
        if not r.get("activo", True) or p.get("__deleted") or p.get("__private") or p.get("adminOnly"):
            continue
        name = str(p.get("name") or p.get("nombre") or "").strip()
        brand = str(p.get("brand") or p.get("marca") or "").strip()
        if not name or slug(brand) in HIDDEN_BRANDS:
            continue
        path = f"/productos/{slug(name) or 'producto'}-{r.get('id')}.html"
        if path in seen or (approved and path not in approved) or not (ROOT / path.lstrip("/")).exists():
            continue
        try:
            base = float(p.get("price") or p.get("precio") or 0)
        except (TypeError, ValueError):
            base = 0
        if base < 15000:  # sachets o muestras de un servicio: distorsionan rangos de precio
            continue
        price, on_offer = sale_price(r.get("id"), base, offers)
        presentation = str(p.get("presentation") or "")
        grams, servings, units = parse_size(name + " " + presentation)
        image = str(p.get("image") or p.get("imagen") or "")
        seen.add(path)
        items.append({
            "id": r.get("id"), "name": name, "brand": brand, "category": str(p.get("category") or p.get("categoria") or ""),
            "path": path, "price": price, "base": base, "offer": on_offer, "grams": grams, "servings": servings, "units": units,
            "image": image if image.startswith("https://") else "", "key": norm(name + " " + brand),
        })
    return items


# ---------------------------------------------------------------- piezas HTML

def in_cats(item, *cats):
    return slug(item["category"]) in cats


def per_serving(item):
    return item["price"] / item["servings"] if item.get("servings") else None


def per_lb(item):
    return item["price"] / (item["grams"] / 453.592) if item.get("grams") and item["grams"] >= 300 else None


def size_label(item):
    parts = []
    g = item.get("grams")
    if g:
        if re.search(r"\d\s*(lb|lbs|libra)", norm(item["name"])):
            parts.append(f"{g / 453.592:.1f}".rstrip("0").rstrip(".").replace(".", ",") + " lb")
        elif g >= 1000:
            parts.append(f"{g / 1000:g}".replace(".", ",") + " kg")
        else:
            parts.append(f"{g:g} g")
    if item.get("servings"):
        parts.append(f"{item['servings']} servicios")
    elif item.get("units"):
        parts.append(f"{item['units']} unidades")
    return " · ".join(parts) or "Ver ficha"


def price_cell(item):
    return f"<strong>{cop(item['price'])}</strong>" + (f' <del>{cop(item["base"])}</del><span class="g-off">Oferta</span>' if item["offer"] else "")


def table(items, extra=None, caption=""):
    """Tabla de productos. extra = (encabezado, función -> texto) para una columna adicional."""
    if not items:
        return '<p class="g-note">No hay referencias publicadas en este momento. Revisa la categoría completa.</p>'
    head = "<th>Producto</th><th>Marca</th><th>Presentación</th><th>Precio</th>" + (f"<th>{escape(extra[0])}</th>" if extra else "")
    body = []
    for it in items:
        ex = ""
        if extra:
            v = extra[1](it)
            ex = f"<td>{escape(v) if v else '—'}</td>"
        body.append(f'<tr><td><a href="{escape(it["path"], quote=True)}">{escape(it["name"])}</a></td><td>{escape(it["brand"])}</td>'
                    f'<td>{escape(size_label(it))}</td><td>{price_cell(it)}</td>{ex}</tr>')
    cap = f"<caption>{escape(caption)}</caption>" if caption else ""
    return f'<div class="g-table"><table>{cap}<thead><tr>{head}</tr></thead><tbody>{"".join(body)}</tbody></table></div>'


def cards(items):
    out = []
    for it in items:
        img = (f'<img src="{escape(it["image"], quote=True)}" alt="{escape(it["name"], quote=True)}" loading="lazy" width="160" height="160">' if it["image"] else '<span class="g-ph"></span>')
        out.append(f'<a class="g-card" href="{escape(it["path"], quote=True)}">{img}<small>{escape(it["brand"])}</small><b>{escape(it["name"])}</b>{price_cell(it)}</a>')
    return f'<div class="g-cards">{"".join(out)}</div>' if out else ""


def chips(pairs):
    return '<nav class="g-chips">' + "".join(f'<a href="{escape(u, quote=True)}">{escape(t)}</a>' for t, u in pairs) + "</nav>"


def faq_html(faq):
    return "".join(f"<details class=\"g-faq\"><summary>{escape(q)}</summary><p>{a}</p></details>" for q, a in faq)


def plain(html_text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html_text)).strip()


def cat_link(cat_slug, label=None):
    path = ROOT / "categorias" / cat_slug / "index.html"
    if not path.exists():
        return None
    if not label:
        m = re.search(r"<h1>(.*?)</h1>", path.read_text(encoding="utf-8"), re.S)
        label = plain(m.group(1)) if m else cat_slug
    return (label, f"/categorias/{cat_slug}/")


def brand_link(brand_slug):
    path = ROOT / "laboratorios" / brand_slug / "index.html"
    if not path.exists():
        return None
    m = re.search(r"<h1>(.*?)</h1>", path.read_text(encoding="utf-8"), re.S)
    return (plain(m.group(1)) if m else brand_slug, f"/laboratorios/{brand_slug}/")


CSS = """
.g-wrap{max-width:900px;margin:auto}.g-wrap h1{font-size:clamp(27px,5vw,40px);line-height:1.15;letter-spacing:-.03em;margin:8px 0 10px}
.g-wrap h2{font-size:clamp(20px,3.4vw,25px);letter-spacing:-.02em;margin:34px 0 10px}.g-wrap h3{font-size:16px;margin:20px 0 6px}
.g-wrap p,.g-wrap li{font-size:15px;line-height:1.75;color:#2b2b2b}.g-lead{font-size:16.5px!important;color:#333}
.g-meta{color:#6b6b6b;font-size:12.5px;margin:0 0 12px}.g-crumb{font-size:12.5px;color:#6b6b6b}.g-crumb a{text-decoration:underline}
.g-box{background:#f6f7f6;border-radius:14px;padding:14px 16px;margin:16px 0}.g-box p{margin:6px 0}
.g-table{overflow-x:auto;border:1px solid #e7e7e7;border-radius:12px;margin:12px 0}.g-table table{border-collapse:collapse;width:100%;min-width:560px;font-size:13.5px}
.g-table caption{text-align:left;padding:10px 12px;font-weight:600;font-size:13px;background:#fafafa}
.g-table th{background:#fafafa;text-align:left;font-weight:600;font-size:12px;color:#555;padding:9px 12px;border-bottom:1px solid #eee;white-space:nowrap}
.g-table td{padding:9px 12px;border-bottom:1px solid #f1f1f1;vertical-align:top}.g-table tr:last-child td{border-bottom:0}
.g-table td a{text-decoration:underline;text-underline-offset:2px}.g-table del{color:#888;font-size:12px;margin-left:4px}
.g-off{display:inline-block;margin-left:6px;background:#e8f6ee;color:#167a45;font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:6px}
.g-vs table{min-width:0;table-layout:fixed}.g-vs th{white-space:normal}.g-vs th:first-child{width:30%}.g-vs th:first-child,.g-vs td:first-child{font-weight:600;background:#fcfcfc}
.g-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0}
.g-card{border:1px solid #e7e7e7;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:3px;font-size:13px}
.g-card:hover{border-color:#16a34a}.g-card img,.g-ph{width:100%;height:120px;object-fit:contain;display:block;background:#fafafa;border-radius:8px}
.g-card small{color:#777;font-size:11px}.g-card b{font-weight:500;line-height:1.3}.g-card del{color:#888;font-size:11px}
.g-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.g-chips a{border:1px solid #e2e2e2;border-radius:30px;padding:7px 13px;font-size:13px}.g-chips a:hover{border-color:#16a34a;color:#16a34a}
.g-faq{border-bottom:1px solid #eee;padding:4px 0}.g-faq summary{cursor:pointer;font-weight:600;font-size:15px;padding:10px 0}.g-faq p{margin:0 0 12px}
.g-note{font-size:12.5px!important;color:#6b6b6b!important}.g-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
.g-stat{border:1px solid #e7e7e7;border-radius:12px;padding:12px}.g-stat small{display:block;color:#6b6b6b;font-size:12px}.g-stat b{font-size:20px}
.g-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}.g-list a{border:1px solid #e7e7e7;border-radius:12px;padding:14px 16px;display:block}
.g-list a:hover{border-color:#16a34a}.g-list b{display:block;font-weight:600}.g-list span{font-size:13px;color:#666}
"""

DISCLAIMER = ('<p class="g-note">La información de composición proviene de la etiqueta del fabricante y puede variar por sabor o lote; '
              'revisa siempre el rótulo del producto que recibes. Los suplementos dietarios no sustituyen una alimentación balanceada. '
              'Si tienes una condición de salud, estás en embarazo o tomas medicamentos, consulta a un profesional de la salud antes de usarlos.</p>')

SHIPPING_FAQ = [
    ("¿Hacen envíos fuera de Medellín?", "Sí. Enviamos a Medellín y a otras ciudades de Colombia. El valor y el tiempo de entrega dependen del destino y de las unidades del pedido; los ves antes de pagar."),
    ("¿Cómo confirmo precio y disponibilidad?", "Abre la ficha de cada producto: el precio es el vigente en la tienda. La disponibilidad se confirma al recibir tu pedido, antes del pago."),
]


def page(slug_name, title, description, h1, body, faq, crumbs_label):
    canonical = f"{BASE}/guias/{slug_name}.html" if slug_name != "index" else f"{BASE}/guias/"
    ld = [
        {"@context": "https://schema.org", "@type": "Article", "headline": h1, "description": description, "inLanguage": "es-CO",
         "dateModified": NOW.date().isoformat(), "mainEntityOfPage": canonical,
         "author": {"@type": "Organization", "name": "SUPGO"}, "publisher": {"@type": "Organization", "name": "SUPGO", "url": BASE}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "SUPGO", "item": BASE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Guías", "item": BASE + "/guias/"},
            {"@type": "ListItem", "position": 3, "name": crumbs_label, "item": canonical}]},
    ]
    if faq:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in faq]})
    safe = [json.dumps(x, ensure_ascii=False).replace("<", "\\u003c") for x in ld]
    scripts = "".join(f'<script type="application/ld+json">{x}</script>' for x in safe)
    t, d = escape(title, quote=True), escape(description, quote=True)
    faq_block = f'<h2>Preguntas frecuentes</h2>{faq_html(faq)}' if faq else ""
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t}</title><meta name="description" content="{d}">
<meta name="robots" content="index, follow"><link rel="canonical" href="{canonical}">
<meta property="og:type" content="article"><meta property="og:site_name" content="SUPGO"><meta property="og:locale" content="es_CO">
<meta property="og:title" content="{t}"><meta property="og:description" content="{d}"><meta property="og:url" content="{canonical}">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
{scripts}
<link rel="stylesheet" href="/paginas/supgo-pages.css"><style>{CSS}</style></head>
<body data-page="guia">
<script defer src="/componentes/header-loader.js?v=20261022-oculto-inicial6"></script>
<main class="site"><article class="g-wrap">
<p class="g-crumb"><a href="/">SUPGO</a> › <a href="/guias/">Guías</a>{' › ' + escape(crumbs_label) if slug_name != 'index' else ''}</p>
<h1>{escape(h1)}</h1><p class="g-meta">Actualizado el {UPDATED} · Precios en pesos colombianos</p>
{body}
{faq_block}
</article></main></body></html>
"""


# ---------------------------------------------------------------- guías

def guide_iso_vs_gold(items):
    iso = [i for i in items if re.search(r"\biso ?100\b", i["key"]) and "dymatize" in i["key"]]
    gold = [i for i in items if "gold standard" in i["key"] and "whey" in i["key"] and "optimum" in norm(i["brand"])]
    if len(iso) < 2 or len(gold) < 2:
        return None

    def summary(group, scoop):
        sizes = sorted({round(i["grams"] / 453.592, 1) for i in group if i.get("grams")})
        cheapest = min(group, key=lambda i: i["price"])
        lbs = [per_lb(i) for i in group if per_lb(i)]
        return {
            "sizes": ", ".join(f"{s:g} lb".replace(".", ",") for s in sizes) or "—",
            "flavors": len(group), "from": cop(cheapest["price"]),
            "per_lb": cop(min(lbs)) if lbs else "—",
        }
    a, b = summary(iso, 30), summary(gold, 30.4)
    vs = f"""<div class="g-table g-vs"><table><thead><tr><th></th><th>ISO 100 (Dymatize)</th><th>100% Whey Gold Standard (Optimum Nutrition)</th></tr></thead><tbody>
<tr><td>Proteína declarada</td><td>Aislado de suero hidrolizado y aislado de suero</td><td>Mezcla de aislado de suero, concentrado de suero y péptidos de suero</td></tr>
<tr><td>Proteína por servicio (etiqueta)</td><td>25 g por servicio de 30 g aprox.</td><td>24 g por servicio de 30,4 g aprox.</td></tr>
<tr><td>Contiene</td><td colspan="2">Leche y, según el sabor, soya. Revisa la lista de alérgenos del rótulo.</td></tr>
<tr><td>Tamaños en SUPGO</td><td>{a['sizes']}</td><td>{b['sizes']}</td></tr>
<tr><td>Referencias publicadas</td><td>{a['flavors']}</td><td>{b['flavors']}</td></tr>
<tr><td>Precio desde</td><td>{a['from']}</td><td>{b['from']}</td></tr>
<tr><td>Menor precio por libra</td><td>{a['per_lb']}</td><td>{b['per_lb']}</td></tr>
</tbody></table></div>"""
    lb_col = ("Precio por libra", lambda i: cop(per_lb(i)) if per_lb(i) else "")
    sort = lambda g: sorted(g, key=lambda i: (i["grams"] or 0, i["price"], i["name"]))
    body = f"""<p class="g-lead">ISO 100 de Dymatize y 100% Whey Gold Standard de Optimum Nutrition son dos de las proteínas de suero que más se buscan en Colombia. Aquí las comparamos con datos de la etiqueta y con los precios actuales de SUPGO, para que elijas por composición, tamaño, sabor y presupuesto.</p>
<h2>Comparación rápida</h2>{vs}
<h2>Qué significa cada término de la etiqueta</h2>
<p><b>Aislado de suero (isolate):</b> proteína de suero de leche filtrada para que cada gramo de polvo tenga mayor proporción de proteína y menos grasa y carbohidratos.</p>
<p><b>Concentrado de suero:</b> proteína de suero con un proceso de filtrado menor; conserva algo más de grasa, carbohidratos y lactosa por gramo.</p>
<p><b>Hidrolizado:</b> proteína que pasó por un proceso que la fracciona en cadenas más cortas (péptidos).</p>
<p>ISO 100 declara solo aislados (uno de ellos hidrolizado). Gold Standard declara una mezcla en la que el aislado es el primer ingrediente.</p>
<h2>Cómo decidir entre las dos</h2>
<ul><li><b>Presupuesto:</b> compara el precio por libra de la tabla; en los envases grandes suele ser menor.</li>
<li><b>Composición:</b> si buscas una proteína declarada como 100 % aislado, esa es ISO 100; si prefieres una mezcla de aislado y concentrado, es Gold Standard.</li>
<li><b>Sabor y tamaño:</b> si es tu primera vez con una marca, un envase pequeño te deja probar el sabor antes de comprar uno grande.</li>
<li><b>Etiqueta:</b> revisa alérgenos (leche, soya) y el registro sanitario Invima en el rótulo.</li></ul>
<h2>ISO 100 en SUPGO</h2>{table(sort(iso), lb_col)}
<h2>100% Whey Gold Standard en SUPGO</h2>{table(sort(gold), lb_col)}
<h2>Sigue explorando</h2>{chips([x for x in (cat_link('proteinas-iso'), cat_link('proteinas-whey'), brand_link('dymatize'), brand_link('optimum-nutrition'), ('Precio de la proteína en Colombia', '/guias/precio-proteina-colombia.html'), ('Proteína para principiantes', '/guias/proteina-para-principiantes.html')) if x])}
{DISCLAIMER}"""
    faq = [
        ("¿Cuál tiene más proteína por servicio?", "Según la etiqueta, ISO 100 declara 25 g por servicio de unos 30 g y Gold Standard 24 g por servicio de unos 30,4 g. Puede variar por sabor: revisa el rótulo del envase."),
        ("¿Cuál es más económica?", f"Depende del tamaño. Hoy ISO 100 está desde {a['from']} y Gold Standard desde {b['from']}. Para comparar envases de distinto tamaño usa el precio por libra de la tabla."),
        ("¿Son productos originales?", "Vendemos productos de marca con su rótulo original. Revisa el registro sanitario Invima en el envase al recibirlo."),
    ] + SHIPPING_FAQ
    return {
        "slug": "iso-100-vs-gold-standard", "label": "ISO 100 vs Gold Standard",
        "title": f"ISO 100 vs Gold Standard: diferencias y precios {YEAR} | SUPGO",
        "description": "ISO 100 vs Gold Standard: proteína declarada, tamaños, sabores y precio por libra con precios actuales en Colombia. Compara y compra en SUPGO.",
        "h1": "ISO 100 vs Gold Standard: diferencias y precios", "body": body, "faq": faq,
        "cats": ["proteinas-iso", "proteinas-whey"], "brands": ["dymatize", "optimum-nutrition"],
        "ids": [i["id"] for i in iso + gold], "summary": "Proteína declarada, tamaños y precio por libra lado a lado.",
    }


CREATINE_TYPES = [
    ("Monohidrato", r"monohidrat|monohydrat", "Es la forma de creatina más común en el catálogo. Muchas etiquetas indican servicios de 3 g o 5 g."),
    ("Micronizada", r"microniz", "Monohidrato con partícula más fina. La etiqueta lo indica como «micronized» o «micronizada»."),
    ("Con sello Creapure", r"creapure", "Creapure es una marca de materia prima de monohidrato de creatina fabricada en Alemania; el envase lo muestra con su sello."),
    ("HCl (clorhidrato)", r"\bhcl\b", "Creatina en forma de clorhidrato. Los servicios suelen ser de menos gramos; revisa la porción en la etiqueta."),
    ("Gomitas, cápsulas y sachets", r"gomit|gumm|caps|tablet|chews|sachet|stick", "Presentaciones en unidades individuales en lugar de polvo; el precio por servicio suele ser mayor."),
    ("Mezclas con otros ingredientes", r"\+|hmb|electrolit|colageno|hidratacion|cell tech|stack", "Fórmulas que combinan creatina con otros ingredientes. Revisa la lista completa en el rótulo."),
]


def creatines(items):
    return [i for i in items if in_cats(i, "creatinas")]


def guide_que_creatina(items):
    cr = creatines(items)
    if len(cr) < 5:
        return None
    rows = []
    for name, rx, text in CREATINE_TYPES:
        group = [i for i in cr if re.search(rx, i["key"])]
        if group:
            rows.append(f"<tr><td><b>{escape(name)}</b></td><td>{escape(text)}</td><td>{len(group)}</td><td>{cop(min(i['price'] for i in group))}</td></tr>")
    types = f'<div class="g-table"><table><thead><tr><th>Tipo</th><th>Qué es (según etiqueta)</th><th>Referencias</th><th>Desde</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div>'
    powder = [i for i in cr if i.get("servings") and not re.search(CREATINE_TYPES[4][1], i["key"])]
    by_serv = sorted(powder, key=lambda i: per_serving(i))[:12]
    small = sorted([i for i in cr if i.get("grams") and i["grams"] <= 320], key=lambda i: i["price"])[:8]
    ps_col = ("Precio por servicio", lambda i: cop(per_serving(i)) if per_serving(i) else "")
    body = f"""<p class="g-lead">En SUPGO tenemos {len(cr)} referencias de creatina publicadas. Esta guía te ayuda a elegir por tipo, tamaño del envase, número de servicios y precio, con los valores actuales de la tienda.</p>
<h2>Tipos de creatina que vas a encontrar</h2>{types}
<h2>Qué revisar en la etiqueta antes de comprar</h2>
<ul><li><b>Registro sanitario Invima</b> impreso en el rótulo.</li>
<li><b>Gramos por servicio:</b> algunas marcas declaran 3 g y otras 5 g; eso cambia cuántos servicios trae el envase.</li>
<li><b>Número de servicios:</b> es la forma más justa de comparar precios entre envases distintos.</li>
<li><b>Ingredientes adicionales y sabor:</b> la creatina sin sabor solo declara creatina; las saborizadas incluyen saborizantes y endulzantes.</li></ul>
<h2>Menor precio por servicio hoy</h2>
<p>Creatinas en polvo con número de servicios declarado, ordenadas por precio por servicio.</p>{table(by_serv, ps_col)}
<h2>Si es tu primera compra</h2>
<p>Un envase pequeño (150 a 300 g) te deja conocer la presentación y el sabor antes de comprar uno grande. Estas son las opciones pequeñas con menor precio:</p>{cards(small)}
<h2>Sigue explorando</h2>{chips([x for x in (cat_link('creatinas'), ('Precio de la creatina en Colombia', '/guias/precio-creatina-colombia.html'), ('Comprar creatina en Medellín', '/guias/comprar-creatina-medellin.html')) if x])}
{DISCLAIMER}"""
    faq = [
        ("¿Qué diferencia hay entre monohidrato y micronizada?", "La micronizada es monohidrato de creatina con partícula más fina. Ambas declaran monohidrato de creatina como ingrediente."),
        ("¿Qué significa el sello Creapure?", "Es una marca registrada de materia prima de monohidrato de creatina fabricada en Alemania. Los productos que la usan muestran el sello en el envase."),
        ("¿Cómo comparo precios entre marcas?", "Divide el precio entre el número de servicios del envase. La tabla de esta guía ya lo calcula con los precios de hoy."),
    ] + SHIPPING_FAQ
    return {
        "slug": "que-creatina-comprar-colombia", "label": "Qué creatina comprar",
        "title": f"Qué creatina comprar en Colombia ({YEAR}): tipos y precios | SUPGO",
        "description": "Qué creatina comprar en Colombia: monohidrato, micronizada, Creapure, HCl y gomitas. Compara tamaños, servicios y precio por servicio en SUPGO.",
        "h1": "Qué creatina comprar en Colombia", "body": body, "faq": faq,
        "cats": ["creatinas"], "brands": [], "ids": [i["id"] for i in by_serv + small], "summary": "Tipos, qué revisar en la etiqueta y menor precio por servicio.",
    }


def bucket_stats(group, key, buckets):
    out = []
    for label, lo, hi in buckets:
        sel = [i["price"] for i in group if i.get(key) and lo <= i[key] < hi]
        if sel:
            out.append(f"<tr><td>{escape(label)}</td><td>{len(sel)}</td><td>{cop(min(sel))}</td><td>{cop(statistics.median(sel))}</td><td>{cop(max(sel))}</td></tr>")
    return (f'<div class="g-table"><table><thead><tr><th>Tamaño</th><th>Referencias</th><th>Desde</th><th>Precio típico (mediana)</th><th>Hasta</th></tr></thead><tbody>{"".join(out)}</tbody></table></div>' if out else "")


def stats_cards(pairs):
    return '<div class="g-stats">' + "".join(f'<div class="g-stat"><small>{escape(k)}</small><b>{escape(v)}</b></div>' for k, v in pairs) + "</div>"


def guide_precio_creatina(items):
    cr = creatines(items)
    if len(cr) < 5:
        return None
    prices = [i["price"] for i in cr]
    servs = [per_serving(i) for i in cr if per_serving(i) and not re.search(CREATINE_TYPES[4][1], i["key"])]
    buckets = [("Hasta 200 g", 0, 201), ("201 a 400 g", 201, 401), ("401 a 700 g", 401, 701), ("Más de 700 g", 701, 99999)]
    ps_col = ("Precio por servicio", lambda i: cop(per_serving(i)) if per_serving(i) else "")
    all_sorted = sorted(cr, key=lambda i: (i["price"], i["name"]))
    body = f"""<p class="g-lead">¿Cuánto cuesta la creatina en Colombia en {YEAR}? Estos son los precios actuales de las {len(cr)} referencias de creatina publicadas en SUPGO, con rangos por tamaño de envase y precio por servicio. La página se actualiza todos los días con el catálogo.</p>
{stats_cards([('Precio más bajo', cop(min(prices))), ('Precio típico', cop(statistics.median(prices))), ('Precio más alto', cop(max(prices))), ('Menor precio por servicio', cop(min(servs)) if servs else '—')])}
<h2>Precio de la creatina por tamaño de envase</h2>{bucket_stats(cr, 'grams', buckets)}
<p class="g-note">Solo incluye referencias con el peso declarado en el nombre o la presentación. La mediana es el precio del medio cuando se ordenan de menor a mayor.</p>
<h2>Todas las creatinas y su precio hoy</h2>{table(all_sorted, ps_col)}
<h2>Por qué cambia el precio</h2>
<ul><li><b>Tamaño:</b> los envases grandes cuestan más, pero suelen tener menor precio por servicio.</li>
<li><b>Presentación:</b> gomitas, cápsulas y sachets cuestan más por servicio que el polvo.</li>
<li><b>Materia prima y marca:</b> por ejemplo, las que usan monohidrato con sello Creapure.</li>
<li><b>Ofertas:</b> los precios marcados como «Oferta» tienen fecha de vencimiento.</li></ul>
<h2>Sigue explorando</h2>{chips([x for x in (cat_link('creatinas'), ('Qué creatina comprar en Colombia', '/guias/que-creatina-comprar-colombia.html'), ('Ofertas de la semana', '/ofertas/')) if x])}
{DISCLAIMER}"""
    faq = [
        (f"¿Cuánto cuesta una creatina en Colombia en {YEAR}?", f"En SUPGO, hoy, desde {cop(min(prices))}; el precio típico es {cop(statistics.median(prices))}. Depende del tamaño, la marca y la presentación."),
        ("¿Cómo saber si un precio es conveniente?", "Compara el precio por servicio: divide el precio entre los servicios del envase. La tabla ya lo calcula."),
    ] + SHIPPING_FAQ
    return {
        "slug": "precio-creatina-colombia", "label": "Precio de la creatina",
        "title": f"Precio de la creatina en Colombia {YEAR} | SUPGO",
        "description": f"Precio de la creatina en Colombia {YEAR}: desde {cop(min(prices))}. Rangos por tamaño, precio por servicio y lista completa actualizada a diario en SUPGO.",
        "h1": f"Precio de la creatina en Colombia {YEAR}", "body": body, "faq": faq,
        "cats": ["creatinas"], "brands": [], "ids": [i["id"] for i in cr], "summary": "Rangos por tamaño y lista completa, actualizada a diario.",
    }


def proteins(items):
    return [i for i in items if in_cats(i, "proteinas-whey", "proteinas-iso")]


def guide_precio_proteina(items):
    pr = [i for i in proteins(items) if i.get("grams")]
    if len(pr) < 5:
        return None
    prices = [i["price"] for i in pr]
    lbs = [per_lb(i) for i in pr if per_lb(i)]
    lb = 453.592
    buckets = [("Hasta 2 lb", 0, 2.05 * lb), ("2,1 a 4 lb", 2.05 * lb, 4.05 * lb), ("4,1 a 6 lb", 4.05 * lb, 6.05 * lb), ("Más de 6 lb", 6.05 * lb, 10 ** 9)]
    lb_col = ("Precio por libra", lambda i: cop(per_lb(i)) if per_lb(i) else "")
    whey = sorted([i for i in pr if in_cats(i, "proteinas-whey")], key=lambda i: per_lb(i) or 10 ** 9)[:15]
    iso = sorted([i for i in pr if in_cats(i, "proteinas-iso")], key=lambda i: per_lb(i) or 10 ** 9)[:15]
    body = f"""<p class="g-lead">Precios actuales de proteína de suero (whey) y proteína aislada (ISO) en SUPGO: {len(pr)} referencias con peso declarado. Usa el precio por libra para comparar envases de distinto tamaño. Se actualiza todos los días.</p>
{stats_cards([('Precio más bajo', cop(min(prices))), ('Precio típico', cop(statistics.median(prices))), ('Menor precio por libra', cop(min(lbs)) if lbs else '—'), ('Precio típico por libra', cop(statistics.median(lbs)) if lbs else '—')])}
<h2>Precio de la proteína por tamaño</h2>{bucket_stats(pr, 'grams', buckets)}
<h2>Proteína whey: menor precio por libra</h2>{table(whey, lb_col)}
<h2>Proteína aislada (ISO): menor precio por libra</h2>{table(iso, lb_col)}
<h2>Qué diferencia hay entre whey e ISO en la etiqueta</h2>
<p>Las proteínas «whey» suelen declarar concentrado de suero o una mezcla de concentrado y aislado. Las «ISO» declaran aislado de suero como fuente principal, con mayor proporción de proteína por gramo de polvo. Revisa siempre la tabla nutricional del rótulo.</p>
<h2>Sigue explorando</h2>{chips([x for x in (cat_link('proteinas-whey'), cat_link('proteinas-iso'), ('ISO 100 vs Gold Standard', '/guias/iso-100-vs-gold-standard.html'), ('Proteína para principiantes', '/guias/proteina-para-principiantes.html')) if x])}
{DISCLAIMER}"""
    faq = [
        (f"¿Cuánto cuesta una proteína whey en Colombia en {YEAR}?", f"En SUPGO, hoy, desde {cop(min(prices))}; el precio típico por libra es {cop(statistics.median(lbs)) if lbs else '—'}. Depende del tamaño, la marca y el tipo de proteína."),
        ("¿Conviene comprar el envase grande?", "Por libra suele salir más económico, pero si no conoces el sabor un envase pequeño te deja probarlo primero."),
    ] + SHIPPING_FAQ
    return {
        "slug": "precio-proteina-colombia", "label": "Precio de la proteína",
        "title": f"Precio de la proteína whey en Colombia {YEAR} | SUPGO",
        "description": f"Precio de la proteína whey e ISO en Colombia {YEAR}: desde {cop(min(prices))}. Precio por libra y por tamaño, actualizado a diario en SUPGO.",
        "h1": f"Precio de la proteína en Colombia {YEAR}", "body": body, "faq": faq,
        "cats": ["proteinas-whey", "proteinas-iso"], "brands": [], "ids": [i["id"] for i in whey + iso], "summary": "Whey e ISO por tamaño y precio por libra, actualizado a diario.",
    }


def guide_principiantes(items):
    pr = proteins(items)
    small = sorted([i for i in pr if i.get("grams") and i["grams"] <= 2.6 * 453.592], key=lambda i: i["price"])
    veg = sorted([i for i in items if in_cats(i, "proteinas-veganas")], key=lambda i: i["price"])[:6]
    if len(small) < 4:
        return None
    lb_col = ("Precio por libra", lambda i: cop(per_lb(i)) if per_lb(i) else "")
    types = [("Whey concentrada", "Proteína de suero de leche con filtrado estándar. Suele tener el menor precio por libra.", cat_link('proteinas-whey')),
             ("Aislada (ISO)", "Proteína de suero filtrada para mayor proporción de proteína por gramo y menos lactosa declarada.", cat_link('proteinas-iso')),
             ("Vegetal", "Proteína de arveja, arroz u otras fuentes vegetales; sin ingredientes lácteos en la fórmula.", cat_link('proteinas-veganas')),
             ("De carne", "Proteína obtenida de carne de res; no declara lácteos en la fórmula.", cat_link('proteinas-de-carne')),
             ("Ganadores de peso", "Mezclas que combinan proteína con una cantidad alta de carbohidratos por servicio.", cat_link('ganadores-de-masa'))]
    cat_cell = lambda l: '<a href="' + l[1] + '">Ver categoría</a>' if l else "—"
    trows = "".join(f'<tr><td><b>{escape(n)}</b></td><td>{escape(d)}</td><td>{cat_cell(l)}</td></tr>' for n, d, l in types)
    body = f"""<p class="g-lead">Si vas a comprar tu primera proteína, lo más práctico es decidir por tipo, presupuesto, sabor y tamaño del envase. Esta guía te explica qué dice cada etiqueta y te muestra las presentaciones pequeñas con su precio de hoy.</p>
<h2>1. Elige el tipo de proteína</h2><div class="g-table"><table><thead><tr><th>Tipo</th><th>Qué es (según etiqueta)</th><th></th></tr></thead><tbody>{trows}</tbody></table></div>
<h2>2. Define tu presupuesto</h2><p>Para comparar marcas y tamaños usa el <b>precio por libra</b> (o por servicio). Los envases de 4 y 5 libras suelen tener menor precio por libra; los de 1 y 2 libras cuestan menos en total.</p>
<h2>3. Empieza con un envase pequeño</h2><p>Si no conoces la marca o el sabor, un envase de 1 a 2,5 libras te deja probarlo antes de comprar uno grande. Estas son las opciones pequeñas con menor precio hoy:</p>{table(small[:12], lb_col)}
<h2>4. Lee la etiqueta</h2><ul><li><b>Proteína por servicio</b> y tamaño del servicio en gramos.</li><li><b>Alérgenos:</b> leche, soya, gluten u otros.</li><li><b>Registro sanitario Invima.</b></li><li><b>Número de servicios</b> por envase.</li></ul>
{('<h2>Opciones sin lácteos</h2>' + cards(veg)) if veg else ''}
<h2>Sigue explorando</h2>{chips([x for x in (cat_link('proteinas-whey'), cat_link('proteinas-iso'), cat_link('proteinas-veganas'), ('Precio de la proteína en Colombia', '/guias/precio-proteina-colombia.html'), ('ISO 100 vs Gold Standard', '/guias/iso-100-vs-gold-standard.html')) if x])}
{DISCLAIMER}"""
    faq = [
        ("¿Qué tamaño de proteína compro la primera vez?", "Un envase de 1 a 2 libras te deja probar el sabor y la marca. Cuando ya sabes cuál te gusta, el envase grande suele tener menor precio por libra."),
        ("¿Qué diferencia hay entre whey e ISO?", "La whey suele declarar concentrado de suero o una mezcla; la ISO declara aislado de suero como fuente principal, con más proteína por gramo de polvo. Revisa la tabla nutricional del rótulo."),
        ("¿Cuánta proteína debo tomar?", "Depende de cada persona. Sigue la porción del rótulo y consulta a un profesional de la salud o nutrición para una recomendación personal."),
    ] + SHIPPING_FAQ
    return {
        "slug": "proteina-para-principiantes", "label": "Proteína para principiantes",
        "title": "Proteína para principiantes: cómo elegir tu primera proteína | SUPGO",
        "description": "Proteína para principiantes: tipos (whey, ISO, vegetal), cómo leer la etiqueta y presentaciones pequeñas con precio actual en Colombia. Compra en SUPGO.",
        "h1": "Proteína para principiantes: cómo elegir la primera", "body": body, "faq": faq,
        "cats": ["proteinas-whey", "proteinas-iso", "proteinas-veganas", "proteinas-de-carne", "ganadores-de-masa"], "brands": [],
        "ids": [i["id"] for i in small[:12] + veg], "summary": "Tipos, cómo leer la etiqueta y envases pequeños para empezar.",
    }


# Guías escritas a mano: a qué categorías y marcas pertenecen.
STATIC_GUIDES = {
    "comprar-creatina-medellin": (["creatinas"], []),
    "proteina-iso100-medellin": (["proteinas-iso"], ["dymatize"]),
    "proteina-whey-colombia": (["proteinas-whey"], []),
    "omega-3-medellin": (["omega-3"], []),
    "magnesio-colombia": (["magnesio"], []),
    "multivitaminicos-medellin": (["multivitaminicos", "vitaminas", "vitaminas-y-minerales"], []),
    "preentrenos-medellin": (["pre-entrenos"], []),
    "ganadores-masa-colombia": (["ganadores-de-masa"], []),
    "colageno-medellin": (["colageno"], []),
    "suplementos-domicilio-medellin": ([], []),
}
NEW_GUIDES = [guide_iso_vs_gold, guide_que_creatina, guide_precio_creatina, guide_precio_proteina, guide_principiantes]


def static_title(path):
    html = path.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    return re.sub(r"\s*\|.*$", "", plain(m.group(1))) if m else path.stem


def patch_static(slug_name, cats, registry):
    """Agrega a una guía escrita a mano enlaces a sus categorías y a guías relacionadas."""
    path = ROOT / "guias" / f"{slug_name}.html"
    html = path.read_text(encoding="utf-8")
    related = [g for g in registry if g["slug"] != slug_name and set(g["categorias"]) & set(cats)]
    links = [x for x in (cat_link(c) for c in cats) if x] + [(g["titulo"], g["url"]) for g in related[:4]]
    if not links:
        links = [("Todas las guías", "/guias/")]
    block = (LINKS_START + '<section><h2>Sigue explorando</h2><nav style="display:flex;flex-wrap:wrap;gap:8px">'
             + "".join(f'<a href="{escape(u, quote=True)}" style="border:1px solid #ddd;border-radius:30px;padding:7px 13px;text-decoration:none">{escape(t)}</a>' for t, u in links)
             + "</nav></section>" + LINKS_END)
    if LINKS_START in html:
        html = re.sub(re.escape(LINKS_START) + ".*?" + re.escape(LINKS_END), lambda m: block, html, flags=re.S)
    elif "</main>" in html:
        html = html.replace("</main>", block + "</main>", 1)
    else:
        return
    path.write_text(html, encoding="utf-8")


def write_index(registry):
    new = [g for g in registry if g.get("nueva")]
    old = [g for g in registry if not g.get("nueva")]
    item = lambda g: f'<a href="{escape(g["url"], quote=True)}"><b>{escape(g["titulo"])}</b>{("<span>" + escape(g["resumen"]) + "</span>") if g.get("resumen") else ""}</a>'
    body = (f'<p class="g-lead">Comparativas, precios actualizados y guías para elegir suplementos por tipo, tamaño, sabor y presupuesto. Cada guía enlaza a las fichas y categorías de SUPGO.</p>'
            f'<h2>Comparativas y precios</h2><div class="g-list">{"".join(item(g) for g in new)}</div>'
            f'<h2>Guías por producto</h2><div class="g-list">{"".join(item(g) for g in old)}</div>{DISCLAIMER}')
    html = page("index", "Guías de compra de suplementos en Colombia | SUPGO",
                "Guías y comparativas de suplementos: precio de la creatina y la proteína, ISO 100 vs Gold Standard, cómo elegir tu primera proteína y más. SUPGO, Colombia.",
                "Guías de compra de suplementos", body, [], "Guías")
    (ROOT / "guias" / "index.html").write_text(html, encoding="utf-8")


def main():
    items = products(load_rows(), load_offers())
    print(f"Fichas indexables con precio: {len(items)}")
    if len(items) < 100:
        raise SystemExit("ERROR: muy pocas fichas enlazables; no se publican guías")
    registry, problems = [], []
    for build in NEW_GUIDES:
        g = build(items)
        if not g:
            print("Omitida (sin datos suficientes):", build.__name__)
            continue
        visible = plain(g["body"] + "".join(q + " " + a for q, a in g["faq"]) + g["title"] + g["description"])
        bad = sorted({m.group(0).lower() for m in FORBIDDEN_WORDS.finditer(visible)})
        if bad:
            problems.append(f"{g['slug']}: {', '.join(bad)}")
        html = page(g["slug"], g["title"], g["description"], g["h1"], g["body"], g["faq"], g["label"])
        (ROOT / "guias" / f"{g['slug']}.html").write_text(html, encoding="utf-8")
        registry.append({"slug": g["slug"], "url": f"/guias/{g['slug']}.html", "titulo": g["h1"], "resumen": g["summary"],
                         "categorias": g["cats"], "marcas": g["brands"], "productos": sorted({int(i) for i in g["ids"] if str(i).isdigit()}), "nueva": True})
    if problems:
        raise SystemExit("ERROR: palabras no permitidas por la norma de publicidad de suplementos:\n" + "\n".join(problems))
    for name, (cats, brands) in STATIC_GUIDES.items():
        path = ROOT / "guias" / f"{name}.html"
        if path.exists():
            registry.append({"slug": name, "url": f"/guias/{name}.html", "titulo": static_title(path), "resumen": "",
                             "categorias": cats, "marcas": brands, "productos": [], "nueva": False})
    for g in registry:
        if not g["nueva"]:
            patch_static(g["slug"], g["categorias"], registry)
    write_index(registry)
    (ROOT / "guias" / "guias.json").write_text(json.dumps(registry, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Guías nuevas: {sum(g['nueva'] for g in registry)} · registro con {len(registry)} guías")


if __name__ == "__main__":
    main()
