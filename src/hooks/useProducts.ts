import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthProvider';
import { Database } from '../types/database.types';
import { useDebounce } from './useDebounce';

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export const useProducts = () => {
  const { activeEmpresa } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [sortBy, setSortBy] = useState<{ column: keyof Product; ascending: boolean }>({
    column: 'name',
    ascending: true,
  });

  const fetchProducts = useCallback(async () => {
    if (!activeEmpresa) {
      setProducts([]);
      setCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('empresa_id', activeEmpresa.id)
      .range(from, to)
      .order(sortBy.column as string, { ascending: sortBy.ascending });

    if (debouncedSearchTerm) {
      // busca por nome/sku (case-insensitive)
      query = query.or(`name.ilike.%${debouncedSearchTerm}%,sku.ilike.%${debouncedSearchTerm}%`);
    }

    const { data, error: fetchError, count: fetchCount } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setProducts([]);
      setCount(0);
    } else {
      setProducts(data || []);
      setCount(fetchCount || 0);
    }

    setLoading(false);
  }, [activeEmpresa, page, pageSize, debouncedSearchTerm, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ---- CREATE (via RPC autenticada) ----
  const createProduct = useCallback(
    async (productData: Omit<ProductInsert, 'empresa_id' | 'id' | 'created_at' | 'updated_at'>) => {
      setLoading(true);
      setError(null);

      try {
        // 1) Sessão + usuário (logs de diagnóstico)
        const [{ data: sessionRes }, { data: userRes }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        const hasJWT = !!sessionRes?.session?.access_token;
        const userId = userRes?.user?.id ?? null;

        console.log('[AUTH] hasJWT:', hasJWT, 'userId:', userId, 'activeEmpresaId:', activeEmpresa?.id);
        console.log('[FORM] payload:', productData);

        if (!hasJWT) {
          throw new Error('NO_SESSION: usuário não autenticado.');
        }

        // 2) Chamada RPC: injeta/valida empresa_id conforme o vínculo do usuário
        const { data, error: rpcError } = await supabase
          .rpc('create_product_for_current_user', {
            p_name: productData.name,
            p_sku: productData.sku,
            p_price_cents: productData.price_cents,
            p_unit: productData.unit,
            p_active: productData.active,
            // Como o usuário pode ter múltiplas empresas, passamos explicitamente a ativa
            p_empresa_id: activeEmpresa?.id ?? null,
          })
          .single();

        if (rpcError) {
          console.log('[RPC] create_product_for_current_user error', rpcError);
          if (rpcError.message?.includes('products_empresa_id_sku_key')) {
            throw new Error('Já existe um produto com este SKU para esta empresa.');
          }
          if (rpcError.message?.includes('42501')) {
            throw new Error('Permissão negada. O usuário não pertence à empresa selecionada.');
          }
          if (rpcError.message?.includes('Not authenticated')) {
            throw new Error('Sessão inválida. Faça login novamente.');
          }
          throw rpcError;
        }

        await fetchProducts();
        return data;
      } catch (err) {
        console.error('[CREATE_PRODUCT] failure:', err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [activeEmpresa, fetchProducts]
  );

  // ---- UPDATE ----
  const updateProduct = useCallback(
    async (id: string, productData: ProductUpdate) => {
      if (!activeEmpresa) throw new Error('Nenhuma empresa ativa selecionada.');

      const { data, error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .eq('empresa_id', activeEmpresa.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchProducts();
      return data;
    },
    [activeEmpresa, fetchProducts]
  );

  // ---- DELETE ----
  const deleteProduct = useCallback(
    async (id: string) => {
      if (!activeEmpresa) throw new Error('Nenhuma empresa ativa selecionada.');

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('empresa_id', activeEmpresa.id);

      if (deleteError) throw deleteError;

      await fetchProducts();
    },
    [activeEmpresa, fetchProducts]
  );

  return {
    products,
    loading,
    error,
    count,
    page,
    pageSize,
    searchTerm,
    sortBy,
    setPage,
    setSearchTerm,
    setSortBy,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
