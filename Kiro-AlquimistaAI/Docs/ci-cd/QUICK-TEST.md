# ⚡ Teste Rápido do CI/CD

## Comando Rápido

```powershell
# Teste básico (recomendado para primeira vez)
.\scripts\test-ci-cd-workflow.ps1 -TestType basic

# Teste completo (com deploy real)
.\scripts\test-ci-cd-workflow.ps1 -TestType full

# Teste de segurança (deve falhar propositalmente)
.\scripts\test-ci-cd-workflow.ps1 -TestType security
```

---

## O que cada teste faz?

### 🟢 Teste Básico (`basic`)
- Cria um arquivo de documentação
- Faz commit e push
- **NÃO** altera código de produção
- **Seguro** para executar a qualquer momento

### 🟡 Teste Completo (`full`)
- Modifica uma Lambda (adiciona comentário)
- Faz commit e push
- **EXECUTA DEPLOY REAL** na AWS
- Use com cuidado!

### 🔴 Teste de Segurança (`security`)
- Cria arquivo com credencial hardcoded
- **DEVE FALHAR** no security scan
- Valida que os guardrails estão funcionando
- Remove o arquivo automaticamente após teste

---

## Checklist Rápido

Antes de executar, confirme:

- [ ] OIDC configurado na AWS
- [ ] IAM Role criada
- [ ] GitHub Secrets configurados
- [ ] Workflows commitados no repositório

---

## Monitoramento

### Via GitHub Actions (Web)
```
https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
```

### Via GitHub CLI
```powershell
# Ver últimos workflows
gh run list --limit 5

# Acompanhar workflow em tempo real
gh run watch

# Ver logs do último workflow
gh run view --log
```

### Via AWS CLI
```powershell
# Ver stacks atualizadas recentemente
aws cloudformation list-stacks --stack-status-filter UPDATE_COMPLETE

# Ver eventos de uma stack
aws cloudformation describe-stack-events --stack-name AlquimistaStack --max-items 10
```

---

## Resultado Esperado

### ✅ Sucesso
```
✓ Workflow executado
✓ OIDC authentication successful
✓ CDK synth completed
✓ CDK deploy completed
✓ All stacks updated
```

### ❌ Falha Comum
```
✗ Error: Could not assume role
→ Verificar trust policy e OIDC provider

✗ AccessDenied
→ Verificar permissões da IAM Role

✗ Stack in UPDATE_ROLLBACK_COMPLETE
→ Stack anterior falhou, precisa limpar
```

---

## Troubleshooting Rápido

### Erro de Autenticação
```powershell
# Verificar role
aws iam get-role --role-name GitHubActionsRole

# Verificar OIDC provider
aws iam list-open-id-connect-providers
```

### Erro de Permissão
```powershell
# Ver policies da role
aws iam list-attached-role-policies --role-name GitHubActionsRole
```

### Stack com Erro
```powershell
# Continuar rollback
aws cloudformation continue-update-rollback --stack-name <stack-name>
```

---

## Próximos Passos

Após teste bem-sucedido:

1. ✅ Documentar ARN da role
2. ✅ Configurar notificações
3. ✅ Adicionar ambiente de staging
4. ✅ Configurar aprovações manuais para prod

---

## Documentação Completa

Para guia detalhado: [TESTE-WORKFLOW-VALIDACAO.md](./TESTE-WORKFLOW-VALIDACAO.md)
