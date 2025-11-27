/**
 * Página de Fluxos do Fibonacci
 * 
 * Descreve os principais fluxos de orquestração do sistema
 */

'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle,
  Layers,
  Mail,
  Target,
  MessageSquare,
  Calendar,
  Database,
  Zap,
  GitBranch
} from 'lucide-react';

export default function FibonacciFluxosPage() {
  const fluxos = [
    {
      id: 'lead-capture',
      title: 'Captura e Processamento de Leads',
      description: 'Fluxo completo desde a captura até o agendamento de reunião',
      color: 'from-pink-500 to-rose-500',
      steps: [
        {
          icon: Mail,
          title: 'Entrada de Lead',
          description: 'Lead capturado pelo Nigredo (formulário, landing page, etc.)',
          system: 'Nigredo'
        },
        {
          icon: Zap,
          title: 'Evento Enviado',
          description: 'Nigredo envia evento lead.created via webhook para Fibonacci',
          system: 'Nigredo → Fibonacci'
        },
        {
          icon: Database,
          title: 'Armazenamento',
          description: 'Fibonacci armazena lead no Aurora PostgreSQL',
          system: 'Fibonacci'
        },
        {
          icon: GitBranch,
          title: 'Publicação no EventBridge',
          description: 'Evento publicado no barramento para outros agentes',
          system: 'Fibonacci'
        },
        {
          icon: Target,
          title: 'Qualificação',
          description: 'Agente de qualificação processa e pontua o lead',
          system: 'Nigredo'
        },
        {
          icon: MessageSquare,
          title: 'Abordagem',
          description: 'Agente de disparo envia mensagem personalizada',
          system: 'Nigredo'
        },
        {
          icon: Calendar,
          title: 'Agendamento',
          description: 'Agente de agendamento marca reunião automaticamente',
          system: 'Nigredo'
        },
        {
          icon: CheckCircle,
          title: 'Conclusão',
          description: 'Lead qualificado e reunião agendada com sucesso',
          system: 'Sistema'
        }
      ]
    },
    {
      id: 'event-orchestration',
      title: 'Orquestração de Eventos',
      description: 'Como o Fibonacci gerencia a comunicação entre núcleos',
      color: 'from-purple-500 to-indigo-500',
      steps: [
        {
          icon: Layers,
          title: 'Núcleo Origem',
          description: 'Qualquer núcleo pode ser origem de um evento',
          system: 'Núcleo'
        },
        {
          icon: Zap,
          title: 'Webhook/API',
          description: 'Evento enviado via webhook HTTP ou API REST',
          system: 'HTTP'
        },
        {
          icon: Database,
          title: 'Fibonacci Recebe',
          description: 'Valida, autentica e armazena o evento',
          system: 'Fibonacci'
        },
        {
          icon: GitBranch,
          title: 'EventBridge',
          description: 'Publica no barramento de eventos AWS',
          system: 'AWS EventBridge'
        },
        {
          icon: Layers,
          title: 'Núcleos Destino',
          description: 'Múltiplos núcleos podem consumir o mesmo evento',
          system: 'Núcleos'
        },
        {
          icon: CheckCircle,
          title: 'Processamento',
          description: 'Cada núcleo processa de forma independente',
          system: 'Sistema'
        }
      ]
    },
    {
      id: 'error-handling',
      title: 'Tratamento de Erros e Retry',
      description: 'Como o sistema garante resiliência e confiabilidade',
      color: 'from-orange-500 to-red-500',
      steps: [
        {
          icon: Zap,
          title: 'Tentativa Inicial',
          description: 'Primeira tentativa de processar o evento',
          system: 'Sistema'
        },
        {
          icon: GitBranch,
          title: 'Falha Detectada',
          description: 'Sistema detecta erro no processamento',
          system: 'Sistema'
        },
        {
          icon: Zap,
          title: 'Retry Automático',
          description: 'Até 3 tentativas com exponential backoff',
          system: 'Sistema'
        },
        {
          icon: Database,
          title: 'Log de Erro',
          description: 'Erro registrado no CloudWatch e banco de dados',
          system: 'Fibonacci'
        },
        {
          icon: GitBranch,
          title: 'Dead Letter Queue',
          description: 'Eventos com falha persistente vão para DLQ',
          system: 'AWS SQS'
        },
        {
          icon: CheckCircle,
          title: 'Alerta',
          description: 'Equipe notificada via CloudWatch Alarms',
          system: 'Sistema'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          Fluxos de Orquestração
        </h1>
        <p className="text-lg text-slate-600">
          Entenda como o Fibonacci coordena a comunicação entre os núcleos e agentes
        </p>
      </motion.div>

      {/* Fluxos */}
      <div className="space-y-8">
        {fluxos.map((fluxo, fluxoIndex) => (
          <motion.div
            key={fluxo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: fluxoIndex * 0.1 }}
            className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden"
          >
            {/* Fluxo Header */}
            <div className={`bg-gradient-to-r ${fluxo.color} p-6 text-white`}>
              <h2 className="text-2xl font-bold mb-2">{fluxo.title}</h2>
              <p className="text-white/90">{fluxo.description}</p>
            </div>

            {/* Steps */}
            <div className="p-6">
              <div className="space-y-4">
                {fluxo.steps.map((step, stepIndex) => {
                  const Icon = step.icon;
                  const isLast = stepIndex === fluxo.steps.length - 1;
                  
                  return (
                    <div key={stepIndex} className="relative">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-br ${fluxo.color} rounded-lg flex items-center justify-center flex-shrink-0 relative z-10`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-slate-800">{step.title}</h3>
                              <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold">
                                {step.system}
                              </span>
                            </div>
                            <p className="text-slate-600">{step.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Connector Line */}
                      {!isLast && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-200 z-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Technical Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Detalhes Técnicos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Comunicação Assíncrona</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Webhooks HTTP com retry automático</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>EventBridge para pub/sub pattern</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>SQS Dead Letter Queue para falhas</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Idempotência garantida por event_id</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3">Observabilidade</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>X-Ray tracing distribuído</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>CloudWatch Logs estruturados</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Métricas customizadas em tempo real</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Alarmes automáticos para falhas</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3">Segurança</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Autenticação via HMAC signature</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Validação de payload com Zod</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Criptografia KMS em repouso</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>TLS 1.2+ para dados em trânsito</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3">Escalabilidade</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Lambda auto-scaling automático</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Aurora Serverless v2 adaptativo</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>EventBridge ilimitado</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Pay-per-use sem custos fixos</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
