# IAM Roles Documentation - Ecossistema Alquimista.AI

## Overview

Este documento detalha todas as IAM Roles e permissões utilizadas no Ecossistema Alquimista.AI, seguindo o princípio de menor privilégio (Least Privilege Principle).

**Última atualização**: 2024-01-15

## Princípios de Segurança

1. **Least Privilege**: Cada Lambda tem apenas as permissões necessárias para sua função específica
2. **Separation of Concerns**: Roles separadas por núcleo (Fibonacci, Nigredo, Alquimista)
3. **Resource-Specific**: Permissões limitadas a recursos específicos (ARNs explícitos)
4. **No Wildcards**: Evitar `*` em actions e resources sempre que possível
5. **Audit Trail**: Todas as ações são logadas via CloudTrail

## IAM Roles por Stack

### 1. Fibonacci Stack - Orquestrador Central

#### 1.1 API Handler Lambda Role

**Função**: Processar requisições HTTP e publicar eventos no EventBridge

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole (CloudWatch Logs)

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:fibonacci-main-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- `events:PutEvents`: Necessário para publicar eventos no EventBridge
- `secretsmanager:GetSecretValue`: Necessário para obter credenciais do banco de dados
- `sqs:SendMessage`: Necessário para enviar mensagens para fila principal
- `xray:*`: Necessário para tracing distribuído (não pode ser restrito por recurso)

**Recursos Acessados**:
- EventBridge Bus: `fibonacci-bus`
- Secrets Manager: `fibonacci/db/credentials`
- SQS Queue: `fibonacci-main-queue`

---

### 2. Nigredo Stack - Agentes de Prospecção

#### 2.1 Agente de Recebimento Lambda Role

**Função**: Higienizar, validar e enriquecer leads

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaVPCAccessExecutionRole (VPC + CloudWatch Logs)

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/mcp/enrichment-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:nigredo-dlq"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- `AWSLambdaVPCAccessExecutionRole`: Necessário para acesso ao Aurora na VPC
- `events:PutEvents`: Publicar evento `nigredo.recebimento.completed`
- `secretsmanager:GetSecretValue`: Credenciais do banco + API keys de enriquecimento
- `sqs:SendMessage`: Enviar mensagens para DLQ em caso de erro

**Recursos Acessados**:
- Aurora PostgreSQL (via VPC)
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`, `fibonacci/mcp/enrichment`
- SQS DLQ: `nigredo-dlq`

---

#### 2.2 Agente de Estratégia Lambda Role

**Função**: Criar campanhas segmentadas com mensagens personalizadas

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaVPCAccessExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/mcp/enrichment-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:nigredo-dlq"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**: Similar ao Agente de Recebimento

**Recursos Acessados**:
- Aurora PostgreSQL (via VPC)
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`, `fibonacci/mcp/enrichment`
- SQS DLQ: `nigredo-dlq`

---

#### 2.3 Agente de Disparo Lambda Role

**Função**: Enviar mensagens via WhatsApp/Email respeitando rate limits

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaVPCAccessExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/mcp/whatsapp-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:nigredo-dlq"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- Adiciona acesso ao secret `fibonacci/mcp/whatsapp` para envio de mensagens

**Recursos Acessados**:
- Aurora PostgreSQL (via VPC)
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`, `fibonacci/mcp/whatsapp`
- SQS DLQ: `nigredo-dlq`

---

#### 2.4 Agente de Atendimento Lambda Role

**Função**: Responder leads usando IA e análise de sentimento

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaVPCAccessExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/mcp/whatsapp-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:NigredoStack-*-SentimentoLambda-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v2",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-instant-v1"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:nigredo-dlq"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- `lambda:InvokeFunction`: Invocar Agente de Sentimento de forma síncrona
- `bedrock:InvokeModel`: Gerar respostas usando LLM (Claude)

**Recursos Acessados**:
- Aurora PostgreSQL (via VPC)
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`, `fibonacci/mcp/whatsapp`
- Lambda: `SentimentoLambda`
- Bedrock: Claude models
- SQS DLQ: `nigredo-dlq`

