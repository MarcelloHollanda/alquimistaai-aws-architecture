# AlquimistaAI – CI/CD – Pipeline e Guardrails AWS

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

## Visão Geral

Este documento é o índice central para toda a documentação relacionada ao pipeline de CI/CD e guardrails de segurança, custo e observabilidade implementados para o projeto AlquimistaAI na AWS.

## 📚 Documentação Disponível

### Configuração Inicial

- **[OIDC-SETUP.md](./ci-cd/OIDC-SETUP.md)** - Guia completo para configurar autenticação OIDC entre GitHub Actions e AWS
  - Passo-a-passo detalhado com screenshots
  - Trust policies e permissões IAM
  - Troubleshooting comum
  - Melhores práticas de segurança

### Validação e Testes

- **[CI-CD-VALIDATION-INTEGRATION-SUMMARY.md](./CI-CD-VALIDATION-INTEGRATION-SUMMARY.md)** - ✅ **NOVO** - Resumo da integração de scripts de validação
  - Validação automática de migrations (pré-deploy)
  - Smoke tests automáticos (pós-deploy dev e prod)
  - Fluxos completos atualizados
  - Código implementado documentado

- **[frontend/docs/FRONTEND-TESTES-ROTAS-E2E.md](../frontend/docs/FRONTEND-TESTES-ROTAS-E2E.md)** - ✅ **NOVO** - Testes E2E do Frontend
  - Testes automatizados de rotas com Playwright
  - Prevenção de regressões de 404
  - Validação de middleware de autenticação
  - Integração com CI/CD
  - Relatórios automáticos salvos como artefatos

### Status da Implementação

#### ✅ Tarefa 1: Preparar OIDC GitHub ↔ AWS - CONCLUÍDA

- [x] Documentação completa de configuração OIDC
- [x] Trust Policy definida e documentada
- [x] Permissions Policy definida e documentada
- [x] Guia de troubleshooting
- [x] Checklist de validação

**ARN da Role (Placeholder)**:
```
arn:aws:iam::<ACCOUNT_ID>:role/GitHubActionsAlquimistaAICICD
```

#### 🚧 Próximas Tarefas

- [ ] Tarefa 2: Criar Workflow GitHub Actions Principal
- [ ] Tarefa 3: Implementar Guardrails de Segurança
- [ ] Tarefa 4: Implementar Guardrails de Custo
- [ ] Tarefa 5: Implementar Observabilidade Mínima
- [ ] Tarefa 6: Criar Scripts de Validação e Suporte
- [ ] Tarefa 7: Documentação Completa
- [ ] Tarefa 8: Testes e Validação Final
- [ ] Tarefa 9: Checklist Final e Entrega

## 🎯 Objetivo do Pipeline

Implementar um pipeline CI/CD completo que:

1. **Valida** código automaticamente em PRs
2. **Faz deploy** automático em dev após merge
3. **Requer aprovação** para deploy em produção
4. **Monitora** segurança, custo e performance
5. **Notifica** a equipe sobre eventos importantes

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│                    MarcelloHollanda/alquimistaai                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ OIDC Authentication
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Account                             │
│                         (us-east-1)                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              IAM OIDC Provider + Role                     │  │
│  │  GitHubActionsAlquimistaAICICD                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    CDK Stacks                             │  │
│  │  • FibonacciStack                                        │  │
│  │  • NigredoStack                                          │  │
│  │  • AlquimistaStack                                       │  │
│  │  • GuardrailsStack (futuro)                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Fluxos de Deploy

### Fluxo de Deploy DEV (Automático)

O deploy em ambiente de desenvolvimento é **totalmente automático** após merge para a branch `main`.

#### Quando Dispara

- ✅ Push para branch `main`
- ✅ Após job `build-and-validate` completar com sucesso
- ❌ NÃO dispara em Pull Requests

#### O Que Acontece

