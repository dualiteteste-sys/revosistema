/*
          # [Structural] Criação da Tabela de Produtos
          Cria a tabela `public.products` para armazenar o catálogo de produtos de cada empresa (tenant), incluindo colunas para nome, SKU, preço e unidade. Também configura um índice para busca otimizada e uma trigger para atualizar o campo `updated_at` automaticamente.

          ## Query Description: [Esta operação cria uma nova tabela `products` e habilita a segurança de nível de linha (RLS) nela. Como as políticas de segurança ainda não foram aplicadas, o acesso à tabela estará bloqueado por padrão após a execução. Não há risco de perda de dados, pois a tabela é nova.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tabela: public.products
          - Colunas: id, empresa_id, name, sku, price_cents, unit, active, created_at, updated_at
          - Índices: products_empresa_id_name_lower_idx, products_empresa_id_sku_key (unique)
          - Triggers: products_set_updated_at
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No (serão adicionadas no próximo passo)
          - Auth Requirements: N/A
          
          ## Performance Impact:
          - Indexes: Added
          - Triggers: Added
          - Estimated Impact: Baixo. A criação da tabela e dos índices é uma operação rápida em bancos de dados vazios ou com poucas empresas.
          */

-- 1) Garantir extensão usada para UUID
create extension if not exists pgcrypto;

-- 2) Criar tabela products (idempotente)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.empresas(id) on delete cascade,
  name text not null,
  sku text not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  unit text not null default 'un',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_check check (char_length(trim(name)) > 0),
  constraint products_empresa_id_sku_key unique (empresa_id, sku)
);

comment on table public.products is 'Catálogo de produtos por empresa (tenant).';
comment on column public.products.empresa_id is 'ID da empresa (tenant) a qual o produto pertence.';
comment on column public.products.sku is 'SKU único dentro da empresa.';
comment on column public.products.price_cents is 'Preço em centavos.';

-- 3) Índices úteis
create index if not exists products_empresa_id_name_lower_idx
  on public.products using btree (empresa_id, lower(name));

-- 4) Trigger updated_at
create or replace function public.handle_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.handle_products_updated_at();

-- 5) Habilitar RLS (políticas virão no próximo passo)
alter table if exists public.products enable row level security;
