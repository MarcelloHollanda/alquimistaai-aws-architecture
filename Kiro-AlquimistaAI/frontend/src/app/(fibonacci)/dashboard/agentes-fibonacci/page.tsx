/**
 * Página de Agentes & Núcleos do Fibonacci
 * 
 * Lista todos os núcleos e agentes integrados ao Fibonacci
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Sparkles,
  Network,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  Target,
  Users,
  FileText
} from 'lucide-react';

export default function FibonacciAgentesPage() {
  const nucleos = [
    {
      id: 'nigredo',
      name: 'Nigredo',
      subtitle: 'Núcleo de Prospecção',
      description: 'Sistema completo de prospecção B2B automatizada com 7 agentes especializados',
      status: 'active',
      color: 'from-pink-500 to-rose-500',
      link: '/nigredo',
      agentes: [
        { name: 'Recebimento', icon: Mail, description: 'Captura leads de múltiplas fontes' },
        { name: 'Qualificação', icon: Target, description: 'Qualifica e pontua leads automaticamente' },
        { name: 'Estratégia', icon: TrendingUp, description: 'Define estratégia de abordagem' },
        { name: 'Disparo', icon: MessageSquare, description: 'Envia mensagens personalizadas' },
        { name: 'Atendimento', icon: Users, description: 'Responde dúvidas e objeções' },
        { name: 'Agendamento', icon: Calendar, description: 'Agenda reuniões automaticamente' },
        { name: 'Relatórios', icon: FileText, description: 'Gera relatórios e insights' },
      ]
    },
    {
      id: 'alquimista',
      name: 'Alquimista',
      subtitle: 'Plataforma SaaS',
      description: 'Marketplace de agentes com gestão multi-tenant e billing',
      status: 'development',
      color: 'from-blue-500 to-cyan-500',
      link: '/billing',
      agentes: [
        { name: 'Gestão de Tenants', icon: Users, description: 'Gerencia contas e usuários' },
        { name: 'Billing', icon: FileText, description: 'Faturamento e assinaturas' },
        { name: 'Marketplace', icon: Sparkles, description: 'Catálogo de agentes' },
      ]
    },
    {
      id: 'outros',
      name: 'Outros Núcleos',
      subtitle: 'Em Planejamento',
      description: 'Novos núcleos especializados em desenvolvimento',
      status: 'planned',
      color: 'from-slate-400 to-slate-500',
      link: '#',
      agentes: [
        { name: 'Atendimento', icon: MessageSquare, description: 'Suporte ao cliente' },
        { name: 'Marketing', icon: Sparkles, description: 'Automação de marketing' },
        { name: 'Vendas', icon: TrendingUp, description: 'Gestão de vendas' },
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </span>
        );
      case 'development':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Em Desenvolvimento
          </span>
        );
      case 'planned':
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Planejado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          Agentes & Núcleos
        </h1>
        <p className="text-lg text-slate-600">
          O Fibonacci orquestra múltiplos núcleos especializados, cada um com seus próprios agentes de IA
        </p>
      </motion.div>

      {/* Architecture Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border-2 border-purple-200"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Network className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-800">Arquitetura do Ecossistema</h2>
        </div>
        
        <div className="bg-white rounded-lg p-6 border-2 border-purple-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl mb-4">
              <Network className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Fibonacci Orquestrador</h3>
            <p className="text-slate-600 mb-6">Cérebro central que coordena todos os núcleos</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {nucleos.map((nucleo, index) => (
                <div
                  key={nucleo.id}
                  className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${nucleo.color} rounded-lg mx-auto mb-3`} />
                  <h4 className="font-bold text-slate-800">{nucleo.name}</h4>
                  <p className="text-xs text-slate-600">{nucleo.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Núcleos List */}
      <div className="space-y-6">
        {nucleos.map((nucleo, index) => (
          <motion.div
            key={nucleo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden"
          >
            {/* Núcleo Header */}
            <div className={`bg-gradient-to-r ${nucleo.color} p-6 text-white`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Layers className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">{nucleo.name}</h2>
                  </div>
                  <p className="text-white/90 text-sm mb-2">{nucleo.subtitle}</p>
                  <p className="text-white/80">{nucleo.description}</p>
                </div>
                <div className="ml-4">
                  {getStatusBadge(nucleo.status)}
                </div>
              </div>
            </div>

            {/* Agentes List */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Agentes ({nucleo.agentes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {nucleo.agentes.map((agente, agenteIndex) => {
                  const Icon = agente.icon;
                  return (
                    <div
                      key={agenteIndex}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${nucleo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 mb-1">{agente.name}</h4>
                          <p className="text-sm text-slate-600">{agente.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {nucleo.link !== '#' && (
                <Link href={nucleo.link}>
                  <button className={`w-full md:w-auto px-6 py-3 bg-gradient-to-r ${nucleo.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center group`}>
                    {nucleo.status === 'active' ? 'Abrir' : 'Saiba Mais'} {nucleo.name}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Como Funciona a Orquestração?
            </h3>
            <p className="text-slate-600 mb-4">
              O Fibonacci atua como o cérebro central do ecossistema, coordenando a comunicação entre 
              todos os núcleos através do AWS EventBridge. Cada núcleo é independente mas trabalha em 
              harmonia com os demais.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Eventos Assíncronos:</strong> Comunicação não-bloqueante entre núcleos</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Escalabilidade:</strong> Cada núcleo escala independentemente</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Resiliência:</strong> Falha em um núcleo não afeta os demais</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
