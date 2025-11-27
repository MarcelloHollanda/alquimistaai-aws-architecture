/**
 * Cliente HTTP para API do Micro Agente de Disparo & Agendamento
 * 
 * Endpoints:
 * - GET /disparo/overview - Contadores agregados
 * - GET /disparo/campaigns - Lista campanhas
 * - POST /disparo/contacts/ingest - Envia lote de contatos
 * - GET /agendamento/meetings - Lista reuniões
 * 
 * Configuração:
 * - Variável de ambiente: NEXT_PUBLIC_DISPARO_AGENDA_API_URL
 * - Fallback: NEXT_PUBLIC_API_URL
 * 
 * Exemplo de URL:
 * - DEV: https://abc123.execute-api.us-east-1.amazonaws.com
 * - PROD: https://xyz789.execute-api.us-east-1.amazonaws.com
 */

const DISPARO_AGENDA_API_BASE_URL =
  process.env.NEXT_PUBLIC_DISPARO_AGENDA_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  '';

// Flag para habilitar/desabilitar stubs (útil para desenvolvimento sem backend)
const USE_STUBS = !DISPARO_AGENDA_API_BASE_URL || DISPARO_AGENDA_API_BASE_URL === '';

/**
 * Constrói URL completa para um endpoint
 * @param path - Caminho do endpoint (ex: '/disparo/overview')
 * @returns URL completa
 */
function buildUrl(path: string): string {
  if (!DISPARO_AGENDA_API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_DISPARO_AGENDA_API_URL não configurada');
  }
  const base = DISPARO_AGENDA_API_BASE_URL.replace(/\/$/, '');
  const endpoint = path.replace(/^\//, '');
  return `${base}/${endpoint}`;
}

interface OverviewData {
  contactsInQueue: number;
  messagesSentToday: number;
  meetingsScheduled: number;
  meetingsConfirmed: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'paused' | 'completed';
  channel: 'whatsapp' | 'email' | 'sms';
  messagesSent: number;
  messagesTotal: number;
  nextRun?: string;
}

interface Meeting {
  id: string;
  leadName: string;
  leadCompany: string;
  scheduledAt: string;
  duration: number;
  meetingType: string;
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  meetingLink?: string;
}

interface ContactUploadPayload {
  contacts: Array<{
    company: string;
    contactName: string;
    phone: string;
    email: string;
    notes?: string;
  }>;
}

class DisparoAgendaApi {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const url = buildUrl(endpoint);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Busca contadores agregados (overview)
   */
  async getOverview(): Promise<OverviewData> {
    if (USE_STUBS) {
      // Stub para desenvolvimento sem backend
      console.warn('[disparo-agenda-api] Usando stub para getOverview (NEXT_PUBLIC_DISPARO_AGENDA_API_URL não configurada)');
      return {
        contactsInQueue: 0,
        messagesSentToday: 0,
        meetingsScheduled: 0,
        meetingsConfirmed: 0,
      };
    }
    
    return this.fetchWithAuth('/disparo/overview');
  }

  /**
   * Lista campanhas ativas e recentes
   */
  async listCampaigns(): Promise<Campaign[]> {
    if (USE_STUBS) {
      console.warn('[disparo-agenda-api] Usando stub para listCampaigns (NEXT_PUBLIC_DISPARO_AGENDA_API_URL não configurada)');
      return [];
    }
    
    return this.fetchWithAuth('/disparo/campaigns');
  }

  /**
   * Envia lote de contatos para ingestão
   */
  async uploadContacts(payload: ContactUploadPayload): Promise<{ success: boolean; message: string }> {
    if (USE_STUBS) {
      console.warn('[disparo-agenda-api] Usando stub para uploadContacts (NEXT_PUBLIC_DISPARO_AGENDA_API_URL não configurada)');
      console.log('Upload de contatos (stub):', payload);
      return {
        success: true,
        message: `${payload.contacts.length} contatos enviados para processamento`,
      };
    }
    
    return this.fetchWithAuth('/disparo/contacts/ingest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Lista reuniões agendadas
   */
  async listMeetings(): Promise<Meeting[]> {
    if (USE_STUBS) {
      console.warn('[disparo-agenda-api] Usando stub para listMeetings (NEXT_PUBLIC_DISPARO_AGENDA_API_URL não configurada)');
      return [];
    }
    
    return this.fetchWithAuth('/agendamento/meetings');
  }
}

// Exportar instância singleton
export const disparoAgendaApi = new DisparoAgendaApi();
