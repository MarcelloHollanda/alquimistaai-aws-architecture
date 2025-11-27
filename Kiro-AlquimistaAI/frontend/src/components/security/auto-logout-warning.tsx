'use client';

import { useEffect, useState } from 'react';
import { useAutoLogout } from '@/hooks/use-auto-logout';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AutoLogoutWarning() {
  const { isAuthenticated, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const { resetTimer, getRemainingTime } = useAutoLogout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 2 * 60 * 1000, // 2 minutes warning
    onWarning: (remainingTime) => {
      setShowWarning(true);
      setRemainingSeconds(Math.floor(remainingTime / 1000));
    },
    onLogout: () => {
      logout();
    },
  });

  // Update countdown
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      const remaining = Math.floor(getRemainingTime() / 1000);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, getRemainingTime]);

  const handleStayLoggedIn = () => {
    resetTimer();
    setShowWarning(false);
  };

  const handleLogoutNow = () => {
    logout();
    setShowWarning(false);
  };

  if (!isAuthenticated) return null;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl shadow-2xl p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-2">
                  Sessão Expirando
                </h3>
                <p className="text-yellow-800 text-sm mb-4">
                  Sua sessão expirará em <strong>{remainingSeconds} segundos</strong> por inatividade.
                  Deseja continuar conectado?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleStayLoggedIn}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                  >
                    Continuar Conectado
                  </button>
                  <button
                    onClick={handleLogoutNow}
                    className="px-4 py-2 bg-white text-yellow-900 border-2 border-yellow-400 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
                  >
                    Sair Agora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