```
1. Checkout do código
2. Setup Node.js 20
3. Instalação de dependências (npm ci)
4. Autenticação AWS via OIDC
5. Deploy CDK de todas as stacks:
   - FibonacciStack-dev
   - NigredoStack-dev
   - AlquimistaStack-dev
6. Verificação dos recursos deployados
```

#### Como Acompanhar

1. Acesse: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions`
2. Localize o workflow em execução
3. Clique no job `Deploy Automático - DEV`
4. Acompanhe os logs em tempo real

#### Tempo Estimado

- ⏱️ **5-15 minutos** (dependendo das mudanças)

#### Como Verificar Sucesso

**Via GitHub Actions:**
- ✅ Job `deploy-dev` com status verde
- ✅ Logs mostram "Deploy em DEV concluído com sucesso!"

**Via AWS Console:**
```powershell
# Listar stacks de dev
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'dev')]" `
  --output table
```

**Via CDK CLI (local):**
```powershell
# Ver diferenças entre local e deployed
npx cdk diff --context env=dev
```

#### Em Caso de Falha

Se o deploy falhar:

1. **Verificar logs** no GitHub Actions
2. **Identificar erro** (compilação, permissão, recurso)
3. **Corrigir localmente**:
   ```powershell
   npm run build
   npx cdk synth --context env=dev
   ```
4. **Commit e push** da correção
5. Pipeline executará automaticamente

---

### Fluxo de Deploy PROD (Manual com Aprovação)

O deploy em produção requer **aprovação manual** e pode ser acionado de duas formas.

#### Como Acionar

**Opção 1: Manual via workflow_dispatch**

1. Acesse: `Actions` → `CI/CD AlquimistaAI`
2. Clique em `Run workflow`
3. Selecione branch: `main`
4. Selecione environment: `prod`
5. Clique em `Run workflow`

**Opção 2: Automático via Tag**

```powershell
# Criar tag de versão
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

#### Processo de Aprovação

```
1. Workflow é acionado
2. Job build-and-validate executa
3. Job deploy-prod aguarda aprovação
   ⏸️  PAUSA AQUI - Requer aprovação manual
4. Reviewer recebe notificação
5. Reviewer analisa mudanças (cdk diff)
6. Reviewer aprova ou rejeita
7. Se aprovado: Deploy executa
8. Se rejeitado: Workflow cancela
```

#### Quem Pode Aprovar

Configurado no GitHub Environment `prod`:
- Settings → Environments → prod → Required reviewers
- Mínimo: 1 aprovador
- Recomendado: 2+ aprovadores

#### O Que Acontece Após Aprovação

```
1. Checkout do código
2. Setup Node.js 20
3. Instalação de dependências (npm ci)
4. Autenticação AWS via OIDC
5. CDK Diff (visualizar mudanças)
6. Deploy CDK de todas as stacks:
   - FibonacciStack-prod
   - NigredoStack-prod
   - AlquimistaStack-prod
7. Verificação dos recursos deployados
8. Notificação de sucesso
```

#### Tempo Estimado

- ⏱️ **10-20 minutos** (dependendo das mudanças)
- ⏱️ **+ tempo de aprovação** (variável)

#### Como Verificar Sucesso

**Via GitHub Actions:**
- ✅ Job `deploy-prod` com status verde
- ✅ Logs mostram "Deploy em PROD concluído com sucesso!"

**Via AWS Console:**
```powershell
# Listar stacks de prod
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'prod')]" `
  --output table
```

**Via CDK CLI (local):**
```powershell
# Ver diferenças entre local e deployed
npx cdk diff --context env=prod
```

#### Boas Práticas

1. ✅ **Sempre validar em DEV primeiro**
   - Fazer merge para main
   - Aguardar deploy automático em dev
   - Testar funcionalidades em dev
   - Só então fazer deploy em prod

2. ✅ **Revisar mudanças antes de aprovar**
   - Verificar logs do `cdk diff`
   - Entender impacto das mudanças
   - Confirmar que testes passaram

3. ✅ **Comunicar a equipe**
   - Avisar sobre deploy em prod
   - Documentar mudanças importantes
   - Estar disponível para rollback se necessário

4. ✅ **Monitorar após deploy**
   - Verificar alarmes CloudWatch
   - Testar endpoints principais
   - Acompanhar logs por 15-30 minutos

---

### Rollback Básico (via CDK)

Se um deploy causar problemas, você pode fazer rollback rapidamente.

#### Método 1: Rollback via Git + Redeploy

**Quando usar**: Problemas de código ou configuração

```powershell
# 1. Identificar commit anterior estável
git log --oneline

