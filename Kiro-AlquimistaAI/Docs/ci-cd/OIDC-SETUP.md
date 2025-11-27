# Configuração OIDC GitHub ↔ AWS

## Visão Geral

Este documento fornece instruções passo-a-passo para configurar autenticação federada entre GitHub Actions e AWS usando OpenID Connect (OIDC), eliminando a necessidade de armazenar credenciais AWS de longo prazo no GitHub.

## Por que OIDC?

**Benefícios:**
- ✅ **Sem credenciais estáticas**: Não há Access Keys para gerenciar ou rotacionar
- ✅ **Segurança aprimorada**: Tokens temporários com escopo limitado
- ✅ **Auditoria clara**: Todas as ações rastreadas via CloudTrail
- ✅ **Conformidade**: Alinhado com melhores práticas AWS e GitHub
- ✅ **Rotação automática**: Tokens expiram automaticamente

**Comparação com Access Keys:**

| Aspecto | Access Keys | OIDC |
|---------|-------------|------|
| Armazenamento | GitHub Secrets | Não necessário |
| Rotação | Manual | Automática |
| Escopo | Amplo | Limitado por repositório |
| Auditoria | Difícil rastrear origem | Clara via CloudTrail |
| Risco de vazamento | Alto | Baixo |

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Acesso administrativo à conta AWS (região us-east-1)
- ✅ Permissões para criar IAM Identity Providers e Roles
- ✅ Acesso administrativo ao repositório GitHub
- ✅ AWS CLI instalado e configurado (opcional, mas recomendado)
- ✅ PowerShell 7+ instalado

---

## Passo 1: Criar Identity Provider OIDC no AWS

### 1.1 Via AWS Console

1. Acesse o **AWS Console** → **IAM** → **Identity providers**
2. Clique em **Add provider**
3. Selecione **OpenID Connect**
4. Configure os seguintes valores:

   - **Provider URL**: `https://token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`

5. Clique em **Get thumbprint** (AWS busca automaticamente)
6. Clique em **Add provider**

### 1.2 Via AWS CLI (Alternativa)

```powershell
# Obter o thumbprint do certificado
$thumbprint = "6938fd4d98bab03faadb97b34396831e3780aea1"

# Criar o Identity Provider
aws iam create-open-id-connect-provider `
  --url "https://token.actions.githubusercontent.com" `
  --client-id-list "sts.amazonaws.com" `
  --thumbprint-list $thumbprint `
  --region us-east-1
```

### 1.3 Validação

Verifique que o provider foi criado:

```powershell
aws iam list-open-id-connect-providers --region us-east-1
```

Você deve ver um ARN similar a:
```
arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

**⚠️ IMPORTANTE**: Anote este ARN, você precisará dele no próximo passo.

---

## Passo 2: Criar IAM Role para GitHub Actions

### 2.1 Preparar Trust Policy

Crie um arquivo `github-actions-trust-policy.json` com o seguinte conteúdo:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:MarcelloHollanda/alquimistaai-aws-architecture:*"
        }
      }
    }
  ]
}
```

**⚠️ IMPORTANTE**: Substitua `ACCOUNT_ID` pelo ID da sua conta AWS (12 dígitos).

**Explicação da Trust Policy:**
- `Federated`: ARN do Identity Provider criado no Passo 1
- `aud`: Audience deve ser `sts.amazonaws.com`
- `sub`: Limita acesso ao repositório específico `MarcelloHollanda/alquimistaai-aws-architecture`
- O `*` no final permite qualquer branch/tag do repositório

### 2.2 Criar a Role via AWS CLI

```powershell
# Substitua ACCOUNT_ID pelo ID da sua conta
$accountId = "123456789012"

# Criar a role
aws iam create-role `
  --role-name GitHubActionsAlquimistaAICICD `
  --assume-role-policy-document file://github-actions-trust-policy.json `
  --description "Role para GitHub Actions executar deploy do AlquimistaAI" `
  --region us-east-1
```

