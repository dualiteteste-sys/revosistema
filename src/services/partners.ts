import supabase from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

// Tipos para a lista de parceiros, com base no retorno da RPC `list_partners`
export type PartnerListItem = {
  id: string;
  nome: string;
  tipo: Database['public']['Enums']['pessoa_tipo'];
  doc_unico: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

// Tipos para os detalhes completos de um parceiro
export type Pessoa = Database['public']['Tables']['pessoas']['Row'];
export type Endereco = Database['public']['Tables']['pessoa_enderecos']['Row'];
export type Contato = Database['public']['Tables']['pessoa_contatos']['Row'];

export type PartnerDetails = Pessoa & {
  enderecos: Endereco[];
  contatos: Contato[];
};

// Tipo para o payload enviado para a RPC de criação/atualização
export type PartnerPayload = {
  pessoa: Partial<Pessoa>;
  enderecos?: Partial<Endereco>[];
  contatos?: Partial<Contato>[];
};

/**
 * Busca uma lista paginada e filtrada de parceiros.
 */
export async function getPartners(options: {
  page: number;
  pageSize: number;
  searchTerm: string;
  filterType: string | null;
  sortBy: { column: keyof PartnerListItem; ascending: boolean };
}): Promise<{ data: PartnerListItem[]; count: number }> {
  const { page, pageSize, searchTerm, filterType, sortBy } = options;
  const offset = (page - 1) * pageSize;
  const orderString = `${sortBy.column} ${sortBy.ascending ? 'asc' : 'desc'}`;

  const { data: countData, error: countError } = await supabase.rpc('count_partners', {
    p_q: searchTerm || null,
    p_tipo: (filterType as Database['public']['Enums']['pessoa_tipo']) || null,
  });

  if (countError) {
    console.error('[SERVICE][COUNT_PARTNERS]', countError);
    throw new Error('Não foi possível contar os registros.');
  }

  const { data, error } = await supabase.rpc('list_partners', {
    p_limit: pageSize,
    p_offset: offset,
    p_q: searchTerm || null,
    p_tipo: (filterType as Database['public']['Enums']['pessoa_tipo']) || null,
    p_order: orderString,
  });

  if (error) {
    console.error('[SERVICE][LIST_PARTNERS]', error);
    throw new Error('Não foi possível listar os registros.');
  }

  return { data: (data as PartnerListItem[]) ?? [], count: countData ?? 0 };
}

/**
 * Busca os detalhes completos de um parceiro.
 */
export async function getPartnerDetails(id: string): Promise<PartnerDetails | null> {
  const { data, error } = await supabase.rpc('get_partner_details', { p_id: id });
  if (error) {
    console.error('[SERVICE][GET_PARTNER_DETAILS]', error);
    throw new Error('Erro ao buscar detalhes do registro.');
  }
  return data as PartnerDetails | null;
}

/**
 * Cria ou atualiza um parceiro com seus endereços e contatos.
 */
export async function savePartner(payload: PartnerPayload): Promise<PartnerDetails> {
  const { data, error } = await supabase.rpc('create_update_partner', { p_payload: payload });
  if (error) {
    console.error('[SERVICE][SAVE_PARTNER]', error);
    // Mapeia erros comuns do banco para mensagens amigáveis
    if (error.message.includes('ux_pessoas_empresa_doc')) {
        throw new Error('Já existe um registro com este CPF/CNPJ.');
    }
    if (error.code === '22000') { // Erro de "Nenhuma empresa ativa"
        throw new Error('Sessão da empresa inválida. Por favor, selecione a empresa novamente.');
    }
    throw new Error(error.message || 'Erro ao salvar o registro.');
  }
  return data as PartnerDetails;
}


/**
 * Exclui um parceiro.
 */
export async function deletePartner(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_partner', { p_id: id });
  if (error) {
    console.error('[SERVICE][DELETE_PARTNER]', error);
    throw new Error(error.message || 'Erro ao excluir o registro.');
  }
}
