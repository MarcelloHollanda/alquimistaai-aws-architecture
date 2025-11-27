'use client';

import { useState, useCallback } from 'react';
import { handleError, AppError, ErrorType } from '@/lib/error-handler';

export interface UseErrorHandlerOptions {
  onAuthError?: () => void;
  onServerError?: () => void;
  showToast?: boolean;
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: any) => AppError;
  showErrorModal: boolean;
  setShowErrorModal: (show: boolean) => void;
}

/**
 * Hook para gerenciar erros em componentes
 * Fornece estado e handlers para tratamento de erros
 */
export function useErrorHandler(options?: UseErrorHandlerOptions): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
    setShowErrorModal(false);
  }, []);

  const handleErrorCallback = useCallback((err: any): AppError => {
    const appError = handleError(err, options);
    setError(appError);

    // Mostrar modal para erros críticos ou de autorização
    if (
      appError.type === ErrorType.AUTHORIZATION ||
      appError.type === ErrorType.SERVER ||
      !appError.retryable
    ) {
      setShowErrorModal(true);
    }

    return appError;
  }, [options]);

  return {
    error,
    isError: error !== null,
    clearError,
    handleError: handleErrorCallback,
    showErrorModal,
    setShowErrorModal,
  };
}
