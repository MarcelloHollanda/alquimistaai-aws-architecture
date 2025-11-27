'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTenantIntegrations, type TenantIntegration } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plug, CheckCircle, XCircle, Clock, RefreshCw, TestTube } from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<TenantIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      setLoading(true);
      const data = await getTenantIntegrations();
      setIntegrations(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar integrações:', err);
      setError(err.message || 'Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'inactive':
        return <Clock className="h-6 w-6 text-gray-500" />;
      default:
        return <Plug className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'error':
        return 'Erro';
      case 'inactive':
        return 'Inativa';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: 'E-mail',
      whatsapp: 'WhatsApp',
      crm: 'CRM',
      calendar: 'Calendário',
    };
    return labels[type] || type;
  };

  const handleTest = (integrationId: string) => {
    console.log('Testar integração:', integrationId);
    // TODO: Implementar teste de integração
  };

  const handleReconnect = (integrationId: string) => {
    console.log('Reconectar integração:', integrationId);
    // TODO: Implementar reconexão
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas integrações com sistemas externos
          </p>
        </div>
        <Button onClick={loadIntegrations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Configure integrações para conectar seus sistemas e potencializar suas automações.
            </p>
            <Button>
              <Plug className="h-4 w-4 mr-2" />
              Adicionar Integração
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Integrações
                </CardTitle>
                <Plug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Configuradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Integrações Ativas
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Funcionando normalmente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Com Erro
                </CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {integrations.filter(i => i.status === 'error').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Integrações */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getStatusIcon(integration.status)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{getTypeLabel(integration.type)}</CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(integration.status)} text-white border-none`}
                    >
                      {getStatusLabel(integration.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última Sincronização:</span>
                      <span className="font-medium">
                        {integration.last_sync_at 
                          ? new Date(integration.last_sync_at).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </span>
                    </div>
                    {integration.last_sync_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horário:</span>
                        <span className="font-medium">
                          {new Date(integration.last_sync_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {integration.last_error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-600 font-medium mb-1">Último Erro:</p>
                      <p className="text-xs text-red-700">{integration.last_error}</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleTest(integration.id)}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Testar
                    </Button>
                    {integration.status === 'error' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleReconnect(integration.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reconectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
