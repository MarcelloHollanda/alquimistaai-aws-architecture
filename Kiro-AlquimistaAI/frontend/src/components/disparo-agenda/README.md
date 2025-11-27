# Componentes do Módulo Disparo & Agendamento

Este diretório contém os componentes React para o módulo de Disparo Automático & Agendamento do sistema AlquimistaAI.

## 📁 Estrutura

```
disparo-agenda/
├── overview-cards.tsx        # Cards de visão rápida (métricas)
├── contacts-upload.tsx       # Formulário de importação de contatos
├── campaigns-table.tsx       # Tabela de campanhas de disparo
├── meetings-table.tsx        # Tabela de reuniões agendadas
└── README.md                 # Este arquivo
```

## 🎯 Componentes

### OverviewCards

**Propósito:** Exibir métricas agregadas do módulo

**Props:**
- `overview`: Dados de overview (contatos na fila, mensagens enviadas, reuniões)
- `isLoading`: Estado de carregamento

**Uso:**
```tsx
<OverviewCards overview={overviewData} isLoading={false} />
```

### ContactsUpload

**Propósito:** Permitir importação de contatos via formulário ou upload de arquivo

**Props:**
- `onSuccess`: Callback executado após upload bem-sucedido

**Funcionalidades:**
- Formulário manual com múltiplos contatos
- Upload de arquivo CSV/Excel (em desenvolvimento)
- Validação de campos obrigatórios
- Adição/remoção dinâmica de contatos

**Uso:**
```tsx
<ContactsUpload onSuccess={() => console.log('Contatos enviados!')} />
```

### CampaignsTable

**Propósito:** Listar campanhas de disparo ativas e recentes

**Props:** Nenhuma (busca dados internamente)

**Funcionalidades:**
- Lista campanhas com status (pendente, ativa, pausada, concluída)
- Exibe progresso de envio (X/Y mensagens)
- Mostra próxima janela de execução
- Ícones por canal (WhatsApp, Email, SMS)

**Uso:**
```tsx
<CampaignsTable />
```

### MeetingsTable

**Propósito:** Listar reuniões agendadas e propostas

**Props:** Nenhuma (busca dados internamente)

**Funcionalidades:**
- Lista reuniões com status (proposta, confirmada, cancelada, realizada, no-show)
- Exibe data/hora, duração e tipo de reunião
- Link para entrar na reunião (quando confirmada)
- Informações do lead (nome, empresa)

**Uso:**
```tsx
<MeetingsTable />
```

## 🔌 Integração com API

Todos os componentes utilizam o cliente HTTP `disparoAgendaApi` localizado em:
```
frontend/src/lib/api/disparo-agenda-api.ts
```

### Endpoints Utilizados

- `GET /disparo/overview` - Contadores agregados
- `GET /disparo/campaigns` - Lista campanhas
- `POST /disparo/contacts/ingest` - Envia lote de contatos
- `GET /agendamento/meetings` - Lista reuniões

**Nota:** Atualmente os endpoints retornam stubs (dados mockados) até que o backend esteja implementado.

## 🎨 Padrões de Design

### Componentes UI Reutilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Estrutura de cards
- `Button` - Botões com variantes
- `Input`, `Textarea`, `Label` - Campos de formulário
- `Badge` - Tags de status
- `Skeleton` - Estados de carregamento
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Navegação por abas

### Estados de Carregamento

Todos os componentes implementam estados de carregamento com `Skeleton` para melhor UX.

### Estados Vazios

Quando não há dados, os componentes exibem mensagens amigáveis com ícones e texto explicativo.

### Responsividade

Todos os componentes são responsivos e funcionam em mobile, tablet e desktop.

## 🧪 Testes

Os componentes são testados via testes E2E com Playwright:

```powershell
cd frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts
```

## 🚀 Próximos Passos

### Funcionalidades Pendentes

1. **Upload de CSV/Excel**
   - Parser de arquivos
   - Validação de formato
   - Preview antes de enviar

2. **Filtros e Busca**
   - Filtrar campanhas por status/canal
   - Buscar reuniões por lead/data
   - Ordenação de tabelas

3. **Ações em Massa**
   - Pausar/retomar campanhas
   - Cancelar reuniões em lote
   - Exportar dados

4. **Detalhes Expandidos**
   - Modal com detalhes de campanha
   - Modal com briefing de reunião
   - Histórico de interações

5. **Notificações em Tempo Real**
   - WebSocket para atualizações live
   - Toast notifications para eventos importantes

## 📚 Documentação Relacionada

- [Blueprint do Micro Agente](../../../../.kiro/steering/blueprint-disparo-agendamento.md)
- [Design da Spec](../../../../.kiro/specs/micro-agente-disparo-agendamento/design.md)
- [Requirements da Spec](../../../../.kiro/specs/micro-agente-disparo-agendamento/requirements.md)
- [Tasks da Spec](../../../../.kiro/specs/micro-agente-disparo-agendamento/tasks.md)

---

**Versão:** 1.0.0  
**Data:** 24 de novembro de 2024  
**Status:** ✅ MVP Funcional (com stubs de backend)
