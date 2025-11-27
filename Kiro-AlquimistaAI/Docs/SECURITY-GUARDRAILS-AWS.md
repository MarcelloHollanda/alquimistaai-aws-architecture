# AlquimistaAI – Guardrails de Segurança – AWS

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

## Visão Geral

Este documento descreve os guardrails de segurança implementados para o projeto AlquimistaAI na AWS, incluindo auditoria, detecção de ameaças e sistema de alertas.

### O que são Guardrails de Segurança?

Guardrails são controles automatizados que monitoram, detectam e alertam sobre atividades suspeitas ou não conformes na infraestrutura AWS. Eles funcionam como "barreiras de proteção" que ajudam a prevenir e responder rapidamente a incidentes de segurança.

---

## Componentes Implementados

### 1. AWS CloudTrail

**O que é:** Serviço de auditoria que registra todas as chamadas de API feitas na conta AWS.

**Como está configurado:**
- **Trail Name:** `alquimista-audit-trail-{env}`
- **Região:** us-east-1
- **Bucket S3:** `alquimista-cloudtrail-logs-{account-id}-{env}`
- **Retenção:** 90 dias (via lifecycle policy do S3)
- **Criptografia:** SSE-S3 (Server-Side Encryption)
- **Validação de Logs:** Habilitada (garante integridade dos logs)
- **Multi-Region:** Não (apenas us-east-1 para reduzir custos)

**O que é auditado:**
- Todas as ações de gerenciamento (Management Events)
- Criação, modificação e exclusão de recursos
- Mudanças em políticas IAM
- Acesso a Secrets Manager
- Operações em Lambda, API Gateway, Aurora, etc.

**Onde encontrar os logs:**
- Console AWS → CloudTrail → Event history
- Bucket S3: `s3://alquimista-cloudtrail-logs-{account-id}-{env}/`

---

### 2. Amazon GuardDuty

**O que é:** Serviço de detecção de ameaças que monitora continuamente atividades maliciosas e comportamentos anômalos.

**Como está configurado:**
- **Detector:** Habilitado em us-east-1
- **Frequência de Publicação:** 15 minutos
- **S3 Protection:** Habilitado (monitora buckets S3)
- **Malware Protection:** Habilitado (para EC2, se houver)

**O que é monitorado:**
- Tentativas de acesso não autorizado
- Comunicação com IPs maliciosos conhecidos
- Atividades de mineração de criptomoedas
- Exfiltração de dados
- Comprometimento de credenciais IAM
- Atividades anômalas em buckets S3

**Níveis de Severidade:**
- **LOW (0.1 - 3.9):** Atividades suspeitas de baixo risco
- **MEDIUM (4.0 - 6.9):** Atividades suspeitas de risco moderado
- **HIGH (7.0 - 8.9):** Atividades maliciosas prováveis
- **CRITICAL (9.0 - 10.0):** Atividades maliciosas confirmadas

**Alertas configurados:**
- Apenas achados **HIGH** e **CRITICAL** disparam notificações SNS
- Achados LOW e MEDIUM ficam disponíveis no console para revisão

---

### 3. Sistema de Alertas (SNS)

**O que é:** Amazon Simple Notification Service - sistema de mensagens pub/sub para envio de alertas.

**Tópico SNS:**
- **Nome:** `alquimista-security-alerts-{env}`
- **Protocolo:** Email
- **Assinantes:** Configurável via variável de ambiente

**Fluxo de Alertas:**

```
GuardDuty detecta ameaça HIGH/CRITICAL
           ↓
EventBridge Rule captura o evento
           ↓
Mensagem formatada é publicada no SNS
           ↓
Email enviado para assinantes
```

**Formato da Mensagem:**
```
🚨 ALERTA DE SEGURANÇA - GuardDuty

Tipo: [Tipo do achado]
Severidade: [7.0 - 10.0]
Região: us-east-1
Conta: [Account ID]
Descrição: [Descrição detalhada do achado]
Recurso: [Tipo de recurso afetado]

Ação recomendada: Revisar o achado no console do GuardDuty.
```

---

## Detalhes Técnicos

### Stack CDK

**Nome:** `SecurityStack-{env}`

**Arquivo:** `lib/security-stack.ts`

**Recursos Criados:**

