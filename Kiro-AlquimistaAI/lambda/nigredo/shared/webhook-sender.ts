/**
 * Nigredo Prospecting Core - Webhook Sender Utility
 * 
 * HTTP client with retry logic for sending webhooks to Fibonacci system
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { query } from '../../shared/database';
import { Logger } from '../../shared/logger';

const logger = new Logger('webhook-sender');

// Webhook configuration
const WEBHOOK_TIMEOUT_MS = 5000; // 5 seconds
const WEBHOOK_MAX_RETRIES = 3; // Maximum retry attempts
const WEBHOOK_RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff (1s, 2s, 4s)

/**
 * Webhook payload interface
 */
export interface WebhookPayload {
  event_type: 'lead.created' | 'lead.updated';
  timestamp: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
  };
}

/**
 * Webhook response interface
 */
export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  attemptNumber: number;
}

/**
 * Sends HTTP request with timeout
 * 
 * @param url - Target URL
 * @param payload - Request payload
 * @param timeoutMs - Request timeout in milliseconds
 * @returns Response data
 */
async function sendHttpRequest(
  url: string,
  payload: any,
  timeoutMs: number
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = JSON.stringify(payload);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Nigredo-Webhook-Sender/1.0',
      },
      timeout: timeoutMs,
    };

    const req = client.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          body,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Logs webhook attempt to database
 * 
 * @param leadId - Lead ID
 * @param webhookUrl - Webhook URL
 * @param payload - Webhook payload
 * @param response - Webhook response
 */
