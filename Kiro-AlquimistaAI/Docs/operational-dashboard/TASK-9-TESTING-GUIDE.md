# 🧪 Guia de Testes - Tarefa 9

## Middleware de Roteamento e Dashboards Operacionais

---

## 📋 Pré-requisitos

Antes de iniciar os testes, certifique-se de que:

1. ✅ O backend está rodando com as APIs operacionais
2. ✅ O Cognito está configurado com os grupos corretos
3. ✅ As variáveis de ambiente estão configuradas
4. ✅ As dependências do frontend estão instaladas

```bash
cd frontend
npm install @radix-ui/react-dropdown-menu
npm install
```

---

## 🔧 Configuração de Teste

### 1. Criar Usuários de Teste no Cognito

Você precisará de usuários com diferentes grupos para testar o controle de acesso:

```bash
# Usuário Tenant Admin
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username tenant-admin@test.com \
  --user-attributes Name=email,Value=tenant-admin@test.com

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username tenant-admin@test.com \
  --group-name TENANT_ADMIN

# Usuário Tenant User
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username tenant-user@test.com \
  --user-attributes Name=email,Value=tenant-user@test.com

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username tenant-user@test.com \
  --group-name TENANT_USER

# Usuário Internal Admin
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username internal-admin@test.com \
  --user-attributes Name=email,Value=internal-admin@test.com

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username internal-admin@test.com \
  --group-name INTERNAL_ADMIN

# Usuário Internal Support
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username internal-support@test.com \
  --user-attributes Name=email,Value=internal-support@test.com

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username internal-support@test.com \
  --group-name INTERNAL_SUPPORT
```

---

## 🧪 Testes de Middleware

### Teste 1: Acesso Sem Autenticação

**Objetivo**: Verificar redirecionamento para login

```
1. Abrir navegador em modo anônimo
2. Acessar: http://localhost:3000/app/company
3. Resultado esperado: Redireciona para /auth/login
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 2: Acesso ao Dashboard da Empresa (TENANT_ADMIN)

**Objetivo**: Verificar acesso permitido para TENANT_ADMIN

```
1. Fazer login com: tenant-admin@test.com
2. Acessar: http://localhost:3000/app/company
3. Resultado esperado: Dashboard da empresa é exibido
4. Verificar console: "✅ Access granted to tenant dashboard"
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 3: Acesso ao Dashboard da Empresa (TENANT_USER)

**Objetivo**: Verificar acesso permitido para TENANT_USER

```
1. Fazer login com: tenant-user@test.com
2. Acessar: http://localhost:3000/app/company
3. Resultado esperado: Dashboard da empresa é exibido
4. Verificar console: "✅ Access granted to tenant dashboard"
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 4: Acesso Negado ao Dashboard Interno (TENANT_USER)

**Objetivo**: Verificar bloqueio de acesso para usuários tenant

```
1. Fazer login com: tenant-user@test.com
2. Acessar: http://localhost:3000/app/internal
3. Resultado esperado: Redireciona para /auth/login?error=access_denied
4. Verificar console: "🚫 Access denied to internal dashboard"
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 5: Acesso ao Dashboard Interno (INTERNAL_ADMIN)

**Objetivo**: Verificar acesso permitido para INTERNAL_ADMIN

```
1. Fazer login com: internal-admin@test.com
2. Acessar: http://localhost:3000/app/internal
3. Resultado esperado: Dashboard interno é exibido
4. Verificar console: "✅ Access granted to internal dashboard"
5. Verificar badge: "Admin" no header
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 6: Acesso ao Dashboard Interno (INTERNAL_SUPPORT)

**Objetivo**: Verificar acesso permitido para INTERNAL_SUPPORT

```
1. Fazer login com: internal-support@test.com
2. Acessar: http://localhost:3000/app/internal
3. Resultado esperado: Dashboard interno é exibido
4. Verificar console: "✅ Access granted to internal dashboard"
5. Verificar badge: "Suporte" no header
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 7: Acesso Cruzado (INTERNAL_ADMIN → Company Dashboard)

**Objetivo**: Verificar que admin interno pode acessar dashboard da empresa

