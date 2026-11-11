
"""Crea rutas ligeras de GitHub Pages; todas cargan la misma plantilla dinámica."""
import argparse
import json
import html
import xml.etree.ElementTree as ET
import re
import urllib.parse
import urllib.request
from pathlib import Path

from generar_paginas_seo import URL, KEY, allowed

SHELL = '''<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Producto | SUPGO</title>
<script defer src="/producto/cargar-ruta.js"></script></head>
<body><p role="status">Cargando producto…</p>
<noscript>Activa JavaScript para consultar el producto.</noscript></body></html>
'''


def fetch_rows():
    rows = []
    for offset in range(0, 100000, 500):
        query = urllib.parse.urlencode({
            'select': 'id,activo,slug,product',
            'order': 'id.asc',
            'limit': 500,
            'offset': offset
        })
        request = urllib.request.Request(
            URL + '/rest/v1/lift_productos?' + query,
            headers={'apikey': KEY}
        )
        with urllib.request.urlopen(request, timeout=40) as response:
            batch = json.load(response)
        rows.extend(batch)
        if len(batch) < 500:
            return rows
    raise RuntimeError('No se pudo completar el catálogo de rutas.')


def routes_for(rows):
    rows = [row for row in rows if allowed(row)]
    routes = {}
    originals = {}
    conflicts = []

    for row in rows:
        value = row.get('slug') or ''
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value):
            raise ValueError(
                'Slug automático no válido para producto ' + str(row['id'])
            )
        originals.setdefault(value, set()).add(row['id'])

    for value, ids in originals.items():
        if len(ids) > 1:
            conflicts.append(value)
        else:
            routes[value] = next(iter(ids))

    custom = {}
    for row in rows:
        seo = row['product'].get('seo') or {}
        value = seo.get('slug') if isinstance(seo, dict) else None

        if isinstance(value, str) and re.fullmatch(
            r'[a-z0-9]+(?:-[a-z0-9]+)*', value
        ):
            custom.setdefault(value, set()).add(row['id'])

    for value, ids in custom.items():
        if (
            value in conflicts
            or len(ids) > 1
            or (value in routes and routes[value] not in ids)
        ):
            if value not in conflicts:
                conflicts.append(value)
            continue

        routes[value] = next(iter(ids))

    return routes, conflicts


def canonical_pages(output):
    """Valida que cada URL del sitemap tenga HTML indexable y canonical coherente."""
    sitemap = output / 'sitemaps' / 'productos.xml'
    if not sitemap.is_file():
        raise FileNotFoundError('Falta sitemap: ' + str(sitemap))
    result = {}
    for loc in ET.parse(sitemap).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        url = (loc.text or '').strip()
        prefix = 'https://supgo.co/'
        if not url.startswith(prefix):
            continue
        path = url[len(prefix):]
        if not re.fullmatch(r'productos/[a-z0-9-]+-\d+\.html', path):
            continue
        file = output / path
        if not file.is_file():
            raise FileNotFoundError('Sitemap anuncia ficha inexistente: ' + path)
        page = file.read_text(encoding='utf-8', errors='replace')
        if 'name="robots" content="index, follow"' not in page:
            raise ValueError('Ficha no indexable: ' + path)
        if 'rel="canonical" href="' + url + '"' not in page:
            raise ValueError('Canonical distinto del sitemap: ' + path)
        pid = int(re.search(r'-(\d+)\.html$', path).group(1))
        if pid in result and result[pid] != url:
            raise ValueError('Dos fichas canonicas para ID ' + str(pid))
        result[pid] = url
    if not result:
        raise ValueError('No hay fichas indexables en el sitemap.')
    return result


def redirect_page(url):
    """Rutas alternativas llevan al HTML completo, no a una ficha vacia JS."""
    safe = html.escape(url, quote=True)
    js = json.dumps(url, ensure_ascii=True)
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="robots" content="noindex,follow">'
            '<link rel="canonical" href="' + safe + '">'
            '<meta http-equiv="refresh" content="0;url=' + safe + '">'
            '<title>Ficha de producto | SUPGO</title>'
            '<script>location.replace(' + js + ');</script>'
            '</head><body><p>Abriendo <a href="' + safe + '">ficha del producto</a>.</p>'
            '</body></html>\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()

    routes, conflicts = routes_for(fetch_rows())
    canonicals = canonical_pages(args.output)
    redirected = 0

    for slug, product_id in routes.items():
        page = args.output / 'producto' / slug / 'index.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        canonical = canonicals.get(int(product_id))
        page.write_text(redirect_page(canonical) if canonical else SHELL, encoding='utf-8')
        if canonical:
            redirected += 1

    print('Rutas sin .html ni parámetros:', len(routes))
    print('Redirecciones a fichas HTML indexables:', redirected)
    print('Fichas canónicas verificadas:', len(canonicals))
    print(
        'Slugs ambiguos omitidos sin detener las demás rutas:',
        len(conflicts)
    )


if __name__ == '__main__':
    main()
