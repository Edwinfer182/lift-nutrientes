from pathlib import Path
import re

path = Path('catalogo/index.html')
html = path.read_text(encoding='utf-8')

name_pat = r'100%\s*Whey\s*Gold\s*Standard\s*4\s*Lbs'
match = re.search(name_pat, html, re.I)
if not match:
    raise RuntimeError('No encontré el producto 100% Whey Gold Standard 4 Lbs.')

start = max(0, match.start() - 1200)
end = min(len(html), match.end() + 1200)
chunk = html[start:end]

price_pat = re.compile(r'(["\']?price["\']?\s*:\s*)335000\b', re.I)
price_matches = list(price_pat.finditer(chunk))
if len(price_matches) != 1:
    raise RuntimeError(f'Encontré {len(price_matches)} precios 335000 cerca del producto; no hago un cambio ambiguo.')

pm = price_matches[0]
chunk2 = chunk[:pm.start()] + pm.group(1) + '380000' + chunk[pm.end():]
new_html = html[:start] + chunk2 + html[end:]
path.write_text(new_html, encoding='utf-8')
print('Precio de 100% Whey Gold Standard 4 Lbs actualizado: $335.000 -> $380.000')
