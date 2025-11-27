'use client';

import { Button } from '@/components/ui/button';
import { useSelection } from '@/stores/selection-store';

interface SubnucleoCardProps {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  onTestClick: () => void;
}

export function SubnucleoCard({
  id,
  name,
  description,
  basePrice,
  onTestClick,
}: SubnucleoCardProps) {
  const { isSubnucleoSelected, addSubnucleo, removeSubnucleo } = useSelection();
  const selected = isSubnucleoSelected(id);

  const handleToggle = () => {
    if (selected) {
      removeSubnucleo(id);
    } else {
      addSubnucleo({
        id,
        name,
        basePrice,
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
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      </div>

      <p className="mb-4 text-sm text-gray-700">{description}</p>

      <div className="mb-4 border-t pt-4">
        <div className="mb-2">
          <span className="text-2xl font-bold text-gray-900">
            R$ {basePrice.toFixed(2)}
          </span>
          <span className="text-sm text-gray-600">/mês por SubNúcleo</span>
        </div>
        <p className="text-xs text-gray-600">
          + taxa de implementação e suporte mensal (sob consulta)
        </p>
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
          {selected ? '✓ Tenho Interesse' : 'Tenho Interesse'}
        </Button>
      </div>
    </div>
  );
}
