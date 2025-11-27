/**
 * API Client para Alquimista.AI Backend
 * Integração com AWS API Gateway + Cognito
 */

// URLs reais da AWS - SOLUÇÃO DEFINITIVA
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

// Validação explícita da base URL
if (!API_BASE_URL) {
  throw new Error(
    '[ApiClient] NEXT_PUBLIC_API_URL não definido e fallback não pôde ser aplicado. Verifique o .env.local / .env.production.'
  );
}

// Log da base URL em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('[ApiClient] Base URL configurada:', API_BASE_URL);
}

interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: 'Request failed',
          statusCode: response.status,
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Health Check
  async healthCheck() {
    return this.request<{ ok: boolean }>('/health');
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Agents
  async listAgents() {
    return this.request<any[]>('/api/agents');
  }

  async getAgent(id: string) {
    return this.request<any>(`/api/agents/${id}`);
  }

  async activateAgent(id: string) {
    return this.request<any>(`/api/agents/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateAgent(id: string) {
    return this.request<any>(`/api/agents/${id}/deactivate`, {
      method: 'POST',
    });
  }

  async getAgentMetrics(id: string) {
    return this.request<any>(`/api/agents/${id}/metrics`);
  }

  // Leads (Nigredo)
  async listLeads(filters?: any) {
    const query = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<any[]>(`/api/leads${query}`);
  }

  async getLead(id: string) {
    return this.request<any>(`/api/leads/${id}`);
  }

  async createLead(data: any) {
    return this.request<any>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: any) {
    return this.request<any>(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Campaigns
  async listCampaigns() {
    return this.request<any[]>('/api/campaigns');
  }

  async getCampaign(id: string) {
    return this.request<any>(`/api/campaigns/${id}`);
  }

  async createCampaign(data: any) {
    return this.request<any>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Analytics
  async getAnalytics(period: string = '7d') {
    return this.request<any>(`/api/analytics?period=${period}`);
  }

  async getFunnelMetrics() {
    return this.request<any>('/api/analytics/funnel');
  }

  async getAgentPerformance() {
    return this.request<any>('/api/analytics/agents');
  }

  // Events (EventBridge)
  async publishEvent(eventType: string, detail: any) {
    return this.request<any>('/events', {
      method: 'POST',
      body: JSON.stringify({
        source: 'frontend',
        type: eventType,
        detail,
      }),
    });
  }

  // Permissions
  async checkPermission(action: string, resource: string) {
    return this.request<{ allowed: boolean }>('/api/permissions/check', {
      method: 'POST',
      body: JSON.stringify({ action, resource }),
    });
  }

  // Audit Logs
  async getAuditLogs(filters?: any) {
    const query = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<any[]>(`/api/audit-logs${query}`);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;
