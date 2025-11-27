'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Integration {
  name: string;
  displayName: string;
  description: string;
  category: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  metadata: any;
  connectedAt: string | null;
  updatedAt: string | null;
}

export function IntegrationsTab() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Verificar se usuário tem permissão (Master ou Admin)
  const canManageIntegrations = user?.role === 'MASTER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadIntegrations();
  }, [user]);

  const loadIntegrations = async () => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/integrations?tenantId=${user.tenantId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar integrações');
      }

      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar integrações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (integrationName: string) => {
    if (!canManageIntegrations) {
      setError('Você não tem permissão para conectar integrações');
      return;
    }

    setActionLoading(integrationName);
    setError(null);

    try {
      // Aqui você implementaria um modal para coletar credenciais
      // Por enquanto, vamos apenas mostrar um alerta
      alert(`Implementar modal de conexão para ${integrationName}`);
      
      // Exemplo de chamada à API:
      // const response = await fetch('/api/integrations/connect', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tenantId: user?.tenantId,
      //     integrationName,
      //     credentials: { /* credenciais coletadas */ }
      //   })
      // });
      
      // await loadIntegrations();
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar integração');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (integrationName: string) => {
    if (!canManageIntegrations) {
      setError('Você não tem permissão para desconectar integrações');
      return;
    }

    if (!confirm(`Deseja realmente desconectar ${integrationName}?`)) {
      return;
    }

    setActionLoading(integrationName);
    setError(null);

    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user?.tenantId,
          integrationName
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao desconectar integração');
      }

      await loadIntegrations();
    } catch (err: any) {
      setError(err.message || 'Erro ao desconectar integração');
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      calendar: '📅',
      video: '🎥',
      messaging: '💬',
      email: '📧',
      payment: '💳',
      crm: '👥'
    };
    return icons[category] || '🔌';
  };

  if (!canManageIntegrations) {
    return (
      <Alert variant="default">
        <p className="font-medium">Acesso restrito</p>
        <p className="text-sm mt-1">
          Apenas usuários Master ou Admin podem gerenciar integrações.
        </p>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrações</h3>
        <p className="text-sm text-gray-500 mt-1">
          Conecte serviços externos para expandir as funcionalidades da plataforma
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <div className="grid gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="border rounded-lg p-4 flex items-start justify-between"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl">
                {getCategoryIcon(integration.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{integration.displayName}</h4>
                  <Badge
                    variant={integration.status === 'CONNECTED' ? 'default' : 'secondary'}
                  >
                    {integration.status === 'CONNECTED' ? 'Conectado' : 'Não conectado'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {integration.description}
                </p>
                {integration.connectedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Conectado em {new Date(integration.connectedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>

            <div>
              {integration.status === 'CONNECTED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(integration.name)}
                  disabled={actionLoading === integration.name}
                >
                  {actionLoading === integration.name ? 'Desconectando...' : 'Desconectar'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect(integration.name)}
                  disabled={actionLoading === integration.name}
                >
                  {actionLoading === integration.name ? 'Conectando...' : 'Conectar'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
