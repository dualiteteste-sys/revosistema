/*
          # [Fix RLS Policies for Products]
          Cria uma função helper `public.current_user_id()` para obter o ID do usuário autenticado a partir do JWT e atualiza as políticas de RLS da tabela `products` para usar esta função, corrigindo a indisponibilidade de `auth.uid()` em certos contextos.

          ## Query Description: [Esta operação é segura e não afeta dados existentes. Ela apenas ajusta as regras de segurança para garantir que o isolamento de dados por empresa funcione corretamente. Nenhuma ação de backup é necessária.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Funções criadas: public.current_user_id()
          - Políticas atualizadas: products_select_members, products_insert_members, products_update_members, products_delete_members na tabela public.products
          
          ## Security Implications:
          - RLS Status: Habilitado
          - Policy Changes: Sim
          - Auth Requirements: JWT de usuário autenticado
          
          ## Performance Impact:
          - Indexes: Nenhum
          - Triggers: Nenhum
          - Estimated Impact: Nenhum impacto de performance esperado. A função é estável e a busca no JWT é rápida.
          */

-- Helper para capturar o ID do usuário autenticado a partir do JWT
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

revoke all on function public.current_user_id() from public;
grant execute on function public.current_user_id() to anon, authenticated, service_role;


-- Atualizar as políticas da tabela public.products

-- Apenas membros da empresa podem LER
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

-- Apenas membros da empresa podem INSERIR
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

-- Apenas membros da empresa podem ATUALIZAR
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

-- Apenas membros da empresa podem DELETAR
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
