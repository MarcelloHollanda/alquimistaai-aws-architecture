/**
 * Mapeamento de erros do Cognito para mensagens em português
 */

export const COGNITO_ERROR_MESSAGES: Record<string, string> = {
  // Erros de autenticação
  'UserNotFoundException': 'Usuário não encontrado',
  'NotAuthorizedException': 'E-mail ou senha incorretos',
  'UserNotConfirmedException': 'Usuário não confirmado. Verifique seu e-mail',
  'PasswordResetRequiredException': 'É necessário redefinir sua senha',
  'UserLambdaValidationException': 'Erro de validação do usuário',
  'InvalidPasswordException': 'Senha não atende aos requisitos mínimos',
  'InvalidParameterException': 'Parâmetros inválidos',
  
  // Erros de código de verificação
  'CodeMismatchException': 'Código de verificação inválido',
  'ExpiredCodeException': 'Código de verificação expirado',
  'CodeDeliveryFailureException': 'Falha ao enviar código de verificação',
  
  // Erros de cadastro
  'UsernameExistsException': 'Este e-mail já está cadastrado',
  'InvalidEmailRoleAccessPolicyException': 'Política de acesso de e-mail inválida',
  
  // Erros de limite
  'LimitExceededException': 'Muitas tentativas. Tente novamente mais tarde',
  'TooManyRequestsException': 'Muitas requisições. Aguarde alguns minutos',
  'TooManyFailedAttemptsException': 'Muitas tentativas falhadas. Aguarde alguns minutos',
  
  // Erros de sessão
  'TokenRefreshException': 'Erro ao renovar sessão. Faça login novamente',
  'NotAuthorizedException': 'Sessão expirada. Faça login novamente',
  
  // Erros de rede
  'NetworkError': 'Erro de conexão. Verifique sua internet',
  'TimeoutError': 'Tempo de resposta esgotado. Tente novamente',
  
  // Erros genéricos
  'InternalErrorException': 'Erro interno do servidor. Tente novamente',
  'ResourceNotFoundException': 'Recurso não encontrado',
  'UnexpectedLambdaException': 'Erro inesperado no servidor',
  
  // Erro customizado
  'NEW_PASSWORD_REQUIRED': 'É necessário trocar a senha no primeiro acesso',
};

/**
 * Traduz erro do Cognito para mensagem em português
 */
export function translateCognitoError(error: any): string {
  // Se o erro já é uma string, retornar diretamente
  if (typeof error === 'string') {
    return COGNITO_ERROR_MESSAGES[error] || error;
  }
  
  // Se o erro tem uma propriedade code
  if (error?.code) {
    return COGNITO_ERROR_MESSAGES[error.code] || error.message || 'Erro desconhecido';
  }
  
  // Se o erro tem uma propriedade name
  if (error?.name) {
    return COGNITO_ERROR_MESSAGES[error.name] || error.message || 'Erro desconhecido';
  }
  
  // Se o erro tem uma propriedade message
  if (error?.message) {
    // Verificar se a mensagem contém algum código de erro conhecido
    for (const [code, message] of Object.entries(COGNITO_ERROR_MESSAGES)) {
      if (error.message.includes(code)) {
        return message;
      }
    }
    return error.message;
  }
  
  // Erro desconhecido
  return 'Erro desconhecido. Tente novamente';
}

/**
 * Verifica se o erro é de credenciais inválidas
 */
export function isInvalidCredentialsError(error: any): boolean {
  const errorCode = error?.code || error?.name || '';
  return errorCode === 'NotAuthorizedException' || errorCode === 'UserNotFoundException';
}

/**
 * Verifica se o erro é de usuário não confirmado
 */
export function isUserNotConfirmedError(error: any): boolean {
  const errorCode = error?.code || error?.name || '';
  return errorCode === 'UserNotConfirmedException';
}

/**
 * Verifica se o erro é de código inválido
 */
export function isInvalidCodeError(error: any): boolean {
  const errorCode = error?.code || error?.name || '';
  return errorCode === 'CodeMismatchException' || errorCode === 'ExpiredCodeException';
}

/**
 * Verifica se o erro é de limite excedido
 */
export function isRateLimitError(error: any): boolean {
  const errorCode = error?.code || error?.name || '';
  return (
    errorCode === 'LimitExceededException' ||
    errorCode === 'TooManyRequestsException' ||
    errorCode === 'TooManyFailedAttemptsException'
  );
}
