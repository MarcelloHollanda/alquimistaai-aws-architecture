# 🚀 Teste o CI/CD AGORA

## ⚡ Início Rápido - 3 Passos

### Passo 1: Execute o Script de Teste

```powershell
.\scripts\test-ci-cd-workflow.ps1 -TestType basic
```

### Passo 2: Confirme o Push

Quando perguntado "Deseja fazer push agora? (s/n)", digite: **s**

### Passo 3: Monitore o Workflow

Acesse: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions

---

## 📋 O que o Script Faz

1. ✅ Verifica pré-requisitos (Git, AWS CLI, GitHub CLI)
2. ✅ Cria arquivo de teste em `docs/ci-cd/TEST-LOG.md`
3. ✅ Faz commit com mensagem padronizada
4. ✅ Faz push para o repositório
5. ✅ Abre o GitHub Actions para monitoramento

---

## 🎯 O que Você Deve Ver

### No Terminal

```
🧪 Iniciando Teste de Workflow CI/CD
Tipo de teste: basic
Branch: main

📋 Verificando pré-requisitos...
✅ Git instalado
✅ GitHub CLI instalado
✅ AWS CLI instalado
✅ Repositório Git detectado

🎯 Executando Teste Básico

📝 Criando arquivo de teste...
✅ Arquivo criado: docs/ci-cd/TEST-LOG.md

📦 Adicionando arquivo ao Git...
💾 Criando commit...
✅ Commit criado

🚀 Fazendo push para main...

Deseja fazer push agora? (s/n): s
✅ Push realizado com sucesso!

🔍 Abrindo GitHub Actions...
```

### No GitHub Actions

Você verá um workflow executando com estas etapas:

```
✓ Setup
✓ Configure AWS Credentials (OIDC)
✓ Security Scan
✓ CDK Synth
✓ CDK Deploy
✓ Post-Deploy Validation
```

---

## ✅ Validação de Sucesso

### 1. Autenticação OIDC

Procure nos logs:
```
Assuming role with OIDC...
✓ Successfully assumed role: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
```

### 2. Deploy Executado

Procure nos logs:
```
cdk deploy --all
✓ AlquimistaStack: deployed successfully
✓ FibonacciStack: deployed successfully
✓ NigredoStack: deployed successfully
```

### 3. Workflow Completo

Badge verde: ![Success](https://img.shields.io/badge/build-passing-brightgreen)

---

## ❌ Se Algo Der Errado

### Erro: "Could not assume role"

**Problema**: OIDC ou Trust Policy incorreto

**Solução**:
```powershell
# Verificar role
aws iam get-role --role-name GitHubActionsRole

# Verificar OIDC provider
aws iam list-open-id-connect-providers
```

### Erro: "AccessDenied"

**Problema**: Permissões insuficientes

**Solução**:
```powershell
# Ver policies da role
aws iam list-attached-role-policies --role-name GitHubActionsRole
```

### Erro: "Stack in UPDATE_ROLLBACK_COMPLETE"

**Problema**: Deploy anterior falhou

**Solução**:
```powershell
# Continuar rollback
aws cloudformation continue-update-rollback --stack-name <stack-name>
```

---

## 🔍 Comandos de Monitoramento

### Via GitHub CLI

```powershell
# Ver últimos workflows
gh run list --limit 5

# Acompanhar em tempo real
gh run watch

# Ver logs completos
gh run view --log
```

### Via AWS CLI

```powershell
# Ver stacks atualizadas
aws cloudformation list-stacks --stack-status-filter UPDATE_COMPLETE

# Ver eventos de uma stack
aws cloudformation describe-stack-events --stack-name AlquimistaStack --max-items 10
```

---

## 📚 Documentação Completa

Após o teste, consulte:

- **[TESTE-WORKFLOW-RESUMO.md](./docs/ci-cd/TESTE-WORKFLOW-RESUMO.md)** - Resumo completo
- **[TESTE-WORKFLOW-VALIDACAO.md](./docs/ci-cd/TESTE-WORKFLOW-VALIDACAO.md)** - Guia detalhado
- **[QUICK-TEST.md](./docs/ci-cd/QUICK-TEST.md)** - Referência rápida
- **[WORKFLOW-VISUAL-GUIDE.md](./docs/ci-cd/WORKFLOW-VISUAL-GUIDE.md)** - Guia visual

---

## 🎉 Próximos Testes

Após o teste básico funcionar:

### Teste Completo (com deploy real)
```powershell
.\scripts\test-ci-cd-workflow.ps1 -TestType full
```

### Teste de Segurança (deve falhar)
```powershell
.\scripts\test-ci-cd-workflow.ps1 -TestType security
```

---

## 💡 Dicas

1. **Primeira vez?** Use o teste básico (`-TestType basic`)
2. **Quer ver deploy real?** Use o teste completo (`-TestType full`)
3. **Validar guardrails?** Use o teste de segurança (`-TestType security`)
4. **Problemas?** Consulte [TROUBLESHOOTING.md](./docs/ci-cd/TROUBLESHOOTING.md)

---

**Pronto para começar? Execute:**

```powershell
.\scripts\test-ci-cd-workflow.ps1 -TestType basic
```

🚀 **Boa sorte com o teste!**
