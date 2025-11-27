/**
 * Exemplos de Uso dos Clientes HTTP
 * Painel Operacional AlquimistaAI
 * 
 * Este arquivo contém exemplos práticos de como usar os clientes HTTP
 * em componentes React.
 */

'use client';

import { useState, useEffect } from 'react';
import { tenantClient, TenantApiError, type TenantInfo, type TenantAgent } from './tenant-client';
import { internalClient, InternalApiError, type TenantListItem, type UsageOverview } from './internal-client';

// ============================================================================
// EXEMPLO 1: Dashboard do Cliente - Buscar informações do tenant
// ============================================================================

export function TenantDashboardExample() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantInfo() {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar informações do tenant
        const info = await tenantClient.getTenantMe();
        setTenantInfo(info);
      } catch (err) {
        if (err instanceof TenantApiError) {
          setError(err.message);
          
          // Tratar erros específicos
          if (err.code === 'UNAUTHORIZED') {
            // Redirecionar para login
            window.location.href = '/login';
          }
        } else {
          setError('Erro desconhecido');
        }
      } finally {
        setLoading(false);
      }
    }

    loadTenantInfo();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!tenantInfo) return null;

  return (
    <div>
      <h1>{tenantInfo.name}</h1>
      <p>Plano: {tenantInfo.plan}</p>
      <p>Agentes Ativos: {tenantInfo.usage.active_agents}</p>
      <p>Requisições este mês: {tenantInfo.usage.requests_this_month}</p>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Dashboard do Cliente - Listar agentes
// ============================================================================

export function TenantAgentsExample() {
  const [agents, setAgents] = useState<TenantAgent[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const [loading, setLoading] = useState(false);

  async function loadAgents() {
    try {
      setLoading(true);
      const agentsList = await tenantClient.getTenantAgents(status);
      setAgents(agentsList);
    } catch (err) {
      if (err instanceof TenantApiError) {
        console.error('Erro ao carregar agentes:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, [status]);

  return (
    <div>
      <h2>Meus Agentes</h2>
      
      {/* Filtro de status */}
      <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
        <option value="all">Todos</option>
      </select>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <ul>
          {agents.map((agent) => (
            <li key={agent.id}>
              <strong>{agent.name}</strong> - {agent.segment}
              <br />
              Requisições (30d): {agent.usage_last_30_days.total_requests}
              <br />
              Taxa de sucesso: {agent.usage_last_30_days.success_rate}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLO 3: Dashboard do Cliente - Métricas de uso
// ============================================================================

export function TenantUsageExample() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    async function loadUsage() {
      try {
        const usageData = await tenantClient.getTenantUsage(period);
        setUsage(usageData);
      } catch (err) {
        console.error('Erro ao carregar uso:', err);
      }
    }

    loadUsage();
  }, [period]);

  if (!usage) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Uso da Plataforma</h2>
      
      {/* Seletor de período */}
      <select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
        <option value="90d">Últimos 90 dias</option>
      </select>

      {/* Resumo */}
      <div>
        <h3>Resumo</h3>
        <p>Total de requisições: {usage.summary.total_requests}</p>
        <p>Taxa de sucesso: {usage.summary.success_rate}%</p>
        <p>Tempo médio de resposta: {usage.summary.avg_response_time_ms}ms</p>
      </div>

      {/* Gráfico de tendência diária */}
      <div>
        <h3>Tendência Diária</h3>
        {usage.daily_data.map((day: any) => (
          <div key={day.date}>
            {day.date}: {day.total_requests} requisições
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: Painel Interno - Listar todos os tenants
// ============================================================================

export function InternalTenantsListExample() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const limit = 50;

  async function loadTenants() {
    try {
      setLoading(true);
      const response = await internalClient.listTenants({
        status: 'active',
        search: search || undefined,
        limit,
        offset: page * limit,
        sort_by: 'name',
        sort_order: 'asc',
      });
      
      setTenants(response.tenants);
      setTotal(response.total);
    } catch (err) {
      if (err instanceof InternalApiError) {
        console.error('Erro ao carregar tenants:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, [page, search]);

  return (
    <div>
      <h2>Todos os Tenants</h2>
      
      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar por nome ou CNPJ"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Lista */}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Segmento</th>
                <th>Plano</th>
                <th>MRR</th>
                <th>Agentes</th>
                <th>Requisições (30d)</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.segment}</td>
                  <td>{tenant.plan}</td>
                  <td>R$ {tenant.mrr_estimate.toFixed(2)}</td>
                  <td>{tenant.active_agents}</td>
                  <td>{tenant.requests_last_30_days}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Anterior
            </button>
            <span>Página {page + 1} de {Math.ceil(total / limit)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}>
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLO 5: Painel Interno - Visão global de uso
// ============================================================================

export function InternalUsageOverviewExample() {
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await internalClient.getUsageOverview(period);
        setOverview(data);
      } catch (err) {
        console.error('Erro ao carregar visão geral:', err);
      }
    }

    loadOverview();
  }, [period]);

  if (!overview) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Visão Global de Uso</h2>
      
      {/* Seletor de período */}
      <select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
        <option value="90d">Últimos 90 dias</option>
      </select>

      {/* KPIs Globais */}
      <div>
        <h3>Estatísticas Globais</h3>
        <p>Total de tenants: {overview.global_stats.total_tenants}</p>
        <p>Tenants ativos: {overview.global_stats.active_tenants}</p>
        <p>Agentes deployados: {overview.global_stats.total_agents_deployed}</p>
        <p>Total de requisições: {overview.global_stats.total_requests}</p>
        <p>Taxa de sucesso global: {overview.global_stats.global_success_rate}%</p>
      </div>

      {/* Top Tenants */}
      <div>
        <h3>Top Tenants por Uso</h3>
        <ul>
          {overview.top_tenants_by_usage.map((tenant) => (
            <li key={tenant.tenant_id}>
              {tenant.tenant_name}: {tenant.total_requests} requisições
            </li>
          ))}
        </ul>
      </div>

      {/* Top Agentes */}
      <div>
        <h3>Top Agentes por Uso</h3>
        <ul>
          {overview.top_agents_by_usage.map((agent) => (
            <li key={agent.agent_id}>
              {agent.agent_name}: {agent.total_requests} requisições 
              ({agent.deployed_count} deployments)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 6: Painel Interno - Criar comando operacional
// ============================================================================

export function InternalCreateCommandExample() {
  const [commandType, setCommandType] = useState<'HEALTH_CHECK' | 'RESTART_AGENT'>('HEALTH_CHECK');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleCreateCommand() {
    try {
      setLoading(true);
      setResult(null);

      const response = await internalClient.createOperationalCommand({
        command_type: commandType,
        tenant_id: tenantId || undefined,
        parameters: {
          // Parâmetros específicos do comando
          check_type: 'full',
        },
      });

      setResult(`Comando criado com sucesso! ID: ${response.command_id}`);
    } catch (err) {
      if (err instanceof InternalApiError) {
        setResult(`Erro: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Criar Comando Operacional</h2>
      
      <div>
        <label>
          Tipo de Comando:
          <select value={commandType} onChange={(e) => setCommandType(e.target.value as any)}>
            <option value="HEALTH_CHECK">Health Check</option>
            <option value="RESTART_AGENT">Restart Agent</option>
            <option value="RESET_TOKEN">Reset Token</option>
            <option value="REPROCESS_QUEUE">Reprocess Queue</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Tenant ID (opcional):
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="UUID do tenant"
          />
        </label>
      </div>

      <button onClick={handleCreateCommand} disabled={loading}>
        {loading ? 'Criando...' : 'Criar Comando'}
      </button>

      {result && <div>{result}</div>}
    </div>
  );
}

// ============================================================================
// EXEMPLO 7: Hook customizado para tenant info
// ============================================================================

export function useTenantInfo() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<TenantApiError | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const info = await tenantClient.getTenantMe();
        setTenantInfo(info);
        setError(null);
      } catch (err) {
        if (err instanceof TenantApiError) {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { tenantInfo, loading, error };
}

// Uso do hook:
// const { tenantInfo, loading, error } = useTenantInfo();
