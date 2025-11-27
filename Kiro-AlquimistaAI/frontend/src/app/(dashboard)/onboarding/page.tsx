'use client';

import { useRouter } from 'next/navigation';
import { Wizard } from '@/components/onboarding/wizard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgentStore } from '@/stores/agent-store';
import { ROUTES, SUBNUCLEO_LABELS } from '@/lib/constants';
import { Building, Target, Zap } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { agents, toggleAgent } = useAgentStore();
  
  const [companyInfo, setCompanyInfo] = useState({
    industry: '',
    size: '',
    goals: [] as string[],
  });

  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const handleComplete = async () => {
    // Ativar agentes selecionados
    for (const agentId of selectedAgents) {
      await toggleAgent(agentId);
    }

    toast({
      title: 'Onboarding concluído!',
      description: 'Bem-vindo ao AlquimistaAI. Seus agentes estão sendo ativados.',
    });

    router.push(ROUTES.DASHBOARD);
  };

  const steps = [
    {
      id: 1,
      title: 'Conte-nos sobre sua empresa',
      description: 'Isso nos ajuda a personalizar sua experiência',
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Setor de atuação</label>
            <Input
              placeholder="Ex: E-commerce, SaaS, Consultoria..."
              value={companyInfo.industry}
              onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tamanho da empresa</label>
            <div className="grid grid-cols-2 gap-2">
              {['1-10', '11-50', '51-200', '200+'].map((size) => (
                <Button
                  key={size}
                  variant={companyInfo.size === size ? 'default' : 'outline'}
                  onClick={() => setCompanyInfo({ ...companyInfo, size })}
                >
                  {size} funcionários
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Por que perguntamos?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Essas informações nos ajudam a recomendar os agentes mais adequados para seu negócio
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Quais são seus objetivos?',
      description: 'Selecione os principais desafios que deseja resolver',
      component: (
        <div className="space-y-4">
          <div className="grid gap-3">
            {[
              { id: 'leads', label: 'Gerar mais leads qualificados', icon: '🎯' },
              { id: 'conversion', label: 'Aumentar taxa de conversão', icon: '📈' },
              { id: 'automation', label: 'Automatizar processos', icon: '⚡' },
              { id: 'support', label: 'Melhorar atendimento', icon: '💬' },
              { id: 'analytics', label: 'Ter mais insights de dados', icon: '📊' },
            ].map((goal) => {
              const isSelected = companyInfo.goals.includes(goal.id);
              return (
                <Button
                  key={goal.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className="justify-start h-auto py-3"
                  onClick={() => {
                    const newGoals = isSelected
                      ? companyInfo.goals.filter((g) => g !== goal.id)
                      : [...companyInfo.goals, goal.id];
                    setCompanyInfo({ ...companyInfo, goals: newGoals });
                  }}
                >
                  <span className="text-xl mr-3">{goal.icon}</span>
                  <span>{goal.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Dica</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Você pode selecionar múltiplos objetivos. Vamos recomendar agentes para cada um deles.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Ative seus primeiros agentes',
      description: 'Recomendamos começar com estes agentes baseado no seu perfil',
      component: (
        <div className="space-y-4">
          <div className="grid gap-3">
            {agents.slice(0, 4).map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    const newSelected = isSelected
                      ? selectedAgents.filter((id) => id !== agent.id)
                      : [...selectedAgents, agent.id];
                    setSelectedAgents(newSelected);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {SUBNUCLEO_LABELS[agent.subnucleo as keyof typeof SUBNUCLEO_LABELS]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-4 flex-shrink-0">
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Comece simples</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Você pode ativar mais agentes depois no painel de controle. Recomendamos começar com 2-3 agentes.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return <Wizard steps={steps} onComplete={handleComplete} />;
}
