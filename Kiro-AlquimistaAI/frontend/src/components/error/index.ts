/**
 * Sistema de Tratamento de Erros - Painel Operacional AlquimistaAI
 * 
 * Exporta todos os componentes, hooks e utilitários de tratamento de erros.
 * Implementado conforme Requisitos 14.1-14.6.
 */

// Componentes
export { DashboardErrorBoundary } from './dashboard-error-boundary';
export { ErrorModal } from './error-modal';
export type { ErrorModalProps, ErrorSeverity } from './error-modal';

// Hooks
export { useErrorHandler } from '@/hooks/use-error-handler';
export type { UseErrorHandlerOptions, UseErrorHandlerReturn } from '@/hooks/use-error-handler';

// Utilitários
export {
  handleError,
  showErrorToast,
  classifyError,
  retryRequest,
  withRetry,
  ErrorType,
} from '@/lib/error-handler';
export type { AppError } from '@/lib/error-handler';

// Exemplos (apenas para desenvolvimento)
export {
  ErrorHandlingDemo,
  ErrorBoundaryExample,
  NetworkErrorExample,
  AuthorizationErrorExample,
  ServerErrorExample,
} from './error-example';
