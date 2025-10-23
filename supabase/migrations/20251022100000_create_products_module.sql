/*
# [Structural] Módulo de Cadastro de Produtos
Cria a tabela `products` para armazenar o catálogo de produtos de cada empresa, com isolamento de dados (multi-tenant) garantido por RLS.

## Query Description:
Esta operação adiciona uma nova tabela `products` ao banco de dados. Não afeta dados existentes em outras tabelas. A segurança é garantida por políticas de RLS que restringem o acesso aos dados de cada empresa (tenant).

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (a reversão requer a exclusão da tabela `products`)

## Structure Details:
- Tabela criada: `public.products`
- Colunas: `id`, `empresa_id`, `name`, `sku`, `price_cents`, `unit`, `active`, `created_at`, `updated_at`
- Índices:
  - `products_pkey` (primary key on `id`)
  - `products_empresa_id_sku_key` (unique index on `empresa_id`, `sku`)
  - `products_empresa_id_name_idx` (index on `empresa_id`, `name`)
- RLS Policies:
  - `Allow full access for company members` (SELECT, INSERT, UPDATE, DELETE)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (novas políticas para a tabela `products`)
- Auth Requirements: O acesso é validado contra a tabela `empresa_usuarios`, garantindo que o usuário autenticado pertença à empresa correspondente.

## Performance Impact:
- Indexes: Adicionados índices para otimizar consultas por SKU e nome, que são operações comuns no módulo.
- Triggers: Adicionado um trigger para atualizar o campo `updated_at` automaticamente.
- Estimated Impact: Baixo. O impacto em performance será localizado nas operações da nova tabela e é mitigado pelos índices.
*/

-- 1. Tabela de Produtos
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    empresa_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    price_cents integer NOT NULL DEFAULT 0,
    unit text NOT NULL DEFAULT 'un'::text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE,
    CONSTRAINT products_name_check CHECK (char_length(name) > 0),
    CONSTRAINT products_price_cents_check CHECK (price_cents >= 0)
);

-- 2. Comentários da Tabela e Colunas
COMMENT ON TABLE public.products IS 'Catálogo de produtos por empresa (tenant).';
COMMENT ON COLUMN public.products.empresa_id IS 'ID da empresa (tenant) a qual o produto pertence.';
COMMENT ON COLUMN public.products.name IS 'Nome ou descrição do produto.';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - Código único do produto dentro da empresa.';
COMMENT ON COLUMN public.products.price_cents IS 'Preço de venda do produto em centavos.';
COMMENT ON COLUMN public.products.unit IS 'Unidade de medida (ex: un, kg, pç).';
COMMENT ON COLUMN public.products.active IS 'Indica se o produto está ativo para venda.';


-- 3. Trigger para updated_at (assumindo que a função moddatetime existe, é padrão em projetos Supabase)
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION moddatetime (updated_at);

-- 4. Índices para Otimização
CREATE UNIQUE INDEX products_empresa_id_sku_key ON public.products USING btree (empresa_id, sku);
CREATE INDEX products_empresa_id_name_idx ON public.products USING btree (empresa_id, name);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Acesso
CREATE POLICY "Allow full access for company members"
ON public.products
FOR ALL
USING (
  empresa_id IN (
    SELECT eu.empresa_id
    FROM public.empresa_usuarios eu
    WHERE eu.user_id = auth.uid()
  )
)
WITH CHECK (
  empresa_id IN (
    SELECT eu.empresa_id
    FROM public.empresa_usuarios eu
    WHERE eu.user_id = auth.uid()
  )
);
