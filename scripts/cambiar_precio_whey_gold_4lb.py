from pathlib import Path
import re

path = Path('catalogo/index.html')
html = path.read_text(encoding='utf-8')

# Busca el objeto del producto por nombre y cambia solo su campo price.
pattern = re.compile(r'({[^{}]*?name\s*:\s*["\']100% Whey Gold Standard 4 Lbs["\'][^{}]*?price\s*:\s*)\d+', re.I | re.S)
new_html, count = pattern.subn(r'\g<1>380000', html, count=1)

if count == 0:
    # Variante tolerante por si el nombre contiene espacios o texto adicional.
    pattern = re.compile(r'({[^{}]*?name\s*:\s*["\'][^"\']*Whey Gold Standard 4\s*Lbs[^"\']*["\'][^{}]*?price\s*:\s*)\d+', re.I | re.S)
    new_html, count = pattern.subn(r'\g<1>380000', html, count=1)

if count != 1:
    raise RuntimeError(f'Se esperaba cambiar 1 producto y se encontraron {count}. No se modifica el catálogo.')

path.write_text(new_html, encoding='utf-8')
print('Precio actualizado a $380.000')
