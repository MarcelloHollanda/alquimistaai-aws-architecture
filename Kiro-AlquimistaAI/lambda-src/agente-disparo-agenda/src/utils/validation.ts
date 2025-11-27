/**
 * Utilitários de validação
 * Validação de mensagens, contatos e dados
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface MessageData {
  contactId: string;
  content: string;
  channel: string;
  type: string;
}

/**
 * Valida dados de mensagem
 */
export function validateMessage(data: MessageData): ValidationResult {
  const errors: string[] = [];

  if (!data.contactId || data.contactId.trim() === '') {
    errors.push('contactId é obrigatório');
  }

  if (!data.content || data.content.trim() === '') {
    errors.push('content é obrigatório');
  }

  if (data.content && data.content.length > 4096) {
    errors.push('content excede o tamanho máximo de 4096 caracteres');
  }

  if (!data.channel || !['whatsapp', 'email', 'linkedin'].includes(data.channel)) {
    errors.push('channel inválido (deve ser whatsapp, email ou linkedin)');
  }

  if (!data.type || data.type.trim() === '') {
    errors.push('type é obrigatório');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone
 */
export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Valida dados de contato
 */
export function validateContact(contact: any): ValidationResult {
  const errors: string[] = [];

  if (!contact.company || contact.company.trim() === '') {
    errors.push('company é obrigatório');
  }

  if (!contact.contactName || contact.contactName.trim() === '') {
    errors.push('contactName é obrigatório');
  }

  if (!contact.phone && !contact.email) {
    errors.push('Pelo menos phone ou email é obrigatório');
  }

  if (contact.email && !validateEmail(contact.email)) {
    errors.push('email inválido');
  }

  if (contact.phone && !validatePhone(contact.phone)) {
    errors.push('phone inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida solicitação de agendamento de reunião
 */
export function validateMeetingRequest(request: any): ValidationResult {
  const errors: string[] = [];

  if (!request.contactId || request.contactId.trim() === '') {
    errors.push('contactId é obrigatório');
  }

  if (!request.scheduledAt || request.scheduledAt.trim() === '') {
    errors.push('scheduledAt é obrigatório');
  }

  if (request.scheduledAt) {
    const scheduledDate = new Date(request.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('scheduledAt deve ser uma data válida');
    }
    
    if (scheduledDate < new Date()) {
      errors.push('scheduledAt não pode ser no passado');
    }
  }

  if (!request.duration || typeof request.duration !== 'number' || request.duration <= 0) {
    errors.push('duration deve ser um número positivo');
  }

  if (request.duration && request.duration > 480) {
    errors.push('duration não pode exceder 480 minutos (8 horas)');
  }

  if (!request.type || request.type.trim() === '') {
    errors.push('type é obrigatório');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


/**
 * Type guard para verificar se um valor é um Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extrai mensagem de erro de forma segura
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Extrai stack trace de forma segura
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}
