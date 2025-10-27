import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Database } from '../../types/database.types';
import { useToast } from '../../contexts/ToastProvider';
import DadosGeraisTab from './form-tabs/DadosGeraisTab';
import AdditionalDataTab from './form-tabs/AdditionalDataTab';
import MediaTab from './form-tabs/MediaTab';
import SeoTab from './form-tabs/SeoTab';
import OthersTab from './form-tabs/OthersTab';

export type ProductFormData = Partial<Database['public']['Tables']['produtos']['Row']>;

interface ProductFormPanelProps {
  product: ProductFormData | null;
  onSave: (data: ProductFormData) => Promise<void>;
  onClose: () => void;
}

const tabs = ['Dados Gerais', 'Dados Complementares', 'Mídia', 'SEO', 'Outros'];

const ProductFormPanel: React.FC<ProductFormPanelProps> = ({ product, onSave, onClose }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<ProductFormData>({});
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        tipo: 'simples',
        status: 'ativo',
        unidade: 'un',
        preco_venda: 0,
        moeda: 'BRL',
        icms_origem: 0,
        tipo_embalagem: 'pacote_caixa',
        controla_estoque: true,
        controlar_lotes: false,
        permitir_inclusao_vendas: true,
      });
    }
  }, [product]);

  const handleFormChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome) {
      addToast('O nome do produto é obrigatório.', 'error');
      setActiveTab('Dados Gerais');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
      addToast('Produto salvo com sucesso!', 'success');
      onClose();
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Erro ao salvar o produto', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dados Gerais':
        return <DadosGeraisTab data={formData} onChange={handleFormChange} />;
      case 'Outros':
        return <OthersTab data={formData} onChange={handleFormChange} />;
      case 'Dados Complementares':
        return <AdditionalDataTab data={formData} onChange={handleFormChange} />;
      case 'Mídia':
        return <MediaTab />;
      case 'SEO':
        return <SeoTab data={formData} onChange={handleFormChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/20">
        <nav className="-mb-px flex space-x-4 overflow-x-auto p-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-grow p-6 overflow-y-auto scrollbar-styled">
        {renderTabContent()}
      </div>
      <footer className="flex-shrink-0 p-4 flex justify-end items-center border-t border-white/20">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Produto
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ProductFormPanel;
