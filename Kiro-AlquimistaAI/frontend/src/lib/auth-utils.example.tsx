/**
 * Exemplos de Uso - Utilitários de Autenticação
 * 
 * Este arquivo contém exemplos de como usar os utilitários de autenticação
 * no Painel Operacional AlquimistaAI
 */

'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { ProtectedRoute, withProtectedRoute } from '@/components/auth/protected-route';
import { extractClaims, hasTenantAccess } from '@/lib/auth-utils';

// ============================================================================
// EXEMPLO 1: Usar hook usePermissions em um componente
// ============================================================================

function DashboardHeader() {
  const {
    displayName,
    userTypeLabel,
    userTypeBadgeColor,
    isInternal,
    canAccessBilling,
  } = usePermissions();

  return (
    <div className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Olá, {displayName}</span>
        
        <span className={`px-2 py-1 rounded text-xs ${userTypeBadgeColor}`}>
          {userTypeLabel}
        </span>
        
        {isInternal && (
          <a href="/app/company" className="text-sm text-blue-600 hover:underline">
            Painel Operacional
          </a>
        )}
        
        {canAccessBilling && (
          <a href="/app/company/billing" className="text-sm text-blue-600 hover:underline">
            Financeiro
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Proteger uma rota inteira com ProtectedRoute
// ============================================================================

function InternalDashboardPage() {
  return (
    <ProtectedRoute 
      requireInternal
      errorMessage="Você não tem permissão para acessar o painel operacional"
    >
      <div>
        <h1>Painel Operacional</h1>
        <p>Conteúdo visível apenas para usuários internos</p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// EXEMPLO 3: Proteger uma rota de admin com ProtectedRoute
// ============================================================================

function BillingOverviewPage() {
  return (
    <ProtectedRoute 
      requireAdmin
      fallbackRoute="/app/company"
      errorMessage="Apenas administradores podem acessar dados financeiros"
    >
      <div>
        <h1>Visão Financeira</h1>
        <p>MRR, ARR e outras métricas financeiras</p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// EXEMPLO 4: Proteger acesso a tenant específico
// ============================================================================

function TenantDetailsPage({ tenantId }: { tenantId: string }) {
  return (
    <ProtectedRoute 
      requireTenantAccess={tenantId}
      errorMessage="Você não tem permissão para acessar este tenant"
    >
      <div>
        <h1>Detalhes do Tenant</h1>
        <p>Informações do tenant {tenantId}</p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// EXEMPLO 5: Usar HOC withProtectedRoute
// ============================================================================

function OperationsConsolePage() {
  return (
    <div>
      <h1>Console de Operações</h1>
      <p>Execute comandos operacionais</p>
    </div>
  );
}

// Exportar versão protegida
export default withProtectedRoute(OperationsConsolePage, {
  requireInternal: true,
  errorMessage: 'Apenas usuários internos podem executar comandos operacionais',
});

// ============================================================================
// EXEMPLO 6: Renderização condicional baseada em permissões
// ============================================================================

function NavigationMenu() {
  const {
    isInternal,
    isAdmin,
    canAccessBilling,
    canExecuteOperationalCommands,
  } = usePermissions();

  return (
    <nav>
      <ul>
        <li><a href="/app/dashboard">Dashboard</a></li>
        
        {isInternal && (
          <>
            <li><a href="/app/company">Painel Operacional</a></li>
            <li><a href="/app/company/tenants">Tenants</a></li>
            <li><a href="/app/company/agents">Agentes</a></li>
          </>
        )}
        
        {canAccessBilling && (
          <li><a href="/app/company/billing">Financeiro</a></li>
        )}
        
        {canExecuteOperationalCommands && (
          <li><a href="/app/company/operations">Operações</a></li>
        )}
      </ul>
    </nav>
  );
}

// ============================================================================
// EXEMPLO 7: Verificar acesso a tenant em uma lista
// ============================================================================

function TenantsList({ tenants }: { tenants: Array<{ id: string; name: string }> }) {
  const { hasTenantAccess } = usePermissions();

  return (
    <ul>
      {tenants.map(tenant => (
        <li key={tenant.id}>
          <span>{tenant.name}</span>
          
          {hasTenantAccess(tenant.id) && (
            <a href={`/app/company/tenants/${tenant.id}`}>
              Ver detalhes
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

// ============================================================================
// EXEMPLO 8: Extrair claims manualmente (uso avançado)
// ============================================================================

async function makeAuthenticatedRequest(endpoint: string) {
  // Buscar token dos cookies
  const cookies = document.cookie.split(';');
  const idTokenCookie = cookies.find(c => c.trim().startsWith('idToken='));
  
  if (!idTokenCookie) {
    throw new Error('Não autenticado');
  }

  const idToken = idTokenCookie.split('=')[1];
  const claims = extractClaims(idToken);

  // Verificar permissão antes de fazer requisição
  if (endpoint.startsWith('/internal/') && !claims.isInternal) {
    throw new Error('Sem permissão para acessar endpoint interno');
  }

  // Fazer requisição com token
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  return response.json();
}

// ============================================================================
// EXEMPLO 9: Validar acesso a tenant em API route
// ============================================================================

function TenantDataComponent({ tenantId }: { tenantId: string }) {
  const { hasTenantAccess, claims } = usePermissions();

  const fetchTenantData = async () => {
    // Verificar permissão antes de fazer requisição
    if (!hasTenantAccess(tenantId)) {
      throw new Error('Sem permissão para acessar dados deste tenant');
    }

    // Fazer requisição
    const response = await fetch(`/api/tenant/${tenantId}`, {
      headers: {
        'X-Tenant-Id': claims?.tenantId || '',
      },
    });

    return response.json();
  };

  // ... resto do componente
  return null;
}

// ============================================================================
// EXEMPLO 10: Botão condicional baseado em permissões
// ============================================================================

function ActionButtons({ tenantId }: { tenantId: string }) {
  const {
    isInternal,
    isAdmin,
    canExecuteOperationalCommands,
    hasTenantAccess,
  } = usePermissions();

  return (
    <div className="flex gap-2">
      {hasTenantAccess(tenantId) && (
        <button>Ver Detalhes</button>
      )}
      
      {isInternal && (
        <button>Editar Configurações</button>
      )}
      
      {canExecuteOperationalCommands && (
        <button>Executar Comando</button>
      )}
      
      {isAdmin && (
        <button className="text-red-600">Suspender Tenant</button>
      )}
    </div>
  );
}
