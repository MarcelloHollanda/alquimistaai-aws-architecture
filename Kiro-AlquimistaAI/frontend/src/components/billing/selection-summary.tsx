'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSelection } from '@/stores/selection-store';
import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';

export function SelectionSummary() {
  const router = useRouter();
  const {
    selectedAgents,
    selectedSubnucleos,
    totalAgentsPrice,
    totalSubnucleosBasePrice,
    hasAgents,
    hasSubnucleos,
    removeAgent,
    removeSubnucleo,
    clearAll,
  } = useSelection();

  if (!hasAgents && !hasSubnucleos) {
    return null;
  }

  const handleContinue = () => {
    if (hasSubnucleos) {
      // Redirecionar para contato comercial
      router.push('/app/commercial/contact');
    } else {
      // Redirecionar para checkout
      router.push('/app/billing/checkout');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-start justify-between gap-6">
          {/* Resumo de Seleção */}
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Resumo da Seleção
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-gray-600 hover:text-gray-900"
              >
                Limpar Tudo
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Agentes */}
              {hasAgents && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Agentes AlquimistaAI ({selectedAgents.length})
                  </p>
                  <div className="space-y-1">
                    {selectedAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{agent.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(agent.priceMonthly)}
                          </span>
                          <button
                            onClick={() => removeAgent(agent.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubNúcleos */}
              {hasSubnucleos && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    SubNúcleos Fibonacci ({selectedSubnucleos.length})
                  </p>
                  <div className="space-y-1">
                    {selectedSubnucleos.map((subnucleo) => (
                      <div
                        key={subnucleo.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{subnucleo.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(subnucleo.basePrice)} (base)
                          </span>
                          <button
                            onClick={() => removeSubnucleo(subnucleo.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    + taxas de implementação e suporte (sob consulta)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Total e Ação */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              {hasAgents && (
                <div className="mb-1">
                  <span className="text-sm text-gray-600">Agentes: </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalAgentsPrice)}/mês
                  </span>
                </div>
              )}
              {hasSubnucleos && (
                <div className="mb-1">
                  <span className="text-sm text-gray-600">
                    Fibonacci (base):{' '}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalSubnucleosBasePrice)}/mês
                  </span>
                </div>
              )}
              {hasAgents && hasSubnucleos && (
                <div className="border-t pt-1">
                  <span className="text-sm text-gray-600">Total base: </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(totalAgentsPrice + totalSubnucleosBasePrice)}
                    /mês
                  </span>
                </div>
              )}
            </div>

            <Button onClick={handleContinue} size="lg" className="min-w-[200px]">
              {hasSubnucleos
                ? 'Falar com Comercial'
                : 'Continuar para Pagamento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
