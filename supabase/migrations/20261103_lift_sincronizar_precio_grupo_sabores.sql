-- Aplicada en Supabase el 2026-11-03.
-- El precio del grupo (producto principal) manda sobre todos sus sabores.
create or replace function public.lift_grupo_propagar_precio()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if coalesce(new.precio,0) > 0 and (tg_op='INSERT' or new.precio is distinct from old.precio) then
    update lift_producto_variantes set precio=new.precio
      where grupo_id=new.id and precio is distinct from new.precio;
    update lift_productos p set product=jsonb_set(p.product,'{price}',to_jsonb(new.precio)), updated_at=now()
      where p.id in (select producto_id from lift_producto_variantes where grupo_id=new.id)
        and p.precio is distinct from new.precio;
  end if;
  return new;
end $$;

create or replace function public.lift_variante_tomar_precio_grupo()
returns trigger language plpgsql security definer set search_path=public as $$
declare gp bigint;
begin
  select precio into gp from lift_producto_grupos where id=new.grupo_id;
  if coalesce(gp,0) > 0 then new.precio := gp; end if;
  return new;
end $$;

create or replace function public.lift_variante_sincronizar_producto()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if coalesce(new.precio,0) > 0 and new.producto_id is not null then
    update lift_productos p set product=jsonb_set(p.product,'{price}',to_jsonb(new.precio)), updated_at=now()
      where p.id=new.producto_id and p.precio is distinct from new.precio;
  end if;
  return new;
end $$;

drop trigger if exists lift_grupo_propagar_precio on public.lift_producto_grupos;
create trigger lift_grupo_propagar_precio after insert or update of precio on public.lift_producto_grupos
  for each row execute function public.lift_grupo_propagar_precio();

drop trigger if exists lift_variante_tomar_precio_grupo on public.lift_producto_variantes;
create trigger lift_variante_tomar_precio_grupo before insert or update of precio, grupo_id on public.lift_producto_variantes
  for each row execute function public.lift_variante_tomar_precio_grupo();

drop trigger if exists lift_variante_sincronizar_producto on public.lift_producto_variantes;
create trigger lift_variante_sincronizar_producto after insert or update of precio on public.lift_producto_variantes
  for each row execute function public.lift_variante_sincronizar_producto();

revoke execute on function public.lift_grupo_propagar_precio(), public.lift_variante_tomar_precio_grupo(), public.lift_variante_sincronizar_producto() from public, anon, authenticated;
