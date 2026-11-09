-- Costo de oferta del proveedor y aumento de cada oferta. Privado: solo con la clave de administración
-- (weekly_offers en lift_catalog_config es público, por eso el costo no se guarda ahí).
create table if not exists public.lift_ofertas_costos (
  producto_id bigint primary key,
  costo_proveedor bigint,
  aumento text,
  aumento_tipo text not null default 'pct' check (aumento_tipo in ('pct','cop')),
  actualizado_en timestamptz not null default now()
);
alter table public.lift_ofertas_costos enable row level security;
revoke all on public.lift_ofertas_costos from anon, authenticated;

create or replace function public.lift_ofertas_costos_admin(p_password text, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
declare v_ids bigint[];
begin
  if encode(digest(coalesce(p_password,''),'sha256'),'hex') <> public.lift_admin_hash() then raise exception 'Clave incorrecta'; end if;
  if p_action = 'get' then
    return coalesce((select jsonb_object_agg(producto_id::text, jsonb_build_object('costo', costo_proveedor, 'aumento', aumento, 'tipo', aumento_tipo))
      from public.lift_ofertas_costos where p_payload->'ids' is null or producto_id::text in (select jsonb_array_elements_text(p_payload->'ids'))), '{}'::jsonb);
  elsif p_action = 'guardar' then
    select array_agg(x::bigint) into v_ids from jsonb_array_elements_text(coalesce(p_payload->'ids','[]'::jsonb)) x;
    if v_ids is null then return jsonb_build_object('ok', true); end if;
    if nullif(p_payload->>'costo','') is null then
      delete from public.lift_ofertas_costos where producto_id = any(v_ids);
    else
      insert into public.lift_ofertas_costos(producto_id, costo_proveedor, aumento, aumento_tipo, actualizado_en)
      select id, (p_payload->>'costo')::bigint, nullif(p_payload->>'aumento',''), coalesce(nullif(p_payload->>'tipo',''),'pct'), now() from unnest(v_ids) id
      on conflict (producto_id) do update set costo_proveedor = excluded.costo_proveedor, aumento = excluded.aumento, aumento_tipo = excluded.aumento_tipo, actualizado_en = now();
    end if;
    return jsonb_build_object('ok', true);
  elsif p_action = 'borrar' then
    select array_agg(x::bigint) into v_ids from jsonb_array_elements_text(coalesce(p_payload->'ids','[]'::jsonb)) x;
    delete from public.lift_ofertas_costos where producto_id = any(coalesce(v_ids,'{}'));
    return jsonb_build_object('ok', true);
  end if;
  raise exception 'Acción no válida';
end $$;
revoke all on function public.lift_ofertas_costos_admin(text,text,jsonb) from public;
grant execute on function public.lift_ofertas_costos_admin(text,text,jsonb) to anon, authenticated;
