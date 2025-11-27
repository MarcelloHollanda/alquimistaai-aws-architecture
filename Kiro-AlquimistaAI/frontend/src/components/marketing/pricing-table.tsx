'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    subtitle: 'Para começar',
    icon: <Sparkles className="w-6 h-6" />,
    monthlyPrice: 497,
    annualPrice: 4970,
    description: 'Ideal para pequenas empresas que querem automatizar prospecção',
    features: [
      '3 agentes de IA ativos',
      'Até 500 leads/mês',
      'Prospecção automatizada',
      'Relatórios básicos',
      'Suporte por email',
      'Integração WhatsApp',
    ],
    cta: 'Começar Agora',
    highlighted: false,
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Pro',
    subtitle: 'Mais popular',
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 997,
    annualPrice: 9970,
    description: 'Para empresas em crescimento que querem escalar',
    features: [
      '7 agentes de IA ativos',
      'Até 2.000 leads/mês',
      'Prospecção + Qualificação',
      'Relatórios avançados',
      'Suporte prioritário',
      'Integrações ilimitadas',
      'Análise de sentimento',
      'Agendamento automático',
    ],
    cta: 'Começar Teste Grátis',
    highlighted: true,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Enterprise',
    subtitle: 'Solução completa',
    icon: <Crown className="w-6 h-6" />,
    monthlyPrice: null,
    annualPrice: null,
    description: 'Para grandes empresas com necessidades customizadas',
    features: [
      'Agentes ilimitados',
      'Leads ilimitados',
      'Todos os recursos Pro',
      'Agentes customizados',
      'Suporte dedicado 24/7',
      'SLA garantido',
      'Treinamento da equipe',
      'Infraestrutura dedicada',
    ],
    cta: 'Falar com Vendas',
    highlighted: false,
    color: 'from-amber-500 to-orange-500',
  },
];

export function PricingTable() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div 
          className="inline-flex items-center bg-slate-100 rounded-full p-1"
          role="group"
          aria-label="Período de cobrança"
        >
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              billingPeriod === 'monthly'
                ? 'bg-white text-slate-800 shadow-md'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            aria-pressed={billingPeriod === 'monthly'}
            aria-label="Cobrança mensal"
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              billingPeriod === 'annual'
                ? 'bg-white text-slate-800 shadow-md'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            aria-pressed={billingPeriod === 'annual'}
            aria-label="Cobrança anual com 20% de desconto"
          >
            Anual
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full" aria-hidden="true">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ${
              plan.highlighted
                ? 'ring-2 ring-blue-500 scale-105 md:scale-110'
                : 'hover:-translate-y-2'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </div>
            )}

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center text-white`}>
                  {plan.icon}
                </div>
                <span className="text-sm font-semibold text-slate-500">{plan.subtitle}</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
              <p className="text-slate-600 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                {plan.monthlyPrice ? (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-slate-800">
                        R$ {billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                      </span>
                      <span className="text-slate-600 ml-2">/mês</span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-sm text-green-600 mt-1">
                        Economize R$ {plan.monthlyPrice * 12 - plan.annualPrice}/ano
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-2xl font-bold text-slate-800">Sob consulta</div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.monthlyPrice ? '/signup' : '/contato'}
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-xl hover:scale-105'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
                aria-label={`${plan.cta} - Plano ${plan.name}`}
              >
                {plan.cta}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-slate-600 mb-4">
          Todos os planos incluem teste grátis de 14 dias. Sem cartão de crédito necessário.
        </p>
        <Link href="/comparacao" className="text-purple-600 hover:text-purple-700 font-semibold">
          Ver comparação completa de recursos →
        </Link>
      </div>
    </div>
  );
}
