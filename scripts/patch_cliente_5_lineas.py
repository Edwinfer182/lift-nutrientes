from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')

old = """ const cliente =
`Nombre: ${c.nombre}
Celular: ${c.celular}
Dirección: ${c.direccion}

Pedido:"""
new = """ const cliente =
`${clienteTxt}

Pedido:"""

if new in text:
    raise SystemExit(0)

if old not in text:
    raise SystemExit('No se encontro el bloque de formato para cliente')

text = text.replace(old, new, 1)
p.write_text(text, encoding='utf-8')
