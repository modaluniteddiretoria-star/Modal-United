-- Contas de clientes: cadastro (via Edge Function "register"), propostas,
-- e vínculo de visitas e conversas do chat ao cliente logado.

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (phone ~ '^[0-9]{10,11}$'),
  email text not null check (char_length(email) <= 254),
  status text not null default 'active' check (status in ('active', 'blocked')),
  privacy_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index clients_created_idx on public.clients (created_at desc);

alter table public.clients enable row level security;

create policy "Cliente vê o próprio cadastro" on public.clients for select
  to authenticated using (id = (select auth.uid()));
create policy "Admin vê clientes" on public.clients for select
  to authenticated using ((select public.is_admin()));
create policy "Admin atualiza clientes" on public.clients for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.is_client()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clients where id = (select auth.uid()) and status = 'active'
  );
$$;

-- Cliente edita nome e WhatsApp (e-mail e status não)
create or replace function public.update_my_profile(p_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if not public.is_client() then
    raise exception 'Cadastro não encontrado ou bloqueado' using errcode = '42501';
  end if;
  update public.clients
    set name = btrim(p_name), phone = v_phone
  where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- Propostas
-- ---------------------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  property_id text references public.properties (id) on delete set null,
  property_title text not null,
  amount numeric(14, 2) not null check (amount > 0 and amount < 1000000000),
  payment text not null check (payment in ('a_vista', 'financiamento', 'permuta', 'outro')),
  message text check (char_length(message) <= 1500),
  status text not null default 'enviada'
    check (status in ('enviada', 'em_analise', 'aceita', 'recusada', 'contraproposta')),
  agent_note text check (char_length(agent_note) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index proposals_client_idx on public.proposals (client_id, created_at desc);
create index proposals_created_idx on public.proposals (created_at desc);

create trigger proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

alter table public.proposals enable row level security;

create policy "Cliente vê as próprias propostas" on public.proposals for select
  to authenticated using (client_id = (select auth.uid()));
create policy "Admin vê propostas" on public.proposals for select
  to authenticated using ((select public.is_admin()));
create policy "Admin atualiza propostas" on public.proposals for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.create_proposal(
  p_property_id text,
  p_amount numeric,
  p_payment text,
  p_message text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_id uuid;
begin
  if not public.is_client() then
    raise exception 'Entre na sua conta para enviar propostas' using errcode = '42501';
  end if;
  select p.title into v_title from public.properties p where p.id = p_property_id;
  if v_title is null then
    raise exception 'Imóvel não encontrado' using errcode = 'P0002';
  end if;
  if (
    select count(*) from public.proposals
    where client_id = auth.uid() and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Limite de 5 propostas por dia atingido' using errcode = '22023';
  end if;
  insert into public.proposals (client_id, property_id, property_title, amount, payment, message)
  values (auth.uid(), p_property_id, v_title, p_amount, p_payment, nullif(btrim(coalesce(p_message, '')), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Visitas: passam a pertencer a um cliente
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column client_id uuid references public.clients (id) on delete set null;
create index bookings_client_idx on public.bookings (client_id);

create policy "Cliente vê as próprias visitas" on public.bookings for select
  to authenticated using (client_id = (select auth.uid()));

-- create_booking ganha o cliente (chamado só pela Edge Function, com service_role)
drop function public.create_booking(text, date, text, text, text, text, text);

create or replace function public.create_booking(
  p_client_id uuid,
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
  if not exists (select 1 from public.clients c where c.id = p_client_id and c.status = 'active') then
    raise exception 'Entre na sua conta para agendar' using errcode = '42501';
  end if;

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
    where b.client_id = p_client_id and b.status = 'confirmed' and b.visit_date >= v_today
  ) >= 3 then
    raise exception 'Você já tem 3 visitas agendadas. Cancele uma para marcar outra.' using errcode = '22023';
  end if;

  loop
    v_code := 'VIS-';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.bookings b where b.code = v_code);
  end loop;

  begin
    insert into public.bookings (code, client_id, property_id, property_title, visit_date, visit_time, name, phone, email, note)
    values (
      v_code,
      p_client_id,
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

revoke execute on function public.create_booking(uuid, text, date, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_booking(uuid, text, date, text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Chat: conversas pertencem ao cliente logado (tempo real via RLS)
-- ---------------------------------------------------------------------------
alter table public.chat_conversations
  add column client_id uuid references public.clients (id) on delete cascade,
  alter column secret_hash drop not null;
create index chat_conversations_client_idx on public.chat_conversations (client_id);

create policy "Cliente vê as próprias conversas" on public.chat_conversations for select
  to authenticated using (client_id = (select auth.uid()));
create policy "Cliente vê as próprias mensagens" on public.chat_messages for select
  to authenticated using (
    exists (
      select 1 from public.chat_conversations c
      where c.id = conversation_id and c.client_id = (select auth.uid())
    )
  );

-- Leitura anônima por segredo não é mais usada
drop function public.chat_poll(uuid, text, bigint);

-- ---------------------------------------------------------------------------
-- Permissões das funções
-- ---------------------------------------------------------------------------
revoke execute on function public.is_client() from public, anon;
revoke execute on function public.update_my_profile(text, text) from public, anon;
revoke execute on function public.create_proposal(text, numeric, text, text) from public, anon;
grant execute on function public.is_client() to authenticated;
grant execute on function public.update_my_profile(text, text) to authenticated;
grant execute on function public.create_proposal(text, numeric, text, text) to authenticated;

alter publication supabase_realtime add table public.proposals;
