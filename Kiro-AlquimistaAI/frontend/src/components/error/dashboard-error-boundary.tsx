'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  section?: string;
  fallback?: React.ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary específico para seções do Dashboard
 * Captura erros e exibe UI de fallback apropriada
 */
export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.section || 'Dashboard'}] Error:`, error, errorInfo);
    
    // Log para serviço de monitoramento (ex: Sentry, CloudWatch)
    this.logErrorToService(error, errorInfo);
    
    this.setState({ errorInfo });
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Integrar com serviço de logging (CloudWatch, Sentry, etc)
    const errorData = {
      section: this.props.section,
      error: {
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Error logged:', errorData);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Se fornecido um fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão de erro
      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                Erro ao carregar {this.props.section || 'seção'}
              </CardTitle>
            </div>
            <CardDescription>
              Ocorreu um erro inesperado ao carregar esta seção. Por favor, tente novamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm font-mono text-muted-foreground">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
