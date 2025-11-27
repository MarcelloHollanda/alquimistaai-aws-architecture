# 📚 Índice - Teste de Workflow CI/CD

## 🚀 Início Rápido

**Quer começar agora?**

👉 **[TESTE-CI-CD-AGORA.md](../../TESTE-CI-CD-AGORA.md)** - Execute em 3 passos!

```powershell
.\scripts\test-ci-cd-workflow.ps1 -TestType basic
```

---

## 📖 Documentação

### Guias de Teste

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[TESTE-CI-CD-AGORA.md](../../TESTE-CI-CD-AGORA.md)** | Início rápido em 3 passos | Primeira vez testando |
| **[QUICK-TEST.md](./QUICK-TEST.md)** | Referência rápida | Consulta rápida |
| **[TESTE-WORKFLOW-VALIDACAO.md](./TESTE-WORKFLOW-VALIDACAO.md)** | Guia completo e detalhado | Validação completa |
| **[TESTE-WORKFLOW-RESUMO.md](./TESTE-WORKFLOW-RESUMO.md)** | Resumo de recursos | Visão geral |

### Guias Visuais

| Documento | Descrição |
|-----------|-----------|
| **[WORKFLOW-VISUAL-GUIDE.md](./WORKFLOW-VISUAL-GUIDE.md)** | Fluxo visual do pipeline |
| **[CHECKLIST-VALIDACAO-WORKFLOW.md](./CHECKLIST-VALIDACAO-WORKFLOW.md)** | Checklist interativo |

### Referência

| Documento | Descrição |
|-----------|-----------|
| **[QUICK-COMMANDS.md](./QUICK-COMMANDS.md)** | Comandos rápidos |
| **[PIPELINE-OVERVIEW.md](./PIPELINE-OVERVIEW.md)** | Overview do pipeline |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Solução de problemas |

---

## 🔧 Scripts

### Script Principal

**[test-ci-cd-workflow.ps1](../../scripts/test-ci-cd-workflow.ps1)**

Modos disponíveis:

```powershell
# Teste básico (seguro, sem deploy)
.\scripts\test-ci-cd-workflow.ps1 -TestType basic

# Teste completo (com deploy real)
.\scripts\test-ci-cd-workflow.ps1 -TestType full

# Teste de segurança (deve falhar)
.\scripts\test-ci-cd-workflow.ps1 -TestType security
```

---

## 🎯 Fluxo de Uso Recomendado

### 1️⃣ Primeira Vez

1. Leia: **[TESTE-CI-CD-AGORA.md](../../TESTE-CI-CD-AGORA.md)**
2. Execute: `.\scripts\test-ci-cd-workflow.ps1 -TestType basic`
3. Acompanhe: GitHub Actions
4. Valide: **[CHECKLIST-VALIDACAO-WORKFLOW.md](./CHECKLIST-VALIDACAO-WORKFLOW.md)**

### 2️⃣ Validação Completa

1. Leia: **[TESTE-WORKFLOW-VALIDACAO.md](./TESTE-WORKFLOW-VALIDACAO.md)**
2. Execute: `.\scripts\test-ci-cd-workflow.ps1 -TestType full`
3. Valide: Recursos na AWS
4. Documente: Resultados

### 3️⃣ Teste de Guardrails

1. Execute: `.\scripts\test-ci-cd-workflow.ps1 -TestType security`
2. Confirme: Workflow deve FALHAR
3. Valide: Security scan detectou violação
4. Limpe: Arquivo de teste removido

---

## 📊 Tipos de Teste

### 🟢 Teste Básico

**Objetivo**: Validar autenticação e pipeline básico

**O que faz**:
- Cria arquivo de documentação
- Faz commit e push
- Dispara workflow
- NÃO altera código de produção

**Quando usar**: Primeira vez, validação rápida

**Segurança**: ✅ Seguro

---

### 🟡 Teste Completo

**Objetivo**: Validar deploy completo

**O que faz**:
- Modifica Lambda (adiciona comentário)
- Faz commit e push
- Executa deploy real na AWS
- Atualiza recursos

**Quando usar**: Validação completa do pipeline

**Segurança**: ⚠️ Cuidado - altera produção

---

### 🔴 Teste de Segurança

**Objetivo**: Validar guardrails de segurança

**O que faz**:
- Cria arquivo com credencial hardcoded
- Workflow DEVE FALHAR
- Valida security scan
- Remove arquivo automaticamente

**Quando usar**: Validar guardrails

**Segurança**: ✅ Seguro - falha proposital

---

## ✅ Checklist Rápido

Antes de testar:

- [ ] OIDC configurado
- [ ] IAM Role criada
- [ ] GitHub Secrets configurados
- [ ] Workflows commitados

Durante o teste:

- [ ] Script executou
- [ ] Workflow disparou
- [ ] OIDC authentication OK
- [ ] Deploy completou

Após o teste:

- [ ] Documentar resultados
- [ ] Configurar notificações
- [ ] Planejar próximos testes

---

## 🆘 Suporte

### Problemas Comuns

| Erro | Solução |
|------|---------|
| Could not assume role | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#oidc-authentication) |
| AccessDenied | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#permissions) |
| Stack in error state | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#cloudformation) |

### Links Úteis

- **GitHub Actions**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
- **AWS Console**: https://console.aws.amazon.com/
- **CloudFormation**: https://console.aws.amazon.com/cloudformation/

---

## 📚 Documentação Relacionada

### CI/CD

- [PIPELINE-OVERVIEW.md](./PIPELINE-OVERVIEW.md)
- [GUARDRAILS-GUIDE.md](./GUARDRAILS-GUIDE.md)
- [OIDC-SETUP.md](./OIDC-SETUP.md)

### Deploy

- [CI-CD-DEPLOY-FLOWS-DEV-PROD.md](../CI-CD-DEPLOY-FLOWS-DEV-PROD.md)
- [ROLLBACK-OPERACIONAL-AWS.md](../ROLLBACK-OPERACIONAL-AWS.md)

### Segurança

- [SECURITY-GUARDRAILS-AWS.md](../SECURITY-GUARDRAILS-AWS.md)

---

## 🎉 Próximos Passos

Após validação bem-sucedida:

1. ✅ Documentar configuração
2. ✅ Configurar notificações
3. ✅ Adicionar ambiente staging
4. ✅ Configurar aprovações para prod
5. ✅ Implementar testes automatizados

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI
