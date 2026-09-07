from pathlib import Path

PATH = Path('catalogo/index.html')
SCRIPT_TAG = '<script src="sabores-ui.js?v=1"></script>'

html = PATH.read_text(encoding='utf-8')

if SCRIPT_TAG in html:
    print('La interfaz de sabores ya está instalada.')
else:
    marker = '</body>'
    if marker not in html:
        raise RuntimeError('No encontré </body> en catalogo/index.html')
    html = html.replace(marker, f'{SCRIPT_TAG}\n{marker}', 1)
    PATH.write_text(html, encoding='utf-8')
    print('Interfaz de sabores instalada en catalogo/index.html')
