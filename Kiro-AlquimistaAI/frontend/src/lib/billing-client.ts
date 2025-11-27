import {
  SubscriptionSummary,
  CheckoutSessionResponse,
  CreateCheckoutRequest,
  CreateCheckoutRequestSchema,
} from '@/types/billing';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Classe de erro customizada para erros de billing
export class BillingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

// Função auxiliar para retry com backoff exponencial
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Se a resposta for bem-sucedida ou erro do cliente (4xx), não fazer retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Para erros de servidor (5xx), fazer retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
    }

    // Aguardar antes de tentar novamente (backoff exponencial)
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new BillingError(
    'Erro de conexão. Tente novamente.',
    'NETWORK_ERROR',
    0
  );
}

// Buscar dados da assinatura atual do tenant
export async function getSubscription(
  tenantId: string
): Promise<SubscriptionSummary> {
  if (!tenantId) {
    throw new BillingError(
      'tenantId é obrigatório',
      'VALIDATION_ERROR',
      400
    );
  }

  try {
    const url = `${API_BASE_URL}/api/billing/subscription?tenantId=${encodeURIComponent(tenantId)}`;
    
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        throw new BillingError(
          'Assinatura não encontrada',
          'NOT_FOUND',
          404
        );
      }

      throw new BillingError(
        errorData.message || 'Erro ao buscar assinatura',
        errorData.error || 'API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    return data as SubscriptionSummary;
  } catch (error) {
    if (error instanceof BillingError) {
      throw error;
    }

    throw new BillingError(
      'Erro ao carregar dados. Tente novamente.',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// Criar sessão de checkout no Stripe
export async function createCheckoutSession(
  request: CreateCheckoutRequest
): Promise<CheckoutSessionResponse> {
  // Validar dados de entrada
  try {
    CreateCheckoutRequestSchema.parse(request);
  } catch (error: any) {
    throw new BillingError(
      error.errors?.[0]?.message || 'Dados inválidos',
      'VALIDATION_ERROR',
      400
    );
  }

  try {
    const url = `${API_BASE_URL}/api/billing/create-checkout-session`;
    
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 400) {
        throw new BillingError(
          errorData.message || 'Dados inválidos',
          errorData.error || 'VALIDATION_ERROR',
          400
        );
      }

      if (response.status === 404) {
        throw new BillingError(
          'Tenant não encontrado',
          'NOT_FOUND',
          404
        );
      }

      throw new BillingError(
        errorData.message || 'Erro ao criar sessão de checkout',
        errorData.error || 'API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    return data as CheckoutSessionResponse;
  } catch (error) {
    if (error instanceof BillingError) {
      throw error;
    }

    throw new BillingError(
      'Erro ao processar pagamento. Tente novamente.',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// Cliente de billing com todas as funções
export const billingClient = {
  getSubscription,
  createCheckoutSession,
};

export default billingClient;