```
1. Fazer login com: internal-admin@test.com
2. Acessar: http://localhost:3000/app/company
3. Resultado esperado: Dashboard da empresa é exibido
4. Verificar console: "✅ Access granted to tenant dashboard"
```

✅ **Passou** | ❌ **Falhou**

---

## 🎨 Testes de UI

### Teste 8: Dashboard da Empresa - Carregamento de Dados

**Objetivo**: Verificar carregamento correto dos dados do tenant

```
1. Fazer login com: tenant-admin@test.com
2. Acessar: http://localhost:3000/app/company
3. Verificar:
   - [ ] Nome da empresa é exibido
   - [ ] CNPJ é exibido
   - [ ] Badge de status "Ativo" é exibido
   - [ ] Métricas são carregadas (Agentes, Usuários, Requisições, MRR)
   - [ ] Barras de progresso são exibidas
   - [ ] Gráfico de uso é renderizado
   - [ ] Lista de incidentes é exibida
   - [ ] Lista de agentes é exibida
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 9: Dashboard da Empresa - Navegação

**Objetivo**: Verificar navegação lateral

```
1. Fazer login com: tenant-admin@test.com
2. Acessar: http://localhost:3000/app/company
3. Clicar em cada item do menu:
   - [ ] Dashboard (ativo por padrão)
   - [ ] Agentes
   - [ ] Uso & Métricas
   - [ ] Incidentes
   - [ ] Integrações
   - [ ] Configurações
4. Verificar que o item ativo tem destaque visual
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 10: Dashboard da Empresa - Menu de Usuário

**Objetivo**: Verificar dropdown do usuário

```
1. Fazer login com: tenant-admin@test.com
2. Acessar: http://localhost:3000/app/company
3. Clicar no avatar/nome do usuário no header
4. Verificar dropdown:
   - [ ] Nome do usuário é exibido
   - [ ] Email do usuário é exibido
   - [ ] Opção "Perfil" está presente
   - [ ] Opção "Notificações" está presente
   - [ ] Opção "Sair" está presente (em vermelho)
5. Clicar em "Sair"
6. Verificar redirecionamento para /auth/login
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 11: Dashboard Interno - Carregamento de Dados

**Objetivo**: Verificar carregamento correto dos dados globais

```
1. Fazer login com: internal-admin@test.com
2. Acessar: http://localhost:3000/app/internal
3. Verificar:
   - [ ] Título "Dashboard Interno" é exibido
   - [ ] Badge "Admin" é exibido
   - [ ] Métricas da Plataforma são carregadas (4 cards)
   - [ ] Métricas Financeiras são carregadas (4 cards)
   - [ ] Gráfico de uso global é renderizado
   - [ ] Top Tenants são exibidos
   - [ ] Comandos recentes são exibidos
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 12: Dashboard Interno - Navegação

**Objetivo**: Verificar navegação lateral

```
1. Fazer login com: internal-admin@test.com
2. Acessar: http://localhost:3000/app/internal
3. Clicar em cada item do menu:
   - [ ] Dashboard Global (ativo por padrão)
   - [ ] Tenants
   - [ ] Agentes
   - [ ] Uso da Plataforma
   - [ ] Financeiro
   - [ ] Operações
   - [ ] Incidentes
   - [ ] Monitoramento
   - [ ] Configurações
4. Verificar que o item ativo tem destaque visual (roxo)
```

✅ **Passou** | ❌ **Falhou**

---

## 📊 Testes de Componentes

### Teste 13: MetricsCard - Com Percentual

**Objetivo**: Verificar renderização do card de métricas com barra de progresso

```
1. Acessar dashboard da empresa
2. Verificar card "Agentes Ativos":
   - [ ] Título é exibido
   - [ ] Valor atual é exibido
   - [ ] Valor total é exibido (formato: "X / Y")
   - [ ] Percentual é exibido
   - [ ] Barra de progresso é renderizada
   - [ ] Cor da barra muda conforme percentual:
     * Verde: < 75%
     * Amarelo: 75-90%
     * Vermelho: > 90%
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 14: MetricsCard - Sem Percentual

**Objetivo**: Verificar renderização do card de métricas sem barra

```
1. Acessar dashboard da empresa
2. Verificar card "MRR Estimado":
   - [ ] Título é exibido
   - [ ] Valor é exibido (formato monetário)
   - [ ] Subtítulo é exibido
   - [ ] Ícone é exibido
   - [ ] Barra de progresso NÃO é exibida
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 15: IncidentsList - Com Dados

