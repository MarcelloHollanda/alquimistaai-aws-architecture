// Stripe Client Helper
// Inicializa e exporta cliente Stripe configurado

import Stripe from 'stripe';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from './logger';

let stripeClient: Stripe | null = null;
let stripeSecretKey: string | null = null;

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Busca a API key do Stripe no Secrets Manager
 */
async function getStripeSecretKey(): Promise<string> {
  if (stripeSecretKey) {
    return stripeSecretKey;
  }

  const env = process.env.ENV || 'dev';
  const secretName = `/alquimista/${env}/stripe/secret-key`;

  try {
    logger.info('Fetching Stripe secret key from Secrets Manager', { secretName });

    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);

    if (!response.SecretString) {
      throw new Error('Secret string is empty');
    }

    stripeSecretKey = response.SecretString;
    return stripeSecretKey;
  } catch (error) {
    logger.error('Failed to fetch Stripe secret key', {
      secretName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to initialize Stripe client');
  }
}

/**
 * Inicializa e retorna o cliente Stripe
 */
export async function getStripeClient(): Promise<Stripe> {
  if (stripeClient) {
    return stripeClient;
  }

  const apiKey = await getStripeSecretKey();

  stripeClient = new Stripe(apiKey, {
    apiVersion: '2024-11-20.acacia',
    typescript: true,
    appInfo: {
      name: 'AlquimistaAI',
      version: '1.0.0',
    },
  });

  logger.info('Stripe client initialized successfully');

  return stripeClient;
}

/**
 * Busca o webhook secret do Stripe no Secrets Manager
 */
export async function getStripeWebhookSecret(): Promise<string> {
  const env = process.env.ENV || 'dev';
  const secretName = `/alquimista/${env}/stripe/webhook-secret`;

  try {
    logger.info('Fetching Stripe webhook secret from Secrets Manager', { secretName });

    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);

    if (!response.SecretString) {
      throw new Error('Secret string is empty');
    }

    return response.SecretString;
  } catch (error) {
    logger.error('Failed to fetch Stripe webhook secret', {
      secretName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to get webhook secret');
  }
}

/**
 * Cria ou recupera um Stripe Customer
 */
export async function getOrCreateStripeCustomer(
  tenantId: string,
  email: string,
  companyName: string,
  existingCustomerId?: string
): Promise<string> {
  const stripe = await getStripeClient();

  // Se já existe um customer ID, retornar
  if (existingCustomerId) {
    try {
      await stripe.customers.retrieve(existingCustomerId);
      logger.info('Using existing Stripe customer', { customerId: existingCustomerId, tenantId });
      return existingCustomerId;
    } catch (error) {
      logger.warn('Existing customer ID is invalid, creating new one', {
        customerId: existingCustomerId,
        tenantId,
      });
    }
  }

  // Criar novo customer
  try {
    const customer = await stripe.customers.create({
      email,
      name: companyName,
      metadata: {
        tenantId,
      },
    });

    logger.info('Created new Stripe customer', {
      customerId: customer.id,
      tenantId,
    });

    return customer.id;
  } catch (error) {
    logger.error('Failed to create Stripe customer', {
      tenantId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to create Stripe customer');
  }
}

export default {
  getStripeClient,
  getStripeWebhookSecret,
  getOrCreateStripeCustomer,
};
