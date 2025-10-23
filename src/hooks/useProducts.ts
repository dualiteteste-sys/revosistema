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

  const [sortBy, setSortBy] = useState<{ column: keyof Product; ascending: boolean }>({ column: 'name', ascending: true });

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
      .order(sortBy.column, { ascending: sortBy.ascending });

    if (debouncedSearchTerm) {
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

  const createProduct = async (productData: Omit<ProductInsert, 'empresa_id' | 'id' | 'created_at' | 'updated_at'>) => {
    if (!activeEmpresa) throw new Error("Nenhuma empresa ativa selecionada.");

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('Sessão inválida: usuário não autenticado.');
    }

    const { data, error: rpcError } = await supabase.rpc('create_product_for_current_user', {
      p_name: productData.name,
      p_sku: productData.sku,
      p_price_cents: productData.price_cents,
      p_unit: productData.unit,
      p_active: productData.active,
      p_empresa_id: activeEmpresa.id,
    }).single();

    if (rpcError) {
      console.error('[RPC] create_product_for_current_user error', rpcError);
      if (rpcError.message.includes('22023')) { // ambiguous empresa
        throw new Error('Erro: Múltiplas empresas encontradas. A empresa ativa não pôde ser determinada.');
      }
      if (rpcError.message.includes('42501')) { // no empresa or not a member
        throw new Error('Permissão negada. O usuário não pertence à empresa selecionada.');
      }
      if (rpcError.message.includes('28000')) { // not authenticated
        throw new Error('Usuário não autenticado.');
      }
      if (rpcError.message.includes('products_empresa_id_sku_key')) { // unique constraint
        throw new Error('Já existe um produto com este SKU para esta empresa.');
      }
      throw rpcError;
    }
    
    await fetchProducts(); // Refetch
    return data;
  };

  const updateProduct = async (id: string, productData: ProductUpdate) => {
    if (!activeEmpresa) throw new Error("Nenhuma empresa ativa selecionada.");

    const { data, error: updateError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .eq('empresa_id', activeEmpresa.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await fetchProducts(); // Refetch
    return data;
  };

  const deleteProduct = async (id: string) => {
    if (!activeEmpresa) throw new Error("Nenhuma empresa ativa selecionada.");

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('empresa_id', activeEmpresa.id);

    if (deleteError) throw deleteError;

    await fetchProducts(); // Refetch
  };

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
