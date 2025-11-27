/**
 * Disparo e Agendamento API Client
 * Cliente HTTP para consumir a API do Micro Agente de Disparo Automático e Agendamento
 */

import axios from 'axios';

const DISPARO_AGENDA_API_BASE_URL =
  process.env.NEXT_PUBLIC_DISPARO_AGENDA_API_URL ||
  process.env.NEXT_PUBLIC_API_URL;

if (!DISPARO_AGENDA_API_BASE_URL) {
  // Evita quebrar o build; loga erro para diagnóstico em runtime
  // eslint-disable-next-line no-console
  console.error(
    '[DisparoAgendaAPI] NEXT_PUBLIC_DISPARO_AGENDA_API_URL / NEXT_PUBLIC_API_URL não configuradas.',
  );
}

export const disparoAgendaApi = axios.create({
  baseURL: DISPARO_AGENDA_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true,
});

// Request interceptor para adicionar correlation ID
disparoAgendaApi.interceptors.request.use((config) => {
  const correlationId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  config.headers['X-Correlation-Id'] = correlationId;
  return config;
});

// Response interceptor para tratamento de erros
disparoAgendaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('Disparo/Agenda API Error:', {
        status: error.response.status,
        data: error.response.data,
        correlationId: error.response.headers['x-correlation-id'],
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Disparo/Agenda API No Response:', error.request);
    } else {
      // Error setting up request
      console.error('Disparo/Agenda API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Types
export interface OverviewResponse {
  totalContacts: number;
  totalCampaigns: number;
  messagesSentLast24h: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt?: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
}

export interface IngestContactPayload {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
}

export interface IngestContactsRequest {
  contacts: IngestContactPayload[];
}

export interface Meeting {
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

export interface MeetingsResponse {
  meetings: Meeting[];
}

// API Methods
export const disparoAgendaApiMethods = {
  // Overview - Resumo geral do sistema
  getOverview: () => 
    disparoAgendaApi.get<OverviewResponse>('/disparo/overview'),

  // Campanhas - Listar campanhas de disparo
  getCampaigns: () => 
    disparoAgendaApi.get<CampaignsResponse>('/disparo/campaigns'),

  // Contatos - Ingestão de contatos para disparo
  ingestContacts: (contacts: IngestContactPayload[]) => 
    disparoAgendaApi.post<void>('/disparo/contacts/ingest', { contacts }),

  // Reuniões - Listar reuniões agendadas
  getMeetings: (params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
  }) => 
    disparoAgendaApi.get<MeetingsResponse>('/agendamento/meetings', { params }),

  // Reuniões - Criar nova reunião
  createMeeting: (data: {
    leadId: string;
    preferredDates?: string[];
    preferredTimes?: ('morning' | 'afternoon' | 'evening')[];
    urgency: 'high' | 'medium' | 'low';
    meetingType: 'demo' | 'discovery' | 'negotiation' | 'closing';
  }) => 
    disparoAgendaApi.post<Meeting>('/agendamento/meetings', data),

  // Reuniões - Confirmar reunião
  confirmMeeting: (meetingId: string) => 
    disparoAgendaApi.post<Meeting>(`/agendamento/meetings/${meetingId}/confirm`),

  // Reuniões - Cancelar reunião
  cancelMeeting: (meetingId: string, reason?: string) => 
    disparoAgendaApi.post<void>(`/agendamento/meetings/${meetingId}/cancel`, { reason }),
};

export default disparoAgendaApi;
