import supabase from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

export type Empresa = Database['public']['Tables']['empresas']['Row'];
export type EmpresaUpdate = Database['public']['Tables']['empresas']['Update'];
export type ProvisionEmpresaInput = {
  razao_social: string;
  fantasia: string;
  email?: string | null;
};

/**
 * Atualiza os dados de uma empresa.
 */
export async function updateCompany(id: string, updateData: EmpresaUpdate): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw new Error('Não foi possível atualizar os dados da empresa.');
  }
  return data;
}

/**
 * Cria uma nova empresa para o usuário logado via RPC.
 */
export async function provisionCompany(input: ProvisionEmpresaInput): Promise<Empresa> {
  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session?.access_token) {
    throw new Error('NO_SESSION: usuário não autenticado.');
  }

  const { data, error } = await supabase.rpc('provision_empresa_for_current_user', {
    p_razao_social: input.razao_social,
    p_fantasia: input.fantasia,
    p_email: input.email ?? null,
  }).single();

  if (error) {
    console.error('[ONBOARD] RPC provision_empresa_for_current_user error', error);
    throw error;
  }

  return data as unknown as Empresa;
}
