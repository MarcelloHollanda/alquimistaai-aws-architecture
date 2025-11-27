'use client';

import { useState } from 'react';
import { SubnucleoCard } from './subnucleo-card';
import { TrialModal } from './trial-modal';

const SUBNUCLEOS = [
  {
    id: 'saude',
    name: 'SubNúcleo Saúde',
    description:
      'Gestão completa de leads e automações para clínicas, consultórios e hospitais.',
    basePrice: 365.0,
  },
  {
    id: 'vendas',
    name: 'SubNúcleo Vendas',
    description:
      'Automação de prospecção, qualificação e follow-up de leads de vendas.',
    basePrice: 365.0,
  },
  {
    id: 'cobranca',
    name: 'SubNúcleo Cobrança',
    description:
      'Gestão automatizada de cobranças, negociações e recuperação de crédito.',
    basePrice: 365.0,
  },
  {
    id: 'educacao',
    name: 'SubNúcleo Educação',
    description:
      'Captação e gestão de leads para instituições de ensino e cursos.',
    basePrice: 365.0,
  },
];

export function FibonacciSection() {
  const [selectedSubnucleo, setSelectedSubnucleo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const handleTestClick = (subnucleo: { id: string; name: string }) => {
    setSelectedSubnucleo(subnucleo);
    setTrialModalOpen(true);
  };

  return (
    <>
      <div className="mb-8 border-t pt-12">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Fibonacci & SubNúcleos
          </h2>
          <p className="text-gray-600">
            Soluções completas de orquestração B2B com SubNúcleos especializados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SUBNUCLEOS.map((subnucleo) => (
            <SubnucleoCard
              key={subnucleo.id}
              {...subnucleo}
              onTestClick={() => handleTestClick(subnucleo)}
            />
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Importante:</strong> Os SubNúcleos Fibonacci incluem taxa de
            implementação e suporte mensal personalizado. Entre em contato com
            nossa equipe comercial para uma proposta customizada.
          </p>
        </div>
      </div>

      {selectedSubnucleo && (
        <TrialModal
          open={trialModalOpen}
          onClose={() => {
            setTrialModalOpen(false);
            setSelectedSubnucleo(null);
          }}
          targetType="subnucleo"
          targetId={selectedSubnucleo.id}
          targetName={selectedSubnucleo.name}
        />
      )}
    </>
  );
}
