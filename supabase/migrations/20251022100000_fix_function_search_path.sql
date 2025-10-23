/*
# [SECURITY] Fix Function Search Path
This migration sets a fixed `search_path` for custom functions to prevent potential security vulnerabilities related to path manipulation, addressing the `function_search_path_mutable` advisory.

## Query Description:
This operation alters existing database functions to explicitly define their search path. It's a safe, non-destructive change that improves security by ensuring functions resolve objects from trusted schemas only (`pg_catalog`, `public`). There is no impact on existing data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by unsetting the search_path)

## Structure Details:
- Functions affected:
  - `public.current_user_id()`
  - `public.handle_products_updated_at()`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: `function_search_path_mutable` security advisory.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a metadata change on function definitions.
*/

-- Fixar search_path nas funções para remover o warning de segurança
alter function public.current_user_id()
  set search_path = pg_catalog, public;

alter function public.handle_products_updated_at()
  set search_path = pg_catalog, public;