1. **S3 Bucket para CloudTrail**
   - Nome: `alquimista-cloudtrail-logs-{account-id}-{env}`
   - Versionamento: Habilitado
   - Criptografia: SSE-S3
   - Block Public Access: Habilitado
   - Lifecycle: Expiração após 90 dias

2. **CloudTrail Trail**
   - Nome: `alquimista-audit-trail-{env}`
   - Validação de arquivos: Habilitada
   - Eventos globais: Incluídos

3. **GuardDuty Detector**
   - ID exportado como output do stack
   - Frequência: 15 minutos

4. **SNS Topic**
   - Nome: `alquimista-security-alerts-{env}`
   - ARN exportado como output do stack

5. **EventBridge Rule**
   - Nome: `alquimista-guardduty-high-severity-{env}`
   - Filtra severidade >= 7.0
   - Target: SNS Topic

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Conta AWS                               │
│                                                               │
│  ┌──────────────┐                                            │
│  │  CloudTrail  │──────────> S3 Bucket                      │
│  │   (Audit)    │            (90 dias)                      │
│  └──────────────┘                                            │
│                                                               │
│  ┌──────────────┐                                            │
│  │  GuardDuty   │                                            │
│  │  (Detector)  │                                            │
│  └──────┬───────┘                                            │
│         │                                                     │
│         │ Achado HIGH/CRITICAL                               │
│         ▼                                                     │
│  ┌──────────────┐                                            │
│  │ EventBridge  │                                            │
│  │    Rule      │                                            │
│  └──────┬───────┘                                            │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────┐                                            │
│  │  SNS Topic   │──────────> Email                          │
│  │   (Alerts)   │            (Assinantes)                   │
│  └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Onboarding de Equipe

### Como Adicionar um Novo Email para Alertas

#### Via Console AWS:

1. Acesse o console AWS
2. Navegue para **SNS** → **Topics**
3. Selecione o tópico `alquimista-security-alerts-{env}`
4. Clique em **Create subscription**
5. Selecione **Protocol:** Email
6. Insira o **Endpoint:** email@exemplo.com
7. Clique em **Create subscription**
8. O destinatário receberá um email de confirmação
9. Clique no link de confirmação no email

#### Via AWS CLI:

```powershell
# Adicionar assinatura
aws sns subscribe `
  --topic-arn arn:aws:sns:us-east-1:{account-id}:alquimista-security-alerts-dev `
  --protocol email `
  --notification-endpoint email@exemplo.com

# Listar assinaturas
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:{account-id}:alquimista-security-alerts-dev
```

#### Via CDK (Recomendado):

Edite o arquivo `bin/app.ts` e adicione a variável de ambiente:

```typescript
// No arquivo bin/app.ts
const securityStack = new SecurityStack(app, `SecurityStack-${envName}`, {
  env,
  securityAlertEmail: 'security@alquimista.ai', // Altere aqui
});
```

Ou configure via variável de ambiente:

```powershell
$env:SECURITY_ALERT_EMAIL = "security@alquimista.ai"
cdk deploy SecurityStack-dev
```

### Quem Deve Receber Alertas

**Recomendação de Papéis:**

- **Responsável de Segurança:** Deve receber todos os alertas
- **Engenheiro DevOps/SRE:** Deve receber alertas para resposta rápida
- **Gerente de TI:** Deve receber alertas para visibilidade
- **Equipe de Compliance:** Deve receber alertas para auditoria

**Não recomendado:**
- Desenvolvedores individuais (pode gerar fadiga de alertas)
- Equipes não técnicas (sem capacidade de resposta)

---

## Checklist de Verificação

### Como Confirmar que o Trail está Ativo

#### Via Console AWS:

1. Acesse **CloudTrail** → **Trails**
2. Verifique que `alquimista-audit-trail-{env}` está com status **Logging**
3. Clique no trail e verifique:
   - ✅ Logging está ON
   - ✅ Log file validation está habilitada
   - ✅ Bucket S3 está configurado

#### Via AWS CLI:

```powershell
# Verificar status do trail
aws cloudtrail get-trail-status `
  --name alquimista-audit-trail-dev

# Listar trails
aws cloudtrail list-trails

# Verificar eventos recentes
aws cloudtrail lookup-events `
  --max-results 10
```

#### Via PowerShell Script:

```powershell
# Script: scripts/verify-cloudtrail.ps1
$trailName = "alquimista-audit-trail-dev"
$status = aws cloudtrail get-trail-status --name $trailName | ConvertFrom-Json