---

#### 2.5 Agente de Análise de Sentimento Lambda Role

**Função**: Classificar sentimento e detectar descadastro (LGPD)

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:DetectDominantLanguage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- `comprehend:DetectSentiment`: Análise de sentimento via AWS Comprehend
- `comprehend:DetectDominantLanguage`: Detectar idioma do texto
- Não precisa de VPC (não acessa banco diretamente)
- Não precisa de EventBridge (invocado sincronamente)

**Recursos Acessados**:
- AWS Comprehend (sem restrição de recurso - serviço não suporta)

---

#### 2.6 Agente de Agendamento Lambda Role

**Função**: Marcar reuniões verificando disponibilidade em tempo real

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaVPCAccessExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/mcp/calendar-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/mcp/whatsapp-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:nigredo-dlq"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- Adiciona acesso aos secrets `fibonacci/mcp/calendar` e `fibonacci/mcp/whatsapp`

**Recursos Acessados**:
- Aurora PostgreSQL (via VPC)
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`, `fibonacci/mcp/calendar`, `fibonacci/mcp/whatsapp`
- SQS DLQ: `nigredo-dlq`

---

#### 2.7 Agente de Relatórios Lambda Role

**Função**: Gerar dashboards e métricas de conversão do funil

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaVPCAccessExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:ACCOUNT_ID:nigredo-dlq"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**: Permissões básicas para acesso ao banco e publicação de eventos

**Recursos Acessados**:
- Aurora PostgreSQL (via VPC)
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`
- SQS DLQ: `nigredo-dlq`

---

### 3. Alquimista Stack - Plataforma SaaS

#### 3.1 List Agents Lambda Role

**Função**: Listar agentes disponíveis no marketplace

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- Apenas leitura do banco de dados
- Não precisa de VPC (pode usar RDS Proxy ou Data API)
- Não publica eventos

**Recursos Acessados**:
- Secrets: `fibonacci/db/credentials`

---

#### 3.2 Activate/Deactivate Agent Lambda Roles

**Função**: Ativar ou desativar agentes para tenant

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- Precisa publicar eventos `alquimista.agent.activated` e `alquimista.agent.deactivated`

**Recursos Acessados**:
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`

---

#### 3.3 Audit Log Lambda Role

**Função**: Registrar logs de auditoria

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**: Apenas escrita no banco de dados

**Recursos Acessados**:
- Secrets: `fibonacci/db/credentials`

---

#### 3.4 Agent Metrics Lambda Role

**Função**: Calcular métricas por agente

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**:
- `cloudwatch:GetMetricStatistics`: Consultar métricas de Lambda
- `cloudwatch:ListMetrics`: Listar métricas disponíveis

**Recursos Acessados**:
- Secrets: `fibonacci/db/credentials`
- CloudWatch Metrics (sem restrição de recurso)

---

#### 3.5 Approval Flow Lambda Roles

**Função**: Gerenciar fluxo de aprovação de ações críticas

**Permissões**:

```typescript
// Managed Policies
- AWSLambdaBasicExecutionRole

// Custom Policies
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fibonacci/db/credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Justificativa**: Publicar eventos de aprovação/rejeição

**Recursos Acessados**:
- EventBridge Bus: `fibonacci-bus`
- Secrets: `fibonacci/db/credentials`

---

## Permissões Removidas (Desnecessárias)

### ❌ Permissões que NÃO são necessárias:

1. **`s3:*` em Lambdas**: Nenhuma Lambda precisa acessar S3 diretamente
2. **`dynamodb:*`**: Não usamos DynamoDB
3. **`sns:Publish`**: Não usamos SNS (apenas EventBridge)
4. **`logs:CreateLogGroup`**: Gerenciado automaticamente pelo CDK
5. **`iam:PassRole`**: Não criamos roles dinamicamente
6. **`ec2:*`**: Gerenciado pelo `AWSLambdaVPCAccessExecutionRole`

