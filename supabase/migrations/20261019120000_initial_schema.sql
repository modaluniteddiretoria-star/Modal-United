-- Modal United: perfil, imóveis, agendamentos, admins e imagens

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- Sem políticas: ninguém lê/escreve via API. Gerenciado só pelo painel do Supabase.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfil da corretora (linha única)
-- ---------------------------------------------------------------------------
create table public.agent_profile (
  id smallint primary key default 1 check (id = 1),
  brand text not null check (char_length(brand) between 1 and 80),
  name text not null check (char_length(name) between 1 and 80),
  role text not null check (char_length(role) <= 120),
  creci text not null check (char_length(creci) <= 120),
  phone text not null check (char_length(phone) <= 30),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,15}$'),
  email text not null check (char_length(email) <= 120),
  instagram text not null check (char_length(instagram) <= 60),
  city text not null check (char_length(city) <= 80),
  photo text not null check (photo ~ '^(/|https://)' and char_length(photo) <= 500),
  rating numeric(2, 1) not null check (rating between 0 and 5),
  reviews integer not null check (reviews >= 0),
  years integer not null check (years >= 0),
  sold integer not null check (sold >= 0),
  updated_at timestamptz not null default now()
);

create trigger agent_profile_updated_at
  before update on public.agent_profile
  for each row execute function public.set_updated_at();

alter table public.agent_profile enable row level security;

create policy "Perfil é público"
  on public.agent_profile for select
  to anon, authenticated
  using (true);

create policy "Admin edita o perfil"
  on public.agent_profile for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Imóveis
-- ---------------------------------------------------------------------------
create table public.properties (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 1 and 120),
  type_label text not null check (char_length(type_label) <= 40),
  category text not null check (category in ('casa', 'apartamento', 'cobertura', 'loft', 'studio')),
  price numeric(14, 2) not null check (price >= 0),
  condo numeric(12, 2) check (condo >= 0),
  location text not null check (char_length(location) <= 80),
  city text not null check (char_length(city) <= 80),
  beds integer not null check (beds between 0 and 50),
  baths integer not null check (baths between 0 and 50),
  area integer not null check (area between 0 and 100000),
  image text not null check (image ~ '^(/|https://)' and char_length(image) <= 500),
  badge text check (badge in ('Novo', 'Exclusivo', 'Destaque')),
  description text not null check (char_length(description) <= 4000),
  features text[] not null default '{}' check (cardinality(features) <= 30),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

alter table public.properties enable row level security;

create policy "Imóveis são públicos"
  on public.properties for select
  to anon, authenticated
  using (true);

create policy "Admin cria imóveis"
  on public.properties for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admin edita imóveis"
  on public.properties for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin remove imóveis"
  on public.properties for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Agendamentos
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  property_id text references public.properties (id) on delete set null,
  property_title text not null,
  visit_date date not null,
  visit_time text not null check (
    visit_time in ('09:00', '09:45', '10:30', '11:15', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15')
  ),
  name text not null check (char_length(name) between 3 and 120),
  phone text not null check (phone ~ '^[0-9]{10,11}$'),
  email text check (char_length(email) <= 120),
  note text check (char_length(note) <= 1000),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Um horário por imóvel (apenas visitas ativas)
create unique index bookings_unique_slot
  on public.bookings (property_id, visit_date, visit_time)
  where status = 'confirmed';

create index bookings_visit_date_idx on public.bookings (visit_date);
create index bookings_phone_idx on public.bookings (phone);

alter table public.bookings enable row level security;
-- Visitantes não acessam a tabela diretamente; usam as funções abaixo.

create policy "Admin vê agendamentos"
  on public.bookings for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admin atualiza agendamentos"
  on public.bookings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Horários ocupados (sem dados pessoais)
create or replace function public.get_taken_slots(p_property_id text, p_from date, p_to date)
returns table (visit_date date, visit_time text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.visit_date, b.visit_time
  from public.bookings b
  where b.property_id = p_property_id
    and b.status = 'confirmed'
    and b.visit_date between p_from and least(p_to, p_from + 60);
$$;

-- Cria um agendamento com validação no servidor
create or replace function public.create_booking(
  p_property_id text,
  p_visit_date date,
  p_visit_time text,
  p_name text,
  p_phone text,
  p_email text default null,
  p_note text default null
)
returns table (id uuid, code text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_slot timestamptz;
  v_code text;
  v_id uuid;
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i integer;
begin
  select p.title into v_title from public.properties p where p.id = p_property_id;
  if v_title is null then
    raise exception 'Imóvel não encontrado' using errcode = 'P0002';
  end if;

  if p_visit_date < v_today or p_visit_date > v_today + 30 then
    raise exception 'Data fora do período permitido' using errcode = '22023';
  end if;

  if p_visit_time !~ '^[0-9]{2}:[0-9]{2}$' then
    raise exception 'Horário inválido' using errcode = '22023';
  end if;

  v_slot := (p_visit_date + p_visit_time::time) at time zone 'America/Sao_Paulo';
  if v_slot < now() + interval '1 hour' then
    raise exception 'Horário precisa de pelo menos 1h de antecedência' using errcode = '22023';
  end if;

  if (
    select count(*) from public.bookings b
    where b.phone = v_phone and b.status = 'confirmed' and b.visit_date >= v_today
  ) >= 3 then
    raise exception 'Limite de visitas ativas para este telefone' using errcode = '22023';
  end if;

  loop
    v_code := 'VIS-';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.bookings b where b.code = v_code);
  end loop;

  begin
    insert into public.bookings (code, property_id, property_title, visit_date, visit_time, name, phone, email, note)
    values (
      v_code,
      p_property_id,
      v_title,
      p_visit_date,
      p_visit_time,
      btrim(p_name),
      v_phone,
      nullif(btrim(coalesce(p_email, '')), ''),
      nullif(btrim(coalesce(p_note, '')), '')
    )
    returning bookings.id into v_id;
  exception when unique_violation then
    raise exception 'Este horário acabou de ser reservado' using errcode = '23505';
  end;

  return query select v_id, v_code;
end;
$$;

-- Cancela um agendamento; exige o id e o código da visita
create or replace function public.cancel_booking(p_id uuid, p_code text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.bookings b
    set status = 'cancelled'
  where b.id = p_id and b.code = p_code and b.status = 'confirmed';
  return found;
end;
$$;

revoke execute on function public.get_taken_slots(text, date, date) from public;
revoke execute on function public.create_booking(text, date, text, text, text, text, text) from public;
revoke execute on function public.cancel_booking(uuid, text) from public;
grant execute on function public.get_taken_slots(text, date, date) to anon, authenticated;
grant execute on function public.create_booking(text, date, text, text, text, text, text) to anon, authenticated;
grant execute on function public.cancel_booking(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Imagens
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Admin envia imagens"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admin atualiza imagens"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admin remove imagens"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));