if ($status.IsLogging) {
    Write-Host "✅ CloudTrail está ativo e logando" -ForegroundColor Green
} else {
    Write-Host "❌ CloudTrail NÃO está ativo" -ForegroundColor Red
}
```

---

### Como Confirmar que GuardDuty está Habilitado

#### Via Console AWS:

1. Acesse **GuardDuty** → **Settings**
2. Verifique que o detector está **Enabled**
3. Verifique que **S3 Protection** está habilitado
4. Verifique **Finding publishing frequency:** 15 minutes

#### Via AWS CLI:

```powershell
# Listar detectores
aws guardduty list-detectors

# Obter detalhes do detector
$detectorId = (aws guardduty list-detectors | ConvertFrom-Json).DetectorIds[0]
aws guardduty get-detector --detector-id $detectorId
```

#### Via PowerShell Script:

```powershell
# Script: scripts/verify-guardduty.ps1
$detectors = aws guardduty list-detectors | ConvertFrom-Json

if ($detectors.DetectorIds.Count -gt 0) {
    $detectorId = $detectors.DetectorIds[0]
    $detector = aws guardduty get-detector --detector-id $detectorId | ConvertFrom-Json
    
    if ($detector.Status -eq "ENABLED") {
        Write-Host "✅ GuardDuty está habilitado" -ForegroundColor Green
        Write-Host "   Detector ID: $detectorId"
        Write-Host "   Frequência: $($detector.FindingPublishingFrequency)"
    } else {
        Write-Host "❌ GuardDuty está desabilitado" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Nenhum detector GuardDuty encontrado" -ForegroundColor Red
}
```

---

### Como Confirmar que SNS está Enviando Emails

#### Teste Manual via Console:

1. Acesse **SNS** → **Topics**
2. Selecione `alquimista-security-alerts-{env}`
3. Clique em **Publish message**
4. Insira:
   - **Subject:** Teste de Alerta de Segurança
   - **Message:** Este é um teste do sistema de alertas
5. Clique em **Publish message**
6. Verifique se o email foi recebido pelos assinantes

#### Teste via AWS CLI:

```powershell
# Publicar mensagem de teste
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:{account-id}:alquimista-security-alerts-dev `
  --subject "Teste de Alerta de Segurança" `
  --message "Este é um teste do sistema de alertas. Se você recebeu este email, o SNS está funcionando corretamente."
```

#### Via PowerShell Script:

```powershell
# Script: scripts/test-security-alerts.ps1
param(
    [string]$Environment = "dev"
)

$topicArn = aws cloudformation describe-stacks `
  --stack-name "SecurityStack-$Environment" `
  --query "Stacks[0].Outputs[?OutputKey=='SecurityAlertTopicArn'].OutputValue" `
  --output text

if ($topicArn) {
    Write-Host "Enviando mensagem de teste para: $topicArn" -ForegroundColor Yellow
    
    aws sns publish `
      --topic-arn $topicArn `
      --subject "🧪 Teste de Alerta de Segurança" `
      --message "Este é um teste do sistema de alertas AlquimistaAI. Se você recebeu este email, o SNS está funcionando corretamente."
    
    Write-Host "✅ Mensagem enviada! Verifique sua caixa de entrada." -ForegroundColor Green
} else {
    Write-Host "❌ Não foi possível encontrar o ARN do tópico SNS" -ForegroundColor Red
}
```

---

## Custos Estimados

### CloudTrail
- **Primeira cópia do trail:** Gratuita
- **Armazenamento S3:** ~$0.023/GB/mês (us-east-1)
- **Estimativa:** ~$5-10/mês (depende do volume de eventos)

### GuardDuty
- **Análise de CloudTrail:** $4.00 por milhão de eventos
- **Análise de VPC Flow Logs:** $1.00 por GB
- **Análise de DNS Logs:** $0.40 por milhão de requisições
- **S3 Protection:** $0.50 por milhão de eventos
- **Estimativa:** ~$10-30/mês (depende do volume)

### SNS
- **Publicações:** $0.50 por milhão de requisições
- **Emails:** $2.00 por 100.000 emails
- **Estimativa:** < $1/mês (baixo volume de alertas)

**Total Estimado:** ~$15-40/mês

---

## Troubleshooting

### Problema: Não estou recebendo alertas do GuardDuty

**Possíveis Causas:**

1. **Assinatura SNS não confirmada**
   - Verifique sua caixa de entrada (incluindo spam)
   - Procure por email de confirmação da AWS
   - Clique no link de confirmação

2. **GuardDuty não tem achados**
   - GuardDuty pode levar até 48h para começar a gerar achados
   - Achados LOW/MEDIUM não disparam alertas (apenas HIGH/CRITICAL)

3. **EventBridge Rule não está ativa**
   - Verifique no console: EventBridge → Rules
   - Confirme que a rule está **Enabled**

**Solução:**
```powershell
# Verificar assinaturas SNS
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:{account-id}:alquimista-security-alerts-dev

