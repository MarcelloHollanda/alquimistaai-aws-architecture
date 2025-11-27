'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getTenantIncidents, type Incident } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Plus, RefreshCw } from 'lucide-react';

export default function SupportPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'info' as 'info' | 'warning' | 'error' | 'critical',
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    try {
      setLoading(true);
      const data = await getTenantIncidents(20, 0);
      setIncidents(data.incidents);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar incidentes:', err);
      setError(err.message || 'Erro ao carregar incidentes');
    } finally {
      setLoading(false);
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítico';
      case 'error':
        return 'Erro';
      case 'warning':
        return 'Aviso';
      case 'info':
        return 'Informação';
      default:
        return severity;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Criar chamado:', formData);
    // TODO: Implementar criação de chamado
    setShowForm(false);
    setFormData({ title: '', description: '', severity: 'info' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe incidentes e abra chamados de suporte
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadIncidents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* Formulário de Novo Chamado */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Abrir Novo Chamado</CardTitle>
            <CardDescription>
              Descreva o problema ou solicitação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Resumo do problema"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severidade</Label>
                <select
                  id="severity"
                  value={formData.severity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, severity: e.target.value as 'info' | 'warning' | 'error' | 'critical' })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="info">Informação</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o problema em detalhes..."
                  rows={5}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit">Enviar Chamado</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">Incidentes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {incidents.filter(i => i.resolved_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {incidents.filter(i => !i.resolved_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando resolução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {incidents.filter(i => i.severity === 'critical' && !i.resolved_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Incidentes */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
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
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum incidente registrado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Ótimas notícias! Não há incidentes registrados no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className={incident.resolved_at ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getSeverityIcon(incident.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">{incident.title}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`${getSeverityColor(incident.severity)} text-white border-none text-xs`}
                        >
                          {getSeverityLabel(incident.severity)}
                        </Badge>
                        {incident.resolved_at && (
                          <Badge variant="outline" className="bg-green-500 text-white border-none text-xs">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{incident.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Criado em {new Date(incident.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(incident.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {incident.resolved_at && (
                    <div className="text-green-600">
                      Resolvido em {new Date(incident.resolved_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
