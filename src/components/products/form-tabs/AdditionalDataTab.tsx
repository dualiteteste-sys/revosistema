import React from 'react';
import { ProductFormData } from '../../../pages/products/ProductDetailPage';
import Input from '../../ui/forms/Input';
import TextArea from '../../ui/forms/TextArea';
import Section from '../../ui/forms/Section';

interface AdditionalDataTabProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: any) => void;
}

const AdditionalDataTab: React.FC<AdditionalDataTabProps> = ({ data, onChange }) => {
  return (
    <div>
      <Section
        title="Relacionamentos"
        description="Associe este produto a outras entidades do sistema."
      >
        <Input
          label="Marca"
          name="marca_id"
          value={data.marca_id || ''}
          onChange={(e) => onChange('marca_id', e.target.value)}
          placeholder="ID da Marca (temporário)"
        />
        <Input
          label="Tabela de Medidas"
          name="tabela_medidas_id"
          value={data.tabela_medidas_id || ''}
          onChange={(e) => onChange('tabela_medidas_id', e.target.value)}
          placeholder="ID da Tabela (temporário)"
        />
        <div className="sm:col-span-2">
            <Input
                label="Produto Pai (para variações)"
                name="produto_pai_id"
                value={data.produto_pai_id || ''}
                onChange={(e) => onChange('produto_pai_id', e.target.value)}
                placeholder="Selecione um produto pai (temporário)"
            />
        </div>
      </Section>
      <Section
        title="Conteúdo Adicional"
        description="Enriqueça a página do produto com mais informações."
      >
        <div className="sm:col-span-2">
            <Input
                label="URL do Vídeo"
                name="video_url"
                value={data.video_url || ''}
                onChange={(e) => onChange('video_url', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
            />
        </div>
        <div className="sm:col-span-2">
            <TextArea
                label="Descrição Complementar"
                name="descricao_complementar"
                value={data.descricao_complementar || ''}
                onChange={(e) => onChange('descricao_complementar', e.target.value)}
                rows={5}
            />
        </div>
      </Section>
    </div>
  );
};

export default AdditionalDataTab;
