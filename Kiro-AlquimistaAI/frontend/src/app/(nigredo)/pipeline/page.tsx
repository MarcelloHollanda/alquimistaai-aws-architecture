'use client';

export const dynamic = 'force-dynamic';

/**
 * Nigredo - Pipeline de Leads
 * Listagem de leads com filtros e paginação
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Download,
  Mail,
  Phone,
  Building,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useLeads } from '@/hooks/use-nigredo';

export default function NigredoPipelinePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const { data, isLoading, error } = useLeads({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
  });

  // Mock data para demonstração
  const mockLeads = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '+5511999999999',
      company: 'Tech Solutions',
      status: 'novo',
      source: 'website',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@startup.com',
      phone: '+5511988888888',
      company: 'Startup Inovadora',
      status: 'contato_inicial',
      source: 'google',
      created_at: '2024-01-15T09:15:00Z'
    },
    // Adicionar mais leads mock...
  ];

  const leads = data?.leads || mockLeads;
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 50,
    total_pages: 3,
    has_next: true,
    has_prev: false
  };

  const statusColors: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-700',
    contato_inicial: 'bg-purple-100 text-purple-700',
    qualificacao: 'bg-yellow-100 text-yellow-700',
    oportunidade: 'bg-green-100 text-green-700',
    perdido: 'bg-red-100 text-red-700'
  };

  const statusLabels: Record<string, string> = {
    novo: 'Novo',
    contato_inicial: 'Contato Inicial',
    qualificacao: 'Qualificação',
    oportunidade: 'Oportunidade',
    perdido: 'Perdido'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Pipeline de Leads
        </h2>
        <p className="text-slate-600">
          Gerencie e acompanhe todos os leads do seu funil de prospecção
        </p>
      </div>

      {/* Filtros e Busca */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Nome, email ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Filtro de Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
            >
              <option value="">Todos</option>
              <option value="novo">Novo</option>
              <option value="contato_inicial">Contato Inicial</option>
              <option value="qualificacao">Qualificação</option>
              <option value="oportunidade">Oportunidade</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          {/* Filtro de Fonte */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fonte
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
            >
              <option value="">Todas</option>
              <option value="website">Website</option>
              <option value="google">Google</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indicacao">Indicação</option>
            </select>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            {pagination.total} leads encontrados
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-semibold text-slate-700">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </motion.div>

      {/* Lista de Leads */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Erro ao carregar leads. Tente novamente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/nigredo/pipeline/${lead.id}`}>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
                          {lead.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[lead.status]}`}>
                          {statusLabels[lead.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.company && (
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span>{lead.company}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {lead.source && (
                          <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">
                            {lead.source}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                        <ArrowRight className="w-5 h-5 text-pink-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-between"
        >
          <div className="text-sm text-slate-600">
            Página {pagination.page} de {pagination.total_pages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.has_prev}
              className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg font-semibold text-slate-700 hover:border-pink-500 hover:text-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.has_next}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Próxima
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
