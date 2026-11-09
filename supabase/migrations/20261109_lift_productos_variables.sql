-- SUPGO · Productos variables (como WooCommerce): un producto padre con URL propia
-- y variaciones (sabor y tamaño). Cada variación sigue siendo una fila de lift_productos
-- (mismo ID para carrito, pedidos, ofertas y cartera); el padre vive en lift_producto_grupos.

-- 1. Grupo duplicado (115 = copia exacta de 114).
delete from public.lift_producto_grupos g
 where g.id = 115
   and not exists (select 1 from public.lift_producto_variantes v
                    where v.grupo_id = 115
                      and v.producto_id not in (select producto_id from public.lift_producto_variantes where grupo_id = 114));

-- 2. Columnas nuevas del padre y de la variación.
alter table public.lift_producto_grupos
  add column if not exists slug text,
  add column if not exists descripcion text,
  add column if not exists titulo_seo text,
  add column if not exists meta_descripcion text,
  add column if not exists principal_id bigint;
create unique index if not exists lift_producto_grupos_slug_key on public.lift_producto_grupos (slug) where slug is not null;
alter table public.lift_producto_grupos drop constraint if exists lift_producto_grupos_slug_formato;
alter table public.lift_producto_grupos add constraint lift_producto_grupos_slug_formato check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.lift_producto_variantes add column if not exists tamano text;
-- Una variación pertenece a un solo producto padre.
delete from public.lift_producto_variantes a using public.lift_producto_variantes b
 where a.producto_id = b.producto_id and a.id > b.id;
create unique index if not exists lift_producto_variantes_producto_key on public.lift_producto_variantes (producto_id);

-- 3. El precio vive en cada variación (lift_productos.product.price). Antes el grupo imponía un solo
--    precio a todos los sabores; con tamaños eso ya no sirve.
drop trigger if exists lift_grupo_propagar_precio on public.lift_producto_grupos;
drop trigger if exists lift_variante_tomar_precio_grupo on public.lift_producto_variantes;
drop trigger if exists lift_variante_sincronizar_producto on public.lift_producto_variantes;

-- 4. Vista pública: qué productos pertenecen a un padre publicado (con URL).
create or replace view public.lift_familias_publicas with (security_invoker = true) as
select v.producto_id, p.slug as producto_slug, g.id as grupo_id, g.slug, g.nombre, g.principal_id,
       coalesce(v.tamano, '') as tamano, coalesce(v.sabor, '') as sabor, coalesce(v.orden, 0) as orden
  from public.lift_producto_variantes v
  join public.lift_producto_grupos g on g.id = v.grupo_id
  join public.lift_productos p on p.id = v.producto_id
 where g.slug is not null and g.visible_publico = true and v.activo = true and p.activo = true;
grant select on public.lift_familias_publicas to anon, authenticated;

