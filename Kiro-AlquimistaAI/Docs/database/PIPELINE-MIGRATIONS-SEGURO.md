# Pipeline Seguro de Migrations - Aurora PostgreSQL

**Sistema:** AlquimistaAI  
**Componente:** Infraestrutura de Banco de Dados  
**Data:** 2024-11-27

---

## 🎯 Objetivo

Executar migrations SQL no Aurora PostgreSQL de forma segura, sem expor o banco para acesso público, através de Lambda dentro da VPC.

---

## 🏗️ Arquitetura

### Antes (Problema)

```
┌─────────────┐
│  Máquina    │
│  Local      │──X──▶ Connection Timeout
└─────────────┘
                      ┌──────────────┐
                      │  Aurora      │
                      │  (Privado)   │
                      └──────────────┘
```

**Problemas:**
- Aurora em VPC privada (correto)
- `psql` do Windows não consegue conectar
- Opções ruins: expor Aurora ou usar bastion host

### Depois (Solução)

```
┌─────────────┐
│  Máquina    │
│  Local      │
└─────────────┘
      │
      │ AWS CLI Invoke
      ▼
┌─────────────────────────────────┐
│           AWS Cloud             │
│                                 │
│  ┌────────────────────────────┐ │
│  │         VPC Privada        │ │
│  │                            │ │
│  │  ┌──────────┐  ┌────────┐ │ │
│  │  │ Lambda   │─▶│ Aurora │ │ │
│  │  │ Runner   │  │        │ │ │
│  │  └──────────┘  └────────┘ │ │
│  │                            │ │
│  └────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Benefícios:**
- ✅ Aurora permanece privado
- ✅ Lambda tem acesso direto
- ✅ Invocação remota via AWS CLI
- ✅ Logs no CloudWatch

---

## 📦 Componentes

### 1. Lambda Function

**Nome:** `aurora-migrations-runner-{env}`  
**Runtime:** Node.js 20  
**Localização:** `lambda-src/aurora-migrations-runner/`

**Responsabilidades:**
- Buscar credenciais do Aurora (Secrets Manager)
- Conectar ao Aurora via driver `pg`
- Ler arquivos SQL da pasta `migrations/`
- Executar migrations em transações
- Logar resultados no CloudWatch

### 2. Stack CDK

**Arquivo:** `lib/aurora-migrations-runner-stack.ts`

**Recursos:**
- Lambda Function
- Security Group (acesso porta 5432)
- Permissões IAM (Secrets Manager + RDS)
- CloudWatch Logs

### 3. Scripts PowerShell

**Build:**
- `scripts/build-aurora-migrations-runner.ps1`

**Execução:**
- `scripts/run-migration-017.ps1`
- `scripts/list-migrations.ps1`

---

## 🚀 Como Usar

### Passo 1: Build

```powershell
.\scripts\build-aurora-migrations-runner.ps1
```

### Passo 2: Deploy

```powershell
cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev
```

### Passo 3: Executar Migration

```powershell
.\scripts\run-migration-017.ps1 -Environment dev
```

### Passo 4: Verificar Logs

```powershell
aws logs tail /aws/lambda/aurora-migrations-runner-dev --follow
```

---

## 📋 Migrations Disponíveis

### Migration 017 - dry_run_log

**Arquivo:** `database/migrations/017_create_dry_run_log_micro_agente.sql`

**Propósito:** Tabela de auditoria para dry-run do Micro Agente

**Estrutura:**
- `log_id`, `tenant_id`, `lead_id`
- `canal_decidido`, `motivo_decisao`
- `disparo_seria_executado`, `razao_bloqueio`
- `ambiente`, `feature_flag_enabled`

**Índices:**
- `idx_dry_run_tenant`
- `idx_dry_run_canal`
- `idx_dry_run_ambiente`

---

## 🔒 Segurança

### Credenciais

- ✅ Obtidas via Secrets Manager
- ✅ Nunca em código ou logs
- ✅ Conexão SSL/TLS

### Rede

- ✅ Lambda em subnets privadas
- ✅ Aurora sem acesso público
- ✅ Security Group restritivo

### IAM

- ✅ Menor privilégio
- ✅ Permissões específicas
- ✅ Sem wildcards

---

## 🐛 Troubleshooting

### Connection Timeout

**Causa:** Lambda não está na VPC ou Security Group bloqueando

**Solução:**
```powershell
# Verificar VPC da Lambda
aws lambda get-function-configuration `
  --function-name aurora-migrations-runner-dev `
  --query 'VpcConfig'
```

### Secret Not Found

**Causa:** ARN incorreto ou sem permissão

**Solução:**
```powershell
# Verificar variável de ambiente
aws lambda get-function-configuration `
  --function-name aurora-migrations-runner-dev `
  --query 'Environment.Variables.DB_SECRET_ARN'
```

---

## 📚 Referências

- [Documentação Completa](../../.kiro/specs/micro-agente-disparo-agendamento/PIPELINE-MIGRATIONS-VPC.md)
- [Database README](./README.md)
- [Migrations Folder](./migrations/)

---

**Status:** ✅ Implementado  
**Versão:** 1.0.0  
**Data:** 2024-11-27
