import { apiClient } from './api-client';

export interface Agent {
  id: string;
  name: string;
  segment: string;
  description: string;
  tags: string[];
  priceMonthly: number;
  isActive: boolean;
}

export interface AgentsResponse {
  agents: Agent[];
}

/**
 * Lista todos os agentes AlquimistaAI disponíveis
 */
export async function listAgents(): Promise<Agent[]> {
  try {
    const response = await apiClient.get<AgentsResponse>('/api/agents');
    return response.agents;
  } catch (error) {
    console.error('Erro ao listar agentes:', error);
    throw new Error('Não foi possível carregar os agentes');
  }
}

/**
 * Busca um agente específico por ID
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const agents = await listAgents();
    return agents.find((agent) => agent.id === agentId) || null;
  } catch (error) {
    console.error('Erro ao buscar agente:', error);
    return null;
  }
}

/**
 * Filtra agentes por segmento
 */
export async function getAgentsBySegment(segment: string): Promise<Agent[]> {
  try {
    const agents = await listAgents();
    return agents.filter((agent) => agent.segment === segment);
  } catch (error) {
    console.error('Erro ao filtrar agentes por segmento:', error);
    return [];
  }
}

/**
 * Busca agentes por tags
 */
export async function getAgentsByTags(tags: string[]): Promise<Agent[]> {
  try {
    const agents = await listAgents();
    return agents.filter((agent) =>
      tags.some((tag) => agent.tags.includes(tag))
    );
  } catch (error) {
    console.error('Erro ao filtrar agentes por tags:', error);
    return [];
  }
}

/**
 * Calcula o total mensal para uma lista de agentes
 */
export function calculateMonthlyTotal(agents: Agent[]): number {
  return agents.reduce((total, agent) => total + agent.priceMonthly, 0);
}
