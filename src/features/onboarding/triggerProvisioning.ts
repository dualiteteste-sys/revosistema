// src/features/onboarding/triggerProvisioning.ts
import { supabase } from '@/lib/supabase';
import { provisionEmpresa, type Empresa } from './api';

function makeDefaultNames(email?: string | null) {
  if (!email) return { razao_social: 'Nova Empresa', fantasia: 'Minha Empresa' };
  const handle = email.split('@')[0]?.replace(/[\W_]+/g, ' ').trim();
  const pretty = handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'Minha Empresa';
  return { razao_social: `${pretty} LTDA`, fantasia: pretty };
}

/**
 * Deve ser chamado imediatamente APÓS o usuário estar autenticado (signup/login concluído).
 * - Verifica sessão (JWT).
 * - Gera nomes default a partir do e-mail.
 * - Chama a RPC `provision_empresa_for_current_user`.
 * - Retorna a empresa criada para que o caller defina `activeEmpresa`.
 */
export async function triggerProvisioningAfterAuth(): Promise<Empresa> {
  // 1) Sessão obrigatória
  const [{ data: sessionRes }, { data: userRes }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  const hasJWT = !!sessionRes?.session?.access_token;
  const email = userRes?.user?.email ?? null;
  console.log('[ONBOARD] hasJWT:', hasJWT, 'email:', email);
  if (!hasJWT) throw new Error('NO_SESSION: usuário não autenticado.');

  // 2) Nomes default (pode customizar na landing)
  const { razao_social, fantasia } = makeDefaultNames(email);

  // 3) Provisionar empresa via RPC autenticada
  const empresa = await provisionEmpresa({
    razao_social,
    fantasia,
    email,
  });

  console.log('[ONBOARD] empresa provisionada:', empresa?.id, empresa?.fantasia);
  return empresa;
}
