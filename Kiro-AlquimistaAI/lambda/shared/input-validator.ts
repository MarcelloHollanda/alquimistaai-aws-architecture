import { Logger, EnhancedLogger } from './logger';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date' | 'phone';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized?: Record<string, any>;
}

/**
 * Input Validator com sanitização automática
 */
export class InputValidator {
  constructor(private logger?: EnhancedLogger) {}

  validate(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitized: Record<string, any> = {};

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`
        });
        continue;
      }

      // Skip validation if not required and value is empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const typeError = this.validateType(rule.field, value, rule.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // Length validation (for strings)
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.minLength} characters`,
            value
          });
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.maxLength} characters`,
            value
          });
        }
      }

      // Number range validation
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.min}`,
            value
          });
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.max}`,
            value
          });
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: `${rule.field} format is invalid`,
            value
          });
        }
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push({
            field: rule.field,
            message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid`,
            value
          });
        }
      }

      // Sanitize
      if (rule.sanitize) {
        sanitized[rule.field] = this.sanitize(value, rule.type);
      } else {
        sanitized[rule.field] = value;
      }
    }

    const valid = errors.length === 0;

    if (!valid) {
      this.logger?.warn('Validation failed', {
        operation: 'validator.failed',
        customMetrics: {
          errorCount: errors.length,
          fields: errors.map(e => e.field).join(',')
        }
      });
    }

    return {
      valid,
      errors,
      sanitized: valid ? sanitized : undefined
    };
  }

  private validateType(field: string, value: any, type: string): ValidationError | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { field, message: `${field} must be a string` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { field, message: `${field} must be a number` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { field, message: `${field} must be a boolean` };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return { field, message: `${field} must be a valid email` };
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return { field, message: `${field} must be a valid URL` };
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUuid(value)) {
          return { field, message: `${field} must be a valid UUID` };
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          return { field, message: `${field} must be a valid date` };
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || !this.isValidPhone(value)) {
          return { field, message: `${field} must be a valid phone number` };
        }
        break;
    }

    return null;
  }

  private sanitize(value: any, type?: string): any {
    if (typeof value === 'string') {
      // Remove HTML tags
      let sanitized = value.replace(/<[^>]*>/g, '');
      
      // Remove SQL injection attempts
      sanitized = sanitized.replace(/('|(--)|;|\/\*|\*\/|xp_|sp_)/gi, '');
      
      // Remove XSS attempts
      sanitized = sanitized.replace(/(javascript:|onerror=|onclick=|onload=)/gi, '');
      
      // Trim whitespace
      sanitized = sanitized.trim();
      
      return sanitized;
    }

    return value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private isValidDate(date: any): boolean {
    const timestamp = Date.parse(date);
    return !isNaN(timestamp);
  }

  private isValidPhone(phone: string): boolean {
    // Brazilian phone format
    const phoneRegex = /^(\+55|55)?(\d{2})(\d{4,5})(\d{4})$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }
}

/**
 * SQL Injection Prevention
 */
export class SqlInjectionPrevention {
  private static dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /(UNION.*SELECT)/gi
  ];

  static isSafe(input: string): boolean {
    return !this.dangerousPatterns.some(pattern => pattern.test(input));
  }

  static sanitize(input: string): string {
    let sanitized = input;
    
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  }
}

/**
 * XSS Prevention
 */
export class XssPrevention {
  private static dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  static isSafe(input: string): boolean {
    return !this.dangerousPatterns.some(pattern => pattern.test(input));
  }

  static sanitize(input: string): string {
    let sanitized = input;
    
    // Remove dangerous patterns
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }
}

/**
 * LGPD/GDPR Data Masking
 */
export class DataMasking {
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '***';
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return digits.substring(0, 2) + '***' + digits.substring(digits.length - 2);
  }

  static maskCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return '***';
    return `***${digits.substring(3, 6)}***${digits.substring(9)}`;
  }

  static maskCreditCard(card: string): string {
    const digits = card.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return '****-****-****-' + digits.substring(digits.length - 4);
  }

  static maskGeneric(value: string, visibleChars: number = 2): string {
    if (value.length <= visibleChars) return '***';
    return value.substring(0, visibleChars) + '***';
  }
}

