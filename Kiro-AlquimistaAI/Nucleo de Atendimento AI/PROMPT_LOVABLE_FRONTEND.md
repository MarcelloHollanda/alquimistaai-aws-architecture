# 🎨 Prompt Completo para Frontend C3 Comercial - Lovable

## 📋 Visão Geral do Sistema

Crie um dashboard web moderno e profissional para o **C3 Comercial Middleware**, um sistema de automação comercial com 13 agentes de IA especializados (T1-T7) que gerencia todo o funil de vendas desde a importação de leads até o fechamento e pós-venda.

O sistema integra WhatsApp, Email, Google Calendar, OpenAI e Supabase para automação completa de prospecção, atendimento, agendamento e relatórios.

---

## 🏗️ Arquitetura Técnica

### Backend API (já implementado no Replit)
- **URL Base:** `https://[seu-replit].replit.app`
- **Endpoints principais:**
  - `POST /api/chat` - Conversa com agentes de IA
  - `GET /api/chat/agents` - Listar agentes disponíveis
  - `GET /api/chat/conversations/:id` - Histórico de conversa
  - `POST /api/leads/import` - Importar planilha de leads
  - `GET /api/reports` - Relatórios e métricas
  - `GET /health` - Health check

### Integrações Ativas
- ✅ OpenAI (13 agentes GPT-4o)
- ✅ Supabase (PostgreSQL)
- ✅ WhatsApp (Evolution API + Meta)
- ✅ Gmail SMTP
- ✅ Google Calendar

---

## 🎨 Design e Interface

### Paleta de Cores
- **Primary:** #2563eb (Azul profissional)
- **Secondary:** #7c3aed (Roxo moderno)
- **Success:** #10b981 (Verde)
- **Warning:** #f59e0b (Laranja)
- **Danger:** #ef4444 (Vermelho)
- **Neutral:** #64748b (Cinza)

### Componentes UI
- Use **shadcn/ui** com Tailwind CSS
- Tema dark/light com toggle
- Ícones: lucide-react
- Fonte: Inter ou Geist

---

## 📱 Estrutura de Páginas

### 1. 🏠 Dashboard Principal (`/`)

**Objetivo:** Visão executiva em tempo real

**Componentes:**

#### Header
- Logo C3 Comercial
- Menu de navegação: Dashboard | Leads | Campanhas | Conversas | Agentes | Relatórios
- Notificações em tempo real (badge com contador)
- Avatar do usuário com dropdown (Perfil, Configurações, Sair)
- Toggle dark/light mode

#### KPIs em Cards (4 cards principais)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Leads Ativos│ │  Taxa Conv. │ │  Agendados  │ │  Receita    │
│    1,234    │ │    15.2%    │ │     89      │ │  R$ 450k    │
│  ↑ 12%     │ │  ↑ 2.3%    │ │  ↓ 5%      │ │  ↑ 23%     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

#### Funil T0→T7 (Visualização)
- Pipeline visual com % de conversão entre etapas
- T1 (Recebimento) → T2 (Estratégia) → T3 (Disparo) → T4 (Atendimento) → T5 (Agendamento) → T6 (Reunião/Negociação/Fechamento) → T7 (Relatórios)
- Número de leads em cada etapa
- Tempo médio de permanência por etapa

#### Gráfico de Atividade (Área/Linha)
- Últimos 30 dias
- Métricas: Leads recebidos, Mensagens enviadas, Reuniões agendadas, Conversões
- Filtros: 7D | 30D | 90D | 12M

#### Lista de Atividades Recentes
- Stream em tempo real de eventos
- Ex: "Lead #1234 movido para T4 - Atendimento"
- Ex: "Reunião agendada com Empresa XYZ para 15/10 às 14h"
- Ex: "Campanha 'Promo Outubro' enviada para 500 leads"

---

### 2. 📊 Leads (`/leads`)

**Objetivo:** Gerenciar base de leads e importações

**Funcionalidades:**

#### Área de Importação
```
┌─────────────────────────────────────────────────────┐
│  📤 IMPORTAR LEADS                                  │
│                                                     │
│  Arraste arquivo Excel/CSV ou clique para buscar   │
│                                                     │
│  [  Soltar arquivo aqui...  ]                      │
│                                                     │
│  Formatos aceitos: .xlsx, .csv                     │
│  Campos obrigatórios: nome_empresa, telefone/email │
└─────────────────────────────────────────────────────┘
```