# Verificar EventBridge Rules
aws events list-rules --name-prefix alquimista-guardduty
```

---

### Problema: CloudTrail não está logando

**Possíveis Causas:**

1. **Trail foi desabilitado acidentalmente**
2. **Bucket S3 foi deletado**
3. **Permissões do bucket foram alteradas**

**Solução:**
```powershell
# Verificar status
aws cloudtrail get-trail-status --name alquimista-audit-trail-dev

# Reabilitar trail se necessário
aws cloudtrail start-logging --name alquimista-audit-trail-dev

# Re-deploy do stack se necessário
cdk deploy SecurityStack-dev
```

---

### Problema: Custos do GuardDuty estão altos

**Possíveis Causas:**

1. **Volume alto de eventos CloudTrail**
2. **Volume alto de VPC Flow Logs**
3. **Muitas requisições DNS**

**Solução:**

1. Revisar achados no console GuardDuty
2. Identificar recursos gerando alto volume
3. Considerar ajustar frequência de publicação para 6 horas (reduz custos)
4. Desabilitar proteções não essenciais (ex: Malware Protection se não houver EC2)

```typescript
// Em lib/security-stack.ts, alterar:
findingPublishingFrequency: 'SIX_HOURS', // Ao invés de 'FIFTEEN_MINUTES'
```

---

## Manutenção e Atualizações

### Rotação de Logs

Os logs do CloudTrail são automaticamente deletados após 90 dias via lifecycle policy do S3. Não é necessária ação manual.

### Revisão de Achados do GuardDuty

**Recomendação:** Revisar achados semanalmente, mesmo os de severidade LOW/MEDIUM.

**Como revisar:**
1. Acesse **GuardDuty** → **Findings**
2. Filtre por severidade
3. Revise achados não arquivados
4. Arquive achados falsos positivos
5. Investigue e remedie achados legítimos

### Atualização de Assinantes SNS

Sempre que houver mudança na equipe:
1. Remover assinantes que saíram da equipe
2. Adicionar novos membros da equipe de segurança
3. Confirmar que todos os assinantes estão recebendo alertas

---

## Conformidade e Auditoria

### Retenção de Logs

- **CloudTrail:** 90 dias no S3
- **GuardDuty Findings:** Retidos por 90 dias no console
- **SNS Logs:** Não retidos (apenas delivery logs no CloudWatch)

### Acesso aos Logs

**Quem pode acessar:**
- Usuários IAM com permissão `cloudtrail:LookupEvents`
- Usuários IAM com permissão `s3:GetObject` no bucket de logs
- Usuários IAM com permissão `guardduty:GetFindings`

**Auditoria de Acesso:**
- Todos os acessos aos logs são registrados pelo próprio CloudTrail
- Revisar eventos `GetObject` no bucket de logs
- Revisar eventos `LookupEvents` do CloudTrail

---

## Referências

- [AWS CloudTrail Documentation](https://docs.aws.amazon.com/cloudtrail/)
- [Amazon GuardDuty Documentation](https://docs.aws.amazon.com/guardduty/)
- [Amazon SNS Documentation](https://docs.aws.amazon.com/sns/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)

---

## Contato

Para questões sobre os guardrails de segurança, entre em contato com:
- **Equipe de Segurança:** security@alquimista.ai
- **Equipe DevOps:** devops@alquimista.ai

---

**Última Atualização:** 2025-01-17  
**Versão:** 1.0  
**Autor:** Kiro AI - Sistema de Guardrails AlquimistaAI


---

## Como Configurar Emails para Alertas de Segurança (SNS)

### Visão Geral

Os alertas de segurança do GuardDuty são enviados via Amazon SNS (Simple Notification Service) para o tópico `alquimista-security-alerts-{env}`. Para receber esses alertas por email, você precisa criar uma **subscription** (assinatura) no tópico SNS.

### Pré-requisitos

- ✅ SecurityStack deployado com sucesso
- ✅ Tópico SNS `alquimista-security-alerts-{env}` criado
- ✅ Acesso ao Console AWS ou AWS CLI
- ✅ Email válido para receber alertas

### Método 1: Via Console AWS (Recomendado para Iniciantes)

#### Passo 1: Acessar o Serviço SNS

1. Faça login no [Console AWS](https://console.aws.amazon.com/)
2. Certifique-se de estar na região **us-east-1** (canto superior direito)
3. Na barra de busca, digite **SNS** e clique em **Simple Notification Service**

#### Passo 2: Localizar o Tópico de Segurança

1. No menu lateral esquerdo, clique em **Topics** (Tópicos)
2. Na lista de tópicos, localize: `alquimista-security-alerts-dev` (ou `prod`)
3. Clique no nome do tópico para abrir os detalhes

#### Passo 3: Criar Subscription (Assinatura)

1. Na página de detalhes do tópico, clique no botão **Create subscription**
2. Preencha os campos:
   - **Protocol**: Selecione **Email**
   - **Endpoint**: Digite o email que receberá os alertas (exemplo: `security@alquimista.ai`)
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
  --query "Stacks[0].Outputs[?OutputKey=='SecurityAlertTopicArn'].OutputValue" `
  --output text `
  --region us-east-1
```

