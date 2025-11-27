import { apiClient } from './api-client';

export interface CommercialContactRequest {
  companyName: string;
  cnpj?: string;
  contactName: string;
  email: string;
  whatsapp: string;
  selectedAgents: string[];
  selectedSubnucleos: string[];
  message: string;
}

export interface CommercialContactResponse {
  success: boolean;
  message: string;
}

/**
 * Envia solicitação de contato comercial
 */
export async function sendCommercialContact(
  request: CommercialContactRequest
): Promise<CommercialContactResponse> {
  try {
    const response = await apiClient.post<CommercialContactResponse>(
      '/api/commercial/contact',
      request
    );
    return response;
  } catch (error) {
    console.error('Erro ao enviar contato comercial:', error);
    throw new Error('Não foi possível enviar a solicitação de contato');
  }
}

/**
 * Valida formato de e-mail
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de WhatsApp (formato brasileiro)
 */
export function validateWhatsApp(whatsapp: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = whatsapp.replace(/\D/g, '');
  
  // Valida formato brasileiro: 11 dígitos (DDD + 9 + número)
  return cleaned.length === 11 && cleaned.startsWith('55') === false;
}

/**
 * Formata WhatsApp para formato brasileiro
 */
export function formatWhatsApp(whatsapp: string): string {
  const cleaned = whatsapp.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `+55 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return whatsapp;
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) {
    return false;
  }
  
  // Validação básica de CNPJ
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }
  
  return true;
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  
  return cnpj;
}

/**
 * Valida formulário de contato comercial
 */
export function validateCommercialForm(
  request: CommercialContactRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.companyName || request.companyName.trim().length < 3) {
    errors.push('Nome da empresa deve ter pelo menos 3 caracteres');
  }
  
  if (request.cnpj && !validateCNPJ(request.cnpj)) {
    errors.push('CNPJ inválido');
  }
  
  if (!request.contactName || request.contactName.trim().length < 3) {
    errors.push('Nome do responsável deve ter pelo menos 3 caracteres');
  }
  
  if (!validateEmail(request.email)) {
    errors.push('E-mail inválido');
  }
  
  if (!validateWhatsApp(request.whatsapp)) {
    errors.push('WhatsApp inválido (formato: 11 dígitos com DDD)');
  }
  
  if (
    request.selectedAgents.length === 0 &&
    request.selectedSubnucleos.length === 0
  ) {
    errors.push('Selecione pelo menos um agente ou SubNúcleo');
  }
  
  if (!request.message || request.message.trim().length < 10) {
    errors.push('Mensagem deve ter pelo menos 10 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
