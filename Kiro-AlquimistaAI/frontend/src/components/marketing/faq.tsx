'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    category: 'Geral',
    questions: [
      {
        question: 'O que é o Alquimista.AI?',
        answer: 'O Alquimista.AI é um ecossistema completo de agentes de inteligência artificial que automatizam processos de negócio, com foco especial em prospecção B2B, qualificação de leads e automação de vendas. Nossa plataforma utiliza tecnologia AWS serverless e modelos de linguagem avançados para entregar resultados excepcionais.',
      },
      {
        question: 'Como funciona o período de teste?',
        answer: 'Oferecemos 14 dias de teste grátis em todos os planos (exceto Enterprise). Você tem acesso completo a todas as funcionalidades do plano escolhido, sem necessidade de cartão de crédito. Após o período de teste, você pode escolher continuar com o plano ou cancelar sem custos.',
      },
      {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Não há fidelidade ou multas por cancelamento. Você pode cancelar seu plano a qualquer momento através do painel de controle. O acesso permanece ativo até o final do período pago.',
      },
    ],
  },
  {
    category: 'Técnico',
    questions: [
      {
        question: 'Quais integrações estão disponíveis?',
        answer: 'Oferecemos integrações nativas com WhatsApp Business API, Google Calendar, CRMs populares (Salesforce, HubSpot, Pipedrive), ferramentas de email marketing, e APIs customizadas. Novas integrações são adicionadas regularmente baseadas no feedback dos clientes.',
      },
      {
        question: 'Os dados estão seguros?',
        answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta (TLS 1.2+), armazenamento criptografado com AWS KMS, e somos 100% conformes com a LGPD. Todos os dados são armazenados em servidores AWS na região de São Paulo (sa-east-1). Realizamos auditorias de segurança regulares e mantemos certificações de conformidade.',
      },
      {
        question: 'Como funciona a escalabilidade?',
        answer: 'Nossa arquitetura serverless escala automaticamente baseada na demanda. Você nunca precisa se preocupar com infraestrutura - o sistema ajusta recursos automaticamente para lidar com picos de uso, garantindo performance consistente mesmo com milhares de leads simultâneos.',
      },
    ],
  },
  {
    category: 'Funcionalidades',
    questions: [
      {
        question: 'Quantos agentes de IA estão incluídos?',
        answer: 'O plano Starter inclui 3 agentes, o Pro inclui 7 agentes (todos os agentes Nigredo), e o Enterprise oferece agentes ilimitados incluindo agentes customizados desenvolvidos especificamente para suas necessidades. Cada agente é especializado em uma função específica do funil de vendas.',
      },
      {
        question: 'Como funciona a prospecção automatizada?',
        answer: 'Nossos agentes de IA trabalham 24/7 para identificar, qualificar e engajar leads. O processo inclui: enriquecimento de dados, segmentação inteligente, personalização de mensagens, análise de sentimento, agendamento automático e relatórios detalhados. Tudo acontece de forma autônoma, com supervisão humana apenas quando necessário.',
      },
      {
        question: 'Posso customizar os agentes?',
        answer: 'No plano Pro, você pode configurar parâmetros e templates dos agentes. No plano Enterprise, desenvolvemos agentes completamente customizados para seus processos específicos, incluindo treinamento com seus dados e integração com sistemas proprietários.',
      },
    ],
  },
  {
    category: 'Suporte',
    questions: [
      {
        question: 'Que tipo de suporte vocês oferecem?',
        answer: 'Plano Starter: suporte por email com resposta em até 24h. Plano Pro: suporte prioritário por email e chat com resposta em até 4h. Plano Enterprise: suporte dedicado 24/7 com gerente de conta, SLA garantido e canal direto com a equipe técnica.',
      },
      {
        question: 'Vocês oferecem treinamento?',
        answer: 'Sim! Todos os planos incluem documentação completa e vídeos tutoriais. O plano Pro inclui webinars mensais de treinamento. O plano Enterprise inclui treinamento personalizado on-site ou remoto para sua equipe, além de consultoria estratégica para otimização de processos.',
      },
    ],
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  // Filter FAQs based on search
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search */}
      <div className="mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredFaqs.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{category.category}</h3>
            <div className="space-y-4">
              {category.questions.map((faq, questionIndex) => {
                const key = `${categoryIndex}-${questionIndex}`;
                const isOpen = openIndex === key;

                return (
                  <motion.div
                    key={questionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: questionIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-purple-300 transition-colors"
                  >
                    <button
                      onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${key}`}
                      id={`faq-question-${key}`}
                    >
                      <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          id={`faq-answer-${key}`}
                          role="region"
                          aria-labelledby={`faq-question-${key}`}
                        >
                          <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredFaqs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">Nenhuma pergunta encontrada para "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Limpar busca
          </button>
        </div>
      )}

      {/* Contact Support */}
      <div className="mt-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Ainda tem dúvidas?</h3>
        <p className="text-slate-600 mb-6">
          Nossa equipe está pronta para ajudar você
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:suporte@alquimista.ai"
            className="px-6 py-3 bg-white text-slate-800 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border-2 border-slate-200"
          >
            Enviar Email
          </a>
          <a
            href="/contato"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
          >
            Falar com Especialista
          </a>
        </div>
      </div>
    </div>
  );
}