**Objetivo**: Verificar lista de incidentes

```
1. Acessar dashboard da empresa
2. Verificar lista de incidentes:
   - [ ] Incidentes são exibidos
   - [ ] Cada incidente tem:
     * Ícone de severidade (vermelho/amarelo/azul)
     * Título
     * Descrição
     * Badge de severidade
     * Data de criação
     * Data de resolução (se resolvido)
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 16: IncidentsList - Sem Dados

**Objetivo**: Verificar estado vazio

```
1. Acessar dashboard de tenant sem incidentes
2. Verificar:
   - [ ] Ícone de check verde é exibido
   - [ ] Mensagem "Nenhum incidente recente" é exibida
   - [ ] Submensagem "Seus serviços estão funcionando normalmente"
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 17: AgentsList - Filtros

**Objetivo**: Verificar filtros da lista de agentes

```
1. Acessar dashboard da empresa
2. Verificar lista de agentes:
   - [ ] Botões de filtro são exibidos (Ativos, Inativos, Todos)
   - [ ] Clicar em "Ativos": apenas agentes ativos são exibidos
   - [ ] Clicar em "Inativos": apenas agentes inativos são exibidos
   - [ ] Clicar em "Todos": todos os agentes são exibidos
   - [ ] Botão ativo tem destaque visual
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 18: TopTenantsList - Ranking

**Objetivo**: Verificar lista de top tenants

```
1. Fazer login como internal-admin
2. Acessar dashboard interno
3. Verificar lista de top tenants:
   - [ ] Tenants são exibidos em ordem decrescente de MRR
   - [ ] Cada tenant tem:
     * Número de ranking (#1, #2, etc.)
     * Nome do tenant
     * Número de agentes
     * Número de requisições
     * Badge com MRR
   - [ ] Máximo de 10 tenants são exibidos
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 19: RecentCommandsList - Status

**Objetivo**: Verificar lista de comandos operacionais

```
1. Fazer login como internal-admin
2. Acessar dashboard interno
3. Verificar lista de comandos:
   - [ ] Comandos são exibidos
   - [ ] Cada comando tem:
     * Ícone de status (check/x/loading/clock)
     * Nome do comando traduzido
     * Badge de status (Sucesso/Erro/Executando/Pendente)
     * Nome do tenant (se aplicável)
     * Mensagem de erro (se houver)
     * Data de criação
     * Data de conclusão (se concluído)
```

✅ **Passou** | ❌ **Falhou**

---

## 🔄 Testes de Loading States

### Teste 20: Skeleton Loaders

**Objetivo**: Verificar estados de carregamento

```
1. Fazer login
2. Acessar dashboard (company ou internal)
3. Observar durante o carregamento inicial:
   - [ ] Skeleton loaders são exibidos nos cards de métricas
   - [ ] Skeleton loaders são exibidos nas listas
   - [ ] Skeleton loaders são exibidos nos gráficos
4. Após carregamento:
   - [ ] Skeletons são substituídos por dados reais
   - [ ] Transição é suave
```

✅ **Passou** | ❌ **Falhou**

---

## 🚨 Testes de Erro

### Teste 21: Erro de API

**Objetivo**: Verificar tratamento de erros

```
1. Desligar o backend
2. Fazer login
3. Acessar dashboard
4. Verificar:
   - [ ] Mensagem de erro é exibida
   - [ ] UI não quebra
   - [ ] Possibilidade de retry (se implementado)
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 22: Token Expirado

**Objetivo**: Verificar comportamento com token expirado

```
1. Fazer login
2. Aguardar expiração do token (ou forçar expiração)
3. Tentar acessar dashboard
4. Verificar:
   - [ ] Redireciona para login
   - [ ] Mensagem apropriada é exibida
```

✅ **Passou** | ❌ **Falhou**

---

## 📱 Testes de Responsividade

### Teste 23: Mobile

**Objetivo**: Verificar layout em dispositivos móveis

```
1. Abrir DevTools (F12)
2. Ativar modo responsivo
3. Selecionar dispositivo móvel (iPhone, Android)
4. Verificar:
   - [ ] Sidebar é ocultada ou colapsada
   - [ ] Cards de métricas empilham verticalmente
   - [ ] Gráficos se ajustam ao tamanho
   - [ ] Listas são scrolláveis
   - [ ] Menu de usuário funciona
```

✅ **Passou** | ❌ **Falhou**

---

### Teste 24: Tablet

**Objetivo**: Verificar layout em tablets

```
1. Abrir DevTools (F12)
2. Ativar modo responsivo
3. Selecionar tablet (iPad)
4. Verificar:
   - [ ] Layout se ajusta apropriadamente
   - [ ] Sidebar permanece visível
   - [ ] Cards de métricas em grid 2x2
   - [ ] Navegação funciona corretamente
```

✅ **Passou** | ❌ **Falhou**

---

## 🔍 Testes de Console

### Teste 25: Logs de Autorização

**Objetivo**: Verificar logs no console

```
1. Abrir DevTools (F12) → Console
2. Fazer login com diferentes usuários
3. Acessar diferentes rotas
4. Verificar logs:
   - [ ] "✅ Access granted" para acessos permitidos
   - [ ] "🚫 Access denied" para acessos negados
   - [ ] Grupos do usuário são logados
   - [ ] Pathname é logado
```

✅ **Passou** | ❌ **Falhou**

---

## 📊 Checklist Final

### Middleware
- [ ] Redirecionamento sem autenticação funciona
- [ ] Validação de grupos funciona
- [ ] Logging está correto
- [ ] Rotas públicas não são bloqueadas

### Dashboard da Empresa
- [ ] Dados do tenant são carregados
- [ ] Métricas são exibidas corretamente
- [ ] Navegação funciona
- [ ] Menu de usuário funciona
- [ ] Loading states funcionam
- [ ] Estados vazios funcionam

### Dashboard Interno
- [ ] Dados globais são carregados
- [ ] Métricas da plataforma são exibidas
- [ ] Métricas financeiras são exibidas
- [ ] Top tenants são exibidos
- [ ] Comandos recentes são exibidos
- [ ] Navegação funciona
- [ ] Badge de admin/suporte é exibido

### Componentes
- [ ] MetricsCard renderiza corretamente
- [ ] IncidentsList funciona
- [ ] AgentsList funciona com filtros
- [ ] TopTenantsList funciona
- [ ] RecentCommandsList funciona
- [ ] Skeleton loaders funcionam

### Segurança
- [ ] Acesso é negado para grupos não autorizados
- [ ] Redirecionamento funciona corretamente
- [ ] Token expirado é tratado
- [ ] Logs de segurança estão presentes

---

## 🎯 Critérios de Aceitação

Para considerar a Tarefa 9 como aprovada em testes:

✅ **Mínimo 90% dos testes devem passar**
✅ **Todos os testes de segurança devem passar**
✅ **Nenhum erro crítico no console**
✅ **UI responsiva em mobile e desktop**

---

## 📝 Relatório de Testes

Após completar os testes, preencha:

**Data**: ___/___/______
**Testador**: _________________
**Ambiente**: Dev / Staging / Prod

**Resultados**:
- Testes Passados: ___/25
- Testes Falhados: ___/25
- Taxa de Sucesso: ___%

**Problemas Encontrados**:
1. _________________________________
2. _________________________________
3. _________________________________

**Observações**:
_________________________________
_________________________________
_________________________________

---

## 🚀 Próximos Passos Após Testes

Se todos os testes passarem:
1. ✅ Marcar Tarefa 9 como completa
2. ✅ Fazer commit das mudanças
3. ✅ Criar PR para review
4. ✅ Iniciar Tarefa 10

Se houver falhas:
1. ❌ Documentar problemas encontrados
2. ❌ Criar issues no GitHub
3. ❌ Corrigir problemas
4. ❌ Re-executar testes
