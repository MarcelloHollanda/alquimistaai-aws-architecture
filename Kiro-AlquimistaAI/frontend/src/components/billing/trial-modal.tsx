'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send } from 'lucide-react';
import {
  startTrial,
  invokeTrial,
  formatTrialStatus,
  validateTrialMessage,
  loadTrialState,
  saveTrialState,
} from '@/lib/trials-client';
import { useToast } from '@/hooks/use-toast';

interface TrialModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  targetName: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function TrialModal({
  open,
  onClose,
  targetType,
  targetId,
  targetName,
}: TrialModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialState, setTrialState] = useState<any>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      initializeTrial();
    }
  }, [open, targetId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeTrial = async () => {
    try {
      // Tentar carregar estado salvo
      const saved = loadTrialState(targetType, targetId);
      if (saved) {
        setTrialState(saved);
        return;
      }

      // Iniciar novo trial
      const userId = 'user-temp-' + Date.now(); // TODO: Pegar do auth
      const trial = await startTrial({
        userId,
        targetType,
        targetId,
      });

      setTrialState(trial);
      saveTrialState(targetType, targetId, trial);

      setMessages([
        {
          role: 'assistant',
          content: `Olá! Sou o ${targetName}. Você tem ${trial.remainingTokens} interações gratuitas ou até ${new Date(trial.expiresAt).toLocaleString('pt-BR')}. Como posso ajudar?`,
        },
      ]);
    } catch (error: any) {
      toast({
        title: 'Erro ao iniciar teste',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || trialExpired) return;

    const validation = validateTrialMessage(input);
    if (!validation.valid) {
      toast({
        title: 'Mensagem inválida',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const userId = 'user-temp-' + Date.now(); // TODO: Pegar do auth
      const response = await invokeTrial({
        userId,
        targetType,
        targetId,
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response },
      ]);

      // Atualizar estado do trial
      const updatedState = {
        ...trialState,
        remainingTokens: response.remainingTokens,
        expiresAt: response.expiresAt,
      };
      setTrialState(updatedState);
      saveTrialState(targetType, targetId, updatedState);
    } catch (error: any) {
      if (error.message.includes('terminou') || error.message.includes('expirou')) {
        setTrialExpired(true);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Seu período de teste terminou. Para continuar usando esta IA, assine o agente ou fale com nosso time comercial.',
          },
        ]);
      } else {
        toast({
          title: 'Erro ao enviar mensagem',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {targetName} - Teste Gratuito
            </h2>
            {trialState && !trialExpired && (
              <p className="text-sm text-gray-600">
                {formatTrialStatus(
                  trialState.remainingTokens,
                  trialState.expiresAt
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2">
                  <p className="text-sm text-gray-600">Digitando...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          {trialExpired ? (
            <div className="space-y-2">
              <p className="text-center text-sm text-gray-600">
                Seu teste gratuito terminou.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    // TODO: Redirecionar para página apropriada
                  }}
                >
                  {targetType === 'agent'
                    ? 'Assinar Agente'
                    : 'Falar com Comercial'}
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