# 2. Voltar para commit anterior
git checkout <commit-hash-anterior>

# 3. Validar localmente
npm run build
npx cdk diff --context env=prod

# 4. Fazer deploy do código anterior
npx cdk deploy --all --context env=prod

# 5. Após confirmar sucesso, criar tag de rollback
git tag -a v1.0.0-rollback -m "Rollback to stable version"
git push origin v1.0.0-rollback
```

#### Método 2: Rollback via CloudFormation

**Quando usar**: Falha parcial de stack

```powershell
# 1. Listar stacks com problemas
aws cloudformation list-stacks `
  --stack-status-filter ROLLBACK_COMPLETE UPDATE_ROLLBACK_COMPLETE

# 2. Ver eventos da stack
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-prod `
  --max-items 20

# 3. CloudFormation já fez rollback automático
# Verificar estado atual
aws cloudformation describe-stacks `
  --stack-name FibonacciStack-prod `
  --query "Stacks[0].StackStatus"
```

#### Método 3: Rollback Manual de Recurso Específico

**Quando usar**: Problema em recurso específico (ex: Lambda)

```powershell
# 1. Identificar versão anterior da Lambda
aws lambda list-versions-by-function `
  --function-name fibonacci-handler-prod

# 2. Atualizar alias para versão anterior
aws lambda update-alias `
  --function-name fibonacci-handler-prod `
  --name prod `
  --function-version <versao-anterior>
