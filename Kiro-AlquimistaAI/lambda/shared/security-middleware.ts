import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RateLimiter, RateLimitPresets } from './rate-limiter';
import { InputValidator, ValidationRule, SqlInjectionPrevention, XssPrevention } from './input-validator';
import { CacheManager } from './cache-manager';
import { Logger, EnhancedLogger } from './logger';

export interface SecurityConfig {
  rateLimit?: {
    enabled: boolean;
    preset?: keyof typeof RateLimitPresets;
    custom?: {
      maxRequests: number;
      windowMs: number;
    };
  };
  validation?: {
    enabled: boolean;
    rules?: ValidationRule[];
  };
  sqlInjectionPrevention?: boolean;
  xssPrevention?: boolean;
  corsEnabled?: boolean;
  allowedOrigins?: string[];
  requireAuth?: boolean;
}

export interface SecurityContext {
  rateLimitResult?: {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  };
  validationResult?: {
    valid: boolean;
    sanitized?: Record<string, any>;
  };
  clientIp?: string;
  userAgent?: string;
}

/**
 * Security Middleware - Integra rate limiting, validação e proteções
 */
export function withSecurity(
  config: SecurityConfig,
  handler: (event: APIGatewayProxyEvent, securityContext: SecurityContext) => Promise<APIGatewayProxyResult>
) {
  return async (
    event: APIGatewayProxyEvent,
    cache?: CacheManager,
    logger?: EnhancedLogger
  ): Promise<APIGatewayProxyResult> => {
    const securityContext: SecurityContext = {
      clientIp: event.requestContext.identity?.sourceIp,
      userAgent: event.headers['user-agent'] || event.headers['User-Agent']
    };

    // 1. CORS Check
    if (config.corsEnabled) {
      const origin = event.headers.origin || event.headers.Origin;
      
      if (config.allowedOrigins && origin) {
        if (!config.allowedOrigins.includes(origin) && !config.allowedOrigins.includes('*')) {
          logger?.warn('CORS origin not allowed', {
            operation: 'security.cors.blocked',
            customMetrics: { origin }
          });

          return {
            statusCode: 403,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Origin not allowed' })
          };
        }
      }
    }

    // 2. Authentication Check
    if (config.requireAuth) {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      
      if (!authHeader) {
        logger?.warn('Missing authentication', {
          operation: 'security.auth.missing',
          customMetrics: { path: event.path }
        });

        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer'
          },
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }
    }

    // 3. Rate Limiting
    if (config.rateLimit?.enabled && cache) {
      const identifier = securityContext.clientIp || 'unknown';
      
      const rateLimitConfig = config.rateLimit.custom || 
        RateLimitPresets[config.rateLimit.preset || 'api'];

      const rateLimiter = new RateLimiter(
        'api',
        rateLimitConfig,
        cache,
        logger
      );

      const rateLimitResult = await rateLimiter.checkLimit(identifier);
      securityContext.rateLimitResult = rateLimitResult;

      if (!rateLimitResult.allowed) {
        logger?.warn('Rate limit exceeded', {
          operation: 'security.rate-limit.exceeded',
          customMetrics: {
            clientIp: identifier,
            path: event.path
          }
        });

        return {
          statusCode: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          },
          body: JSON.stringify({
            error: 'Too many requests',
            retryAfter: rateLimitResult.retryAfter
          })
        };
      }
    }

    // 4. Input Validation
    if (config.validation?.enabled && event.body) {
      try {
        const data = JSON.parse(event.body);
        const validator = new InputValidator(logger);

        const validationResult = validator.validate(
          data,
          config.validation.rules || []
        );

        securityContext.validationResult = validationResult;

        if (!validationResult.valid) {
          logger?.warn('Input validation failed', {
            operation: 'security.validation.failed',
            customMetrics: {
              errorCount: validationResult.errors.length,
              fields: validationResult.errors.map(e => e.field).join(',')
            }
          });

          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              error: 'Validation failed',
              details: validationResult.errors
            })
          };
        }

        // Replace body with sanitized data
        event.body = JSON.stringify(validationResult.sanitized);
      } catch (error) {
        logger?.error('Failed to parse request body', error as Error);

        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid JSON' })
        };
      }
    }

    // 5. SQL Injection Prevention
    if (config.sqlInjectionPrevention && event.body) {
      try {
        const data = JSON.parse(event.body);
        
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && !SqlInjectionPrevention.isSafe(value)) {
            logger?.warn('SQL injection attempt detected', {
              operation: 'security.sql-injection.blocked',
              customMetrics: {
                field: key,
                clientIp: securityContext.clientIp
              }
            });

            return {
              statusCode: 400,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ error: 'Invalid input detected' })
            };
          }
        }
      } catch {
        // Invalid JSON already handled above
      }
    }

    // 6. XSS Prevention
    if (config.xssPrevention && event.body) {
      try {
        const data = JSON.parse(event.body);
        
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && !XssPrevention.isSafe(value)) {
            logger?.warn('XSS attempt detected', {
              operation: 'security.xss.blocked',
              customMetrics: {
                field: key,
                clientIp: securityContext.clientIp
              }
            });

            return {
              statusCode: 400,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ error: 'Invalid input detected' })
            };
          }
        }
      } catch {
        // Invalid JSON already handled above
      }
    }

    // Execute handler
    try {
      const result = await handler(event, securityContext);

      // Add security headers
      const securityHeaders: Record<string, string> = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'"
      };

      // Add CORS headers if enabled
      if (config.corsEnabled) {
        const origin = event.headers.origin || event.headers.Origin;
        if (origin && (config.allowedOrigins?.includes(origin) || config.allowedOrigins?.includes('*'))) {
          securityHeaders['Access-Control-Allow-Origin'] = origin;
          securityHeaders['Access-Control-Allow-Credentials'] = 'true';
          securityHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
          securityHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        }
      }

      // Add rate limit headers if applicable
      if (securityContext.rateLimitResult) {
        securityHeaders['X-RateLimit-Remaining'] = securityContext.rateLimitResult.remaining.toString();
        securityHeaders['X-RateLimit-Reset'] = securityContext.rateLimitResult.resetAt.toISOString();
      }

      return {
        ...result,
        headers: {
          ...result.headers,
          ...securityHeaders
        }
      };
    } catch (error) {
      logger?.error('Handler execution failed', error as Error);

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  };
}

/**
 * Security Presets
 */
export const SecurityPresets = {
  // Public API (rate limited, no auth)
  public: {
    rateLimit: {
      enabled: true,
      preset: 'api' as const
    },
    validation: {
      enabled: true
    },
    sqlInjectionPrevention: true,
    xssPrevention: true,
    corsEnabled: true,
    allowedOrigins: ['*'],
    requireAuth: false
  },

  // Authenticated API
  authenticated: {
    rateLimit: {
      enabled: true,
      preset: 'api' as const
    },
    validation: {
      enabled: true
    },
    sqlInjectionPrevention: true,
    xssPrevention: true,
    corsEnabled: true,
    requireAuth: true
  },

  // Sensitive operations (strict rate limit)
  sensitive: {
    rateLimit: {
      enabled: true,
      preset: 'strict' as const
    },
    validation: {
      enabled: true
    },
    sqlInjectionPrevention: true,
    xssPrevention: true,
    corsEnabled: true,
    requireAuth: true
  },

  // Internal (no rate limit, auth required)
  internal: {
    rateLimit: {
      enabled: false
    },
    validation: {
      enabled: true
    },
    sqlInjectionPrevention: true,
    xssPrevention: true,
    corsEnabled: false,
    requireAuth: true
  }
};
