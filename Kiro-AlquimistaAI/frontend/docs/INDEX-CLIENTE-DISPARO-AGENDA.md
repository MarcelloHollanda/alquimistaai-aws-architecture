# 📑 Índice - Cliente API Disparo e Agendamento

Navegação rápida para toda a documentação do cliente HTTP do Micro Agente de Disparo e Agendamento.

---

## 🚀 Início Rápido

1. **[Resumo Completo](./CLIENTE-DISPARO-AGENDA-COMPLETO.md)** ⭐
   - Visão geral da implementação
   - Checklist de validação
   - Próximos passos

2. **[Log de Implementação](./LOG-CLIENTE-DISPARO-AGENDA-25-11-2024.md)**
   - Detalhes técnicos da implementação
   - Arquivos criados
   - Padrões seguidos

---

## 📖 Documentação Técnica

### Cliente Principal

**Arquivo**: `frontend/src/lib/disparo-agenda-api.ts`

Contém:
- Cliente Axios configurado
- 7 métodos de API
- Tipos TypeScript
- Interceptors (correlation ID + erros)

**Documentação**: `frontend/src/lib/disparo-agenda-api.README.md`

### Exemplos Práticos

**Arquivo**: `frontend/src/lib/disparo-agenda-api.example.tsx`

Contém:
- 9 hooks customizados com React Query
- Componente completo de exemplo
- Tratamento avançado de erros

---

## 🎯 Métodos da API

### Disparo Automático

