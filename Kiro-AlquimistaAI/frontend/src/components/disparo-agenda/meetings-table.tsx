'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { disparoAgendaApi } from '@/lib/api/disparo-agenda-api';
import { Calendar, ExternalLink, Building2 } from 'lucide-react';

export function MeetingsTable() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await disparoAgendaApi.listMeetings();
      setMeetings(data);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      proposed: 'outline',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'secondary',
      no_show: 'destructive',
    };

    const labels: Record<string, string> = {
      proposed: 'Proposta',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Realizada',
      no_show: 'Não compareceu',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reuniões Agendadas</CardTitle>
          <CardDescription>Agendamentos propostos e confirmados</CardDescription>
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

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reuniões Agendadas</CardTitle>
          <CardDescription>Agendamentos propostos e confirmados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma reunião agendada</h3>
            <p className="text-sm text-muted-foreground">
              Quando leads demonstrarem interesse, o agente irá propor horários automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reuniões Agendadas</CardTitle>
        <CardDescription>Agendamentos propostos e confirmados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{meeting.leadName}</h4>
                    {meeting.leadCompany && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {meeting.leadCompany}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>
                      {new Date(meeting.scheduledAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span>{meeting.duration} min</span>
                    <span className="capitalize">{meeting.meetingType}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(meeting.status)}
                {meeting.meetingLink && meeting.status === 'confirmed' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Entrar
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