#### Preview da Importação
- Tabela com primeiras 5 linhas
- Mapeamento automático de colunas
- Validação em tempo real:
  - ✅ Telefone E.164
  - ✅ Email RFC 5322
  - ✅ CNPJ válido
  - ❌ Erros destacados em vermelho

#### Botões de Ação
- **Cancelar** (cinza)
- **Processar Lote** (azul) → Chama `POST /api/leads/import`

#### Histórico de Lotes Importados
- Tabela com colunas:
  - ID do Lote
  - Data/Hora
  - Total de Leads
  - Válidos / Inválidos
  - Status (Processando | Concluído | Erro)
  - Ações (Ver Relatório de Inconformidades, Reprocessar)

#### Filtros Avançados
- Busca por: Nome, CNPJ, Telefone, Email
- Filtros: Status, Segmento, UF, Porte, Canal preferido
- Data de criação (range)

#### Tabela de Leads
- Colunas: Nome Empresa, CNPJ, Contato, Telefone, Email, UF, Status, Tier Atual, Última Interação
- Ações: Ver Detalhes, Editar, Mover para Tier, Marcar como Opt-out
- Paginação com 50/100/200 por página
- Export para CSV/Excel

---

### 3. 🎯 Campanhas (`/campanhas`)

**Objetivo:** Criar e gerenciar campanhas de disparo (T2→T3)

#### Criar Nova Campanha (Wizard de 4 Passos)

**Passo 1: Configuração**
- Nome da campanha
- Objetivo (Prospecção | Nutrição | Reativação | Fechamento)
- Data/hora de início
- Segmentação:
  - Selecionar leads por filtros (CNAE, UF, Porte, etc)
  - Preview de quantos leads serão atingidos

**Passo 2: Templates de Mensagem**
- Canal: WhatsApp | Email | Ambos
- Editor de template com variáveis:
  ```
  Olá {{NOME_CONTATO}},
  
  Somos da {{NOME_EMPRESA}} e identificamos uma oportunidade...
  
  {{LINK_AGENDA}}
  ```
- Preview em tempo real
- Teste de envio

**Passo 3: Políticas e Cronograma**
- Quiet hours (não enviar entre 22h-8h)
- Freq cap (max 3 mensagens/semana)
- Janela por UF/DDD
- Ondas (D0, D2, D5) com variações de narrativa

**Passo 4: Revisão e Aprovação**
- Resumo da campanha
- Estimativa de alcance
- Custo estimado (se aplicável)
- **Botões:**
  - ⬅️ Voltar
  - 💾 Salvar como Rascunho
  - ✅ Aprovar e Agendar

#### Lista de Campanhas Ativas
- Cards com:
  - Nome da campanha
  - Status (Agendada | Em andamento | Pausada | Concluída)
  - Progresso visual (barra)
  - Métricas: Enviadas / Entregues / Respostas
  - Ações: Pausar, Editar, Relatório

---

### 4. 💬 Conversas (`/conversas`)

**Objetivo:** Interface de chat para monitorar e intervir nas conversas dos agentes

#### Layout Split (2 colunas)

**Coluna Esquerda (30%):** Lista de Conversas
- Busca/filtro por lead
- Ordenação: Mais recentes | Não lidas | Por tier
- Card de conversa:
  ```
  ┌─────────────────────────────────┐
  │ 👤 João Silva - Empresa ABC     │
  │ T4 - Atendimento                │
  │ "Gostaria de agendar..."        │
  │ 🕐 Há 5 min · 📱 WhatsApp       │
  └─────────────────────────────────┘
  ```

**Coluna Direita (70%):** Chat Interface
- Header:
  - Avatar + Nome do lead
  - Tier atual (badge colorido)
  - Status (Online | Aguardando | Encerrado)
  - Botão "Assumir Conversa" (humano toma controle)

- Área de mensagens:
  - Mensagens do lead (esquerda, cinza)
  - Mensagens do agente (direita, azul)
  - Timestamp em cada mensagem
  - Indicador de leitura (✓✓)
  - Análise de sentimento (emoji: 😊 positivo | 😐 neutro | 😟 negativo)

