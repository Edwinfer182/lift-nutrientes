-- Aplicada vía MCP (lift_clientes_novedades):
alter table public.lift_clientes add column if not exists acepta_novedades boolean not null default false;
alter table public.lift_clientes add column if not exists acepta_novedades_fecha timestamptz;
-- lift_cliente_novedades(p_pedido_id, p_token, p_acepta): marca el permiso del cliente del pedido.
-- lift_borrador_convertir: correo obligatorio; guarda correo y novedades en lift_clientes.