/**
 * Validation Decorator
 */
export function ValidateInput(rules: ValidationRule[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as EnhancedLogger | undefined;
      const validator = new InputValidator(logger);

      // Assume first argument is the data to validate
      const data = args[0];

      if (typeof data === 'object' && data !== null) {
        const result = validator.validate(data, rules);

        if (!result.valid) {
          logger?.error('Input validation failed', new Error('Validation failed'), {
            operation: 'validator.decorator',
            customMetrics: {
              errors: result.errors.length,
              fields: result.errors.map(e => e.field).join(',')
            }
          });

          throw new ValidationException('Input validation failed', result.errors);
        }

        // Replace first argument with sanitized data
        args[0] = result.sanitized;
      }

      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Custom Exception
 */
export class ValidationException extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationError[]
  ) {
    super(message);
    this.name = 'ValidationException';
  }
}


/**
 * Funções auxiliares de validação e sanitização
 */

/**
 * Sanitiza input SQL para prevenir SQL injection
 */
export function sanitizeSqlInput(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Remove padrões perigosos de SQL injection
  let sanitized = value;
  
  // Remove comentários SQL
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  
  // Remove comandos SQL perigosos
  sanitized = sanitized.replace(/;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE)\s/gi, '');
  
  // Remove tentativas de OR/AND injection
  sanitized = sanitized.replace(/'\s*(OR|AND)\s*'?\d*'?\s*=\s*'?\d*/gi, '');
  sanitized = sanitized.replace(/'\s*(OR|AND)\s*\d*\s*=\s*\d*/gi, '');
  
  // Remove UNION SELECT
  sanitized = sanitized.replace(/UNION.*SELECT/gi, '');
  
  // Remove aspas extras
  sanitized = sanitized.replace(/'+/g, "'");
  
  return sanitized.trim();
}

/**
 * Escapa HTML para prevenir XSS
 */
export function escapeHtml(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida UUID
 */
export function validateUuid(id: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    throw new ValidationException(`Invalid ${fieldName} format`, [
      {
        field: fieldName,
        message: `${fieldName} must be a valid UUID`,
        value: id
      }
    ]);
  }
}

/**
 * Valida string com opções
 */
export function validateString(
  value: string,
  options: {
    fieldName?: string;
    maxLength?: number;
    allowEmpty?: boolean;
    pattern?: RegExp;
  } = {}
): void {
  const {
    fieldName = 'value',
    maxLength = 255,
    allowEmpty = false,
    pattern
  } = options;
  
  if (!allowEmpty && (!value || value.trim() === '')) {
    throw new ValidationException(`${fieldName} is required`, [
      {
        field: fieldName,
        message: `${fieldName} cannot be empty`
      }
    ]);
  }
  
  if (value && value.length > maxLength) {
    throw new ValidationException(`${fieldName} is too long`, [
      {
        field: fieldName,
        message: `${fieldName} must be at most ${maxLength} characters`,
        value: value.substring(0, 50) + '...'
      }
    ]);
  }
  
  if (pattern && value && !pattern.test(value)) {
    throw new ValidationException(`${fieldName} format is invalid`, [
      {
        field: fieldName,
        message: `${fieldName} does not match required format`
      }
    ]);
  }
}

/**
 * Valida e converte número
 */
export function validateNumber(
  value: any,
  options: {
    fieldName?: string;
    min?: number;
    max?: number;
    defaultValue?: number;
  } = {}
): number {
  const {
    fieldName = 'value',
    min,
    max,
    defaultValue
  } = options;
  
  // Se não fornecido e tem default, retornar default
  if ((value === undefined || value === null || value === '') && defaultValue !== undefined) {
    return defaultValue;
  }
  
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  
  if (isNaN(num)) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new ValidationException(`${fieldName} must be a number`, [
      {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        value
      }
    ]);
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationException(`${fieldName} is too small`, [
      {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        value: num
      }
    ]);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationException(`${fieldName} is too large`, [
      {
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
        value: num
      }
    ]);
  }
  
  return num;
}
