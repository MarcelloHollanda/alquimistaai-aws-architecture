'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface Incident {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  created_at: string;
  resolved_at: string | null;
}

export function RecentIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implementar chamada real à API quando o endpoint estiver disponível
    // Por enquanto, usando dados mock
    const mockIncidents: Incident[] = [
      {
        id: '1',
        severity: 'warning',
        title: 'Alta latência no Agente de Vendas',
        description: 'Tempo de resposta acima de 2s detectado',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        resolved_at: null,
      },
      {
        id: '2',
        severity: 'info',
        title: 'Manutenção programada',
        description: 'Atualização de segurança agendada para 02:00 AM',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        resolved_at: null,
      },
      {
        id: '3',
        severity: 'error',
        title: 'Falha na integração WhatsApp',
        description: 'Tenant XYZ reportou erro de conexão',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        resolved_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    setTimeout(() => {
      setIncidents(mockIncidents);
      setLoading(false);
    }, 500);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'error':
        return 'bg-red-400 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
        return 'Info';
      default:
        return severity;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidentes Recentes</CardTitle>
        <CardDescription>
          Alertas e eventos que requerem atenção
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-muted-foreground">Nenhum incidente ativo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start space-x-3 p-3 rounded-lg border"
              >
                <Badge 
                  className={`${getSeverityColor(incident.severity)} flex items-center space-x-1 mt-1`}
                >
                  {getSeverityIcon(incident.severity)}
                  <span>{getSeverityLabel(incident.severity)}</span>
                </Badge>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{incident.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(incident.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {incident.description}
                  </p>
                  {incident.resolved_at && (
                    <div className="flex items-center space-x-1 mt-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">
                        Resolvido {formatDate(incident.resolved_at)}
                      </span>
                    </div>
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