async function logWebhookAttempt(
  leadId: string,
  webhookUrl: string,
  payload: WebhookPayload,
  response: WebhookResponse
): Promise<void> {
  try {
    await query(
      `INSERT INTO nigredo_leads.webhook_logs 
       (lead_id, webhook_url, payload, status_code, response_body, 
        attempt_number, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        leadId,
        webhookUrl,
        JSON.stringify(payload),
        response.statusCode || null,
        response.responseBody || null,
        response.attemptNumber,
        response.success,
        response.error || null,
      ]
    );

    logger.info('Webhook attempt logged', {
      leadId,
      attemptNumber: response.attemptNumber,
      success: response.success,
    });
  } catch (error) {
    logger.error('Error logging webhook attempt', error as Error, {
      leadId,
    });
    // Don't throw error, just log it
  }
}

/**
 * Sends webhook with retry logic
 * 
 * @param webhookUrl - Target webhook URL
 * @param payload - Webhook payload
 * @param leadId - Lead ID (for logging)
 * @returns Webhook response
 */
export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
  leadId: string
): Promise<WebhookResponse> {
  logger.info('Sending webhook', {
    webhookUrl,
    leadId,
    eventType: payload.event_type,
  });

  let lastError: string | undefined;
  let lastStatusCode: number | undefined;
  let lastResponseBody: string | undefined;

  // Attempt webhook delivery with retries
  for (let attempt = 1; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
    try {
      logger.info('Webhook attempt', {
        leadId,
        attempt,
        maxRetries: WEBHOOK_MAX_RETRIES,
      });

      const response = await sendHttpRequest(
        webhookUrl,
        payload,
        WEBHOOK_TIMEOUT_MS
      );

      lastStatusCode = response.statusCode;
      lastResponseBody = response.body;

      // Check if response is successful (2xx status code)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        logger.info('Webhook sent successfully', {
          leadId,
          attempt,
          statusCode: response.statusCode,
        });

        const webhookResponse: WebhookResponse = {
          success: true,
          statusCode: response.statusCode,
          responseBody: response.body,
          attemptNumber: attempt,
        };

        // Log successful attempt
        await logWebhookAttempt(leadId, webhookUrl, payload, webhookResponse);

        return webhookResponse;
      }

      // Non-2xx status code, treat as error
      lastError = `HTTP ${response.statusCode}: ${response.body}`;

      logger.warn('Webhook attempt failed with non-2xx status', {
        leadId,
        attempt,
        statusCode: response.statusCode,
        responseBody: response.body,
      });
    } catch (error: any) {
      lastError = error.message || 'Unknown error';

      logger.warn('Webhook attempt failed with exception', {
        leadId,
        attempt,
        error: lastError,
      });
    }

    // Log failed attempt
    const failedResponse: WebhookResponse = {
      success: false,
      statusCode: lastStatusCode,
      responseBody: lastResponseBody,
      error: lastError,
      attemptNumber: attempt,
    };

    await logWebhookAttempt(leadId, webhookUrl, payload, failedResponse);

    // Wait before retry (exponential backoff)
    if (attempt < WEBHOOK_MAX_RETRIES) {
      const delayMs = WEBHOOK_RETRY_DELAYS[attempt - 1] || 1000;
      logger.info('Waiting before retry', { leadId, delayMs });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // All retries failed
  const errorObj = new Error(lastError || 'All retry attempts failed');
  logger.error('Webhook failed after all retries', errorObj, {
    leadId,
    maxRetries: WEBHOOK_MAX_RETRIES,
  });

  return {
    success: false,
    statusCode: lastStatusCode,
    responseBody: lastResponseBody,
    error: lastError || 'All retry attempts failed',
    attemptNumber: WEBHOOK_MAX_RETRIES,
  };
}

/**
 * Sends webhook asynchronously (fire and forget)
 * Does not wait for response or retries
 * 
 * @param webhookUrl - Target webhook URL
 * @param payload - Webhook payload
 * @param leadId - Lead ID (for logging)
 */
export async function sendWebhookAsync(
  webhookUrl: string,
  payload: WebhookPayload,
  leadId: string
): Promise<void> {
  // Fire and forget - don't await
  sendWebhook(webhookUrl, payload, leadId).catch((error) => {
    logger.error('Async webhook failed', error as Error, {
      leadId,
    });
  });
}

/**
 * Creates webhook payload for lead.created event
 * 
 * @param lead - Lead data
 * @returns Webhook payload
 */
export function createLeadCreatedPayload(lead: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}): WebhookPayload {
  return {
    event_type: 'lead.created',
    timestamp: new Date().toISOString(),
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      message: lead.message,
      utmSource: lead.utm_source,
      utmMedium: lead.utm_medium,
      utmCampaign: lead.utm_campaign,
      ipAddress: lead.ip_address,
      userAgent: lead.user_agent,
      createdAt: lead.created_at.toISOString(),
    },
  };
}

/**
 * Gets webhook delivery statistics for a lead
 * 
 * @param leadId - Lead ID
 * @returns Webhook statistics
 */
export async function getWebhookStats(leadId: string): Promise<{
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lastAttemptAt: Date | null;
  lastSuccess: boolean | null;
}> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE success = TRUE) as successful_attempts,
        COUNT(*) FILTER (WHERE success = FALSE) as failed_attempts,
        MAX(sent_at) as last_attempt_at,
        (SELECT success FROM nigredo_leads.webhook_logs 
         WHERE lead_id = $1 
         ORDER BY sent_at DESC 
         LIMIT 1) as last_success
       FROM nigredo_leads.webhook_logs
       WHERE lead_id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        lastAttemptAt: null,
        lastSuccess: null,
      };
    }

    const row = result.rows[0];
    return {
      totalAttempts: parseInt(row.total_attempts, 10),
      successfulAttempts: parseInt(row.successful_attempts, 10),
      failedAttempts: parseInt(row.failed_attempts, 10),
      lastAttemptAt: row.last_attempt_at ? new Date(row.last_attempt_at) : null,
      lastSuccess: row.last_success,
    };
  } catch (error) {
    logger.error('Error getting webhook stats', error as Error, {
      leadId,
    });
    throw error;
  }
}

/**
 * Retries failed webhooks for a lead
 * Useful for manual retry operations
 * 
 * @param leadId - Lead ID
 * @param webhookUrl - Webhook URL
 * @param payload - Webhook payload
 * @returns Webhook response
 */
export async function retryFailedWebhook(
  leadId: string,
  webhookUrl: string,
  payload: WebhookPayload
): Promise<WebhookResponse> {
  logger.info('Retrying failed webhook', { leadId });

  const stats = await getWebhookStats(leadId);

  if (stats.lastSuccess === true) {
    logger.warn('Webhook already succeeded, skipping retry', { leadId });
    return {
      success: true,
      attemptNumber: 0,
      error: 'Webhook already succeeded',
    };
  }

  return sendWebhook(webhookUrl, payload, leadId);
}
