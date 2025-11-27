'use client';

/**
 * Nigredo - Detalhes do Lead
 * Exibe informações completas do lead e histórico de webhooks
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  MapPin,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLead } from '@/hooks/use-nigredo';

export default function NigredoLeadDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useLead(params.id);

  // Mock data para demonstração
  const mockData = {
    lead: {
      id: params.id,
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '+5511999999999',
      company: 'Tech Solutions',
      message: 'Gostaria de saber mais sobre os serviços de automação com IA.',
      source: 'website',
      utm_params: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'brand'
      },
      status: 'novo',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    webhook_history: [
      {
        id: '1',
        webhook_url: 'https://api.fibonacci.com/public/nigredo-event',
        status_code: 200,
        attempt_number: 1,
        success: true,
        error_message: null,
        sent_at: '2024-01-15T10:30:05Z'
      },
      {
        id: '2',
        webhook_url: 'https://api.fibonacci.com/public/nigredo-event',
        status_code: 500,
        attempt_number: 1,
        success: false,
        error_message: 'Internal Server Error',
        sent_at: '2024-01-15T10:25:00Z'
      }
    ]
  };

  const displayData = data || mockData;
  const lead = displayData.lead;
  const webhookHistory = displayData.webhook_history;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Erro ao carregar lead. Tente novamente.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-700',
    contato_inicial: 'bg-purple-100 text-purple-700',
    qualificacao: 'bg-yellow-100 text-yellow-700',
    oportunidade: 'bg-green-100 text-green-700',
    perdido: 'bg-red-100 text-red-700'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link 
        href="/nigredo/pipeline"
        className="inline-flex items-center space-x-2 text-slate-600 hover:text-pink-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Pipeline</span>
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {lead.name}
            </h2>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[lead.status]}`}>
                {lead.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-slate-500">
                ID: {lead.id}
              </span>
            </div>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            Editar Lead
          </button>
        </div>

        {/* Informações de Contato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Email</div>
              <div className="font-semibold text-slate-800">{lead.email}</div>
            </div>
          </div>

          {lead.phone && (
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Telefone</div>
                <div className="font-semibold text-slate-800">{lead.phone}</div>
              </div>
            </div>
          )}

          {lead.company && (
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
              <Building className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Empresa</div>
                <div className="font-semibold text-slate-800">{lead.company}</div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Criado em</div>
              <div className="font-semibold text-slate-800">
                {new Date(lead.created_at).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mensagem */}
          {lead.message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">Mensagem</h3>
              <p className="text-slate-600 leading-relaxed">{lead.message}</p>
            </motion.div>
          )}

          {/* Histórico de Webhooks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Histórico de Webhooks
            </h3>
            <div className="space-y-3">
              {webhookHistory.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {webhook.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        Tentativa #{webhook.attempt_number}
                      </span>
                      <span className={`text-sm font-semibold ${webhook.success ? 'text-green-600' : 'text-red-600'}`}>
                        {webhook.status_code || 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {new Date(webhook.sent_at).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-slate-600 truncate">
                      {webhook.webhook_url}
                    </div>
                    {webhook.error_message && (
                      <div className="mt-2 text-sm text-red-600">
                        {webhook.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Origem */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">Origem</h3>
            <div className="space-y-3">
              {lead.source && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Fonte</span>
                  <span className="font-semibold text-slate-800">{lead.source}</span>
                </div>
              )}
              {lead.utm_params?.utm_source && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">UTM Source</span>
                  <span className="font-semibold text-slate-800">{lead.utm_params.utm_source}</span>
                </div>
              )}
              {lead.utm_params?.utm_medium && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">UTM Medium</span>
                  <span className="font-semibold text-slate-800">{lead.utm_params.utm_medium}</span>
                </div>
              )}
              {lead.utm_params?.utm_campaign && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">UTM Campaign</span>
                  <span className="font-semibold text-slate-800">{lead.utm_params.utm_campaign}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Informações Técnicas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Informações Técnicas
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-500 mb-1">IP Address</div>
                <div className="font-mono text-slate-800">{lead.ip_address}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">User Agent</div>
                <div className="font-mono text-xs text-slate-600 break-all">
                  {lead.user_agent}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Última Atualização</div>
                <div className="text-slate-800">
                  {new Date(lead.updated_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
