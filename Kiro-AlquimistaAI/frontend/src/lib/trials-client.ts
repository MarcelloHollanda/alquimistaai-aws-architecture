import { apiClient } from './api-client';

export interface TrialStartRequest {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
}

export interface TrialStartResponse {
  trialId: string;
  startedAt: string;
  expiresAt: string;
  remainingTokens: number;
}

export interface TrialInvokeRequest {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  message: string;
}

export interface TrialInvokeResponse {
  response: string;
  remainingTokens: number;
  expiresAt: string;
}

export interface TrialInvokeError {
  error: string;
  message: string;
}

/**
 * Inicia um trial para um agente ou SubNúcleo
 */
export async function startTrial(
  request: TrialStartRequest
): Promise<TrialStartResponse> {
  try {
    const response = await apiClient.post<TrialStartResponse>(
      '/api/trials/start',
      request
    );
    return response;
  } catch (error) {
    console.error('Erro ao iniciar trial:', error);
    throw new Error('Não foi possível iniciar o teste gratuito');
  }
}

/**
 * Invoca o agente/SubNúcleo durante o trial
 */
export async function invokeTrial(
  request: TrialInvokeRequest
): Promise<TrialInvokeResponse> {
  try {
    const response = await apiClient.post<TrialInvokeResponse>(
      '/api/trials/invoke',
      request
    );
    return response;
  } catch (error: any) {
    console.error('Erro ao invocar trial:', error);
    
    // Se o trial expirou, retornar erro específico
    if (error.response?.data?.error === 'trial_expired') {
      throw new Error('Seu período de teste terminou');
    }
    
    throw new Error('Não foi possível processar sua mensagem');
  }
}

/**
 * Verifica se um trial está ativo
 */
export function isTrialActive(expiresAt: string, remainingTokens: number): boolean {
  const now = new Date();
  const expiration = new Date(expiresAt);
  
  return now < expiration && remainingTokens > 0;
}

/**
 * Calcula tempo restante do trial em horas
 */
export function getTrialRemainingHours(expiresAt: string): number {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  return Math.max(0, diffHours);
}

/**
 * Formata tempo restante do trial
 */
export function formatTrialRemaining(expiresAt: string): string {
  const hours = getTrialRemainingHours(expiresAt);
  
  if (hours === 0) {
    return 'Menos de 1 hora';
  }
  
  if (hours === 1) {
    return '1 hora';
  }
  
  return `${hours} horas`;
}

/**
 * Formata mensagem de status do trial
 */
export function formatTrialStatus(
  remainingTokens: number,
  expiresAt: string
): string {
  const hours = getTrialRemainingHours(expiresAt);
  
  if (remainingTokens === 0) {
    return 'Você usou todas as 5 interações do teste';
  }
  
  if (hours === 0) {
    return 'Seu teste de 24 horas expirou';
  }
  
  return `${remainingTokens} interações restantes • ${formatTrialRemaining(expiresAt)} restantes`;
}

/**
 * Valida mensagem do trial
 */
export function validateTrialMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Mensagem não pode estar vazia' };
  }
  
  if (message.trim().length < 3) {
    return { valid: false, error: 'Mensagem muito curta (mínimo 3 caracteres)' };
  }
  
  if (message.length > 1000) {
    return { valid: false, error: 'Mensagem muito longa (máximo 1000 caracteres)' };
  }
  
  return { valid: true };
}

/**
 * Armazena estado do trial no localStorage
 */
export function saveTrialState(
  targetType: string,
  targetId: string,
  state: TrialStartResponse
): void {
  const key = `trial_${targetType}_${targetId}`;
  localStorage.setItem(key, JSON.stringify(state));
}

/**
 * Recupera estado do trial do localStorage
 */
export function loadTrialState(
  targetType: string,
  targetId: string
): TrialStartResponse | null {
  const key = `trial_${targetType}_${targetId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Remove estado do trial do localStorage
 */
export function clearTrialState(targetType: string, targetId: string): void {
  const key = `trial_${targetType}_${targetId}`;
  localStorage.removeItem(key);
}
