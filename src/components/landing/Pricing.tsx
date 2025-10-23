import React, { useState, useEffect } from 'react';
import { supabasePublic } from '@/lib/supabasePublic';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import PricingCard from '@/components/billing/PricingCard';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/contexts/ToastProvider';
import { motion } from 'framer-motion';

type Plan = Database['public']['Tables']['plans']['Row'];
type Empresa = Database['public']['Tables']['empresas']['Row'];

interface PricingProps {
    onSignUpClick: () => void;
    onLoginClick: () => void;
    onOpenCreateCompanyModal: (options: { onSuccess: (newCompany: Empresa) => void; }) => void;
}

const Pricing: React.FC<PricingProps> = ({ onLoginClick, onOpenCreateCompanyModal }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState<{ planId: string | null, type: 'subscribe' | 'trial' | null }>({ planId: null, type: null });
  const { session, activeEmpresa } = useAuth();
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

  const handleCheckout = async (plan: Plan, trial = false) => {
    if (!session) {
      addToast("Você precisa estar logado para iniciar.", "info");
      onLoginClick();
      return;
    }

    const performCheckout = async (empresa: Empresa) => {
        setCheckoutLoading({ planId: plan.id, type: trial ? 'trial' : 'subscribe' });
        try {
            const { data: sessionRes } = await supabase.auth.getSession();
            const token = sessionRes?.session?.access_token ?? null;

            if (!token) {
                throw new Error('Sessão de usuário inválida. Por favor, faça login novamente.');
            }

            const payload = {
                empresa_id: empresa.id,
                plan_slug: plan.slug,
                billing_cycle: plan.billing_cycle,
                trial,
            };

            const { data, error } = await supabase.functions.invoke('billing-checkout', {
                body: payload,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (error) throw error;
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("URL de checkout não recebida.");
            }
        } catch (err: any) {
            console.error('[pricing] handleCheckout:error', err);
            addToast(err?.message ?? 'Falha ao iniciar checkout.', 'error');
        } finally {
            setCheckoutLoading({ planId: null, type: null });
        }
    };

    if (!activeEmpresa) {
        addToast("Vamos criar sua empresa primeiro.", "info");
        onOpenCreateCompanyModal({
            onSuccess: (newCompany) => {
                performCheckout(newCompany);
            }
        });
    } else {
        performCheckout(activeEmpresa);
    }
  };

  const filteredPlans = plans.filter(p => p.billing_cycle === billingCycle);

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Escolha o plano que mais se adapta à sua empresa
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Comece grátis por 30 dias. Cancele quando quiser.
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
            Economize!
          </span>
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                animate: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {filteredPlans.map((plan, index) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  onSubscribe={() => handleCheckout(plan, false)}
                  onTrial={() => handleCheckout(plan, true)}
                  isSubscribing={checkoutLoading.planId === plan.id && checkoutLoading.type === 'subscribe'}
                  isTrialling={checkoutLoading.planId === plan.id && checkoutLoading.type === 'trial'}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
