import { toast } from '@/hooks/use-toast';

/**
 * Tipos de erro do sistema
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

/**
 * Interface para erros estruturados
 */
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  retryable?: boolean;
}

/**
 * Mensagens de erro específicas por tipo
 * Conforme Requisito 14.1-14.6
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: 'Sessão expirada. Faça login novamente.',
  [ErrorType.AUTHORIZATION]: 'Você não tem permissão para acessar este recurso.',
  [ErrorType.NETWORK]: 'Erro de conexão. Tente novamente.',
  [ErrorType.SERVER]: 'Erro no servidor. Nossa equipe foi notificada.',
  [ErrorType.VALIDATION]: 'Dados inválidos. Verifique os campos e tente novamente.',
  [ErrorType.NOT_FOUND]: 'Recurso não encontrado.',
  [ErrorType.UNKNOWN]: 'Ocorreu um erro inesperado. Tente novamente.',
};

/**
 * Classifica o erro baseado no status HTTP ou tipo
 */
export function classifyError(error: any): AppError {
  // Erro de rede (sem resposta)
  if (!error.response && error.request) {
    return {
      type: ErrorType.NETWORK,
      message: ERROR_MESSAGES[ErrorType.NETWORK],
      retryable: true,
    };
  }

  const statusCode = error.response?.status || error.statusCode;

  // Classificar por status HTTP
  switch (statusCode) {
    case 401:
      return {
        type: ErrorType.AUTHENTICATION,
        message: ERROR_MESSAGES[ErrorType.AUTHENTICATION],
        statusCode,
        retryable: false,
      };

    case 403:
      return {
        type: ErrorType.AUTHORIZATION,
        message: ERROR_MESSAGES[ErrorType.AUTHORIZATION],
        statusCode,
        retryable: false,
      };

    case 404:
      return {
        type: ErrorType.NOT_FOUND,
        message: ERROR_MESSAGES[ErrorType.NOT_FOUND],
        statusCode,
        retryable: false,
      };

    case 422:
    case 400:
      return {
        type: ErrorType.VALIDATION,
        message: error.response?.data?.message || ERROR_MESSAGES[ErrorType.VALIDATION],
        details: error.response?.data?.details,
        statusCode,
        retryable: false,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ErrorType.SERVER,
        message: ERROR_MESSAGES[ErrorType.SERVER],
        statusCode,
        retryable: true,
      };

    default:
      return {
        type: ErrorType.UNKNOWN,
        message: error.message || ERROR_MESSAGES[ErrorType.UNKNOWN],
        statusCode,
        retryable: false,
      };
  }
}

/**
 * Exibe toast notification para erros não críticos
 * Requisito 14.5
 */
export function showErrorToast(error: AppError) {
  toast({
    variant: 'destructive',
    title: 'Erro',
    description: error.message,
    duration: 5000,
  });
}

/**
 * Handler principal de erros
 * Decide se mostra toast ou requer modal baseado na severidade
 */
export function handleError(error: any, options?: {
  showToast?: boolean;
  onAuthError?: () => void;
  onServerError?: () => void;
}) {
  const appError = classifyError(error);

  console.error('[Error Handler]', {
    type: appError.type,
    message: appError.message,
    details: appError.details,
    statusCode: appError.statusCode,
    originalError: error,
  });

  // Erros de autenticação - redirecionar para login
  if (appError.type === ErrorType.AUTHENTICATION) {
    if (options?.onAuthError) {
      options.onAuthError();
    } else {
      // Redirecionar para login
      window.location.href = '/login';
    }
    return appError;
  }

  // Erros de servidor - notificar equipe
  if (appError.type === ErrorType.SERVER) {
    if (options?.onServerError) {
      options.onServerError();
    }
    // TODO: Enviar para serviço de monitoramento
  }

  // Mostrar toast para erros não críticos
  if (options?.showToast !== false) {
    showErrorToast(appError);
  }

  return appError;
}

/**
 * Retry automático para erros de rede
 * Requisito 14.5 - retry automático
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = classifyError(error);

      // Só fazer retry se for erro retryable
      if (!appError.retryable || attempt === maxRetries) {
        throw error;
      }

      console.log(`[Retry] Tentativa ${attempt}/${maxRetries} falhou. Tentando novamente em ${delayMs}ms...`);

      // Aguardar antes de tentar novamente (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

/**
 * Wrapper para requisições com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delayMs?: number;
    showToast?: boolean;
  }
): Promise<T> {
  try {
    return await retryRequest(fn, options?.maxRetries, options?.delayMs);
  } catch (error) {
    handleError(error, { showToast: options?.showToast });
    throw error;
  }
}
