'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTenantIntegrations, type TenantIntegration } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plug, CheckCircle, XCircle, Clock } from 'lucide-react';

export function IntegrationStatusList() {
  const [integrations, setIntegrations] = useState<TenantIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadIntegrations();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center space-x-2 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'inactive':
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Plug className="h-5 w-5 text-gray-500" />;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrações</CardTitle>
        <CardDescription>
          {integrations.length} integração{integrations.length !== 1 ? 'ões' : ''} configurada{integrations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plug className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma integração configurada</p>
            <p className="text-sm mt-1">Configure integrações para conectar seus sistemas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getStatusIcon(integration.status)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{integration.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(integration.status)} text-white border-none text-xs`}
                      >
                        {getStatusLabel(integration.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(integration.type)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  {integration.last_sync_at ? (
                    <>
                      <p className="font-medium">
                        {new Date(integration.last_sync_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(integration.last_sync_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Nunca sincronizado</p>
                  )}
                  
                  {integration.last_error && (
                    <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                      {integration.last_error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
