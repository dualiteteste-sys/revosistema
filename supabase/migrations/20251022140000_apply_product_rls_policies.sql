-- Helper para extrair o user_id (sub) do JWT quando auth.uid() não está disponível
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

revoke all on function public.current_user_id() from public;
grant execute on function public.current_user_id() to anon, authenticated, service_role;

-- Garantir RLS habilitado (idempotente)
alter table if exists public.products enable row level security;

-- Políticas RLS (substitui quaisquer existentes)
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
