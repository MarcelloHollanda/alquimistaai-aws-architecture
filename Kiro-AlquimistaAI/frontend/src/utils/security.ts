/**
 * Security utilities for input sanitization and protection
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Sanitize input for safe display
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  // Remove dangerous protocols
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return '';
  }
  
  return url;
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function storeCSRFToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf_token', token);
  }
}

/**
 * Get CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('csrf_token');
  }
  return null;
}

/**
 * Validate password strength
 * Returns object with isValid and reasons
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  if (password.length < 8) {
    reasons.push('Senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    reasons.push('Senha deve conter letras minúsculas');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    reasons.push('Senha deve conter letras maiúsculas');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    reasons.push('Senha deve conter números');
  } else {
    score += 1;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    reasons.push('Senha deve conter caracteres especiais');
  } else {
    score += 1;
  }

  return {
    isValid: reasons.length === 0,
    score,
    reasons,
  };
}

/**
 * Rate limiter for client-side requests
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.limit - validRequests.length);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

/**
 * Detect potential SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Secure form data before submission
 */
export function secureFormData(data: Record<string, any>): Record<string, any> {
  const secured: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Sanitize string inputs
      secured[key] = sanitizeInput(value);
      
      // Check for injection attempts
      if (detectSQLInjection(value) || detectXSS(value)) {
        console.warn(`Potential security threat detected in field: ${key}`);
        secured[key] = sanitizeHTML(value);
      }
    } else {
      secured[key] = value;
    }
  }

  return secured;
}

/**
 * Content Security Policy helper
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.alquimista.ai', 'wss://'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}
