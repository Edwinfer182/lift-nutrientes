-- El cliente (o el admin desde el mismo enlace) puede corregir la dirección mientras el pedido NO esté pagado.
create or replace function public.lift_pedido_cambiar_direccion(p_pedido_id bigint, p_token text, p_direccion text, p_ciudad text, p_notas text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p record; d text := btrim(coalesce(p_direccion,'')); c text := btrim(coalesce(p_ciudad,'')); n text := btrim(coalesce(p_notas,''));
begin
  if p_token is null or length(p_token) < 16 then raise exception 'Pedido no encontrado'; end if;
  select id, estado_operativo, pago_estado into p from lift_pedidos where id = p_pedido_id and token_publico = p_token for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if coalesce(p.pago_estado,'') = 'aprobado'
     or coalesce(p.estado_operativo,'') not in ('nuevo','verificando_disponibilidad','sin_disponibilidad','pendiente_pago') then
    raise exception 'El pedido ya fue pagado; la dirección no se puede cambiar. Escríbenos por WhatsApp.';
  end if;
  if length(d) < 5 or length(d) > 200 then raise exception 'Escribe una dirección válida'; end if;
  if length(c) < 2 or length(c) > 80 then raise exception 'Escribe la ciudad'; end if;
  if length(n) > 300 then raise exception 'Las indicaciones son muy largas'; end if;
  update lift_pedidos set direccion = d, ciudad = c, notas = nullif(n,'') where id = p.id;
  return jsonb_build_object('ok', true, 'direccion', d, 'ciudad', c, 'notas', nullif(n,''));
end $$;
revoke all on function public.lift_pedido_cambiar_direccion(bigint, text, text, text, text) from public;
grant execute on function public.lift_pedido_cambiar_direccion(bigint, text, text, text, text) to anon, authenticated;
