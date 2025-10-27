import React, { useState } from 'react';
import { ProductFormData } from '../ProductFormPanel';
import { tipo_produto, status_produto, tipo_embalagem } from '../../../types/database.types';
import Section from '../../ui/forms/Section';
import Input from '../../ui/forms/Input';
import Select from '../../ui/forms/Select';
import Toggle from '../../ui/forms/Toggle';
import TextArea from '../../ui/forms/TextArea';
import NcmSearchModal from '../NcmSearchModal';
import PackagingIllustration from '../PackagingIllustration';
import { Search } from 'lucide-react';

const tipoProdutoOptions: { value: tipo_produto; label: string }[] = [
  { value: 'simples', label: 'Simples' },
  { value: 'kit', label: 'Kit' },
  { value: 'variacoes', label: 'Com Variações' },
  { value: 'fabricado', label: 'Fabricado' },
  { value: 'materia_prima', label: 'Matéria-Prima' },
];

const statusProdutoOptions: { value: status_produto; label: string }[] = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
];

const icmsOrigemOptions = [
  { value: 0, label: '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8' },
  { value: 1, label: '1 - Estrangeira - Importação direta' },
  { value: 2, label: '2 - Estrangeira - Adquirida no mercado interno' },
  { value: 3, label: '3 - Nacional, com Conteúdo de Importação superior a 40% e inferior ou igual a 70%' },
  { value: 4, label: '4 - Nacional, produção em conformidade com os processos produtivos básicos' },
  { value: 5, label: '5 - Nacional, com Conteúdo de Importação inferior ou igual a 40%' },
  { value: 6, label: '6 - Estrangeira - Importação direta, sem similar nacional, na lista da CAMEX' },
  { value: 7, label: '7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, na lista da CAMEX' },
  { value: 8, label: '8 - Nacional, com Conteúdo de Importação superior a 70%' },
];

const tipoEmbalagemOptions: { value: tipo_embalagem; label: string }[] = [
  { value: 'pacote_caixa', label: 'Pacote / Caixa' },
  { value: 'envelope', label: 'Envelope' },
  { value: 'rolo_cilindro', label: 'Rolo / Cilindro' },
  { value: 'outro', label: 'Outro' },
];

interface DadosGeraisTabProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: any) => void;
}

