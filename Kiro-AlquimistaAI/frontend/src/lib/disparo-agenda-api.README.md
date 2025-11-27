# Cliente API - Disparo e Agendamento

Cliente HTTP para consumir a API do Micro Agente de Disparo Automático e Agendamento.

## Configuração

O cliente utiliza as seguintes variáveis de ambiente (em ordem de prioridade):

1. `NEXT_PUBLIC_DISPARO_AGENDA_API_URL` - URL específica da API do micro agente
2. `NEXT_PUBLIC_API_URL` - URL base da API da plataforma

Exemplo de configuração no `.env.local`:

```env
NEXT_PUBLIC_DISPARO_AGENDA_API_URL=https://bii73uten7.execute-api.us-east-1.amazonaws.com/dev
```

## Uso Básico

### Importação

```typescript
import { disparoAgendaApiMethods } from '@/lib/disparo-agenda-api';
```

### Exemplos

#### 1. Obter Overview do Sistema

```typescript
try {
  const { data } = await disparoAgendaApiMethods.getOverview();
  console.log('Total de contatos:', data.totalContacts);
  console.log('Total de campanhas:', data.totalCampaigns);
  console.log('Mensagens enviadas (24h):', data.messagesSentLast24h);
} catch (error) {
  console.error('Erro ao obter overview:', error);
}
```

#### 2. Listar Campanhas

```typescript
try {
  const { data } = await disparoAgendaApiMethods.getCampaigns();
  data.campaigns.forEach(campaign => {
    console.log(`${campaign.name} - Status: ${campaign.status}`);
  });
} catch (error) {
  console.error('Erro ao listar campanhas:', error);
}
```

#### 3. Ingerir Contatos

```typescript
const contacts = [
  {
    name: 'João Silva',
    phone: '+5584999887766',
    email: 'joao@example.com',
    tags: ['lead-quente', 'interesse-produto-a']
  },
  {
    name: 'Maria Santos',
    phone: '+5584988776655',
    tags: ['lead-morno']
  }
];

try {
  await disparoAgendaApiMethods.ingestContacts(contacts);
  console.log('Contatos ingeridos com sucesso!');
} catch (error) {
  console.error('Erro ao ingerir contatos:', error);
}
```

#### 4. Listar Reuniões

```typescript
try {
  const { data } = await disparoAgendaApiMethods.getMeetings({
    status: 'confirmed',
    from_date: '2024-11-01',
    to_date: '2024-11-30'
  });
  
  data.meetings.forEach(meeting => {
    console.log(`Reunião: ${meeting.meetingType} - ${meeting.scheduledAt}`);
  });
} catch (error) {
  console.error('Erro ao listar reuniões:', error);
}
```

#### 5. Criar Reunião

```typescript
try {
  const { data } = await disparoAgendaApiMethods.createMeeting({
    leadId: 'lead-123',
    preferredDates: ['2024-11-25', '2024-11-26'],
    preferredTimes: ['morning', 'afternoon'],
    urgency: 'high',
    meetingType: 'demo'
  });
  
  console.log('Reunião criada:', data.id);
  console.log('Link:', data.meetingLink);
} catch (error) {
  console.error('Erro ao criar reunião:', error);
}
```

#### 6. Confirmar Reunião

```typescript
try {
  const { data } = await disparoAgendaApiMethods.confirmMeeting('meeting-123');
  console.log('Reunião confirmada:', data.status);
} catch (error) {
  console.error('Erro ao confirmar reunião:', error);
}
```

#### 7. Cancelar Reunião

```typescript
try {
  await disparoAgendaApiMethods.cancelMeeting(
    'meeting-123',
    'Cliente solicitou reagendamento'
  );
  console.log('Reunião cancelada com sucesso');
} catch (error) {
  console.error('Erro ao cancelar reunião:', error);
}
```

## Uso em Componentes React

### Com React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { disparoAgendaApiMethods } from '@/lib/disparo-agenda-api';

function DisparoAgendaPage() {
  // Query para overview
  const { data: overview, isLoading } = useQuery({
    queryKey: ['disparo-agenda', 'overview'],
    queryFn: async () => {
      const { data } = await disparoAgendaApiMethods.getOverview();
      return data;
    }
  });

  // Mutation para ingerir contatos
  const ingestMutation = useMutation({
    mutationFn: disparoAgendaApiMethods.ingestContacts,
    onSuccess: () => {
      console.log('Contatos ingeridos!');
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Disparo e Agendamento</h1>
      <p>Total de contatos: {overview?.totalContacts}</p>
      <p>Campanhas: {overview?.totalCampaigns}</p>
      <p>Mensagens (24h): {overview?.messagesSentLast24h}</p>
    </div>
  );
}
```

## Tipos Disponíveis

### OverviewResponse

```typescript
interface OverviewResponse {
  totalContacts: number;
  totalCampaigns: number;
  messagesSentLast24h: number;
}
```

### Campaign

```typescript
interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt?: string;
}
```

### IngestContactPayload

```typescript
interface IngestContactPayload {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
}
```

### Meeting

```typescript
interface Meeting {
  id: string;
  leadId: string;
  scheduledAt: string;
  duration: number;
  meetingType: string;
  status: string;
  attendees: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  meetingLink?: string;
  createdAt: string;
}
```

## Tratamento de Erros

O cliente possui interceptors que automaticamente:

1. Adicionam um `X-Correlation-Id` único a cada requisição
2. Logam erros no console com detalhes úteis
3. Rejeitam a Promise para tratamento no código consumidor

Exemplo de tratamento de erro:

```typescript
try {
  await disparoAgendaApiMethods.getOverview();
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      // Não autenticado
      console.error('Usuário não autenticado');
    } else if (error.response?.status === 403) {
      // Sem permissão
      console.error('Sem permissão para acessar este recurso');
    } else if (error.response?.status === 404) {
      // Recurso não encontrado
      console.error('Recurso não encontrado');
    } else {
      // Outro erro
      console.error('Erro na API:', error.response?.data);
    }
  } else {
    console.error('Erro desconhecido:', error);
  }
}
```

## Observabilidade

Todas as requisições incluem:

- **X-Correlation-Id**: ID único para rastreamento de requisições
- **Timeout**: 30 segundos
- **Credentials**: Incluídas automaticamente (`withCredentials: true`)

Os logs de erro incluem:

- Status HTTP
- Dados da resposta
- Correlation ID (quando disponível)

## Referências

- [Blueprint do Micro Agente](/.kiro/steering/blueprint-disparo-agendamento.md)
- [Design do Micro Agente](/.kiro/specs/micro-agente-disparo-agendamento/design.md)
- [API Endpoints](/../docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md)
