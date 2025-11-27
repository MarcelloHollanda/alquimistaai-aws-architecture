# 📊 Guia Visual do Workflow CI/CD

## Fluxo Completo

```
┌─────────────────┐
│  Git Push       │
│  (Developer)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│ Workflow Start  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OIDC Auth       │ ← Assume IAM Role
│ AWS Credentials │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Scan   │ ← Guardrails
│ Cost Estimation │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CDK Synth       │
│ Generate CF     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CDK Deploy      │ ← Deploy to AWS
│ Update Stacks   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Post-Deploy     │
│ Validation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ✅ Success      │
│ 📧 Notification │
└─────────────────┘
```

## Logs Esperados

### 1. OIDC Authentication
```
🔐 Configuring AWS credentials...
✓ Assuming role: arn:aws:iam::123456789012:role/GitHubActionsRole
✓ Successfully configured AWS credentials
```

### 2. Security Scan
```
🔍 Running security scan...
✓ No hardcoded credentials found
✓ No security vulnerabilities detected
```

### 3. CDK Synth
```
⚙️  Synthesizing CDK stacks...
✓ AlquimistaStack
✓ FibonacciStack
✓ NigredoStack
✓ Successfully synthesized to cdk.out
```

### 4. CDK Deploy
```
🚀 Deploying stacks...
AlquimistaStack: deploying...
AlquimistaStack: creating CloudFormation changeset...
AlquimistaStack: deployed successfully
```

## Indicadores de Sucesso

✅ **Workflow Badge**: ![Success](https://img.shields.io/badge/build-passing-brightgreen)
✅ **Deploy Time**: < 10 minutos
✅ **All Checks**: Passed
✅ **AWS Resources**: Updated

## Indicadores de Falha

❌ **Auth Failed**: Problema com OIDC/Role
❌ **Security Failed**: Credenciais detectadas
❌ **Deploy Failed**: Erro no CloudFormation
❌ **Timeout**: Deploy demorou muito

## Monitoramento em Tempo Real

### GitHub Actions UI
```
Jobs
├── 🔵 setup (running)
├── ⏳ security-scan (queued)
├── ⏳ deploy (queued)
└── ⏳ validate (queued)
```

### AWS CloudFormation
```
Stack Status: UPDATE_IN_PROGRESS
Resources: 15/20 updated
Estimated time: 5 minutes
```