```

#### Quando NÃO Fazer Rollback

- ❌ **Migrations de banco aplicadas**: Rollback de código pode quebrar
- ❌ **Dados já modificados**: Pode causar inconsistência
- ❌ **Problema é de infraestrutura AWS**: Contatar suporte AWS

#### Checklist de Rollback

- [ ] Identificar causa raiz do problema
- [ ] Avaliar impacto do rollback
- [ ] Comunicar equipe sobre rollback
- [ ] Executar rollback (método apropriado)
- [ ] Verificar que sistema voltou ao normal
- [ ] Monitorar por 30 minutos
- [ ] Documentar incidente e lições aprendidas
- [ ] Planejar correção definitiva

---

## 🔐 Segurança - OIDC

### Por que OIDC?

- ✅ **Sem credenciais estáticas**: Não há Access Keys para gerenciar
- ✅ **Tokens temporários**: Expiram automaticamente
- ✅ **Escopo limitado**: Restrito ao repositório específico
- ✅ **Auditoria clara**: Todas as ações rastreadas via CloudTrail

### Configuração

A configuração completa está documentada em [OIDC-SETUP.md](./ci-cd/OIDC-SETUP.md).

**Resumo dos componentes:**

1. **Identity Provider OIDC**
   - URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **IAM Role**
   - Nome: `GitHubActionsAlquimistaAICICD`
   - Trust Policy: Limita ao repositório `MarcelloHollanda/alquimistaai-aws-architecture`
   - Permissions: Mínimas necessárias para CDK deploy

## 🚀 Fluxo do Pipeline

### Pull Request
```
PR criado → Validações (build, lint, tests, migrations) → Comentário no PR
```

### Deploy Dev (Push para main)
```
Push → Validações → Validar Migrations → Deploy Automático → Smoke Tests → Notificação
```

**Detalhamento do Fluxo DEV:**

1. **build-and-validate** (5-10 min)
   - Compilação TypeScript
   - Validação do sistema
   - ✅ **Validação de migrations (pré-deploy)**
   - CDK synth de todas as stacks

2. **deploy-dev** (10-15 min)
   - Autenticação AWS via OIDC
   - Deploy CDK de todas as stacks
   - Verificação de recursos

3. **smoke-tests-dev** (2-5 min) - ✅ **NOVO**
   - ✅ **Testes automáticos das APIs**
   - Validação de endpoints principais
   - Se falhar: Workflow marca como falho + orientação de rollback

### Deploy Prod (Manual/Tag)
```
Tag v* → Validações → Validar Migrations → Aprovação Manual → Deploy → Smoke Tests → Notificação
```

**Detalhamento do Fluxo PROD:**

1. **build-and-validate** (5-10 min)
   - Compilação TypeScript
   - Validação do sistema
   - ✅ **Validação de migrations (pré-deploy)**
   - CDK synth de todas as stacks

2. **deploy-prod** (aguarda aprovação)
   - ⏸️ **Aguarda aprovação manual**
   - Autenticação AWS via OIDC
   - CDK diff (visualizar mudanças)
   - Deploy CDK de todas as stacks
   - Verificação de recursos

3. **smoke-tests-prod** (2-5 min) - ✅ **NOVO**
   - Aguarda 30s para estabilização
   - ✅ **Testes automáticos das APIs**
   - Validação de endpoints principais
   - Se falhar: Alerta crítico + orientação de rollback

## 📋 Checklist de Configuração Inicial

Use este checklist para configurar o pipeline pela primeira vez:

### Passo 1: Configurar OIDC (Tarefa 1 - CONCLUÍDA)

- [x] Ler documentação [OIDC-SETUP.md](./ci-cd/OIDC-SETUP.md)
- [ ] Criar Identity Provider OIDC no AWS IAM
- [ ] Criar IAM Role `GitHubActionsAlquimistaAICICD`
- [ ] Configurar Trust Policy
- [ ] Criar e anexar Permissions Policy
- [ ] Anotar ARN da role criada
- [ ] Validar configuração

### Passo 2: Configurar GitHub Actions (Tarefa 2 - PENDENTE)

- [ ] Criar workflow `.github/workflows/ci-cd-alquimistaai.yml`
- [ ] Configurar ARN da role no workflow
- [ ] Testar autenticação OIDC
- [ ] Validar deploy em dev

### Passo 3: Implementar Guardrails (Tarefas 3-5 - PENDENTE)

- [ ] Criar GuardrailsStack CDK
- [ ] Implementar CloudTrail
- [ ] Implementar GuardDuty
- [ ] Configurar Budgets
- [ ] Configurar CloudWatch Alarms
- [ ] Configurar tópicos SNS

### Passo 4: Documentação e Testes (Tarefas 6-9 - PENDENTE)

- [ ] Criar scripts de validação
- [ ] Documentar comandos rápidos
- [ ] Criar guia de troubleshooting
- [ ] Executar testes end-to-end
- [ ] Obter aprovação final

## 🛠️ Comandos Úteis

### Validação Local

```powershell
# Validar sistema completo
.\scripts\validate-system-complete.ps1

# Build TypeScript
npm run build

# Sintetizar stacks CDK
cdk synth --all --context env=dev

# Ver diferenças antes de deploy
cdk diff FibonacciStack-dev --context env=dev
```

### Deploy Manual

```powershell
# Deploy em dev
cdk deploy FibonacciStack-dev --context env=dev
cdk deploy NigredoStack-dev --context env=dev
cdk deploy AlquimistaStack-dev --context env=dev

# Deploy em prod (com aprovação)
cdk deploy FibonacciStack-prod --context env=prod --require-approval broadening
```

### Verificação de Recursos AWS

```powershell
# Verificar Identity Provider OIDC
aws iam list-open-id-connect-providers --region us-east-1

# Verificar Role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD

# Verificar políticas anexadas
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD

# Verificar stacks CloudFormation
aws cloudformation list-stacks --region us-east-1
```

## 📊 Guardrails (Planejados)

### Segurança
- **CloudTrail**: Auditoria de todas as ações AWS (90 dias)
- **GuardDuty**: Detecção de ameaças em tempo real
- **SNS**: Alertas para achados HIGH/CRITICAL

### Custo
- **AWS Budgets**: Alertas em 80%, 100%, 120% do orçamento
- **Cost Anomaly Detection**: Detecção de gastos anormais > $50
- **SNS**: Notificações de anomalias

### Observabilidade
- **CloudWatch Alarms**: Monitoramento de APIs e Lambdas
- **Log Retention**: 30 dias (aplicação), 90 dias (auditoria)
- **SNS**: Alertas operacionais

## 🔗 Links Importantes

### Documentação da Spec

- [Requirements](../.kiro/specs/ci-cd-aws-guardrails/requirements.md)
- [Design](../.kiro/specs/ci-cd-aws-guardrails/design.md)
- [Tasks](../.kiro/specs/ci-cd-aws-guardrails/tasks.md)
- [INDEX](../.kiro/specs/ci-cd-aws-guardrails/INDEX.md)

### Referências Externas

- [GitHub Actions - OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [AWS IAM - OIDC Identity Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [AWS CDK - GitHub Actions](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)

## 🆘 Suporte

### Troubleshooting Comum

#### Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Causa**: Trust Policy incorreta ou Identity Provider não configurado.

**Solução**: Consulte a seção de Troubleshooting em [OIDC-SETUP.md](./ci-cd/OIDC-SETUP.md#troubleshooting)

#### Erro: "Access Denied" durante deploy

**Causa**: Permissões insuficientes na política anexada à role.

**Solução**: 
1. Revise os logs do CloudFormation
2. Identifique a ação negada
3. Adicione a permissão necessária à política customizada

### Contatos

- **Equipe Técnica**: [Adicionar contato]
- **Equipe Segurança**: [Adicionar contato]
- **Equipe Financeira**: [Adicionar contato]

## 📝 Notas de Versão

### Versão 1.0 (2025-01-17)

- ✅ Tarefa 1 concluída: Configuração OIDC documentada
- ✅ Trust Policy definida
- ✅ Permissions Policy definida
- ✅ Guia de troubleshooting criado
- ✅ Checklist de validação criado

### Próximas Versões

- 🚧 Versão 1.1: Workflow GitHub Actions
- 🚧 Versão 1.2: GuardrailsStack CDK
- 🚧 Versão 1.3: Scripts de validação
- 🚧 Versão 2.0: Sistema completo em produção

---

**Última atualização**: 2025-01-17  
**Versão**: 1.0  
**Status**: Tarefa 1 Concluída - OIDC Configurado  
**Próximo passo**: Tarefa 2 - Criar Workflow GitHub Actions


---

## Configuração do Account ID (AWS_ACCOUNT_ID) no GitHub

### O que é AWS_ACCOUNT_ID?

É uma **variável de repositório** no GitHub que armazena o ID da sua conta AWS (um número de 12 dígitos). Esta variável é usada pelo workflow de CI/CD para construir o ARN da role IAM que o GitHub Actions assume via OIDC.

### Por que usar variável ao invés de hardcode?

- ✅ **Segurança**: Não expõe o Account ID diretamente no código
- ✅ **Flexibilidade**: Fácil de alterar sem modificar o workflow
- ✅ **Boas práticas**: Separação de configuração e código

### Como Configurar

#### Passo 1: Obter o Account ID da AWS

**Via Console AWS:**

1. Faça login no [Console AWS](https://console.aws.amazon.com/)
2. Clique no seu nome de usuário no canto superior direito
3. O Account ID aparece no dropdown (12 dígitos)
4. Copie o número (exemplo: `123456789012`)

**Via AWS CLI:**

```powershell
# Obter Account ID
aws sts get-caller-identity --query Account --output text
```

#### Passo 2: Adicionar Variável no GitHub

1. Acesse seu repositório no GitHub: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture`
2. Clique em **Settings** (Configurações)
3. No menu lateral esquerdo, clique em **Secrets and variables** → **Actions**
4. Clique na aba **Variables** (não Secrets!)
5. Clique no botão **New repository variable**
6. Preencha:
   - **Name**: `AWS_ACCOUNT_ID`
   - **Value**: Seu Account ID de 12 dígitos (exemplo: `123456789012`)
