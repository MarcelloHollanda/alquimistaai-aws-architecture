# Sistema de Tratamento de Erros - Painel Operacional

Sistema completo de tratamento de erros implementado conforme Requisitos 14.1-14.6.

## Componentes

### 1. DashboardErrorBoundary

ErrorBoundary específico para seções do dashboard. Captura erros de renderização e exibe UI de fallback.

**Uso:**

```tsx
import { DashboardErrorBoundary } from '@/components/error/dashboard-error-boundary';

<DashboardErrorBoundary section="Métricas">
  <MetricsComponent />
</DashboardErrorBoundary>
```

**Props:**
- `section` (opcional): Nome da seção para logging
- `fallback` (opcional): UI customizada de fallback

### 2. ErrorModal

Modal para erros que requerem ação do usuário.

**Uso:**

```tsx
import { ErrorModal } from '@/components/error/error-modal';

<ErrorModal
  open={showError}
  onOpenChange={setShowError}
  title="Erro de Autorização"
  message="Você não tem permissão para acessar este recurso."
  severity="error"
  actionLabel="Entendi"
/>
```

**Props:**
- `open`: Controla visibilidade
- `onOpenChange`: Callback para mudança de estado
- `title`: Título do erro
- `message`: Mensagem descritiva
- `severity`: 'error' | 'warning' | 'critical'
- `actionLabel`: Texto do botão de ação
- `onAction`: Callback do botão de ação
- `cancelLabel`: Texto do botão de cancelar (opcional)
- `details`: Detalhes técnicos (opcional)

## Hooks

### useErrorHandler

Hook para gerenciar erros em componentes.

**Uso:**

```tsx
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler({
    showToast: true,
    onAuthError: () => router.push('/auth/login'),
  });

  const fetchData = async () => {
    try {
      const data = await api.getData();
      return data;
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      <button onClick={fetchData}>Carregar Dados</button>
      
      {error && (
        <ErrorModal
          open={showErrorModal}
          onOpenChange={setShowErrorModal}
          title="Erro"
          message={error.message}
          onAction={clearError}
        />
      )}
    </>
  );
}
```

## Utilitários

### handleError

Função principal de tratamento de erros.

```tsx
import { handleError } from '@/lib/error-handler';

try {
  await api.call();
} catch (error) {
  handleError(error, {
    showToast: true,
    onAuthError: () => router.push('/login'),
  });
}
```

### withRetry

Wrapper para requisições com retry automático.

```tsx
import { withRetry } from '@/lib/error-handler';

const data = await withRetry(
  () => api.getData(),
  {
    maxRetries: 3,
    delayMs: 1000,
    showToast: true,
  }
);
```

## Tipos de Erro

O sistema classifica erros automaticamente:

- **AUTHENTICATION** (401): Sessão expirada → Redireciona para login
- **AUTHORIZATION** (403): Sem permissão → Modal de erro
- **NETWORK**: Erro de conexão → Toast + Retry automático
- **SERVER** (500+): Erro no servidor → Toast + Log
- **VALIDATION** (400, 422): Dados inválidos → Toast
- **NOT_FOUND** (404): Recurso não encontrado → Toast
- **UNKNOWN**: Erro desconhecido → Toast

## Mensagens de Erro (Requisito 14.1-14.6)

Mensagens específicas por tipo de erro:

| Tipo | Mensagem |
|------|----------|
| Authentication | "Sessão expirada. Faça login novamente." |
| Authorization | "Você não tem permissão para acessar este recurso." |
| Network | "Erro de conexão. Tente novamente." |
| Server | "Erro no servidor. Nossa equipe foi notificada." |
| Validation | "Dados inválidos. Verifique os campos e tente novamente." |
| Not Found | "Recurso não encontrado." |
| Unknown | "Ocorreu um erro inesperado. Tente novamente." |

## Estratégias de Exibição

### Toast Notifications (Erros Não Críticos)

Usado para:
- Erros de rede
- Erros de validação
- Erros temporários

```tsx
showErrorToast(error);
```

### Modal (Erros Críticos)

Usado para:
- Erros de autorização
- Erros que requerem ação
- Erros de servidor