### 2.3 Criar a Role via AWS Console (Alternativa)

1. Acesse **IAM** → **Roles** → **Create role**
2. Selecione **Web identity**
3. Em **Identity provider**, selecione o provider criado no Passo 1
4. Em **Audience**, selecione `sts.amazonaws.com`
5. Clique em **Next**
6. **NÃO** anexe políticas ainda (faremos no próximo passo)
7. Em **Role name**, digite: `GitHubActionsAlquimistaAICICD`
8. Clique em **Create role**
9. Após criar, edite a role e substitua a Trust Policy pelo JSON do Passo 2.1

---

## Passo 3: Configurar Permissões da Role

### 3.1 Criar Política de Permissões Customizada

Crie um arquivo `github-actions-permissions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationAccess",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ValidateTemplate",
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:ListStacks"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/FibonacciStack-*",
        "arn:aws:iam::*:role/NigredoStack-*",
        "arn:aws:iam::*:role/AlquimistaStack-*",
        "arn:aws:iam::*:role/GuardrailsStack-*"
      ]
    },
    {
      "Sid": "LambdaManagement",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:ListFunctions",
        "lambda:PublishVersion",
        "lambda:CreateAlias",
        "lambda:UpdateAlias",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:TagResource",
        "lambda:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "APIGatewayManagement",
      "Effect": "Allow",
      "Action": [
        "apigateway:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RDSManagement",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBCluster",
        "rds:ModifyDBCluster",
        "rds:DeleteDBCluster",
        "rds:DescribeDBClusters",
        "rds:CreateDBInstance",
        "rds:ModifyDBInstance",
        "rds:DeleteDBInstance",
        "rds:DescribeDBInstances",
        "rds:AddTagsToResource",
        "rds:RemoveTagsFromResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3Management",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketVersioning",
        "s3:PutBucketWebsite",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketTagging"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontManagement",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SecretsManagerReadOnly",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:/alquimista/*"
    },
    {
      "Sid": "CloudWatchManagement",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:PutDashboard",
        "cloudwatch:DeleteDashboards",
        "cloudwatch:GetDashboard",
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:PutRetentionPolicy",
        "logs:DescribeLogGroups",
        "logs:TagLogGroup"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SNSManagement",
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:Publish",
        "sns:SetTopicAttributes",
        "sns:GetTopicAttributes",
        "sns:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CognitoManagement",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:CreateUserPool",
        "cognito-idp:UpdateUserPool",
        "cognito-idp:DeleteUserPool",
        "cognito-idp:DescribeUserPool",
        "cognito-idp:CreateUserPoolClient",
        "cognito-idp:UpdateUserPoolClient",
        "cognito-idp:DeleteUserPoolClient"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2NetworkingForVPC",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EventBridgeManagement",
      "Effect": "Allow",
      "Action": [
        "events:PutRule",
        "events:DeleteRule",
        "events:DescribeRule",
        "events:PutTargets",
        "events:RemoveTargets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "GuardDutyManagement",
      "Effect": "Allow",
      "Action": [
        "guardduty:CreateDetector",
        "guardduty:GetDetector",
        "guardduty:UpdateDetector",
        "guardduty:DeleteDetector"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudTrailManagement",
      "Effect": "Allow",
      "Action": [
        "cloudtrail:CreateTrail",
        "cloudtrail:UpdateTrail",
        "cloudtrail:DeleteTrail",
        "cloudtrail:DescribeTrails",
        "cloudtrail:StartLogging",
        "cloudtrail:StopLogging"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BudgetsManagement",
      "Effect": "Allow",
      "Action": [
        "budgets:CreateBudget",
        "budgets:UpdateBudget",
        "budgets:DeleteBudget",
        "budgets:ViewBudget"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.2 Anexar Política à Role via AWS CLI

```powershell
# Criar a política
aws iam create-policy `
  --policy-name GitHubActionsAlquimistaAIPolicy `
  --policy-document file://github-actions-permissions-policy.json `
  --description "Permissões para GitHub Actions fazer deploy do AlquimistaAI" `
  --region us-east-1

# Obter o ARN da política criada (substitua ACCOUNT_ID)
$policyArn = "arn:aws:iam::ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy"

# Anexar à role
aws iam attach-role-policy `
  --role-name GitHubActionsAlquimistaAICICD `
  --policy-arn $policyArn `
  --region us-east-1
