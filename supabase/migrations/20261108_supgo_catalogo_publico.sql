insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('supgo-catalogo-publico','supgo-catalogo-publico',true,52428800,array['application/pdf'])
on conflict (id) do update set public=true, file_size_limit=52428800, allowed_mime_types=array['application/pdf'];
