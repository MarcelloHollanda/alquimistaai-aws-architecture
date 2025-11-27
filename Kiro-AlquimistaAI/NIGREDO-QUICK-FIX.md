# Nigredo Stack - Guia Rápido de Correção

## 🚀 Solução Rápida (Recomendado)

Execute o script automatizado:

```powershell
.\fix-and-deploy-nigredo.ps1
```

O script irá:
1. ✅ Verificar AWS CLI e CDK
2. ✅ Deletar o stack com erro (se necessário)
3. ✅ Sintetizar o template corrigido
4. ✅ Fazer o deploy do NigredoStack-dev

---

## 🔧 Solução Manual

### Passo 1: Deletar Stack com Erro

**Opção A - AWS Console:**
1. Acesse: https://console.aws.amazon.com/cloudformation
2. Região: us-east-1
3. Selecione `NigredoStack-dev`
4. Clique em "Delete"
5. Aguarde conclusão

**Opção B - AWS CLI:**
```powershell
aws cloudformation delete-stack --stack-name NigredoStack-dev
aws cloudformation wait stack-delete-complete --stack-name NigredoStack-dev
```

### Passo 2: Deploy Corrigido

```powershell
# Sintetizar template
npx cdk synth NigredoStack-dev

# Deploy
npx cdk deploy NigredoStack-dev --verbose
```

---

## 📋 O Que Foi Corrigido?

### Problema
```
Export with name dev-FunnelConversionQuery is already exported by stack FibonacciStack-dev
```

### Solução
Adicionado prefixo "Nigredo-" aos exports em `lib/cloudwatch-insights-queries.ts`:

| Antes | Depois |
|-------|--------|
| `dev-FunnelConversionQuery` | `Nigredo-dev-FunnelConversionQuery` |
| `dev-ErrorsByAgentQuery` | `Nigredo-dev-ErrorsByAgentQuery` |
| `dev-LatencyByEndpointQuery` | `Nigredo-dev-LatencyByEndpointQuery` |

---

## ✅ Validação Pós-Deploy

Verifique se o deploy foi bem-sucedido:

```powershell
# Verificar status do stack
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].StackStatus'

# Listar exports criados
aws cloudformation list-exports --query 'Exports[?starts_with(Name, `Nigredo`)].Name'

# Obter URL da API
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].Outputs[?OutputKey==`NigredoApiUrl`].OutputValue' --output text
```

---

## 🆘 Troubleshooting

### Erro: "cdk: command not found"
```powershell
npm install -g aws-cdk
```

### Erro: "aws: command not found"
Instale AWS CLI: https://aws.amazon.com/cli/

### Erro: "Stack still exists"
Aguarde alguns minutos e tente novamente. A deleção pode levar tempo.

### Erro: "Access Denied"
Verifique suas credenciais AWS:
```powershell
aws sts get-caller-identity
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `NIGREDO-EXPORT-FIX-SUMMARY.md` - Resumo completo das correções
- `docs/nigredo/DEPLOYMENT.md` - Guia de deployment
- `docs/nigredo/OPERATIONS.md` - Guia operacional

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Testar API:**
   ```bash
   curl https://[API-URL]/api/leads
   ```

2. **Verificar Dashboards:**
   - CloudWatch > Dashboards > `nigredo-agents-dev`
   - CloudWatch > Dashboards > `nigredo-prospecting-dev`

3. **Verificar Logs:**
   - CloudWatch > Log Groups > `/aws/lambda/nigredo-*`

4. **Testar Integração:**
   ```powershell
   .\scripts\test-nigredo-integration.ps1
   ```

---

**Última Atualização:** 2024
**Autor:** Kiro AI Assistant
