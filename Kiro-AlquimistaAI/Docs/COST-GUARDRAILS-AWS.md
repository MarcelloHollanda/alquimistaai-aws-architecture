# AlquimistaAI – Guardrails de Custo – AWS

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Custos](#arquitetura-de-custos)
3. [AWS Budgets](#aws-budgets)
4. [Cost Anomaly Detection](#cost-anomaly-detection)
5. [SNS e Notificações](#sns-e-notificações)
6. [Fluxo de Alertas](#fluxo-de-alertas)
7. [Guia Operacional](#guia-operacional)
8. [Troubleshooting](#troubleshooting)
9. [Checklist de Validação](#checklist-de-validação)

---

## Visão Geral

Os **Guardrails de Custo** do AlquimistaAI são controles automatizados que monitoram gastos na AWS, detectam anomalias e enviam alertas proativos para evitar surpresas na fatura mensal.

### Objetivos

- ✅ Monitorar gastos mensais contra orçamento definido
- ✅ Detectar anomalias de custo em tempo real
- ✅ Alertar equipe antes de estouros de orçamento
- ✅ Fornecer visibilidade sobre padrões de gasto

### Componentes Implementados

| Componente | Descrição | Status |
|------------|-----------|--------|
| **AWS Budgets** | Orçamento mensal com alertas em 80%, 100%, 120% | ✅ Ativo |
| **Cost Anomaly Detection** | Detecção de gastos anormais (threshold $50) | ✅ Ativo |
| **SNS Topic** | Canal de notificações por email | ✅ Ativo |

---

## Arquitetura de Custos

```
┌─────────────────────────────────────────────────────────────────┐
│                      Fontes de Dados                             │
├─────────────────────────────────────────────────────────────────┤
│  AWS Cost Explorer  │  AWS Budgets  │  Cost Anomaly Detection  │
└──────────┬──────────┴───────┬───────┴──────────┬────────────────┘
           │                  │                  │
           │                  ▼                  ▼
           │         ┌─────────────────────────────────┐
           │         │    AWS Budgets Service          │
           │         │  - Orçamento: $500/mês          │
           │         │  - Alertas: 80%, 100%, 120%     │
           │         └──────────┬──────────────────────┘
           │                    │
           ▼                    ▼
    ┌──────────────────────────────────────────┐
    │   Cost Anomaly Detection Service         │
    │   - Monitor: Dimensional (por serviço)   │
    │   - Threshold: $50 USD                   │
    │   - Frequência: Diária                   │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   SNS Topic          │
            │  cost-alerts         │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   Email Subscribers  │
            │  - Equipe Financeira │
            │  - Equipe Técnica    │
            └──────────────────────┘
```

---

## AWS Budgets

### O que é AWS Budgets?

AWS Budgets permite definir orçamentos personalizados e receber alertas quando os custos ou uso excedem (ou estão previstos para exceder) o valor orçado.

### Configuração Atual

**Nome do Budget:** `alquimista-monthly-budget-{env}`

**Tipo:** Cost Budget (orçamento de custo)

**Período:** Mensal (MONTHLY)

**Valor Orçado:** $500 USD (configurável)

### Thresholds e Alertas

#### 1. Alerta 80% - Aviso Antecipado ⚠️

**Tipo:** FORECASTED (previsão)

**Threshold:** 80% do orçamento

**Quando dispara:** Quando a AWS prevê que você atingirá 80% do orçamento até o fim do mês

**Ação esperada:**
- Revisar gastos atuais
- Identificar serviços com maior consumo
- Avaliar se o uso está dentro do esperado
- Considerar otimizações se necessário

**Exemplo de notificação:**
```
Assunto: [AVISO] Orçamento AlquimistaAI em 80%

Seu orçamento mensal está previsto para atingir 80% ($400 de $500).

Gasto atual: $320
Previsão fim do mês: $410

Principais serviços:
- Lambda: $150
- Aurora: $120
- API Gateway: $50
```

#### 2. Alerta 100% - Estouro do Orçamento 🚨

**Tipo:** ACTUAL (real)

**Threshold:** 100% do orçamento

**Quando dispara:** Quando o gasto real atinge 100% do orçamento

**Ação esperada:**
- **URGENTE:** Revisar todos os gastos imediatamente
- Identificar causa do estouro
- Avaliar se há recursos não utilizados
- Considerar desligar recursos não essenciais em dev
- Comunicar stakeholders

**Exemplo de notificação:**
```
Assunto: [CRÍTICO] Orçamento AlquimistaAI ESTOURADO

⚠️ SEU ORÇAMENTO MENSAL FOI ATINGIDO ⚠️

Gasto atual: $500 de $500 (100%)
Dias restantes no mês: 12

Ação imediata necessária!
```

#### 3. Alerta 120% - Anomalia Grave 🔥

**Tipo:** ACTUAL (real)

**Threshold:** 120% do orçamento

**Quando dispara:** Quando o gasto real ultrapassa 120% do orçamento

**Ação esperada:**
- **EMERGÊNCIA:** Investigação imediata
- Possível ataque ou configuração incorreta
- Revisar logs de CloudTrail
- Verificar GuardDuty para atividades suspeitas
- Considerar desligar recursos temporariamente
- Escalar para liderança técnica

**Exemplo de notificação:**
```
Assunto: [EMERGÊNCIA] Orçamento AlquimistaAI em 120%

🔥 ANOMALIA GRAVE DETECTADA 🔥

Gasto atual: $600 de $500 (120%)
Excesso: $100

AÇÃO IMEDIATA NECESSÁRIA!
Possível ataque ou configuração incorreta.
```

### Como Ajustar o Orçamento

#### Via CDK (Recomendado)

Editar `bin/app.ts`:

```typescript
const securityStack = new SecurityStack(app, `SecurityStack-${env}`, {
  env: awsEnv,
  securityAlertEmail: process.env.SECURITY_ALERT_EMAIL,
  costAlertEmail: process.env.COST_ALERT_EMAIL,
  monthlyBudgetAmount: 750, // Alterar aqui
});
```

Depois fazer deploy:

```powershell
cdk deploy SecurityStack-dev --context env=dev
```

#### Via Console AWS

1. Acessar [AWS Budgets Console](https://console.aws.amazon.com/billing/home#/budgets)
2. Localizar budget `alquimista-monthly-budget-{env}`
3. Clicar em "Edit"
4. Alterar "Budget amount"
5. Salvar

---

## Cost Anomaly Detection

### O que é Cost Anomaly Detection?

Serviço da AWS que usa machine learning para detectar gastos anormais automaticamente, comparando com padrões históricos.

### Configuração Atual

**Nome do Monitor:** `alquimista-cost-monitor-{env}`

**Tipo:** DIMENSIONAL (por dimensão)

**Dimensão:** SERVICE (por serviço AWS)

**Threshold:** $50 USD

**Frequência:** DAILY (diária)

### Como Funciona

1. **Aprendizado:** AWS analisa seus padrões de gasto históricos
2. **Detecção:** Identifica desvios significativos do padrão
3. **Avaliação:** Calcula impacto financeiro da anomalia
4. **Notificação:** Se impacto > $50, envia alerta via SNS

### Serviços Monitorados

O monitor dimensional captura anomalias em **todos os serviços AWS**, incluindo:

- AWS Lambda
- Amazon API Gateway
- Amazon Aurora
- Amazon S3
- Amazon CloudFront
- Amazon CloudWatch
- AWS Secrets Manager
- Amazon SNS
- Amazon EventBridge
- AWS CloudTrail
- Amazon GuardDuty

### Exemplos de Anomalias Detectadas

#### Exemplo 1: Aumento Súbito em Lambda

```
Anomalia Detectada: AWS Lambda

Gasto esperado: $50/dia
Gasto atual: $120/dia
Impacto: +$70

Possível causa:
- Aumento de tráfego inesperado
- Loop infinito em função
- Timeout muito alto
```

#### Exemplo 2: Transferência de Dados S3

```
Anomalia Detectada: Amazon S3

Gasto esperado: $10/dia
Gasto atual: $85/dia
Impacto: +$75

Possível causa:
- Download massivo de arquivos
- Replicação não planejada
- Ataque de exfiltração de dados
```

### Como Ajustar o Threshold

#### Via CDK

Editar `lib/security-stack.ts`:

```typescript
const costAnomalySubscription = new ce.CfnAnomalySubscription(this, 'CostAnomalySubscription', {
  subscriptionName: `alquimista-cost-anomaly-alerts-${env}`,
  threshold: 100, // Alterar de 50 para 100
  frequency: 'DAILY',
  // ...
});
```

#### Via Console AWS

1. Acessar [Cost Anomaly Detection Console](https://console.aws.amazon.com/cost-management/home#/anomaly-detection)
2. Clicar em "Subscriptions"
3. Selecionar `alquimista-cost-anomaly-alerts-{env}`
4. Editar "Alert threshold"
5. Salvar

---

## SNS e Notificações

### SNS Topic de Custo

**Nome:** `alquimista-cost-alerts-{env}`

**ARN:** Exportado como `{env}-CostAlertTopicArn`

**Protocolo:** Email

### Como Adicionar Assinantes

#### Via Variável de Ambiente (Deploy)

Definir no ambiente antes do deploy:

```powershell
$env:COST_ALERT_EMAIL = "financeiro@alquimista.ai"
cdk deploy SecurityStack-dev --context env=dev
```

#### Via Console AWS

1. Acessar [SNS Console](https://console.aws.amazon.com/sns/v3/home)
2. Clicar em "Topics"
3. Localizar `alquimista-cost-alerts-{env}`
4. Clicar em "Create subscription"
5. Protocol: Email
6. Endpoint: email@exemplo.com
7. Clicar em "Create subscription"
8. **Importante:** Confirmar assinatura no email recebido

### Como Remover Assinantes

1. Acessar SNS Console
2. Localizar topic
3. Clicar em "Subscriptions"
4. Selecionar assinatura
5. Clicar em "Delete"

### Como Testar Envio

#### Via AWS CLI

```powershell
aws sns publish `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev" `
  --subject "Teste de Alerta de Custo" `
  --message "Este é um teste do sistema de alertas de custo."
```

#### Via Console

1. Acessar SNS Console
2. Localizar topic
3. Clicar em "Publish message"
4. Preencher subject e message
5. Clicar em "Publish message"

---

## Fluxo de Alertas

### Fluxo 1: Alerta de Budget

```
┌─────────────────────────────────────────────────────────────┐
│  1. AWS Budgets monitora gastos continuamente               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Threshold atingido (80%, 100% ou 120%)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. AWS Budgets publica notificação no SNS Topic            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SNS envia email para todos os assinantes                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Equipe recebe email e toma ação                         │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo 2: Alerta de Anomalia

```
┌─────────────────────────────────────────────────────────────┐
│  1. Cost Anomaly Detection analisa gastos diariamente       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Anomalia detectada com impacto > $50                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. AWS Cost Anomaly publica no SNS Topic                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SNS envia email com detalhes da anomalia                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Equipe investiga e mitiga                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Guia Operacional

### O que fazer ao receber Alerta de 80%

**Prioridade:** Média ⚠️

**Tempo de resposta:** 24 horas

**Ações:**

1. **Revisar Dashboard de Custos**
   ```powershell
   # Abrir Cost Explorer
   Start-Process "https://console.aws.amazon.com/cost-management/home#/cost-explorer"
   ```

2. **Identificar Principais Serviços**
   - Ordenar por custo
   - Comparar com mês anterior
   - Identificar crescimentos anormais

3. **Avaliar Uso**
   - Tráfego aumentou conforme esperado?
   - Novos recursos foram criados?
   - Há recursos ociosos?

4. **Otimizações Rápidas**
   - Desligar ambientes de dev não utilizados
   - Reduzir retenção de logs se possível
   - Revisar configurações de auto-scaling

5. **Documentar**
   - Registrar causa do aumento
   - Atualizar previsão de gastos
   - Comunicar equipe se necessário

### O que fazer ao receber Alerta de 100%

**Prioridade:** Alta 🚨

**Tempo de resposta:** 4 horas

**Ações:**

1. **Investigação Imediata**
   ```powershell
   # Ver gastos por serviço
   aws ce get-cost-and-usage `
     --time-period Start=2024-01-01,End=2024-01-31 `
     --granularity DAILY `
     --metrics BlendedCost `
     --group-by Type=DIMENSION,Key=SERVICE
   ```

2. **Identificar Causa Raiz**
   - Qual serviço está consumindo mais?
   - Houve mudança recente?
   - Há recursos não planejados?

3. **Mitigação**
   - Desligar recursos não essenciais em dev
   - Reduzir capacidade de Aurora se possível
   - Pausar jobs não críticos

4. **Comunicação**
   - Notificar liderança técnica
   - Notificar equipe financeira
   - Explicar causa e ações tomadas

5. **Plano de Ação**
   - Definir próximos passos
   - Estabelecer novo orçamento se necessário
   - Agendar revisão pós-incidente

### O que fazer ao receber Alerta de 120%

**Prioridade:** Crítica 🔥

**Tempo de resposta:** Imediato

**Ações:**

1. **Alerta de Emergência**
   - Notificar TODOS os stakeholders
   - Escalar para liderança imediatamente

2. **Investigação de Segurança**
   ```powershell
   # Verificar GuardDuty
   aws guardduty list-findings --detector-id <detector-id>
   
   # Verificar CloudTrail
   aws cloudtrail lookup-events --max-results 50
   ```

3. **Ações Drásticas**
   - Considerar desligar recursos temporariamente
   - Bloquear tráfego suspeito
   - Revogar credenciais comprometidas

4. **Análise Forense**
   - Revisar logs de CloudTrail
   - Identificar atividades anormais
   - Documentar timeline de eventos

5. **Recuperação**
   - Restaurar operação normal
   - Implementar controles adicionais
   - Conduzir post-mortem

### O que fazer ao receber Alerta de Anomalia

**Prioridade:** Média-Alta ⚠️

**Tempo de resposta:** 12 horas

**Ações:**

1. **Revisar Detalhes da Anomalia**
   - Qual serviço?
   - Qual o impacto ($)?
   - Quando começou?

2. **Correlacionar com Eventos**
   - Houve deploy recente?
   - Houve mudança de configuração?
   - Houve aumento de tráfego?

3. **Investigar Causa**
   ```powershell
   # Ver métricas do serviço afetado
   aws cloudwatch get-metric-statistics `
     --namespace AWS/Lambda `
     --metric-name Invocations `
     --start-time 2024-01-01T00:00:00Z `
     --end-time 2024-01-31T23:59:59Z `
     --period 3600 `
     --statistics Sum
   ```

4. **Mitigar se Necessário**
   - Ajustar configurações
   - Otimizar código
   - Reduzir uso

5. **Documentar**
   - Registrar causa
   - Registrar ação tomada
   - Atualizar runbooks se necessário

---

## Troubleshooting

### Problema: Não estou recebendo alertas

**Possíveis causas:**

1. **Assinatura SNS não confirmada**
   - Verificar email de confirmação
   - Reenviar confirmação se necessário

2. **Email na lista de spam**
   - Verificar pasta de spam
   - Adicionar remetente à lista de confiáveis

3. **Assinatura não configurada**
   ```powershell
   # Listar assinaturas do topic
   aws sns list-subscriptions-by-topic `
     --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev"
   ```

**Solução:**

```powershell
# Adicionar nova assinatura
aws sns subscribe `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev" `
  --protocol email `
  --notification-endpoint "seu-email@exemplo.com"
```

### Problema: Alertas de Budget não disparam

**Possíveis causas:**

1. **Budget não configurado corretamente**
2. **Threshold não atingido**
3. **Permissões SNS incorretas**

**Diagnóstico:**

```powershell
# Listar budgets
aws budgets describe-budgets --account-id ACCOUNT_ID

# Ver detalhes do budget
aws budgets describe-budget `
  --account-id ACCOUNT_ID `
  --budget-name "alquimista-monthly-budget-dev"
```

**Solução:**

Verificar configuração no console AWS Budgets e garantir que:
- Budget está ativo
- Thresholds estão configurados
- SNS Topic está correto

### Problema: Cost Anomaly Detection não detecta anomalias

**Possíveis causas:**

1. **Período de aprendizado insuficiente** (mínimo 10 dias)
2. **Threshold muito alto**
3. **Anomalias abaixo do threshold**

**Diagnóstico:**

```powershell
# Ver anomalias detectadas
aws ce get-anomalies `
  --date-interval Start=2024-01-01,End=2024-01-31 `
  --max-results 10
```

**Solução:**

- Aguardar período de aprendizado
- Reduzir threshold se necessário
- Verificar se há gastos suficientes para detecção

### Problema: Muitos alertas (fadiga de alertas)

**Possíveis causas:**

1. **Threshold muito baixo**
2. **Orçamento muito apertado**
3. **Variação natural de uso**

**Solução:**

1. **Ajustar thresholds**
   - Aumentar threshold de anomalia de $50 para $100
   - Ajustar orçamento mensal

2. **Filtrar alertas**
   - Configurar filtros no SNS
   - Usar Lambda para processar alertas

3. **Revisar padrões de uso**
   - Entender variações normais
   - Ajustar expectativas

---

## Checklist de Validação

### Validação Inicial (Pós-Deploy)

- [ ] SecurityStack deployado com sucesso
- [ ] SNS Topic `alquimista-cost-alerts-{env}` criado
- [ ] Budget `alquimista-monthly-budget-{env}` criado
- [ ] Cost Anomaly Monitor criado
- [ ] Cost Anomaly Subscription criada

### Validação de Configuração

- [ ] Orçamento mensal configurado corretamente
- [ ] Thresholds 80%, 100%, 120% configurados
- [ ] Threshold de anomalia ($50) configurado
- [ ] Email de custo adicionado ao SNS Topic
- [ ] Assinatura de email confirmada

### Validação de Funcionamento

- [ ] Teste de envio SNS bem-sucedido
- [ ] Email de teste recebido
- [ ] Budget aparece no console AWS Budgets
- [ ] Cost Anomaly Monitor aparece no console
- [ ] Outputs do CDK exportados corretamente

### Comandos de Validação

```powershell
# 1. Verificar stack deployado
cdk list

# 2. Ver outputs da stack
aws cloudformation describe-stacks `
  --stack-name SecurityStack-dev `
  --query 'Stacks[0].Outputs'

# 3. Listar budgets
aws budgets describe-budgets --account-id ACCOUNT_ID

# 4. Listar anomaly monitors
aws ce get-anomaly-monitors

# 5. Listar assinaturas SNS
aws sns list-subscriptions

# 6. Testar envio SNS
aws sns publish `
  --topic-arn "arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev" `
  --subject "Teste" `
  --message "Teste de alerta de custo"
```

---

## Recursos Adicionais

### Links Úteis

- [AWS Budgets Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer)
- [AWS Budgets Console](https://console.aws.amazon.com/billing/home#/budgets)
- [Cost Anomaly Detection Console](https://console.aws.amazon.com/cost-management/home#/anomaly-detection)

### Comandos Úteis

```powershell
# Ver gastos do mês atual
aws ce get-cost-and-usage `
  --time-period Start=2024-01-01,End=2024-01-31 `
  --granularity MONTHLY `
  --metrics BlendedCost

# Ver gastos por serviço
aws ce get-cost-and-usage `
  --time-period Start=2024-01-01,End=2024-01-31 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --group-by Type=DIMENSION,Key=SERVICE

# Ver previsão de gastos
aws ce get-cost-forecast `
  --time-period Start=2024-01-15,End=2024-01-31 `
  --metric BLENDED_COST `
  --granularity MONTHLY
```

---

## Conclusão

Os Guardrails de Custo do AlquimistaAI fornecem visibilidade e controle sobre gastos na AWS, permitindo que a equipe:

- ✅ Monitore gastos em tempo real
- ✅ Receba alertas proativos
- ✅ Detecte anomalias automaticamente
- ✅ Tome ações antes de surpresas na fatura

**Próximos Passos:**

1. Configurar emails de alerta
2. Ajustar orçamento conforme necessário
3. Monitorar alertas nas primeiras semanas
4. Refinar thresholds baseado em experiência

---

**Documentação criada em:** 2024-01-15  
**Última atualização:** 2024-01-15  
**Versão:** 1.0  
**Autor:** Kiro AI


---

## Como Configurar Emails para Alertas de Custo (SNS)

### Visão Geral

Os alertas de custo (AWS Budgets e Cost Anomaly Detection) são enviados via Amazon SNS para o tópico `alquimista-cost-alerts-{env}`. Para receber esses alertas por email, você precisa criar uma **subscription** (assinatura) no tópico SNS.

### Pré-requisitos

- ✅ SecurityStack deployado com sucesso
- ✅ Tópico SNS `alquimista-cost-alerts-{env}` criado
- ✅ Acesso ao Console AWS ou AWS CLI
- ✅ Email válido para receber alertas

### Método 1: Via Console AWS (Recomendado para Iniciantes)

#### Passo 1: Acessar o Serviço SNS

1. Faça login no [Console AWS](https://console.aws.amazon.com/)
2. Certifique-se de estar na região **us-east-1** (canto superior direito)
3. Na barra de busca, digite **SNS** e clique em **Simple Notification Service**

#### Passo 2: Localizar o Tópico de Custo

1. No menu lateral esquerdo, clique em **Topics** (Tópicos)
2. Na lista de tópicos, localize: `alquimista-cost-alerts-dev` (ou `prod`)
3. Clique no nome do tópico para abrir os detalhes

#### Passo 3: Criar Subscription (Assinatura)

1. Na página de detalhes do tópico, clique no botão **Create subscription**
2. Preencha os campos:
   - **Protocol**: Selecione **Email**
   - **Endpoint**: Digite o email que receberá os alertas (exemplo: `financeiro@alquimista.ai`)
3. Clique em **Create subscription**

#### Passo 4: Confirmar o Email

1. Você receberá um email com o assunto: **"AWS Notification - Subscription Confirmation"**
2. **IMPORTANTE**: Verifique também a pasta de spam/lixo eletrônico
3. Abra o email e clique no link **"Confirm subscription"**
4. Uma página web abrirá confirmando: **"Subscription confirmed!"**

#### Passo 5: Verificar Confirmação

1. Volte ao Console AWS → SNS → Topics → Seu tópico
2. Clique na aba **Subscriptions**
3. Verifique que o status da sua assinatura mudou de **"PendingConfirmation"** para **"Confirmed"**

### Método 2: Via AWS CLI (Para Usuários Avançados)

#### Passo 1: Obter o ARN do Tópico

```powershell
# Listar tópicos SNS
aws sns list-topics --region us-east-1

# Ou obter diretamente do output do CloudFormation
aws cloudformation describe-stacks `
  --stack-name SecurityStack-dev `
  --query "Stacks[0].Outputs[?OutputKey=='CostAlertTopicArn'].OutputValue" `
  --output text `
  --region us-east-1
```

#### Passo 2: Criar Subscription

```powershell
# Substituir <TOPIC_ARN> pelo ARN obtido no passo anterior
aws sns subscribe `
  --topic-arn "<TOPIC_ARN>" `
  --protocol email `
  --notification-endpoint "financeiro@alquimista.ai" `
  --region us-east-1
```

**Exemplo de resposta:**
```json
{
    "SubscriptionArn": "pending confirmation"
}
```

#### Passo 3: Confirmar Email

1. Verifique sua caixa de entrada (e spam)
2. Clique no link de confirmação no email recebido

#### Passo 4: Verificar Confirmação

```powershell
# Listar subscriptions do tópico
aws sns list-subscriptions-by-topic `
  --topic-arn "<TOPIC_ARN>" `
  --region us-east-1
```

Procure por sua assinatura e verifique que `SubscriptionArn` não é mais "PendingConfirmation".

### Método 3: Via CDK (Para Configuração Permanente)

Se você quiser que o email seja configurado automaticamente no deploy, edite o código CDK:

#### Editar bin/app.ts

```typescript
// No arquivo bin/app.ts
const securityStack = new SecurityStack(app, `SecurityStack-${envName}`, {
  env,
  costAlertEmail: 'financeiro@alquimista.ai', // Adicione esta linha
});
```

#### Fazer Deploy

```powershell
cdk deploy SecurityStack-dev --context env=dev
```

**Nota**: Você ainda precisará confirmar o email manualmente na primeira vez.

### Adicionar Múltiplos Emails

Você pode adicionar quantos emails quiser repetindo o processo de criação de subscription:

**Exemplo de emails recomendados:**

- `financeiro@alquimista.ai` - Equipe financeira
- `cfo@alquimista.ai` - CFO ou controller
- `devops@alquimista.ai` - Equipe DevOps (para otimizações)
- `cto@alquimista.ai` - CTO (visibilidade de custos)

**Via Console**: Repita os passos 3-5 para cada email

**Via CLI**:
```powershell
# Adicionar múltiplos emails
aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "financeiro@alquimista.ai"
aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "cfo@alquimista.ai"
aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "devops@alquimista.ai"
```

### Remover um Email

#### Via Console AWS

1. Acesse SNS → Topics → Seu tópico
2. Clique na aba **Subscriptions**
3. Selecione a assinatura que deseja remover (checkbox)
4. Clique em **Delete**
5. Confirme a exclusão

#### Via AWS CLI

```powershell
# Listar subscriptions para obter o ARN
aws sns list-subscriptions-by-topic --topic-arn "<TOPIC_ARN>"

# Deletar subscription específica
aws sns unsubscribe --subscription-arn "<SUBSCRIPTION_ARN>"
```

### Testar Envio de Alerta

Após configurar o email, teste se está funcionando:

#### Via Console AWS

1. Acesse SNS → Topics → Seu tópico
2. Clique em **Publish message**
3. Preencha:
   - **Subject**: `💰 Teste de Alerta de Custo`
   - **Message**: `Este é um teste do sistema de alertas de custo. Se você recebeu este email, a configuração está correta.`
4. Clique em **Publish message**
5. Verifique sua caixa de entrada

#### Via AWS CLI

```powershell
aws sns publish `
  --topic-arn "<TOPIC_ARN>" `
  --subject "💰 Teste de Alerta de Custo" `
  --message "Este é um teste do sistema de alertas de custo. Se você recebeu este email, a configuração está correta." `
  --region us-east-1
```

### Troubleshooting

#### Problema: Não recebi o email de confirmação

**Possíveis causas:**
- Email foi para spam/lixo eletrônico
- Email digitado incorretamente
- Filtros de email bloquearam

**Solução:**
1. Verifique pasta de spam
2. Adicione `no-reply@sns.amazonaws.com` à lista de remetentes confiáveis
3. Tente reenviar a confirmação:
   ```powershell
   # Deletar subscription pendente
   aws sns unsubscribe --subscription-arn "<SUBSCRIPTION_ARN>"
   
   # Criar novamente
   aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "seu-email@exemplo.com"
   ```

#### Problema: Confirmei mas não recebo alertas

**Possíveis causas:**
- Budget ainda não atingiu threshold
- Anomalias detectadas estão abaixo de $50
- Configuração do Budget/Anomaly Detection incorreta

**Solução:**
1. Teste o envio manualmente (ver seção "Testar Envio de Alerta")
2. Verifique configuração do Budget:
   ```powershell
   aws budgets describe-budgets --account-id <ACCOUNT_ID>
   ```
3. Verifique Cost Anomaly Detection:
   ```powershell
   aws ce get-anomaly-monitors
   ```

#### Problema: Recebo muitos alertas (fadiga de alertas)

**Solução:**
- Ajuste o orçamento mensal para valor mais realista
- Aumente o threshold de anomalia de $50 para $100 ou mais
- Configure filtros de email para categorizar alertas

### Checklist de Configuração

- [ ] Identifiquei o tópico SNS de custo no Console AWS
- [ ] Criei subscription com email da equipe financeira
- [ ] Confirmei o email clicando no link recebido
- [ ] Verifiquei que o status mudou para "Confirmed"
- [ ] Testei o envio de mensagem e recebi o email
- [ ] Adicionei emails de outros stakeholders (CFO, DevOps, CTO)
- [ ] Documentei quem recebe os alertas de custo
- [ ] Configurei filtros de email para destacar alertas críticos

### Boas Práticas

- ✅ **Adicione equipe financeira**: Eles precisam saber de estouros de orçamento
- ✅ **Adicione equipe técnica**: DevOps pode otimizar recursos rapidamente
- ✅ **Use emails de equipe**: Evite emails pessoais que podem mudar
- ✅ **Teste regularmente**: Envie mensagens de teste mensalmente
- ✅ **Documente os assinantes**: Mantenha lista atualizada
- ✅ **Revise periodicamente**: Remova emails de pessoas que saíram da equipe
- ✅ **Configure regras de email**: Destaque alertas de 100% e 120% como urgentes
- ❌ **Não adicione emails desnecessários**: Evite fadiga de alertas
- ❌ **Não ignore alertas**: Alertas de custo podem indicar problemas sérios

### Diferença entre Alertas de Segurança e Custo

| Aspecto | Alertas de Segurança | Alertas de Custo |
|---------|---------------------|------------------|
| **Tópico SNS** | `alquimista-security-alerts-{env}` | `alquimista-cost-alerts-{env}` |
| **Quem deve receber** | Equipe de segurança, DevOps | Equipe financeira, CFO, DevOps |
| **Urgência típica** | Alta (ameaças) | Média-Alta (orçamento) |
| **Frequência** | Variável (conforme ameaças) | Mensal (budgets) + Diária (anomalias) |
| **Ação esperada** | Investigar e mitigar ameaça | Otimizar recursos ou ajustar orçamento |

### Exemplo de Email de Alerta de Custo

**Alerta de Budget (80%):**
```
Assunto: [AVISO] Orçamento AlquimistaAI em 80%

Seu orçamento mensal está previsto para atingir 80% ($400 de $500).

Gasto atual: $320
Previsão fim do mês: $410

Principais serviços:
- Lambda: $150
- Aurora: $120
- API Gateway: $50

Ação recomendada: Revisar gastos e considerar otimizações.
```

**Alerta de Anomalia:**
```
Assunto: [ANOMALIA] Gasto Anormal Detectado - AWS Lambda

Uma anomalia de custo foi detectada:

Serviço: AWS Lambda
Gasto esperado: $50/dia
Gasto atual: $120/dia
Impacto: +$70

Possível causa:
- Aumento de tráfego inesperado
- Loop infinito em função
- Timeout muito alto

Ação recomendada: Investigar imediatamente.
```

