-- Fotos de los productos de un pedido (incluye productos privados), solo con el token público del pedido.
create or replace function public.lift_pedido_imagenes(p_pedido_id bigint, p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(x.id::text, x.img) filter (where x.img ~ '^https?://'), '{}'::jsonb)
  from (
    select pp.producto_id as id,
           coalesce(
             nullif(pub.imagen, ''),
             nullif(pub.product->>'image', ''),
             nullif(priv.product->>'image', ''),
             nullif(priv.product->>'imagen', '')
           ) as img
    from lift_pedidos p
    join lift_pedido_productos pp on pp.pedido_id = p.id
    left join lift_productos pub on pub.id = pp.producto_id
    left join lift_private_productos priv on priv.id = pp.producto_id
    where p.id = p_pedido_id
      and p_token is not null and length(p_token) >= 16
      and p.token_publico = p_token
    group by pp.producto_id, pub.imagen, pub.product, priv.product
  ) x;
$$;
revoke all on function public.lift_pedido_imagenes(bigint, text) from public;
grant execute on function public.lift_pedido_imagenes(bigint, text) to anon, authenticated;
