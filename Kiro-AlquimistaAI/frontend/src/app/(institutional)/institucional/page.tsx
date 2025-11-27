'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, TrendingUp, Shield } from 'lucide-react';
import { PricingTable } from '@/components/marketing/pricing-table';
import { Testimonials } from '@/components/marketing/testimonials';
import { FAQ } from '@/components/marketing/faq';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-pink-50/30 to-blue-100/50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Transformação Digital com IA</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Alquimista.AI
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto">
              Transformamos dados em ouro através da alquimia da inteligência artificial
            </p>
            
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
              Um ecossistema completo de agentes de IA que automatizam, otimizam e revolucionam seus processos de negócio
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

      {/* Manifesto Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Nosso Manifesto
            </h2>
            <div className="prose prose-lg mx-auto text-slate-600">
              <p className="text-center text-xl mb-8 italic">
                "Assim como os alquimistas medievais buscavam transformar metais comuns em ouro, 
                nós transformamos dados brutos em insights valiosos através da IA"
              </p>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Nossa Visão</h3>
                <p className="text-slate-600 mb-4">
                  Acreditamos que a verdadeira transformação digital acontece quando a inteligência artificial 
                  trabalha em harmonia com a inteligência humana, potencializando capacidades e liberando tempo 
                  para o que realmente importa: inovação e crescimento.
                </p>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-4 mt-8">Nossos Princípios</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">✦</span>
                    <span><strong>Transparência:</strong> IA explicável e auditável em cada decisão</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2">✦</span>
                    <span><strong>Autonomia:</strong> Agentes independentes que trabalham 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✦</span>
                    <span><strong>Evolução:</strong> Aprendizado contínuo e melhoria constante</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">✦</span>
                    <span><strong>Ética:</strong> Conformidade com LGPD e práticas responsáveis</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
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
              Por Que Alquimista.AI?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Uma plataforma completa que revoluciona a forma como você faz negócios
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Automação Inteligente',
                description: 'Agentes de IA que automatizam processos complexos com precisão',
                color: 'from-yellow-400 to-orange-500'
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Crescimento Acelerado',
                description: 'Aumente suas vendas em até 300% com prospecção automatizada',
                color: 'from-green-400 to-emerald-500'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Segurança Total',
                description: 'Conformidade com LGPD e criptografia de ponta a ponta',
                color: 'from-blue-400 to-indigo-500'
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'IA de Última Geração',
                description: 'Tecnologia AWS com modelos de linguagem avançados',
                color: 'from-purple-400 to-pink-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
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
              Nosso Ecossistema
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Três núcleos integrados que trabalham em harmonia
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Fibonacci',
                subtitle: 'Núcleo Orquestrador',
                description: 'O cérebro do sistema que coordena todos os agentes e processos',
                color: 'from-purple-500 to-indigo-500',
                link: '/fibonacci'
              },
              {
                name: 'Nigredo',
                subtitle: 'Núcleo de Prospecção',
                description: '7 agentes especializados em prospecção B2B automatizada',
                color: 'from-pink-500 to-rose-500',
                link: '/nigredo'
              },
              {
                name: 'Alquimista',
                subtitle: 'Plataforma SaaS',
                description: 'Marketplace de agentes com gestão multi-tenant',
                color: 'from-blue-500 to-cyan-500',
                link: '/billing'
              }
            ].map((nucleus, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Link href={nucleus.link}>
                  <div className="group bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl border-2 border-slate-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                    <div className={`w-12 h-12 bg-gradient-to-br ${nucleus.color} rounded-lg mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{nucleus.name}</h3>
                    <p className="text-sm text-purple-600 font-semibold mb-3">{nucleus.subtitle}</p>
                    <p className="text-slate-600 mb-4">{nucleus.description}</p>
                    <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                      Explorar <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
              Planos e Preços
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho e necessidades do seu negócio
            </p>
          </motion.div>

          <PricingTable />
        </div>
      </section>

      {/* Testimonials Section */}
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
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Empresas de todos os tamanhos estão transformando seus resultados com Alquimista.AI
            </p>
          </motion.div>

          <Testimonials />
        </div>
      </section>

      {/* FAQ Section */}
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
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tudo o que você precisa saber sobre o Alquimista.AI
            </p>
          </motion.div>

          <FAQ />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para Transformar Seu Negócio?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Junte-se a centenas de empresas que já estão usando IA para crescer mais rápido
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Começar Teste Grátis
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
