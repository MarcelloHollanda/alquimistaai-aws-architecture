/**
 * Nigredo Prospecting Core - Rate Limiter Utility
 * 
 * IP-based rate limiting using PostgreSQL database
 * Requirements: 5.3
 */

import { query } from '../../shared/database';
import { Logger } from '../../shared/logger';

const logger = new Logger('rate-limiter');

// Rate limit configuration
const RATE_LIMIT_MAX_SUBMISSIONS = 10; // Maximum submissions per window
const RATE_LIMIT_WINDOW_HOURS = 1; // Window duration in hours

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limitCount: number;
  windowResetAt: Date;
  message?: string;
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly result: RateLimitResult
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Checks if an IP address has exceeded the rate limit
 * 
 * @param ipAddress - IP address to check
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  ipAddress: string
): Promise<RateLimitResult> {
  try {
    logger.info('Checking rate limit', { ipAddress });

    const result = await query(
      'SELECT * FROM check_rate_limit($1::INET)',
      [ipAddress]
    );

    if (result.rows.length === 0) {
      // No rate limit record found, allow submission
      return {
        allowed: true,
        currentCount: 0,
        limitCount: RATE_LIMIT_MAX_SUBMISSIONS,
        windowResetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000),
      };
    }

    const row = result.rows[0];
    const allowed = row.is_allowed === true;
    const currentCount = parseInt(row.current_count, 10);
    const limitCount = parseInt(row.limit_count, 10);
    const windowResetAt = new Date(row.window_reset_at);

    logger.info('Rate limit check result', {
      ipAddress,
      allowed,
      currentCount,
      limitCount,
      windowResetAt,
    });

    return {
      allowed,
      currentCount,
      limitCount,
      windowResetAt,
      message: allowed
        ? undefined
        : `Rate limit exceeded. Maximum ${limitCount} submissions per hour. Try again after ${windowResetAt.toISOString()}`,
    };
  } catch (error) {
    logger.error('Error checking rate limit', error as Error, { ipAddress });
    
    // On error, allow the submission (fail open)
    // This prevents rate limiting from blocking legitimate users if DB is down
    return {
      allowed: true,
      currentCount: 0,
      limitCount: RATE_LIMIT_MAX_SUBMISSIONS,
      windowResetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000),
      message: 'Rate limit check failed, allowing submission',
    };
  }
}

/**
 * Increments the rate limit counter for an IP address
 * 
 * @param ipAddress - IP address to increment
 */
export async function incrementRateLimit(ipAddress: string): Promise<void> {
  try {
    logger.info('Incrementing rate limit', { ipAddress });

    await query(
      'SELECT increment_rate_limit($1::INET)',
      [ipAddress]
    );

    logger.info('Rate limit incremented successfully', { ipAddress });
  } catch (error) {
    logger.error('Error incrementing rate limit', error as Error, { ipAddress });
    // Don't throw error, just log it
    // This prevents rate limiting from breaking the submission flow
  }
}

/**
 * Checks rate limit and throws error if exceeded
 * Convenience function for use in Lambda handlers
 * 
 * @param ipAddress - IP address to check
 * @throws RateLimitError if rate limit exceeded
 */
export async function enforceRateLimit(ipAddress: string): Promise<void> {
  const result = await checkRateLimit(ipAddress);

  if (!result.allowed) {
    logger.warn('Rate limit exceeded', {
      ipAddress,
      currentCount: result.currentCount,
      limitCount: result.limitCount,
    });

    throw new RateLimitError(
      result.message || 'Rate limit exceeded',
      result
    );
  }
}

/**
 * Creates a rate limit error response for API Gateway
 * 
 * @param error - Rate limit error
 * @returns API Gateway response object
 */
