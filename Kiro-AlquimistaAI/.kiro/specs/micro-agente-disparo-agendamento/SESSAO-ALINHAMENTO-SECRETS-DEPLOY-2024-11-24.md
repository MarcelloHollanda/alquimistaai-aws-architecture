# 📋 Sessão de Alinhamento: Secrets e Preparação para Deploy DEV

**Data:** 24 de novembro de 2024  
**Objetivo:** Alinhar padrão de secrets, scripts e Terraform para deploy em DEV

---

## ✅ O Que Foi Alinhado

### 1. Padrão de Nomenclatura de Secrets

**Padrão Oficial Adotado:**
```
/repo/terraform/micro-agente-disparo-agendamento/whatsapp
/repo/terraform/micro-agente-disparo-agendamento/email
/repo/terraform/micro-agente-disparo-agendamento/calendar
```

**Justificativa:**
- Consistente com o Terraform (`secrets.tf`)
- Organização por repositório e módulo
- Independente de ambiente (dev/prod)
- Facilita gestão centralizada

### 2. Scripts Atualizados

#### ✅ `create-secrets.ps1`
- **Antes:** `/alquimista/$env/agente-disparo-agenda/mcp-*`
- **Depois:** `/repo/terraform/micro-agente-disparo-agendamento/*`
- **Mudanças:**
  - Removida variável `$env` (não mais necessária no path)
  - Descrições simplificadas e consistentes
  - Mantidos placeholders para valores reais

#### ✅ `validate-terraform-vars.ps1`
- **Antes:** Verificava secrets com padrão antigo
- **Depois:** Verifica secrets com padrão novo
- **Mudanças:**
  - Array `$secretsToCheck` atualizado
  - Validação alinhada com Terraform

#### ✅ `build-and-upload-lambdas.ps1`
- **Status:** Já estava correto
- **Funcionalidade:** Build TypeScript + Upload para S3
- **Observação:** Bucket `alquimista-lambda-artifacts-dev` precisa existir

### 3. Terraform Validado

#### ✅ `secrets.tf`
- **Status:** Já estava correto desde o início
- **Data sources:** Apontam para os 3 secrets no padrão oficial
- **Outputs:** Exporta ARNs para uso nas Lambdas

---

## 📝 Sequência de Comandos para Deploy em DEV

### Passo 1: Criar Secrets no AWS Secrets Manager

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\.kiro\specs\micro-agente-disparo-agendamento

.\create-secrets.ps1
```

**O que faz:**
- Cria 3 secrets no Secrets Manager (us-east-1)
- Usa valores placeholder (você deve substituir pelos reais)

**Secrets criados:**
1. `/repo/terraform/micro-agente-disparo-agendamento/whatsapp`
2. `/repo/terraform/micro-agente-disparo-agendamento/email`
3. `/repo/terraform/micro-agente-disparo-agendamento/calendar`

**Importante:** Após criar, atualize os valores reais:
```powershell
aws secretsmanager put-secret-value `
  --region us-east-1 `
  --secret-id "/repo/terraform/micro-agente-disparo-agendamento/whatsapp" `
  --secret-string '{"endpoint":"https://real-endpoint","api_key":"real-key"}'
```

---

### Passo 2: Buildar e Enviar Lambdas para S3

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\.kiro\specs\micro-agente-disparo-agendamento

.\build-and-upload-lambdas.ps1
```

**O que faz:**
1. Instala dependências (`npm install`)
2. Compila TypeScript (`npm run build`)
3. Cria ZIPs de cada handler
4. Faz upload para `s3://alquimista-lambda-artifacts-dev/agente-disparo-agenda/dev/`

**Handlers buildados:**
- `api-handler.zip`
- `ingest-contacts.zip`
- `send-messages.zip`
- `handle-replies.zip`
- `schedule-meeting.zip`
- `confirm-meeting.zip`

---

### Passo 3: Validar Variáveis do Terraform

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\.kiro\specs\micro-agente-disparo-agendamento

