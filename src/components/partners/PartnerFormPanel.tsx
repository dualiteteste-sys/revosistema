import React, { useState, useEffect } from 'react';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
import { PartnerDetails, savePartner, Endereco, Contato } from '../../services/partners';
import { useToast } from '../../contexts/ToastProvider';
import Section from '../ui/forms/Section';
import Input from '../ui/forms/Input';
import Select from '../ui/forms/Select';
import TextArea from '../ui/forms/TextArea';
import Toggle from '../ui/forms/Toggle';
import { Database } from '@/types/database.types';

type Pessoa = Database['public']['Tables']['pessoas']['Row'];

interface PartnerFormPanelProps {
  partner: PartnerDetails | null;
  onSaveSuccess: (savedPartner: PartnerDetails) => void;
  onClose: () => void;
}

const PartnerFormPanel: React.FC<PartnerFormPanelProps> = ({ partner, onSaveSuccess, onClose }) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Pessoa>>({});
  const [addresses, setAddresses] = useState<Partial<Endereco>[]>([]);
  const [contacts, setContacts] = useState<Partial<Contato>[]>([]);

  useEffect(() => {
    if (partner) {
      const { enderecos, contatos, ...pessoaData } = partner;
      setFormData(pessoaData);
      setAddresses(enderecos || []);
      setContacts(contatos || []);
    } else {
      setFormData({ tipo: 'cliente', isento_ie: false });
      setAddresses([]);
      setContacts([]);
    }
  }, [partner]);

  const handleFormChange = (field: keyof Pessoa, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (index: number, field: keyof Endereco, value: any) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setAddresses(newAddresses);
  };

  const handleContactChange = (index: number, field: keyof Contato, value: any) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const addAddress = () => setAddresses([...addresses, { tipo_endereco: 'principal' }]);
  const removeAddress = (index: number) => setAddresses(addresses.filter((_, i) => i !== index));
  const addContact = () => setContacts([...contacts, {}]);
  const removeContact = (index: number) => setContacts(contacts.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!formData.nome) {
      addToast('O nome é obrigatório.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { pessoa: formData, enderecos: addresses, contatos: contacts };
      const savedPartner = await savePartner(payload);
      addToast('Salvo com sucesso!', 'success');
      onSaveSuccess(savedPartner);
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-6 overflow-y-auto scrollbar-styled">
        <Section title="Dados Principais" description="Informações de identificação do parceiro.">
          <Input label="Nome / Razão Social" name="nome" value={formData.nome || ''} onChange={(e) => handleFormChange('nome', e.target.value)} required className="sm:col-span-4" />
          <Select label="Tipo" name="tipo" value={formData.tipo || 'cliente'} onChange={(e) => handleFormChange('tipo', e.target.value)} required className="sm:col-span-2">
            <option value="cliente">Cliente</option>
            <option value="fornecedor">Fornecedor</option>
            <option value="ambos">Ambos</option>
          </Select>
          <Input label="CPF / CNPJ" name="doc_unico" value={formData.doc_unico || ''} onChange={(e) => handleFormChange('doc_unico', e.target.value)} className="sm:col-span-3" />
          <Input label="Inscrição Estadual" name="inscr_estadual" value={formData.inscr_estadual || ''} onChange={(e) => handleFormChange('inscr_estadual', e.target.value)} className="sm:col-span-2" />
          <div className="sm:col-span-1 flex items-end pb-2"><Toggle label="Isento" name="isento_ie" checked={!!formData.isento_ie} onChange={(c) => handleFormChange('isento_ie', c)} /></div>
          <Input label="Inscrição Municipal" name="inscr_municipal" value={formData.inscr_municipal || ''} onChange={(e) => handleFormChange('inscr_municipal', e.target.value)} className="sm:col-span-3" />
          <Input label="E-mail Principal" name="email" type="email" value={formData.email || ''} onChange={(e) => handleFormChange('email', e.target.value)} className="sm:col-span-3" />
          <Input label="Telefone Principal" name="telefone" value={formData.telefone || ''} onChange={(e) => handleFormChange('telefone', e.target.value)} className="sm:col-span-3" />
          <TextArea label="Observações" name="observacoes" value={formData.observacoes || ''} onChange={(e) => handleFormChange('observacoes', e.target.value)} rows={3} className="sm:col-span-6" />
        </Section>

        <Section title="Endereços" description="Adicione um ou mais endereços para este parceiro.">
          <div className="sm:col-span-6 space-y-6">
            {addresses.map((addr, index) => (
              <div key={addr.id || index} className="p-4 border rounded-lg bg-gray-50/50 relative">
                <button onClick={() => removeAddress(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                <div className="grid grid-cols-6 gap-4">
                  <Input label="CEP" name={`cep-${index}`} value={addr.cep || ''} onChange={e => handleAddressChange(index, 'cep', e.target.value)} className="col-span-6 sm:col-span-2" />
                  <Input label="Logradouro" name={`logradouro-${index}`} value={addr.logradouro || ''} onChange={e => handleAddressChange(index, 'logradouro', e.target.value)} className="col-span-6 sm:col-span-4" />
                  <Input label="Número" name={`numero-${index}`} value={addr.numero || ''} onChange={e => handleAddressChange(index, 'numero', e.target.value)} className="col-span-6 sm:col-span-2" />
                  <Input label="Complemento" name={`complemento-${index}`} value={addr.complemento || ''} onChange={e => handleAddressChange(index, 'complemento', e.target.value)} className="col-span-6 sm:col-span-4" />
                  <Input label="Bairro" name={`bairro-${index}`} value={addr.bairro || ''} onChange={e => handleAddressChange(index, 'bairro', e.target.value)} className="col-span-6 sm:col-span-3" />
                  <Input label="Cidade" name={`cidade-${index}`} value={addr.cidade || ''} onChange={e => handleAddressChange(index, 'cidade', e.target.value)} className="col-span-6 sm:col-span-2" />
                  <Input label="UF" name={`uf-${index}`} value={addr.uf || ''} onChange={e => handleAddressChange(index, 'uf', e.target.value)} className="col-span-6 sm:col-span-1" />
                </div>
              </div>
            ))}
            <button onClick={addAddress} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"><PlusCircle size={16} /> Adicionar Endereço</button>
          </div>
        </Section>

        <Section title="Contatos" description="Adicione pessoas de contato para este parceiro.">
          <div className="sm:col-span-6 space-y-6">
            {contacts.map((contact, index) => (
              <div key={contact.id || index} className="p-4 border rounded-lg bg-gray-50/50 relative">
                <button onClick={() => removeContact(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nome do Contato" name={`contact-nome-${index}`} value={contact.nome || ''} onChange={e => handleContactChange(index, 'nome', e.target.value)} />
                  <Input label="Cargo" name={`contact-cargo-${index}`} value={contact.cargo || ''} onChange={e => handleContactChange(index, 'cargo', e.target.value)} />
                  <Input label="E-mail" name={`contact-email-${index}`} type="email" value={contact.email || ''} onChange={e => handleContactChange(index, 'email', e.target.value)} />
                  <Input label="Telefone" name={`contact-telefone-${index}`} value={contact.telefone || ''} onChange={e => handleContactChange(index, 'telefone', e.target.value)} />
                </div>
              </div>
            ))}
            <button onClick={addContact} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"><PlusCircle size={16} /> Adicionar Contato</button>
          </div>
        </Section>
      </div>

      <footer className="flex-shrink-0 p-4 flex justify-end items-center border-t border-white/20">
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PartnerFormPanel;
