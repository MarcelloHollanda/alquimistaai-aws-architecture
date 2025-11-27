'use client';

import { AgentsGridBilling } from '@/components/billing/agents-grid-billing';
import { FibonacciSection } from '@/components/billing/fibonacci-section';
import { SelectionSummary } from '@/components/billing/selection-summary';

export default function PublicBillingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 py-16 text-white">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="mb-4 text-4xl font-bold">
            Escolha seus Agentes de IA
          </h1>
          <p className="text-xl text-white/90">
            Monte seu plano personalizado com os agentes AlquimistaAI ou
            solicite uma solução completa com Fibonacci.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Agentes Grid */}
        <AgentsGridBilling />

        {/* Fibonacci Section */}
        <FibonacciSection />
      </div>

      {/* Selection Summary (Sticky) */}
      <SelectionSummary />

      {/* Padding para o summary fixo */}
      <div className="h-32" />
    </div>
  );
}
