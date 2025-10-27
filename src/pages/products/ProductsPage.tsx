import React, { useState } from 'react';
import { useProducts, Product } from '../../hooks/useProducts';
import { useToast } from '../../contexts/ToastProvider';
import ProductsTable from '../../components/products/ProductsTable';
import Pagination from '../../components/ui/Pagination';
import DeleteProductModal from '../../components/products/DeleteProductModal';
import { Loader2, PlusCircle, Search, Package } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ProductFormPanel from '../../components/products/ProductFormPanel';
import { supabase } from '../../lib/supabase';

const ProductsPage: React.FC = () => {
  const {
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
  } = useProducts();
  const { addToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const handleOpenForm = async (product: Product | null = null) => {
    if (product) {
      setIsFetchingDetails(true);
      setIsFormOpen(true);
      setSelectedProduct(null);

      const { data: fullProduct, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', product.id)
        .single();

      setIsFetchingDetails(false);

      if (error || !fullProduct) {
        addToast('Não é possível editar este produto legado. Por favor, crie um novo.', 'info');
        setIsFormOpen(false);
      } else {
        setSelectedProduct(fullProduct);
      }
    } else {
      setSelectedProduct(null);
      setIsFormOpen(true);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      addToast('Produto excluído com sucesso!', 'success');
      handleCloseDeleteModal();
    } catch (e: any) {
      addToast(e.message || 'Erro ao excluir produto.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (column: keyof Product) => {
    setSortBy(prev => ({
      column,
      ascending: prev.column === column ? !prev.ascending : true,
    }));
  };

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={20} />
          Novo Produto
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 pl-10 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <Package size={48} className="mb-4" />
            <p>Nenhum produto encontrado.</p>
            {searchTerm && <p className="text-sm">Tente ajustar sua busca.</p>}
          </div>
        ) : (
          <ProductsTable products={products} onEdit={(p) => handleOpenForm(p)} onDelete={handleOpenDeleteModal} sortBy={sortBy} onSort={handleSort} />
        )}
      </div>

      {count > pageSize && (
        <Pagination
          currentPage={page}
          totalCount={count}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={selectedProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        {isFetchingDetails ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <ProductFormPanel 
              product={selectedProduct}
              onSave={saveProduct}
              onClose={handleCloseForm}
          />
        )}
      </Modal>

      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        product={productToDelete as any}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ProductsPage;
