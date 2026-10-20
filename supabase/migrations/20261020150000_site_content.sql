-- Conteúdo editável pelo painel: estatísticas, textos do "Sobre", depoimentos e endereço.
-- Também separa o número do CRECI da frase de apresentação e zera os números de exemplo.

alter table public.agent_profile
  add column tagline text not null default '' check (char_length(tagline) <= 120);

-- O campo creci guardava uma frase de apresentação: move para tagline
update public.agent_profile set tagline = creci, creci = '' where id = 1;

-- Números de exemplo do gerador (o site esconde o que estiver zerado)
update public.agent_profile set rating = 0, reviews = 0, years = 0, sold = 0 where id = 1;

create table public.site_content (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 100000),
  updated_at timestamptz not null default now()
);

create trigger site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;

create policy "Conteúdo é público" on public.site_content for select
  to anon, authenticated using (true);

create policy "Admin edita conteúdo" on public.site_content for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.site_content (id, data) values (1, jsonb_build_object(
  'stats', '[]'::jsonb,
  'testimonials', '[]'::jsonb,
  'address', '',
  'about', jsonb_build_object(
    'description', 'Ajudo famílias e investidores a tomar a melhor decisão imobiliária das suas vidas. Meu trabalho não é empurrar imóvel: é entender o seu momento, filtrar o mercado e negociar como se o dinheiro fosse meu.',
    'education', '',
    'quote', ''
  )
));
