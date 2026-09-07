from pathlib import Path

PATH = Path('catalogo/index.html')
OLD_TAG = '<script src="sabores-ui.js?v=1"></script>'
NEW_TAG = '<script src="sabores-ui-v2.js?v=2"></script>'

html = PATH.read_text(encoding='utf-8')

if NEW_TAG in html:
    print('La interfaz de sabores v2 ya está instalada.')
elif OLD_TAG in html:
    html = html.replace(OLD_TAG, NEW_TAG, 1)
    PATH.write_text(html, encoding='utf-8')
    print('Interfaz de sabores actualizada a v2.')
else:
    marker = '</body>'
    if marker not in html:
        raise RuntimeError('No encontré </body> en catalogo/index.html')
    html = html.replace(marker, f'{NEW_TAG}\n{marker}', 1)
    PATH.write_text(html, encoding='utf-8')
    print('Interfaz de sabores v2 instalada en catalogo/index.html')

# Cambio intencional para relanzar el workflow v2.
