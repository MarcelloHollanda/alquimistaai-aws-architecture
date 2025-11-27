# ⚡ Referência Rápida - Tarefa 9

## Middleware de Roteamento e Dashboards Operacionais

---

## 🚀 Início Rápido

### Acessar Dashboard da Empresa
```
URL: http://localhost:3000/app/company
Grupos: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT
```

### Acessar Dashboard Interno
```
URL: http://localhost:3000/app/internal
Grupos: INTERNAL_ADMIN, INTERNAL_SUPPORT
```

---

## 📁 Arquivos Principais

```
frontend/
├── middleware.ts                                    → Autorização
├── src/app/(operational)/company/page.tsx          → Dashboard Empresa
├── src/app/(operational)/internal/page.tsx         → Dashboard Interno
├── src/hooks/use-operational-client.ts             → Client HTTP
└── src/components/operational/                     → Componentes
```

---

## 🔐 Grupos de Acesso

| Grupo | Empresa | Interno |
|-------|---------|---------|
| TENANT_ADMIN | ✅ | ❌ |
| TENANT_USER | ✅ | ❌ |
| INTERNAL_ADMIN | ✅ | ✅ |
| INTERNAL_SUPPORT | ✅ | ✅ |

---

## 🎨 Componentes Disponíveis

### MetricsCard
```tsx
<MetricsCard
  title="Agentes Ativos"
  value={10}
  total={20}
  percentage={50}
  icon="agents"
/>
```

### IncidentsList
```tsx
<IncidentsList tenantId="uuid" />
```

### AgentsList
```tsx
<AgentsList tenantId="uuid" />
```

### TopTenantsList
```tsx
<TopTenantsList />
```

### RecentCommandsList
```tsx
<RecentCommandsList />
```

---

## 🔌 Client HTTP

### Importar
```typescript
import { useOperationalClient } from '@/hooks/use-operational-client';
```

### Usar
```typescript
const {
  getTenantMe,
  getTenantAgents,
  getInternalTenants,
  getUsageOverview,
} = useOperationalClient();
```

### APIs de Tenant
```typescript
// Dados do tenant
const tenant = await getTenantMe();

// Agentes
const agents = await getTenantAgents('active');

// Uso
const usage = await getTenantUsage('30d');

// Incidentes
const incidents = await getTenantIncidents(10, 0);
```

### APIs Internas
```typescript
// Tenants
const tenants = await getInternalTenants({
  status: 'active',
  limit: 10
});

// Uso global
const usage = await getUsageOverview('30d');

// Financeiro
const billing = await getBillingOverview('30d');

// Comandos
const commands = await getOperationalCommands({
  status: 'SUCCESS',
  limit: 10
});
```

---

## 🧪 Testes Rápidos

### Teste 1: Acesso Sem Auth
```
1. Abrir: /app/company
2. Esperar: Redireciona para /auth/login
```

### Teste 2: Acesso Tenant
```
1. Login: tenant-admin@test.com
2. Abrir: /app/company
3. Esperar: Dashboard carrega
```

### Teste 3: Acesso Negado
```
1. Login: tenant-user@test.com
2. Abrir: /app/internal
3. Esperar: Redireciona para /auth/login?error=access_denied
```

### Teste 4: Acesso Interno
```
1. Login: internal-admin@test.com
2. Abrir: /app/internal
3. Esperar: Dashboard carrega
```

---

## 🐛 Troubleshooting

### Problema: Redirecionamento infinito
**Solução**: Verificar se o token JWT está válido

### Problema: Acesso negado
**Solução**: Verificar grupos do usuário no Cognito

### Problema: Dados não carregam
**Solução**: Verificar se o backend está rodando

### Problema: Erro 403
**Solução**: Verificar se o usuário tem o grupo correto

---

## 📊 Métricas

### Dashboard Empresa
- Agentes Ativos
- Usuários Ativos
- Requisições do Mês
- MRR Estimado

### Dashboard Interno
- Tenants Ativos
- Agentes Implantados
- Requisições Totais
- Taxa de Sucesso
- MRR Total
- ARR Total
- MRR Médio
- Crescimento MRR

---

## 🔍 Logs Úteis

### Middleware
```
✅ Access granted to tenant dashboard for groups: ['TENANT_ADMIN']
🚫 Access denied to internal dashboard. User groups: ['TENANT_USER']
```

### Client HTTP
```
Error loading tenant data: <error>
Error loading global usage data: <error>
```

---

## 📝 Comandos Úteis

### Instalar Dependências
```bash
cd frontend
npm install @radix-ui/react-dropdown-menu
npm install
```

### Rodar Desenvolvimento
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testes
```bash
npm run test
```

---

## 🔗 Links Rápidos

- [Documentação Completa](./TASK-9-COMPLETE.md)
- [Resumo Visual](./TASK-9-SUMMARY.md)
- [Guia de Testes](./TASK-9-TESTING-GUIDE.md)
- [Índice](./TASK-9-INDEX.md)
- [Resumo Executivo](./TASK-9-EXECUTIVE-SUMMARY.md)

---

## ⚙️ Configuração

### Variáveis de Ambiente
```env
NEXT_PUBLIC_API_URL=https://api.alquimistaai.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
```

---

## 🎯 Checklist Rápido

Antes de fazer deploy:

- [ ] Middleware funciona
- [ ] Dashboard empresa carrega
- [ ] Dashboard interno carrega
- [ ] Controle de acesso funciona
- [ ] Métricas são exibidas
- [ ] Loading states funcionam
- [ ] Erros são tratados
- [ ] Responsivo funciona
- [ ] Testes passam
- [ ] Documentação está completa

---

## 📞 Suporte

**Problema Técnico**: Ver [TASK-9-COMPLETE.md](./TASK-9-COMPLETE.md)  
**Dúvida de Teste**: Ver [TASK-9-TESTING-GUIDE.md](./TASK-9-TESTING-GUIDE.md)  
**Visão Geral**: Ver [TASK-9-SUMMARY.md](./TASK-9-SUMMARY.md)

---

**Última atualização**: 18/11/2025  
**Versão**: 1.0.0
