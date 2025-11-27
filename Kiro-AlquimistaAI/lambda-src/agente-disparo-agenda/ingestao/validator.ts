// validator.ts - Validações de dados
export class LeadsValidator {
  /**
   * Valida formato de email
   */
  validateEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de telefone brasileiro
   */
  validateTelefoneBR(telefone: string): boolean {
    if (!telefone) return false;
    
    // Remove tudo que não é dígito
    const digits = telefone.replace(/\D/g, '');
    
    // Telefone BR: 10 ou 11 dígitos (com DDD)
    if (digits.length < 10 || digits.length > 11) {
      return false;
    }

    // Validar DDD (11-99)
    const ddd = parseInt(digits.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return false;
    }

    return true;
  }

  /**
   * Valida se telefone é internacional
   */
  isInternacional(telefone: string): boolean {
    return telefone.startsWith('+') && !telefone.startsWith('+55');
  }

  /**
   * Valida CPF (11 dígitos)
   */
  isCPF(documento: string): boolean {
    return documento.length === 11;
  }

  /**
   * Valida CNPJ (14 dígitos)
   */
  isCNPJ(documento: string): boolean {
    return documento.length === 14;
  }
}
