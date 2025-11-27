import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedAgent {
  id: string;
  name: string;
  segment: string;
  priceMonthly: number;
}

export interface SelectedSubnucleo {
  id: string;
  name: string;
  basePrice: number;
}

interface SelectionState {
  // Agentes selecionados
  selectedAgents: SelectedAgent[];
  
  // SubNúcleos selecionados
  selectedSubnucleos: SelectedSubnucleo[];
  
  // Actions para agentes
  addAgent: (agent: SelectedAgent) => void;
  removeAgent: (agentId: string) => void;
  isAgentSelected: (agentId: string) => boolean;
  clearAgents: () => void;
  
  // Actions para SubNúcleos
  addSubnucleo: (subnucleo: SelectedSubnucleo) => void;
  removeSubnucleo: (subnucleoId: string) => void;
  isSubnucleoSelected: (subnucleoId: string) => boolean;
  clearSubnucleos: () => void;
  
  // Actions gerais
  clearAll: () => void;
  
  // Computed values
  getTotalAgentsPrice: () => number;
  getTotalSubnucleosBasePrice: () => number;
  hasAgents: () => boolean;
  hasSubnucleos: () => boolean;
  getAgentIds: () => string[];
  getSubnucleoIds: () => string[];
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
      selectedAgents: [],
      selectedSubnucleos: [],
      
      // Actions para agentes
      addAgent: (agent) =>
        set((state) => {
          // Evitar duplicatas
          if (state.selectedAgents.some((a) => a.id === agent.id)) {
            return state;
          }
          return {
            selectedAgents: [...state.selectedAgents, agent],
          };
        }),
      
      removeAgent: (agentId) =>
        set((state) => ({
          selectedAgents: state.selectedAgents.filter((a) => a.id !== agentId),
        })),
      
      isAgentSelected: (agentId) =>
        get().selectedAgents.some((a) => a.id === agentId),
      
      clearAgents: () =>
        set({
          selectedAgents: [],
        }),
      
      // Actions para SubNúcleos
      addSubnucleo: (subnucleo) =>
        set((state) => {
          // Evitar duplicatas
          if (state.selectedSubnucleos.some((s) => s.id === subnucleo.id)) {
            return state;
          }
          return {
            selectedSubnucleos: [...state.selectedSubnucleos, subnucleo],
          };
        }),
      
      removeSubnucleo: (subnucleoId) =>
        set((state) => ({
          selectedSubnucleos: state.selectedSubnucleos.filter(
            (s) => s.id !== subnucleoId
          ),
        })),
      
      isSubnucleoSelected: (subnucleoId) =>
        get().selectedSubnucleos.some((s) => s.id === subnucleoId),
      
      clearSubnucleos: () =>
        set({
          selectedSubnucleos: [],
        }),
      
      // Actions gerais
      clearAll: () =>
        set({
          selectedAgents: [],
          selectedSubnucleos: [],
        }),
      
      // Computed values
      getTotalAgentsPrice: () =>
        get().selectedAgents.reduce((sum, agent) => sum + agent.priceMonthly, 0),
      
      getTotalSubnucleosBasePrice: () =>
        get().selectedSubnucleos.reduce(
          (sum, subnucleo) => sum + subnucleo.basePrice,
          0
        ),
      
      hasAgents: () => get().selectedAgents.length > 0,
      
      hasSubnucleos: () => get().selectedSubnucleos.length > 0,
      
      getAgentIds: () => get().selectedAgents.map((a) => a.id),
      
      getSubnucleoIds: () => get().selectedSubnucleos.map((s) => s.id),
    })
);

// Hook para facilitar o uso
export function useSelection() {
  const store = useSelectionStore();
  
  return {
    // State
    selectedAgents: store.selectedAgents,
    selectedSubnucleos: store.selectedSubnucleos,
    
    // Actions
    addAgent: store.addAgent,
    removeAgent: store.removeAgent,
    isAgentSelected: store.isAgentSelected,
    clearAgents: store.clearAgents,
    
    addSubnucleo: store.addSubnucleo,
    removeSubnucleo: store.removeSubnucleo,
    isSubnucleoSelected: store.isSubnucleoSelected,
    clearSubnucleos: store.clearSubnucleos,
    
    clearAll: store.clearAll,
    
    // Computed
    totalAgentsPrice: store.getTotalAgentsPrice(),
    totalSubnucleosBasePrice: store.getTotalSubnucleosBasePrice(),
    hasAgents: store.hasAgents(),
    hasSubnucleos: store.hasSubnucleos(),
    agentIds: store.getAgentIds(),
    subnucleoIds: store.getSubnucleoIds(),
  };
}