```

### 3.3 Anexar Política via AWS Console (Alternativa)

1. Acesse **IAM** → **Policies** → **Create policy**
2. Clique na aba **JSON**
3. Cole o conteúdo do arquivo `github-actions-permissions-policy.json`
4. Clique em **Next**
5. Nome: `GitHubActionsAlquimistaAIPolicy`
6. Clique em **Create policy**
7. Acesse **IAM** → **Roles** → `GitHubActionsAlquimistaAICICD`
8. Clique em **Add permissions** → **Attach policies**
9. Busque e selecione `GitHubActionsAlquimistaAIPolicy`
10. Clique em **Attach policies**

---

## Passo 4: Obter ARN da Role

### 4.1 Via AWS CLI

```powershell
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --query 'Role.Arn' --output text
```

### 4.2 Via AWS Console

1. Acesse **IAM** → **Roles**
2. Busque por `GitHubActionsAlquimistaAICICD`
3. Clique na role
4. Copie o **ARN** exibido no topo da página

**Formato esperado:**
```
arn:aws:iam::123456789012:role/GitHubActionsAlquimistaAICICD
```

**⚠️ IMPORTANTE**: Anote este ARN, você precisará configurá-lo no GitHub Actions workflow.

---

## Passo 5: Configurar GitHub Actions Workflow

O ARN da role será usado no workflow `.github/workflows/ci-cd-alquimistaai.yml`:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsAlquimistaAICICD
    aws-region: us-east-1
```

**⚠️ IMPORTANTE**: Substitua o ARN pelo ARN real da sua role.

---

## Passo 6: Validar Configuração

### 6.1 Teste Local (Opcional)

Você pode testar a assunção da role localmente usando AWS CLI:

```powershell
# Obter credenciais temporárias (requer configuração adicional)
aws sts assume-role-with-web-identity `
  --role-arn "arn:aws:iam::123456789012:role/GitHubActionsAlquimistaAICICD" `
  --role-session-name "test-session" `
  --web-identity-token "TOKEN_DO_GITHUB" `
  --region us-east-1
```

**Nota**: Este teste requer um token válido do GitHub, que normalmente só está disponível durante a execução do workflow.

### 6.2 Teste via GitHub Actions

A melhor forma de validar é executar o workflow:

1. Crie um PR de teste
2. Verifique os logs do workflow
3. Procure por mensagens de sucesso na etapa "Configure AWS Credentials"
4. Se houver erro, revise a Trust Policy e permissões

---

## Troubleshooting

### Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Causa**: Trust Policy incorreta ou Identity Provider não configurado.

**Solução**:
1. Verifique que o Identity Provider foi criado corretamente
2. Verifique que o ARN do provider na Trust Policy está correto
3. Verifique que o repositório GitHub está correto na condição `sub`

### Erro: "Access Denied" durante deploy

**Causa**: Permissões insuficientes na política anexada à role.

**Solução**:
1. Revise os logs do CloudFormation para identificar a ação negada
2. Adicione a permissão necessária à política customizada
3. Atualize a política no IAM

### Erro: "Invalid identity token"

**Causa**: Configuração incorreta do audience ou issuer.

**Solução**:
1. Verifique que o audience é `sts.amazonaws.com`
2. Verifique que o provider URL é `https://token.actions.githubusercontent.com`
3. Verifique que o thumbprint está correto

### Erro: "Role session name is invalid"

