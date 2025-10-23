import { supabase } from './supabase';

/**
 * Inicia o processo de checkout para um plano de assinatura.
 * @param empresaId - O ID da empresa que está assinando.
 * @param planSlug - O slug do plano (ex: "PRO").
 * @param cycle - O ciclo de faturamento ('monthly' ou 'yearly').
 * @param trial - Se o checkout deve incluir um período de teste.
 */
export async function startCheckout(
  empresaId: string,
  planSlug: "START" | "PRO" | "MAX" | "ULTRA",
  cycle: "monthly" | "yearly",
  trial?: boolean
) {
  const base = import.meta.env.VITE_FUNCTIONS_BASE_URL;
  if (!base || !base.startsWith("https://") || !base.includes(".functions.supabase.co")) {
    console.error("VITE_FUNCTIONS_BASE_URL inválida:", base);
    throw new Error("Config de endpoint das Edge Functions está inválida");
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Usuário não autenticado. Por favor, faça login para continuar.");
  }

  const payload = { 
    empresa_id: empresaId, 
    plan_slug: planSlug, 
    billing_cycle: cycle, 
    ...(trial && { trial: true }) 
  };
  const url = `${base}/billing-checkout`;

  console.log('[billing] calling', url, payload);

  const res = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  }).catch(e => { 
    throw new Error(`Falha de rede ou CORS ao chamar a função: ${(e as Error).message}`); 
  });

  if (!res.ok) { 
    let d = ''; 
    try { 
      d = JSON.stringify(await res.json()); 
    } catch {} 
    throw new Error(`Erro da função (${res.status}): ${d || res.statusText}`); 
  }

  const { url: checkoutUrl } = await res.json(); 
  if (!checkoutUrl) {
    throw new Error('Resposta da função não contém a URL do Stripe Checkout.');
  }

  window.location.href = checkoutUrl;
}
