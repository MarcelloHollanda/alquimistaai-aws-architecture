'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Calendar, CheckCircle, Clock } from 'lucide-react';

interface OverviewCardsProps {
  overview: any;
  isLoading: boolean;
}

export function OverviewCards({ overview, isLoading }: OverviewCardsProps) {
  const cards = [
    {
      title: 'Contatos na Fila',
      value: overview?.contactsInQueue ?? 0,
      icon: Clock,
      description: 'Aguardando envio',
    },
    {
      title: 'Mensagens Enviadas Hoje',
      value: overview?.messagesSentToday ?? 0,
      icon: MessageSquare,
      description: 'WhatsApp, Email e SMS',
    },
    {
      title: 'Reuniões Agendadas',
      value: overview?.meetingsScheduled ?? 0,
      icon: Calendar,
      description: 'Propostas enviadas',
    },
    {
      title: 'Reuniões Confirmadas',
      value: overview?.meetingsConfirmed ?? 0,
      icon: CheckCircle,
      description: 'Confirmadas pelos leads',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
