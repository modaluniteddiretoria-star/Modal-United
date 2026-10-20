-- Tipo de negócio do imóvel: à venda ou para alugar (preço mensal no aluguel)
alter table public.properties
  add column transaction text not null default 'venda'
  check (transaction in ('venda', 'aluguel'));