**Causa**: Nome da sessão contém caracteres inválidos.

**Solução**:
- Use apenas caracteres alfanuméricos, `_`, `-`, `.` no nome da sessão
- O GitHub Actions gerencia isso automaticamente, mas pode ocorrer em testes locais

---

## Segurança e Melhores Práticas

### ✅ Recomendações

1. **Princípio do Menor Privilégio**
   - Revise periodicamente as permissões da role
   - Remova permissões não utilizadas
   - Use condições IAM quando possível

2. **Auditoria**
   - Habilite CloudTrail para rastrear uso da role
   - Configure alertas para ações sensíveis
   - Revise logs regularmente

3. **Limitação de Escopo**
   - A Trust Policy já limita ao repositório específico
   - Considere limitar a branches específicas se necessário:
     ```json
     "StringLike": {
       "token.actions.githubusercontent.com:sub": "repo:MarcelloHollanda/alquimistaai-aws-architecture:ref:refs/heads/main"
     }
     ```

4. **Rotação**
   - Tokens OIDC expiram automaticamente
   - Não há necessidade de rotação manual
   - Revise a configuração trimestralmente

### ❌ Evite

1. **Não** use `"Resource": "*"` quando puder ser mais específico
2. **Não** adicione permissões administrativas (`AdministratorAccess`)
3. **Não** compartilhe o ARN da role publicamente
4. **Não** desabilite CloudTrail para esta role

---

## Manutenção

### Adicionar Novo Repositório

Se precisar dar acesso a outro repositório:

1. Edite a Trust Policy da role
2. Adicione o novo repositório na condição `sub`:
   ```json
   "StringLike": {
     "token.actions.githubusercontent.com:sub": [
       "repo:MarcelloHollanda/alquimistaai-aws-architecture:*",
       "repo:MarcelloHollanda/outro-repositorio:*"
     ]
   }
   ```

### Adicionar Novas Permissões

Se o pipeline precisar de novas permissões AWS:

1. Identifique a ação necessária nos logs de erro
2. Adicione à política customizada
3. Atualize a política no IAM:
   ```powershell
   aws iam create-policy-version `
     --policy-arn "arn:aws:iam::ACCOUNT_ID:policy/GitHubActionsAlquimistaAIPolicy" `
     --policy-document file://github-actions-permissions-policy.json `
     --set-as-default
   ```

### Remover Acesso

Para revogar acesso do GitHub Actions:

1. Opção 1: Deletar a role (mais drástico)
   ```powershell
   aws iam delete-role --role-name GitHubActionsAlquimistaAICICD
   ```

2. Opção 2: Modificar Trust Policy para negar acesso
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Deny",
         "Principal": "*",
         "Action": "*"
       }
     ]
   }
   ```

---

## Checklist de Configuração

Use este checklist para garantir que tudo foi configurado corretamente:

- [ ] Identity Provider OIDC criado no IAM
- [ ] Provider URL: `https://token.actions.githubusercontent.com`
- [ ] Audience: `sts.amazonaws.com`
- [ ] IAM Role `GitHubActionsAlquimistaAICICD` criada
- [ ] Trust Policy configurada com repositório correto
- [ ] Política de permissões customizada criada
- [ ] Política anexada à role
- [ ] ARN da role anotado
- [ ] CloudTrail habilitado para auditoria
- [ ] Workflow GitHub Actions configurado com ARN da role
- [ ] Teste de validação executado com sucesso

---

## Referências

- [GitHub Actions - OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [AWS IAM - OIDC Identity Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [AWS CDK - GitHub Actions](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)

---

## Suporte

Em caso de dúvidas ou problemas:

1. Revise a seção de Troubleshooting acima
2. Consulte os logs do GitHub Actions
3. Consulte os logs do CloudTrail
4. Abra uma issue no repositório

---

**Última atualização**: 2025-01-17
**Versão**: 1.0
**Autor**: Equipe AlquimistaAI