export function createRateLimitErrorResponse(error: RateLimitError) {
  return {
    statusCode: 429,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Retry-After': Math.ceil(
        (error.result.windowResetAt.getTime() - Date.now()) / 1000
      ).toString(),
      'X-RateLimit-Limit': error.result.limitCount.toString(),
      'X-RateLimit-Remaining': Math.max(
        0,
        error.result.limitCount - error.result.currentCount
      ).toString(),
      'X-RateLimit-Reset': error.result.windowResetAt.toISOString(),
    },
    body: JSON.stringify({
      error: 'Rate Limit Exceeded',
      message: error.message,
      details: {
        currentCount: error.result.currentCount,
        limitCount: error.result.limitCount,
        windowResetAt: error.result.windowResetAt.toISOString(),
        retryAfterSeconds: Math.ceil(
          (error.result.windowResetAt.getTime() - Date.now()) / 1000
        ),
      },
    }),
  };
}

/**
 * Blocks an IP address for a specified duration
 * Used for abuse prevention
 * 
 * @param ipAddress - IP address to block
 * @param durationHours - Duration to block in hours (default: 24)
 */
export async function blockIPAddress(
  ipAddress: string,
  durationHours: number = 24
): Promise<void> {
  try {
    logger.warn('Blocking IP address', { ipAddress, durationHours });

    const blockedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await query(
      `UPDATE nigredo_leads.rate_limits
       SET blocked_until = $1
       WHERE ip_address = $2::INET`,
      [blockedUntil, ipAddress]
    );

    logger.info('IP address blocked successfully', {
      ipAddress,
      blockedUntil,
    });
  } catch (error) {
    logger.error('Error blocking IP address', error as Error, { ipAddress });
    throw error;
  }
}

/**
 * Unblocks an IP address
 * 
 * @param ipAddress - IP address to unblock
 */
export async function unblockIPAddress(ipAddress: string): Promise<void> {
  try {
    logger.info('Unblocking IP address', { ipAddress });

    await query(
      `UPDATE nigredo_leads.rate_limits
       SET blocked_until = NULL
       WHERE ip_address = $1::INET`,
      [ipAddress]
    );

    logger.info('IP address unblocked successfully', { ipAddress });
  } catch (error) {
    logger.error('Error unblocking IP address', error as Error, { ipAddress });
    throw error;
  }
}

/**
 * Gets rate limit statistics for an IP address
 * 
 * @param ipAddress - IP address to get stats for
 * @returns Rate limit statistics
 */
export async function getRateLimitStats(ipAddress: string): Promise<{
  submissionCount: number;
  windowStart: Date | null;
  windowEnd: Date | null;
  lastSubmissionAt: Date | null;
  blockedUntil: Date | null;
}> {
  try {
    const result = await query(
      `SELECT 
        submission_count,
        window_start,
        window_end,
        last_submission_at,
        blocked_until
       FROM nigredo_leads.rate_limits
       WHERE ip_address = $1::INET
       AND window_end > NOW()
       ORDER BY window_start DESC
       LIMIT 1`,
      [ipAddress]
    );

    if (result.rows.length === 0) {
      return {
        submissionCount: 0,
        windowStart: null,
        windowEnd: null,
        lastSubmissionAt: null,
        blockedUntil: null,
      };
    }

    const row = result.rows[0];
    return {
      submissionCount: parseInt(row.submission_count, 10),
      windowStart: row.window_start ? new Date(row.window_start) : null,
      windowEnd: row.window_end ? new Date(row.window_end) : null,
      lastSubmissionAt: row.last_submission_at
        ? new Date(row.last_submission_at)
        : null,
      blockedUntil: row.blocked_until ? new Date(row.blocked_until) : null,
    };
  } catch (error) {
    logger.error('Error getting rate limit stats', error as Error, { ipAddress });
    throw error;
  }
}

/**
 * Cleans up old rate limit records
 * Should be called periodically (e.g., daily via scheduled Lambda)
 * 
 * @returns Number of records deleted
 */
export async function cleanupOldRateLimits(): Promise<number> {
  try {
    logger.info('Cleaning up old rate limit records');

    const result = await query(
      'SELECT cleanup_old_rate_limits()'
    );

    logger.info('Old rate limit records cleaned up successfully');
    return 0; // Function returns void, so we return 0
  } catch (error) {
    logger.error('Error cleaning up old rate limits', error as Error);
    throw error;
  }
}