- Footer:
  - Input de mensagem
  - Botões: Enviar | Anexar | Templates rápidos
  - Sugestões do agente (IA sugere próximas respostas)

#### Sidebar de Contexto (colapsável)
- Dados do lead:
  - Nome, Empresa, CNPJ
  - Telefone, Email
  - UF, Cidade
  - Segmento, Porte
- Histórico de interações
- Próximas ações sugeridas
- Tags e anotações

---

### 5. 🤖 Agentes (`/agentes`)

**Objetivo:** Monitorar e configurar os 13 agentes de IA

#### Grid de Cards de Agentes (13 cards)

Para cada agente (T1, T2, T3, T4, T4_aux, T5, T6_*, T7):
```
┌──────────────────────────────────────────┐
│ 🎯 T4 - Atendimento                      │
│                                          │
│ Status: ● Ativo                          │
│ Conversas hoje: 247                      │
│ Taxa de sucesso: 92%                     │
│ SLA médio: 18s (meta: ≤30s)             │
│                                          │
│ [Ver Detalhes] [Configurar]             │
└──────────────────────────────────────────┘
```

#### Modal de Detalhes do Agente
- Nome e descrição completa
- Missão e responsabilidades
- SLOs configurados
- Eventos canônicos que consome/emite
- Métricas em tempo real:
  - Volume processado (últimas 24h)
  - Tempo médio de resposta
  - Taxa de erro
  - Gráfico de atividade

#### Modal de Configuração
- Ativar/Desativar agente
- Ajustar temperatura do modelo (0-1)
- Personalizar prompts (apenas admin)
- Configurar fallbacks e escalação

#### Logs de Atividade
- Stream de eventos processados
- Filtros por tier, tipo de evento, status
- Export de logs

---

### 6. 📈 Relatórios (`/relatorios`)

**Objetivo:** Relatórios executivos e operacionais (T7)

#### Tipos de Relatório (Tabs)

**1. Executivo (C-Level)**
- Período: Semanal | Mensal | Trimestral
- KPIs principais:
  - ROI de campanhas
  - CAC (Custo de Aquisição de Cliente)
  - LTV (Lifetime Value)
  - Taxa de conversão geral
  - Pipeline de vendas
- Gráficos:
  - Funil de conversão T0→T7
  - Receita por período
  - Top 5 segmentos
  - Comparativo períodos anteriores

**2. Operacional (Diário/Semanal)**
- Métricas de performance:
  - Leads processados por tier
  - Deliverability (WA/Email)
  - Taxa de resposta
  - Bounce rate
  - Agendamentos realizados vs no-show
- Performance por agente:
  - SLA atingido (verde/vermelho)
  - Volume processado
  - Taxa de escalação para humano

**3. Qualidade**
- Análise de sentimento agregada
- Objeções mais frequentes (top 10)
- Motivos de recusa
- NPS simulado
- Sugestões de melhoria

**4. Experimentos A/B**
- Testes ativos:
  - Template A vs B
  - Horário de envio
  - Canal preferido
- Resultados estatísticos:
  - Taxa de conversão
  - Lift (%)
  - Significância estatística
  - Decisão: Promover vencedor | Continuar teste

#### Ações nos Relatórios
- 📧 Enviar por email
- 📥 Download (PDF/Excel)
- 📅 Agendar envio recorrente
- 📊 Adicionar ao dashboard

---

### 7. ⚙️ Configurações (`/configuracoes`)

**Objetivo:** Gerenciar integrações e preferências

#### Tabs de Configuração

**1. Integrações**
- WhatsApp:
  - Status: ✅ Conectado (Evolution API)
  - QR Code para reconectar
  - Fallback: Meta Cloud API
  - Testar envio
- Email:
  - Gmail SMTP configurado
  - Testar envio
- Google Calendar:
  - OAuth status: ✅ Ativo
  - Reconectar se necessário
- OpenAI:
  - API Key status: ✅ Configurada
  - Modelo: GPT-4o
  - Custo estimado/mês

**2. Políticas de Envio**
- Quiet hours: Configurar por fuso/DDD
- Freq cap: Limites por canal/período
- Janelas de envio por UF
- Opt-out: Gerenciar lista de bloqueio

**3. Usuários e Permissões**
- Listar usuários
- Papéis: Admin | Vendedor | Analista | Visualizador
- Permissões granulares por módulo

