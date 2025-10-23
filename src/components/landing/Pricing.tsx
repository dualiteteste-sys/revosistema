import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { supabasePublic } from '../../lib/supabasePublic';
import { useAuth } from '../../contexts/AuthProvider';
import { useToast } from '../../contexts/ToastProvider';
import { Loader2 } from 'lucide-react';
import { Database } from '../../types/database.types';
import { startCheckout } from '../../lib/billing';

type Plan = Database['public']['Tables']['plans']['Row'];
type Empresa = Database['public']['Tables']['empresas']['Row'];

interface PricingProps {
  onSignUpClick: () => void;
  onLoginClick: () => void;
  onOpenCreateCompanyModal: (options: { onSuccess: (newCompany: Empresa) => void; }) => void;
}

const planSubtitles: { [key: string]: string } = {
  START: 'Empreendedores e Micro Empresas',
  PRO: 'PMEs em Crescimento',
  MAX: 'Recursos Avançados',
  ULTRA: 'Indústrias e alta demanda de armazenamento',
};

// --- START: Checkout Intent Logic ---
type PendingCheckout = { planSlug: 'START' | 'PRO' | 'MAX' | 'ULTRA'; cycle: 'monthly' | 'yearly'; trial?: boolean };
const PENDING_KEY = 'revo.pendingCheckout';

function savePending(p: PendingCheckout) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(p));
}
function loadPending(): PendingCheckout | null {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); } catch { return null; }
}
function clearPending() { localStorage.removeItem(PENDING_KEY); }
// --- END: Checkout Intent Logic ---

