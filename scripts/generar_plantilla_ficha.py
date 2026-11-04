#!/usr/bin/env python3
"""Genera producto/index.html: la ficha de producto dinámica.

La plantilla se arma con las MISMAS piezas que las fichas estáticas
(scripts/generar_paginas_seo.py): estilos, encabezado, galería con zoom, botón de
WhatsApp, aviso de carrito y scripts de compra. Los datos del producto (slug,
precio, oferta, sabores, imágenes, descripción, reseñas y relacionados) los carga
componentes/ficha-dinamica.js desde Supabase al abrir la página.

Si cambia el diseño de las fichas, basta con volver a ejecutar este script.
"""
import json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import generar_paginas_seo as G
import seo_contenido as C

ROOT = G.ROOT
OUT = ROOT / "producto" / "index.html"
MARCA = "__SUPGO_NOMBRE__"


def ficha_base():
    """Ficha estática de un producto ficticio: de ella salen las piezas comunes."""
    row = {"id": 0, "activo": True, "product": {"name": MARCA, "brand": "", "price": 1000},
           "_seo": {}, "_variants": [], "_related": [], "_images": [], "_offer": None,
           "_merchant_settings": {}, "_products_by_id": {}, "_filter_counts": {}, "_indexable": True,
           "_mas_marca": [], "_alternativas": []}
    return G.build(row)[1]


def extraer(html, patron, nombre):
    m = re.search(patron, html, re.S)
    if not m:
        raise RuntimeError("No se encontró en la ficha base: " + nombre)
    return m.group(0)


def main():
    page = ficha_base()
    head = page[page.index("<head>"):page.index("</head>")]
    estilos = "\n".join(re.findall(r"<style\b[^>]*>.*?</style>", head, re.S))
    header_loader = extraer(page, r'<script defer src="/componentes/header-loader\.js[^"]*"></script>', "header-loader")
    main_open = extraer(page, r'<main class="product-page"[^>]*>', "main")
    despues = page[page.index("</main>") + len("</main>"):page.index("<script>window.__supgoGallery")]
    whatsapp = re.findall(r"<script>\s*\(\(\)=>\{.*?</script>", page, re.S)
    if not whatsapp:
        raise RuntimeError("No se encontró el script de WhatsApp")
    piezas = {
        "envio": extraer(page, r'<div class="pi-ship">.*?</div></div>', "envío"),
        "garantias": extraer(page, r'<section class="seo-buy-assurance".*?</section>', "compra segura"),
        "pagos": G.PAYMENT_HTML,
        "acciones": extraer(page, r'<div class="actions">.*?<p id="notice"[^>]*></p>', "botones de compra"),
    }
    try:
        logos = G.fetch_lab_logos()
    except Exception as exc:  # sin red: el menú cuenta marcas sin logos
        print("Aviso: logos no disponibles:", exc)
        logos = {}
    datos = {
        "base": G.BASE, "supabase": G.URL, "key": G.KEY, "ficha": G.FICHA_VERSION,
        "laboratorios": sorted(p.name for p in (ROOT / "laboratorios").iterdir() if p.is_dir()),
        "categorias": sorted(p.name for p in (ROOT / "categorias").iterdir() if p.is_dir()),
        "guias": G.GUIDES, "logos": logos, "piezas": piezas,
        "contenido": {"version": C.CONTENIDO_VERSION, "grupos": C.GRUPOS, "intro": C.INTRO,
                      "revisar": C.REVISAR, "cierre": C.CIERRE, "leyenda": C.LEYENDA_SUPLEMENTO},
    }
    datos_json = json.dumps(datos, ensure_ascii=False).replace("<", "\\u003c")

    def texto(id_, js):
        # Los scripts de la ficha se ejecutan cuando el producto ya está dibujado.
        seguro = js.replace("</script", "<" + "\\/script")
        return f'<script type="text/plain" id="{id_}">{seguro}</script>'

    html = f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Producto | SUPGO</title>
<meta name="description" content="Suplementos deportivos en SUPGO Medellín. Envíos a toda Colombia.">
<meta name="robots" content="noindex, follow">
<link rel="icon" type="image/png" href="https://static.wixstatic.com/media/251da0_a2056558d8284210b4ed7477cb36a49f~mv2.png"><link rel="apple-touch-icon" href="https://static.wixstatic.com/media/251da0_a2056558d8284210b4ed7477cb36a49f~mv2.png">
<link rel="preconnect" href="{G.URL}" crossorigin>
{estilos}
<style id="ficha-dinamica-css">
.fd-cargando{{min-height:60vh;display:grid;place-items:center;color:#737373;font:500 14px Poppins,Arial,sans-serif}}
.fd-cargando i{{display:block;width:34px;height:34px;margin:0 auto 12px;border:3px solid #e5e5e5;border-top-color:#111;border-radius:50%;animation:fdgiro .8s linear infinite}}
@keyframes fdgiro{{to{{transform:rotate(360deg)}}}}
.fd-error{{max-width:520px;margin:12vh auto;text-align:center;font-family:Poppins,Arial,sans-serif}}.fd-error h1{{font-size:24px}}.fd-error p{{color:#555}}
.fd-error a{{display:inline-block;margin-top:10px;background:#111;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:12px}}
</style>
</head><body>
{header_loader}
{main_open.replace('<main ', '<main id="supgo-ficha" ', 1)}
<div class="fd-cargando" role="status"><div><i></i>Cargando producto…</div></div>
</main>{despues}
{texto("ficha-js-zoom", G.ZOOM_JS)}
{texto("ficha-js-compra", G.FICHA_V2_JS)}
{texto("ficha-js-whatsapp", whatsapp[-1][len("<script>"):-len("</script>")])}
<script type="application/json" id="ficha-plantilla">{datos_json}</script>
<script src="/componentes/ficha-dinamica.js?v={G.FICHA_VERSION}-d2"></script>
</body></html>
'''
    if MARCA in html.replace(f'alt="{MARCA}"', ""):
        raise RuntimeError("Quedó texto del producto ficticio en la plantilla")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print("Plantilla dinámica:", OUT.relative_to(ROOT), f"({len(html)//1024} KB)")


if __name__ == "__main__":
    main()