**4. Webhooks**
- Endpoints configurados
- Logs de chamadas (últimas 100)
- Testar webhook manualmente

---

## 🔄 Fluxos de Trabalho Principais

### Fluxo 1: Importação de Leads (T1)

```
1. Usuário vai em /leads
2. Clica em "Importar Leads"
3. Upload de arquivo Excel/CSV
4. Sistema faz preview e validação
5. Usuário revisa e confirma
6. Frontend chama: POST /api/leads/import
7. Backend processa com T1 (Recebimento)
8. Exibe progresso em tempo real
9. Mostra Relatório de Inconformidades
10. Leads válidos vão para T2 automaticamente
```

### Fluxo 2: Criação de Campanha (T2→T3)

```
1. Usuário vai em /campanhas
2. Clica "Nova Campanha"
3. Wizard de 4 passos:
   - Configuração básica
   - Templates de mensagem
   - Políticas e cronograma
   - Revisão
4. Aprovação do usuário (checkpoint humano)
5. Frontend chama: POST /api/campaigns
6. T2 (Estratégia) cria plano
7. T3 (Disparo) agenda envios
8. Dashboard mostra campanha ativa
```

### Fluxo 3: Atendimento e Agendamento (T4→T5)

```
1. Lead responde no WhatsApp
2. Webhook chama backend
3. T4 (Atendimento) processa
4. T4_aux analisa sentimento/intenção
5. Se intenção = agendar:
   - T5 propõe 2-3 slots
   - Frontend mostra em /conversas
6. Lead escolhe horário
7. T5 confirma e envia convite (.ics)
8. Google Calendar atualizado
9. Lembretes automáticos D-1 e H-2
```

### Fluxo 4: Intervenção Humana

```
1. Agente detecta situação complexa
2. Escalação aparece em /conversas
3. Badge de notificação no header
4. Humano clica "Assumir Conversa"
5. Frontend desabilita IA temporariamente
6. Humano responde manualmente
7. Pode "Devolver ao Agente" quando resolver
```

### Fluxo 5: Relatórios e Insights (T7)

```
1. T7 processa eventos continuamente
2. ETL incremental atualiza DW
3. Frontend em /relatorios consulta:
   GET /api/reports?type=executive&period=weekly
4. Gráficos renderizados com Recharts
5. Usuário pode:
   - Filtrar períodos
   - Exportar (PDF/Excel)
   - Agendar envio automático
```

---

## 🎯 Requisitos Técnicos

### Stack Frontend
- **Framework:** React com TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand ou React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts ou Chart.js
- **Icons:** lucide-react
- **Notifications:** Sonner

### Estrutura de Pastas
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Header, Sidebar, Footer
│   ├── leads/           # Componentes de leads
│   ├── campaigns/       # Componentes de campanhas
│   ├── chat/            # Interface de chat
│   └── reports/         # Gráficos e relatórios
├── pages/
│   ├── Dashboard.tsx
│   ├── Leads.tsx
│   ├── Campaigns.tsx
│   ├── Conversations.tsx
│   ├── Agents.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── lib/
│   ├── api.ts           # Axios client
│   ├── hooks/           # Custom hooks
│   └── utils/           # Utilities
├── types/
│   └── index.ts         # TypeScript types
└── App.tsx
```

### API Client (Axios)
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Endpoints
export const leadsAPI = {
  import: (file: File) => api.post('/api/leads/import', formData),
  list: (filters) => api.get('/api/leads', { params: filters }),
};

export const chatAPI = {
  sendMessage: (data) => api.post('/api/chat', data),
  getAgents: () => api.get('/api/chat/agents'),
  getConversation: (id) => api.get(`/api/chat/conversations/${id}`),
};

export const campaignsAPI = {
  create: (campaign) => api.post('/api/campaigns', campaign),
  list: () => api.get('/api/campaigns'),
  approve: (id) => api.post(`/api/campaigns/${id}/approve`),
};

export const reportsAPI = {
  get: (type, period) => api.get(`/api/reports?type=${type}&period=${period}`),
};
```

### WebSocket para Real-time (opcional)
```typescript
// Para notificações em tempo real
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

socket.on('new_message', (data) => {
  // Atualizar UI com nova mensagem
});

socket.on('campaign_update', (data) => {
  // Atualizar status da campanha
});
```