const DadosGeraisTab: React.FC<DadosGeraisTabProps> = ({ data, onChange }) => {
  const [isNcmModalOpen, setIsNcmModalOpen] = useState(false);
  const tipoEmbalagem = data.tipo_embalagem || 'pacote_caixa';

  return (
    <div>
      <Section
        title="Identificação"
        description="Informações básicas para identificar seu produto."
      >
        <Input
            label="Nome do Produto"
            name="nome"
            value={data.nome || ''}
            onChange={(e) => onChange('nome', e.target.value)}
            required
            className="sm:col-span-6"
            placeholder="Ex: Camiseta de Algodão Pima"
        />
        <Input
            label="Unidade"
            name="unidade"
            value={data.unidade || 'un'}
            onChange={(e) => onChange('unidade', e.target.value)}
            required
            className="sm:col-span-2"
            placeholder="Ex: un, kg, m, pç"
        />
        <Input
            label="Preço de Venda"
            name="preco_venda"
            type="number"
            step="0.01"
            value={data.preco_venda || ''}
            onChange={(e) => onChange('preco_venda', parseFloat(e.target.value) || 0)}
            required
            className="sm:col-span-2"
            placeholder="0,00"
            endAdornment="R$"
        />
        <div className="sm:col-span-2" />
        <Input
            label="SKU"
            name="sku"
            value={data.sku || ''}
            onChange={(e) => onChange('sku', e.target.value)}
            className="sm:col-span-3"
            placeholder="Código interno do produto"
        />
        <Input
            label="GTIN / EAN"
            name="gtin"
            value={data.gtin || ''}
            onChange={(e) => onChange('gtin', e.target.value)}
            className="sm:col-span-3"
            placeholder="Código de barras"
        />
        <Select
            label="Status"
            name="status"
            value={data.status || 'ativo'}
            onChange={(e) => onChange('status', e.target.value)}
            required
            className="sm:col-span-3"
        >
            {statusProdutoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
        <Select
            label="Tipo do produto"
            name="tipo"
            value={data.tipo || 'simples'}
            onChange={(e) => onChange('tipo', e.target.value)}
            required
            className="sm:col-span-3"
        >
            {tipoProdutoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
        <TextArea
            label="Descrição"
            name="descricao"
            value={data.descricao || ''}
            onChange={(e) => onChange('descricao', e.target.value)}
            rows={3}
            className="sm:col-span-6"
            placeholder="Detalhes do produto, características, etc."
        />
      </Section>

      <Section
        title="Fiscal"
        description="Informações necessárias para a emissão de notas fiscais."
      >
        <Select
            label="Origem da mercadoria"
            name="icms_origem"
            value={data.icms_origem ?? 0}
            onChange={(e) => onChange('icms_origem', parseInt(e.target.value, 10))}
            required
            className="sm:col-span-6"
        >
            {icmsOrigemOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </Select>
        <div className="sm:col-span-3">
            <label htmlFor="ncm" className="block text-sm font-medium text-gray-700 mb-1">NCM</label>
            <div className="relative">
                <Input
                    label="" 
                    name="ncm"
                    value={data.ncm || ''}
                    onChange={(e) => onChange('ncm', e.target.value)}
                    placeholder="0000.00.00"
                />
                <button
                  type="button"
                  onClick={() => setIsNcmModalOpen(true)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 hover:text-blue-600 transition-colors"
                  aria-label="Buscar NCM"
                >
                  <Search size={20} />
                </button>
            </div>
        </div>
        <Input
            label="CEST"
            name="cest"
            value={data.cest || ''}
            onChange={(e) => onChange('cest', e.target.value)}
            placeholder="00.000.00"
            className="sm:col-span-3"
        />
      </Section>

      <Section
        title="Dimensões e peso"
        description="Informações logísticas para cálculo de frete e envio."
      >
        <div className="sm:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col justify-center">
                <Select
                    label="Tipo de embalagem"
                    name="tipo_embalagem"
                    value={tipoEmbalagem}
                    onChange={(e) => onChange('tipo_embalagem', e.target.value)}
                    required
                >
                    {tipoEmbalagemOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
                <PackagingIllustration type={tipoEmbalagem} />
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-4">
                <Select
                    label="Embalagem"
                    name="embalagem"
                    value={data.embalagem || 'custom'}
                    onChange={(e) => onChange('embalagem', e.target.value)}
                    className="col-span-3"
                >
                    <option value="custom">Embalagem Customizada</option>
                </Select>

                <Input
                    label="Peso líquido"
                    name="peso_liquido_kg"
                    type="number"
                    step="0.001"
                    value={data.peso_liquido_kg || ''}
                    onChange={(e) => onChange('peso_liquido_kg', parseFloat(e.target.value) || 0)}
                    endAdornment="kg"
                    placeholder="0,000"
                />
                <Input
                    label="Peso bruto"
                    name="peso_bruto_kg"
                    type="number"
                    step="0.001"
                    value={data.peso_bruto_kg || ''}
                    onChange={(e) => onChange('peso_bruto_kg', parseFloat(e.target.value) || 0)}
                    endAdornment="kg"
                    placeholder="0,000"
                />
                <Input
                    label="Nº de volumes"
                    name="num_volumes"
                    type="number"
                    value={data.num_volumes || '1'}
                    onChange={(e) => onChange('num_volumes', parseInt(e.target.value, 10) || 1)}
                    placeholder="1"
                />

                { (tipoEmbalagem === 'pacote_caixa' || tipoEmbalagem === 'envelope') && (
                    <Input
                        label="Largura"
                        name="largura_cm"
                        type="number"
                        step="0.1"
                        value={data.largura_cm || ''}
                        onChange={(e) => onChange('largura_cm', parseFloat(e.target.value) || 0)}
                        endAdornment="cm"
                        placeholder="0,0"
                    />
                )}
                { tipoEmbalagem === 'pacote_caixa' && (
                    <Input
                        label="Altura"
                        name="altura_cm"
                        type="number"
                        step="0.1"
                        value={data.altura_cm || ''}
                        onChange={(e) => onChange('altura_cm', parseFloat(e.target.value) || 0)}
                        endAdornment="cm"
                        placeholder="0,0"
                    />
                )}
                { (tipoEmbalagem === 'pacote_caixa' || tipoEmbalagem === 'envelope' || tipoEmbalagem === 'rolo_cilindro') && (
                    <Input
                        label="Comprimento"
                        name="comprimento_cm"
                        type="number"
                        step="0.1"
                        value={data.comprimento_cm || ''}
                        onChange={(e) => onChange('comprimento_cm', parseFloat(e.target.value) || 0)}
                        endAdornment="cm"
                        placeholder="0,0"
                    />
                )}
                { tipoEmbalagem === 'rolo_cilindro' && (
                    <Input
                        label="Diâmetro"
                        name="diametro_cm"
                        type="number"
                        step="0.1"
                        value={data.diametro_cm || ''}
                        onChange={(e) => onChange('diametro_cm', parseFloat(e.target.value) || 0)}
                        endAdornment="cm"
                        placeholder="0,0"
                    />
                )}
            </div>
        </div>
      </Section>
      
      <Section
        title="Estoque"
        description="Configurações de controle de estoque e disponibilidade."
      >
        <div className="sm:col-span-6">
            <Toggle
                label="Controlar estoque deste item?"
                name="controla_estoque"
                checked={!!data.controla_estoque}
                onChange={(checked) => onChange('controla_estoque', checked)}
                description="Habilite para gerenciar o saldo de estoque do produto."
            />
        </div>
        {data.controla_estoque && (
            <>
                <Input
                    label="Estoque mínimo"
                    name="estoque_min"
                    type="number"
                    value={data.estoque_min || ''}
                    onChange={(e) => onChange('estoque_min', parseFloat(e.target.value) || 0)}
                    className="sm:col-span-3"
                    placeholder="Nível para alerta de reposição"
                />
                <Input
                    label="Estoque máximo"
                    name="estoque_max"
                    type="number"
                    value={data.estoque_max || ''}
                    onChange={(e) => onChange('estoque_max', parseFloat(e.target.value) || 0)}
                    className="sm:col-span-3"
                />
                <Input
                    label="Localização"
                    name="localizacao"
                    type="text"
                    value={data.localizacao || ''}
                    onChange={(e) => onChange('localizacao', e.target.value)}
                    placeholder="Ex: Corredor A, Prateleira 3"
                    className="sm:col-span-3"
                />
                <Input
                    label="Dias para preparação"
                    name="dias_preparacao"
                    type="number"
                    value={data.dias_preparacao || ''}
                    onChange={(e) => onChange('dias_preparacao', parseInt(e.target.value, 10) || 0)}
                    className="sm:col-span-3"
                    placeholder="Tempo para envio após a compra"
                />
            </>
        )}
      </Section>
      
      <NcmSearchModal 
        isOpen={isNcmModalOpen}
        onClose={() => setIsNcmModalOpen(false)}
        onSelect={(ncm) => onChange('ncm', ncm)}
        initialSearchTerm={data.nome || ''}
      />
    </div>
  );
};

export default DadosGeraisTab;
