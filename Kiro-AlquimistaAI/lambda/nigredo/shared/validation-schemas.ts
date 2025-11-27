/**
 * Nigredo Prospecting Core - Validation Schemas
 * 
 * Zod schemas for input validation across Nigredo Lambda functions
 * Requirements: 1.3, 5.4
 */

import { z } from 'zod';

// ============================================================================
// Phone Number Validation (E.164 format)
// ============================================================================

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const PhoneSchema = z
  .string()
  .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +5511999999999)')
  .min(8, 'Phone must be at least 8 characters')
  .max(16, 'Phone must be at most 16 characters');

// ============================================================================
// Email Validation (RFC 5322 basic)
// ============================================================================

export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be at most 255 characters')
  .toLowerCase()
  .trim();

// ============================================================================
// Text Sanitization
// ============================================================================

/**
 * Sanitizes text input to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
}

// ============================================================================
// Create Lead Schema
// ============================================================================

export const CreateLeadSchema = z.object({
  // Required fields
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .transform(sanitizeText),
  
  email: EmailSchema,
  
  // Optional fields
  phone: PhoneSchema.optional(),
  
  company: z
    .string()
    .min(2, 'Company must be at least 2 characters')
    .max(100, 'Company must be at most 100 characters')
    .transform(sanitizeText)
    .optional(),
  
  message: z
    .string()
    .max(1000, 'Message must be at most 1000 characters')
    .transform(sanitizeText)
    .optional(),
  
  // UTM parameters for tracking
  utmSource: z
    .string()
    .max(100, 'UTM source must be at most 100 characters')
    .transform(sanitizeText)
    .optional(),
  
  utmMedium: z
    .string()
    .max(100, 'UTM medium must be at most 100 characters')
    .transform(sanitizeText)
    .optional(),
  
  utmCampaign: z
    .string()
    .max(100, 'UTM campaign must be at most 100 characters')
    .transform(sanitizeText)
    .optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone must be provided',
    path: ['email'],
  }
);

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

// ============================================================================
// List Leads Query Schema
// ============================================================================

export const ListLeadsQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .refine((val) => val <= 1000, 'Page must be at most 1000'),
  
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Limit must be greater than 0')
    .refine((val) => val <= 100, 'Limit must be at most 100'),
  
  // Filters
  status: z
    .enum([
      'novo',
      'enriquecido',
      'contatado',
      'respondeu',
      'interessado',
      'agendado',
      'convertido',
      'descartado',
      'descadastrado',
    ])
    .optional(),
  
  source: z
    .string()
    .max(100, 'Source must be at most 100 characters')
    .transform(sanitizeText)
    .optional(),
  
  // Date range filters (ISO 8601 format)
  startDate: z
    .string()
    .datetime({ message: 'Start date must be in ISO 8601 format' })
    .optional(),
  
  endDate: z
    .string()
    .datetime({ message: 'End date must be in ISO 8601 format' })
    .optional(),
  
  // Search query (searches across name, email, company)
  search: z
    .string()
    .max(255, 'Search query must be at most 255 characters')
    .transform(sanitizeText)
    .optional(),
  
  // Sort options
  sortBy: z
    .enum(['created_at', 'updated_at', 'name', 'company', 'priority_score'])
    .optional()
    .default('created_at'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

export type ListLeadsQuery = z.infer<typeof ListLeadsQuerySchema>;

// ============================================================================
// Get Lead Path Parameters Schema
// ============================================================================

export const GetLeadParamsSchema = z.object({
  id: z
    .string()
    .uuid('Lead ID must be a valid UUID'),
});

export type GetLeadParams = z.infer<typeof GetLeadParamsSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates input against a Zod schema and returns typed result
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data or errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Formats Zod validation errors into user-friendly messages
 * 
 * @param error - Zod validation error
 * @returns Array of error messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Creates a validation error response for API Gateway
 * 
 * @param error - Zod validation error
 * @returns API Gateway response object
 */
export function createValidationErrorResponse(error: z.ZodError) {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: formatValidationErrors(error),
    }),
  };
}

// ============================================================================
// IP Address Validation
// ============================================================================

const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

export const IPAddressSchema = z
  .string()
  .refine(
    (val) => ipv4Regex.test(val) || ipv6Regex.test(val),
    'Invalid IP address format'
  );

/**
 * Extracts IP address from API Gateway event
 * Handles X-Forwarded-For header for proxied requests
 * 
 * @param event - API Gateway event
 * @returns IP address string
 */
export function extractIPAddress(event: any): string {
  // Check X-Forwarded-For header (for proxied requests)
  const forwardedFor = event.headers?.['x-forwarded-for'] || 
                       event.headers?.['X-Forwarded-For'];
  
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to source IP
  return event.requestContext?.identity?.sourceIp || 
         event.requestContext?.http?.sourceIp || 
         '0.0.0.0';
}

/**
 * Extracts User-Agent from API Gateway event
 * 
 * @param event - API Gateway event
 * @returns User-Agent string
 */
export function extractUserAgent(event: any): string {
  return event.headers?.['user-agent'] || 
         event.headers?.['User-Agent'] || 
         'Unknown';
}

/**
 * Extracts Referer from API Gateway event
 * 
 * @param event - API Gateway event
 * @returns Referer string or undefined
 */
export function extractReferer(event: any): string | undefined {
  return event.headers?.['referer'] || 
         event.headers?.['Referer'];
}