#### Passo 2: Criar Subscription

```powershell
# Substituir <TOPIC_ARN> pelo ARN obtido no passo anterior
aws sns subscribe `
  --topic-arn "<TOPIC_ARN>" `
  --protocol email `
  --notification-endpoint "security@alquimista.ai" `
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
  securityAlertEmail: 'security@alquimista.ai', // Adicione esta linha
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

- `security@alquimista.ai` - Equipe de segurança
- `devops@alquimista.ai` - Equipe DevOps
- `cto@alquimista.ai` - CTO ou Tech Lead

**Via Console**: Repita os passos 3-5 para cada email

**Via CLI**:
```powershell
# Adicionar múltiplos emails
aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "security@alquimista.ai"
aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "devops@alquimista.ai"
aws sns subscribe --topic-arn "<TOPIC_ARN>" --protocol email --notification-endpoint "cto@alquimista.ai"
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
   - **Subject**: `🧪 Teste de Alerta de Segurança`
   - **Message**: `Este é um teste do sistema de alertas. Se você recebeu este email, a configuração está correta.`
4. Clique em **Publish message**
5. Verifique sua caixa de entrada

#### Via AWS CLI

```powershell
aws sns publish `
  --topic-arn "<TOPIC_ARN>" `
  --subject "🧪 Teste de Alerta de Segurança" `
  --message "Este é um teste do sistema de alertas. Se você recebeu este email, a configuração está correta." `
  --region us-east-1
```

#### Via Script PowerShell

Use o script fornecido:

