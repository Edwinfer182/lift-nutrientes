-- Pago directo en el checkout: los pedidos nuevos de la tienda pasan directo a pago,
-- sin el paso de "verificando disponibilidad".
create or replace function public.lift_checkout_pago_directo()
returns trigger language plpgsql as $$
begin
  if new.origen = 'checkout-publico' and new.estado_operativo = 'verificando_disponibilidad' then
    new.estado_operativo := 'pendiente_pago';
  end if;
  return new;
end $$;

drop trigger if exists lift_checkout_pago_directo on public.lift_pedidos;
create trigger lift_checkout_pago_directo
  before insert on public.lift_pedidos
  for each row execute function public.lift_checkout_pago_directo();
