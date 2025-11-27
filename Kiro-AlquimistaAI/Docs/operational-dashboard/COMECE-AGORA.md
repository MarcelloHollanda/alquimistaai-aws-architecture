# 🚀 Comece Agora — Painel Operacional AlquimistaAI

## Passo a Passo Rápido

### 1️⃣ Obter User Pool ID (1 minuto)

```powershell
# Listar User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Copiar o User Pool ID (ex: us-east-1_XXXXXXXXX)
```

### 2️⃣ Executar Script de Setup (5 minutos)

```powershell
# Navegar para a raiz do projeto
cd C:\caminho\para\alquimistaai-aws-architecture

# Executar script
.\scripts\setup-operational-dashboard.ps1 -UserPoolId "us-east-1_XXXXXXXXX"
```

**O que o script faz:**
- ✅ Cria 4 grupos no Cognito
- ✅ Cria 2 usuários de teste
- ✅ Valida configuração

### 3️⃣ Verificar no Console AWS (2 minutos)

1. Acesse: https://console.aws.amazon.com/cognito/
2. Selecione seu User Pool
3. Vá em "Groups" → Verifique os 4 grupos criados
4. Vá em "Users" → Verifique os usuários de teste

### 4️⃣ Abrir Tasks e Começar Implementação

```powershell
# Abrir arquivo de tasks no VS Code
code .kiro\specs\operational-dashboard-alquimistaai\tasks.md
```

**Começar pela Task 2** (Task 1 já foi feita pelo script):
- Task 2: Implementar Middleware de Autorização (Backend)

---

## ✅ Checklist Rápido

Antes de começar a implementação:

- [ ] User Pool ID identificado
- [ ] Script executado com sucesso
- [ ] 4 grupos criados no Cognito
- [ ] 2 usuários de teste criados
- [ ] Grupos verificados no console AWS
- [ ] Arquivo tasks.md aberto

---

## 📋 Credenciais de Teste

Após executar o script, você terá:

**Usuário Admin Interno:**
- Email: `admin@alquimistaai.com`
- Senha temporária: `TempPass123!`
- Grupo: `INTERNAL_ADMIN`

**Usuário Suporte Interno:**
- Email: `suporte@alquimistaai.com`
- Senha temporária: `TempPass123!`
- Grupo: `INTERNAL_SUPPORT`

⚠️ **IMPORTANTE**: Altere as senhas no primeiro login!

---

## 🎯 Próximas Tasks

### Task 2: Middleware de Autorização (2-3 horas)

Criar `lambda/shared/authorization-middleware.ts`:

```typescript
// Funções principais:
- extractAuthContext()
- requireInternal()
- requireTenantAccess()
```

### Task 3: Modelo de Dados (4-6 horas)

Criar migration `database/migrations/015_create_operational_dashboard_tables.sql`:

```sql
-- Tabelas:
- tenant_users
- tenant_agents
- tenant_integrations
- tenant_usage_daily
- operational_events
```

---

## 📚 Documentação

- **[QUICK-START.md](./QUICK-START.md)** - Guia rápido completo
- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - Guia detalhado de configuração
- **[tasks.md](../../.kiro/specs/operational-dashboard-alquimistaai/tasks.md)** - Plano completo (25 tarefas)

---

## 🆘 Problemas?

### Erro: "User pool does not exist"
```powershell
# Verificar região
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

### Erro: "Access denied"
```powershell
# Verificar credenciais AWS
aws sts get-caller-identity
```

### Script não executa
```powershell
# Permitir execução de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 💡 Dicas

1. **Mantenha o console AWS aberto** para verificar recursos criados
2. **Use o VS Code** para editar arquivos
3. **Siga as tasks sequencialmente** - não pule etapas
4. **Teste cada task** antes de prosseguir
5. **Consulte o design.md** quando tiver dúvidas sobre arquitetura

---

## 🎉 Pronto!

Você está pronto para começar a implementação do Painel Operacional AlquimistaAI!

**Próximo passo**: Abra `tasks.md` e comece pela Task 2.

```powershell
code .kiro\specs\operational-dashboard-alquimistaai\tasks.md
```

---

**Boa implementação!** 🚀
