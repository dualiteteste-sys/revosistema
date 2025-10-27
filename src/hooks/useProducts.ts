import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthProvider';
import { Database } from '../types/database.types';
import { useDebounce } from './useDebounce';
import { ProductFormData } from '../components/products/ProductFormPanel';

export type Product = Database['public']['Views']['produtos_compat_view']['Row'];

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
    column: 'nome',
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

    // Usando a VIEW para buscar os produtos unificados
    let query = supabase
      .from('produtos_compat_view')
      .select('*', { count: 'exact' })
      .eq('empresa_id', activeEmpresa.id) // Filtro explícito por empresa
      .range(from, to)
      .order(sortBy.column as string, { ascending: sortBy.ascending });

    if (debouncedSearchTerm) {
      query = query.or(`nome.ilike.%${debouncedSearchTerm}%,sku.ilike.%${debouncedSearchTerm}%`);
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

  const saveProduct = useCallback(async (formData: ProductFormData) => {
    if (!activeEmpresa) {
      throw new Error('Nenhuma empresa ativa selecionada.');
    }

    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as ProductFormData);

    if (formData.id) {
      // Update
      const { id, created_at, updated_at, empresa_id, ...updatePayload } = cleanedData;
      const { error } = await supabase.rpc('update_product_for_current_user', {
        p_id: formData.id,
        patch: updatePayload,
      });
      
      if (error) throw error;

    } else {
      // Create
      const { id, created_at, updated_at, ...createPayload } = cleanedData;
      const { error } = await supabase.rpc('create_product_for_current_user', {
        payload: createPayload,
      });

      if (error) throw error;
    }
    // Força a atualização da lista após salvar
    await fetchProducts();
  }, [activeEmpresa, fetchProducts]);

  const deleteProduct = useCallback(
    async (id: string) => {
      if (!activeEmpresa) throw new Error('Nenhuma empresa ativa selecionada.');

      const { error: deleteError } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

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
    saveProduct,
    deleteProduct,
  };
};
