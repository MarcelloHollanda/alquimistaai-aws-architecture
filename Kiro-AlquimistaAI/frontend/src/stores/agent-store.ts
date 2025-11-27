import { create } from 'zustand';
import type { Agent } from '@/types';

interface AgentState {
  agents: Agent[];
  loading: boolean;
  selectedAgent: Agent | null;
  fetchAgents: () => Promise<void>;
  toggleAgent: (id: string) => Promise<void>;
  updateConfig: (id: string, config: Record<string, any>) => Promise<void>;
  setSelectedAgent: (agent: Agent | null) => void;
}

// Mock data
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Qualificação de Leads',
    type: 'qualification',
    status: 'active',
    description: 'Qualifica leads automaticamente usando IA',
    subnucleo: 'nigredo',
    icon: 'users',
    isActive: true,
    tier: 'professional',
    configuration: {},
    metrics: {
      executionCount: 1247,
      successRate: 95.5,
      lastExecution: new Date(),
      avgResponseTime: 1.2,
    },
  },
  {
    id: '2',
    name: 'Follow-up Automático',
    type: 'followup',
    status: 'active',
    description: 'Envia follow-ups personalizados',
    subnucleo: 'hermes',
    icon: 'mail',
    isActive: true,
    tier: 'professional',
    configuration: {},
    metrics: {
      executionCount: 856,
      successRate: 92.3,
      lastExecution: new Date(),
      avgResponseTime: 0.8,
    },
  },
  {
    id: '3',
    name: 'Atendimento ao Cliente',
    type: 'support',
    status: 'inactive',
    description: 'Responde dúvidas 24/7',
    subnucleo: 'sophia',
    icon: 'message-circle',
    isActive: false,
    tier: 'starter',
    configuration: {},
    metrics: {
      executionCount: 0,
      successRate: 0,
      lastExecution: undefined,
      avgResponseTime: 0,
    },
  },
  {
    id: '4',
    name: 'Análise de Sentimento',
    type: 'sentiment',
    status: 'active',
    description: 'Analisa sentimento de conversas',
    subnucleo: 'atlas',
    icon: 'heart',
    isActive: true,
    tier: 'professional',
    configuration: {},
    metrics: {
      executionCount: 432,
      successRate: 88.7,
      lastExecution: new Date(),
      avgResponseTime: 1.5,
    },
  },
  {
    id: '5',
    name: 'Relatórios Automáticos',
    type: 'reports',
    status: 'active',
    description: 'Gera relatórios de performance',
    subnucleo: 'oracle',
    icon: 'file-text',
    isActive: false,
    tier: 'enterprise',
    configuration: {},
    metrics: {
      executionCount: 0,
      successRate: 0,
      lastExecution: undefined,
      avgResponseTime: 0,
    },
  },
];

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  selectedAgent: null,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ agents: mockAgents, loading: false });
    } catch (error) {
      console.error('Error fetching agents:', error);
      set({ loading: false });
    }
  },

  toggleAgent: async (id: string) => {
    const agent = get().agents.find(a => a.id === id);
    if (!agent) return;

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set({
        agents: get().agents.map(a =>
          a.id === id ? { ...a, isActive: !a.isActive } : a
        ),
      });
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  },

  updateConfig: async (id: string, config: Record<string, any>) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Config updated for agent:', id, config);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  },

  setSelectedAgent: (agent: Agent | null) => set({ selectedAgent: agent }),
}));
