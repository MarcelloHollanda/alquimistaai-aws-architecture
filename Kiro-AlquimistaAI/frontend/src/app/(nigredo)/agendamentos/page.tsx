'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, MapPin, CheckCircle } from 'lucide-react';

export default function NigredoAgendamentosPage() {
  const reunioes = [
    { id: '1', lead: 'João Silva', data: '2024-01-16', hora: '10:00', tipo: 'Google Meet', status: 'confirmada' },
    { id: '2', lead: 'Maria Santos', data: '2024-01-16', hora: '14:30', tipo: 'Zoom', status: 'pendente' },
    { id: '3', lead: 'Pedro Costa', data: '2024-01-17', hora: '09:00', tipo: 'Presencial', status: 'confirmada' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Agendamentos</h2>
        <p className="text-slate-600">Reuniões agendadas com leads qualificados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reunioes.map((reuniao, index) => (
          <motion.div
            key={reuniao.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white">
                <Calendar className="w-6 h-6" />
              </div>
              {reuniao.status === 'confirmada' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{reuniao.lead}</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{new Date(reuniao.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{reuniao.hora}</span>
              </div>
              <div className="flex items-center space-x-2">
                {reuniao.tipo === 'Presencial' ? <MapPin className="w-4 h-4 text-slate-400" /> : <Video className="w-4 h-4 text-slate-400" />}
                <span>{reuniao.tipo}</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-pink-100 text-pink-600 rounded-lg font-semibold hover:bg-pink-200 transition-colors">
              Ver Detalhes
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
