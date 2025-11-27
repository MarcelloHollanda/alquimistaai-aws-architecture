'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { disparoAgendaApi } from '@/lib/api/disparo-agenda-api';
import { MessageSquare, Mail, Smartphone } from 'lucide-react';

export function CampaignsTable() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await disparoAgendaApi.listCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      active: 'default',
      paused: 'secondary',
      completed: 'secondary',
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      active: 'Ativa',
      paused: 'Pausada',
      completed: 'Concluída',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, any> = {
      whatsapp: MessageSquare,
      email: Mail,
      sms: Smartphone,
    };

    const Icon = icons[channel] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campanhas Recentes</CardTitle>
          <CardDescription>Disparos de mensagens em andamento e concluídos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-6 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campanhas Recentes</CardTitle>
          <CardDescription>Disparos de mensagens em andamento e concluídos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Importe contatos para iniciar sua primeira campanha de disparo automático.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campanhas Recentes</CardTitle>
        <CardDescription>Disparos de mensagens em andamento e concluídos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  {getChannelIcon(campaign.channel)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{campaign.name || 'Campanha sem nome'}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>
                      {campaign.messagesSent} / {campaign.messagesTotal} enviadas
                    </span>
                    {campaign.nextRun && (
                      <span>
                        Próximo envio: {new Date(campaign.nextRun).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(campaign.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
