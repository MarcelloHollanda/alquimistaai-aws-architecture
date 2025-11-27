/**
 * Base Handler - Wrapper para handlers Lambda com tratamento de erros
 * 
 * Garante que erros de autorização e validação retornem códigos HTTP corretos
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthorizationError } from './authorization-middleware';
import { ValidationException } from './input-validator';

/**
 * Wrapper para handlers Lambda
 * Adiciona tratamento de erros e headers de segurança
 */
export async function withBaseHandler(
  event: APIGatewayProxyEvent,
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> {
  try {
    const result = await handler(event);
    
    // Adicionar headers de segurança
    return {
      ...result,
      headers: {
        ...(result.headers || {}),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Type': 'application/json'
      }
    };
  } catch (error: any) {
    console.error('Handler error:', error);
    
    // Erro de autorização (401 ou 403)
    if (error instanceof AuthorizationError) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        },
        body: JSON.stringify({
          error: error.message
        })
      };
    }
    
    // Erro de validação (400)
    if (error instanceof ValidationException) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        },
        body: JSON.stringify({
          error: 'Validation failed',
          details: error.errors
        })
      };
    }
    
    // Erro genérico (500)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      },
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
}