-- 5. Administración desde CONTROL (clave de administración).
create or replace function public.lift_variables_admin(p_password text, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  g_id bigint; v_slug text; v_item jsonb; v_ids bigint[]; v_conf text; v_new bigint; v_base jsonb; v_name text; i int := 0;
begin
  if encode(digest(coalesce(p_password,''),'sha256'),'hex') <> public.lift_admin_hash() then raise exception 'Clave incorrecta'; end if;

  if p_action = 'list' then
    return jsonb_build_object('grupos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'nombre', g.nombre, 'slug', g.slug, 'marca', g.marca, 'categoria', g.categoria, 'presentacion', g.presentacion,
        'imagen', g.imagen, 'descripcion', g.descripcion, 'titulo_seo', g.titulo_seo, 'meta_descripcion', g.meta_descripcion,
        'principal_id', g.principal_id, 'visible_publico', g.visible_publico, 'updated_at', g.updated_at,
        'variantes', coalesce((select jsonb_agg(jsonb_build_object('producto_id', v.producto_id, 'sabor', v.sabor, 'tamano', v.tamano, 'orden', v.orden, 'activo', v.activo) order by v.orden, v.id)
                                from public.lift_producto_variantes v where v.grupo_id = g.id), '[]'::jsonb)
      ) order by g.updated_at desc nulls last, g.id desc) from public.lift_producto_grupos g), '[]'::jsonb));
  end if;

  if p_action = 'guardar' then
    g_id := nullif(p_payload->>'id','')::bigint;
    v_slug := nullif(trim(lower(p_payload->>'slug')), '');
    if coalesce(trim(p_payload->>'nombre'),'') = '' then raise exception 'Falta el nombre del producto'; end if;
    if jsonb_array_length(coalesce(p_payload->'variantes','[]'::jsonb)) < 1 then raise exception 'Agrega al menos una variación'; end if;
    select coalesce(array_agg((x->>'producto_id')::bigint), '{}') into v_ids from jsonb_array_elements(p_payload->'variantes') x;
    if v_slug is not null then
      if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'La URL solo puede tener letras, números y guiones'; end if;
      if exists (select 1 from public.lift_producto_grupos where slug = v_slug and id is distinct from g_id) then raise exception 'Ya hay otro producto con la URL %', v_slug; end if;
      select nombre into v_conf from public.lift_productos where slug = v_slug and activo and id <> all(v_ids) limit 1;
      if v_conf is not null then raise exception 'La URL % ya la usa el producto "%"', v_slug, v_conf; end if;
    end if;
    if g_id is null then
      insert into public.lift_producto_grupos (nombre, slug, marca, categoria, presentacion, imagen, descripcion, titulo_seo, meta_descripcion, principal_id, visible_publico, precio)
      values (trim(p_payload->>'nombre'), v_slug, coalesce(p_payload->>'marca',''), coalesce(p_payload->>'categoria',''), coalesce(p_payload->>'presentacion',''),
              coalesce(p_payload->>'imagen',''), p_payload->>'descripcion', p_payload->>'titulo_seo', p_payload->>'meta_descripcion',
              nullif(p_payload->>'principal_id','')::bigint, coalesce((p_payload->>'visible_publico')::boolean, true), 0)
      returning id into g_id;
    else
      update public.lift_producto_grupos set nombre = trim(p_payload->>'nombre'), slug = v_slug, marca = coalesce(p_payload->>'marca',''),
        categoria = coalesce(p_payload->>'categoria',''), presentacion = coalesce(p_payload->>'presentacion',''), imagen = coalesce(p_payload->>'imagen',''),
        descripcion = p_payload->>'descripcion', titulo_seo = p_payload->>'titulo_seo', meta_descripcion = p_payload->>'meta_descripcion',
        principal_id = nullif(p_payload->>'principal_id','')::bigint, visible_publico = coalesce((p_payload->>'visible_publico')::boolean, true), updated_at = now()
       where id = g_id;
      if not found then raise exception 'Ese producto ya no existe'; end if;
    end if;
    -- Las variaciones que salen del padre vuelven a ser productos sueltos; las que vienen de otro padre se mueven.
    delete from public.lift_producto_variantes where grupo_id = g_id and producto_id <> all(v_ids);
    delete from public.lift_producto_variantes where grupo_id <> g_id and producto_id = any(v_ids);
    for v_item in select * from jsonb_array_elements(p_payload->'variantes') loop
      insert into public.lift_producto_variantes (grupo_id, producto_id, sabor, tamano, orden, activo)
      values (g_id, (v_item->>'producto_id')::bigint, nullif(trim(v_item->>'sabor'),''), nullif(trim(v_item->>'tamano'),''), i, true)
      on conflict (producto_id) do update set grupo_id = excluded.grupo_id, sabor = excluded.sabor, tamano = excluded.tamano, orden = excluded.orden, activo = true;
      i := i + 1;
    end loop;
    -- Padres viejos que quedaron vacíos.
    delete from public.lift_producto_grupos g where g.id <> g_id and not exists (select 1 from public.lift_producto_variantes v where v.grupo_id = g.id);
    return jsonb_build_object('ok', true, 'id', g_id);
  end if;

  if p_action = 'eliminar' then
    delete from public.lift_producto_grupos where id = (p_payload->>'id')::bigint;
    return jsonb_build_object('ok', true);
  end if;

  -- Precios por variación: [{producto_id, price, trainerPrice}]
  if p_action = 'precios' then
    for v_item in select * from jsonb_array_elements(coalesce(p_payload->'items','[]'::jsonb)) loop
      update public.lift_productos set
        product = product
          || case when (v_item->>'price') ~ '^[0-9]+$' then jsonb_build_object('price', (v_item->>'price')::bigint) else '{}'::jsonb end
          || case when (v_item->>'trainerPrice') ~ '^[0-9]+$' then jsonb_build_object('trainerPrice', (v_item->>'trainerPrice')::bigint)
                  when v_item ? 'trainerPrice' and coalesce(v_item->>'trainerPrice','') = '' then jsonb_build_object('trainerPrice', null) else '{}'::jsonb end,
        updated_at = now()
       where id = (v_item->>'producto_id')::bigint;
    end loop;
    return jsonb_build_object('ok', true);
  end if;

  -- Crear una variación nueva copiando otra (ficha, marca, categoría, fotos): {base_id, nombre, sabor, tamano, price}
  if p_action = 'crear_variacion' then
    select product into v_base from public.lift_productos where id = (p_payload->>'base_id')::bigint;
    if v_base is null then raise exception 'No encontré el producto base'; end if;
    v_name := trim(coalesce(p_payload->>'nombre',''));
    if v_name = '' then raise exception 'Falta el nombre'; end if;
    select coalesce(max(id),0) + 1 into v_new from public.lift_productos;
    v_base := (v_base - 'seo' - 'source' - 'source_id' - 'source_url' - '__deleted' - 'flavors')
      || jsonb_build_object('id', v_new, 'name', v_name, 'flavor', nullif(trim(coalesce(p_payload->>'sabor','')), ''),
                            'presentation', coalesce(nullif(trim(coalesce(p_payload->>'tamano','')), ''), v_base->>'presentation', ''));
    if (p_payload->>'price') ~ '^[0-9]+$' then v_base := v_base || jsonb_build_object('price', (p_payload->>'price')::bigint); end if;
    v_slug := trim(both '-' from regexp_replace(translate(lower(v_name), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'), '[^a-z0-9]+', '-', 'g'));
    if exists (select 1 from public.lift_productos where slug = v_slug) or exists (select 1 from public.lift_producto_grupos where slug = v_slug) then v_slug := v_slug || '-' || v_new; end if;
    insert into public.lift_productos (id, product, activo, slug, updated_at) values (v_new, v_base, true, v_slug, now());
    return jsonb_build_object('ok', true, 'id', v_new, 'slug', v_slug, 'product', v_base);
  end if;

  raise exception 'Acción no válida';
end $$;
revoke all on function public.lift_variables_admin(text, text, jsonb) from public;
grant execute on function public.lift_variables_admin(text, text, jsonb) to anon, authenticated;
