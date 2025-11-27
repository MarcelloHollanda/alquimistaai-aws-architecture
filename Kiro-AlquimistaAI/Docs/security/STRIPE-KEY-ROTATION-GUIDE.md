# Guia de Rotação de Chaves Stripe

## Visão Geral

Este documento descreve o processo completo de rotação das chaves de API do Stripe no sistema AlquimistaAI, garantindo zero downtime e conformidade com as melhores práticas de segurança.

---

## 📋 Quando Rotacionar

### Rotação Programada
- **Frequência recomendada**: A cada 90 dias
- **Próxima rotação**: Verificar data da última rotação + 90 dias

### Rotação Emergencial
Rotacionar imediatamente se:
- ✅ Chave foi exposta acidentalmente (commit, log, etc.)
- ✅ Suspeita de comprometimento de segurança
- ✅ Membro da equipe com acesso saiu da empresa
- ✅ Auditoria de segurança recomendou
- ✅ Stripe enviou alerta de segurança

---

## 🔑 Chaves a Rotacionar

O sistema AlquimistaAI usa as seguintes chaves Stripe:

### 1. Secret Key (API Key)
- **Ambiente Dev**: `/alquimista/dev/stripe/secret-key`
- **Ambiente Prod**: `/alquimista/prod/stripe/secret-key`
- **Formato**: `sk_test_...` (dev) ou `sk_live_...` (prod)
- **Uso**: Todas as chamadas à API Stripe

### 2. Webhook Secret
- **Ambiente Dev**: `/alquimista/dev/stripe/webhook-secret`
- **Ambiente Prod**: `/alquimista/prod/stripe/webhook-secret`
- **Formato**: `whsec_...`
- **Uso**: Validação de webhooks do Stripe

### 3. Publishable Key (Frontend)
- **Ambiente Dev**: Variável de ambiente `STRIPE_PUBLISHABLE_KEY`
- **Ambiente Prod**: Variável de ambiente `STRIPE_PUBLISHABLE_KEY`
- **Formato**: `pk_test_...` (dev) ou `pk_live_...` (prod)
- **Uso**: Stripe.js no frontend (se aplicável)

---

## 🔄 Processo de Rotação

### Fase 1: Preparação

#### 1.1. Verificar Estado Atual

```powershell
# Verificar secrets existentes no AWS Secrets Manager
aws secretsmanager list-secrets \
  --region us-east-1 \
  --query "SecretList[?contains(Name, 'stripe')].Name" \
  --output table

# Verificar última rotação
aws secretsmanager describe-secret \
  --secret-id /alquimista/prod/stripe/secret-key \
  --region us-east-1 \
  --query "LastRotatedDate"
```

#### 1.2. Notificar Equipe

- [ ] Informar equipe sobre janela de manutenção
- [ ] Agendar horário de baixo tráfego (se prod)
- [ ] Preparar rollback plan

#### 1.3. Backup de Configuração Atual

```powershell
# Backup da chave atual (para rollback se necessário)
aws secretsmanager get-secret-value \
  --secret-id /alquimista/prod/stripe/secret-key \
  --region us-east-1 \
  --query "SecretString" \
  --output text > stripe-key-backup-$(Get-Date -Format "yyyy-MM-dd").txt

# IMPORTANTE: Armazenar backup em local seguro e deletar após rotação bem-sucedida
```

---

### Fase 2: Gerar Novas Chaves no Stripe

#### 2.1. Acessar Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/
2. Faça login com credenciais de administrador
3. Navegue para: **Developers** → **API keys**

#### 2.2. Criar Nova Secret Key

**Para Ambiente de Teste (Dev):**
1. Na seção "Standard keys"
2. Clique em "Create secret key" (ou "Reveal test key")
3. Copie a nova chave `sk_test_...`
4. **IMPORTANTE**: Salve temporariamente em local seguro

**Para Ambiente de Produção (Prod):**
1. Toggle para "Live mode" no canto superior direito
2. Na seção "Standard keys"
3. Clique em "Create secret key"
4. Copie a nova chave `sk_live_...`
5. **IMPORTANTE**: Salve temporariamente em local seguro

#### 2.3. Criar Novo Webhook Secret (se necessário)

1. Navegue para: **Developers** → **Webhooks**
2. Selecione o endpoint existente ou crie novo
3. Clique em "Signing secret" → "Roll secret"
4. Copie o novo webhook secret `whsec_...`
5. **IMPORTANTE**: Salve temporariamente em local seguro

---

### Fase 3: Atualizar AWS Secrets Manager

#### 3.1. Atualizar Secret Key

**Ambiente Dev:**
```powershell
aws secretsmanager update-secret \
  --secret-id /alquimista/dev/stripe/secret-key \
  --secret-string "sk_test_NOVA_CHAVE_AQUI" \
  --region us-east-1
```

**Ambiente Prod:**
```powershell
aws secretsmanager update-secret \
  --secret-id /alquimista/prod/stripe/secret-key \
  --secret-string "sk_live_NOVA_CHAVE_AQUI" \
  --region us-east-1
```

