'use client';

/**
 * EXEMPLO DE USO DO SISTEMA DE TRATAMENTO DE ERROS
 * 
 * Este arquivo demonstra como usar os componentes e hooks de erro
 * em diferentes cenários do Painel Operacional.
 */

import { useState } from 'react';
import { DashboardErrorBoundary } from './dashboard-error-boundary';
import { ErrorModal } from './error-modal';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { withRetry } from '@/lib/error-handler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simulação de API client
const mockApi = {
  getTenants: async () => {
    // Simula erro de rede
    throw { request: {}, response: undefined };
  },
  
  getUnauthorized: async () => {
    // Simula erro 403
    throw { response: { status: 403 } };
  },
  
  getServerError: async () => {
    // Simula erro 500
    throw { response: { status: 500 } };
  },
  
  getSuccess: async () => {
    return { data: 'Sucesso!' };
  },
};

/**
 * Exemplo 1: Componente com ErrorBoundary
 */
function ComponentWithBoundary() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Erro de renderização simulado');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo 1: ErrorBoundary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Este componente está protegido por ErrorBoundary.</p>
        <Button onClick={() => setShouldError(true)}>
          Simular Erro de Renderização
        </Button>
      </CardContent>
    </Card>
  );
}

export function ErrorBoundaryExample() {
  return (
    <DashboardErrorBoundary section="Exemplo ErrorBoundary">
      <ComponentWithBoundary />
    </DashboardErrorBoundary>
  );
}

/**
 * Exemplo 2: Tratamento de erro de rede com retry
 */
export function NetworkErrorExample() {
  const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchWithRetry = async () => {
    setLoading(true);
    setData(null);
    
    try {
      // Requisição com retry automático (3 tentativas)
      const result = await withRetry(
        () => mockApi.getTenants(),
        { maxRetries: 3, delayMs: 1000, showToast: true }
      );
      setData(result);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo 2: Erro de Rede com Retry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Simula erro de rede com retry automático (3 tentativas).</p>
        
        <Button onClick={fetchWithRetry} disabled={loading}>
          {loading ? 'Tentando...' : 'Fazer Requisição'}
        </Button>

        {data && (
          <div className="rounded-md bg-green-50 p-3 text-green-800">
            Sucesso: {JSON.stringify(data)}
          </div>
        )}

        {error && (
          <ErrorModal
            open={showErrorModal}
            onOpenChange={setShowErrorModal}
            title="Erro de Rede"
            message={error.message}
            details={error.details}
            severity="error"
            actionLabel="Tentar Novamente"
            onAction={() => {
              clearError();
              fetchWithRetry();
            }}
            cancelLabel="Fechar"
          />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo 3: Erro de autorização (403)
 */
export function AuthorizationErrorExample() {
  const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
  const [loading, setLoading] = useState(false);

  const fetchUnauthorized = async () => {
    setLoading(true);
    
    try {
      await mockApi.getUnauthorized();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo 3: Erro de Autorização</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Simula erro 403 (sem permissão).</p>
        
        <Button onClick={fetchUnauthorized} disabled={loading}>
          Acessar Recurso Protegido
        </Button>

        {error && (
          <ErrorModal
            open={showErrorModal}
            onOpenChange={setShowErrorModal}
            title="Acesso Negado"
            message={error.message}
            severity="warning"
            actionLabel="Entendi"
            onAction={clearError}
          />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo 4: Erro de servidor (500)
 */
export function ServerErrorExample() {
  const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
  const [loading, setLoading] = useState(false);

  const fetchServerError = async () => {
    setLoading(true);
    
    try {
      await mockApi.getServerError();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo 4: Erro de Servidor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Simula erro 500 (erro interno do servidor).</p>
        
        <Button onClick={fetchServerError} disabled={loading}>
          Fazer Requisição
        </Button>

        {error && (
          <ErrorModal
            open={showErrorModal}
            onOpenChange={setShowErrorModal}
            title="Erro no Servidor"
            message={error.message}
            severity="critical"
            actionLabel="Tentar Novamente"
            onAction={() => {
              clearError();
              fetchServerError();
            }}
            cancelLabel="Fechar"
          />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Página de demonstração completa
 */
export function ErrorHandlingDemo() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Sistema de Tratamento de Erros</h1>
      <p className="text-muted-foreground">
        Demonstração dos componentes e hooks de tratamento de erros.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundaryExample />
        <NetworkErrorExample />
        <AuthorizationErrorExample />
        <ServerErrorExample />
      </div>
    </div>
  );
}
