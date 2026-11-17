-- Enlace corto de pedido supgo.co/p/CODIGO (aplicada vía MCP en dos pasos: lift_pedido_enlace_corto y lift_pedido_codigo_corto_auto).
alter table public.lift_pedidos add column if not exists codigo_corto text;
create unique index if not exists lift_pedidos_codigo_corto_key on public.lift_pedidos(codigo_corto) where codigo_corto is not null;
create or replace function public.lift_codigo_corto_nuevo() returns text language plpgsql volatile as $$
declare v text := ''; abc constant text := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  for i in 1..8 loop v := v || substr(abc, 1 + floor(random()*length(abc))::int, 1); end loop;
  return v;
end $$;
alter table public.lift_pedidos alter column codigo_corto set default public.lift_codigo_corto_nuevo();
update public.lift_pedidos set codigo_corto = public.lift_codigo_corto_nuevo() where codigo_corto is null;

create or replace function public.lift_pedido_enlace_corto(p_pedido_id bigint, p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare v text; tries int := 0;
begin
  if p_token is null or length(p_token) < 16 then return null; end if;
  select codigo_corto into v from lift_pedidos where id = p_pedido_id and token_publico = p_token;
  if not found then return null; end if;
  if v is not null then return v; end if;
  loop
    begin
      update lift_pedidos set codigo_corto = lift_codigo_corto_nuevo() where id = p_pedido_id and codigo_corto is null;
      exit;
    exception when unique_violation then tries := tries + 1; if tries > 5 then raise; end if; end;
  end loop;
  select codigo_corto into v from lift_pedidos where id = p_pedido_id;
  return v;
end $$;

create or replace function public.lift_pedido_resolver_codigo(p_codigo text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', p.id, 'token', p.token_publico, 'total', p.total, 'estado', p.estado_operativo, 'pago_estado', p.pago_estado,
    'imagen', (select v from jsonb_each_text(lift_pedido_imagenes(p.id, p.token_publico)) as t(k, v) limit 1))
  from lift_pedidos p
  where p_codigo ~ '^[A-Za-z0-9]{8}$' and p.codigo_corto = p_codigo
  limit 1;
$$;
revoke all on function public.lift_pedido_enlace_corto(bigint, text) from public;
revoke all on function public.lift_pedido_resolver_codigo(text) from public;
grant execute on function public.lift_pedido_enlace_corto(bigint, text) to anon, authenticated;
grant execute on function public.lift_pedido_resolver_codigo(text) to anon, authenticated;
-- lift_pedidos_admin('list') ahora incluye p.codigo_corto.
