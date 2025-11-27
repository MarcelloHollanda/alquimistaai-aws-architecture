# IAM Roles Quick Reference

## 📋 Resumo Executivo

Este documento fornece uma referência rápida de todas as IAM Roles do Ecossistema Alquimista.AI.

## 🔐 Matriz de Permissões

| Lambda Function | EventBridge | Secrets Manager | SQS | Bedrock | Comprehend | Lambda Invoke | CloudWatch Metrics | VPC |
|----------------|-------------|-----------------|-----|---------|------------|---------------|-------------------|-----|
| **Fibonacci - API Handler** | ✅ PutEvents | ✅ DB Creds | ✅ SendMessage | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Nigredo - Recebimento** | ✅ PutEvents | ✅ DB + Enrichment | ✅ DLQ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Nigredo - Estratégia** | ✅ PutEvents | ✅ DB + Enrichment | ✅ DLQ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Nigredo - Disparo** | ✅ PutEvents | ✅ DB + WhatsApp | ✅ DLQ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Nigredo - Atendimento** | ✅ PutEvents | ✅ DB + WhatsApp | ✅ DLQ | ✅ Claude | ❌ | ✅ Sentimento | ❌ | ✅ |
| **Nigredo - Sentimento** | ❌ | ❌ | ❌ | ❌ | ✅ Detect | ❌ | ❌ | ❌ |
| **Nigredo - Agendamento** | ✅ PutEvents | ✅ DB + Calendar + WhatsApp | ✅ DLQ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Nigredo - Relatórios** | ✅ PutEvents | ✅ DB Creds | ✅ DLQ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Alquimista - List Agents** | ❌ | ✅ DB Creds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Alquimista - Activate/Deactivate** | ✅ PutEvents | ✅ DB Creds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Alquimista - Audit Log** | ❌ | ✅ DB Creds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Alquimista - Agent Metrics** | ❌ | ✅ DB Creds | ❌ | ❌ | ❌ | ❌ | ✅ GetMetrics | ❌ |
| **Alquimista - Approval Flow** | ✅ PutEvents | ✅ DB Creds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legenda**:
- ✅ = Permissão concedida
- ❌ = Permissão não necessária

---

## 🎯 Permissões por Categoria

### 1. EventBridge (PutEvents)

**Quem precisa**:
- API Handler (Fibonacci)
- Todos os agentes Nigredo (exceto Sentimento)
- Activate/Deactivate Agent (Alquimista)
- Approval Flow (Alquimista)

**Quem NÃO precisa**:
- Sentimento (invocado sincronamente)
- List Agents (apenas leitura)
- Audit Log (apenas escrita no banco)
- Agent Metrics (apenas leitura)

---

### 2. Secrets Manager (GetSecretValue)

**Secrets por Lambda**:

| Lambda | DB Creds | WhatsApp | Calendar | Enrichment |
|--------|----------|----------|----------|------------|
| API Handler | ✅ | ❌ | ❌ | ❌ |
| Recebimento | ✅ | ❌ | ❌ | ✅ |
| Estratégia | ✅ | ❌ | ❌ | ✅ |
| Disparo | ✅ | ✅ | ❌ | ❌ |
| Atendimento | ✅ | ✅ | ❌ | ❌ |
| Sentimento | ❌ | ❌ | ❌ | ❌ |
| Agendamento | ✅ | ✅ | ✅ | ❌ |
| Relatórios | ✅ | ❌ | ❌ | ❌ |
| Alquimista (todos) | ✅ | ❌ | ❌ | ❌ |

---

### 3. VPC Access

**Quem precisa**:
- Todos os agentes Nigredo (exceto Sentimento)
- Motivo: Acesso ao Aurora PostgreSQL na subnet privada

**Quem NÃO precisa**:
- API Handler (pode usar RDS Proxy)
- Sentimento (não acessa banco)
- Todas as Lambdas Alquimista (podem usar Data API ou RDS Proxy)

---

### 4. Serviços Especiais

**Bedrock (InvokeModel)**:
- ✅ Atendimento (gerar respostas com Claude)

**Comprehend (DetectSentiment)**:
- ✅ Sentimento (análise de sentimento)

**Lambda (InvokeFunction)**:
- ✅ Atendimento → Sentimento (invocação síncrona)

**CloudWatch (GetMetricStatistics)**:
- ✅ Agent Metrics (consultar métricas de Lambda)

---

## 🚫 Permissões Removidas

### Antes (Inseguro)

```typescript
// ❌ NÃO FAZER
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['*'],
  resources: ['*']
}));
```

### Depois (Seguro)

```typescript
// ✅ FAZER
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['events:PutEvents'],
  resources: ['arn:aws:events:us-east-1:ACCOUNT_ID:event-bus/fibonacci-bus']
}));
```

---

## 📊 Managed Policies Utilizadas

### AWSLambdaBasicExecutionRole

**Usado por**:
- API Handler
- Sentimento
- Todas as Lambdas Alquimista

**Permissões**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

### AWSLambdaVPCAccessExecutionRole

**Usado por**:
- Todos os agentes Nigredo (exceto Sentimento)

**Permissões**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔍 Como Verificar Permissões

### 1. Via AWS Console

1. Acesse IAM → Roles
2. Busque por "Fibonacci", "Nigredo" ou "Alquimista"
3. Clique na role
4. Veja "Permissions" tab

### 2. Via AWS CLI

```bash
# Listar todas as roles do projeto
aws iam list-roles --query 'Roles[?contains(RoleName, `Fibonacci`)].RoleName'

# Ver políticas de uma role
aws iam list-attached-role-policies --role-name <ROLE_NAME>
aws iam list-role-policies --role-name <ROLE_NAME>

# Ver detalhes de uma política inline
aws iam get-role-policy --role-name <ROLE_NAME> --policy-name <POLICY_NAME>
```

### 3. Via CDK

```bash
# Ver template CloudFormation gerado
npm run synth

# Buscar por "AWS::IAM::Role" no output
```

---

## ⚠️ Troubleshooting

### Erro: "User is not authorized to perform: events:PutEvents"

**Solução**: Adicionar permissão `events:PutEvents` na role da Lambda

```typescript
eventBus.grantPutEventsTo(lambdaFunction);
```

---

### Erro: "User is not authorized to perform: secretsmanager:GetSecretValue"

**Solução**: Adicionar permissão para o secret específico

```typescript
dbSecret.grantRead(lambdaFunction);
```

---

### Erro: "User is not authorized to perform: lambda:InvokeFunction"

**Solução**: Conceder permissão de invocação

```typescript
targetLambda.grantInvoke(sourceLambda);
```

---

## 📝 Checklist de Segurança

- [ ] Todas as roles seguem princípio de menor privilégio
- [ ] Nenhuma role tem permissão `*` em actions
- [ ] Nenhuma role tem permissão `*` em resources (exceto X-Ray e Comprehend)
- [ ] Secrets Manager tem rotação automática configurada
- [ ] CloudTrail está habilitado para auditoria
- [ ] IAM Access Analyzer está ativo
- [ ] Permissões são revisadas trimestralmente
- [ ] Documentação está atualizada

---

## 🔗 Links Úteis

- [Documentação Completa](./IAM-ROLES-DOCUMENTATION.md)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Lambda Execution Role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)

---

**Última atualização**: 2024-01-15
