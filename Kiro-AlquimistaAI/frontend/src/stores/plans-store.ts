// Store Zustand: Plans Management
// Gerencia estado da seleção de planos e SubNúcleos

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxSubnucleos: number;
  maxAgents: number;
  maxUsers: number;
  includesFibonacci: boolean;
  features: string[];
  sortOrder: number;
}

interface Subnucleo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  agents: Agent[];
}

interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  isRequired: boolean;
}

interface PlansStore {
  // Data
  plans: Plan[];
  subnucleos: Subnucleo[];
  
  // Selection State
  selectedPlanId: string | null;
  selectedSubnucleos: string[];
  selectedAgents: string[];
  billingCycle: 'monthly' | 'yearly';
  
  // Loading States
  isLoadingPlans: boolean;
  isLoadingSubnucleos: boolean;
  isUpdatingSubscription: boolean;
  
  // Actions
  setPlans: (plans: Plan[]) => void;
  setSubnucleos: (subnucleos: Subnucleo[]) => void;
  setSelectedPlan: (planId: string) => void;
  toggleSubnucleo: (subnucleoId: string) => void;
  toggleAgent: (agentId: string) => void;
  setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
  setLoadingPlans: (loading: boolean) => void;
  setLoadingSubnucleos: (loading: boolean) => void;
  setUpdatingSubscription: (updating: boolean) => void;
  
  // Computed
  getSelectedPlan: () => Plan | null;
  getSelectedSubnucleos: () => Subnucleo[];
  getTotalPrice: () => number;
  canSelectMoreSubnucleos: () => boolean;
  getSelectedAgentsCount: () => number;
  
  // Reset
  resetSelection: () => void;
  clearStore: () => void;
}

export const usePlansStore = create<PlansStore>()((set, get) => ({
    // Initial State
    plans: [],
    subnucleos: [],
    selectedPlanId: null,
    selectedSubnucleos: [],
    selectedAgents: [],
    billingCycle: 'monthly',
    isLoadingPlans: false,
    isLoadingSubnucleos: false,
    isUpdatingSubscription: false,

    // Actions
    setPlans: (plans) => set({ plans }),
    setSubnucleos: (subnucleos) => set({ subnucleos }),
    
    setSelectedPlan: (planId) => {
      set({ 
        selectedPlanId: planId,
        selectedSubnucleos: [],
        selectedAgents: []
      });
    },
    
    toggleSubnucleo: (subnucleoId) => {
      const { selectedSubnucleos, getSelectedPlan } = get();
      const plan = getSelectedPlan();
      
      if (!plan) return;
      
      const isSelected = selectedSubnucleos.includes(subnucleoId);
      
      if (isSelected) {
        const subnucleo = get().subnucleos.find(s => s.id === subnucleoId);
        const agentIds = subnucleo?.agents.map(a => a.id) || [];
        
        set(state => ({
          selectedSubnucleos: state.selectedSubnucleos.filter(id => id !== subnucleoId),
          selectedAgents: state.selectedAgents.filter(id => !agentIds.includes(id))
        }));
      } else {
        if (selectedSubnucleos.length < plan.maxSubnucleos) {
          const subnucleo = get().subnucleos.find(s => s.id === subnucleoId);
          const requiredAgentIds = subnucleo?.agents
            .filter(a => a.isRequired)
            .map(a => a.id) || [];
          
          set(state => ({
            selectedSubnucleos: [...state.selectedSubnucleos, subnucleoId],
            selectedAgents: [...state.selectedAgents, ...requiredAgentIds]
          }));
        }
      }
    },
    
    toggleAgent: (agentId) => {
      const { selectedAgents } = get();
      const isSelected = selectedAgents.includes(agentId);
      
      const agent = get().subnucleos
        .flatMap(s => s.agents)
        .find(a => a.id === agentId);
      
      if (!agent || agent.isRequired) return;
      
      if (isSelected) {
        set(state => ({
          selectedAgents: state.selectedAgents.filter(id => id !== agentId)
        }));
      } else {
        set(state => ({
          selectedAgents: [...state.selectedAgents, agentId]
        }));
      }
    },
    
    setBillingCycle: (cycle) => set({ billingCycle: cycle }),
    setLoadingPlans: (loading) => set({ isLoadingPlans: loading }),
    setLoadingSubnucleos: (loading) => set({ isLoadingSubnucleos: loading }),
    setUpdatingSubscription: (updating) => set({ isUpdatingSubscription: updating }),
    
    // Computed
    getSelectedPlan: () => {
      const { plans, selectedPlanId } = get();
      return plans.find(p => p.id === selectedPlanId) || null;
    },
    
    getSelectedSubnucleos: () => {
      const { subnucleos, selectedSubnucleos } = get();
      return subnucleos.filter(s => selectedSubnucleos.includes(s.id));
    },
    
    getTotalPrice: () => {
      const { billingCycle } = get();
      const plan = get().getSelectedPlan();
      if (!plan) return 0;
      
      return billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    },
    
    canSelectMoreSubnucleos: () => {
      const { selectedSubnucleos } = get();
      const plan = get().getSelectedPlan();
      if (!plan) return false;
      
      return selectedSubnucleos.length < plan.maxSubnucleos;
    },
    
    getSelectedAgentsCount: () => {
      return get().selectedAgents.length;
    },
    
    // Reset
    resetSelection: () => {
      set({
        selectedPlanId: null,
        selectedSubnucleos: [],
        selectedAgents: [],
        billingCycle: 'monthly'
      });
    },
    
    clearStore: () => {
      set({
        plans: [],
        subnucleos: [],
        selectedPlanId: null,
        selectedSubnucleos: [],
        selectedAgents: [],
        billingCycle: 'monthly',
        isLoadingPlans: false,
        isLoadingSubnucleos: false,
        isUpdatingSubscription: false
      });
    }
  })
);
