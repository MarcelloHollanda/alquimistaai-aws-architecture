/**
 * Página de Integrações do Fibonacci
 * 
 * Lista todas as integrações técnicas do Fibonacci
 */

'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import { 
  Webhook, 
  Database, 
  Mail,
  MessageSquare,
  Calendar,
  Cloud,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useFibonacciIntegrations } from '@/hooks/use-fibonacci';

export default function FibonacciIntegracoesPage() {
  const { data: integrations, isLoading, isError } = useFibonacciIntegrations();

  // Mock data caso a API não retorne dados
  const mockIntegrations = [
    {
      id: 'nigredo-webhook',
      name: 'Nigredo Events',
      type: 'webhook' as const,
      status: 'active' as const,
      description: 'Recebe eventos do núcleo Nigredo via webhook POST /public/nigredo-event',
      endpoint: '/public/nigredo-event',
      method: 'POST',
      lastActivity: '2025-01-15T10:30:00Z',
      icon: Webhook,
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'aurora-db',
      name: 'Aurora PostgreSQL',
      type: 'api' as const,
      status: 'active' as const,
      description: 'Banco de dados principal Aurora Serverless v2 Multi-AZ',
      endpoint: 'aurora-cluster.us-east-1.rds.amazonaws.com',
      method: 'SQL',
      lastActivity: '2025-01-15T10:35:00Z',
      icon: Database,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'eventbridge',
      name: 'AWS EventBridge',
      type: 'event' as const,
      status: 'active' as const,
      description: 'Barramento de eventos para comunicação assíncrona entre núcleos',
      endpoint: 'fibonacci-events',
      method: 'PutEvents',
      lastActivity: '2025-01-15T10:34:00Z',
      icon: Cloud,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'email-service',
      name: 'Amazon SES',
      type: 'api' as const,
      status: 'active' as const,
      description: 'Serviço de envio de e-mails transacionais e notificações',
      endpoint: 'email.us-east-1.amazonaws.com',
      method: 'SendEmail',
      lastActivity: '2025-01-15T09:15:00Z',
      icon: Mail,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business API',
      type: 'webhook' as const,
      status: 'inactive' as const,
      description: 'Integração com WhatsApp para envio de mensagens (em preparação)',
      endpoint: '/webhooks/whatsapp',
      method: 'POST',
      lastActivity: null,
      icon: MessageSquare,
      color: 'from-green-400 to-teal-500'
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      type: 'api' as const,
      status: 'inactive' as const,
      description: 'Sincronização de agendamentos com Google Calendar (planejado)',
      endpoint: 'calendar.googleapis.com',
      method: 'REST',
      lastActivity: null,
      icon: Calendar,
      color: 'from-blue-400 to-cyan-500'
    }
  ];

  const displayIntegrations = integrations && integrations.length > 0 
    ? integrations 
    : mockIntegrations;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </span>
        );
      case 'error':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </span>
        );
      case 'inactive':
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Inativo
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      webhook: { label: 'Webhook', color: 'bg-purple-100 text-purple-700' },
      api: { label: 'API', color: 'bg-blue-100 text-blue-700' },
      event: { label: 'Event', color: 'bg-orange-100 text-orange-700' }
    };
    const badge = badges[type as keyof typeof badges] || badges.api;
    return (
      <span className={`px-2 py-1 ${badge.color} rounded text-xs font-semibold`}>
        {badge.label}
      </span>
    );
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
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
          Integrações
        </h1>
        <p className="text-lg text-slate-600">
          Conexões técnicas do Fibonacci com outros sistemas e serviços
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Total</h3>
            <CheckCircle className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {displayIntegrations.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Integrações configuradas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Ativas</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {displayIntegrations.filter(i => i.status === 'active').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Funcionando normalmente</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Inativas</h3>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-600">
            {displayIntegrations.filter(i => i.status === 'inactive').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Em preparação</p>
        </motion.div>
      </div>

      {/* Integrations List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-slate-600">Carregando integrações...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-semibold mb-2">Erro ao carregar integrações</p>
          <p className="text-red-600 text-sm">Exibindo dados de exemplo</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {displayIntegrations.map((integration, index) => {
          const Icon = 'icon' in integration ? integration.icon : Webhook;
          const color = 'color' in integration ? integration.color : 'from-purple-500 to-pink-500';
          
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{integration.name}</h3>
                      {getTypeBadge(integration.type)}
                      {getStatusBadge(integration.status)}
                    </div>
                    
                    <p className="text-slate-600 mb-4">{integration.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Endpoint</p>
                        <p className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          {'endpoint' in integration ? integration.endpoint : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Método</p>
                        <p className="font-semibold text-slate-800">
                          {'method' in integration ? integration.method : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Última Atividade</p>
                        <p className="font-semibold text-slate-800">
                          {formatLastActivity(integration.last_activity || ('lastActivity' in integration ? integration.lastActivity : null))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Como Adicionar Novas Integrações?
            </h3>
            <p className="text-slate-600 mb-4">
              O Fibonacci foi projetado para ser extensível. Novas integrações podem ser adicionadas 
              através de webhooks, APIs REST ou eventos do EventBridge.
            </p>
            <a
              href="/docs/integrations"
              className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Ver Documentação
              <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
