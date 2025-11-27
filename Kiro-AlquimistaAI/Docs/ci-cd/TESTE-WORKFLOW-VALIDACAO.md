# 🧪 Teste de Validação do Workflow CI/CD

## Objetivo

Validar o pipeline CI/CD completo fazendo um commit de teste e verificando:
1. ✅ GitHub Actions consegue assumir a role IAM via OIDC
2. ✅ Deploy funciona corretamente
3. ✅ Guardrails estão ativos e funcionando

---

## Pré-requisitos

Antes de iniciar o teste, confirme que você completou:

- [ ] OIDC Provider configurado na AWS
- [ ] IAM Role criada com trust policy para GitHub
- [ ] GitHub Secrets configurados no repositório
- [ ] Workflows do GitHub Actions commitados

---

## 🎯 Teste 1: Commit Simples (Validação Básica)

### Passo 1: Criar uma mudança mínima

Vamos fazer uma mudança simples que não afeta funcionalidade:

```powershell
# Adicionar um comentário em um arquivo de documentação
echo "# Teste de CI/CD - $(Get-Date)" >> docs/ci-cd/TEST-LOG.md
```

### Passo 2: Commit e Push

```powershell
git add docs/ci-cd/TEST-LOG.md
git commit -m "test(ci-cd): validar workflow de deploy"
git push origin main
```

### Passo 3: Monitorar GitHub Actions

1. Acesse: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions`
2. Localize o workflow que foi disparado
3. Clique para ver os detalhes

### Passo 4: Verificar Logs Críticos

**No job de deploy, procure por:**

✅ **Autenticação OIDC bem-sucedida:**
```
Assuming role with OIDC...
Successfully assumed role: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
```

✅ **CDK Synth executado:**
```
cdk synth --all
Successfully synthesized to cdk.out
```

✅ **CDK Deploy iniciado:**
```
cdk deploy --all --require-approval never
```

❌ **Erros comuns a observar:**
- `Error: Could not assume role` → Problema com OIDC/Trust Policy
- `AccessDenied` → Permissões insuficientes na role
- `Stack already exists` → Pode ser normal, verifica se atualiza

---

## 🎯 Teste 2: Mudança de Código (Validação Completa)

### Passo 1: Fazer mudança em Lambda

Adicione um log em uma Lambda existente:

```typescript
// lambda/shared/logger.ts
// Adicione no início do arquivo:
// CI/CD Test: $(date)
```

### Passo 2: Commit e Push

```powershell
git add lambda/shared/logger.ts
git commit -m "test(lambda): adicionar log de teste para CI/CD"
git push origin main
```

### Passo 3: Verificar Deploy Completo

Aguarde o workflow completar e verifique:

1. **Logs do CDK Deploy:**
   - Stacks sendo atualizadas
   - Lambdas sendo deployadas
   - CloudFormation changesets aplicados

2. **Validação na AWS Console:**
   ```powershell
   # Verificar última atualização da Lambda
   aws lambda get-function --function-name <nome-da-lambda> --query 'Configuration.LastModified'
   ```

---

## 🎯 Teste 3: Validar Guardrails

### Teste de Segurança

Tente fazer um commit que viola as regras de segurança:

```typescript
// Criar arquivo com credencial hardcoded (DEVE FALHAR)
// test-security.ts
const apiKey = "sk-1234567890abcdef"; // Isso deve ser bloqueado
```

```powershell
git add test-security.ts
git commit -m "test(security): validar bloqueio de credenciais"
git push origin main
```

**Resultado esperado:** ❌ Workflow deve FALHAR no security scan

### Teste de Custo

Tente criar um recurso caro (DEVE ALERTAR):

```typescript
// lib/test-expensive-stack.ts
// Criar RDS com instância grande
const db = new rds.DatabaseInstance(this, 'ExpensiveDB', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.XLARGE24),
  // ...
});
```

**Resultado esperado:** ⚠️ Workflow deve ALERTAR sobre custo estimado

---

## 📊 Checklist de Validação

### Autenticação e Permissões

- [ ] GitHub Actions consegue assumir a role IAM
- [ ] Credenciais AWS são obtidas via OIDC (sem access keys)
- [ ] Role tem permissões suficientes para deploy

### Deploy

- [ ] CDK synth executa sem erros
- [ ] CDK deploy atualiza stacks existentes
- [ ] Lambdas são deployadas com novo código
- [ ] CloudFormation changesets são aplicados

### Guardrails

- [ ] Security scan detecta credenciais hardcoded
- [ ] Cost estimation é executada
- [ ] Alertas são enviados quando apropriado

### Rollback (Opcional)

- [ ] Em caso de falha, rollback automático funciona
- [ ] Stacks retornam ao estado anterior

---

## 🔍 Troubleshooting

### Erro: "Could not assume role"

**Causa:** Trust policy ou OIDC provider incorreto

**Solução:**
```powershell
# Verificar trust policy da role
aws iam get-role --role-name GitHubActionsRole --query 'Role.AssumeRolePolicyDocument'

# Verificar OIDC provider
aws iam list-open-id-connect-providers
```

### Erro: "AccessDenied"

**Causa:** Permissões insuficientes na role

**Solução:**
```powershell
# Verificar policies anexadas
aws iam list-attached-role-policies --role-name GitHubActionsRole

# Adicionar permissões necessárias
aws iam attach-role-policy --role-name GitHubActionsRole --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

### Erro: "Stack is in UPDATE_ROLLBACK_COMPLETE state"

**Causa:** Deploy anterior falhou

**Solução:**
```powershell
# Continuar rollback
aws cloudformation continue-update-rollback --stack-name <stack-name>

# Ou deletar e recriar
aws cloudformation delete-stack --stack-name <stack-name>
```

---

## 📝 Comandos Úteis para Monitoramento

### Verificar status do workflow

```powershell
# Via GitHub CLI
gh run list --limit 5

# Ver logs do último run
gh run view --log
```

### Verificar stacks na AWS

```powershell
# Listar todas as stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Ver eventos de uma stack específica
aws cloudformation describe-stack-events --stack-name AlquimistaStack --max-items 10
```

### Verificar Lambdas deployadas

```powershell
# Listar Lambdas
aws lambda list-functions --query 'Functions[*].[FunctionName,LastModified]' --output table

# Ver configuração de uma Lambda
aws lambda get-function-configuration --function-name <nome-da-lambda>
```

---

## ✅ Critérios de Sucesso

O teste é considerado bem-sucedido quando:

1. ✅ Workflow executa sem erros de autenticação
2. ✅ Deploy atualiza recursos na AWS
3. ✅ Guardrails detectam violações quando apropriado
4. ✅ Logs mostram todas as etapas executadas corretamente
5. ✅ Recursos na AWS refletem as mudanças do código

---

## 🎉 Próximos Passos

Após validação bem-sucedida:

1. **Documentar ARNs e IDs importantes**
2. **Configurar notificações (Slack/Email)**
3. **Adicionar mais ambientes (staging, prod)**
4. **Configurar aprovações manuais para prod**
5. **Implementar testes automatizados no pipeline**

---

## 📚 Referências

- [GitHub Actions - OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS CDK - CI/CD](https://docs.aws.amazon.com/cdk/v2/guide/continuous_integration.html)
- [Documentação interna](./PIPELINE-OVERVIEW.md)