#### 3.2. Atualizar Webhook Secret

**Ambiente Dev:**
```powershell
aws secretsmanager update-secret \
  --secret-id /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_NOVO_SECRET_AQUI" \
  --region us-east-1
```

**Ambiente Prod:**
```powershell
aws secretsmanager update-secret \
  --secret-id /alquimista/prod/stripe/webhook-secret \
  --secret-string "whsec_NOVO_SECRET_AQUI" \
  --region us-east-1
```

#### 3.3. Verificar Atualização

```powershell
# Verificar que o secret foi atualizado
aws secretsmanager describe-secret \
  --secret-id /alquimista/prod/stripe/secret-key \
  --region us-east-1 \
  --query "LastChangedDate"
```

---

### Fase 4: Reiniciar Lambdas (Limpar Cache)

As Lambdas fazem cache dos secrets em memória. Para forçar a leitura dos novos valores:

#### 4.1. Identificar Lambdas que Usam Stripe

```powershell
# Listar Lambdas relacionadas a pagamentos
aws lambda list-functions \
  --region us-east-1 \
  --query "Functions[?contains(FunctionName, 'checkout') || contains(FunctionName, 'payment') || contains(FunctionName, 'webhook')].FunctionName" \
  --output table
```

#### 4.2. Forçar Reinicialização

**Opção 1: Atualizar variável de ambiente (força reinicialização)**
```powershell
# Adicionar/atualizar variável de ambiente dummy
aws lambda update-function-configuration \
  --function-name alquimista-create-checkout-session-prod \
  --environment "Variables={LAST_ROTATION=$(Get-Date -Format 'yyyy-MM-dd')}" \
  --region us-east-1

aws lambda update-function-configuration \
  --function-name alquimista-webhook-payment-prod \
  --environment "Variables={LAST_ROTATION=$(Get-Date -Format 'yyyy-MM-dd')}" \
  --region us-east-1
```

**Opção 2: Aguardar timeout natural (15 minutos)**
- Lambdas frias serão reiniciadas automaticamente
- Cache de secrets expira após inatividade

---

### Fase 5: Validação

#### 5.1. Testar Criação de Checkout Session

**Ambiente Dev:**
```powershell
# Fazer chamada de teste à API
curl -X POST https://api-dev.alquimista.ai/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DE_TESTE" \
  -d '{
    "tenantId": "test-tenant-id",
    "selectedAgents": ["agent-1"],
    "userEmail": "test@example.com"
  }'
```

**Resultado esperado**: Status 200 com `checkoutUrl` válida

#### 5.2. Testar Webhook

**Ambiente Dev:**
```powershell
# Usar Stripe CLI para enviar evento de teste
stripe trigger checkout.session.completed \
  --forward-to https://api-dev.alquimista.ai/api/billing/webhook
```

**Resultado esperado**: Status 200 e evento processado

#### 5.3. Verificar Logs

```powershell
# Verificar logs das Lambdas
aws logs tail /aws/lambda/alquimista-create-checkout-session-prod \
  --follow \
  --region us-east-1

aws logs tail /aws/lambda/alquimista-webhook-payment-prod \
  --follow \
  --region us-east-1
```

**Verificar**:
- ✅ Nenhum erro de autenticação Stripe
- ✅ Mensagem "Stripe client initialized successfully"
- ✅ Nenhum erro de webhook signature

#### 5.4. Teste de Ponta a Ponta (Prod)

**IMPORTANTE**: Fazer em horário de baixo tráfego

1. Criar checkout session real (valor mínimo)
2. Completar pagamento com cartão de teste
3. Verificar webhook recebido e processado
4. Verificar subscription criada no banco
5. Verificar customer criado no Stripe

---

### Fase 6: Revogar Chaves Antigas

**IMPORTANTE**: Só revogar após validação completa

#### 6.1. Aguardar Período de Segurança

- **Recomendado**: Aguardar 24-48 horas após rotação
- **Motivo**: Garantir que não há processos usando chave antiga

#### 6.2. Revogar no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/
2. Navegue para: **Developers** → **API keys**
3. Localize a chave antiga
4. Clique em "Delete" ou "Revoke"
5. Confirme a revogação

#### 6.3. Deletar Backup Local

```powershell
# Deletar arquivo de backup da chave antiga
Remove-Item stripe-key-backup-*.txt -Force
```

---

### Fase 7: Documentação

#### 7.1. Registrar Rotação

Atualizar arquivo de registro de rotações:

```powershell
# Criar/atualizar registro
@"
## Rotação de $(Get-Date -Format "yyyy-MM-dd")

- **Ambiente**: Prod
- **Chaves rotacionadas**: Secret Key, Webhook Secret
- **Motivo**: Rotação programada (90 dias)
- **Executado por**: [Nome]
- **Validação**: ✅ Completa
- **Rollback necessário**: Não
- **Observações**: Rotação sem incidentes

"@ | Add-Content -Path "docs/security/STRIPE-ROTATION-LOG.md"
```

#### 7.2. Atualizar Próxima Rotação

