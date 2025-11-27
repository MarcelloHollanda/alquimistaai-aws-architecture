# IAM Improvements and Recommendations

## 📊 Status Atual

O Ecossistema Alquimista.AI já implementa o princípio de menor privilégio de forma adequada. Este documento lista melhorias opcionais para aumentar ainda mais a segurança.

---

## ✅ Implementações Corretas Atuais

### 1. Uso de Grant Methods
```typescript
// ✅ Correto - Usa métodos grant do CDK
eventBus.grantPutEventsTo(lambdaFunction);
dbSecret.grantRead(lambdaFunction);
dlq.grantSendMessages(lambdaFunction);
```

**Benefícios**:
- CDK gera automaticamente ARNs específicos
- Apenas ações necessárias são concedidas
- Políticas são otimizadas automaticamente

### 2. Managed Policies Apropriadas
```typescript
// ✅ Correto - Usa managed policies AWS
- AWSLambdaBasicExecutionRole (CloudWatch Logs)
- AWSLambdaVPCAccessExecutionRole (VPC + Logs)
```

### 3. X-Ray Tracing
```typescript
// ✅ Correto - X-Ray habilitado
tracing: lambda.Tracing.ACTIVE
```

**Nota**: X-Ray requer `Resource: "*"` pois não suporta resource-level permissions. Isso é aceitável e documentado pela AWS.

---

## 🔧 Melhorias Opcionais

### 1. MCP Secrets - Wildcards Específicos

**Atual**:
```typescript
// ⚠️ Wildcard amplo
this.recebimentoLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [
    `arn:aws:secretsmanager:${region}:${account}:secret:fibonacci/mcp/*`
  ]
}));
```

**Recomendação**:
```typescript
// ✅ Melhor - Secrets específicos
this.recebimentoLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [
    `arn:aws:secretsmanager:${region}:${account}:secret:fibonacci/mcp/enrichment-*`
  ]
}));
```

**Justificativa**:
- Limita acesso apenas aos secrets necessários
- Previne acesso acidental a outros secrets MCP
- Mantém flexibilidade para rotação de secrets (sufixo `-*`)

**Impacto**: Baixo - Requer atualização em 6 Lambdas

---

### 2. Condições IAM para Secrets Manager

**Recomendação**:
```typescript
this.recebimentoLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [
    `arn:aws:secretsmanager:${region}:${account}:secret:fibonacci/mcp/enrichment-*`
  ],
  conditions: {
    'StringEquals': {
      'secretsmanager:VersionStage': 'AWSCURRENT'
    }
  }
}));
```

**Benefícios**:
- Garante que apenas a versão atual do secret é acessada
- Previne acesso a versões antigas ou em rotação

**Impacto**: Baixo - Adiciona camada extra de segurança

---

### 3. Resource Tags para Controle de Acesso

**Recomendação**:
```typescript
// Adicionar tags aos secrets
const whatsappSecret = new secretsmanager.Secret(this, 'WhatsAppSecret', {
  secretName: 'fibonacci/mcp/whatsapp',
  description: 'WhatsApp Business API credentials'
});

cdk.Tags.of(whatsappSecret).add('MCP-Service', 'whatsapp');
cdk.Tags.of(whatsappSecret).add('Access-Level', 'agent-disparo');

// Usar tag-based access control
this.disparoLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: ['*'],
  conditions: {
    'StringEquals': {
      'secretsmanager:ResourceTag/Access-Level': 'agent-disparo'
    }
  }
}));
```

**Benefícios**:
- Controle de acesso baseado em tags
- Mais flexível para adicionar novos secrets
- Facilita auditoria

**Impacto**: Médio - Requer criação de secrets via CDK

---

### 4. Service Control Policies (SCPs)

**Recomendação** (para produção):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "iam:CreateUser",
        "iam:CreateAccessKey",
        "iam:DeleteUser"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalOrgID": "o-xxxxxxxxxx"
        }
      }
    }
  ]
}
```

**Benefícios**:
- Previne criação de usuários IAM não autorizados
- Adiciona camada de proteção organizacional
- Complementa políticas de role

**Impacto**: Alto - Requer AWS Organizations

---

### 5. Session Policies para Assume Role

**Recomendação** (para CI/CD):
```typescript
// Limitar permissões de deploy
const deployRole = new iam.Role(this, 'DeployRole', {
  assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  maxSessionDuration: cdk.Duration.hours(1),
  inlinePolicies: {
    'deploy-policy': new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            'cloudformation:CreateStack',
            'cloudformation:UpdateStack',
            'cloudformation:DescribeStacks'
          ],
          resources: [
            `arn:aws:cloudformation:${region}:${account}:stack/FibonacciStack-*/*`,
            `arn:aws:cloudformation:${region}:${account}:stack/NigredoStack-*/*`,
            `arn:aws:cloudformation:${region}:${account}:stack/AlquimistaStack-*/*`
          ]
        })
      ]
    })
  }
});
```

