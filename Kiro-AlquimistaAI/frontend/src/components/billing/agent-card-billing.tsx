'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelection } from '@/stores/selection-store';
import { Agent } from '@/lib/agents-client';

interface AgentCardBillingProps {
  agent: Agent;
  onTestClick: () => void;
}

export function AgentCardBilling({ agent, onTestClick }: AgentCardBillingProps) {
  const { isAgentSelected, addAgent, removeAgent } = useSelection();
  const selected = isAgentSelected(agent.id);

  const handleToggle = () => {
    if (selected) {
      removeAgent(agent.id);
    } else {
      addAgent({
        id: agent.id,
        name: agent.name,
        segment: agent.segment,
        priceMonthly: agent.priceMonthly,
      });
    }
  };

  return (
    <div
      className={`rounded-lg border p-6 transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
        <p className="text-sm text-gray-600">{agent.segment}</p>
      </div>

      <p className="mb-4 text-sm text-gray-700 line-clamp-3">
        {agent.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {agent.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mb-4 border-t pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900">
            R$ {agent.priceMonthly.toFixed(2)}
          </span>
          <span className="text-sm text-gray-600">/mês</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onTestClick}
          className="flex-1"
        >
          Teste nossa IA
        </Button>
        <Button
          variant={selected ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggle}
          className="flex-1"
        >
          {selected ? '✓ Adicionado' : 'Adicionar ao Plano'}
        </Button>
      </div>
    </div>
  );
}