.\validate-terraform-vars.ps1
```

**O que valida:**
1. ✅ SNS Topic de alertas (`alquimista-alerts-dev`)
2. ✅ Bucket de artefatos Lambda (`alquimista-lambda-artifacts-dev`)
3. ✅ VPC e Subnets privadas (tag `Project=Alquimista`)
4. ✅ Aurora Cluster (`alquimista-*-dev`)
5. ✅ EventBridge Bus (`fibonacci-bus-dev`)
6. ✅ Secrets Manager (3 secrets no padrão correto)

**Saída esperada:**
- Lista de ARNs e IDs para usar no Terraform
- Confirmação de que pode prosseguir com `terraform apply`

---

### Passo 4: Aplicar Terraform em DEV

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\terraform\envs\dev

terraform init
terraform plan
terraform apply
```

**O que será criado:**
- 2 Lambdas (Disparo + Agendamento)
- 1 API Gateway HTTP (com 6 rotas)
- 2 DynamoDB Tables (dispatch_queue + rate_limit_tracker)
- EventBridge Scheduler (cron para disparo automático)
- EventBridge Rules (para eventos de campanha)
- CloudWatch Alarms (monitoramento)
- IAM Roles e Policies

---

## 🎯 Critérios de Aceitação - TODOS ATENDIDOS

### ✅ 1. Secrets no Padrão Correto
- [x] Terraform usa `/repo/terraform/micro-agente-disparo-agendamento/*`
- [x] Script `create-secrets.ps1` cria exatamente esses 3 secrets
- [x] Comentários e documentação consistentes

### ✅ 2. Scripts Alinhados
- [x] `create-secrets.ps1` atualizado
- [x] `build-and-upload-lambdas.ps1` validado
- [x] `validate-terraform-vars.ps1` atualizado
- [x] Todos apontam para bucket e recursos corretos

### ✅ 3. Documentos Atualizados
- [x] `RESUMO-PREPARACAO-DEPLOY.md` com nomes corretos
- [x] `GUIA-TERRAFORM-APPLY.md` com sequência coerente
- [x] `RESUMO-PARA-CHATGPT.md` atualizado

### ✅ 4. Resumo Final Criado
- [x] Este documento (`SESSAO-ALINHAMENTO-SECRETS-DEPLOY-2024-11-24.md`)
- [x] Descreve o que foi alinhado
- [x] Próximos passos claros

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    PREPARAÇÃO COMPLETA                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SECRETS MANAGER                                         │
│     ✓ Padrão: /repo/terraform/micro-agente-*/              │
│     ✓ 3 secrets: whatsapp, email, calendar                 │
│                                                             │
│  2. SCRIPTS                                                 │
│     ✓ create-secrets.ps1 → Cria secrets                    │
│     ✓ build-and-upload-lambdas.ps1 → Build + S3           │
│     ✓ validate-terraform-vars.ps1 → Valida recursos        │
│                                                             │
│  3. TERRAFORM                                               │
│     ✓ secrets.tf → Data sources corretos                   │
│     ✓ Módulo completo e validado                           │
│                                                             │
│  4. DOCUMENTAÇÃO                                            │
│     ✓ Guias atualizados                                    │
│     ✓ Comandos oficiais documentados                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Próximo Passo

**Executar os comandos oficiais para fazer o deploy em DEV:**

1. Criar secrets (se ainda não existem)
2. Buildar e enviar Lambdas
3. Validar variáveis
4. Aplicar Terraform

**Tudo está alinhado e pronto para execução!**

---

## 📚 Referências

- **Blueprint:** `.kiro/steering/blueprint-disparo-agendamento.md`
- **Design:** `.kiro/specs/micro-agente-disparo-agendamento/design.md`
- **Terraform:** `terraform/modules/agente_disparo_agenda/`
- **Lambdas:** `lambda-src/agente-disparo-agenda/`

---

**Sessão concluída com sucesso!** ✅
