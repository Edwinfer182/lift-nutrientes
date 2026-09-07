from pathlib import Path
import re

p = Path('index.html')
text = p.read_text(encoding='utf-8')

mensaje = "Te comparto nuestro catálogo de Lift Nutrientes 👇\nhttps://lift-nutrientes.vercel.app/catalogo/\n\nPuedes buscar por producto, marca o categoría, agregar los productos al carrito, aplicar tus cupones disponibles y enviarnos el pedido directamente por WhatsApp."
nueva = '["Catálogo", "Compartir catálogo", ' + repr(mensaje) + ']'

# Localiza el arreglo de respuestas usando una respuesta conocida y reemplaza
# únicamente su contenido, conservando intacta la interfaz del módulo.
ancla = '["Respuestas cortas", "Estamos pendientes", "Perfecto, estamos pendientes."]'
pos = text.find(ancla)
if pos < 0:
    raise SystemExit('No se encontro el arreglo de respuestas rapidas')

# Buscar el inicio del array que contiene las respuestas.
start = text.rfind('[', 0, pos)
while start >= 0:
    prefix = text[max(0, start-120):start]
    if '=' in prefix or ':' in prefix:
        break
    start = text.rfind('[', 0, start)
if start < 0:
    raise SystemExit('No se encontro inicio del arreglo')

# Encontrar cierre balanceado del array, ignorando strings.
depth = 0
quote = None
escape = False
end = None
for i in range(start, len(text)):
    c = text[i]
    if quote:
        if escape:
            escape = False
        elif c == '\\':
            escape = True
        elif c == quote:
            quote = None
        continue
    if c in ('\"', "'", '`'):
        quote = c
    elif c == '[':
        depth += 1
    elif c == ']':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
if end is None:
    raise SystemExit('No se encontro cierre del arreglo')

old = text[start:end]
# Seguridad: el bloque debe contener varias respuestas conocidas.
if 'Respuestas cortas' not in old or 'Estamos pendientes' not in old:
    raise SystemExit('Bloque detectado no parece ser respuestas rapidas')

text = text[:start] + '[\n  ' + nueva + '\n]' + text[end:]
p.write_text(text, encoding='utf-8')
print('Respuestas rapidas reemplazadas: queda solo Compartir catalogo')
