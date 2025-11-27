'use client';

export const dynamic = 'force-dynamic';

/**
 * Nigredo - Painel Principal
 * Dashboard com métricas e status do pipeline de prospecção
 */

import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useDashboardStats, usePipelineMetrics } from '@/hooks/use-nigredo';

export default function NigredoPainelPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: metrics, isLoading: metricsLoading } = usePipelineMetrics();

  // Mock data enquanto API não está disponível
  const mockStats = {
    total_leads: 1247,
    new_leads: 89,
    qualified_leads: 456,
    active_conversations: 34,
    scheduled_meetings: 12,
  };

  const mockMetrics = {
    conversion_rate: 36.5,
    response_rate: 78.2,
    meeting_rate: 24.8,
    avg_response_time: 2.4,
  };

  const displayStats = stats || mockStats;
  const displayMetrics = metrics || mockMetrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Painel de Prospecção
        </h2>
        <p className="text-slate-600">
          Visão geral do desempenho dos seus agentes de prospecção B2B
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          {
            label: 'Total de Leads',
            value: displayStats.total_leads,
            icon: <Users className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-500',
            change: '+12%'
          },
          {
            label: 'Novos Leads',
            value: displayStats.new_leads,
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-500',
            change: '+8%'
          },
          {
            label: 'Qualificados',
            value: displayStats.qualified_leads,
            icon: <CheckCircle className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-500',
            change: '+15%'
          },
          {
            label: 'Conversas Ativas',
            value: displayStats.active_conversations,
            icon: <MessageSquare className="w-6 h-6" />,
            color: 'from-orange-500 to-red-500',
            change: '+5%'
          },
          {
            label: 'Reuniões Agendadas',
            value: displayStats.scheduled_meetings,
            icon: <Calendar className="w-6 h-6" />,
            color: 'from-pink-500 to-rose-500',
            change: '+20%'
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
              <span className="text-sm font-semibold text-green-600">{stat.change}</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Taxa de Conversão',
            value: `${displayMetrics.conversion_rate}%`,
            icon: <Activity className="w-5 h-5" />,
            description: 'Leads que viraram oportunidades'
          },
          {
            label: 'Taxa de Resposta',
            value: `${displayMetrics.response_rate}%`,
            icon: <MessageSquare className="w-5 h-5" />,
            description: 'Leads que responderam'
          },
          {
            label: 'Taxa de Agendamento',
            value: `${displayMetrics.meeting_rate}%`,
            icon: <Calendar className="w-5 h-5" />,
            description: 'Conversas que viraram reuniões'
          },
          {
            label: 'Tempo Médio de Resposta',
            value: `${displayMetrics.avg_response_time}h`,
            icon: <Clock className="w-5 h-5" />,
            description: 'Tempo até primeira resposta'
          },
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border-2 border-slate-200 hover:border-pink-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-pink-600">{metric.icon}</div>
              <div className="text-sm font-semibold text-slate-600">{metric.label}</div>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {metric.value}
            </div>
            <div className="text-xs text-slate-500">{metric.description}</div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.9 }}
        className="bg-white rounded-xl p-6 shadow-lg mb-8"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-6">Status do Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { stage: 'Novo', count: 89, color: 'bg-blue-500' },
            { stage: 'Contato Inicial', count: 156, color: 'bg-purple-500' },
            { stage: 'Qualificação', count: 234, color: 'bg-pink-500' },
            { stage: 'Oportunidade', count: 67, color: 'bg-green-500' },
          ].map((stage, index) => (
            <div key={index} className="text-center">
              <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                <div className="text-3xl font-bold">{stage.count}</div>
              </div>
              <div className="text-sm font-semibold text-slate-600">{stage.stage}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Agentes Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.1 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-6">Status dos Agentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Recebimento', status: 'Ativo', leads: 89 },
            { name: 'Estratégia', status: 'Ativo', campaigns: 12 },
            { name: 'Disparo', status: 'Ativo', messages: 234 },
            { name: 'Atendimento', status: 'Ativo', conversations: 34 },
            { name: 'Sentimento', status: 'Ativo', analyses: 156 },
            { name: 'Agendamento', status: 'Ativo', meetings: 12 },
            { name: 'Relatórios', status: 'Ativo', reports: 5 },
          ].map((agent, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="font-semibold text-slate-800 text-sm">{agent.name}</div>
                <div className="text-xs text-slate-500">{agent.status}</div>
              </div>
              <div className="text-sm font-bold text-slate-600">
                {Object.values(agent).find((v) => typeof v === 'number')}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.3 }}
        className="mt-8 bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">
              Dados de Demonstração
            </h4>
            <p className="text-sm text-slate-600">
              Os dados exibidos nesta página são simulados para fins de demonstração. 
              Conecte sua API do Nigredo para visualizar dados reais do seu pipeline de prospecção.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
