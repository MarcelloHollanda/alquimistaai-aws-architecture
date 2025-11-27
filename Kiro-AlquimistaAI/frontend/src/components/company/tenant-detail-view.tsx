'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Bot, Plug, Activity, AlertCircle, Edit } from 'lucide-react';
import type { TenantDetail } from '@/lib/api/internal-client';

interface TenantDetailViewProps {
  tenant: TenantDetail;
}

export function TenantDetailView({ tenant }: TenantDetailViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      case 'suspended':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tenant */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-12 w-12 text-primary" />
              <div>
                <CardTitle className="text-2xl">{tenant.tenant.name}</CardTitle>
                <CardDescription className="mt-1">
                  CNPJ: {tenant.tenant.cnpj} • Segmento: {tenant.tenant.segment}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(tenant.tenant.status)}>
                {getStatusLabel(tenant.tenant.status)}
              </Badge>
              <Badge variant="outline">{tenant.tenant.plan}</Badge>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">MRR Estimado</p>
              <p className="text-2xl font-bold">
                R$ {tenant.tenant.mrr_estimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="text-lg font-medium">
                {new Date(tenant.tenant.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última atualização</p>
              <p className="text-lg font-medium">
                {new Date(tenant.tenant.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID do Tenant</p>
              <p className="text-sm font-mono">{tenant.tenant.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com informações detalhadas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários ({tenant.users.length})</TabsTrigger>
          <TabsTrigger value="agents">Agentes ({tenant.agents.length})</TabsTrigger>
          <TabsTrigger value="integrations">Integrações ({tenant.integrations.length})</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes ({tenant.recent_incidents.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requisições (7d)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenant.usage_summary.requests_last_7_days.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requisições (30d)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenant.usage_summary.requests_last_30_days.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso (30d)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenant.usage_summary.success_rate_last_30_days.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Tenant</CardTitle>
              <CardDescription>
                Lista de usuários com acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenant.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{user.role}</Badge>
                      {user.last_login_at && (
                        <span className="text-xs text-muted-foreground">
                          Último acesso: {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Agentes */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agentes Contratados</CardTitle>
              <CardDescription>
                Agentes AlquimistaAI ativos para este tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenant.agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ativado em: {new Date(agent.activated_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {agent.usage_last_30_days.total_requests.toLocaleString()} requisições
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Taxa de sucesso: {agent.usage_last_30_days.success_rate.toFixed(1)}%
                        </p>
                      </div>
                      <Badge 
                        className={agent.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}
                      >
                        {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Integrações */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações Configuradas</CardTitle>
              <CardDescription>
                Integrações externas conectadas ao tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenant.integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Plug className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">Tipo: {integration.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={integration.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                      >
                        {integration.status === 'active' ? 'Ativo' : 'Erro'}
                      </Badge>
                      {integration.last_sync_at && (
                        <span className="text-xs text-muted-foreground">
                          Última sinc: {new Date(integration.last_sync_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Incidentes */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Incidentes Recentes</CardTitle>
              <CardDescription>
                Histórico de incidentes que afetaram este tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenant.recent_incidents.map((incident) => (
                  <div key={incident.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{incident.title}</p>
                        <Badge 
                          className={
                            incident.severity === 'critical' ? 'bg-red-500 text-white' :
                            incident.severity === 'error' ? 'bg-orange-500 text-white' :
                            incident.severity === 'warning' ? 'bg-yellow-500 text-white' :
                            'bg-blue-500 text-white'
                          }
                        >
                          {incident.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(incident.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
