-- Foto por línea de pedido (artículos personalizados). Aplicada vía MCP:
-- * lift_pedido_productos.imagen
-- * lift_pedido_set_imagenes(p_password, p_pedido_id, p_items [{nombre, imagen}])
-- * lift_pedido_imagenes: usa primero la foto de la línea; claves id de producto y 'n:'+nombre
-- * lift_pedido_editar_admin conserva items[].imagen
-- * lift_pedidos_admin('list') incluye items[].imagen
alter table public.lift_pedido_productos add column if not exists imagen text;