```powershell
.\scripts\test-security-alerts.ps1
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
- GuardDuty ainda não gerou findings
- Findings são de severidade LOW/MEDIUM (não disparam alerta)
- EventBridge rule não está ativa

**Solução:**
1. Teste o envio manualmente (ver seção "Testar Envio de Alerta")
2. Verifique que a EventBridge rule está habilitada:
   ```powershell
   aws events list-rules --name-prefix alquimista-guardduty --region us-east-1
   ```
3. Aguarde até 48h para GuardDuty começar a gerar findings

#### Problema: Recebo muitos alertas (fadiga de alertas)

**Solução:**
- Ajuste o filtro de severidade na EventBridge rule (atualmente >= 7.0)
- Considere criar filtros adicionais por tipo de finding
- Implemente um sistema de agregação de alertas

### Checklist de Configuração

- [ ] Identifiquei o tópico SNS de segurança no Console AWS
- [ ] Criei subscription com meu email
- [ ] Confirmei o email clicando no link recebido
- [ ] Verifiquei que o status mudou para "Confirmed"
- [ ] Testei o envio de mensagem e recebi o email
- [ ] Adicionei emails de outros membros da equipe
- [ ] Documentei quem recebe os alertas de segurança
- [ ] Configurei filtros de email para não ir para spam

### Boas Práticas

- ✅ **Adicione pelo menos 2 emails**: Redundância em caso de ausência
- ✅ **Use emails de equipe**: Evite emails pessoais que podem mudar
- ✅ **Teste regularmente**: Envie mensagens de teste mensalmente
- ✅ **Documente os assinantes**: Mantenha lista atualizada
- ✅ **Revise periodicamente**: Remova emails de pessoas que saíram da equipe
- ❌ **Não adicione emails desnecessários**: Evite fadiga de alertas
- ❌ **Não ignore alertas**: Configure filtros de email para destacar alertas críticos



---

## 🛑 Incidentes Relacionados ao WAF

### Visão Geral

O AWS WAF (Web Application Firewall) é a primeira linha de defesa contra ataques web. Esta seção descreve como identificar, investigar e responder a incidentes relacionados ao WAF.

### Tipos de Incidentes

#### 1. Alto Volume de Bloqueios (Possível Ataque)

**Sintoma**: Alarme `alquimista-waf-high-block-rate-{env}` disparado

**Indicadores**:
- Mais de 100 requisições bloqueadas em 10 minutos
- Múltiplos IPs diferentes atacando
- Padrões de ataque conhecidos (SQL injection, XSS)

**Investigação**:

```powershell
# 1. Ver logs recentes do WAF
aws logs tail aws-waf-logs-alquimista-prod --follow --since 30m

# 2. Filtrar por requisições bloqueadas
aws logs filter-log-events `
  --log-group-name aws-waf-logs-alquimista-prod `
  --filter-pattern '{ $.action = "BLOCK" }' `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("o")

# 3. Identificar IPs mais bloqueados
aws logs filter-log-events `
  --log-group-name aws-waf-logs-alquimista-prod `
  --filter-pattern '{ $.action = "BLOCK" }' | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty events | `
  ForEach-Object { ($_.message | ConvertFrom-Json).httpRequest.clientIp } | `
  Group-Object | `
  Sort-Object Count -Descending | `
  Select-Object -First 10
```

**Resposta**:

1. **Avaliar Severidade**:
   - Ataque distribuído (DDoS)? → Escalar para AWS Shield
   - Ataque concentrado? → Adicionar IPs à blocklist
   - Falso positivo? → Ajustar regras

2. **Ação Imediata** (se ataque real):
   ```powershell
   # Adicionar IP à blocklist
   aws wafv2 update-ip-set `
     --scope REGIONAL `
     --id <IP_SET_ID> `
     --addresses "x.x.x.x/32" "y.y.y.y/32" `
     --lock-token <LOCK_TOKEN>
   ```

3. **Documentar**:
   - Registrar IPs bloqueados
   - Tipo de ataque identificado
   - Ações tomadas
   - Duração do incidente

**Prevenção**:
- Revisar regras do WAF mensalmente
- Manter IP Sets atualizados
- Monitorar tendências de bloqueios

---

#### 2. Rate Limiting Excessivo (Impacto em Usuários Legítimos)

**Sintoma**: Alarme `alquimista-waf-rate-limit-triggered-{env}` disparado + reclamações de usuários

**Indicadores**:
- Usuários legítimos sendo bloqueados
- Rate limit acionado > 10 vezes em 5 minutos
- IPs conhecidos (escritório, CI/CD) sendo bloqueados

**Investigação**:

```powershell
# 1. Identificar IPs afetados pelo rate limiting
aws logs filter-log-events `
  --log-group-name aws-waf-logs-alquimista-prod `
  --filter-pattern '{ $.ruleGroupList[*].ruleGroupId = "*RateLimitProd*" }' `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("o")

