-- Galeria de fotos por imóvel (a coluna image continua sendo a capa)
create or replace function public.valid_image_urls(urls text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(u ~ '^(/|https://)' and char_length(u) <= 500), true)
  from unnest(urls) as u;
$$;

alter table public.properties
  add column gallery text[] not null default '{}'
  check (cardinality(gallery) <= 20 and public.valid_image_urls(gallery));
