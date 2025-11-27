/**
 * Fibonacci API Client
 * 
 * Cliente HTTP para consumir a API do Fibonacci Orquestrador
 * Usa axios com configuração base e interceptors
 */

import axios, { AxiosError } from 'axios';

// Base URL da API Fibonacci (configurada por ambiente)
const FIBONACCI_API_BASE_URL =
  process.env.NEXT_PUBLIC_FIBONACCI_API_BASE_URL ||
  process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

if (!FIBONACCI_API_BASE_URL) {
  throw new Error('[FibonacciApi] Nenhuma base URL configurada. Verifique variáveis de ambiente.');
}

/**
 * Cliente axios configurado para Fibonacci API
 */
export const fibonacciApi = axios.create({
  baseURL: FIBONACCI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

/**
 * Interceptor de request para adicionar token de autenticação
 */
fibonacciApi.interceptors.request.use(
  (config) => {
    // TODO: Adicionar token JWT quando implementar autenticação
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response para tratamento de erros
 */
fibonacciApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log de erro para debugging
    console.error('Fibonacci API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Tratamento específico por status code
    if (error.response?.status === 401) {
      // TODO: Redirecionar para login
      console.warn('Unauthorized - redirect to login');
    }

    return Promise.reject(error);
  }
);

/**
 * Tipos de resposta da API
 */
export interface FibonacciHealthResponse {
  ok: boolean;
  service: string;
  environment: string;
  db_status: 'connected' | 'disconnected';
  timestamp: string;
}

export interface FibonacciMetricsResponse {
  total_events: number;
  active_integrations: number;
  total_leads_processed: number;
  uptime_seconds: number;
  last_event_at: string | null;
}

export interface FibonacciIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'event';
  status: 'active' | 'inactive' | 'error';
  description: string;
  last_activity: string | null;
}

/**
 * Funções de API
 */

/**
 * Verifica o status de saúde da API Fibonacci
 */
export async function getFibonacciHealth(): Promise<FibonacciHealthResponse> {
  const response = await fibonacciApi.get<FibonacciHealthResponse>('/health');
  return response.data;
}

/**
 * Obtém métricas gerais do Fibonacci
 */
export async function getFibonacciMetrics(): Promise<FibonacciMetricsResponse> {
  const response = await fibonacciApi.get<FibonacciMetricsResponse>('/api/metrics');
  return response.data;
}

/**
 * Lista todas as integrações do Fibonacci
 */
export async function getFibonacciIntegrations(): Promise<FibonacciIntegration[]> {
  const response = await fibonacciApi.get<{ integrations: FibonacciIntegration[] }>('/api/integrations');
  return response.data.integrations;
}

/**
 * Obtém detalhes de uma integração específica
 */
export async function getFibonacciIntegration(id: string): Promise<FibonacciIntegration> {
  const response = await fibonacciApi.get<FibonacciIntegration>(`/api/integrations/${id}`);
  return response.data;
}

/**
 * Testa conectividade com a API Fibonacci
 */
export async function testFibonacciConnection(): Promise<boolean> {
  try {
    await getFibonacciHealth();
    return true;
  } catch (error) {
    console.error('Failed to connect to Fibonacci API:', error);
    return false;
  }
}
