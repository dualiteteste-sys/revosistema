-- [Recreate] Módulo de Produtos — tabela, índices, trigger e RLS
-- Tabela: public.products
-- Chave de partição lógica: empresa_id (tenant)
-- Regras RLS: acesso restrito a usuários vinculados em public.empresa_usuarios

-- 0) Extensão para UUID (padrão Supabase)
create extension if not exists pgcrypto;

-- 1) Tabela products
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
comment on column public.products.price_cents is 'Preço de venda em centavos.';

-- 2) Índices úteis (busca/sort)
create index if not exists products_empresa_id_name_lower_idx
  on public.products using btree (empresa_id, lower(name));

-- 3) Trigger updated_at (portável)
create or replace function public.handle_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Fixar search_path da função (boa prática de segurança)
alter function public.handle_products_updated_at()
  set search_path = pg_catalog, public;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.handle_products_updated_at();

-- 4) RLS
alter table public.products enable row level security;

-- Políticas (substitui quaisquer existentes)
drop policy if exists "products_select_members" on public.products;
create policy "products_select_members"
on public.products
for select
using (
  empresa_id in (
    select eu.empresa_id
    from public.empresa_usuarios eu
    where eu.user_id = public.current_user_id()
  )
);

drop policy if exists "products_insert_members" on public.products;
create policy "products_insert_members"
on public.products
for insert
with check (
  empresa_id in (
    select eu.empresa_id
    from public.empresa_usuarios eu
    where eu.user_id = public.current_user_id()
  )
);

drop policy if exists "products_update_members" on public.products;
create policy "products_update_members"
on public.products
for update
using (
  empresa_id in (
    select eu.empresa_id
    from public.empresa_usuarios eu
    where eu.user_id = public.current_user_id()
  )
)
with check (
  empresa_id in (
    select eu.empresa_id
    from public.empresa_usuarios eu
    where eu.user_id = public.current_user_id()
  )
);

drop policy if exists "products_delete_members" on public.products;
create policy "products_delete_members"
on public.products
for delete
using (
  empresa_id in (
    select eu.empresa_id
    from public.empresa_usuarios eu
    where eu.user_id = public.current_user_id()
  )
);
