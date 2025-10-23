// src/features/onboarding/OnboardingGate.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { triggerProvisioningAfterAuth } from './triggerProvisioning';
import { useAuth } from '@/contexts/AuthProvider';

type Props = {
  onReady?: (empresaId: string) => void; // opcional: navegar para /app ou /products
};

export default function OnboardingGate({ onReady }: Props) {
  const { activeEmpresa, setActiveEmpresa } = useAuth();
  const [status, setStatus] = useState<'idle'|'checking'|'provisioning'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus('checking');
      setError(null);

      // 1) Verifica sessão autenticada
      const { data: sessionRes } = await supabase.auth.getSession();
      const hasJWT = !!sessionRes?.session?.access_token;
      console.log('[ONBOARD] hasJWT:', hasJWT);

      if (!hasJWT) {
        setStatus('error');
        setError('NO_SESSION');
        return;
      }

      // 2) Se já há empresa ativa, nada a fazer
      if (activeEmpresa?.id) {
        console.log('[ONBOARD] empresa já ativa:', activeEmpresa.id);
        setStatus('done');
        onReady?.(activeEmpresa.id);
        return;
      }

      // 3) Provisiona empresa via RPC e define no contexto
      try {
        setStatus('provisioning');
        const empresa = await triggerProvisioningAfterAuth();
        if (cancelled) return;

        // set no contexto
        if (setActiveEmpresa) {
          setActiveEmpresa(empresa);
          console.log('[ONBOARD] activeEmpresa definida:', empresa.id);
        } else {
          console.warn('[ONBOARD] setActiveEmpresa não disponível no contexto.');
        }

        setStatus('done');
        onReady?.(empresa.id);
      } catch (e: any) {
        console.error('[ONBOARD] erro ao provisionar empresa:', e);
        setError(e?.message ?? String(e));
        setStatus('error');
      }
    }

    run();

    return () => { cancelled = true; };
  }, [activeEmpresa?.id, setActiveEmpresa, onReady]);

  // Render mínimo e silencioso; pode trocar por skeleton/loader se quiser
  if (status === 'error') {
    return (
      <div className="text-sm text-red-600">
        Falha ao preparar ambiente ({error ?? 'erro inesperado'}). Recarregue após login.
      </div>
    );
  }

  return null;
}