| Método | Descrição | Documentação |
|--------|-----------|--------------|
| `getOverview()` | Resumo geral (contatos, campanhas, mensagens) | [Ver exemplo](#exemplo-overview) |
| `getCampaigns()` | Listar campanhas de disparo | [Ver exemplo](#exemplo-campaigns) |
| `ingestContacts()` | Ingerir contatos para disparo | [Ver exemplo](#exemplo-ingest) |

### Agendamento Inteligente

| Método | Descrição | Documentação |
|--------|-----------|--------------|
| `getMeetings()` | Listar reuniões agendadas | [Ver exemplo](#exemplo-meetings) |
| `createMeeting()` | Criar nova reunião | [Ver exemplo](#exemplo-create-meeting) |
| `confirmMeeting()` | Confirmar reunião | [Ver exemplo](#exemplo-confirm) |
| `cancelMeeting()` | Cancelar reunião | [Ver exemplo](#exemplo-cancel) |

---

## 💡 Exemplos de Uso

### <a name="exemplo-overview"></a>Exemplo: Overview

```typescript
import { useDisparoOverview } from '@/lib/disparo-agenda-api.example';

function MyComponent() {
  const { data, isLoading } = useDisparoOverview();
  
  return (
    <div>
      <p>Contatos: {data?.totalContacts}</p>
      <p>Campanhas: {data?.totalCampaigns}</p>
      <p>Mensagens (24h): {data?.messagesSentLast24h}</p>
    </div>
  );
}
```

### <a name="exemplo-campaigns"></a>Exemplo: Campanhas

```typescript
import { useDisparoCampaigns } from '@/lib/disparo-agenda-api.example';

function CampaignsComponent() {
  const { data } = useDisparoCampaigns();
  
  return (
    <ul>
      {data?.campaigns.map(campaign => (
        <li key={campaign.id}>{campaign.name} - {campaign.status}</li>
      ))}
    </ul>
  );
}
```

### <a name="exemplo-ingest"></a>Exemplo: Ingerir Contatos

```typescript
import { useIngestContacts } from '@/lib/disparo-agenda-api.example';

function UploadComponent() {
  const ingestMutation = useIngestContacts();
  
  const handleUpload = () => {
    ingestMutation.mutate([
      { name: 'João', phone: '+5584999887766', email: 'joao@example.com' }
    ]);
  };
  
  return <button onClick={handleUpload}>Enviar Contatos</button>;
}
```

### <a name="exemplo-meetings"></a>Exemplo: Reuniões

```typescript
import { useMeetings } from '@/lib/disparo-agenda-api.example';

function MeetingsComponent() {
  const { data } = useMeetings({ status: 'confirmed' });
  
  return (
    <ul>
      {data?.meetings.map(meeting => (
        <li key={meeting.id}>
          {meeting.meetingType} - {meeting.scheduledAt}
        </li>
      ))}
    </ul>
  );
}
```

### <a name="exemplo-create-meeting"></a>Exemplo: Criar Reunião

```typescript
import { useCreateMeeting } from '@/lib/disparo-agenda-api.example';

function CreateMeetingComponent() {
  const createMutation = useCreateMeeting();
  
  const handleCreate = () => {
    createMutation.mutate({
      leadId: 'lead-123',
      urgency: 'high',
      meetingType: 'demo'
    });
  };
  
  return <button onClick={handleCreate}>Agendar Reunião</button>;
}
```

### <a name="exemplo-confirm"></a>Exemplo: Confirmar Reunião

```typescript
import { useConfirmMeeting } from '@/lib/disparo-agenda-api.example';

function ConfirmButton({ meetingId }: { meetingId: string }) {
  const confirmMutation = useConfirmMeeting();
  
  return (
    <button onClick={() => confirmMutation.mutate(meetingId)}>
      Confirmar
    </button>
  );
}
```

### <a name="exemplo-cancel"></a>Exemplo: Cancelar Reunião

```typescript
import { useCancelMeeting } from '@/lib/disparo-agenda-api.example';

function CancelButton({ meetingId }: { meetingId: string }) {
  const cancelMutation = useCancelMeeting();
  
  return (
    <button onClick={() => cancelMutation.mutate({ 
      meetingId, 
      reason: 'Cliente solicitou' 
    })}>
      Cancelar
    </button>
  );
}
```

---

## 🔧 Configuração

### Variável de Ambiente

```env
# .env.local
NEXT_PUBLIC_DISPARO_AGENDA_API_URL=https://bii73uten7.execute-api.us-east-1.amazonaws.com/dev
```

**Fallback**: Se não configurada, usa `NEXT_PUBLIC_API_URL`

---

## 📦 Tipos TypeScript

Todos os tipos estão disponíveis para importação:

```typescript
import type {
  OverviewResponse,
  Campaign,
  CampaignsResponse,
  IngestContactPayload,
  Meeting,
  MeetingsResponse,
} from '@/lib/disparo-agenda-api';
```

---

## 🔍 Observabilidade

### Correlation ID

Todas as requisições incluem automaticamente:

```
X-Correlation-Id: web-1732567890123-abc123def
```

### Logs de Erro

Erros são automaticamente logados no console com detalhes completos.

---

## 🧪 Testes

### Validação de Sintaxe

```bash
✅ frontend/src/lib/disparo-agenda-api.ts - No diagnostics found
✅ frontend/src/lib/disparo-agenda-api.example.tsx - No diagnostics found
```

### Próximos Testes

- [ ] Testes unitários do cliente
- [ ] Testes de integração com backend DEV
- [ ] Testes E2E nos componentes

---

## 📚 Referências Externas

### Blueprints e Design

- [Blueprint Disparo e Agendamento](../../.kiro/steering/blueprint-disparo-agendamento.md)
- [Design do Micro Agente](../../.kiro/specs/micro-agente-disparo-agendamento/design.md)
- [Requirements](../../.kiro/specs/micro-agente-disparo-agendamento/requirements.md)

### API Backend

- [API Contrato HTTP](../../docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md)
- [API Endpoints DEV/PROD](../../docs/micro-agente-disparo-agenda/API-ENDPOINTS-DEV-PROD.md)

### Padrões do Projeto

- [Cliente Nigredo](../src/lib/nigredo-api.ts)
- [Cliente Fibonacci](../src/lib/fibonacci-api.ts)
- [Contexto do Projeto](../../.kiro/steering/contexto-projeto-alquimista.md)

---

## 🎯 Integração nos Componentes

### Componentes Existentes para Atualizar

1. **`frontend/src/components/disparo-agenda/overview-cards.tsx`**
   - Usar `useDisparoOverview()`

2. **`frontend/src/components/disparo-agenda/campaigns-table.tsx`**
   - Usar `useDisparoCampaigns()`

3. **`frontend/src/components/disparo-agenda/contacts-upload.tsx`**
   - Usar `useIngestContacts()`

4. **`frontend/src/components/disparo-agenda/meetings-table.tsx`**
   - Usar `useMeetings()`

### Página Principal

**`frontend/src/app/(dashboard)/disparo-agenda/page.tsx`**
- Integrar todos os hooks
- Usar componente de exemplo como referência

---

## ✅ Status da Implementação

| Item | Status |
|------|--------|
| Cliente HTTP | ✅ Completo |
| Tipos TypeScript | ✅ Completo |
| Documentação | ✅ Completo |
| Exemplos práticos | ✅ Completo |
| Hooks React Query | ✅ Completo |
| Validação de sintaxe | ✅ Completo |
| Testes unitários | ⏳ Pendente |
| Integração nos componentes | ⏳ Pendente |
| Testes E2E | ⏳ Pendente |

---

## 🚀 Comandos Rápidos

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
cd frontend
npm run dev
```

### Testes

```bash
# Rodar testes unitários (quando criados)
npm run test

# Rodar testes E2E (quando criados)
npm run test:e2e
```

### Build

```bash
# Build de produção
npm run build
```

---

**Última atualização**: 25/11/2024  
**Versão**: 1.0.0  
**Status**: ✅ Implementação Completa
