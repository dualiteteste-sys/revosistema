-- Passo 2: Adicionar função de usuário atual e políticas de RLS para a tabela de produtos.

/*
          # [SECURITY] Criar Helper de Usuário e Políticas RLS para Produtos
          Este script cria a função `public.current_user_id()` para obter o ID do usuário autenticado de forma segura a partir do JWT e aplica as políticas de Row Level Security (RLS) na tabela `public.products`.

          ## Query Description:
          - **`public.current_user_id()`**: Uma função SQL `stable` que extrai o ID do usuário (claim 'sub') do JWT da requisição atual. Isso substitui o uso de `auth.uid()` para maior robustez.
          - **Políticas RLS**: Quatro políticas (SELECT, INSERT, UPDATE, DELETE) são criadas para garantir que um usuário só possa interagir com os produtos pertencentes a uma empresa da qual ele é membro. Isso resolve o alerta "RLS Enabled No Policy" e implementa o isolamento de dados multi-tenant.
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true (as políticas podem ser removidas com DROP POLICY)
          
          ## Structure Details:
          - Functions Created: `public.current_user_id()`
          - Policies Created on `public.products`:
            - `products_select_members`
            - `products_insert_members`
            - `products_update_members`
            - `products_delete_members`
          
          ## Security Implications:
          - RLS Status: Políticas serão aplicadas em `public.products`.
          - Policy Changes: Sim.
          - Auth Requirements: As políticas dependem do JWT do usuário autenticado.
          
          ## Performance Impact:
          - Indexes: Nenhum.
          - Triggers: Nenhum.
          - Estimated Impact: Mínimo. As subconsultas nas políticas são eficientes e usam chaves primárias/estrangeiras.
          */

-- 1) Criar helper para capturar o ID do usuário autenticado a partir do JWT
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

comment on function public.current_user_id() is 'Obtém o UUID do usuário autenticado a partir do JWT da requisição atual.';

-- Garantir que a função seja executável pelos roles relevantes
revoke all on function public.current_user_id() from public;
grant execute on function public.current_user_id() to anon, authenticated, service_role;


-- 2) Atualizar as políticas da tabela public.products

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

-- Apenas membros da empresa podem INSERIR (com empresa correta)
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
