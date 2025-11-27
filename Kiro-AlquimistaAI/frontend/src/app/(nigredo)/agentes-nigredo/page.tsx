'use client';

/**
 * Nigredo - Página de Agentes
 * Exibe os 7 agentes de prospecção com status e métricas
 */

import { motion } from 'framer-motion';
import { 
  Inbox, 
  Target, 
  Send, 
  MessageCircle, 
  Heart,
  Calendar,
  FileText,
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function NigredoAgentesPage() {
  const agentes = [
    {
      id: 'recebimento',
      nome: 'Recebimento',
      descricao: 'Higieniza, valida e enriquece leads de múltiplas fontes',
      icon: <Inbox className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      status: 'Ativo',
      metricas: {
        processados: 89,
        validados: 82,
        enriquecidos: 76,
        taxa_sucesso: '92%'
      },
      funcionalidades: [
        'Validação de email e telefone',
        'Enriquecimento via APIs externas',
        'Detecção de duplicatas',
        'Normalização de dados'
      ]
    },
    {
      id: 'estrategia',
      nome: 'Estratégia',
      descricao: 'Cria campanhas segmentadas com mensagens personalizadas',
      icon: <Target className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      status: 'Ativo',
      metricas: {
        campanhas: 12,
        segmentos: 8,
        mensagens: 234,
        taxa_abertura: '68%'
      },
      funcionalidades: [
        'Segmentação inteligente',
        'Personalização de mensagens',
        'A/B testing automático',
        'Otimização de timing'
      ]
    },
    {
      id: 'disparo',
      nome: 'Disparo',
      descricao: 'Envia mensagens respeitando horário comercial e rate limits',
      icon: <Send className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      status: 'Ativo',
      metricas: {
        enviadas: 234,
        entregues: 228,
        pendentes: 12,
        taxa_entrega: '97%'
      },
      funcionalidades: [
        'Disparo em horário comercial',
        'Rate limiting inteligente',
        'Retry automático',
        'Multi-canal (WhatsApp, Email)'
      ]
    },
    {
      id: 'atendimento',
      nome: 'Atendimento',
      descricao: 'Responde leads com IA usando análise de sentimento',
      icon: <MessageCircle className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      status: 'Ativo',
      metricas: {
        conversas: 34,
        respondidas: 31,
        qualificadas: 18,
        taxa_resposta: '91%'
      },
      funcionalidades: [
        'Respostas contextualizadas com IA',
        'Detecção de intenção',
        'Qualificação automática',
        'Escalação para humanos'
      ]
    },
    {
      id: 'sentimento',
      nome: 'Sentimento',
      descricao: 'Classifica sentimento e detecta descadastro (LGPD)',
      icon: <Heart className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-500',
      status: 'Ativo',
      metricas: {
        analises: 156,
        positivo: 89,
        neutro: 52,
        negativo: 15
      },
      funcionalidades: [
        'Análise de sentimento em tempo real',
        'Detecção de palavras-chave LGPD',
        'Classificação de urgência',
        'Alertas automáticos'
      ]
    },
    {
      id: 'agendamento',
      nome: 'Agendamento',
      descricao: 'Marca reuniões verificando disponibilidade em tempo real',
      icon: <Calendar className="w-8 h-8" />,
      color: 'from-indigo-500 to-blue-500',
      status: 'Ativo',
      metricas: {
        agendadas: 12,
        confirmadas: 10,
        pendentes: 2,
        taxa_confirmacao: '83%'
      },
      funcionalidades: [
        'Integração com Google Calendar',
        'Verificação de disponibilidade',
        'Envio de convites automático',
        'Lembretes inteligentes'
      ]
    },
    {
      id: 'relatorios',
      nome: 'Relatórios',
      descricao: 'Gera dashboards e métricas de conversão do funil',
      icon: <FileText className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      status: 'Ativo',
      metricas: {
        relatorios: 5,
        metricas: 24,
        insights: 8,
        alertas: 3
      },
      funcionalidades: [
        'Dashboards em tempo real',
        'Análise de funil de conversão',
        'Insights automáticos',
        'Exportação de dados'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Agentes de Prospecção
        </h2>
        <p className="text-slate-600">
          7 agentes especializados trabalhando 24/7 para automatizar sua prospecção B2B
        </p>
      </div>

      {/* Status Geral */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Todos os Agentes Operacionais
              </h3>
              <p className="text-sm text-slate-600">
                Sistema funcionando normalmente • Última verificação: há 2 minutos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-green-700">Online</span>
          </div>
        </div>
      </motion.div>

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agentes.map((agente, index) => (
          <motion.div
            key={agente.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            {/* Header do Card */}
            <div className={`bg-gradient-to-r ${agente.color} p-6 text-white`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    {agente.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{agente.nome}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm text-white/90">{agente.status}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-white/90 text-sm">{agente.descricao}</p>
            </div>

            {/* Métricas */}
            <div className="p-6 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-600 mb-4">Métricas (Últimas 24h)</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(agente.metricas).map(([key, value], idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-slate-800">{value}</div>
                    <div className="text-xs text-slate-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funcionalidades */}
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-600 mb-3">Funcionalidades</h4>
              <ul className="space-y-2">
                {agente.funcionalidades.map((func, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{func}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Última execução: há 5 min</span>
              </div>
              <button className="text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors">
                Ver Detalhes →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl p-6"
      >
        <h4 className="font-semibold text-slate-800 mb-2">
          Como Funcionam os Agentes?
        </h4>
        <p className="text-sm text-slate-600 mb-4">
          Cada agente é uma função Lambda independente que executa tarefas específicas no pipeline de prospecção. 
          Eles se comunicam via EventBridge e trabalham de forma assíncrona para processar leads em escala.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
            Serverless
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
            Auto-scaling
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
            Event-driven
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
            AWS Lambda
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
            Node.js 20
          </span>
        </div>
      </motion.div>
    </div>
  );
}
