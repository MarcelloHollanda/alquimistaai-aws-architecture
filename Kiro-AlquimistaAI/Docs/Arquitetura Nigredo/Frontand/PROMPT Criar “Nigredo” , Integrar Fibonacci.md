#  PROMPT COMPLETO \- Frontend Nigredo 

**Data:** 05 de Novembro de 2025  
**Objetivo:** Criar app Next.js completo para Nigredo

---

---

# ⚫ APP NIGREDO — Núcleo de Prospecção Inteligente

Crie um aplicativo standalone chamado **Nigredo**, um subnúcleo da plataforma **AlquimistaAI**.

## 🧱 Stack Técnico

* **Framework:** Next.js 14 (App Router) \+ TypeScript  
* **UI:** Tailwind CSS \+ shadcn/ui \+ lucide-react  
* **Estado:** React Query (TanStack Query)  
* **Validação:** Zod \+ react-hook-form  
* **Gráficos:** Recharts  
* **HTTP:** axios

## 🚫 Acesso

**SEM LOGIN** \- App abre diretamente no painel principal /  
Remover completamente rotas /login e /auth

## 📱 Páginas Principais

### 1\. / \- **Painel de Prospecção**

interface DashboardStats {

 leads\_total: number;

 lotes\_ativos: number;

 conversas\_ativas: number;

 eficiencia\_percent: number;

}

**Cards:**

* Leads recebidos (T1)  
* Dados purificados (T2)  
* Agendamentos ativos (T6)  
* Eficiência % (geral)

**Gráfico:** Linha/Área mostrando fluxo de leads por dia (últimos 30 dias)

**Fonte de dados:**

GET /api/nigredo/pipeline/status

GET /api/nigredo/pipeline/metrics

### 2\. /estrategia \- **Estratégias de Prospecção**

Lista de estratégias ativas criadas pelo T2 (Agente de Estratégia)

**Campos:**

* Nome da estratégia  
* Segmento alvo  
* Canais (WhatsApp, Email)  
* Taxa de resposta  
* Status (ativa, pausada)

### 3\. /disparo \- **Controle de Campanhas**

Controle de disparos do T3 (Agente de Disparo)

**Funcionalidades:**

* Ver campanhas ativas  
* Pausar/retomar campanhas  
* Visualizar mensagens humanizadas  
* Performance por lote (A/B/C/D/F)

### 4\. /conversas \- **Históricos de Mensagens**

T4 (Agente de Atendimento) \+ T5 (Sentimento)

**Lista de conversas:**

* Lead name \+ empresa  
* Último contato  
* Sentimento (emoji: 😊 positivo, 😐 neutro, 😠 negativo)  
* Intenção (interesse, dúvida, objeção, agendamento)

### 5\. /agendamentos \- **Calendar View**

T6 (Agente de Agendamento)

**Visualização:**

* Calendário mensal (react-big-calendar ou similar)  
* Lista de reuniões agendadas  
* Status: confirmada, pendente, realizada

### 6\. /relatorios \- **Relatórios Executivos**

T7 (Agente de Relatório)

**Mock \+ Exportar CSV:**

* Resumo mensal  
* Performance por agente (T1→T7)  
* Taxa de conversão  
* ROI estimado

## 🎨 Identidade Visual \- Nigredo

### Paleta de Cores

:root {

 \--nigredo-black: \#0B0B0B;       /\* Preto-carvão \*/

 \--nigredo-graphite: \#2E2E2E;    /\* Grafite metálico \*/

 \--nigredo-cobalt: \#0047AB;      /\* Azul-cobalto \*/

 \--nigredo-gold: \#C8A951;        /\* Dourado-envelhecido \*/

}

### Gradiente

