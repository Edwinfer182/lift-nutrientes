-- Borradores (cotizaciones estilo Shopify). Aplicada vía MCP.
alter table public.lift_pedidos add column if not exists es_borrador boolean not null default false;
-- lift_pedidos_admin: 'list' devuelve p.es_borrador; 'por_pagar' acepta {"borrador": true} y lo guarda en es_borrador.
-- Un pedido es borrador mientras es_borrador = true y estado_operativo = 'pendiente_pago'.
