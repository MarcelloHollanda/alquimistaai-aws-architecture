'use client';

/**
 * Exemplo de uso das animações reutilizáveis
 * 
 * Este componente demonstra como usar as animações do arquivo animations.ts
 */

import { motion } from 'framer-motion';
import {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  transitions,
  viewport,
  hoverScale,
  cardHover,
} from '@/utils/animations';
import { Sparkles } from 'lucide-react';

export function AnimatedSectionExample() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fade in from bottom */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={viewport}
          transition={transitions.smooth}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Exemplo de Animações
          </h2>
          <p className="text-xl text-slate-600">
            Demonstração das animações disponíveis
          </p>
        </motion.div>

        {/* Stagger animation for grid items */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewport}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              variants={staggerItem}
              whileHover={cardHover}
              className="bg-white rounded-xl p-6 border-2 border-slate-200 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Card {item}
              </h3>
              <p className="text-slate-600">
                Este card tem animação de hover com scale e shadow
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Fade in from sides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <motion.div
            variants={fadeInLeft}
            initial="initial"
            whileInView="animate"
            viewport={viewport}
            transition={transitions.smooth}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8"
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Fade In Left
            </h3>
            <p className="text-slate-600">
              Este elemento entra da esquerda com fade
            </p>
          </motion.div>

          <motion.div
            variants={fadeInRight}
            initial="initial"
            whileInView="animate"
            viewport={viewport}
            transition={transitions.smooth}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8"
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Fade In Right
            </h3>
            <p className="text-slate-600">
              Este elemento entra da direita com fade
            </p>
          </motion.div>
        </div>

        {/* Scale in animation */}
        <motion.div
          variants={scaleIn}
          initial="initial"
          whileInView="animate"
          viewport={viewport}
          transition={transitions.spring}
          className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-12 text-center"
        >
          <h3 className="text-3xl font-bold mb-4">Scale In Animation</h3>
          <p className="text-lg text-purple-100 mb-6">
            Este elemento cresce com efeito de spring
          </p>
          <motion.button
            whileHover={hoverScale}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold"
          >
            Botão com Hover
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
