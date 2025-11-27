'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plug, Users, Mail, MessageSquare, Database, Calendar, CreditCard } from 'lucide-react';

interface Integration {
  type: string;
  name: string;
  tenant_count: number;
  status: string;
}

interface IntegrationsMapProps {
  integrations: Integration[];
}

export function IntegrationsMap({ integrations }: IntegrationsMapProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'whatsapp':
        return MessageSquare;
      case 'crm':
        return Database;
      case 'calendar':
        return Calendar;
      case 'payment':
        return CreditCard;
      default:
        return Plug;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-500 text-white';
      case 'whatsapp':
        return 'bg-green-500 text-white';
      case 'crm':
        return 'bg-purple-500 text-white';
      case 'calendar':
        return 'bg-orange-500 text-white';
      case 'payment':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'E-mail';
      case 'whatsapp':
        return 'WhatsApp';
      case 'crm':
        return 'CRM';
      case 'calendar':
        return 'Calendário';
      case 'payment':
        return 'Pagamento';
      default:
        return type;
    }
  };

  if (integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Plug className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma integração encontrada</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {integrations.map((integration, index) => {
        const Icon = getTypeIcon(integration.type);
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Icon className="h-8 w-8 text-primary" />
                <Badge className={getTypeColor(integration.type)}>
                  {getTypeLabel(integration.type)}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{integration.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Tenants usando</span>
                </div>
                <span className="text-2xl font-bold">{integration.tenant_count}</span>
              </div>
              <div className="mt-3">
                <Badge 
                  className={integration.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                >
                  {integration.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
