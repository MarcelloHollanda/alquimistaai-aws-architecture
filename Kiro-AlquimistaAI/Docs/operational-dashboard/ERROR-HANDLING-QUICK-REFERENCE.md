# Guia Rápido - Tratamento de Erros

## 🚀 Início Rápido

### 1. Proteger Componente com ErrorBoundary

```tsx
import { DashboardErrorBoundary } from '@/components/error';

<DashboardErrorBoundary section="Nome da Seção">
  <SeuComponente />
</DashboardErrorBoundary>
```

### 2. Usar Hook de Erro em Componente

```tsx
import { useErrorHandler } from '@/hooks/use-error-handler';

const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();

try {
  await api.call();
} catch (err) {
  handleError(err); // Trata automaticamente
}
```

### 3. Requisição com Retry Automático

```tsx
import { withRetry } from '@/lib/error-handler';

const data = await withRetry(
  () => api.getData(),
  { maxRetries: 3, delayMs: 1000 }
);
```

---

## 📋 Tipos de Erro

| Código | Tipo | Mensagem | Ação |
|--------|------|----------|------|
| 401 | Authentication | "Sessão expirada. Faça login novamente." | Redireciona para login |
| 403 | Authorization | "Você não tem permissão..." | Modal de erro |
| Network | Network | "Erro de conexão. Tente novamente." | Toast + Retry |
| 500+ | Server | "Erro no servidor..." | Toast + Log |
| 400/422 | Validation | "Dados inválidos..." | Toast |
| 404 | Not Found | "Recurso não encontrado." | Toast |

---

## 🎯 Quando Usar Cada Componente

### ErrorBoundary
- ✅ Proteger seções inteiras
- ✅ Capturar erros de renderização
- ✅ Fallback para erros não tratados

### Toast
- ✅ Erros não críticos
- ✅ Erros de validação
- ✅ Erros temporários
- ✅ Feedback rápido

### Modal
- ✅ Erros críticos
- ✅ Requer ação do usuário
- ✅ Erros de autorização
- ✅ Erros de servidor

---

## 💡 Exemplos Comuns

### Carregar Dados

```tsx
const { handleError } = useErrorHandler();
const [data, setData] = useState(null);

const loadData = async () => {
  try {
    const result = await withRetry(() => api.getData());
    setData(result);
  } catch (error) {
    handleError(error);
  }
};
```

### Enviar Formulário

```tsx
const { handleError } = useErrorHandler();

const onSubmit = async (formData) => {
  try {
    await api.submit(formData);
    toast({ title: 'Sucesso!' });
  } catch (error) {
    handleError(error);
  }
};
```

### Modal de Erro

```tsx
const { error, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();

<ErrorModal
  open={showErrorModal}
  onOpenChange={setShowErrorModal}
  title="Erro"
  message={error?.message || ''}
  onAction={clearError}
/>
```

---

## 🔧 Configuração

### Retry Automático

```tsx
// Padrão: 3 tentativas, 1s de delay
withRetry(() => api.call())

// Customizado
withRetry(() => api.call(), {
  maxRetries: 5,
  delayMs: 2000,
  showToast: true
})
```

### Callbacks Customizados

```tsx
useErrorHandler({
  onAuthError: () => router.push('/login'),
  onServerError: () => console.log('Server error'),
  showToast: true
})
```

---

## 📦 Imports

```tsx
// Componentes
import { DashboardErrorBoundary, ErrorModal } from '@/components/error';

// Hook
import { useErrorHandler } from '@/hooks/use-error-handler';

// Utilitários
import { handleError, withRetry, classifyError } from '@/lib/error-handler';
```

---

## 🎨 Severidades do Modal

```tsx
<ErrorModal severity="error" />    // Vermelho (padrão)
<ErrorModal severity="warning" />  // Amarelo
<ErrorModal severity="critical" /> // Vermelho escuro
```

---

## 🧪 Testar Erros

```tsx
// Simular erro de rede
throw { request: {}, response: undefined };

// Simular erro 403
throw { response: { status: 403 } };

// Simular erro 500
throw { response: { status: 500 } };
```

---

## 📚 Documentação Completa

Ver: `frontend/src/components/error/README.md`
