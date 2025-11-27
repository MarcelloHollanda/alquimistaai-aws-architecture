# 🚀 Próximos Passos - Após Tarefa 2

## ⚠️ Ações Críticas (Antes de Usar)

### 1. Configurar GitHub Environment "prod" (5 minutos)

**Quem**: Administrador do repositório GitHub

**Passos**:

1. Acessar: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/environments

2. Clicar em **"New environment"**

3. Configurar:
   - **Name**: `prod`
   - **Required reviewers**: Adicionar 1-6 pessoas
     - Sugestão: Marcello Hollanda + Tech Leads
   - **Wait timer** (opcional): 5 minutos
   - **Deployment branches** (opcional): Restringir a `main` e tags `v*`

4. Clicar em **"Save protection rules"**

**Documentação**: [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

**Verificação**:
```
✅ Environment "prod" aparece em Settings → Environments
✅ Required reviewers configurados
✅ Protection rules ativas
```

---

### 2. Substituir Placeholder no Workflow (1 minuto)

**Quem**: Desenvolvedor com acesso ao repositório

**Arquivo**: `.github/workflows/ci-cd-alquimistaai.yml`

**Mudança**:

```yaml
# ANTES (linha ~70 e ~120)
role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/GitHubActionsAlquimistaAICICD

# DEPOIS (substituir <ACCOUNT_ID> pelo ID real da conta AWS)
role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsAlquimistaAICICD
```

**Como obter o Account ID**:

```powershell
# Via AWS CLI
aws sts get-caller-identity --query Account --output text

# Via Console AWS
# Clicar no nome do usuário (canto superior direito)
# Account ID aparece no dropdown
```

**Commit**:

```powershell
git add .github/workflows/ci-cd-alquimistaai.yml
git commit -m "ci: atualizar ARN da role OIDC com Account ID real"
git push origin main
```

**Verificação**:
```
✅ Placeholder <ACCOUNT_ID> substituído
✅ ARN completo e válido
✅ Commit feito e pushed
```

---

## ✅ Ações Recomendadas (Validação)

### 3. Testar Deploy em DEV (15 minutos)

**Objetivo**: Validar que deploy automático funciona

**Passos**:

1. **Criar branch de teste**:
   ```powershell
   git checkout -b test/deploy-dev
   ```

2. **Fazer mudança simples** (ex: adicionar comentário):
   ```typescript
   // Em qualquer arquivo .ts
   // Teste de deploy automático em dev
   ```

3. **Commit e push**:
   ```powershell
   git add .
   git commit -m "test: validar deploy automático em dev"
   git push origin test/deploy-dev
   ```

4. **Criar Pull Request** para `main`

5. **Aguardar CI** (job `build-and-validate`)
   - Verificar que passa com sucesso

6. **Fazer merge** do PR

7. **Acompanhar deploy**:
   - Ir para: Actions → CI/CD AlquimistaAI
   - Verificar que job `deploy-dev` executa
   - Acompanhar logs

8. **Verificar sucesso**:
   ```powershell
   # Listar stacks de dev
   aws cloudformation list-stacks `
     --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
     --query "StackSummaries[?contains(StackName, 'dev')]" `
     --output table
   ```

**Resultado Esperado**:
```
✅ Job build-and-validate: Sucesso
✅ Job deploy-dev: Sucesso (automático)
✅ Stacks de dev atualizadas
✅ Logs mostram "Deploy em DEV concluído com sucesso!"
```

---

### 4. Testar Deploy em PROD (20 minutos)

**Objetivo**: Validar que deploy manual com aprovação funciona

**Método 1: Via Interface GitHub**

1. **Acionar workflow**:
   - Ir para: Actions → CI/CD AlquimistaAI
   - Clicar em "Run workflow"
   - Selecionar branch: `main`
   - Selecionar environment: `prod`
   - Clicar em "Run workflow"

2. **Aguardar CI** (job `build-and-validate`)

3. **Verificar pausa para aprovação**:
   - Job `deploy-prod` aparece com status "Waiting"
   - Reviewer recebe notificação

4. **Reviewer aprova**:
   - Clicar em "Review deployments"
   - Selecionar environment `prod`
   - Clicar em "Approve and deploy"

5. **Acompanhar deploy**:
   - Job `deploy-prod` continua execução
   - Acompanhar logs

6. **Verificar sucesso**:
   ```powershell
   # Listar stacks de prod
   aws cloudformation list-stacks `
     --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
     --query "StackSummaries[?contains(StackName, 'prod')]" `
     --output table
   ```

**Método 2: Via Tag**

1. **Criar tag de versão**:
   ```powershell
   git tag -a v0.1.0-test -m "Teste de deploy via tag"
   git push origin v0.1.0-test
   ```

2. **Seguir passos 2-6 do Método 1**

**Resultado Esperado**:
```
✅ Job build-and-validate: Sucesso
✅ Job deploy-prod: Aguardando aprovação
✅ Notificação enviada ao reviewer
✅ Após aprovação: Deploy executa
✅ Stacks de prod atualizadas
✅ Logs mostram "Deploy em PROD concluído com sucesso!"
```

---

## 📚 Documentação de Referência

### Documentos Criados na Tarefa 2

1. **[TASK-2-OVERVIEW.md](.kiro/specs/ci-cd-aws-guardrails/TASK-2-OVERVIEW.md)**
   - Overview completo da tarefa
   - Objetivos e entregas
   - Fluxos de trabalho

2. **[TASK-2-COMPLETE.md](.kiro/specs/ci-cd-aws-guardrails/TASK-2-COMPLETE.md)**
   - Relatório de conclusão
   - Métricas e resultados
   - Critérios de aceite

3. **[TASK-2-VISUAL-SUMMARY.md](.kiro/specs/ci-cd-aws-guardrails/TASK-2-VISUAL-SUMMARY.md)**
   - Resumo visual
   - Diagramas de fluxo
   - Comparações antes/depois

4. **[docs/CI-CD-PIPELINE-ALQUIMISTAAI.md](../../docs/CI-CD-PIPELINE-ALQUIMISTAAI.md)**
   - Seção "Fluxo de Deploy DEV"
   - Seção "Fluxo de Deploy PROD"
   - Seção "Rollback Básico"

### Comandos Úteis

```powershell
# Ver status de stacks
aws cloudformation list-stacks --output table

# Ver diferenças antes de deploy
npx cdk diff --context env=dev
npx cdk diff --context env=prod

# Deploy manual local (se necessário)
npx cdk deploy --all --context env=dev
npx cdk deploy --all --context env=prod

# Ver logs de Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow

# Ver eventos de CloudFormation
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-dev `
  --max-items 10
```

---

## 🎯 Próximas Tarefas da Spec

Após validar a Tarefa 2, seguir para:

### Tarefa 3: Guardrails de Segurança

**Objetivo**: Implementar CloudTrail, GuardDuty e alertas de segurança

**Entregas**:
- Stack CDK `GuardrailsStack`
- CloudTrail configurado (90 dias de retenção)
- GuardDuty habilitado
- SNS Topic para alertas de segurança
- EventBridge Rule para achados HIGH/CRITICAL

**Estimativa**: 3-4 horas

---

### Tarefa 4: Guardrails de Custo

**Objetivo**: Implementar AWS Budgets e Cost Anomaly Detection

**Entregas**:
- AWS Budget com alertas (80%, 100%, 120%)
- Cost Anomaly Detection configurado
- SNS Topic para alertas de custo
- Monitoramento de serviços principais

**Estimativa**: 2-3 horas

---

### Tarefa 5: Observabilidade Mínima

**Objetivo**: Implementar alarmes CloudWatch e retenção de logs

**Entregas**:
- Alarmes para API Gateway (5XX)
- Alarmes para Lambda (Errors, Duration)
- Alarmes para Aurora (Connections, CPU)
- SNS Topic para alertas operacionais
- Retenção de logs configurada (30 dias)

**Estimativa**: 3-4 horas

---

## 🐛 Troubleshooting

### Problema: Job deploy-dev não executa

**Sintomas**:
- Job `build-and-validate` passa
- Job `deploy-dev` não aparece

**Causas Possíveis**:
1. Push não foi para branch `main`
2. Evento não foi `push` (foi PR)

**Solução**:
```powershell
# Verificar branch atual
git branch

# Verificar que está em main
git checkout main
git pull origin main

# Fazer push
git push origin main
```

---

### Problema: Job deploy-prod não aguarda aprovação

**Sintomas**:
- Job `deploy-prod` executa imediatamente
- Não há pausa para aprovação

**Causas Possíveis**:
1. Environment `prod` não configurado
2. Required reviewers não configurados

**Solução**:
1. Verificar: Settings → Environments → prod
2. Verificar que "Required reviewers" está marcado
3. Verificar que há pelo menos 1 reviewer configurado

---

### Problema: Erro de autenticação AWS

**Sintomas**:
```
Error: Could not assume role with OIDC
```

**Causas Possíveis**:
1. Placeholder `<ACCOUNT_ID>` não substituído
2. IAM Role não existe
3. Trust Policy incorreta

**Solução**:
1. Verificar ARN no workflow
2. Verificar que role existe:
   ```powershell
   aws iam get-role --role-name GitHubActionsAlquimistaAICICD
   ```
3. Verificar Trust Policy (ver `docs/ci-cd/OIDC-SETUP.md`)

---

### Problema: CDK deploy falha

**Sintomas**:
```
Error: Stack FibonacciStack-dev failed to deploy
```

**Causas Possíveis**:
1. Erro de compilação TypeScript
2. Recurso AWS com problema
3. Permissões IAM insuficientes

**Solução**:
1. Verificar logs do CloudFormation:
   ```powershell
   aws cloudformation describe-stack-events `
     --stack-name FibonacciStack-dev `
     --max-items 20
   ```
2. Testar localmente:
   ```powershell
   npm run build
   npx cdk synth FibonacciStack --context env=dev
   ```
3. Verificar permissões da role OIDC

---

## 📞 Suporte

### Documentação

- **Pipeline Overview**: `docs/CI-CD-PIPELINE-ALQUIMISTAAI.md`
- **OIDC Setup**: `docs/ci-cd/OIDC-SETUP.md`
- **Spec Completa**: `.kiro/specs/ci-cd-aws-guardrails/`

### Links Úteis

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

---

## ✅ Checklist Final

Antes de considerar a Tarefa 2 100% operacional:

- [ ] Environment `prod` configurado no GitHub
- [ ] Required reviewers adicionados
- [ ] Placeholder `<ACCOUNT_ID>` substituído
- [ ] Deploy em dev testado e funcionando
- [ ] Deploy em prod testado e funcionando
- [ ] Aprovação manual testada e funcionando
- [ ] Documentação lida e compreendida
- [ ] Equipe treinada nos novos fluxos

---

**Criado em**: 2025-01-17
**Tarefa**: 2 - Deploy Automático Dev + Deploy Manual Prod
**Status**: ✅ Implementação completa, aguardando configuração e testes
