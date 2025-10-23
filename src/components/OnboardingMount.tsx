import React from 'react';
import OnboardingGate from '@/features/onboarding/OnboardingGate';

/**
 * Monta silenciosamente o OnboardingGate para:
 * - Verificar sessão JWT
 * - Provisionar empresa via RPC, caso necessário
 * - Definir activeEmpresa no AuthProvider
 *
 * Pode ser renderizado em qualquer página/layou​t autenticado.
 * Não possui UI; retorna null.
 */
export default function OnboardingMount() {
  return <OnboardingGate onReady={() => { /* opcional: navegação pós-provisionamento */ }} />;
}