---

## Auditoria de Permissões

### Como auditar permissões:

```bash
# Listar todas as roles do projeto
aws iam list-roles --query 'Roles[?contains(RoleName, `Fibonacci`) || contains(RoleName, `Nigredo`) || contains(RoleName, `Alquimista`)].RoleName'

# Ver políticas de uma role específica
aws iam list-attached-role-policies --role-name <ROLE_NAME>
aws iam list-role-policies --role-name <ROLE_NAME>

# Ver detalhes de uma política
aws iam get-role-policy --role-name <ROLE_NAME> --policy-name <POLICY_NAME>
```

### Ferramentas de auditoria:

1. **AWS IAM Access Analyzer**: Identifica permissões não utilizadas
2. **AWS CloudTrail**: Audita todas as chamadas de API
3. **AWS Config**: Monitora mudanças em roles e políticas

---

## Recomendações de Segurança

### 1. Rotação de Credenciais

```typescript
// Secrets Manager com rotação automática
const dbSecret = new rds.DatabaseSecret(this, 'DbSecret', {
  username: 'dbadmin',
  secretName: 'fibonacci/db/credentials'
});

dbSecret.addRotationSchedule('RotationSchedule', {
  automaticallyAfter: cdk.Duration.days(30)
});
```

### 2. Monitoramento de Permissões

```typescript
// CloudWatch Alarm para uso suspeito de permissões
new cloudwatch.Alarm(this, 'UnauthorizedAPICallsAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'CloudTrailMetrics',
    metricName: 'UnauthorizedAPICalls',
    statistic: 'Sum',
    period: cdk.Duration.minutes(5)
  }),
  threshold: 5,
  evaluationPeriods: 1,
  alarmDescription: 'Alerta para chamadas de API não autorizadas'
});
```

### 3. Princípio de Menor Privilégio

- ✅ Sempre especificar ARNs completos quando possível
- ✅ Usar condições IAM para restringir ainda mais
- ✅ Revisar permissões trimestralmente
- ✅ Remover permissões não utilizadas (usar IAM Access Analyzer)

### 4. Segregação de Ambientes

```typescript
// Diferentes roles para dev/staging/prod
const roleArn = envName === 'prod' 
  ? 'arn:aws:iam::ACCOUNT_ID:role/FibonacciProdRole'
  : 'arn:aws:iam::ACCOUNT_ID:role/FibonacciDevRole';
```

---

## Compliance e Conformidade

### LGPD (Lei Geral de Proteção de Dados)

- ✅ Todas as ações são auditadas via CloudTrail
- ✅ Acesso a dados pessoais é restrito por role
- ✅ Logs de acesso são mantidos por 90 dias
- ✅ Secrets são criptografados com KMS

### SOC 2 / ISO 27001

- ✅ Princípio de menor privilégio implementado
- ✅ Segregação de funções (separation of duties)
- ✅ Auditoria contínua de permissões
- ✅ Rotação automática de credenciais

---

## Troubleshooting

### Erro: "Access Denied"

1. Verificar se a role tem a permissão necessária
2. Verificar se o recurso ARN está correto
3. Verificar se há condições IAM bloqueando
4. Consultar CloudTrail para detalhes do erro

```bash
# Ver eventos de erro no CloudTrail
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AccessDenied \
  --max-results 10
```

### Erro: "Role not found"

1. Verificar se a stack foi deployada corretamente
2. Verificar se o nome da role está correto
3. Verificar se a role foi deletada acidentalmente

```bash
# Listar roles existentes
aws iam list-roles --query 'Roles[?contains(RoleName, `Fibonacci`)].RoleName'
```

---

## Changelog

### 2024-01-15
- ✅ Documentação inicial criada
- ✅ Todas as roles documentadas com justificativas
- ✅ Permissões desnecessárias identificadas e removidas
- ✅ Recomendações de segurança adicionadas

---

## Referências

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Least Privilege Principle](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege)
- [AWS Lambda Execution Role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