**Benefícios**:
- Limita duração de sessões de deploy
- Restringe ações de CloudFormation
- Previne modificações não autorizadas

**Impacto**: Médio - Requer configuração de CI/CD

---

### 6. VPC Endpoints para Secrets Manager

**Recomendação**:
```typescript
// Adicionar VPC endpoint para Secrets Manager
const secretsManagerEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
  vpc: this.vpc,
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  privateDnsEnabled: true,
  subnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
  }
});

// Adicionar política de endpoint
secretsManagerEndpoint.addToPolicy(new iam.PolicyStatement({
  principals: [new iam.AnyPrincipal()],
  actions: ['secretsmanager:GetSecretValue'],
  resources: [
    `arn:aws:secretsmanager:${region}:${account}:secret:fibonacci/*`
  ]
}));
```

**Benefícios**:
- Tráfego não sai da VPC
- Reduz custos de NAT Gateway
- Aumenta segurança

**Impacto**: Médio - Custo adicional de VPC endpoint (~$7/mês)

---

### 7. CloudWatch Logs Encryption

**Recomendação**:
```typescript
// Criar KMS key para logs
const logsKey = new kms.Key(this, 'LogsKey', {
  description: 'KMS key for CloudWatch Logs encryption',
  enableKeyRotation: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN
});

// Usar key em Lambda
const lambdaFn = new nodejs.NodejsFunction(this, 'Function', {
  // ... outras configs
  logRetention: logs.RetentionDays.ONE_MONTH,
  logRetentionRole: new iam.Role(this, 'LogRetentionRole', {
    assumedBy: new iam.ServicePrincipal('logs.amazonaws.com')
  }),
  environment: {
    AWS_LAMBDA_LOG_GROUP_NAME: `/aws/lambda/fibonacci-${props.envName}`
  }
});

// Criptografar log group
const logGroup = new logs.LogGroup(this, 'LogGroup', {
  logGroupName: `/aws/lambda/fibonacci-${props.envName}`,
  encryptionKey: logsKey,
  retention: logs.RetentionDays.ONE_MONTH
});
```

**Benefícios**:
- Logs criptografados em repouso
- Controle de acesso via KMS
- Conformidade com regulações

**Impacto**: Baixo - Custo adicional mínimo

---

### 8. IAM Access Analyzer

**Recomendação**:
```bash
# Criar analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name fibonacci-analyzer \
  --type ACCOUNT \
  --tags Key=Project,Value=fibonacci-core

# Criar archive rule para findings esperados
aws accessanalyzer create-archive-rule \
  --analyzer-name fibonacci-analyzer \
  --rule-name xray-wildcard \
  --filter '{"resource":{"contains":["xray"]}}'
```

**Benefícios**:
- Identifica permissões não utilizadas
- Detecta acesso externo não intencional
- Recomendações automáticas

**Impacto**: Baixo - Serviço gratuito

---

### 9. Permissions Boundary

**Recomendação** (para produção):
```typescript
// Criar boundary policy
const permissionsBoundary = new iam.ManagedPolicy(this, 'PermissionsBoundary', {
  managedPolicyName: 'FibonacciPermissionsBoundary',
  statements: [
    new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: [
        'iam:CreateUser',
        'iam:CreateAccessKey',
        'iam:DeleteUser',
        'iam:AttachUserPolicy'
      ],
      resources: ['*']
    }),
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['*'],
      resources: ['*']
    })
  ]
});

// Aplicar a todas as roles
const lambdaRole = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  permissionsBoundary: permissionsBoundary
});
```

**Benefícios**:
- Limita máximo de permissões possíveis
- Previne escalação de privilégios
- Adiciona camada de proteção

**Impacto**: Alto - Requer planejamento cuidadoso

---

### 10. Automated Compliance Checks

**Recomendação**:
```typescript
// Adicionar ao pipeline CI/CD
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';

const app = new cdk.App();

// Adicionar checks de segurança
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// Suprimir findings conhecidos
NagSuppressions.addStackSuppressions(fibonacciStack, [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'AWSLambdaBasicExecutionRole é managed policy recomendada pela AWS'
  },
  {
    id: 'AwsSolutions-IAM5',
    reason: 'X-Ray requer wildcard em Resource pois não suporta resource-level permissions'
  }
]);
```

**Benefícios**:
- Validação automática de segurança
- Previne deploy de configurações inseguras
- Documentação de exceções

**Impacto**: Baixo - Adiciona validação ao build

---

## 📋 Priorização de Melhorias

### Alta Prioridade (Implementar em Produção)
1. ✅ IAM Access Analyzer - Gratuito e fácil
2. ✅ CloudWatch Logs Encryption - Conformidade
3. ✅ Automated Compliance Checks (cdk-nag) - Previne problemas

### Média Prioridade (Considerar para Produção)
4. ⚠️ MCP Secrets - Wildcards Específicos - Melhora segurança
5. ⚠️ VPC Endpoints - Reduz custos e aumenta segurança
6. ⚠️ Condições IAM - Camada extra de proteção

### Baixa Prioridade (Opcional)
7. 💡 Resource Tags - Facilita gestão
8. 💡 Session Policies - Para CI/CD avançado
9. 💡 Permissions Boundary - Para ambientes multi-tenant
10. 💡 Service Control Policies - Requer AWS Organizations

---

## 🎯 Implementação Recomendada

### Fase 1 (Imediato - Sem custo)
```bash
# 1. Habilitar IAM Access Analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name fibonacci-analyzer \
  --type ACCOUNT

# 2. Adicionar cdk-nag ao projeto
npm install --save-dev cdk-nag

# 3. Executar audit script
./scripts/audit-iam-permissions.sh prod
```

### Fase 2 (Próximo Sprint - Baixo custo)
```typescript
// 1. Adicionar encryption aos logs
// 2. Especificar secrets MCP
// 3. Adicionar condições IAM
```

### Fase 3 (Futuro - Médio custo)
```typescript
// 1. Adicionar VPC endpoints
// 2. Implementar permissions boundary
// 3. Configurar SCPs (se usar Organizations)
```

---

## 📊 Comparação: Antes vs Depois

### Antes (Atual - Já Seguro)
```typescript
// ✅ Já implementado corretamente
eventBus.grantPutEventsTo(lambdaFunction);
dbSecret.grantRead(lambdaFunction);
```

### Depois (Com Melhorias Opcionais)
```typescript
// ✅ Com melhorias adicionais
eventBus.grantPutEventsTo(lambdaFunction);
dbSecret.grantRead(lambdaFunction);

// + Condições IAM
// + VPC Endpoints
// + Logs encryption
// + IAM Access Analyzer
// + Automated compliance checks
```

---

## ✅ Conclusão

**O sistema atual já está seguro e segue as melhores práticas.**

As melhorias listadas são **opcionais** e adicionam camadas extras de segurança para ambientes de produção críticos.

**Recomendação**: Implementar melhorias de Alta Prioridade antes do deploy em produção.

---

## 📚 Referências

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [CDK Security Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html#best-practices-security)
- [cdk-nag Documentation](https://github.com/cdklabs/cdk-nag)
- [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)
