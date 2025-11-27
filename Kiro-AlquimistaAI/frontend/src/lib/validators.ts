/**
 * Utilitários de validação para formulários
 */

/**
 * Valida formato de e-mail
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: 'E-mail é obrigatório' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Formato de e-mail inválido' };
  }

  return { valid: true };
}

/**
 * Valida força da senha
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Senha é obrigatória' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um número' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*...)' };
  }

  return { valid: true };
}

/**
 * Valida CNPJ brasileiro
 */
export function validateCNPJ(cnpj: string): { valid: boolean; message?: string } {
  if (!cnpj) {
    return { valid: false, message: 'CNPJ é obrigatório' };
  }

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  if (cleanCNPJ.length !== 14) {
    return { valid: false, message: 'CNPJ deve ter 14 dígitos' };
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return { valid: false, message: 'CNPJ inválido' };
  }

  // Validação dos dígitos verificadores
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return { valid: false, message: 'CNPJ inválido' };
  }

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return { valid: false, message: 'CNPJ inválido' };
  }

  return { valid: true };
}

/**
 * Valida telefone brasileiro
 * Aceita formatos: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phone) {
    return { valid: false, message: 'Telefone é obrigatório' };
  }

  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/[^\d]/g, '');

  // Valida tamanho (10 ou 11 dígitos)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos' };
  }

  // Valida DDD (primeiros 2 dígitos)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { valid: false, message: 'DDD inválido' };
  }

  return { valid: true };
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/[^\d]/g, '');
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/[^\d]/g, '');
  
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  return phone;
}
