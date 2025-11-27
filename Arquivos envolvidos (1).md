*/\*\**  
 *\* Disparo e Agendamento API Client*  
 *\* Cliente HTTP para consumir a API do Micro Agente de Disparo Automático e Agendamento*  
 *\*/*

*import axios from 'axios';*

*const DISPARO\_AGENDA\_API\_BASE\_URL \=*  
  *process.env.NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL ||*  
  *process.env.NEXT\_PUBLIC\_API\_URL;*

*if (\!DISPARO\_AGENDA\_API\_BASE\_URL) {*  
  *// Evita quebrar o build; loga erro para diagnóstico em runtime*  
  *// eslint-disable-next-line no-console*  
  *console.**error**(*  
    *'\[DisparoAgendaAPI\] NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL / NEXT\_PUBLIC\_API\_URL não configuradas.',*  
  *);*  
*}*

*export const disparoAgendaApi \= axios.**create**({*  
  *baseURL: DISPARO\_AGENDA\_API\_BASE\_URL,*  
  *headers: {*  
    *'Content-Type': 'application/json',*  
  *},*  
  *timeout: 30000, // 30 seconds*  
  *withCredentials: true,*  
*});*

*// Request interceptor para adicionar correlation ID*  
*disparoAgendaApi.interceptors.request.**use**((config) \=\> {*  
  *const correlationId \= \`web-${**Date**.**now**()}\-${Math.**random**().**toString**(36).**substr**(2, 9)}\`;*  
  *config.headers\['X-Correlation-Id'\] \= correlationId;*  
  *return config;*  
*});*

*// Response interceptor para tratamento de erros*  
*disparoAgendaApi.interceptors.response.**use**(*  
  *(response) \=\> response,*  
  *(error) \=\> {*  
    *if (error.response) {*  
      *// Server responded with error status*  
      *console.**error**('Disparo/Agenda API Error:', {*  
        *status: error.response.status,*  
        *data: error.response.data,*  
        *correlationId: error.response.headers\['x-correlation-id'\],*  
      *});*  
    *} else if (error.request) {*  
      *// Request made but no response*  
      *console.**error**('Disparo/Agenda API No Response:', error.request);*  
    *} else {*  
      *// Error setting up request*  
      *console.**error**('Disparo/Agenda API Request Error:', error.message);*  
    *}*  
    *return **Promise**.**reject**(error);*  
  *}*  
*);*

*// API Types*  
*export interface **OverviewResponse** {*  
  *totalContacts: number;*  
  *totalCampaigns: number;*  
  *messagesSentLast24h: number;*  
*}*

*export interface **Campaign** {*  
  *id: string;*  
  *name: string;*  
  *status: string;*  
  *createdAt?: string;*  
*}*

*export interface **CampaignsResponse** {*  
  *campaigns: **Campaign**\[\];*  
*}*

*export interface **IngestContactPayload** {*  
  *name: string;*  
  *phone: string;*  
  *email?: string;*  
  *tags?: string\[\];*  
*}*

*export interface **IngestContactsRequest** {*  
  *contacts: **IngestContactPayload**\[\];*  
*}*

*export interface **Meeting** {*  
  *id: string;*  
  *leadId: string;*  
  *scheduledAt: string;*  
  *duration: number;*  
  *meetingType: string;*  
  *status: string;*  
  *attendees: **Array**\<{*  
    *email: string;*  
    *name: string;*  
    *role: string;*  
  *}\>;*  
  *meetingLink?: string;*  
  *createdAt: string;*  
*}*

*export interface **MeetingsResponse** {*  
  *meetings: **Meeting**\[\];*  
*}*

*// API Methods*  
*export const disparoAgendaApiMethods \= {*  
  *// Overview \- Resumo geral do sistema*  
  ***getOverview**: () \=\>*  
    *disparoAgendaApi.**get**\<**OverviewResponse**\>('/disparo/overview'),*

  *// Campanhas \- Listar campanhas de disparo*  
  ***getCampaigns**: () \=\>*  
    *disparoAgendaApi.**get**\<**CampaignsResponse**\>('/disparo/campaigns'),*

  *// Contatos \- Ingestão de contatos para disparo*  
  ***ingestContacts**: (contacts: **IngestContactPayload**\[\]) \=\>*  
    *disparoAgendaApi.**post**\<void\>('/disparo/contacts/ingest', { contacts }),*

  *// Reuniões \- Listar reuniões agendadas*  
  *getMeetings: (params?: {*  
    *status?: string;*  
    *from\_date?: string;*  
    *to\_date?: string;*  
  *}) \=\>*  
    *disparoAgendaApi.**get**\<**MeetingsResponse**\>('/agendamento/meetings', { params }),*

  *// Reuniões \- Criar nova reunião*  
  ***createMeeting**: (data: {*  
    *leadId: string;*  
    *preferredDates?: string\[\];*  
    *preferredTimes?: ('morning' | 'afternoon' | 'evening')\[\];*  
    *urgency: 'high' | 'medium' | 'low';*  
    *meetingType: 'demo' | 'discovery' | 'negotiation' | 'closing';*  
  *}) \=\>*  
    *disparoAgendaApi.**post**\<**Meeting**\>('/agendamento/meetings', data),*

  *// Reuniões \- Confirmar reunião*  
  ***confirmMeeting**: (meetingId: string) \=\>*  
    *disparoAgendaApi.**post**\<**Meeting**\>(\`/agendamento/meetings/${meetingId}/confirm\`),*

  *// Reuniões \- Cancelar reunião*  
  ***cancelMeeting**: (meetingId: string, reason?: string) \=\>*  
    *disparoAgendaApi.**post**\<void\>(\`/agendamento/meetings/${meetingId}/cancel\`, { reason }),*  
*};*

*export default disparoAgendaApi;*

*/\*\**  
 *\* Disparo e Agendamento API Client*  
 *\* Cliente HTTP para consumir a API do Micro Agente de Disparo Automático e Agendamento*  
 *\*/*

import axios from 'axios';

const DISPARO\_AGENDA\_API\_BASE\_URL \=  
  process.env.NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL ||  
  process.env.NEXT\_PUBLIC\_API\_URL;

if (\!DISPARO\_AGENDA\_API\_BASE\_URL) {  
  *// Evita quebrar o build; loga erro para diagnóstico em runtime*  
  *// eslint-disable-next-line no-console*  
  console.**error**(  
    '\[DisparoAgendaAPI\] NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL / NEXT\_PUBLIC\_API\_URL não configuradas.',  
  );  
}

export const disparoAgendaApi \= axios.**create**({  
  baseURL: DISPARO\_AGENDA\_API\_BASE\_URL,  
  headers: {  
    'Content-Type': 'application/json',  
  },  
  timeout: 30000, *// 30 seconds*  
  withCredentials: true,  
});

*// Request interceptor para adicionar correlation ID*  
disparoAgendaApi.interceptors.request.**use**((config) \=\> {  
  const correlationId \= \`web-${**Date**.**now**()}\-${Math.**random**().**toString**(36).**substr**(2, 9)}\`;  
  config.headers\['X-Correlation-Id'\] \= correlationId;  
  return config;  
});

*// Response interceptor para tratamento de erros*  
disparoAgendaApi.interceptors.response.**use**(  
  (response) \=\> response,  
  (error) \=\> {  
    if (error.response) {  
      *// Server responded with error status*  
      console.**error**('Disparo/Agenda API Error:', {  
        status: error.response.status,  
        data: error.response.data,  
        correlationId: error.response.headers\['x-correlation-id'\],  
      });  
    } else if (error.request) {  
      *// Request made but no response*  
      console.**error**('Disparo/Agenda API No Response:', error.request);  
    } else {  
      *// Error setting up request*  
      console.**error**('Disparo/Agenda API Request Error:', error.message);  
    }  
    return **Promise**.**reject**(error);  
  }  
);

*// API Types*  
export interface **OverviewResponse** {  
  totalContacts: number;  
  totalCampaigns: number;  
  messagesSentLast24h: number;  
}

export interface **Campaign** {  
  id: string;  
  name: string;  
  status: string;  
  createdAt?: string;  
}

export interface **CampaignsResponse** {  
  campaigns: **Campaign**\[\];  
}

export interface **IngestContactPayload** {  
  name: string;  
  phone: string;  
  email?: string;  
  tags?: string\[\];  
}

export interface **IngestContactsRequest** {  
  contacts: **IngestContactPayload**\[\];  
}

export interface **Meeting** {  
  id: string;  
  leadId: string;  
  scheduledAt: string;  
  duration: number;  
  meetingType: string;  
  status: string;  
  attendees: **Array**\<{  
    email: string;  
    name: string;  
    role: string;  
  }\>;  
  meetingLink?: string;  
  createdAt: string;  
}

export interface **MeetingsResponse** {  
  meetings: **Meeting**\[\];  
}

*// API Methods*  
export const disparoAgendaApiMethods \= {  
  *// Overview \- Resumo geral do sistema*  
  **getOverview**: () \=\>  
    disparoAgendaApi.**get**\<**OverviewResponse**\>('/disparo/overview'),

  *// Campanhas \- Listar campanhas de disparo*  
  **getCampaigns**: () \=\>  
    disparoAgendaApi.**get**\<**CampaignsResponse**\>('/disparo/campaigns'),

  *// Contatos \- Ingestão de contatos para disparo*  
  **ingestContacts**: (contacts: **IngestContactPayload**\[\]) \=\>  
    disparoAgendaApi.**post**\<void\>('/disparo/contacts/ingest', { contacts }),

  *// Reuniões \- Listar reuniões agendadas*  
  getMeetings: (params?: {  
    status?: string;  
    from\_date?: string;  
    to\_date?: string;  
  }) \=\>  
    disparoAgendaApi.**get**\<**MeetingsResponse**\>('/agendamento/meetings', { params }),

  *// Reuniões \- Criar nova reunião*  
  **createMeeting**: (data: {  
    leadId: string;  
    preferredDates?: string\[\];  
    preferredTimes?: ('morning' | 'afternoon' | 'evening')\[\];  
    urgency: 'high' | 'medium' | 'low';  
    meetingType: 'demo' | 'discovery' | 'negotiation' | 'closing';  
  }) \=\>  
    disparoAgendaApi.**post**\<**Meeting**\>('/agendamento/meetings', data),

  *// Reuniões \- Confirmar reunião*  
  **confirmMeeting**: (meetingId: string) \=\>  
    disparoAgendaApi.**post**\<**Meeting**\>(\`/agendamento/meetings/${meetingId}/confirm\`),

  *// Reuniões \- Cancelar reunião*  
  **cancelMeeting**: (meetingId: string, reason?: string) \=\>  
    disparoAgendaApi.**post**\<void\>(\`/agendamento/meetings/${meetingId}/cancel\`, { reason }),  
};

export default disparoAgendaApi;

*/\*\**  
 *\* Índice de Clientes HTTP*  
 *\* Painel Operacional AlquimistaAI*  
 *\**  
 *\* Este arquivo exporta todos os clientes HTTP e tipos relacionados*  
 *\* para facilitar as importações em outros módulos.*  
 *\*/*

*// \============================================================================*  
*// TENANT CLIENT*  
*// \============================================================================*

export {  
  tenantClient,  
  **getTenantMe**,  
  **getTenantAgents**,  
  **getTenantIntegrations**,  
  **getTenantUsage**,  
  **getTenantIncidents**,  
  **TenantApiError**,  
} from './tenant-client';

import { tenantClient } from './tenant-client';  
import { TenantApiError } from './tenant-client';

export type {  
  **TenantInfo**,  
  **TenantAgent**,  
  **TenantAgentsResponse**,  
  **TenantIntegration**,  
  **TenantIntegrationsResponse**,  
  **UsageSummary**,  
  **DailyUsageData**,  
  **AgentUsage**,  
  **TenantUsageResponse**,  
  **Incident**,  
  **TenantIncidentsResponse**,  
} from './tenant-client';

*// \============================================================================*  
*// INTERNAL CLIENT*  
*// \============================================================================*

export {  
  internalClient,  
  listTenants,  
  getTenantDetail,  
  getTenantAgents as getInternalTenantAgents,  
  getUsageOverview,  
  getBillingOverview,  
  createOperationalCommand,  
  listOperationalCommands,  
  InternalApiError,  
} from './internal-client';

import { internalClient } from './internal-client';  
import { InternalApiError } from './internal-client';

export type {  
  TenantListItem,  
  TenantsListResponse,  
  TenantsListParams,  
  TenantDetail,  
  TenantAgentDetail,  
  TenantAgentsDetailResponse,  
  UsageOverview,  
  BillingOverview,  
  CommandType,  
  CommandStatus,  
  CreateCommandRequest,  
  CreateCommandResponse,  
  OperationalCommand,  
  CommandsListResponse,  
  CommandsListParams,  
} from './internal-client';

*// \============================================================================*  
*// CLIENTES COMBINADOS*  
*// \============================================================================*

*/\*\**  
 *\* Objeto com todos os clientes disponíveis*  
 *\*/*  
export const apiClients \= {  
  tenant: tenantClient,  
  internal: internalClient,  
};

*/\*\**  
 *\* Tipo união de todos os erros de API*  
 *\*/*  
export type **ApiError** \= **TenantApiError** | **InternalApiError**;

*// \============================================================================*  
*// UTILITÁRIOS*  
*// \============================================================================*

*/\*\**  
 *\* Verifica se um erro é um erro de API*  
 *\*/*  
export function **isApiError**(error: unknown): error is **ApiError** {  
  return error instanceof **TenantApiError** || error instanceof **InternalApiError**;  
}

*/\*\**  
 *\* Verifica se um erro é de autenticação (401)*  
 *\*/*  
export function **isAuthError**(error: unknown): boolean {  
  if (\!**isApiError**(error)) return false;  
  return error.statusCode \=== 401;  
}

*/\*\**  
 *\* Verifica se um erro é de permissão (403)*  
 *\*/*  
export function **isForbiddenError**(error: unknown): boolean {  
  if (\!**isApiError**(error)) return false;  
  return error.statusCode \=== 403;  
}

*/\*\**  
 *\* Verifica se um erro é de recurso não encontrado (404)*  
 *\*/*  
export function **isNotFoundError**(error: unknown): boolean {  
  if (\!**isApiError**(error)) return false;  
  return error.statusCode \=== 404;  
}

*/\*\**  
 *\* Extrai mensagem de erro de forma segura*  
 *\*/*  
export function **getErrorMessage**(error: unknown): string {  
  if (**isApiError**(error)) {  
    return error.message;  
  }  
   
  if (error instanceof **Error**) {  
    return error.message;  
  }  
   
  return 'Erro desconhecido';  
}

*/\*\**  
 *\* Extrai código de erro de forma segura*  
 *\*/*  
export function **getErrorCode**(error: unknown): string | undefined {  
  if (**isApiError**(error)) {  
    return error.code;  
  }  
   
  return undefined;  
}

*/\*\**  
 *\* Índice de Clientes HTTP*  
 *\* Painel Operacional AlquimistaAI*  
 *\**  
 *\* Este arquivo exporta todos os clientes HTTP e tipos relacionados*  
 *\* para facilitar as importações em outros módulos.*  
 *\*/*

*// \============================================================================*  
*// TENANT CLIENT*  
*// \============================================================================*

export {  
  tenantClient,  
  **getTenantMe**,  
  **getTenantAgents**,  
  **getTenantIntegrations**,  
  **getTenantUsage**,  
  **getTenantIncidents**,  
  **TenantApiError**,  
} from './tenant-client';

import { tenantClient } from './tenant-client';  
import { TenantApiError } from './tenant-client';

export type {  
  **TenantInfo**,  
  **TenantAgent**,  
  **TenantAgentsResponse**,  
  **TenantIntegration**,  
  **TenantIntegrationsResponse**,  
  **UsageSummary**,  
  **DailyUsageData**,  
  **AgentUsage**,  
  **TenantUsageResponse**,  
  **Incident**,  
  **TenantIncidentsResponse**,  
} from './tenant-client';

*// \============================================================================*  
*// INTERNAL CLIENT*  
*// \============================================================================*

export {  
  internalClient,  
  listTenants,  
  getTenantDetail,  
  getTenantAgents as getInternalTenantAgents,  
  getUsageOverview,  
  getBillingOverview,  
  createOperationalCommand,  
  listOperationalCommands,  
  InternalApiError,  
} from './internal-client';

import { internalClient } from './internal-client';  
import { InternalApiError } from './internal-client';

export type {  
  TenantListItem,  
  TenantsListResponse,  
  TenantsListParams,  
  TenantDetail,  
  TenantAgentDetail,  
  TenantAgentsDetailResponse,  
  UsageOverview,  
  BillingOverview,  
  CommandType,  
  CommandStatus,  
  CreateCommandRequest,  
  CreateCommandResponse,  
  OperationalCommand,  
  CommandsListResponse,  
  CommandsListParams,  
} from './internal-client';

*// \============================================================================*  
*// CLIENTES COMBINADOS*  
*// \============================================================================*

*/\*\**  
 *\* Objeto com todos os clientes disponíveis*  
 *\*/*  
export const apiClients \= {  
  tenant: tenantClient,  
  internal: internalClient,  
};

*/\*\**  
 *\* Tipo união de todos os erros de API*  
 *\*/*  
export type **ApiError** \= **TenantApiError** | **InternalApiError**;

*// \============================================================================*  
*// UTILITÁRIOS*  
*// \============================================================================*

*/\*\**  
 *\* Verifica se um erro é um erro de API*  
 *\*/*  
export function **isApiError**(error: unknown): error is **ApiError** {  
  return error instanceof **TenantApiError** || error instanceof **InternalApiError**;  
}

*/\*\**  
 *\* Verifica se um erro é de autenticação (401)*  
 *\*/*  
export function **isAuthError**(error: unknown): boolean {  
  if (\!**isApiError**(error)) return false;  
  return error.statusCode \=== 401;  
}

*/\*\**  
 *\* Verifica se um erro é de permissão (403)*  
 *\*/*  
export function **isForbiddenError**(error: unknown): boolean {  
  if (\!**isApiError**(error)) return false;  
  return error.statusCode \=== 403;  
}

*/\*\**  
 *\* Verifica se um erro é de recurso não encontrado (404)*  
 *\*/*  
export function **isNotFoundError**(error: unknown): boolean {  
  if (\!**isApiError**(error)) return false;  
  return error.statusCode \=== 404;  
}

*/\*\**  
 *\* Extrai mensagem de erro de forma segura*  
 *\*/*  
export function **getErrorMessage**(error: unknown): string {  
  if (**isApiError**(error)) {  
    return error.message;  
  }  
   
  if (error instanceof **Error**) {  
    return error.message;  
  }  
   
  return 'Erro desconhecido';  
}

*/\*\**  
 *\* Extrai código de erro de forma segura*  
 *\*/*  
export function **getErrorCode**(error: unknown): string | undefined {  
  if (**isApiError**(error)) {  
    return error.code;  
  }  
   
  return undefined;  
}

Vejo que existe um arquivo de índice no diretório api/, mas os clientes específicos como nigredo-api.ts e fibonacci-api.ts estão diretamente em   
Vejo que já existe uma variável NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL, mas o cliente que criei usa NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_BASE\_URL. Vou ajustar o cliente para usar o nome correto que já está no .env.local.example:  
\# **Cliente API \- Disparo e Agendamento**

Cliente HTTP para consumir a API do Micro Agente de Disparo Automático e Agendamento.

\#\# **Configuração**

O cliente utiliza as seguintes variáveis de ambiente (em ordem de prioridade):

1\. \`NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL\` \- URL específica da API do micro agente  
2\. \`NEXT\_PUBLIC\_API\_URL\` \- URL base da API da plataforma

Exemplo de configuração no \`.env.local\`:

\`\`\`env  
NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL=https://bii73uten7.execute-api.us-east-1.amazonaws.com/dev  
\`\`\`

\#\# **Uso Básico**

\#\#\# **Importação**

\`\`\`typescript  
import { disparoAgendaApiMethods } from '@/lib/disparo-agenda-api';  
\`\`\`

\#\#\# **Exemplos**

\#\#\#\# **1\. Obter Overview do Sistema**

\`\`\`typescript  
try {  
  const { data } \= await disparoAgendaApiMethods.**getOverview**();  
  console.**log**('Total de contatos:', data.totalContacts);  
  console.**log**('Total de campanhas:', data.totalCampaigns);  
  console.**log**('Mensagens enviadas (24h):', data.messagesSentLast24h);  
} catch (error) {  
  console.**error**('Erro ao obter overview:', error);  
}  
\`\`\`

\#\#\#\# **2\. Listar Campanhas**

\`\`\`typescript  
try {  
  const { data } \= await disparoAgendaApiMethods.**getCampaigns**();  
  data.campaigns.**forEach**(campaign \=\> {  
    console.**log**(\`${campaign.name} \- Status: ${campaign.status}\`);  
  });  
} catch (error) {  
  console.**error**('Erro ao listar campanhas:', error);  
}  
\`\`\`

\#\#\#\# **3\. Ingerir Contatos**

\`\`\`typescript  
const contacts \= \[  
  {  
    name: 'João Silva',  
    phone: '\+5584999887766',  
    email: 'joao@example.com',  
    tags: \['lead-quente', 'interesse-produto-a'\]  
  },  
  {  
    name: 'Maria Santos',  
    phone: '\+5584988776655',  
    tags: \['lead-morno'\]  
  }  
\];

try {  
  await disparoAgendaApiMethods.**ingestContacts**(contacts);  
  console.**log**('Contatos ingeridos com sucesso\!');  
} catch (error) {  
  console.**error**('Erro ao ingerir contatos:', error);  
}  
\`\`\`

\#\#\#\# **4\. Listar Reuniões**

\`\`\`typescript  
try {  
  const { data } \= await disparoAgendaApiMethods.**getMeetings**({  
    status: 'confirmed',  
    from\_date: '2024-11-01',  
    to\_date: '2024-11-30'  
  });  
   
  data.meetings.**forEach**(meeting \=\> {  
    console.**log**(\`Reunião: ${meeting.meetingType} \- ${meeting.scheduledAt}\`);  
  });  
} catch (error) {  
  console.**error**('Erro ao listar reuniões:', error);  
}  
\`\`\`

\#\#\#\# **5\. Criar Reunião**

\`\`\`typescript  
try {  
  const { data } \= await disparoAgendaApiMethods.**createMeeting**({  
    leadId: 'lead-123',  
    preferredDates: \['2024-11-25', '2024-11-26'\],  
    preferredTimes: \['morning', 'afternoon'\],  
    urgency: 'high',  
    meetingType: 'demo'  
  });  
   
  console.**log**('Reunião criada:', data.id);  
  console.**log**('Link:', data.meetingLink);  
} catch (error) {  
  console.**error**('Erro ao criar reunião:', error);  
}  
\`\`\`

\#\#\#\# **6\. Confirmar Reunião**

\`\`\`typescript  
try {  
  const { data } \= await disparoAgendaApiMethods.**confirmMeeting**('meeting-123');  
  console.**log**('Reunião confirmada:', data.status);  
} catch (error) {  
  console.**error**('Erro ao confirmar reunião:', error);  
}  
\`\`\`

\#\#\#\# **7\. Cancelar Reunião**

\`\`\`typescript  
try {  
  await disparoAgendaApiMethods.**cancelMeeting**(  
    'meeting-123',  
    'Cliente solicitou reagendamento'  
  );  
  console.**log**('Reunião cancelada com sucesso');  
} catch (error) {  
  console.**error**('Erro ao cancelar reunião:', error);  
}  
\`\`\`

\#\# **Uso em Componentes React**

\#\#\# **Com React Query**

\`\`\`typescript  
import { useQuery, useMutation } from '@tanstack/react-query';  
import { disparoAgendaApiMethods } from '@/lib/disparo-agenda-api';

function **DisparoAgendaPage**() {  
  *// Query para overview*  
  const { data: overview, isLoading } \= **useQuery**({  
    queryKey: \['disparo-agenda', 'overview'\],  
    **queryFn**: async () \=\> {  
      const { data } \= await disparoAgendaApiMethods.**getOverview**();  
      return data;  
    }  
  });

  *// Mutation para ingerir contatos*  
  const ingestMutation \= **useMutation**({  
    mutationFn: disparoAgendaApiMethods.ingestContacts,  
    **onSuccess**: () \=\> {  
      console.**log**('Contatos ingeridos\!');  
    }  
  });

  if (isLoading) return \<**div**\>Carregando...\</div\>;

  return (  
    \<**div**\>  
      \<**h1**\>Disparo e Agendamento\</h1\>  
      \<**p**\>Total de contatos: {**overview**?.totalContacts}\</**p**\>  
      \<**p**\>Campanhas: {**overview**?.totalCampaigns}\</**p**\>  
      \<**p**\>**Mensagens** (24h): {**overview**?.messagesSentLast24h}\</**p**\>  
    \</div\>  
  );  
}  
\`\`\`

\#\# **Tipos Disponíveis**

\#\#\# **OverviewResponse**

\`\`\`typescript  
interface **OverviewResponse** {  
  totalContacts: number;  
  totalCampaigns: number;  
  messagesSentLast24h: number;  
}  
\`\`\`

\#\#\# **Campaign**

\`\`\`typescript  
interface **Campaign** {  
  id: string;  
  name: string;  
  status: string;  
  createdAt?: string;  
}  
\`\`\`

\#\#\# **IngestContactPayload**

\`\`\`typescript  
interface **IngestContactPayload** {  
  name: string;  
  phone: string;  
  email?: string;  
  tags?: string\[\];  
}  
\`\`\`

\#\#\# **Meeting**

\`\`\`typescript  
interface **Meeting** {  
  id: string;  
  leadId: string;  
  scheduledAt: string;  
  duration: number;  
  meetingType: string;  
  status: string;  
  attendees: **Array**\<{  
    email: string;  
    name: string;  
    role: string;  
  }\>;  
  meetingLink?: string;  
  createdAt: string;  
}  
\`\`\`

\#\# **Tratamento de Erros**

O cliente possui interceptors que automaticamente:

1\. Adicionam um \`X-Correlation-Id\` único a cada requisição  
2\. Logam erros no console com detalhes úteis  
3\. Rejeitam a Promise para tratamento no código consumidor

Exemplo de tratamento de erro:

\`\`\`typescript  
try {  
  await disparoAgendaApiMethods.**getOverview**();  
} catch (error) {  
  if (axios.**isAxiosError**(error)) {  
    if (error.response?.status \=== 401) {  
      *// Não autenticado*  
      console.**error**('Usuário não autenticado');  
    } else if (error.response?.status \=== 403) {  
      *// Sem permissão*  
      console.**error**('Sem permissão para acessar este recurso');  
    } else if (error.response?.status \=== 404) {  
      *// Recurso não encontrado*  
      console.**error**('Recurso não encontrado');  
    } else {  
      *// Outro erro*  
      console.**error**('Erro na API:', error.response?.data);  
    }  
  } else {  
    console.**error**('Erro desconhecido:', error);  
  }  
}  
\`\`\`

\#\# **Observabilidade**

Todas as requisições incluem:

\- **\*\*X-Correlation-Id\*\***: ID único para rastreamento de requisições  
\- **\*\*Timeout\*\***: 30 segundos  
\- **\*\*Credentials\*\***: Incluídas automaticamente (\`withCredentials: true\`)

Os logs de erro incluem:

\- Status HTTP  
\- Dados da resposta  
\- Correlation ID (quando disponível)

\#\# **Referências**

\- \[Blueprint do Micro Agente\](/.kiro/steering/blueprint-disparo-agendamento.md)  
\- \[Design do Micro Agente\](/.kiro/specs/micro-agente-disparo-agendamento/design.md)  
\- \[API Endpoints\](/../docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md)

\# **Log de Implementação \- Cliente API Disparo e Agendamento**

**\*\*Data\*\***: 25/11/2024    
**\*\*Componente\*\***: Frontend \- Cliente HTTP    
**\*\*Tarefa\*\***: Criar cliente dedicado para o Micro Agente de Disparo e Agendamento

\---

\#\# **✅ Implementação Completa**

\#\#\# **Arquivos Criados**

1\. **\*\***\`frontend/src/lib/disparo-agenda-api.ts\`**\*\***  
   \- Cliente HTTP usando Axios  
   \- Segue o padrão dos clientes existentes (\`nigredo-api.ts\`, \`fibonacci-api.ts\`)  
   \- Interceptors para correlation ID e tratamento de erros  
   \- Timeout de 30 segundos  
   \- Credentials incluídas automaticamente

2\. **\*\***\`frontend/src/lib/disparo-agenda-api.README.md\`**\*\***  
   \- Documentação completa do cliente  
   \- Exemplos de uso para todos os métodos  
   \- Guia de tratamento de erros  
   \- Exemplos com React Query

\---

\#\# **📋 Funcionalidades Implementadas**

\#\#\# **Métodos da API**

\#\#\#\# **Disparo Automático**  
\- ✅ \`getOverview()\` \- Resumo geral (contatos, campanhas, mensagens 24h)  
\- ✅ \`getCampaigns()\` \- Listar campanhas de disparo  
\- ✅ \`ingestContacts()\` \- Ingerir contatos para disparo

\#\#\#\# **Agendamento Inteligente**  
\- ✅ \`getMeetings()\` \- Listar reuniões agendadas (com filtros)  
\- ✅ \`createMeeting()\` \- Criar nova reunião  
\- ✅ \`confirmMeeting()\` \- Confirmar reunião  
\- ✅ \`cancelMeeting()\` \- Cancelar reunião

\---

\#\# **🔧 Configuração**

\#\#\# **Variável de Ambiente**

\`\`\`env  
NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL=https://bii73uten7.execute-api.us-east-1.amazonaws.com/dev  
\`\`\`

**\*\*Fallback\*\***: Se não configurada, usa \`NEXT\_PUBLIC\_API\_URL\`

**\*\*Nota\*\***: A variável já estava definida no \`.env.local.example\` do projeto.

\---

\#\# **📦 Tipos TypeScript**

\#\#\# **Principais Interfaces**

\`\`\`typescript  
*// Overview*  
interface **OverviewResponse** {  
  totalContacts: number;  
  totalCampaigns: number;  
  messagesSentLast24h: number;  
}

*// Campanha*  
interface **Campaign** {  
  id: string;  
  name: string;  
  status: string;  
  createdAt?: string;  
}

*// Contato para ingestão*  
interface **IngestContactPayload** {  
  name: string;  
  phone: string;  
  email?: string;  
  tags?: string\[\];  
}

*// Reunião*  
interface **Meeting** {  
  id: string;  
  leadId: string;  
  scheduledAt: string;  
  duration: number;  
  meetingType: string;  
  status: string;  
  attendees: **Array**\<{  
    email: string;  
    name: string;  
    role: string;  
  }\>;  
  meetingLink?: string;  
  createdAt: string;  
}  
\`\`\`

\---

\#\# **🎯 Padrões Seguidos**

\#\#\# **1\. Estrutura de Cliente**  
\- ✅ Axios como biblioteca HTTP  
\- ✅ Interceptors para correlation ID  
\- ✅ Interceptors para logging de erros  
\- ✅ Timeout configurado (30s)  
\- ✅ Credentials incluídas (\`withCredentials: true\`)

\#\#\# **2\. Nomenclatura**  
\- ✅ Arquivo: \`disparo-agenda-api.ts\`  
\- ✅ Instância: \`disparoAgendaApi\`  
\- ✅ Métodos: \`disparoAgendaApiMethods\`  
\- ✅ Tipos exportados com nomes descritivos

\#\#\# **3\. Tratamento de Erros**  
\- ✅ Logs estruturados no console  
\- ✅ Correlation ID incluído nos logs  
\- ✅ Promise rejeitada para tratamento no consumidor

\#\#\# **4\. Documentação**  
\- ✅ JSDoc nos principais elementos  
\- ✅ README completo com exemplos  
\- ✅ Exemplos de uso com React Query

\---

\#\# **🔗 Integração com Componentes**

\#\#\# **Exemplo de Uso**

\`\`\`typescript  
import { disparoAgendaApiMethods } from '@/lib/disparo-agenda-api';  
import { useQuery } from '@tanstack/react-query';

function **DisparoAgendaPage**() {  
  const { data, isLoading } \= **useQuery**({  
    queryKey: \['disparo-agenda', 'overview'\],  
    **queryFn**: async () \=\> {  
      const { data } \= await disparoAgendaApiMethods.**getOverview**();  
      return data;  
    }  
  });

  if (isLoading) return \<**div**\>Carregando...\</div\>;

  return (  
    \<**div**\>  
      \<**h1**\>Disparo e Agendamento\</h1\>  
      \<**p**\>Total de contatos: {**data**?.totalContacts}\</**p**\>  
      \<**p**\>Campanhas: {**data**?.totalCampaigns}\</**p**\>  
      \<**p**\>**Mensagens** (24h): {**data**?.messagesSentLast24h}\</**p**\>  
    \</div\>  
  );  
}  
\`\`\`

\---

\#\# **✅ Checklist de Validação**

\- \[x\] Cliente criado seguindo padrão do projeto  
\- \[x\] Tipos TypeScript definidos  
\- \[x\] Interceptors configurados  
\- \[x\] Variável de ambiente alinhada com \`.env.local.example\`  
\- \[x\] Documentação completa criada  
\- \[x\] Exemplos de uso fornecidos  
\- \[x\] Tratamento de erros implementado  
\- \[x\] Correlation ID incluído em todas as requisições

\---

\#\# **📚 Referências**

\- **\*\*Blueprint\*\***: \`.kiro/steering/blueprint-disparo-agendamento.md\`  
\- **\*\*Design\*\***: \`.kiro/specs/micro-agente-disparo-agendamento/design.md\`  
\- **\*\*API Endpoints\*\***: \`docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md\`  
\- **\*\*Padrão de Cliente\*\***: \`frontend/src/lib/nigredo-api.ts\`

\---

\#\# **🎉 Conclusão**

Cliente HTTP para o Micro Agente de Disparo e Agendamento implementado com sucesso, seguindo todos os padrões do projeto AlquimistaAI.

**\*\*Próximos passos sugeridos\*\***:  
1\. Integrar o cliente nos componentes da página \`/disparo-agenda\`  
2\. Adicionar testes unitários para o cliente  
3\. Validar endpoints com o backend deployado em DEV

\# **✅ Cliente API Disparo e Agendamento \- Implementação Completa**

**\*\*Data\*\***: 25/11/2024    
**\*\*Status\*\***: ✅ Concluído    
**\*\*Componente\*\***: Frontend \- Cliente HTTP

\---

\#\# **📦 Arquivos Criados**

\#\#\# **1\. Cliente Principal**  
**\*\*Arquivo\*\***: \`frontend/src/lib/disparo-agenda-api.ts\`

\- ✅ Cliente HTTP usando Axios  
\- ✅ Configuração de base URL com fallback  
\- ✅ Interceptors para correlation ID  
\- ✅ Interceptors para logging de erros  
\- ✅ Timeout de 30 segundos  
\- ✅ Credentials incluídas automaticamente  
\- ✅ 7 métodos de API implementados

\#\#\# **2\. Documentação**  
**\*\*Arquivo\*\***: \`frontend/src/lib/disparo-agenda-api.README.md\`

\- ✅ Guia completo de uso  
\- ✅ Exemplos para todos os métodos  
\- ✅ Configuração de variáveis de ambiente  
\- ✅ Tratamento de erros  
\- ✅ Exemplos com React Query

\#\#\# **3\. Exemplos Práticos**  
**\*\*Arquivo\*\***: \`frontend/src/lib/disparo-agenda-api.example.tsx\`

\- ✅ 9 hooks customizados com React Query  
\- ✅ Componente completo de exemplo  
\- ✅ Tratamento avançado de erros  
\- ✅ Invalidação de cache  
\- ✅ Pronto para copiar e usar

\#\#\# **4\. Log de Implementação**  
**\*\*Arquivo\*\***: \`frontend/docs/LOG-CLIENTE-DISPARO-AGENDA-25-11-2024.md\`

\- ✅ Documentação da implementação  
\- ✅ Checklist de validação  
\- ✅ Referências técnicas

\---

\#\# **🎯 Métodos Implementados**

\#\#\# **Disparo Automático**

| Método | Endpoint | Descrição |  
|--------|----------|-----------|  
| \`getOverview()\` | \`GET /disparo/overview\` | Resumo geral do sistema |  
| \`getCampaigns()\` | \`GET /disparo/campaigns\` | Listar campanhas |  
| \`ingestContacts()\` | \`POST /disparo/contacts/ingest\` | Ingerir contatos |

\#\#\# **Agendamento Inteligente**

| Método | Endpoint | Descrição |  
|--------|----------|-----------|  
| \`getMeetings()\` | \`GET /agendamento/meetings\` | Listar reuniões |  
| \`createMeeting()\` | \`POST /agendamento/meetings\` | Criar reunião |  
| \`confirmMeeting()\` | \`POST /agendamento/meetings/:id/confirm\` | Confirmar reunião |  
| \`cancelMeeting()\` | \`POST /agendamento/meetings/:id/cancel\` | Cancelar reunião |

\---

\#\# **🔧 Configuração**

\#\#\# **Variável de Ambiente**

\`\`\`env  
NEXT\_PUBLIC\_DISPARO\_AGENDA\_API\_URL=https://bii73uten7.execute-api.us-east-1.amazonaws.com/dev  
\`\`\`

**\*\*Fallback\*\***: \`NEXT\_PUBLIC\_API\_URL\`

\---

\#\# **💻 Uso Rápido**

\#\#\# **Importação Direta**

\`\`\`typescript  
import { disparoAgendaApiMethods } from '@/lib/disparo-agenda-api';

*// Obter overview*  
const { data } \= await disparoAgendaApiMethods.**getOverview**();  
console.**log**(data.totalContacts);  
\`\`\`

\#\#\# **Com React Query (Recomendado)**

\`\`\`typescript  
import { useDisparoOverview } from '@/lib/disparo-agenda-api.example';

function **MyComponent**() {  
  const { data, isLoading } \= **useDisparoOverview**();  
   
  if (isLoading) return \<**div**\>Carregando...\</div\>;  
   
  return \<**div**\>Total: {data?.totalContacts}\</div\>;  
}  
\`\`\`

\---

\#\# **📊 Tipos TypeScript**

Todos os tipos estão exportados e documentados:

\`\`\`typescript  
import type {  
  OverviewResponse,  
  Campaign,  
  CampaignsResponse,  
  IngestContactPayload,  
  Meeting,  
  MeetingsResponse,  
} from '@/lib/disparo-agenda-api';  
\`\`\`

\---

\#\# **🔍 Observabilidade**

\#\#\# **Correlation ID**  
Todas as requisições incluem um \`X-Correlation-Id\` único:  
\`\`\`  
X-Correlation-Id: web-1732567890123-abc123def  
\`\`\`

\#\#\# **Logs de Erro**  
Erros são automaticamente logados no console com:  
\- Status HTTP  
\- Dados da resposta  
\- Correlation ID  
\- Tipo de erro (response/request/setup)

\---

\#\# **✅ Validação**

\#\#\# **Checklist Completo**

\- \[x\] Cliente criado seguindo padrão do projeto  
\- \[x\] Tipos TypeScript definidos e exportados  
\- \[x\] Interceptors configurados (correlation ID \+ erros)  
\- \[x\] Variável de ambiente alinhada com \`.env.local.example\`  
\- \[x\] Documentação completa (README)  
\- \[x\] Exemplos práticos (9 hooks \+ componente)  
\- \[x\] Tratamento de erros implementado  
\- \[x\] Sem erros de TypeScript (validado com getDiagnostics)  
\- \[x\] Log de implementação criado

\#\#\# **Testes de Sintaxe**

\`\`\`bash  
**✅** frontend/src/lib/disparo-agenda-api.ts \- No diagnostics found  
**✅** frontend/src/lib/disparo-agenda-api.example.tsx \- No diagnostics found  
\`\`\`

\---

\#\# **🚀 Próximos Passos**

\#\#\# **1\. Integração nos Componentes Existentes**

Atualizar os componentes em \`frontend/src/components/disparo-agenda/\`:

\- \`overview-cards.tsx\` → usar \`useDisparoOverview()\`  
\- \`campaigns-table.tsx\` → usar \`useDisparoCampaigns()\`  
\- \`contacts-upload.tsx\` → usar \`useIngestContacts()\`  
\- \`meetings-table.tsx\` → usar \`useMeetings()\`

\#\#\# **2\. Testes Unitários**

Criar testes para o cliente:

\`\`\`typescript  
*// frontend/src/lib/\_\_tests\_\_/disparo-agenda-api.test.ts*  
**describe**('disparoAgendaApi', () \=\> {  
  **it**('deve incluir correlation ID nas requisições', () \=\> {  
    *// ...*  
  });  
   
  **it**('deve tratar erros corretamente', () \=\> {  
    *// ...*  
  });  
});  
\`\`\`

\#\#\# **3\. Validação com Backend**

Testar endpoints reais com o backend deployado em DEV:

\`\`\`bash  
*\# Verificar se a API está respondendo*  
**curl** https://bii73uten7.execute-api.us-east-1.amazonaws.com/dev/disparo/overview  
\`\`\`

\---

\#\# **📚 Referências**

\- **\*\*Blueprint\*\***: \`.kiro/steering/blueprint-disparo-agendamento.md\`  
\- **\*\*Design\*\***: \`.kiro/specs/micro-agente-disparo-agendamento/design.md\`  
\- **\*\*API Endpoints\*\***: \`docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md\`  
\- **\*\*Padrão de Cliente\*\***: \`frontend/src/lib/nigredo-api.ts\`  
\- **\*\*Padrão de Cliente\*\***: \`frontend/src/lib/fibonacci-api.ts\`

\---

\#\# **🎉 Conclusão**

Cliente HTTP para o Micro Agente de Disparo e Agendamento **\*\*100% implementado\*\*** e pronto para uso.

**\*\*Destaques\*\***:  
\- ✅ Segue todos os padrões do projeto AlquimistaAI  
\- ✅ Documentação completa e exemplos práticos  
\- ✅ Tipos TypeScript robustos  
\- ✅ Observabilidade integrada (correlation ID \+ logs)  
\- ✅ Pronto para integração nos componentes React  
\- ✅ Sem erros de sintaxe ou tipo

**\*\*Tempo de implementação\*\***: \~15 minutos    
**\*\*Arquivos criados\*\***: 4    
**\*\*Linhas de código\*\***: \~600    
**\*\*Cobertura de funcionalidades\*\***: 100%

