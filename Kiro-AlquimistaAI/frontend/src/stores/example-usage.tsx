/**
 * Exemplos de Uso dos Stores - Painel Operacional AlquimistaAI
 * 
 * Este arquivo contém exemplos práticos de como usar os stores
 * tenant-store e company-store em componentes React.
 */

import { useEffect, useState } from 'react';
import { useTenantStore } from './tenant-store';
import { useCompanyStore } from './company-store';
import { useAuthStore } from './auth-store';

// ============================================================================
// EXEMPLO 1: Dashboard do Cliente - Visão Geral
// ============================================================================

export function TenantDashboardExample() {
  const {
    tenantInfo,
    agents,
    usageData,
    isLoadingInfo,
    isLoadingAgents,
    isLoadingUsage,
    fetchTenantInfo,
    fetchAgents,
    fetchUsage,
  } = useTenantStore();

  useEffect(() => {
    // Carregar dados ao montar o componente
    fetchTenantInfo();
    fetchAgents('active');
    fetchUsage('30d');
  }, []);

  if (isLoadingInfo || isLoadingAgents || isLoadingUsage) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1>Dashboard - {tenantInfo?.name}</h1>
      
      <div className="metrics">
        <div>Agentes Ativos: {agents.length}</div>
        <div>Requisições (30d): {usageData?.summary.total_requests}</div>
        <div>Taxa de Sucesso: {usageData?.summary.success_rate}%</div>
      </div>
      
      <div className="agents-list">
        {agents.map(agent => (
          <div key={agent.id}>
            {agent.name} - {agent.status}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Refresh Manual de Dados
// ============================================================================

export function RefreshDataExample() {
  const {
    tenantInfo,
    isLoadingInfo,
    fetchTenantInfo,
    invalidateCache,
  } = useTenantStore();

  const handleRefresh = async () => {
    try {
      // Opção 1: Forçar refresh ignorando cache
      await fetchTenantInfo(true);
      
      // Opção 2: Invalidar cache e buscar novamente
      // invalidateCache('tenantInfo');
      // await fetchTenantInfo();
      
      console.log('Dados atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  return (
    <div>
      <h2>{tenantInfo?.name}</h2>
      <button onClick={handleRefresh} disabled={isLoadingInfo}>
        {isLoadingInfo ? 'Atualizando...' : 'Atualizar Dados'}
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLO 3: Painel Operacional - Lista de Tenants com Filtros
// ============================================================================

export function TenantsListExample() {
  const {
    tenants,
    totalTenants,
    tenantsFilters,
    isLoadingTenants,
    fetchTenants,
    setTenantsFilters,
  } = useCompanyStore();

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setTenantsFilters(newFilters);
    fetchTenants(newFilters);
  };

  const handleSearch = (search: string) => {
    handleFilterChange({ search, offset: 0 });
  };

  const handleStatusFilter = (status: 'active' | 'inactive' | 'all') => {
    handleFilterChange({ status, offset: 0 });
  };

  const handleNextPage = () => {
    const newOffset = tenantsFilters.offset + tenantsFilters.limit;
    fetchTenants({ offset: newOffset });
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, tenantsFilters.offset - tenantsFilters.limit);
    fetchTenants({ offset: newOffset });
  };

  return (
    <div>
      <h1>Tenants ({totalTenants})</h1>
      
      {/* Filtros */}
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ"
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        <select
          value={tenantsFilters.status}
          onChange={(e) => handleStatusFilter(e.target.value as any)}
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="suspended">Suspensos</option>
        </select>
      </div>
      
      {/* Lista */}
      {isLoadingTenants ? (
        <div>Carregando...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Segmento</th>
              <th>Plano</th>
              <th>Status</th>
              <th>MRR</th>
              <th>Agentes</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant.id}>
                <td>{tenant.name}</td>
                <td>{tenant.segment}</td>
                <td>{tenant.plan}</td>
                <td>{tenant.status}</td>
                <td>R$ {tenant.mrr_estimate}</td>
                <td>{tenant.active_agents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Paginação */}
      <div className="pagination">
        <button
          onClick={handlePrevPage}
          disabled={tenantsFilters.offset === 0}
        >
          Anterior
        </button>
        
        <span>
          Página {Math.floor(tenantsFilters.offset / tenantsFilters.limit) + 1}
        </span>
        
        <button
          onClick={handleNextPage}
          disabled={tenantsFilters.offset + tenantsFilters.limit >= totalTenants}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: Detalhes de Tenant
// ============================================================================

export function TenantDetailExample({ tenantId }: { tenantId: string }) {
  const {
    selectedTenant,
    selectedTenantAgents,
    isLoadingTenantDetail,
    isLoadingTenantAgents,
    fetchTenantDetail,
    fetchTenantAgents,
  } = useCompanyStore();

  useEffect(() => {
    fetchTenantDetail(tenantId);
    fetchTenantAgents(tenantId);
  }, [tenantId]);

  if (isLoadingTenantDetail || isLoadingTenantAgents) {
    return <div>Carregando...</div>;
  }

  if (!selectedTenant) {
    return <div>Tenant não encontrado</div>;
  }

  return (
    <div>
      <h1>{selectedTenant.tenant.name}</h1>
      
      <section>
        <h2>Informações</h2>
        <p>CNPJ: {selectedTenant.tenant.cnpj}</p>
        <p>Segmento: {selectedTenant.tenant.segment}</p>
        <p>Plano: {selectedTenant.tenant.plan}</p>
        <p>Status: {selectedTenant.tenant.status}</p>
        <p>MRR: R$ {selectedTenant.tenant.mrr_estimate}</p>
      </section>
      
      <section>
        <h2>Usuários ({selectedTenant.users.length})</h2>
        {selectedTenant.users.map(user => (
          <div key={user.id}>
            {user.full_name} - {user.email} ({user.role})
          </div>
        ))}
      </section>
      
      <section>
        <h2>Agentes ({selectedTenantAgents.length})</h2>
        {selectedTenantAgents.map(agent => (
          <div key={agent.id}>
            {agent.name} - {agent.status}
            <div>Requisições: {agent.usage_stats.total_requests}</div>
            <div>Taxa de Sucesso: {agent.usage_stats.success_rate}%</div>
          </div>
        ))}
      </section>
      
      <section>
        <h2>Uso (30 dias)</h2>
        <p>Requisições: {selectedTenant.usage_summary.requests_last_30_days}</p>
        <p>Taxa de Sucesso: {selectedTenant.usage_summary.success_rate_last_30_days}%</p>
      </section>
    </div>
  );
}

// ============================================================================
// EXEMPLO 5: Visão Geral Operacional
// ============================================================================

export function OperationalOverviewExample() {
  const {
    usageOverview,
    billingOverview,
    isLoadingUsageOverview,
    isLoadingBillingOverview,
    fetchUsageOverview,
    fetchBillingOverview,
  } = useCompanyStore();

  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchUsageOverview(period);
    fetchBillingOverview(period);
  }, [period]);

  if (isLoadingUsageOverview || isLoadingBillingOverview) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1>Painel Operacional AlquimistaAI</h1>
      
      {/* Seletor de período */}
      <select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
        <option value="7d">7 dias</option>
        <option value="30d">30 dias</option>
        <option value="90d">90 dias</option>
      </select>
      
      {/* KPIs Globais */}
      <div className="kpis">
        <div>Tenants Ativos: {usageOverview?.global_stats.active_tenants}</div>
        <div>Agentes Deployados: {usageOverview?.global_stats.total_agents_deployed}</div>
        <div>Requisições: {usageOverview?.global_stats.total_requests}</div>
        <div>Taxa de Sucesso: {usageOverview?.global_stats.global_success_rate}%</div>
        <div>MRR Total: R$ {billingOverview?.financial_summary.total_mrr}</div>
      </div>
      
      {/* Top Tenants */}
      <section>
        <h2>Top Tenants por Uso</h2>
        {usageOverview?.top_tenants_by_usage.map(tenant => (
          <div key={tenant.tenant_id}>
            {tenant.tenant_name} - {tenant.total_requests} requisições
          </div>
        ))}
      </section>
      
      {/* Top Agentes */}
      <section>
        <h2>Top Agentes</h2>
        {usageOverview?.top_agents_by_usage.map(agent => (
          <div key={agent.agent_id}>
            {agent.agent_name} - {agent.total_requests} requisições
            ({agent.deployed_count} deployments)
          </div>
        ))}
      </section>
    </div>
  );
}

// ============================================================================
// EXEMPLO 6: Console de Operações - Criar Comando
// ============================================================================

export function OperationsConsoleExample() {
  const {
    commands,
    isLoadingCommands,
    isCreatingCommand,
    fetchCommands,
    createCommand,
  } = useCompanyStore();

  const [commandType, setCommandType] = useState('HEALTH_CHECK');
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    fetchCommands();
    
    // Polling para atualizar status dos comandos
    const interval = setInterval(() => {
      fetchCommands({ status: 'PENDING' });
      fetchCommands({ status: 'RUNNING' });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCreateCommand = async () => {
    try {
      await createCommand({
        command_type: commandType as any,
        tenant_id: tenantId || undefined,
        parameters: {}
      });
      
      alert('Comando criado com sucesso!');
      
      // Atualizar lista de comandos
      fetchCommands(undefined, true);
    } catch (error) {
      alert('Erro ao criar comando');
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Console de Operações</h1>
      
      {/* Formulário de Comando */}
      <section>
        <h2>Executar Comando</h2>
        
        <select
          value={commandType}
          onChange={(e) => setCommandType(e.target.value)}
        >
          <option value="HEALTH_CHECK">Health Check</option>
          <option value="RESTART_AGENT">Restart Agent</option>
          <option value="RESET_TOKEN">Reset Token</option>
          <option value="REPROCESS_QUEUE">Reprocess Queue</option>
        </select>
        
        <input
          type="text"
          placeholder="Tenant ID (opcional)"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        
        <button
          onClick={handleCreateCommand}
          disabled={isCreatingCommand}
        >
          {isCreatingCommand ? 'Criando...' : 'Executar Comando'}
        </button>
      </section>
      
      {/* Histórico de Comandos */}
      <section>
        <h2>Histórico de Comandos</h2>
        
        {isLoadingCommands ? (
          <div>Carregando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Status</th>
                <th>Tenant</th>
                <th>Criado em</th>
                <th>Completado em</th>
              </tr>
            </thead>
            <tbody>
              {commands.map(command => (
                <tr key={command.command_id}>
                  <td>{command.command_type}</td>
                  <td>{command.status}</td>
                  <td>{command.tenant_name || '-'}</td>
                  <td>{new Date(command.created_at).toLocaleString()}</td>
                  <td>
                    {command.completed_at
                      ? new Date(command.completed_at).toLocaleString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// EXEMPLO 7: Logout e Reset de Stores
// ============================================================================

export function LogoutExample() {
  const { logout } = useAuthStore();
  const { reset: resetTenant } = useTenantStore();
  const { reset: resetCompany } = useCompanyStore();

  const handleLogout = () => {
    // Limpar autenticação
    logout();
    
    // Limpar dados dos stores
    resetTenant();
    resetCompany();
    
    // Redirecionar para login
    window.location.href = '/login';
  };

  return (
    <button onClick={handleLogout}>
      Sair
    </button>
  );
}

// ============================================================================
// EXEMPLO 8: Uso com Seletores Específicos (Performance)
// ============================================================================

export function OptimizedComponentExample() {
  // ❌ Ruim - Re-render em qualquer mudança do store
  // const store = useTenantStore();
  
  // ✅ Bom - Re-render apenas quando tenantInfo muda
  const tenantInfo = useTenantStore(state => state.tenantInfo);
  const isLoadingInfo = useTenantStore(state => state.isLoadingInfo);
  const fetchTenantInfo = useTenantStore(state => state.fetchTenantInfo);

  useEffect(() => {
    fetchTenantInfo();
  }, [fetchTenantInfo]);

  return (
    <div>
      {isLoadingInfo ? (
        <div>Carregando...</div>
      ) : (
        <h1>{tenantInfo?.name}</h1>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLO 9: Invalidação de Cache Após Mutação
// ============================================================================

export function UpdateTenantExample() {
  const {
    tenantInfo,
    fetchTenantInfo,
    invalidateCache,
  } = useTenantStore();

  const handleUpdateTenant = async (data: any) => {
    try {
      // Atualizar tenant via API
      await fetch('/api/tenant/me', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      // Invalidar cache e buscar dados atualizados
      invalidateCache('tenantInfo');
      await fetchTenantInfo(true);
      
      alert('Tenant atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar tenant');
    }
  };

  return (
    <div>
      <h1>{tenantInfo?.name}</h1>
      <button onClick={() => handleUpdateTenant({ name: 'Novo Nome' })}>
        Atualizar Nome
      </button>
    </div>
  );
}
