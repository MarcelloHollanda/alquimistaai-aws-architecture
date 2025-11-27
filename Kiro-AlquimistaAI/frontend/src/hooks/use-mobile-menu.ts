'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar o estado do menu mobile
 * Detecta automaticamente o tamanho da tela e gerencia a visibilidade do menu
 */
export function useMobileMenu() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Fechar menu automaticamente em telas grandes
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    // Verificar no mount
    checkMobile();

    // Adicionar listener para resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar menu ao clicar fora (em mobile)
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');

      if (
        sidebar &&
        !sidebar.contains(target) &&
        menuButton &&
        !menuButton.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return {
    isMobile,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  };
}