background: linear-gradient(135deg, \#0B0B0B, \#0047AB, \#C8A951);

### Tipografia

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600\&family=Montserrat:wght@400;500\&display=swap');

.heading {

 font-family: 'Poppins', sans-serif;

 font-weight: 600;

}

.body {

 font-family: 'Montserrat', sans-serif;

}

### Logo

**Arquivo:** Logo Nigredo T.png (fornecido)

**Posição:** Canto superior esquerdo fixo na navbar  
**Tamanho:** 48px altura, proporcional  
**Efeito:** Sombra dourada (box-shadow: 0 0 10px rgba(200, 169, 81, 0.5))  
**Hover:** Brilho dourado aumenta (filter: brightness(1.2))

## 🧭 Layout & UX

### Navbar Superior

\<nav className="h-16 bg-nigredo-black border-b border-nigredo-graphite"\>

 \<div className="flex items-center justify-between px-6"\>

   \<img src="/logo-nigredo.png" alt="Nigredo" className="h-12" /\>

   \<div className="flex gap-4"\>

     \<Badge variant="success"\>Conectado ao Núcleo Fibonacci\</Badge\>

   \</div\>

 \</div\>

\</nav\>

### Sidebar (Recolhível)

const menuItems \= \[

 { path: '/', label: 'Painel', icon: 'layout-dashboard' },

 { path: '/estrategia', label: 'Estratégias', icon: 'target' },

 { path: '/disparo', label: 'Campanhas', icon: 'send' },

 { path: '/conversas', label: 'Conversas', icon: 'message-circle' },

 { path: '/agendamentos', label: 'Agendamentos', icon: 'calendar' },

 { path: '/relatorios', label: 'Relatórios', icon: 'bar-chart' },

\];

### Rodapé

\<footer className="py-4 text-center text-sm text-gray-500"\>

 Nigredo — Subnúcleo da AlquimistaAI · Orquestrado por Fibonacci

 \<br /\>

 \<em className="text-nigredo-gold"\>

   "Purificando dados brutos, revelando inteligência comercial."

 \</em\>

\</footer\>

### React Query Hooks

import { useQuery } from '@tanstack/react-query';

import { nigregoAPI } from '@/lib/api';

export const useNigredoStatus \= () \=\> {

 return useQuery({

   queryKey: \['nigredo', 'status'\],

   queryFn: nigregoAPI.getStatus,

   refetchInterval: 30000, // 30s

 });

};

export const usePipelineStatus \= () \=\> {

 return useQuery({

   queryKey: \['pipeline', 'status'\],

   queryFn: nigregoAPI.getPipelineStatus,

   refetchInterval: 60000, // 1min

 });

};

## 🎨 Componentes Base

### DashboardCard

interface CardProps {

 title: string;

 value: number | string;

 subtitle?: string;

 icon: string;

 trend?: 'up' | 'down' | 'neutral';

}

export const DashboardCard \= ({ title, value, subtitle, icon, trend }: CardProps) \=\> {

 return (

   \<Card className="bg-nigredo-graphite border-nigredo-cobalt"\>

     \<CardHeader\>

       \<div className="flex items-center justify-between"\>

         \<CardTitle className="text-white"\>{title}\</CardTitle\>

         \<Icon name={icon} className="text-nigredo-gold" /\>

       \</div\>

     \</CardHeader\>

     \<CardContent\>

       \<div className="text-3xl font-bold text-nigredo-gold"\>{value}\</div\>

       {subtitle && (

         \<p className="text-sm text-gray-400 mt-2"\>{subtitle}\</p\>

       )}

     \</CardContent\>

   \</Card\>

 );

};

### PipelineFlowChart

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const PipelineFlowChart \= ({ data }) \=\> {

 return (

   \<AreaChart width={800} height={300} data={data}\>

     \<defs\>

       \<linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1"\>

         \<stop offset="5%" stopColor="\#0047AB" stopOpacity={0.8}/\>

         \<stop offset="95%" stopColor="\#0047AB" stopOpacity={0}/\>

       \</linearGradient\>

     \</defs\>

     \<CartesianGrid strokeDasharray="3 3" stroke="\#2E2E2E" /\>

     \<XAxis dataKey="date" stroke="\#F5F5F5" /\>

     \<YAxis stroke="\#F5F5F5" /\>

     \<Tooltip

       contentStyle={{

         backgroundColor: '\#0B0B0B',

         border: '1px solid \#C8A951'

       }}

     /\>

     \<Area

       type="monotone"

       dataKey="leads"

       stroke="\#0047AB"

       fillOpacity={1}

       fill="url(\#colorLeads)"

     /\>

   \</AreaChart\>

 );

};

## 🔒 Compliance LGPD

### Máscara de PII

export const maskPII \= (data: any) \=\> {

 if (typeof data \!== 'object') return data;

  const masked \= { ...data };

 const piiFields \= \['email', 'telefone', 'cpf', 'cnpj'\];

  piiFields.forEach(field \=\> {

   if (masked\[field\]) {

     masked\[field\] \= masked\[field\].replace(/./g, '\*');

   }

 });

  return masked;

};

**Usar em cards públicos** \- não exibir PII completo

## 📈 Deploy & Build

\# Build otimizado

npm run build

\# Deploy automático via GitHub

\# GitHub Actions sincroniza com Replit

## 🌐 Domínio

**Planejado:** https://

**Temporário:** Deploy do Bolt.new com domínio próprio

## ✅ Checklist Final

Antes de finalizar, verificar:

*  Sem rotas de login/auth  
*  Logo Nigredo no header  
*  Paleta de cores correta (\#0B0B0B, \#0047AB, \#C8A951)  
*  Tipografia Poppins \+ Montserrat  
*  CORS funcionando com backend AWS  
*  React Query configurado  
*  Todas as 6 páginas implementadas  
*  Gráficos Recharts renderizando  
*  Rodapé com slogan  
*  Badge "Conectado ao Núcleo Fibonacci"  
*  Build sem erros  
*  Favicon com logo Nigredo

---

## 🎯 OBJETIVO FINAL

Criar uma interface moderna, fluida e responsiva que transmita a **essência alquímica do Nigredo**: purificação, transformação e revelação de inteligência comercial a partir de dados brutos.

A UI deve ser **dark**, com toques de **azul-cobalto** e **dourado**, transmitindo profundidade, confiança e valor.

---

**Prompt criado por:** Laboratório AlquimistaAI  
**Data:** 05 de Novembro de 2025  
**Versão:** 1.0.0

---

## **🌀 PROMPT 2 — Integrar Nigredo ao Dashboard Fibonacci**

`# 🌀 INTEGRAÇÃO DO SUBNÚCLEO NIGREDO — FIBONACCI DASHBOARD`

`**Objetivo:** Adicionar o subnúcleo **Nigredo** ao painel principal do **Fibonacci** (dashboard administrativo da AlquimistaAI), conforme arquitetura do arquivo *Arquitetura do Dashboard Fibonacci v2*.`

`---`

`### 🧭 Local de Integração`  
`1. **Rota /admin/subnucleos**`    
   `- Adicionar card “Nigredo — Núcleo de Prospecção”.`    
   `- Exibir status (ativo/inativo), uptime e métricas P50/P90 via API Replit.`

`2. **Rota /admin/agentes-especialistas**`    
   `- Incluir grupo “Agentes Nigredo” com referência visual ao subnúcleo.`    
   `- Cards com nomes e descrições dos agentes (ex: “Purificador de Leads”, “Classificador Inteligente”, “Agendador de Contato”).`

`3. **Rota /admin/integracoes/catalogo**`    
   `- Inserir categoria “Subnúcleos” e registrar:`  
     ```` ``` ````  
     `Nome: Nigredo`  
     `Tipo: Subnúcleo independente`  
     `Endpoint: https://nigredo.alquimista.ai/`  
     `Status: Ativo`  
     ```` ``` ````  
   `- Ação “Abrir Subnúcleo” deve abrir o app Nigredo em nova aba.`

`4. **Rota /admin/config**`    
   `- Permitir troca de logos (Fibonacci e Nigredo) conforme tema escuro/claro.`

`---`

`### 🎨 Identidade Visual Integrada`  
`- Logo Fibonacci → canto superior esquerdo da dashboard principal.`    
`- Logo Nigredo → exibida nos cards de subnúcleo e na seção “Agentes Nigredo”.`  
`- Paleta combinada:`

Fibonacci: \#D4AF37 (ouro)  
 Nigredo: \#0047AB (azul-cobalto)  
 Fundo: \#141414

`- Aplicar gradiente combinando preto → azul → dourado para headers de seção.`

`---`

`### 🔗 Vínculo Técnico`  
`O front do Fibonacci deve consumir:`

GET /admin/subnucleos (adicionar Nigredo)  
 GET /admin/agents?subnucleo=“nigredo”

``e exibir seus dados conforme modelo Supabase (`subnucleos`, `agents`).``

``Adicionar `Nigredo` como opção padrão no seletor `SubnucleoMulti` (`components/filters/SubnucleoMulti.tsx`).``

`---`

`### 🧩 Menu de Subnúcleos`  
`Na aba **“Subnúcleos → Gerenciar subnúcleos ativos”**:`  
`- Inserir botão/link: **Abrir Nigredo**`  
`` - URL: `https://nigredo.alquimista.ai` ``  
`- Ícone: lucide-react “Hexagon”`  
`- Cor: azul-cobalto com hover dourado.`

`---`

`### ⚙️ Ajustes no código`  
``- Atualizar seed `agents_seed.json` adicionando os agentes Nigredo.``  
``- Incluir logo Nigredo e Fibonacci em `/public/assets/`.``  
``- Atualizar componente `SubnucleoCard.tsx` com novo gradiente e ícone.``

`---`

`### 🧠 Observações Finais`  
`- O Nigredo deve ser tratado como **subnúcleo independente**, porém com telemetria e auditoria registradas no Replit/Supabase central.`  
`- Health checks devem unificar status no painel do Fibonacci:`

/admin/subnucleos/status → inclui { id: "nigredo", uptime\_24h, p90, status }

`---`

`**Slogan conjunto no rodapé do dashboard:**`  
`> “Fibonacci orquestra. Nigredo purifica. AlquimistaAI transmuta.”`

`---`