# 2. Verificar se são IPs conhecidos
# Compare com lista de IPs do escritório/CI/CD
```

**Resposta**:

1. **Ação Imediata** (se usuário legítimo):
   ```powershell
   # Adicionar IP à allowlist (exclui do rate limiting)
   aws wafv2 update-ip-set `
     --scope REGIONAL `
     --id <ALLOWED_IP_SET_ID> `
     --addresses "x.x.x.x/32" `
     --lock-token <LOCK_TOKEN>
   ```

2. **Ajustar Limites** (se necessário):
   - Dev: 2000 req/5min (atual)
   - Prod: 1000 req/5min (atual)
   - Considerar aumentar se legítimo

3. **Comunicar**:
   - Notificar usuário afetado
   - Explicar causa e solução
   - Estimar tempo de resolução

**Prevenção**:
- Manter allowlist atualizada com IPs conhecidos
- Revisar limites de rate limiting periodicamente
- Implementar autenticação para usuários legítimos

---

#### 3. Regras do WAF Bloqueando Funcionalidade Legítima

**Sintoma**: Funcionalidade quebrada após deploy do WAF ou atualização de regras

**Indicadores**:
- Requisições específicas sempre bloqueadas
- Padrão consistente de bloqueio
- Regra específica identificada nos logs

**Investigação**:

```powershell
# 1. Identificar regra que está bloqueando
aws logs filter-log-events `
  --log-group-name aws-waf-logs-alquimista-prod `
  --filter-pattern '{ $.action = "BLOCK" && $.httpRequest.uri = "/api/endpoint-especifico" }'

# 2. Analisar payload da requisição
# Verificar se há padrões que acionam regras (SQL keywords, scripts, etc.)
```

**Resposta**:

1. **Análise de Risco**:
   - A requisição é realmente legítima?
   - Há risco de segurança em permitir?
   - Pode ser refatorada para não acionar a regra?

2. **Opções de Solução**:

   **Opção A: Ajustar Aplicação** (Recomendado)
   - Modificar payload para não acionar regra
   - Exemplo: Evitar keywords SQL em parâmetros

   **Opção B: Criar Exceção na Regra**
   ```typescript
   // Em lib/waf-stack.ts
   // Adicionar scope-down statement para excluir path específico
   {
     name: 'AWSManagedRulesSQLiRuleSet',
     statement: {
       managedRuleGroupStatement: {
         vendorName: 'AWS',
         name: 'AWSManagedRulesSQLiRuleSet',
         scopeDownStatement: {
           notStatement: {
             statement: {
               byteMatchStatement: {
                 searchString: '/api/endpoint-especifico',
                 fieldToMatch: { uriPath: {} },
                 textTransformations: [{ priority: 0, type: 'NONE' }],
                 positionalConstraint: 'EXACTLY',
               },
             },
           },
         },
       },
     },
   }
   ```

   **Opção C: Modo Count Temporário** (Emergência)
   - Mudar regra para modo `count` temporariamente
   - Investigar e implementar solução permanente

3. **Deploy e Validação**:
   ```powershell
   cdk deploy WAFStack-prod --context env=prod
   # Testar funcionalidade
   # Monitorar logs
   ```

**Prevenção**:
- Testar WAF em dev antes de prod
- Usar modo `count` inicialmente em novas regras
- Documentar exceções criadas

---

#### 4. Logs do WAF Não Aparecem

**Sintoma**: CloudWatch Logs vazios ou sem novos eventos

**Indicadores**:
- Log group existe mas sem log streams
- Última entrada de log muito antiga
- Tráfego existe mas não é logado

**Investigação**:

```powershell
# 1. Verificar se log group existe
aws logs describe-log-groups --log-group-name-prefix aws-waf-logs-alquimista

# 2. Verificar configuração de logging do WAF
aws wafv2 get-logging-configuration `
  --resource-arn <WEB_ACL_ARN> `
  --scope REGIONAL

# 3. Verificar se há tráfego no WAF
aws cloudwatch get-metric-statistics `
  --namespace AWS/WAFV2 `
  --metric-name AllowedRequests `
  --dimensions Name=WebACL,Value=AlquimistaAI-WAF-Prod `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("o") `
  --end-time $(Get-Date).ToUniversalTime().ToString("o") `
  --period 300 `
  --statistics Sum
```

**Resposta**:

1. **Verificar Configuração**:
   - Log group name deve começar com `aws-waf-logs-`
   - ARN do log group deve estar correto
   - Logging configuration deve estar ativa

2. **Recriar Logging Configuration** (se necessário):
   ```powershell
   # Re-deploy da stack
   cdk deploy WAFStack-prod --context env=prod
   ```

3. **Verificar Permissões**:
   - WAF deve ter permissão para escrever no CloudWatch Logs
   - Resource policy do log group deve permitir WAF

**Prevenção**:
- Usar padrão oficial de logging (ver documentação)
- Validar após cada deploy
- Monitorar métricas de logging