const Pricing: React.FC<PricingProps> = ({ onSignUpClick, onLoginClick, onOpenCreateCompanyModal }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { activeEmpresa, setActiveEmpresa } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const { data, error } = await supabasePublic
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('amount_cents', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        addToast('Não foi possível carregar os planos.', 'error');
      } else {
        setPlans(data);
      }
      setLoading(false);
    };
    fetchPlans();
  }, [addToast]);
  
  const handleCheckout = useCallback(async (plan: Plan, trial = false) => {
    console.log('[pricing] handleCheckout:start', { plan, trial });
    try {
      setCheckoutLoading(plan.id);
  
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[pricing] session?', !!session);
  
      const cycle: 'monthly' | 'yearly' = billingCycle;
      const intent = { planSlug: plan.slug as any, cycle, trial } as const;
  
      if (!session) {
        console.warn('[pricing] bloqueado: sem sessão → abrindo login');
        addToast('Faça login para continuar.', 'info');
        savePending(intent);
        const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
          if (evt === 'SIGNED_IN' && s?.access_token) {
            console.log('[pricing] SIGNED_IN → re-run checkout (intent)');
            sub.subscription.unsubscribe();
            const p = loadPending(); 
            if (p) {
              clearPending();
              // Find the full plan object to pass to handleCheckout
              const targetPlan = plans.find(pl => pl.slug === p.planSlug && pl.billing_cycle === p.cycle);
              if (targetPlan) {
                handleCheckout(targetPlan, p.trial);
              }
            }
          }
        });
        onLoginClick?.();
        return;
      }
  
      if (!activeEmpresa) {
        console.warn('[pricing] bloqueado: sem empresa ativa → abrindo criação');
        addToast('Crie sua empresa para continuar.', 'info');
        savePending(intent);
        onOpenCreateCompanyModal?.({
          onSuccess: (novaEmpresa) => {
            console.log('[pricing] empresa criada', novaEmpresa?.id);
            setActiveEmpresa(novaEmpresa);
            const p = loadPending(); 
            if (p) {
              clearPending();
              const targetPlan = plans.find(pl => pl.slug === p.planSlug && pl.billing_cycle === p.cycle);
              if (targetPlan) {
                setTimeout(() => handleCheckout(targetPlan, p.trial), 0);
              }
            }
          },
        });
        return;
      }
  
      console.log('[pricing] pronto p/ startCheckout', { empresaId: activeEmpresa.id, ...intent });
      await startCheckout(activeEmpresa.id, intent.planSlug, intent.cycle, intent.trial);
      console.log('[pricing] startCheckout:dispatched');
    } catch (e: any) {
      console.error('[pricing] handleCheckout:error', e);
      addToast(e?.message ?? 'Erro ao criar sessão de checkout', 'error');
    } finally {
      setCheckoutLoading(null);
      console.log('[pricing] handleCheckout:done');
    }
  }, [activeEmpresa, addToast, billingCycle, onOpenCreateCompanyModal, onLoginClick, setActiveEmpresa, plans]);

  useEffect(() => {
    (window as any).___forceCheckout = (planSlug = 'PRO', cycle: 'monthly' | 'yearly' = 'monthly') => {
      setBillingCycle(cycle);
      setTimeout(() => {
        const targetPlan = plans.find(p => p.slug === planSlug && p.billing_cycle === cycle);
        if (targetPlan) {
            console.log('[pricing] __forceCheckout', { planSlug, cycle, hasEmpresa: !!activeEmpresa });
            handleCheckout(targetPlan, true); // Assume trial for debug
        } else {
            console.warn(`[pricing] __forceCheckout: Plan '${planSlug}' for cycle '${cycle}' not found. Using a fake plan for debug.`);
            const fakePlan = { id: 'TEST_ID', slug: planSlug, billing_cycle: cycle } as any;
            handleCheckout(fakePlan, true);
        }
      }, 100);
    };
  }, [activeEmpresa, plans, handleCheckout]);


  const currentPlans = plans.filter(p => p.billing_cycle === billingCycle);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planos flexíveis para cada etapa do seu negócio
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Comece de graça por 30 dias. Cancele a qualquer momento.
          </p>
        </div>

        <div className="mt-10 flex justify-center items-center">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>
            Mensal
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`mx-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-gray-500'}`}>
            Anual
          </span>
          <span className="ml-3 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Economize até 3 meses!
          </span>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-8 shadow-lg bg-gray-100 animate-pulse h-[28rem]"></div>
            ))
          ) : (
            currentPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col rounded-2xl p-6 sm:p-8 shadow-lg h-full border ${
                  plan.slug === 'PRO' ? 'bg-gray-800 text-white border-blue-500' : 'bg-white border-gray-200'
                }`}
              >
                {plan.slug === 'PRO' && (
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase">
                      Popular
                    </div>
                  </div>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-1 text-sm h-10 ${plan.slug === 'PRO' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {planSubtitles[plan.slug] || ''}
                </p>
                
                <div className="mt-4 flex items-baseline">
                  <span className={`font-bold text-4xl ${plan.slug === 'PRO' ? 'text-white' : 'text-gray-900'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.amount_cents / 100)}
                  </span>
                  <span className={`ml-1 text-sm ${plan.slug === 'PRO' ? 'text-gray-400' : 'text-gray-500'}`}>
                    /mês
                  </span>
                </div>
                
                <div className="flex-grow"></div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => handleCheckout(plan, false)}
                    disabled={checkoutLoading === plan.id}
                    className={`w-full py-3 px-4 text-base font-semibold rounded-lg transition-transform duration-200 flex items-center justify-center border ${
                      plan.slug === 'PRO'
                        ? 'border-gray-500 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {checkoutLoading === plan.id ? <Loader2 className="animate-spin" /> : 'Assinar'}
                  </button>
                  <button
                    onClick={() => handleCheckout(plan, true)}
                    disabled={checkoutLoading === plan.id}
                    className={`w-full py-3 px-4 text-base font-semibold rounded-lg transition-transform duration-200 flex items-center justify-center ${
                      plan.slug === 'PRO'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {checkoutLoading === plan.id ? <Loader2 className="animate-spin" /> : 'Teste 30 dias grátis'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
