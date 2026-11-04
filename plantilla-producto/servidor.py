"""Servidor de desarrollo: HTML y consultas Supabase desde el mismo origen."""
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import Request, urlopen
from plantilla import render_product

ROOT = Path(__file__).resolve().parents[1]
API = os.getenv('SUPABASE_URL', 'https://vdxkknftyssjyfbdieqa.supabase.co').rstrip('/') + '/rest/v1/'
KEY = os.getenv('SUPABASE_ANON_KEY', 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh')


def read(table, query):
    req = Request(API + table + '?' + urlencode(query), headers={'apikey': KEY})
    with urlopen(req, timeout=25) as response:
        return json.load(response)


def product_data(product_id=None, slug=None):
    query = {'select': 'id,activo,product', 'activo': 'eq.true', 'limit': '2'}
    if product_id:
        if not product_id.isdecimal():
            raise ValueError('El ID debe ser numérico.')
        query['id'] = 'eq.' + product_id
    elif slug:
        if len(slug) > 200:
            raise ValueError('Slug no válido.')
        query['product->seo->>slug'] = 'eq.' + slug
    else:
        query['id'] = 'eq.30208'
    rows = read('lift_productos', query)
    if len(rows) > 1:
        raise ValueError('Slug duplicado. Consulta el producto por ID.')
    row = rows[0] if rows else None
    p = row.get('product') if row else None
    if not p or not p.get('name') or any(p.get(k) for k in ('__deleted', '__private', 'adminOnly', '_checkoutOnly')):
        raise LookupError('Producto no disponible.')
    product_id = str(row['id'])
    seo = read('lift_producto_seo', {'select': 'titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo', 'producto_id': 'eq.' + product_id, 'limit': '1'})
    images = read('lift_producto_imagenes', {'select': 'imagen_url,orden', 'producto_id': 'eq.' + product_id, 'order': 'orden.asc'})
    return {'rows': [row], 'seoRows': seo, 'images': images}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path in ('/plantilla-producto/', '/plantilla-producto/index.html'):
            args = parse_qs(url.query)
            try:
                slug = args.get('slug', [None])[0]
                product_id = args.get('id', [None if slug else '30208'])[0]
                body = render_product(product_id, slug).encode()
                status = 200
            except (LookupError, ValueError) as error:
                body = str(error).encode()
                status = 404
            except (HTTPError, URLError, TimeoutError):
                body = 'No se pudo consultar Supabase. Intenta nuevamente.'.encode()
                status = 502
            self.send_response(status)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if url.path != '/plantilla-producto/api/producto':
            return super().do_GET()
        args = parse_qs(url.query)
        try:
            data = product_data(args.get('id', [None])[0], args.get('slug', [None])[0])
            status = 200
        except ValueError as error:
            status, data = 400, {'error': str(error)}
        except LookupError as error:
            status, data = 404, {'error': str(error)}
        except (HTTPError, URLError, TimeoutError):
            status, data = 502, {'error': 'No se pudo conectar con Supabase. Intenta nuevamente.'}
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8002)
    options = parser.parse_args()
    ThreadingHTTPServer(('0.0.0.0', options.port), Handler).serve_forever()
