'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BarChart3,
  Clock,
  Globe,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Automação Inteligente',
    description: 'Agentes de IA que trabalham 24/7 automatizando tarefas repetitivas e aumentando sua produtividade.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Prospecção B2B',
    description: 'Capture, qualifique e converta leads automaticamente com nosso núcleo Nigredo especializado.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MessageSquare,
    title: 'Atendimento Automatizado',
    description: 'Responda dúvidas, trate objeções e agende reuniões sem intervenção humana.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards em tempo real com métricas detalhadas e insights acionáveis.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'Segurança Enterprise',
    description: 'Criptografia ponta-a-ponta, conformidade LGPD e infraestrutura AWS de alta disponibilidade.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Globe,
    title: 'Multi-Canal',
    description: 'Integre com WhatsApp, Email, LinkedIn, Instagram e mais de 20 plataformas.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: TrendingUp,
    title: 'ROI Comprovado',
    description: 'Clientes reportam aumento médio de 300% em conversões nos primeiros 3 meses.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Clock,
    title: 'Setup Rápido',
    description: 'Configure e ative seus primeiros agentes em menos de 5 minutos. Sem código necessário.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sparkles,
    title: 'IA de Última Geração',
    description: 'Powered by GPT-4, Claude e modelos proprietários treinados para seu negócio.',
    color: 'from-violet-500 to-purple-500',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Tudo que você precisa para
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> crescer </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Uma plataforma completa com dezenas de agentes especializados, 
            integrações nativas e ferramentas enterprise.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 mb-6">
            Mais de 500 empresas já confiam no Alquimista.AI
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D', 'Empresa E'].map((company, index) => (
              <div key={index} className="text-slate-400 font-semibold text-lg">
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
