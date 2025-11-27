'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Phone, Mail, Clock, TrendingUp, Smile, Meh, Frown } from 'lucide-react';

export default function NigredoConversasPage() {
  const conversas = [
    { id: '1', lead: 'João Silva', canal: 'WhatsApp', ultima: 'Obrigado pelo contato!', sentimento: 'positivo', tempo: '5 min' },
    { id: '2', lead: 'Maria Santos', canal: 'Email', ultima: 'Preciso de mais informações', sentimento: 'neutro', tempo: '1 hora' },
    { id: '3', lead: 'Pedro Costa', canal: 'WhatsApp', ultima: 'Não tenho interesse', sentimento: 'negativo', tempo: '2 horas' },
  ];

  const sentimentoIcons = {
    positivo: <Smile className="w-5 h-5 text-green-500" />,
    neutro: <Meh className="w-5 h-5 text-yellow-500" />,
    negativo: <Frown className="w-5 h-5 text-red-500" />
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Conversas Ativas</h2>
        <p className="text-slate-600">Acompanhe todas as conversas em andamento com seus leads</p>
      </div>

      <div className="space-y-4">
        {conversas.map((conversa, index) => (
          <motion.div
            key={conversa.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{conversa.lead}</h3>
                  {sentimentoIcons[conversa.sentimento as keyof typeof sentimentoIcons]}
                </div>
                <p className="text-slate-600 mb-3">{conversa.ultima}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    {conversa.canal === 'WhatsApp' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    <span>{conversa.canal}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>há {conversa.tempo}</span>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-pink-100 text-pink-600 rounded-lg font-semibold hover:bg-pink-200 transition-colors">
                Ver Conversa
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
