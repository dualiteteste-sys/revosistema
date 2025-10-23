import React, { useState } from 'react';
import { useProducts, Product, ProductInsert, ProductUpdate } from '../../hooks/useProducts';
import { useToast } from '../../contexts/ToastProvider';
import ProductsTable from '../../components/products/ProductsTable';
import Pagination from '../../components/ui/Pagination';
import ProductFormModal from '../../components/products/ProductFormModal';
import DeleteProductModal from '../../components/products/DeleteProductModal';
import { Loader2, PlusCircle, Search, Package } from 'lucide-react';

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
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const { addToast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setProductToEdit(null);
    setProductToDelete(null);
  };

  const handleSave = async (data: ProductInsert | ProductUpdate) => {
    setIsSaving(true);
    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, data as ProductUpdate);
        addToast('Produto atualizado com sucesso!', 'success');
      } else {
        await createProduct(data as ProductInsert);
        addToast('Produto criado com sucesso!', 'success');
      }
      handleCloseModals();
    } catch (e: any) {
      addToast(e.message || 'Erro ao salvar produto.', 'error');
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      addToast('Produto excluído com sucesso!', 'success');
      handleCloseModals();
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
          onClick={handleOpenCreateModal}
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
          <ProductsTable products={products} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} sortBy={sortBy} onSort={handleSort} />
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

      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSave={handleSave}
        product={productToEdit}
        isSaving={isSaving}
      />

      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDelete}
        product={productToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ProductsPage;
