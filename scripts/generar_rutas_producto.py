"""Crea rutas ligeras de GitHub Pages; todas cargan la misma plantilla dinámica."""
import argparse
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from generar_paginas_seo import URL, KEY, allowed

SHELL = '''<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>Producto | SUPGO</title>
<script defer src="/producto/cargar-ruta.js"></script></head>
<body><p role="status">Cargando producto…</p>
<noscript>Activa JavaScript para consultar el producto.</noscript></body></html>
'''


def fetch_rows():
    rows = []
    for offset in range(0, 100000, 500):
        query = urllib.parse.urlencode({'select': 'id,activo,slug,product', 'order': 'id.asc', 'limit': 500, 'offset': offset})
        request = urllib.request.Request(URL + '/rest/v1/lift_productos?' + query, headers={'apikey': KEY})
        with urllib.request.urlopen(request, timeout=40) as response:
            batch = json.load(response)
        rows.extend(batch)
        if len(batch) < 500:
            return rows
    raise RuntimeError('No se pudo completar el catálogo de rutas.')


def routes_for(rows):
    rows = [row for row in rows if allowed(row)]
    routes = {}
    for row in rows:
        value = row.get('slug') or ''
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value):
            raise ValueError('Slug automático no válido para producto ' + str(row['id']))
        if value in routes and routes[value] != row['id']:
            raise ValueError('Slug automático duplicado: ' + value)
        routes[value] = row['id']
    custom = {}
    for row in rows:
        seo = row['product'].get('seo') or {}
        value = seo.get('slug') if isinstance(seo, dict) else None
        if isinstance(value, str) and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value):
            custom.setdefault(value, set()).add(row['id'])
    conflicts = []
    for value, ids in custom.items():
        if len(ids) > 1 or (value in routes and routes[value] not in ids):
            conflicts.append(value)
            continue
        routes[value] = next(iter(ids))
    return routes, conflicts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    routes, conflicts = routes_for(fetch_rows())
    for slug in routes:
        page = args.output / 'producto' / slug / 'index.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(SHELL, encoding='utf-8')
    print('Rutas sin .html ni parámetros:', len(routes))
    print('Slugs personalizados ambiguos omitidos; conservan su ruta automática:', len(conflicts))


if __name__ == '__main__':
    main()
