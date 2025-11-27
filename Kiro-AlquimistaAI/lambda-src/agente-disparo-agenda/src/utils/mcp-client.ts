/**
 * Cliente MCP (Model Context Protocol)
 * Integração com serviços de IA para geração de mensagens
 */

import { createLogger } from './logger';

const logger = createLogger({ service: 'mcp-client' });

export interface MCPGenerateMessageRequest {
  contactName: string;
  company: string;
  messageType: string;
  context?: Record<string, any>;
}

export interface MCPGenerateMessageResponse {
  success: boolean;
  message?: string;
  fallbackMessage?: string;
  error?: string;
}

/**
 * Gera mensagem personalizada via MCP
 */
export async function generateMessage(
  contact: { name?: string; company?: string; contactName?: string },
  messageType: string
): Promise<MCPGenerateMessageResponse> {
  try {
    const mcpEndpoint = process.env.MCP_ENDPOINT;
    
    if (!mcpEndpoint) {
      logger.warn('MCP_ENDPOINT não configurado, usando mensagem padrão');
      return {
        success: true,
        fallbackMessage: `Olá ${contact.contactName || contact.name}, tudo bem?`
      };
    }

    const response = await fetch(`${mcpEndpoint}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_API_KEY}`
      },
      body: JSON.stringify({
        contactName: contact.contactName || contact.name,
        company: contact.company,
        messageType
      })
    });

    if (!response.ok) {
      throw new Error(`MCP API error: ${response.status}`);
    }

    const data = await response.json() as { message: string; fallbackMessage?: string };
    
    return {
      success: true,
      message: data.message,
      fallbackMessage: data.fallbackMessage
    };
  } catch (error) {
    logger.error('Erro ao gerar mensagem via MCP', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      fallbackMessage: `Olá ${contact.contactName || contact.name}, tudo bem?`
    };
  }
}

/**
 * Analisa resposta de contato via MCP
 */
export async function analyzeReply(
  replyContent: string,
  contact: { name?: string; company?: string; contactName?: string }
): Promise<{
  success: boolean;
  analysis?: {
    sentiment: string;
    intent: string;
    nextAction: string;
    urgency: string;
    confidence: number;
  };
  error?: string;
}> {
  try {
    const mcpEndpoint = process.env.MCP_ENDPOINT;
    
    if (!mcpEndpoint) {
      logger.warn('MCP_ENDPOINT não configurado, usando análise padrão');
      return {
        success: true,
        analysis: {
          sentiment: 'neutral',
          intent: 'unknown',
          nextAction: 'manual_review',
          urgency: 'low',
          confidence: 0.5
        }
      };
    }

    const response = await fetch(`${mcpEndpoint}/analyze-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_API_KEY}`
      },
      body: JSON.stringify({
        replyContent,
        contactName: contact.contactName || contact.name,
        company: contact.company
      })
    });

    if (!response.ok) {
      throw new Error(`MCP API error: ${response.status}`);
    }

    const data = await response.json() as { analysis: any };
    
    return {
      success: true,
      analysis: data.analysis
    };
  } catch (error) {
    logger.error('Erro ao analisar resposta via MCP', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      analysis: {
        sentiment: 'neutral',
        intent: 'unknown',
        nextAction: 'manual_review',
        urgency: 'low',
        confidence: 0.3
      }
    };
  }
}

/**
 * Gera briefing automático via MCP
 */
export async function generateBriefing(
  contact: any,
  meetingData: any
): Promise<{
  success: boolean;
  briefing?: {
    summary: string;
    keyPoints: string[];
    recommendations: string[];
    riskFactors: string[];
    nextSteps: string[];
  };
  error?: string;
}> {
  try {
    const mcpEndpoint = process.env.MCP_ENDPOINT;
    
    if (!mcpEndpoint) {
      logger.warn('MCP_ENDPOINT não configurado, usando briefing padrão');
      return {
        success: true,
        briefing: {
          summary: `Briefing para reunião com ${contact.name || contact.contactName}`,
          keyPoints: ['Revisar histórico de conversas'],
          recommendations: ['Preparar proposta comercial'],
          riskFactors: ['Briefing gerado automaticamente'],
          nextSteps: ['Confirmar agenda']
        }
      };
    }

    const response = await fetch(`${mcpEndpoint}/generate-briefing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_API_KEY}`
      },
      body: JSON.stringify({
        contact,
        meetingData
      })
    });

    if (!response.ok) {
      throw new Error(`MCP API error: ${response.status}`);
    }

    const data = await response.json() as { 
      briefing?: {
        summary: string;
        keyPoints: string[];
        recommendations: string[];
        riskFactors: string[];
        nextSteps: string[];
      }
    };
    
    return {
      success: true,
      briefing: data.briefing
    };
  } catch (error) {
    logger.error('Erro ao gerar briefing via MCP', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

export const mcpClient = {
  generateMessage,
  analyzeReply,
  generateBriefing
};