---

## 📱 Responsividade

### Mobile-First
- Todas as páginas devem ser **100% responsivas**
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Menu mobile: Hamburger menu colapsável
- Tabelas: Scroll horizontal em mobile
- Cards empilhados verticalmente em telas pequenas

### Progressive Web App (PWA)
- Manifest.json configurado
- Service Worker para cache
- Ícones para instalação
- Notificações push (opcional)

---

## 🔐 Autenticação e Segurança

### Login Page (`/login`)
- Form com email/senha
- OAuth Google (opcional)
- "Esqueci minha senha"
- Token JWT salvo em localStorage
- Redirecionamento automático se já logado

### Proteção de Rotas
```typescript
// PrivateRoute.tsx
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};
```

### Headers de Autenticação
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🎨 Componentes Reutilizáveis Essenciais

### 1. LeadCard
```tsx
<LeadCard 
  lead={lead}
  onViewDetails={() => {}}
  onEdit={() => {}}
  onMoveTier={() => {}}
/>
```

### 2. CampaignWizard
```tsx
<CampaignWizard
  onComplete={(campaign) => createCampaign(campaign)}
  onCancel={() => navigate('/campanhas')}
/>
```

### 3. ChatMessage
```tsx
<ChatMessage
  message={message}
  sender="agent" | "user"
  timestamp={timestamp}
  sentiment="positive" | "neutral" | "negative"
/>
```

### 4. AgentCard
```tsx
<AgentCard
  tier="T4"
  name="Atendimento"
  status="active"
  metrics={metrics}
  onConfig={() => {}}
/>
```

### 5. MetricCard
```tsx
<MetricCard
  title="Leads Ativos"
  value={1234}
  change="+12%"
  trend="up"
  icon={<Users />}
/>
```

### 6. FunnelChart
```tsx
<FunnelChart
  data={[
    { tier: 'T1', count: 1000 },
    { tier: 'T2', count: 850 },
    // ...
  ]}
/>
```

---

## ✅ Critérios de Aceitação

### Funcionalidade
- [x] Upload e importação de planilhas CSV/Excel
- [x] Preview e validação de dados antes do processamento
- [x] Criação de campanhas com wizard de 4 etapas
- [x] Interface de chat funcional com histórico
- [x] Dashboard com KPIs em tempo real
- [x] Relatórios visuais com gráficos interativos
- [x] Configuração de integrações (WhatsApp, Email, Calendar)
- [x] Sistema de notificações
- [x] Intervenção humana em conversas

### Design
- [x] Interface moderna e profissional
- [x] Paleta de cores consistente
- [x] Tipografia legível (Inter/Geist)
- [x] Ícones intuitivos (lucide-react)
- [x] Animações suaves (transitions)
- [x] Loading states em todas as ações
- [x] Error states com mensagens claras
- [x] Empty states com CTAs

### Performance
- [x] Carregamento inicial < 3s
- [x] Navegação entre páginas instantânea
- [x] Lazy loading de componentes pesados
- [x] Otimização de imagens
- [x] Cache de requisições (React Query)

### Acessibilidade
- [x] Semântica HTML correta
- [x] Labels em todos os inputs
- [x] Contraste de cores WCAG AA
- [x] Navegação por teclado
- [x] Screen reader friendly

---

## 🚀 Entregáveis

1. **Código fonte completo** do frontend
2. **Integração com backend** via API REST
3. **README.md** com instruções de instalação
4. **Variáveis de ambiente** documentadas (.env.example)
5. **Deploy** em Vercel/Netlify/Replit (link funcional)

---

## 📝 Observações Finais

- **Priorize UX/UI** - O sistema deve ser intuitivo mesmo para usuários não-técnicos
- **Feedback visual** - Sempre mostre progresso, sucesso ou erro
- **Prevenção de erros** - Valide inputs antes de enviar ao backend
- **Documentação inline** - Tooltips explicativos em funcionalidades complexas
- **Testes manuais** - Teste todos os fluxos antes de entregar

---

**Este é um sistema mission-critical de automação comercial. A interface deve inspirar confiança, profissionalismo e eficiência.**

🎯 **Objetivo Final:** Um dashboard completo que permita ao usuário gerenciar todo o funil de vendas automatizado de forma visual, intuitiva e poderosa.
