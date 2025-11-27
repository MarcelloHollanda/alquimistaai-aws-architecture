'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { 
  ArrowRight, Users, MessageSquare, Calendar, BarChart, Brain, Send, 
  FileText, Sparkles, Target, TrendingUp, Clock, Shield, Zap, CheckCircle,
  ChevronDown, ChevronUp, Rocket, Database, Cloud, Lock, Activity, 
  GitBranch, Layers, RefreshCw, Award, Star, TrendingDown, X
} from 'lucide-react';
import { LeadForm } from '@/components/nigredo/lead-form';

export default function NigredoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const agents = [
    {
      icon: <Users className="w-8 h-8" />,
      name: 'Recebimento',
      subtitle: 'Captação Inteligente',
      description: 'Processa planilhas, valida dados, enriquece informações via APIs externas e segmenta leads automaticamente',
      features: [
        'Validação de CNPJ/CPF',
        'Enriquecimento via Receita Federal',
        'Remoção de duplicatas',
        'Segmentação por setor e porte'
      ],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      name: 'Estratégia',
      subtitle: 'Campanhas Personalizadas',
      description: 'Analisa perfil comercial, cria mensagens customizadas e define a melhor abordagem para cada segmento',
      features: [
        'Análise de perfil comercial',
        'Mensagens para topo, meio e fundo do funil',
        'Testes A/B automáticos',
        'Seleção de canal ideal'
      ],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      icon: <Send className="w-8 h-8" />,
      name: 'Disparo',
      subtitle: 'Envio Inteligente',
      description: 'Envia mensagens via WhatsApp ou Email no momento perfeito, respeitando horários comerciais e rate limits',
      features: [
        'Horário comercial inteligente',
        'Rate limiting por tenant',
        'Variações de horário',
        'Idempotência garantida'
      ],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      name: 'Atendimento',
      subtitle: 'IA Conversacional',
      description: 'Responde interações em tempo real com contexto completo, ajustando tom baseado em análise de sentimento',
      features: [
        'Respostas contextualizadas',
        'Histórico completo do lead',
        'Ajuste de tom automático',
        'Decisão de próximo passo'
      ],
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      name: 'Sentimento',
      subtitle: 'Análise Emocional',
      description: 'Detecta emoções, intenções e palavras-chave críticas usando AWS Comprehend e NLP avançado',
      features: [
        'Classificação emocional',
        'Detecção de descadastro (LGPD)',
        'Intensidade de sentimento',
        'Palavras-chave de objeção'
      ],
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      name: 'Agendamento',
      subtitle: 'Reuniões Automáticas',
      description: 'Consulta disponibilidade, propõe horários e cria eventos no calendário com briefing completo',
      features: [
        'Integração Google Calendar',
        'Proposta de 3 horários',
        'Confirmação automática',
        'Briefing comercial gerado'
      ],
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-50 to-blue-50'
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      name: 'Relatórios',
      subtitle: 'Insights Estratégicos',
      description: 'Analisa métricas de todos os agentes e gera insights acionáveis com IA para otimização contínua',
      features: [
        'Funil de conversão completo',
        'Objeções recorrentes',
        'ROI por campanha',
        'Insights com LLM'
      ],
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50'
    }
  ];

  const benefits = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Precisão Cirúrgica',
      description: 'Cada lead recebe a mensagem certa, no momento certo, pelo canal certo'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Operação 24/7',
      description: 'Agentes trabalhando continuamente, sem pausas ou feriados'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'LGPD Compliant',
      description: 'Conformidade total com regulamentações de proteção de dados'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Resposta Instantânea',
      description: 'Tempo de resposta médio de 2 segundos para qualquer interação'
    }
  ];

  const technologies = [
    { icon: <Cloud className="w-8 h-8" />, name: 'AWS Cloud', description: 'Infraestrutura escalável e segura' },
    { icon: <Brain className="w-8 h-8" />, name: 'GPT-4 & Claude', description: 'IA de última geração' },
    { icon: <Database className="w-8 h-8" />, name: 'PostgreSQL', description: 'Banco de dados robusto' },
    { icon: <Lock className="w-8 h-8" />, name: 'Criptografia E2E', description: 'Segurança máxima' }
  ];

  const beforeAfter = [
    {
      before: { icon: <TrendingDown className="w-6 h-6" />, text: 'Prospecção manual e demorada', color: 'text-red-500' },
      after: { icon: <TrendingUp className="w-6 h-6" />, text: 'Automação completa 24/7', color: 'text-green-500' }
    },
    {
      before: { icon: <X className="w-6 h-6" />, text: 'Taxa de resposta de 15%', color: 'text-red-500' },
      after: { icon: <CheckCircle className="w-6 h-6" />, text: 'Taxa de resposta de 85%', color: 'text-green-500' }
    },
    {
      before: { icon: <Clock className="w-6 h-6" />, text: 'Horas para responder leads', color: 'text-red-500' },
      after: { icon: <Zap className="w-6 h-6" />, text: 'Resposta em 2 segundos', color: 'text-green-500' }
    }
  ];

  const useCases = [
    {
      company: 'Tech Startup B2B',
      result: '300% aumento em leads qualificados',
      description: 'Automatizou completamente o processo de prospecção, liberando o time comercial para focar em fechamento',
      metric: '150 → 450 leads/mês'
    },
    {
      company: 'Consultoria Empresarial',
      result: '85% taxa de resposta',
      description: 'Mensagens personalizadas por IA geraram engajamento sem precedentes',
      metric: '15% → 85% resposta'
    },
    {
      company: 'SaaS Enterprise',
      result: '60% redução no CAC',
      description: 'Automação reduziu drasticamente o custo de aquisição de clientes',
      metric: 'R$ 5.000 → R$ 2.000'
    }
  ];

  const faqs = [
    {
      question: 'Como o Nigredo se integra com meu CRM atual?',
      answer: 'O Nigredo possui APIs REST completas e webhooks que se integram facilmente com qualquer CRM (Salesforce, HubSpot, Pipedrive, etc). Também oferecemos integrações nativas via Zapier e Make.'
    },
    {
      question: 'Os agentes realmente funcionam 24/7?',
      answer: 'Sim! Os 7 agentes operam continuamente na nuvem AWS, processando leads, respondendo mensagens e agendando reuniões a qualquer hora do dia ou da noite, incluindo fins de semana e feriados.'
    },
    {
      question: 'Como funciona a conformidade com LGPD?',
      answer: 'Todos os agentes possuem detecção automática de solicitações de descadastro e esquecimento. Dados são criptografados em repouso e em trânsito, com auditoria completa de todas as operações.'
    },
    {
      question: 'Quanto tempo leva para implementar?',
      answer: 'A implementação básica leva de 2 a 5 dias úteis. Isso inclui configuração dos agentes, integração com seus sistemas e treinamento da equipe. Você pode começar a ver resultados na primeira semana.'
    },
    {
      question: 'Posso personalizar as mensagens dos agentes?',
      answer: 'Totalmente! Você tem controle completo sobre o tom, estilo e conteúdo das mensagens. Os agentes aprendem com seu feedback e se adaptam ao seu público-alvo específico.'
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-purple-100/50 via-pink-50/30 to-blue-100/50">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-8">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Núcleo de Prospecção B2B Automatizada</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Nigredo
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto">
              7 agentes de IA especializados trabalhando 24/7
            </p>
            
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
              Automatize completamente seu processo de prospecção: desde a captação de leads até o agendamento de reuniões
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/billing"
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/fibonacci"
                className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 border-2 border-slate-200"
              >
                Conhecer o Fibonacci
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Por Que Nigredo?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A revolução da prospecção B2B com inteligência artificial
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Os 7 Agentes Especializados
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Cada agente é um especialista em sua área, trabalhando em harmonia para maximizar seus resultados
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${agent.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {agent.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{agent.name}</h3>
                <p className="text-sm text-purple-600 font-semibold mb-3">{agent.subtitle}</p>
                <p className="text-slate-600 mb-6">{agent.description}</p>
                <ul className="space-y-2">
                  {agent.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-slate-600 text-sm">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tecnologia de Ponta
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Infraestrutura AWS com IA de última geração
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-4 mx-auto">
                  {tech.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{tech.name}</h3>
                <p className="text-sm text-slate-600">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Antes vs Depois
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Veja a transformação que o Nigredo traz para seu processo comercial
            </p>
          </motion.div>

          <div className="space-y-6">
            {beforeAfter.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <div className={`${item.before.color}`}>
                      {item.before.icon}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Antes</p>
                      <p className="text-slate-700 font-medium">{item.before.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`${item.after.color}`}>
                      {item.after.icon}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Depois</p>
                      <p className="text-slate-700 font-medium">{item.after.text}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Casos de Sucesso
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Empresas reais que transformaram sua prospecção com Nigredo
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="w-6 h-6 text-purple-500" />
                  <h3 className="text-lg font-bold text-slate-800">{useCase.company}</h3>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  {useCase.result}
                </div>
                <p className="text-slate-600 mb-4">{useCase.description}</p>
                <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>{useCase.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-slate-600">
              Tudo que você precisa saber sobre o Nigredo
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-slate-800">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Teste Grátis por 14 Dias</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Comece Agora
              </h2>
              
              <p className="text-xl text-slate-600 mb-8">
                Preencha o formulário e receba uma demonstração personalizada dos 7 agentes Nigredo em ação
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: <CheckCircle className="w-5 h-5" />, text: 'Sem compromisso ou cartão de crédito' },
                  { icon: <CheckCircle className="w-5 h-5" />, text: 'Demonstração personalizada em 24h' },
                  { icon: <CheckCircle className="w-5 h-5" />, text: 'Suporte dedicado durante o teste' },
                  { icon: <CheckCircle className="w-5 h-5" />, text: 'Acesso completo a todos os agentes' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="text-green-500">{item.icon}</div>
                    <span className="text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <LeadForm
                source="nigredo-landing-page"
                onSuccess={(leadId) => {
                  console.log('Lead criado com sucesso:', leadId);
                  // Opcional: tracking analytics
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'lead_submission', {
                      event_category: 'engagement',
                      event_label: 'nigredo_form',
                      value: leadId,
                    });
                  }
                }}
                onError={(error) => {
                  console.error('Erro no formulário:', error);
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-12 text-center text-white"
          >
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Transformação Garantida</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para 10x Sua Prospecção?
            </h2>
            
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Deixe os 7 agentes Nigredo trabalharem para você 24/7 enquanto você foca no que realmente importa: fechar negócios
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/billing"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Ver Planos e Começar Agora
              </Link>
              <Link
                href="/contato"
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                Falar com Especialista
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
