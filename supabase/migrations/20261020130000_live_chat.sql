-- Chat ao vivo: conversas de visitantes, mensagens e presença da corretora.
-- Visitantes não acessam as tabelas: iniciam/enviam pela Edge Function "chat"
-- (com Turnstile) e leem com chat_poll(), que exige o segredo da conversa.

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  secret_hash text not null,
  visitor_name text check (char_length(visitor_name) <= 80),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  agent_read_at timestamptz
);

create index chat_conversations_last_message_idx on public.chat_conversations (last_message_at desc);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender text not null check (sender in ('visitor', 'agent', 'bot')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_messages_conversation_idx on public.chat_messages (conversation_id, id);

create table public.agent_presence (
  id smallint primary key default 1 check (id = 1),
  last_seen timestamptz
);
insert into public.agent_presence (id, last_seen) values (1, null);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.agent_presence enable row level security;

-- Admin: vê e gerencia conversas, lê e responde mensagens
create policy "Admin vê conversas" on public.chat_conversations for select
  to authenticated using ((select public.is_admin()));
create policy "Admin atualiza conversas" on public.chat_conversations for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin vê mensagens" on public.chat_messages for select
  to authenticated using ((select public.is_admin()));
create policy "Admin responde" on public.chat_messages for insert
  to authenticated with check ((select public.is_admin()) and sender = 'agent');

-- Atualiza a conversa a cada nova mensagem
create or replace function public.chat_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_conversations
    set last_message_at = new.created_at,
        agent_read_at = case when new.sender = 'agent' then new.created_at else agent_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger chat_messages_touch
  after insert on public.chat_messages
  for each row execute function public.chat_touch_conversation();

revoke execute on function public.chat_touch_conversation() from public, anon, authenticated;

-- Presença: o painel admin chama a cada 30s enquanto está aberto
create or replace function public.agent_heartbeat()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Não autorizado' using errcode = '42501';
  end if;
  update public.agent_presence set last_seen = now() where id = 1;
end;
$$;

create or replace function public.agent_is_online()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select last_seen > now() - interval '75 seconds' from public.agent_presence where id = 1), false);
$$;

-- Leitura do visitante: só com o segredo da conversa
create or replace function public.chat_poll(p_conversation uuid, p_secret text, p_after bigint default 0)
returns table (id bigint, sender text, body text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.sender, m.body, m.created_at
  from public.chat_messages m
  join public.chat_conversations c on c.id = m.conversation_id
  where c.id = p_conversation
    and c.secret_hash = encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex')
    and m.id > coalesce(p_after, 0)
  order by m.id
  limit 200;
$$;

revoke execute on function public.agent_heartbeat() from public, anon;
revoke execute on function public.agent_is_online() from public;
revoke execute on function public.chat_poll(uuid, text, bigint) from public;
grant execute on function public.agent_heartbeat() to authenticated;
grant execute on function public.agent_is_online() to anon, authenticated;
grant execute on function public.chat_poll(uuid, text, bigint) to anon, authenticated;

-- Tempo real para o painel (respeita o RLS: só admins recebem)
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_conversations;
