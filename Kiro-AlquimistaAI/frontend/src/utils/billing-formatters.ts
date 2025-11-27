// Funções auxiliares para formatação de dados de billing

/**
 * Formata valor monetário em BRL
 * @param value Valor em centavos ou reais
 * @param inCents Se true, valor está em centavos (padrão Stripe)
 */
export function formatCurrency(value: number, inCents = false): string {
  const valueInReais = inCents ? value / 100 : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInReais);
}

/**
 * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX
 * @param cnpj CNPJ com ou sem formatação
 */
export function formatCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Valida tamanho
  if (cleaned.length !== 14) {
    return cnpj; // Retorna original se inválido
  }
  
  // Formata: XX.XXX.XXX/XXXX-XX
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Remove formatação do CNPJ
 * @param cnpj CNPJ formatado
 */
export function unformatCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Valida CNPJ
 * @param cnpj CNPJ com ou sem formatação
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = unformatCNPJ(cnpj);
  
  if (cleaned.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }
  
  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }
  
  return true;
}

/**
 * Formata data no padrão brasileiro
 * @param date Data a ser formatada
 * @param includeTime Se true, inclui hora
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
}

/**
 * Formata data relativa (ex: "há 2 dias", "em 3 meses")
 * @param date Data a ser formatada
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Hoje';
  } else if (diffDays === 1) {
    return 'Amanhã';
  } else if (diffDays === -1) {
    return 'Ontem';
  } else if (diffDays > 0 && diffDays < 30) {
    return `Em ${diffDays} dias`;
  } else if (diffDays < 0 && diffDays > -30) {
    return `Há ${Math.abs(diffDays)} dias`;
  } else if (diffDays >= 30 && diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Em ${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else if (diffDays <= -30 && diffDays > -365) {
    const months = Math.floor(Math.abs(diffDays) / 30);
    return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else {
    return formatDate(dateObj);
  }
}

/**
 * Formata periodicidade para exibição
 * @param periodicity Periodicidade (monthly ou annual)
 */
export function formatPeriodicity(periodicity: 'monthly' | 'annual'): string {
  return periodicity === 'monthly' ? 'Mensal' : 'Anual';
}

/**
 * Formata status de assinatura para exibição
 * @param status Status da assinatura
 */
export function formatSubscriptionStatus(
  status: 'active' | 'pending' | 'cancelled' | 'past_due'
): string {
  const statusMap = {
    active: 'Ativa',
    pending: 'Pendente',
    cancelled: 'Cancelada',
    past_due: 'Pagamento Atrasado',
  };
  
  return statusMap[status] || status;
}

/**
 * Calcula desconto anual (geralmente 20%)
 * @param monthlyPrice Preço mensal
 * @param discountPercent Percentual de desconto (padrão 20%)
 */
export function calculateAnnualDiscount(
  monthlyPrice: number,
  discountPercent = 20
): { annualPrice: number; savings: number; monthlyEquivalent: number } {
  const annualWithoutDiscount = monthlyPrice * 12;
  const savings = annualWithoutDiscount * (discountPercent / 100);
  const annualPrice = annualWithoutDiscount - savings;
  const monthlyEquivalent = annualPrice / 12;
  
  return {
    annualPrice,
    savings,
    monthlyEquivalent,
  };
}

/**
 * Formata número de itens (agentes, usuários, etc)
 * @param count Quantidade
 * @param singular Nome no singular
 * @param plural Nome no plural
 */
export function formatItemCount(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
