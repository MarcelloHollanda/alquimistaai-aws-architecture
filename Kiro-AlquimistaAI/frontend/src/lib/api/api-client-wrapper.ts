/**
 * Wrapper para clients HTTP com tratamento de erros integrado
 * Adiciona retry automático e classificação de erros
 */

import { withRetry, classifyError, AppError } from '@/lib/error-handler';

export interface ApiClientOptions {
  baseUrl: string;
  maxRetries?: number;
  retryDelayMs?: number;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions extends RequestInit {
  token?: string;
  skipRetry?: boolean;
}

/**
 * Cliente HTTP com tratamento de erros e retry automático
 */
export class ApiClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelayMs: number;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.defaultHeaders = options.defaultHeaders || {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Faz requisição GET com retry automático
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Faz requisição POST com retry automático
   */
  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Faz requisição PUT com retry automático
   */
  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Faz requisição DELETE com retry automático
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Requisição genérica com tratamento de erros
   */
  private async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers,
    };

    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });

        // Processar resposta
        return await this.handleResponse<T>(response);
      } catch (error) {
        // Classificar e lançar erro estruturado
        throw this.transformError(error);
      }
    };

    // Se skipRetry for true, não fazer retry
    if (options?.skipRetry) {
      return fetchFn();
    }

    // Fazer requisição com retry automático
    return withRetry(fetchFn, {
      maxRetries: this.maxRetries,
      delayMs: this.retryDelayMs,
      showToast: false, // Deixar componente decidir se mostra toast
    });
  }

  /**
   * Processa resposta HTTP
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Se resposta OK, retornar JSON
    if (response.ok) {
      // Se resposta vazia (204), retornar objeto vazio
      if (response.status === 204) {
        return {} as T;
      }
      return await response.json();
    }

    // Tentar extrair mensagem de erro do body
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignorar erro de parsing
    }

    // Lançar erro com informações estruturadas
    throw {
      response: {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      },
      message: errorData.message || response.statusText,
    };
  }

  /**
   * Transforma erro em AppError estruturado
   */
  private transformError(error: any): AppError {
    return classifyError(error);
  }
}

/**
 * Cria instância do cliente para APIs de Tenant
 */
export function createTenantClient(): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
      : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

  return new ApiClient({
    baseUrl,
    maxRetries: 3,
    retryDelayMs: 1000,
  });
}

/**
 * Cria instância do cliente para APIs Internas
 */
export function createInternalClient(): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
      : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

  return new ApiClient({
    baseUrl,
    maxRetries: 3,
    retryDelayMs: 1000,
  });
}
