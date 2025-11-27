'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Network, Database, Zap, Shield, Activity, Cloud } from 'lucide-react';

export default function FibonacciPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-8">
              <Network className="w-4 h-4" />
              <span className="text-sm font-medium">Núcleo Orquestrador Central</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Fibonacci
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto">
              O cérebro do ecossistema Alquimista.AI
            </p>
            
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
              Orquestra todos os agentes, gerencia eventos e garante a harmonia perfeita entre os núcleos
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/billing"
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/nigredo"
                className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 border-2 border-slate-200"
              >
                Conhecer o Nigredo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Arquitetura Fibonacci
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Infraestrutura AWS de última geração com escalabilidade infinita
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Cloud className="w-8 h-8" />,
                title: 'API Gateway',
                description: 'HTTP API de alta performance com roteamento inteligente',
                tech: 'AWS API Gateway'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Lambda Functions',
                description: 'Processamento serverless com escalabilidade automática',
                tech: 'AWS Lambda'
              },
              {
                icon: <Database className="w-8 h-8" />,
                title: 'Aurora Serverless v2',
                description: 'Banco de dados PostgreSQL com auto-scaling',
                tech: 'AWS RDS Aurora'
              },
              {
                icon: <Network className="w-8 h-8" />,
                title: 'EventBridge',
                description: 'Barramento de eventos para comunicação assíncrona',
                tech: 'AWS EventBridge'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Cognito',
                description: 'Autenticação e autorização segura',
                tech: 'AWS Cognito'
              },
              {
                icon: <Activity className="w-8 h-8" />,
                title: 'CloudWatch',
                description: 'Monitoramento e observabilidade em tempo real',
                tech: 'AWS CloudWatch'
              }
            ].map((component, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white mb-4">
                  {component.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{component.title}</h3>
                <p className="text-slate-600 mb-3">{component.description}</p>
                <span className="text-sm text-purple-600 font-semibold">{component.tech}</span>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Recursos Principais
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tudo que você precisa para orquestrar seus agentes de IA
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                title: 'Orquestração de Eventos',
                description: 'EventBridge gerencia a comunicação entre todos os agentes com padrão pub/sub',
                features: ['Eventos assíncronos', 'Retry automático', 'Dead Letter Queue', 'Rastreamento completo']
              },
              {
                title: 'Escalabilidade Infinita',
                description: 'Infraestrutura serverless que escala automaticamente conforme a demanda',
                features: ['Auto-scaling', 'Pay-per-use', 'Zero downtime', 'Global distribution']
              },
              {
                title: 'Segurança Enterprise',
                description: 'Criptografia end-to-end e conformidade com as principais regulamentações',
                features: ['Criptografia KMS', 'LGPD compliant', 'Audit logs', 'IAM roles']
              },
              {
                title: 'Observabilidade Total',
                description: 'Monitoramento em tempo real com dashboards e alertas inteligentes',
                features: ['CloudWatch Dashboards', 'X-Ray tracing', 'Logs estruturados', 'Alarmes customizados']
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-slate-600">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para Orquestrar Seus Agentes?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              O Fibonacci está deployado e funcionando na AWS. Comece agora mesmo!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/billing"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Ver Planos
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                Acessar Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">
              Especificações Técnicas
            </h2>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Região AWS</h4>
                  <p className="text-slate-600">us-east-1 (N. Virginia)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Runtime</h4>
                  <p className="text-slate-600">Node.js 20.x</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Database</h4>
                  <p className="text-slate-600">PostgreSQL (Aurora Serverless v2)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">API</h4>
                  <p className="text-slate-600">HTTP API Gateway</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Latência</h4>
                  <p className="text-slate-600">{'<'} 500ms (p95)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Disponibilidade</h4>
                  <p className="text-slate-600">99.9% SLA</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