```powershell
# Calcular próxima rotação (90 dias)
$nextRotation = (Get-Date).AddDays(90).ToString("yyyy-MM-dd")
Write-Host "Próxima rotação programada: $nextRotation"
```

---

## 🚨 Rollback Plan

Se algo der errado durante a rotação:

### 1. Identificar Problema

```powershell
# Verificar logs de erro
aws logs filter-log-events \
  --log-group-name /aws/lambda/alquimista-create-checkout-session-prod \
  --filter-pattern "ERROR" \
  --start-time $(Get-Date).AddMinutes(-30).ToUniversalTime().ToString("o") \
  --region us-east-1
```

### 2. Restaurar Chave Antiga

```powershell
# Restaurar do backup
$oldKey = Get-Content stripe-key-backup-$(Get-Date -Format "yyyy-MM-dd").txt

aws secretsmanager update-secret \
  --secret-id /alquimista/prod/stripe/secret-key \
  --secret-string $oldKey \
  --region us-east-1
```

### 3. Reiniciar Lambdas

```powershell
# Forçar reinicialização com chave antiga
aws lambda update-function-configuration \
  --function-name alquimista-create-checkout-session-prod \
  --environment "Variables={ROLLBACK=$(Get-Date -Format 'yyyy-MM-dd-HHmmss')}" \
  --region us-east-1
```

### 4. Validar Rollback

```powershell
# Testar novamente
curl -X POST https://api.alquimista.ai/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"tenantId":"test","selectedAgents":["agent-1"],"userEmail":"test@example.com"}'
```

### 5. Investigar Causa

- Verificar logs completos
- Verificar se chave nova está correta
- Verificar permissões no Stripe
- Verificar configuração do webhook

---

## 📊 Checklist de Rotação

Use este checklist durante a rotação:

### Preparação
- [ ] Verificar estado atual dos secrets
- [ ] Notificar equipe
- [ ] Fazer backup da chave atual
- [ ] Agendar janela de manutenção (se prod)

### Geração de Novas Chaves
- [ ] Acessar Stripe Dashboard
- [ ] Gerar nova Secret Key
- [ ] Gerar novo Webhook Secret (se necessário)
- [ ] Salvar chaves temporariamente em local seguro

### Atualização no AWS
- [ ] Atualizar Secret Key no Secrets Manager
- [ ] Atualizar Webhook Secret no Secrets Manager
- [ ] Verificar atualização bem-sucedida

### Reinicialização
- [ ] Identificar Lambdas que usam Stripe
- [ ] Forçar reinicialização das Lambdas
- [ ] Aguardar propagação (5-10 minutos)

### Validação
- [ ] Testar criação de checkout session
- [ ] Testar processamento de webhook
- [ ] Verificar logs sem erros
- [ ] Teste de ponta a ponta (prod)

### Finalização
- [ ] Aguardar período de segurança (24-48h)
- [ ] Revogar chaves antigas no Stripe
- [ ] Deletar backup local
- [ ] Registrar rotação em log
- [ ] Calcular próxima rotação

---

## 🔐 Segurança

### Boas Práticas

✅ **Fazer**:
- Rotacionar a cada 90 dias
- Usar AWS Secrets Manager
- Fazer backup antes de rotacionar
- Validar completamente antes de revogar chave antiga
- Registrar todas as rotações
- Usar horário de baixo tráfego (prod)

❌ **Não Fazer**:
- Revogar chave antiga imediatamente
- Rotacionar sem backup
- Rotacionar sem validação
- Compartilhar chaves em chat/email
- Commitar chaves no Git
- Rotacionar em horário de pico (prod)

### Acesso às Chaves

**Quem pode rotacionar**:
- Administradores de sistema
- DevOps com acesso ao AWS Secrets Manager
- Membros autorizados da equipe de segurança

**Permissões necessárias**:
- AWS Secrets Manager: `secretsmanager:UpdateSecret`
- AWS Lambda: `lambda:UpdateFunctionConfiguration`
- Stripe Dashboard: Admin ou Developer role

---

## 📞 Contatos de Emergência

### Stripe Support
- **Email**: support@stripe.com
- **Dashboard**: https://dashboard.stripe.com/support
- **Docs**: https://stripe.com/docs

### AWS Support
- **Console**: https://console.aws.amazon.com/support/
- **Docs**: https://docs.aws.amazon.com/secretsmanager/

### Equipe Interna
- **DevOps**: [email/slack]
- **Segurança**: [email/slack]
- **On-call**: [telefone/pager]

---

## 📚 Referências

- [Stripe API Keys Best Practices](https://stripe.com/docs/keys#best-practices)
- [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/best-practices)
- [Auditoria de Segurança Stripe](./STRIPE-SECURITY-AUDIT-SUMMARY.md)
- [Remediação de Leak](./STRIPE-KEY-LEAK-REMEDIATION.md)

---

**Versão**: 1.0.0  
**Última Atualização**: 27/11/2024  
**Próxima Revisão**: 27/02/2025  
**Mantido por**: Equipe AlquimistaAI
