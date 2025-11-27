# 🛡️ Sistema de Tratamento de Erros - Índice

## 📖 Documentação

### Guias Principais

1. **[README Completo](../../frontend/src/components/error/README.md)**
   - Visão geral do sistema
   - Componentes e hooks
   - Exemplos detalhados
   - Integração com componentes

2. **[Guia Rápido](./ERROR-HANDLING-QUICK-REFERENCE.md)**
   - Início rápido
   - Exemplos comuns
   - Referência de imports
   - Configurações

3. **[Resumo de Implementação](./TASK-18-IMPLEMENTATION-SUMMARY.md)**
   - Status da implementação
   - Requisitos atendidos
   - Arquivos criados
   - Próximos passos

---

## 🧩 Componentes

### ErrorBoundary
**Arquivo**: `frontend/src/components/error/dashboard-error-boundary.tsx`

Captura erros de renderização e exibe fallback.

```tsx
<DashboardErrorBoundary section="Métricas">
  <MetricsComponent />
</DashboardErrorBoundary>
```

### ErrorModal
**Arquivo**: `frontend/src/components/error/error-modal.tsx`

Modal para erros que requerem ação do usuário.

```tsx
<ErrorModal
  open={showError}
  onOpenChange={setShowError}
  title="Erro"
  message="Mensagem de erro"
  severity="error"
/>
```

---

## 🎣 Hooks

### useErrorHandler
**Arquivo**: `frontend/src/hooks/use-error-handler.ts`

Hook para gerenciar erros em componentes.

```tsx
const { error, handleError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
```

---

## 🔧 Utilitários

### handleError
**Arquivo**: `frontend/src/lib/error-handler.ts`

Função principal de tratamento de erros.

```tsx
handleError(error, {
  showToast: true,
  onAuthError: () => router.push('/login')
});
```

### withRetry
**Arquivo**: `frontend/src/lib/error-handler.ts`

Wrapper para requisições com retry automático.

```tsx
const data = await withRetry(
  () => api.getData(),
  { maxRetries: 3, delayMs: 1000 }
);
```

### classifyError
**Arquivo**: `frontend/src/lib/error-handler.ts`

Classifica erros por tipo e status HTTP.

```tsx
const appError = classifyError(error);
// { type: 'network', message: '...', retryable: true }
```

---

## 📦 Cliente HTTP

### ApiClient
**Arquivo**: `frontend/src/lib/api/api-client-wrapper.ts`

Cliente HTTP com tratamento de erros integrado.

```tsx
const client = createTenantClient();
const data = await client.get('/tenant/me');
```

---

## 🎯 Tipos de Erro

| Tipo | Status | Mensagem | Retryable |
|------|--------|----------|-----------|
| AUTHENTICATION | 401 | "Sessão expirada..." | ❌ |
| AUTHORIZATION | 403 | "Sem permissão..." | ❌ |
| NETWORK | - | "Erro de conexão..." | ✅ |
| SERVER | 500+ | "Erro no servidor..." | ✅ |
| VALIDATION | 400/422 | "Dados inválidos..." | ❌ |
| NOT_FOUND | 404 | "Recurso não encontrado..." | ❌ |
| UNKNOWN | - | "Erro inesperado..." | ❌ |

---

## 📁 Estrutura de Arquivos

```
frontend/src/
├── components/error/
│   ├── dashboard-error-boundary.tsx  ← ErrorBoundary
│   ├── error-modal.tsx               ← Modal de erro
│   ├── error-example.tsx             ← Exemplos
│   ├── index.ts                      ← Exports
│   └── README.md                     ← Documentação
├── hooks/
│   └── use-error-handler.ts          ← Hook principal
├── lib/
│   ├── error-handler.ts              ← Utilitários
│   └── api/
│       └── api-client-wrapper.ts     ← Cliente HTTP
└── docs/operational-dashboard/
    ├── ERROR-HANDLING-INDEX.md       ← Este arquivo
    ├── ERROR-HANDLING-QUICK-REFERENCE.md
    └── TASK-18-IMPLEMENTATION-SUMMARY.md
```

---

## ✅ Checklist de Uso

### Para Novos Componentes

- [ ] Envolver com `<DashboardErrorBoundary>`
- [ ] Usar `useErrorHandler()` para requisições
- [ ] Adicionar `<ErrorModal>` se necessário
- [ ] Usar `withRetry()` para chamadas de API
- [ ] Testar cenários de erro

### Para Requisições HTTP

- [ ] Usar `withRetry()` para retry automático
- [ ] Capturar erros com try/catch
- [ ] Chamar `handleError()` no catch
- [ ] Exibir feedback ao usuário

### Para Formulários

- [ ] Validar dados antes de enviar
- [ ] Usar `handleError()` para erros de API
- [ ] Mostrar toast de sucesso
- [ ] Limpar formulário após sucesso

---

## 🧪 Testes

### Testar ErrorBoundary

```tsx
it('captura erro de renderização', () => {
  const ThrowError = () => { throw new Error('Test'); };
  
  render(
    <DashboardErrorBoundary section="Test">
      <ThrowError />
    </DashboardErrorBoundary>
  );
  
  expect(screen.getByText(/Erro ao carregar/i)).toBeInTheDocument();
});
```

### Testar Classificação de Erros

```tsx
it('classifica erro 401', () => {
  const error = { response: { status: 401 } };
  const result = classifyError(error);
  expect(result.type).toBe(ErrorType.AUTHENTICATION);
});
```

### Testar Retry

```tsx
it('faz retry em erro de rede', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    if (attempts < 3) throw new Error('Network');
    return Promise.resolve('success');
  };
  
  const result = await retryRequest(fn, 3, 100);
  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

---

## 🔗 Links Úteis

- [Documentação Completa](../../frontend/src/components/error/README.md)
- [Guia Rápido](./ERROR-HANDLING-QUICK-REFERENCE.md)
- [Resumo de Implementação](./TASK-18-IMPLEMENTATION-SUMMARY.md)
- [Exemplos de Uso](../../frontend/src/components/error/error-example.tsx)

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consultar documentação completa
2. Ver exemplos de uso
3. Verificar guia rápido
4. Revisar código de exemplo

---

## 🎓 Aprendizado

### Conceitos Importantes

1. **ErrorBoundary**: Captura erros de renderização React
2. **Toast**: Feedback não intrusivo para erros leves
3. **Modal**: Feedback que requer ação para erros críticos
4. **Retry**: Tentativas automáticas para erros temporários
5. **Classificação**: Determina tipo e tratamento do erro

### Boas Práticas

✅ Sempre envolver seções com ErrorBoundary  
✅ Usar retry para erros de rede  
✅ Mostrar mensagens específicas por tipo  
✅ Logar erros para monitoramento  
✅ Testar cenários de erro  

❌ Não ignorar erros silenciosamente  
❌ Não mostrar detalhes técnicos ao usuário  
❌ Não fazer retry infinito  
❌ Não bloquear UI desnecessariamente  

---

**Última Atualização**: 2024  
**Status**: ✅ Implementação Completa
