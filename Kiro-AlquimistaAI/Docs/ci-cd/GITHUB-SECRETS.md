# Configuração de Secrets - GitHub Actions

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Secrets Necessários](#secrets-necessários)
3. [Como Configurar](#como-configurar)
4. [Como Rotacionar](#como-rotacionar)
5. [Boas Práticas](#boas-práticas)
6. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Secrets do GitHub são variáveis criptografadas que armazenam informações sensíveis necessárias para o pipeline CI/CD. O AlquimistaAI usa secrets para:

- ✅ Autenticação AWS via OIDC
- ✅ Configuração de ambientes
- ✅ Notificações de alertas

### Por Que Usar Secrets?

- 🔒 **Segurança**: Valores criptografados e não visíveis em logs
- 🔒 **Isolamento**: Separação entre código e configuração
- 🔒 **Controle de Acesso**: Apenas workflows autorizados podem acessar
- 🔒 **Auditoria**: Histórico de mudanças rastreável

---

## Secrets Necessários

### 1. AWS_ACCOUNT_ID (Obrigatório)

**Descrição**: ID da conta AWS onde os recursos serão deployados

**Formato**: Número de 12 dígitos

**Exemplo**: `123456789012`

**Como Obter**:
```powershell
aws sts get-caller-identity --query Account --output text
```

**Uso no Workflow**:
```yaml
role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsAlquimistaAICICD
```

---

### 2. SECURITY_ALERT_EMAIL (Opcional)

**Descrição**: Email para receber alertas de segurança (GuardDuty, CloudTrail)

**Formato**: Email válido

**Exemplo**: `security@alquimista.ai`

**Uso**: Configurado como variável de ambiente durante deploy do SecurityStack

**Alternativa**: Configurar assinatura SNS manualmente via console AWS

---

### 3. COST_ALERT_EMAIL (Opcional)

**Descrição**: Email para receber alertas de custo (Budget, Cost Anomaly)

**Formato**: Email válido

**Exemplo**: `finance@alquimista.ai`

**Uso**: Configurado como variável de ambiente durante deploy do SecurityStack

**Alternativa**: Configurar assinatura SNS manualmente via console AWS

---

### 4. OPS_ALERT_EMAIL (Opcional)

**Descrição**: Email para receber alertas operacionais (CloudWatch Alarms)

**Formato**: Email válido

**Exemplo**: `ops@alquimista.ai`

**Uso**: Configurado como variável de ambiente durante deploy do SecurityStack

**Alternativa**: Configurar assinatura SNS manualmente via console AWS

---

### 5. MONTHLY_BUDGET_AMOUNT (Opcional)

**Descrição**: Valor do orçamento mensal em USD

**Formato**: Número inteiro

**Exemplo**: `500`

**Default**: `500` (se não configurado)

**Uso**: Configurado como variável de ambiente durante deploy do SecurityStack

---

## Como Configurar

### Passo 1: Acessar Configurações do Repositório

1. Acessar: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture
2. Clicar em **Settings** (aba superior)
3. No menu lateral esquerdo, clicar em **Secrets and variables** → **Actions**

### Passo 2: Adicionar Secret

1. Clicar no botão **New repository secret**
2. Preencher:
   - **Name**: Nome do secret (ex: `AWS_ACCOUNT_ID`)
   - **Secret**: Valor do secret (ex: `123456789012`)
3. Clicar em **Add secret**

### Passo 3: Verificar Secret

1. Secret aparecerá na lista com nome visível
2. Valor ficará oculto (mostrado como `***`)
3. Não é possível ver o valor depois de criado (apenas atualizar)

### Passo 4: Testar no Workflow

1. Fazer push para main ou acionar workflow manualmente
2. Verificar logs do workflow
3. Secret deve ser usado corretamente (valor oculto nos logs)

---

## Configuração Completa

### Via Interface Web

**AWS_ACCOUNT_ID**:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `AWS_ACCOUNT_ID`
4. Secret: `123456789012` (seu account ID)
5. Add secret

**SECURITY_ALERT_EMAIL**:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `SECURITY_ALERT_EMAIL`
4. Secret: `security@alquimista.ai`
5. Add secret

**COST_ALERT_EMAIL**:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `COST_ALERT_EMAIL`
4. Secret: `finance@alquimista.ai`
5. Add secret

**OPS_ALERT_EMAIL**:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `OPS_ALERT_EMAIL`
4. Secret: `ops@alquimista.ai`
5. Add secret

**MONTHLY_BUDGET_AMOUNT**:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `MONTHLY_BUDGET_AMOUNT`
4. Secret: `500`
5. Add secret

---

### Via GitHub CLI

```powershell
# Instalar GitHub CLI (se necessário)
# https://cli.github.com/

# Autenticar
gh auth login

# Adicionar secrets
gh secret set AWS_ACCOUNT_ID --body "123456789012"
gh secret set SECURITY_ALERT_EMAIL --body "security@alquimista.ai"
gh secret set COST_ALERT_EMAIL --body "finance@alquimista.ai"
gh secret set OPS_ALERT_EMAIL --body "ops@alquimista.ai"
gh secret set MONTHLY_BUDGET_AMOUNT --body "500"

# Listar secrets
gh secret list

# Ver detalhes de um secret (não mostra valor)
gh secret view AWS_ACCOUNT_ID
```

---

## Como Rotacionar

### Quando Rotacionar?

- ✅ **Periodicamente**: A cada 90 dias (boas práticas)
- ✅ **Suspeita de Comprometimento**: Imediatamente
- ✅ **Mudança de Equipe**: Quando membros saem
- ✅ **Mudança de Conta AWS**: Quando migrar de conta

### Passo a Passo

#### 1. Rotacionar AWS_ACCOUNT_ID

**Quando**: Apenas se mudar de conta AWS

```powershell
# 1. Obter novo account ID
aws sts get-caller-identity --query Account --output text

# 2. Atualizar secret no GitHub
# Settings → Secrets → AWS_ACCOUNT_ID → Update

# 3. Testar workflow
```

#### 2. Rotacionar Emails de Alerta

**Quando**: Mudança de responsável ou email

```powershell
# 1. Atualizar secret no GitHub
# Settings → Secrets → SECURITY_ALERT_EMAIL → Update

# 2. Deploy SecurityStack novamente
cdk deploy SecurityStack --context env=dev

# 3. Confirmar novo email (se necessário)
```

#### 3. Rotacionar Orçamento

**Quando**: Ajuste de orçamento necessário

```powershell
# 1. Atualizar secret no GitHub
# Settings → Secrets → MONTHLY_BUDGET_AMOUNT → Update

# 2. Deploy SecurityStack novamente
cdk deploy SecurityStack --context env=dev
```

---

## Boas Práticas

### Segurança

1. ✅ **Nunca Commitar Secrets**: Não adicionar secrets no código
2. ✅ **Usar Secrets do GitHub**: Sempre usar secrets para valores sensíveis
3. ✅ **Princípio do Menor Privilégio**: Dar apenas permissões necessárias
4. ✅ **Rotacionar Periodicamente**: Rotacionar secrets a cada 90 dias
5. ✅ **Auditar Acesso**: Revisar quem tem acesso aos secrets

### Organização

1. ✅ **Nomenclatura Clara**: Usar nomes descritivos (ex: `AWS_ACCOUNT_ID`)
2. ✅ **Documentar**: Documentar propósito de cada secret
3. ✅ **Agrupar**: Agrupar secrets relacionados (ex: emails de alerta)
4. ✅ **Validar**: Testar secrets após configuração

### Manutenção

1. ✅ **Revisar Periodicamente**: Verificar se secrets ainda são necessários
2. ✅ **Remover Não Usados**: Deletar secrets obsoletos
3. ✅ **Atualizar Documentação**: Manter documentação atualizada
4. ✅ **Monitorar Uso**: Verificar logs de uso de secrets

---

## Troubleshooting

### Problema: Secret não está sendo usado no workflow

**Sintomas**:
```
Error: secrets.AWS_ACCOUNT_ID is not set
```

**Causas Comuns**:
- Secret não configurado
- Nome do secret incorreto
- Workflow não tem permissão

**Solução**:
```powershell
# 1. Verificar se secret existe
gh secret list

# 2. Verificar nome do secret no workflow
# .github/workflows/ci-cd-alquimistaai.yml
# Deve ter: ${{ secrets.AWS_ACCOUNT_ID }}

# 3. Adicionar secret se não existe
gh secret set AWS_ACCOUNT_ID --body "123456789012"

# 4. Testar workflow novamente
```

---

### Problema: Secret aparece nos logs

**Sintomas**:
- Valor do secret visível nos logs do workflow

**Causas Comuns**:
- Secret sendo impresso diretamente
- Comando que expõe secret

**Solução**:
```yaml
# ❌ ERRADO - Expõe secret
- name: Debug
  run: echo ${{ secrets.AWS_ACCOUNT_ID }}

# ✅ CORRETO - Não expõe secret
- name: Use Secret
  run: |
    # Secret usado internamente, não impresso
    aws sts get-caller-identity
  env:
    AWS_ACCOUNT_ID: ${{ secrets.AWS_ACCOUNT_ID }}
```

---

### Problema: Email de alerta não está funcionando

**Sintomas**:
- Não recebendo emails de alerta
- Assinatura SNS não criada

**Causas Comuns**:
- Secret não configurado
- Email não confirmado
- Deploy não executado após configurar secret

**Solução**:
```powershell
# 1. Verificar se secret existe
gh secret list | Select-String "ALERT_EMAIL"

# 2. Adicionar secret se não existe
gh secret set OPS_ALERT_EMAIL --body "ops@alquimista.ai"

# 3. Deploy SecurityStack novamente
cdk deploy SecurityStack --context env=dev

# 4. Confirmar email recebido
# Verificar caixa de entrada e spam

# 5. Verificar assinatura SNS
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --region us-east-1
```

---

### Problema: Não consigo ver o valor do secret

**Sintomas**:
- Secret mostra `***` na interface
- Não consigo copiar valor

**Causas Comuns**:
- Comportamento esperado do GitHub
- Segurança por design

**Solução**:
- **Não é possível ver o valor depois de criado**
- Se esqueceu o valor, precisa atualizar com novo valor
- Manter backup seguro dos valores (ex: 1Password, LastPass)

---

## Checklist de Configuração

### Configuração Inicial

- [ ] AWS_ACCOUNT_ID configurado
- [ ] OIDC configurado na AWS
- [ ] Role IAM criada
- [ ] Workflow testado com sucesso

### Configuração de Alertas (Opcional)

- [ ] SECURITY_ALERT_EMAIL configurado
- [ ] COST_ALERT_EMAIL configurado
- [ ] OPS_ALERT_EMAIL configurado
- [ ] SecurityStack deployado
- [ ] Emails confirmados

### Configuração de Orçamento (Opcional)

- [ ] MONTHLY_BUDGET_AMOUNT configurado
- [ ] SecurityStack deployado
- [ ] Budget visível no console AWS

---

## Recursos Adicionais

### Documentação Relacionada

- [OIDC-SETUP.md](./OIDC-SETUP.md) - Configuração OIDC GitHub-AWS
- [PIPELINE-OVERVIEW.md](./PIPELINE-OVERVIEW.md) - Overview do pipeline
- [GUARDRAILS-GUIDE.md](./GUARDRAILS-GUIDE.md) - Guia de guardrails

### Links Úteis

- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **GitHub CLI**: https://cli.github.com/
- **AWS IAM**: https://console.aws.amazon.com/iam/
- **AWS SNS**: https://console.aws.amazon.com/sns/

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI
