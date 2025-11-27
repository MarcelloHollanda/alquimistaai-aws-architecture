# Tarefa 2 - Deploy Automático Dev + Deploy Manual Prod

## 🎯 Objetivo

Evoluir o pipeline atual (apenas CI) para CI + CD completo:

- **Ambiente DEV**: Deploy automático das 3 stacks após sucesso do CI
- **Ambiente PROD**: Deploy manual com gate de aprovação e environment protegido

## 📋 Contexto

### Estado Atual (Tarefa 1 - Completa)

✅ **Workflow existente**: `.github/workflows/ci-cd-alquimistaai.yml`
- Job `build-and-validate` implementado
- Roda em PR e push para main
- Faz build, validação, cdk synth
- Autentica via OIDC com role `GitHubActionsAlquimistaAICICD`

✅ **Stacks CDK**:
- 3 stacks oficiais: Fibonacci, Nigredo, Alquimista
- Cognito User Pool dentro do FibonacciStack
- Todas compilam e sintetizam corretamente

✅ **OIDC Configurado**:
- Identity Provider criado
- IAM Role `GitHubActionsAlquimistaAICICD` com permissões
- Documentação completa em `docs/ci-cd/OIDC-SETUP.md`

### O Que Falta (Tarefa 2)

❌ Deploy automático em dev após merge
❌ Deploy manual em prod com aprovação
❌ Documentação dos fluxos de deploy
❌ Instruções de rollback

## 🛠️ Entregas Esperadas

### 1. Extender Workflow para CD

Atualizar `.github/workflows/ci-cd-alquimistaai.yml` para incluir:

#### 1.1 Job `deploy-dev`

```yaml
deploy-dev:
  needs: build-and-validate
  runs-on: windows-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  
  permissions:
    id-token: write
    contents: read
  
  steps:
    - Checkout
    - Setup Node.js 20
    - npm ci
    - Configure AWS credentials (OIDC)
    - cdk deploy --all --context env=dev --require-approval never
```

**Quando dispara**: Automaticamente após push em `main`
**O que faz**: Deploy das 3 stacks em dev sem aprovação manual

#### 1.2 Job `deploy-prod`

```yaml
deploy-prod:
  needs: build-and-validate
  runs-on: windows-latest
  if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/v')
  
  environment:
    name: prod
    url: https://<URL-PROD-OFICIAL>  # opcional
  
  permissions:
    id-token: write
    contents: read
  
  steps:
    - Checkout
    - Setup Node.js 20
    - npm ci
    - Configure AWS credentials (OIDC)
    - cdk deploy --all --context env=prod
```

**Quando dispara**: 
- Manual via `workflow_dispatch`
- Automaticamente em tags `v*` (ex: v1.0.0)

**Aprovação**: Requer aprovação manual via GitHub Environment `prod`

### 2. Configurar GitHub Environment

No repositório GitHub, criar environment `prod`:

1. Settings → Environments → New environment
2. Nome: `prod`
3. Protection rules:
   - ✅ Required reviewers (1-6 pessoas)
   - ✅ Wait timer (opcional, ex: 5 minutos)
4. Environment secrets (se necessário)

### 3. Documentação

Atualizar `docs/CI-CD-PIPELINE-ALQUIMISTAAI.md` com:

#### Seção: "Fluxo de Deploy DEV"

- Quando dispara (push em main)
- O que acontece (CDK deploy das stacks dev)
- Como acompanhar no GitHub (jobs deploy-dev)
- Tempo estimado de execução
- Como verificar sucesso

#### Seção: "Fluxo de Deploy PROD"

- Como acionar (workflow_dispatch / tag)
- Requisito de aprovação (environment prod)
- Boas práticas (validar em dev primeiro)
- Como aprovar deploy
- Como verificar sucesso

#### Seção: "Rollback Básico (via CDK)"

- Como reverter em caso de falha
- Comandos: `cdk diff`, voltar commit, redeploy
- Quando usar rollback manual vs automático
- Links para docs AWS/CDK

## 📁 Arquivos Envolvidos

### Modificar

- `.github/workflows/ci-cd-alquimistaai.yml` - Adicionar jobs de deploy
- `docs/CI-CD-PIPELINE-ALQUIMISTAAI.md` - Documentar fluxos

### Criar (Opcional)

- `scripts/deploy-dev.ps1` - Script auxiliar para deploy local em dev
- `scripts/deploy-prod.ps1` - Script auxiliar para deploy local em prod

## ✅ Critérios de Aceite

Considerar a tarefa concluída quando:

1. ✅ O workflow possui jobs `deploy-dev` e `deploy-prod`
2. ✅ Em push main, o job `deploy-dev` roda e faz `cdk deploy` com sucesso
3. ✅ É possível acionar `deploy-prod` via:
   - workflow_dispatch (manual)
   - tag `v*`
4. ✅ O environment `prod` está configurado e exige aprovação manual
5. ✅ A documentação explica claramente:
   - Como funciona dev/prod
   - Como acionar cada um
   - Como verificar logs/resultados
   - Como fazer rollback
6. ✅ A spec `ci-cd-aws-guardrails` está atualizada com essa tarefa marcada

## 🚫 Restrições

### NÃO Tocar Em:

- ❌ Migrations do Aurora
- ❌ Schema de banco de dados
- ❌ Estrutura das stacks CDK existentes
- ❌ Configuração do Supabase

### Foco Apenas Em:

- ✅ Pipeline GitHub Actions
- ✅ Jobs de deploy
- ✅ Documentação
- ✅ Atualização da spec

## 🔄 Fluxo de Trabalho

### Fluxo Dev (Automático)

```
Developer → Push to main
    ↓
GitHub Actions triggered
    ↓
Job: build-and-validate ✅
    ↓
Job: deploy-dev (auto)
    ↓
    ├─ Checkout
    ├─ Setup Node.js
    ├─ npm ci
    ├─ AWS OIDC auth
    └─ cdk deploy --all --context env=dev
    ↓
✅ Deploy completo em dev
```

### Fluxo Prod (Manual)

```
Developer → workflow_dispatch OU tag v*
    ↓
GitHub Actions triggered
    ↓
Job: build-and-validate ✅
    ↓
Job: deploy-prod (manual)
    ↓
⏸️  AGUARDANDO APROVAÇÃO
    ↓
Reviewer → Approve
    ↓
    ├─ Checkout
    ├─ Setup Node.js
    ├─ npm ci
    ├─ AWS OIDC auth
    └─ cdk deploy --all --context env=prod
    ↓
✅ Deploy completo em prod
```

## 📊 Progresso da Tarefa 2

### Subtarefas

- [ ] 2.3 - Implementar job `deploy-dev`
  - [ ] Adicionar job ao workflow
  - [ ] Configurar condições (push main)
  - [ ] Configurar OIDC
  - [ ] Adicionar comando cdk deploy
  - [ ] Testar em ambiente real

- [ ] 2.4 - Implementar job `deploy-prod`
  - [ ] Adicionar job ao workflow
  - [ ] Configurar condições (workflow_dispatch/tag)
  - [ ] Configurar environment prod
  - [ ] Configurar OIDC
  - [ ] Adicionar comando cdk deploy
  - [ ] Configurar required reviewers no GitHub
  - [ ] Testar aprovação manual

- [ ] 2.5 - Documentar fluxos
  - [ ] Seção "Fluxo de Deploy DEV"
  - [ ] Seção "Fluxo de Deploy PROD"
  - [ ] Seção "Rollback Básico"
  - [ ] Exemplos de comandos
  - [ ] Screenshots (opcional)

## 🎓 Referências

### Documentação GitHub Actions

- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Required reviewers](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#required-reviewers)
- [workflow_dispatch](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)

### Documentação AWS CDK

- [cdk deploy](https://docs.aws.amazon.com/cdk/v2/guide/cli.html#cli-deploy)
- [Context values](https://docs.aws.amazon.com/cdk/v2/guide/context.html)
- [Environments](https://docs.aws.amazon.com/cdk/v2/guide/environments.html)

### Documentação do Projeto

- [OIDC Setup](../../docs/ci-cd/OIDC-SETUP.md)
- [Pipeline Overview](../../docs/CI-CD-PIPELINE-ALQUIMISTAAI.md)
- [Contexto Projeto](../../.kiro/steering/contexto-projeto-alquimista.md)

## 💡 Dicas de Implementação

### 1. Testar Localmente Primeiro

Antes de commitar, testar comandos localmente:

```powershell
# Simular deploy dev
npx cdk deploy --all --context env=dev --require-approval never

# Simular deploy prod (com diff)
npx cdk diff --context env=prod
npx cdk deploy --all --context env=prod
```

### 2. Validar Contextos CDK

Verificar se as stacks suportam contexto `env`:

```typescript
// Em cada stack
const env = this.node.tryGetContext('env') || 'dev';
```

Se não suportar, pode ser necessário ajustar as stacks.

### 3. Logs Detalhados

Adicionar steps de log para debug:

```yaml
- name: Debug - Mostrar contexto
  run: |
    echo "Branch: ${{ github.ref }}"
    echo "Event: ${{ github.event_name }}"
    echo "Environment: dev"
```

### 4. Rollback Rápido

Em caso de problema, reverter é simples:

```powershell
# Voltar para commit anterior
git checkout <commit-anterior>

# Redeploy
npx cdk deploy --all --context env=dev
```

## 🚀 Próximos Passos Após Tarefa 2

Após completar esta tarefa:

1. ✅ Tarefa 2 completa
2. ➡️ Tarefa 3: Guardrails de Segurança (CloudTrail, GuardDuty)
3. ➡️ Tarefa 4: Guardrails de Custo (Budgets, Cost Anomaly)
4. ➡️ Tarefa 5: Observabilidade (Alarmes CloudWatch)

---

**Criado em**: 2025-01-17
**Status**: 🔄 Em Progresso
**Estimativa**: 2-3 horas
**Prioridade**: Alta
