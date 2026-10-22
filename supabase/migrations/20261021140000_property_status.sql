-- Status do imóvel: ativo (aparece no site), pausado ou vendido (só no painel)
alter table public.properties
  add column status text not null default 'ativo'
  check (status in ('ativo', 'pausado', 'vendido'));

create index properties_status_sort_idx on public.properties (status, sort_order, created_at desc);

-- Visitantes veem só os ativos; o admin vê todos
drop policy "Imóveis são públicos" on public.properties;

create policy "Imóveis ativos são públicos"
  on public.properties for select
  to anon
  using (status = 'ativo');

create policy "Imóveis ativos (ou todos para o admin)"
  on public.properties for select
  to authenticated
  using (status = 'ativo' or (select public.is_admin()));

-- Agendamentos e propostas só para imóveis ativos (vale também para as RPCs security definer)
create or replace function public.require_active_property()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.property_id is not null and not exists (
    select 1 from public.properties p where p.id = new.property_id and p.status = 'ativo'
  ) then
    raise exception 'Este imóvel não está mais disponível' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

revoke execute on function public.require_active_property() from public, anon, authenticated;

create trigger bookings_require_active_property
  before insert on public.bookings
  for each row execute function public.require_active_property();

create trigger proposals_require_active_property
  before insert on public.proposals
  for each row execute function public.require_active_property();
