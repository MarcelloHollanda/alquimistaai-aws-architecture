# Quick Start — Painel Operacional AlquimistaAI

## Começar Agora

### 1. Configurar Cognito (5 minutos)

```powershell
# Obter User Pool ID
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Executar script de configuração
.\scripts\setup-operational-dashboard.ps1 -UserPoolId "us-east-1_XXXXXXXXX"
```

### 2. Verificar Aurora (2 minutos)

```bash
# Conectar ao Aurora
psql -h <aurora-endpoint> -U <user> -d alquimista_platform

# Verificar schema
\dt alquimista_platform.*
```

### 3. Iniciar Implementação

Abra o arquivo de tasks e comece pela Task 2:

```
.kiro/specs/operational-dashboard-alquimistaai/tasks.md
```

---

## Estrutura da Spec

```
.kiro/specs/operational-dashboard-alquimistaai/
├── README.md              # Resumo executivo
├── requirements.md        # 15 requisitos funcionais
├── design.md             # Arquitetura técnica
├── tasks.md              # 25 tarefas (24-33 dias)
├── INDEX.md              # Índice navegável
└── SPEC-COMPLETE.md      # Status e próximos passos
```

---

## Fases de Implementação

### ✅ Fase 1 - Fundação (2-3 dias)
- Task 1: Configurar grupos Cognito ← **COMECE AQUI**
- Task 2: Middleware de autorização
- Task 3: Modelo de dados

### ⏳ Fase 2 - Backend (5-7 dias)
- Tasks 4-8: APIs e comandos operacionais

### ⏳ Fase 3 - Frontend Cliente (4-5 dias)
- Tasks 9-12: Dashboard do cliente

### ⏳ Fase 4 - Frontend Interno (5-6 dias)
- Tasks 13-15: Painel operacional

### ⏳ Fase 5 - Qualidade (6-8 dias)
- Tasks 16-23: Cache, testes, documentação

### ⏳ Fase 6 - Deploy (1-2 dias)
- Tasks 24-25: Deploy em produção

---

## Comandos Úteis

```bash
# Listar grupos Cognito
aws cognito-idp list-groups --user-pool-id <id> --region us-east-1

# Listar usuários em grupo
aws cognito-idp list-users-in-group \
  --user-pool-id <id> \
  --group-name INTERNAL_ADMIN \
  --region us-east-1

# Conectar ao Aurora
psql -h <endpoint> -U <user> -d alquimista_platform

# Compilar CDK
npm run build && cdk synth --context env=dev

# Iniciar frontend dev
cd frontend && npm run dev
```

---

## Documentação Completa

- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - Guia detalhado de configuração
- **[requirements.md](../../.kiro/specs/operational-dashboard-alquimistaai/requirements.md)** - Requisitos
- **[design.md](../../.kiro/specs/operational-dashboard-alquimistaai/design.md)** - Arquitetura
- **[tasks.md](../../.kiro/specs/operational-dashboard-alquimistaai/tasks.md)** - Plano de implementação

---

## Suporte

Problemas? Consulte:
1. [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Seção Troubleshooting
2. [INDEX.md](../../.kiro/specs/operational-dashboard-alquimistaai/INDEX.md) - Índice completo
3. Logs do CloudWatch

---

**Pronto para começar? Execute o script de setup e abra tasks.md!** 🚀
