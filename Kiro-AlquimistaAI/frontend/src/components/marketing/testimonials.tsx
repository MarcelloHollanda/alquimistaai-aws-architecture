'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'CEO',
    company: 'TechStart Solutions',
    image: '/avatars/carlos.jpg',
    content: 'O Alquimista.AI transformou completamente nossa prospecção. Aumentamos em 300% o número de leads qualificados em apenas 3 meses. A automação é impressionante!',
    rating: 5,
    results: '+300% leads qualificados',
  },
  {
    name: 'Marina Costa',
    role: 'Diretora de Marketing',
    company: 'Innovate Corp',
    image: '/avatars/marina.jpg',
    content: 'Finalmente conseguimos escalar nossa operação de vendas sem aumentar o time. Os agentes de IA trabalham 24/7 e a qualidade dos leads é excepcional.',
    rating: 5,
    results: '70% redução de custos',
  },
  {
    name: 'Roberto Mendes',
    role: 'Founder',
    company: 'Growth Labs',
    image: '/avatars/roberto.jpg',
    content: 'A integração foi super simples e o ROI apareceu no primeiro mês. O suporte é excelente e a plataforma é muito intuitiva. Recomendo fortemente!',
    rating: 5,
    results: 'ROI em 30 dias',
  },
  {
    name: 'Ana Paula Santos',
    role: 'Head of Sales',
    company: 'Digital Ventures',
    image: '/avatars/ana.jpg',
    content: 'Os relatórios de análise de sentimento nos ajudaram a entender melhor nossos prospects. Conseguimos personalizar abordagens e aumentar conversão em 150%.',
    rating: 5,
    results: '+150% conversão',
  },
  {
    name: 'Felipe Oliveira',
    role: 'CTO',
    company: 'CloudTech',
    image: '/avatars/felipe.jpg',
    content: 'A arquitetura serverless e a conformidade com LGPD nos deram total confiança. É uma solução enterprise de verdade, não apenas mais uma ferramenta.',
    rating: 5,
    results: '100% LGPD compliant',
  },
  {
    name: 'Juliana Ferreira',
    role: 'CMO',
    company: 'Scale Up Inc',
    image: '/avatars/juliana.jpg',
    content: 'Automatizamos todo nosso funil de prospecção e agora focamos apenas em fechar negócios. O time de vendas está muito mais produtivo e feliz!',
    rating: 5,
    results: '+200% produtividade',
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="w-full">
      {/* Main Testimonial */}
      <div 
        className="relative max-w-4xl mx-auto mb-12"
        role="region"
        aria-label="Depoimentos de clientes"
        aria-live="polite"
      >
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          {/* Quote Icon */}
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <Quote className="w-8 h-8" />
          </div>

          {/* Rating */}
          <div className="flex items-center mb-6">
            {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {/* Content */}
          <blockquote className="text-xl md:text-2xl text-slate-700 mb-8 leading-relaxed">
            "{testimonials[currentIndex].content}"
          </blockquote>

          {/* Result Badge */}
          <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
            <span className="font-semibold">{testimonials[currentIndex].results}</span>
          </div>

          {/* Author */}
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
              {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-lg">
                {testimonials[currentIndex].name}
              </div>
              <div className="text-slate-600">
                {testimonials[currentIndex].role} • {testimonials[currentIndex].company}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
          aria-label="Previous testimonial"
        >
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
          aria-label="Next testimonial"
        >
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-purple-600 w-8'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
        {[
          { value: '500+', label: 'Empresas Ativas' },
          { value: '98%', label: 'Satisfação' },
          { value: '2M+', label: 'Leads Processados' },
          { value: '24/7', label: 'Suporte' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {stat.value}
            </div>
            <div className="text-slate-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
