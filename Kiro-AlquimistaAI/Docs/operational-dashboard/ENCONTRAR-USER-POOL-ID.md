# 🔍 Como Encontrar o User Pool ID

## Opção 1: Via AWS CLI (Mais Rápido)

```powershell
# Listar todos os User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

Procure pelo User Pool da AlquimistaAI e copie o `Id`.

## Opção 2: Via Console AWS

1. Acesse: https://console.aws.amazon.com/cognito/
2. Clique em "User pools"
3. Selecione o User Pool da AlquimistaAI
4. O ID estará no topo da página (formato: `us-east-1_XXXXXXXXX`)

## Opção 3: Via CDK Outputs

Se você já fez deploy do Cognito Stack:

```powershell
# Listar outputs do stack
aws cloudformation describe-stacks --stack-name AlquimistaCognitoStack-dev --region us-east-1 --query 'Stacks[0].Outputs'
```

Procure por `UserPoolId` nos outputs.

## ✅ Depois de Encontrar o ID

Execute o script com o ID real:

```powershell
.\scripts\setup-cognito-groups.ps1 -UserPoolId "us-east-1_ABC123XYZ"
```

**Substitua `us-east-1_ABC123XYZ` pelo ID real que você encontrou!**

## 🆘 Se Não Encontrar o User Pool

Você precisa criar o User Pool primeiro. Execute:

```powershell
# Deploy do Cognito Stack
cdk deploy AlquimistaCognitoStack --context env=dev
```

Após o deploy, o User Pool ID será exibido nos outputs.
