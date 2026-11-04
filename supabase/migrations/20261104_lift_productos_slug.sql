-- Slug de cada producto, igual al nombre de su ficha estática (scripts/generar_paginas_seo.py:
-- slug(nombre) + "-" + id). Lo usa la ficha dinámica: /producto/?slug=...
-- Python: NFKD -> ascii (descarta lo no ASCII) -> minúsculas -> [^a-z0-9]+ por "-" -> quita "-" inicial/final -> 110 caracteres.
create or replace function public.lift_slug(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select left(
    regexp_replace(
      regexp_replace(lower(regexp_replace(normalize(coalesce(t,''), NFKD), '[^\x01-\x7f]', '', 'g')), '[^a-z0-9]+', '-', 'g'),
      '(^-|-$)', '', 'g'),
    110)
$$;

alter table public.lift_productos
  add column if not exists slug text generated always as (
    coalesce(nullif(public.lift_slug(coalesce(product->>'name', product->>'nombre')), ''), 'producto') || '-' || id::text
  ) stored;

create unique index if not exists lift_productos_slug_key on public.lift_productos(slug);