---

### Fluxo de Resposta a Incidentes WAF

```
┌─────────────────────────────────────────────────────────────┐
│                    Incidente Detectado                       │
│              (Alarme SNS ou Reclamação de Usuário)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  1. IDENTIFICAR                              │
│  - Tipo de incidente (ataque, falso positivo, config)       │
│  - Severidade (crítico, alto, médio, baixo)                 │
│  - Impacto (usuários afetados, funcionalidade quebrada)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  2. INVESTIGAR                               │
│  - Analisar logs do WAF (CloudWatch Logs)                   │
│  - Identificar IPs, padrões, regras acionadas               │
│  - Correlacionar com outros eventos (GuardDuty, CloudTrail) │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  3. RESPONDER                                │
│  - Ataque real → Bloquear IPs, manter regras                │
│  - Falso positivo → Adicionar à allowlist, ajustar regras   │
│  - Config incorreta → Corrigir e re-deploy                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  4. DOCUMENTAR                               │
│  - Registrar incidente (data, hora, tipo)                   │
│  - Documentar ações tomadas                                 │
│  - Atualizar runbooks se necessário                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  5. PREVENIR                                 │
│  - Implementar melhorias nas regras                         │
│  - Atualizar allowlist/blocklist                            │
│  - Revisar e ajustar alarmes                                │
└─────────────────────────────────────────────────────────────┘
```

### Matriz de Severidade e Tempo de Resposta

| Severidade | Descrição | Exemplo | Tempo de Resposta | Ação |
|------------|-----------|---------|-------------------|------|
| **CRÍTICO** | Ataque ativo afetando produção | DDoS, SQL injection em massa | < 15 minutos | Bloquear imediatamente |
| **ALTO** | Funcionalidade crítica quebrada | API principal bloqueada | < 1 hora | Investigar e corrigir |
| **MÉDIO** | Usuários legítimos bloqueados | Rate limiting excessivo | < 4 horas | Adicionar à allowlist |
| **BAIXO** | Bloqueios esperados | Bots conhecidos bloqueados | < 24 horas | Documentar e monitorar |

### Checklist de Resposta a Incidentes

- [ ] Incidente identificado e classificado
- [ ] Severidade avaliada
- [ ] Logs do WAF analisados
- [ ] IPs/padrões identificados
- [ ] Ação corretiva tomada
- [ ] Funcionalidade validada
- [ ] Incidente documentado
- [ ] Stakeholders notificados
- [ ] Melhorias implementadas
- [ ] Runbook atualizado (se necessário)

### Contatos de Escalação

**Incidentes Críticos (DDoS, Ataque em Massa)**:
- Escalar para: AWS Support (Enterprise Support)
- Considerar: AWS Shield Advanced
- Notificar: CTO, Equipe de Segurança

**Incidentes Altos/Médios**:
- Equipe DevOps: devops@alquimista.ai
- Equipe de Segurança: security@alquimista.ai

**Incidentes Baixos**:
- Documentar e revisar em reunião semanal
- Não requer escalação imediata

### Documentação Relacionada

**Para mais informações sobre WAF**:
- [Índice Operacional - Seção WAF](./INDEX-OPERATIONS-AWS.md#-waf--edge-security)
- [WAF Logging - Padrão Oficial](./security/WAF-LOGGING-ALQUIMISTAAI.md)
- [WAF Logging - Referência Rápida](./security/WAF-LOGGING-QUICK-REFERENCE.md)
- [WAF Logging - Guia Visual](./security/WAF-LOGGING-VISUAL-GUIDE.md)
- [Índice de Segurança](./security/README.md)

---

## Documentação Relacionada

### WAF e Proteção de APIs

Para informações sobre configuração e validação de descrições de IP Sets do AWS WAF, consulte:

- **[Diretrizes para Descrições de IP Sets do WAF](./WAF-DESCRIPTIONS-GUIDELINES.md)** - Guia completo sobre caracteres permitidos, exemplos e boas práticas para descrições de IP Sets

### Outros Documentos de Segurança

- **CloudTrail**: Auditoria de chamadas de API (seção acima)
- **GuardDuty**: Detecção de ameaças (seção acima)
- **Security Hub**: Visão consolidada de segurança (seção acima)
- **SNS Alertas**: Sistema de notificações de segurança (seção acima)
