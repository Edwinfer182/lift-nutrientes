-- Descuento por línea guardado aparte (aplicado vía MCP: lift_lineas_descuento):
alter table public.lift_pedido_productos add column if not exists precio_lista bigint;
alter table public.lift_pedido_productos add column if not exists descuento_motivo text;
-- lift_pedido_set_imagenes también guarda precio_lista/descuento_motivo por nombre de línea.
-- lift_pedido_editar_admin y lift_borrador_convertir copian precio_lista/descuento_motivo.
-- lift_pedidos_admin('list') devuelve precio_lista/descuento_motivo por ítem.
-- lift_pedido_lineas_extra(pedido, token): precio antes del descuento y motivo, para la página del cliente.