7. Clique em **Add variable**

#### Passo 3: Verificar Configuração

A variável agora está disponível no workflow como `${{ vars.AWS_ACCOUNT_ID }}`.

**Para testar:**

1. Acesse **Actions** no GitHub
2. Execute o workflow manualmente (workflow_dispatch)
3. Verifique nos logs se a autenticação OIDC foi bem-sucedida
4. Se houver erro "Not authorized to perform sts:AssumeRoleWithWebIdentity", verifique:
   - Account ID está correto
   - Role IAM existe na conta
   - Trust Policy da role permite o repositório

### Troubleshooting

#### Erro: "vars.AWS_ACCOUNT_ID is not defined"

**Causa**: Variável não foi criada ou nome está incorreto.

**Solução**:
1. Verifique que criou a variável em **Variables** (não Secrets)
2. Verifique que o nome é exatamente `AWS_ACCOUNT_ID` (case-sensitive)
3. Verifique que está no nível de repositório (não de organização)

#### Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Causa**: Account ID incorreto ou role não existe.

**Solução**:
1. Confirme que o Account ID está correto
2. Verifique que a role `GitHubActionsAlquimistaAICICD` existe:
   ```powershell
   aws iam get-role --role-name GitHubActionsAlquimistaAICICD
   ```
3. Verifique a Trust Policy da role (deve permitir o repositório)

### Checklist de Configuração

- [ ] Obtive o Account ID da minha conta AWS
- [ ] Criei a variável `AWS_ACCOUNT_ID` no GitHub
- [ ] Verifiquei que o nome está correto (case-sensitive)
- [ ] Testei o workflow e a autenticação OIDC funcionou
- [ ] Documentei o Account ID em local seguro (não no código!)

---

## Configuração do Environment "prod" no GitHub

### O que é um GitHub Environment?

Um **Environment** no GitHub é uma configuração que permite:
- ✅ Exigir aprovações manuais antes de deploy
- ✅ Restringir quem pode aprovar deploys
- ✅ Definir secrets/variáveis específicas do ambiente
- ✅ Configurar URLs de ambiente

No nosso caso, o environment `prod` é usado para **proteger deploys em produção**, exigindo aprovação manual antes de executar.

### Como Configurar o Environment "prod"

#### Passo 1: Criar o Environment

1. Acesse seu repositório no GitHub: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture`
2. Clique em **Settings** (Configurações)
3. No menu lateral esquerdo, clique em **Environments**
4. Clique no botão **New environment**
5. Digite o nome: `prod` (exatamente assim, minúsculo)
6. Clique em **Configure environment**

#### Passo 2: Configurar Proteções

Na página de configuração do environment `prod`:

**1. Required reviewers (Revisores obrigatórios)**

- Marque a opção **Required reviewers**
- Clique em **Add reviewers**
- Selecione os usuários/times que podem aprovar deploys em produção
- **Recomendação**: Adicione pelo menos 2 pessoas (redundância)
- Clique em **Save protection rules**

**2. Wait timer (Tempo de espera - Opcional)**

- Se desejar um delay antes do deploy, configure **Wait timer**
- Exemplo: 5 minutos para dar tempo de cancelar se necessário
- Deixe em branco se não quiser delay

**3. Deployment branches (Branches permitidas - Opcional)**

- Por padrão, qualquer branch pode fazer deploy
- Para restringir apenas à branch `main`:
  - Selecione **Selected branches**
  - Adicione regra: `main`

#### Passo 3: Configurar URL do Ambiente (Opcional)

- Em **Environment URL**, adicione: `https://alquimista.ai`
- Isso aparecerá nos logs de deploy como referência