```tsx
<ErrorModal
  open={true}
  title="Erro Crítico"
  message="..."
  severity="critical"
/>
```

## Retry Automático (Requisito 14.5)

Erros de rede são automaticamente retentados:

```tsx
// Retry automático com exponential backoff
const data = await withRetry(() => api.getData(), {
  maxRetries: 3,
  delayMs: 1000, // 1s, 2s, 3s
});
```

## Exemplo Completo

```tsx
'use client';

import { DashboardErrorBoundary } from '@/components/error/dashboard-error-boundary';
import { ErrorModal } from '@/components/error/error-modal';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { withRetry } from '@/lib/error-handler';

export function TenantsList() {
  const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    try {
      // Requisição com retry automático
      const data = await withRetry(
        () => api.getTenants(),
        { maxRetries: 3, showToast: false }
      );
      setTenants(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardErrorBoundary section="Lista de Tenants">
      <div>
        <button onClick={loadTenants}>Carregar Tenants</button>
        
        {loading && <p>Carregando...</p>}
        
        {tenants.map(tenant => (
          <div key={tenant.id}>{tenant.name}</div>
        ))}
      </div>

      {/* Modal de erro */}
      {error && (
        <ErrorModal
          open={showErrorModal}
          onOpenChange={setShowErrorModal}
          title="Erro ao Carregar Tenants"
          message={error.message}
          details={error.details}
          severity="error"
          actionLabel="Tentar Novamente"
          onAction={() => {
            clearError();
            loadTenants();
          }}
          cancelLabel="Fechar"
        />
      )}
    </DashboardErrorBoundary>
  );
}
```

## Integração com Componentes Existentes

### Dashboard do Cliente

```tsx
// app/(dashboard)/dashboard/page.tsx
<DashboardErrorBoundary section="Dashboard Cliente">
  <TenantOverview />
</DashboardErrorBoundary>
```

### Painel Operacional

```tsx
// app/(company)/company/page.tsx
<DashboardErrorBoundary section="Painel Operacional">
  <GlobalKPIs />
</DashboardErrorBoundary>
```

### Formulários

```tsx
// components/company/command-form.tsx
const { handleError } = useErrorHandler();

const onSubmit = async (data) => {
  try {
    await api.createCommand(data);
    toast({ title: 'Comando criado com sucesso' });
  } catch (error) {
    handleError(error);
  }
};
```

## Logging e Monitoramento

Todos os erros são automaticamente logados no console com contexto:

```json
{
  "type": "network",
  "message": "Erro de conexão. Tente novamente.",
  "statusCode": null,
  "retryable": true,
  "originalError": { ... }
}
```

Para integração com serviços de monitoramento (CloudWatch, Sentry), edite:
- `DashboardErrorBoundary.logErrorToService()`
- `handleError()` em `lib/error-handler.ts`

## Testes

```tsx
import { classifyError, handleError } from '@/lib/error-handler';

describe('Error Handler', () => {
  it('classifica erro 401 como AUTHENTICATION', () => {
    const error = { response: { status: 401 } };
    const result = classifyError(error);
    expect(result.type).toBe(ErrorType.AUTHENTICATION);
  });

  it('classifica erro 403 como AUTHORIZATION', () => {
    const error = { response: { status: 403 } };
    const result = classifyError(error);
    expect(result.type).toBe(ErrorType.AUTHORIZATION);
  });

  it('classifica erro de rede', () => {
    const error = { request: {}, response: undefined };
    const result = classifyError(error);
    expect(result.type).toBe(ErrorType.NETWORK);
    expect(result.retryable).toBe(true);
  });
});
```

## Checklist de Implementação

- [x] ErrorBoundary para cada seção (Requisito 14.1)
- [x] Toast notifications para erros não críticos (Requisito 14.2)
- [x] Modals para erros que requerem ação (Requisito 14.3)
- [x] Mensagens de erro específicas por tipo (Requisito 14.4)
- [x] Retry automático para erros de rede (Requisito 14.5)
- [x] Classificação de erros por status HTTP (Requisito 14.6)
- [x] Hook useErrorHandler para componentes
- [x] Utilitários withRetry e handleError
- [x] Documentação completa
