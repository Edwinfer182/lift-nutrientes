from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
changed = False

# Mantener el parche existente de datos del cliente.
old_cliente = """ const cliente =
`Nombre: ${c.nombre}
Celular: ${c.celular}
Dirección: ${c.direccion}

Pedido:"""
new_cliente = """ const cliente =
`${clienteTxt}

Pedido:"""

if new_cliente not in text and old_cliente in text:
    text = text.replace(old_cliente, new_cliente, 1)
    changed = True

# Agregar respuesta corta para el estado del pedido.
respuesta = '["Respuestas cortas", "Mañana te envío la guía", "Mañana te envío la guía 👍"],'
ancla = '["Respuestas cortas", "Estamos pendientes", "Perfecto, estamos pendientes."],'

if respuesta not in text:
    if ancla not in text:
        raise SystemExit('No se encontro el bloque de Respuestas cortas')
    text = text.replace(ancla, ancla + '\n' + respuesta, 1)
    changed = True

if changed:
    p.write_text(text, encoding='utf-8')