#### Passo 4: Salvar Configurações

- Clique em **Save protection rules** no final da página

### Como Funciona o Fluxo de Aprovação

```
1. Workflow é acionado (manual ou tag)
   ↓
2. Job build-and-validate executa
   ↓
3. Job deploy-prod inicia
   ↓
4. GitHub PAUSA e solicita aprovação
   ↓
5. Revisores recebem notificação
   ↓
6. Revisor acessa Actions → Workflow → Review deployments
   ↓
7. Revisor analisa mudanças e decide:
   - ✅ Approve (deploy continua)
   - ❌ Reject (workflow cancela)
   ↓
8. Se aprovado: Deploy executa
```

### Quem Deve Ser Revisor?

**Recomendações:**

- ✅ **Tech Lead / Arquiteto**: Entende impacto técnico
- ✅ **DevOps/SRE**: Responsável pela infraestrutura
- ✅ **Product Owner**: Valida mudanças de negócio
- ❌ **Desenvolvedores júnior**: Podem não ter contexto completo
- ❌ **Pessoas fora da equipe técnica**: Não conseguem avaliar riscos

**Mínimo recomendado**: 2 revisores (para redundância)

### Como Aprovar um Deploy

#### Quando Receber Notificação

1. Você receberá um email do GitHub: "Deployment review required"
2. Clique no link no email ou acesse:
   - GitHub → Repositório → Actions
   - Localize o workflow em execução
   - Verá status "Waiting for approval"

#### Processo de Revisão

1. Clique no workflow em espera
2. Clique no botão **Review deployments**
3. Analise as informações:
   - Quem acionou o deploy?
   - Qual commit/tag está sendo deployado?
   - Houve mudanças significativas?
4. Revise o `cdk diff` nos logs (se disponível)
5. Decida:
   - **Approve**: Se tudo estiver OK
   - **Reject**: Se houver problemas ou dúvidas

#### Boas Práticas de Aprovação

- ✅ **Sempre revisar o diff**: Entenda o que está mudando
- ✅ **Verificar que dev está estável**: Deploy em dev funcionou?
- ✅ **Comunicar com a equipe**: Avisar sobre o deploy
- ✅ **Estar disponível pós-deploy**: Para rollback se necessário
- ❌ **Não aprovar às cegas**: Sempre entenda o que está sendo deployado
- ❌ **Não aprovar fora do horário comercial**: A menos que seja emergência

### Troubleshooting

#### Problema: Não consigo aprovar o deploy

**Causa**: Você não está na lista de revisores.

**Solução**:
1. Peça a um admin do repositório para adicionar você
2. Settings → Environments → prod → Required reviewers → Add

#### Problema: Deploy não aguarda aprovação

**Causa**: Environment não está configurado no workflow ou nome está incorreto.

**Solução**:
1. Verifique que o job `deploy-prod` tem:
   ```yaml
   environment:
     name: prod
   ```
2. Verifique que o nome do environment no GitHub é exatamente `prod`

#### Problema: Múltiplos revisores, mas apenas 1 aprovou

**Causa**: GitHub exige que TODOS os revisores aprovem (comportamento padrão).

**Solução**:
- Se quiser que apenas 1 aprovação seja suficiente, não adicione múltiplos revisores
- Ou crie um time no GitHub e adicione o time como revisor (qualquer membro pode aprovar)

### Checklist de Configuração

- [ ] Criei o environment `prod` no GitHub
- [ ] Configurei Required reviewers (mínimo 2 pessoas)
- [ ] Testei o fluxo de aprovação com um deploy de teste
- [ ] Documentei quem são os revisores autorizados
- [ ] Comuniquei à equipe sobre o processo de aprovação
- [ ] Verifiquei que o workflow usa `environment: prod` no job deploy-prod

