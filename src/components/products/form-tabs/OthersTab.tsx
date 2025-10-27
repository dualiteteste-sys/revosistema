import React, { useState, useEffect } from 'react';
import { ProductFormData } from '../ProductFormPanel';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthProvider';
import { Database } from '../../../types/database.types';

// UI Components
import Section from '../../ui/forms/Section';
import Input from '../../ui/forms/Input';
import Select from '../../ui/forms/Select';
import Toggle from '../../ui/forms/Toggle';
import TextArea from '../../ui/forms/TextArea';

type LinhaProduto = Database['public']['Tables']['linhas_produto']['Row'];

interface OthersTabProps {
  data: ProductFormData;
  onChange: (field: keyof ProductFormData, value: any) => void;
}

const OthersTab: React.FC<OthersTabProps> = ({ data, onChange }) => {
  const { activeEmpresa } = useAuth();
  const [linhasProduto, setLinhasProduto] = useState<LinhaProduto[]>([]);

  useEffect(() => {
    const fetchLinhasProduto = async () => {
      if (!activeEmpresa) return;
      const { data, error } = await supabase
        .from('linhas_produto')
        .select('*')
        .eq('empresa_id', activeEmpresa.id);
      
      if (error) {
        console.error("Erro ao buscar linhas de produto", error);
      } else {
        setLinhasProduto(data);
      }
    };
    fetchLinhasProduto();
  }, [activeEmpresa]);

  return (
    <div>
      <Section
        title="Dados Comerciais"
        description="Informações para gestão de vendas e custos."
      >
        <Input
          label="Preço de Custo (R$)"
          name="preco_custo"
          type="number"
          value={data.preco_custo || ''}
          onChange={(e) => onChange('preco_custo', parseFloat(e.target.value) || null)}
        />
        <Input
          label="Markup (%)"
          name="markup"
          type="number"
          value={data.markup || ''}
          onChange={(e) => onChange('markup', parseFloat(e.target.value) || null)}
          placeholder="Ex: 0.5 para 50%"
        />
        <Select
          label="Linha de Produto"
          name="linha_produto_id"
          value={data.linha_produto_id || ''}
          onChange={(e) => onChange('linha_produto_id', e.target.value || null)}
        >
          <option value="">Nenhuma</option>
          {linhasProduto.map(linha => (
            <option key={linha.id} value={linha.id}>{linha.nome}</option>
          ))}
        </Select>
        <Input
          label="Garantia (meses)"
          name="garantia_meses"
          type="number"
          value={data.garantia_meses || ''}
          onChange={(e) => onChange('garantia_meses', parseInt(e.target.value, 10) || null)}
        />
        <Input
          label="Itens por Caixa"
          name="itens_por_caixa"
          type="number"
          value={data.itens_por_caixa || ''}
          onChange={(e) => onChange('itens_por_caixa', parseInt(e.target.value, 10) || 0)}
        />
        <div className="sm:col-span-2">
            <Toggle
                label="Permitir Inclusão em Vendas"
                name="permitir_inclusao_vendas"
                checked={data.permitir_inclusao_vendas ?? true}
                onChange={(checked) => onChange('permitir_inclusao_vendas', checked)}
            />
        </div>
      </Section>

      <Section
        title="Informações Tributárias Adicionais"
        description="Dados para cenários fiscais específicos."
      >
        <Input
          label="GTIN Tributável (Caixa/Fardo)"
          name="gtin_tributavel"
          value={data.gtin_tributavel || ''}
          onChange={(e) => onChange('gtin_tributavel', e.target.value)}
        />
        <Input
          label="Unidade Tributável"
          name="unidade_tributavel"
          value={data.unidade_tributavel || ''}
          onChange={(e) => onChange('unidade_tributavel', e.target.value)}
          placeholder="Ex: CX, FD"
        />
        <Input
          label="Fator de Conversão"
          name="fator_conversao"
          type="number"
          value={data.fator_conversao || ''}
          onChange={(e) => onChange('fator_conversao', parseFloat(e.target.value) || null)}
        />
        <Input
          label="Cód. Enquadramento IPI"
          name="codigo_enquadramento_ipi"
          value={data.codigo_enquadramento_ipi || ''}
          onChange={(e) => onChange('codigo_enquadramento_ipi', e.target.value)}
        />
        <Input
          label="Valor Fixo de IPI (R$)"
          name="valor_ipi_fixo"
          type="number"
          value={data.valor_ipi_fixo || ''}
          onChange={(e) => onChange('valor_ipi_fixo', parseFloat(e.target.value) || null)}
        />
        <Input
          label="Cód. Enq. Legal IPI"
          name="codigo_enquadramento_legal_ipi"
          value={data.codigo_enquadramento_legal_ipi || ''}
          onChange={(e) => onChange('codigo_enquadramento_legal_ipi', e.target.value)}
        />
        <Input
          label="EX TIPI"
          name="ex_tipi"
          value={data.ex_tipi || ''}
          onChange={(e) => onChange('ex_tipi', e.target.value)}
        />
      </Section>
      
      <Section
        title="Observações Internas"
        description="Anotações que não serão exibidas para seus clientes."
      >
        <div className="sm:col-span-2">
            <TextArea
                label="Observações"
                name="observacoes_internas"
                value={data.observacoes_internas || ''}
                onChange={(e) => onChange('observacoes_internas', e.target.value)}
                rows={4}
            />
        </div>
      </Section>
    </div>
  );
};

export default OthersTab;
