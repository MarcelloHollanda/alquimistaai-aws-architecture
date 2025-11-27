/**
 * Nigredo API Client
 * Cliente HTTP para consumir a API do Nigredo Prospecting Core
 */

import axios from 'axios';

const NIGREDO_API_BASE_URL =
  process.env.NEXT_PUBLIC_NIGREDO_API_BASE_URL ||
  process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

if (!NIGREDO_API_BASE_URL) {
  throw new Error('[NigredoApi] Nenhuma base URL configurada. Verifique variáveis de ambiente.');
}

export const nigredoApi = axios.create({
  baseURL: NIGREDO_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor para adicionar correlation ID
nigredoApi.interceptors.request.use((config) => {
  const correlationId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  config.headers['X-Correlation-Id'] = correlationId;
  return config;
});

// Response interceptor para tratamento de erros
nigredoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('Nigredo API Error:', {
        status: error.response.status,
        data: error.response.data,
        correlationId: error.response.headers['x-correlation-id'],
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Nigredo API No Response:', error.request);
    } else {
      // Error setting up request
      console.error('Nigredo API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Types
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source?: string;
  utm_params?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedLeads {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface WebhookLog {
  id: string;
  webhook_url: string;
  status_code: number | null;
  attempt_number: number;
  success: boolean;
  error_message: string | null;
  sent_at: string;
}

export interface LeadDetail {
  lead: Lead;
  webhook_history: WebhookLog[];
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface CreateLeadResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    createdAt: string;
  };
}

// API Methods
export const nigredoApiMethods = {
  // Health check
  health: () => nigredoApi.get('/health'),

  // Create lead (public endpoint)
  createLead: (data: CreateLeadRequest) => 
    nigredoApi.post<CreateLeadResponse>('/api/leads', data),

  // List leads (protected endpoint)
  listLeads: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }) => nigredoApi.get<PaginatedLeads>('/api/leads', { params }),

  // Get lead details (protected endpoint)
  getLead: (id: string) => 
    nigredoApi.get<LeadDetail>(`/api/leads/${id}`),
};

export default nigredoApi;
