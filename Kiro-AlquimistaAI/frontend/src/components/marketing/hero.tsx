'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Automação Empresarial com IA</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Transforme seu
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent"> Negócio </span>
              com IA
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Ecossistema completo de agentes de IA especializados para automatizar 
              prospecção, atendimento, marketing e muito mais. Aumente sua produtividade 
              em até 10x.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/signup">
                <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center group">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              
              <Link href="/demo">
                <button className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-200 rounded-xl font-semibold hover:border-purple-400 hover:shadow-lg transition-all">
                  Ver Demonstração
                </button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Seguro e Confiável</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span>Setup em 5 minutos</span>
              </div>
            </div>
          </motion.div>
          
          {/* Right column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-slate-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Alquimista.AI</h3>
                    <p className="text-sm text-slate-600">Agentes Ativos</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Leads Capturados', value: '1,247', color: 'from-blue-500 to-cyan-500' },
                    { label: 'Conversas Ativas', value: '89', color: 'from-green-500 to-emerald-500' },
                    { label: 'Reuniões Agendadas', value: '34', color: 'from-purple-500 to-pink-500' },
                    { label: 'Taxa de Conversão', value: '36.5%', color: 'from-orange-500 to-red-500' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200"
                    >
                      <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-600">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
              >
                ✓ Online
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
              >
                🚀 +127% este mês
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
