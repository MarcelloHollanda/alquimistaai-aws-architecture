# AlquimistaAI – CI/CD – Fluxos de Deploy Dev/Prod

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Deploy em Dev (Automático)](#deploy-em-dev-automático)
3. [Deploy em Prod (Manual/Protegido)](#deploy-em-prod-manualprotegido)
4. [Fluxo Mínimo de Validação Pós-Deploy](#fluxo-mínimo-de-validação-pós-deploy)
5. [Troubleshooting Comum](#troubleshooting-comum)

---

## Visão Geral

Este documento descreve os fluxos práticos de deploy para os ambientes **dev** e **prod** do sistema AlquimistaAI, incluindo como disparar, acompanhar e validar cada deploy.

### Diferenças entre Dev e Prod

| Aspecto | Dev | Prod |
|---------|-----|------|
| **Disparo** | Automático (push para main) | Manual (workflow_dispatch ou tag) |
| **Aprovação** | Não requer | Requer aprovação manual |
| **Ambiente GitHub** | Não usa | Usa environment `prod` |
| **Frequência** | Múltiplas vezes ao dia | Semanal ou conforme necessário |
| **Rollback** | Rápido e simples | Planejado e comunicado |
| **Monitoramento pós-deploy** | Básico (5-10 min) | Intensivo (30-60 min) |

### Pré-requisitos

Antes de fazer qualquer deploy, certifique-se de que:

- ✅ Variável `AWS_ACCOUNT_ID` configurada no GitHub
- ✅ Role IAM `GitHubActionsAlquimistaAICICD` existe na AWS
- ✅ Environment `prod` configurado no GitHub (para deploys em prod)
- ✅ Código compilando localmente (`npm run build`)
- ✅ CDK synth funcionando (`cdk synth --all --context env=dev`)

**Documentação de configuração**: [CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md)

---

## Deploy em Dev (Automático)

### Quando Dispara

O deploy em **dev** é **totalmente automático** e dispara quando:

- ✅ Você faz **push** para a branch `main`
- ✅ O job `build-and-validate` completa com sucesso
- ❌ **NÃO** dispara em Pull Requests (apenas validação)

### Passo a Passo

#### 1. Preparar o Código

```powershell
# Verificar status do repositório
git status

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "feat: adicionar nova funcionalidade X"

# Push para main (dispara deploy automático)
git push origin main
```

#### 2. Acompanhar o Deploy

1. Acesse o repositório no GitHub: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture`
2. Clique na aba **Actions**
3. Localize o workflow em execução (nome: **CI/CD AlquimistaAI**)
4. Clique no workflow para ver detalhes
5. Acompanhe os jobs:
   - ✅ **build-and-validate** (5-10 min)
   - ✅ **deploy-dev** (10-15 min)

#### 3. Verificar Logs

**Job: build-and-validate**
- Compilação TypeScript
- Validação do sistema
- ✅ **Validação de migrations (pré-deploy)**
- CDK synth de todas as stacks

**Job: deploy-dev**
- Autenticação AWS via OIDC
- Deploy CDK de todas as stacks:
  - FibonacciStack-dev
  - NigredoStack-dev
  - AlquimistaStack-dev
- Verificação de recursos deployados

**Job: smoke-tests-dev** - ✅ **NOVO**
- Autenticação AWS via OIDC
- ✅ **Execução automática de smoke tests**
- Validação de endpoints das APIs
- Se falhar: Orientação para rollback

#### 4. Validar Deploy

Após o job `deploy-dev` completar com sucesso, o job `smoke-tests-dev` executa **automaticamente**:

**Via GitHub Actions:**
- ✅ Job `deploy-dev` com status verde
- ✅ Job `smoke-tests-dev` executa automaticamente
- ✅ Logs mostram "Smoke tests passaram com sucesso!"

**O que é testado automaticamente:**
- ✅ Health check das APIs (Fibonacci e Nigredo)
- ✅ Endpoints principais funcionando
- ✅ Respostas JSON válidas
- ✅ Status codes corretos

**Se os smoke tests falharem:**
- ❌ Workflow marca como falho
- 📋 Logs mostram detalhes do erro
- 📖 Mensagem orienta para:
  - `docs/ROLLBACK-OPERACIONAL-AWS.md`
  - `.\scripts\manual-rollback-guided.ps1 -Environment dev`

**Validação adicional (opcional):**

**Via AWS Console:**

```powershell
# Listar stacks de dev
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'dev')].{Name:StackName, Status:StackStatus}" `
  --output table `
  --region us-east-1
```

**Via CDK CLI (local):**

```powershell
# Ver diferenças entre local e deployed
cdk diff --context env=dev
```

**Via Script de Smoke Tests (manual):**

```powershell
# Testar endpoints principais manualmente
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose
```

### Tempo Estimado

- ⏱️ **Build e validação**: 5-10 minutos
- ⏱️ **Deploy**: 10-15 minutos
- ⏱️ **Smoke tests**: 2-5 minutos (automático)
- ⏱️ **Total**: 17-30 minutos

### Checklist de Deploy Dev

- [ ] Código commitado e pushed para main
- [ ] Workflow iniciou automaticamente
- [ ] Job `build-and-validate` completou com sucesso
  - [ ] Migrations validadas (pré-deploy)
- [ ] Job `deploy-dev` completou com sucesso
- [ ] Job `smoke-tests-dev` completou com sucesso ✅ **AUTOMÁTICO**
  - [ ] Health checks passaram
  - [ ] Endpoints principais funcionando
- [ ] Stacks aparecem como UPDATE_COMPLETE no CloudFormation
- [ ] API dev responde corretamente

### Em Caso de Falha

Se o deploy falhar:

#### 1. Identificar o Erro

- Verifique os logs do job que falhou
- Identifique a mensagem de erro específica

#### 2. Categorizar o Problema

**Erro de Compilação:**
```
Error: TS2304: Cannot find name 'X'
```
**Solução**: Corrigir erro de TypeScript localmente e fazer novo push

**Erro de CDK Synth:**
```
Error: Stack X has invalid configuration
```
**Solução**: Corrigir configuração do stack e fazer novo push

**Erro de Deploy:**
```
Error: Resource X already exists
```
**Solução**: Verificar estado do CloudFormation, pode precisar de rollback manual

**Erro de Permissão:**
```
Error: User is not authorized to perform X
```
**Solução**: Verificar permissões da role IAM

#### 3. Corrigir e Tentar Novamente

```powershell
# Corrigir o problema localmente
npm run build

# Validar localmente
cdk synth --all --context env=dev

# Commit e push (dispara novo deploy)
git add .
git commit -m "fix: corrigir erro X"
git push origin main
```

#### 4. Rollback se Necessário

Se o problema persistir e o ambiente dev estiver quebrado:

```powershell
# Rollback via Git
git revert HEAD
git push origin main

# Ou deploy manual da versão anterior
git checkout <commit-anterior>
cdk deploy --all --context env=dev
```

**Documentação completa de rollback**: [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)

---

## Deploy em Prod (Manual/Protegido)

### Quando Usar

O deploy em **prod** deve ser usado quando:

- ✅ Funcionalidade foi testada e validada em dev
- ✅ Equipe está pronta para monitorar pós-deploy
- ✅ Stakeholders foram comunicados
- ✅ Janela de deploy foi agendada (se necessário)

### Método 1: Via Workflow Dispatch (Recomendado)

#### Passo 1: Acessar GitHub Actions

1. Acesse o repositório: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture`
2. Clique na aba **Actions**
3. No menu lateral esquerdo, clique em **CI/CD AlquimistaAI**
4. Clique no botão **Run workflow** (canto superior direito)

#### Passo 2: Configurar o Workflow

1. Selecione a branch: **main** (ou a branch que deseja deployar)
2. Selecione o environment: **prod**
3. Clique em **Run workflow**

#### Passo 3: Aguardar Validação

O workflow executará:
1. ✅ Job `build-and-validate` (5-10 min)
2. ⏸️ Job `deploy-prod` aguarda aprovação

#### Passo 4: Aprovar o Deploy

1. Você (ou um revisor autorizado) receberá notificação
2. Acesse o workflow em execução
3. Clique no botão **Review deployments**
4. Analise as informações:
   - Quem acionou?
   - Qual commit?
   - Mudanças significativas?
5. Revise o `cdk diff` nos logs (se disponível)
6. Decida:
   - ✅ **Approve** - Deploy continua
   - ❌ **Reject** - Workflow cancela

#### Passo 5: Acompanhar o Deploy

Após aprovação:
1. Job `deploy-prod` inicia
2. Acompanhe os logs em tempo real
3. Aguarde conclusão (10-20 min)

#### Passo 6: Validar Deploy

Após conclusão do deploy, o job `smoke-tests-prod` executa **automaticamente**:

**O que acontece:**
1. ⏳ Aguarda 30 segundos para estabilização (cold start)
2. 🧪 Executa smoke tests em prod
3. ✅ Valida APIs (Fibonacci e Nigredo)
4. 📊 Reporta resultado

**Se os smoke tests passarem:**
- ✅ Workflow completa com sucesso
- 🎉 Deploy validado e funcionando

**Se os smoke tests falharem:**
- ❌ Workflow marca como falho
- 🚨 Alerta crítico emitido
- 📋 Orientação para ação imediata:
  - Verificar logs
  - Consultar `docs/ROLLBACK-OPERACIONAL-AWS.md`
  - Executar `.\scripts\manual-rollback-guided.ps1 -Environment prod`
  - Notificar equipe

**Validação adicional (recomendada):**
- Ver seção "Fluxo Mínimo de Validação Pós-Deploy"

### Método 2: Via Tag de Versão

#### Passo 1: Criar Tag

```powershell
# Criar tag de versão
git tag -a v1.0.0 -m "Release v1.0.0 - Descrição das mudanças"

# Push da tag (dispara deploy automático)
git push origin v1.0.0
```

#### Passo 2: Workflow Dispara Automaticamente

O workflow detecta a tag e inicia automaticamente.

#### Passo 3-6: Igual ao Método 1

Siga os passos 3-6 do Método 1 (aprovação, acompanhamento, validação).

### Tempo Estimado

- ⏱️ **Build e validação**: 5-10 minutos
- ⏱️ **Aguardando aprovação**: Variável (minutos a horas)
- ⏱️ **Deploy**: 10-20 minutos
- ⏱️ **Smoke tests**: 2-5 minutos (automático)
- ⏱️ **Validação manual adicional**: 30-60 minutos (recomendada)
- ⏱️ **Total**: 17-35 minutos (+ tempo de aprovação + validação manual)

### Checklist de Deploy Prod

#### Pré-Deploy

- [ ] Funcionalidade testada e validada em dev
- [ ] Equipe comunicada sobre o deploy
- [ ] Janela de deploy agendada (se necessário)
- [ ] Revisores disponíveis para aprovação
- [ ] Plano de rollback preparado

#### Durante Deploy

- [ ] Workflow acionado (manual ou tag)
- [ ] Job `build-and-validate` completou com sucesso
  - [ ] Migrations validadas (pré-deploy)
- [ ] Deploy aprovado por revisor autorizado
- [ ] Job `deploy-prod` completou com sucesso
- [ ] Stacks aparecem como UPDATE_COMPLETE no CloudFormation

#### Pós-Deploy

- [ ] Job `smoke-tests-prod` completou com sucesso ✅ **AUTOMÁTICO**
  - [ ] Health checks passaram
  - [ ] Endpoints principais funcionando
- [ ] API prod responde corretamente
- [ ] Alarmes CloudWatch não dispararam
- [ ] Logs não mostram erros críticos
- [ ] Funcionalidade principal testada manualmente
- [ ] Equipe monitorando por 30-60 minutos

### Boas Práticas

#### Antes do Deploy

1. ✅ **Sempre validar em dev primeiro**
   - Fazer merge para main
   - Aguardar deploy automático em dev
   - Testar funcionalidades em dev
   - Só então fazer deploy em prod

2. ✅ **Comunicar a equipe**
   - Avisar sobre o deploy com antecedência
   - Definir janela de deploy (se necessário)
   - Garantir que revisores estão disponíveis

3. ✅ **Preparar rollback**
   - Identificar commit anterior estável
   - Ter plano de rollback documentado
   - Estar disponível para rollback se necessário

#### Durante o Deploy

1. ✅ **Revisar mudanças antes de aprovar**
   - Verificar logs do `cdk diff`
   - Entender impacto das mudanças
   - Confirmar que testes passaram

2. ✅ **Monitorar em tempo real**
   - Acompanhar logs do deploy
   - Verificar se há erros
   - Estar pronto para cancelar se necessário

#### Após o Deploy

1. ✅ **Validar imediatamente**
   - Executar smoke tests
   - Testar funcionalidade principal
   - Verificar alarmes CloudWatch

2. ✅ **Monitorar por 30-60 minutos**
   - Acompanhar logs de aplicação
   - Verificar métricas de performance
   - Estar disponível para rollback

3. ✅ **Documentar**
   - Registrar o deploy (data, hora, versão)
   - Documentar problemas encontrados
   - Atualizar changelog se necessário

---

## Fluxo Mínimo de Validação Pós-Deploy

### ✅ Validação Automática (Integrada ao CI/CD)

Os seguintes testes são executados **automaticamente** após cada deploy:

#### Smoke Tests Automáticos

**DEV:**
- Job `smoke-tests-dev` executa após `deploy-dev`
- Testa health checks e endpoints principais
- Falha bloqueia o workflow

**PROD:**
- Job `smoke-tests-prod` executa após `deploy-prod`
- Aguarda 30s para estabilização
- Testa health checks e endpoints principais
- Falha emite alerta crítico

**O que é testado automaticamente:**
- ✅ Health check das APIs (Fibonacci e Nigredo)
- ✅ Endpoints principais funcionando
- ✅ Respostas JSON válidas
- ✅ Status codes corretos

### Validação Manual Adicional (Recomendada)

Além dos testes automáticos, recomenda-se executar validações manuais adicionais:

### 1. Verificar Status das Stacks

```powershell
# Listar stacks do ambiente
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'dev')].{Name:StackName, Status:StackStatus}" `
  --output table `
  --region us-east-1

# Substituir 'dev' por 'prod' para produção
```

**Esperado**: Todas as stacks com status `UPDATE_COMPLETE` ou `CREATE_COMPLETE`

### 2. Executar Smoke Tests (Manual - Opcional)

**Nota:** Os smoke tests já foram executados automaticamente pelo CI/CD. Esta etapa é opcional para validação adicional.

```powershell
# Script de smoke tests (dev) - manual
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose

# Para prod
.\scripts\smoke-tests-api-dev.ps1 -Environment prod -Verbose
```

**O que é testado:**
- Health check das APIs
- Endpoints principais do Fibonacci
- Endpoints principais do Nigredo
- Conectividade com Aurora

### 3. Verificar Alarmes CloudWatch

```powershell
# Listar alarmes em estado de alarme
aws cloudwatch describe-alarms `
  --state-value ALARM `
  --region us-east-1
```

**Esperado**: Nenhum alarme em estado `ALARM` (ou apenas alarmes conhecidos)

### 4. Verificar Logs de Aplicação

```powershell
# Ver logs recentes de uma Lambda (exemplo: Fibonacci)
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# Substituir 'dev' por 'prod' para produção
```

**Procurar por:**
- ❌ Erros (ERROR, Exception, Failed)
- ⚠️ Warnings excessivos
- ✅ Logs normais de operação

### 5. Testar Funcionalidade Principal

**Manualmente:**
- Acessar frontend (se aplicável)
- Testar fluxo principal de usuário
- Verificar que dados são salvos/recuperados corretamente

**Via API:**
```powershell
# Exemplo: Testar endpoint de health
curl https://api-dev.alquimista.ai/health

# Exemplo: Testar endpoint de listagem
curl https://api-dev.alquimista.ai/api/fibonacci/leads
```

### 6. Validar Migrations (Se Aplicável)

Se o deploy incluiu migrations de banco:

```powershell
# Validar estado das migrations
.\scripts\validate-migrations-aurora.ps1 -Environment dev
```

**Esperado**: Todas as migrations aplicadas com sucesso

### Checklist de Validação Rápida

#### Validação Automática (CI/CD)
- [ ] Job `smoke-tests-dev` ou `smoke-tests-prod` passou ✅ **AUTOMÁTICO**
- [ ] Health checks passaram
- [ ] Endpoints principais funcionando

#### Validação Manual Adicional
- [ ] Stacks com status correto no CloudFormation
- [ ] Nenhum alarme CloudWatch disparado
- [ ] Logs não mostram erros críticos
- [ ] Funcionalidade principal testada e funcionando
- [ ] Migrations aplicadas (se aplicável)

### Tempo de Validação

- **Automática (CI/CD)**: 2-5 minutos
- **Manual adicional (Dev)**: 5-10 minutos
- **Manual adicional (Prod)**: 30-60 minutos (validação completa + monitoramento)

---

## Troubleshooting Comum

### Problema: Deploy falhou no job build-and-validate

**Sintomas:**
- Job `build-and-validate` falha
- Deploy não prossegue

**Possíveis causas:**
1. Erro de compilação TypeScript
2. Erro de validação do sistema
3. Erro de CDK synth

**Solução:**

```powershell
# 1. Verificar logs do job no GitHub Actions
# 2. Reproduzir localmente
npm run build
cdk synth --all --context env=dev

# 3. Corrigir erro identificado
# 4. Commit e push novamente
git add .
git commit -m "fix: corrigir erro de compilação"
git push origin main
```

### Problema: Deploy falhou no job deploy-dev/deploy-prod

**Sintomas:**
- Job `deploy-dev` ou `deploy-prod` falha
- CloudFormation mostra erro

**Possíveis causas:**
1. Recurso já existe
2. Permissões insuficientes
3. Limite de recursos atingido
4. Configuração inválida

**Solução:**

```powershell
# 1. Verificar logs do CloudFormation
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-dev `
  --max-items 20 `
  --region us-east-1

# 2. Identificar recurso problemático
# 3. Corrigir configuração ou deletar recurso manualmente
# 4. Tentar deploy novamente
```

**Documentação completa**: [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)

### Problema: Deploy completou mas API não responde

**Sintomas:**
- Deploy mostra sucesso
- Smoke tests falham
- API retorna 500 ou timeout

**Possíveis causas:**
1. Lambda com erro de runtime
2. Problema de conectividade com Aurora
3. Secrets Manager não configurado
4. VPC/Security Group incorreto

**Solução:**

```powershell
# 1. Verificar logs da Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# 2. Testar conectividade com Aurora
# (via Lambda console ou script)

# 3. Verificar secrets
aws secretsmanager list-secrets --region us-east-1

# 4. Se necessário, fazer rollback
git revert HEAD
git push origin main
```

### Problema: Aprovação de deploy prod não aparece

**Sintomas:**
- Job `deploy-prod` não solicita aprovação
- Deploy executa direto ou falha

**Possíveis causas:**
1. Environment `prod` não configurado
2. Nome do environment incorreto no workflow
3. Revisores não configurados

**Solução:**

```powershell
# 1. Verificar configuração do environment no GitHub
# Settings → Environments → prod

# 2. Verificar workflow
# .github/workflows/ci-cd-alquimistaai.yml
# Deve ter:
#   environment:
#     name: prod

# 3. Adicionar revisores no environment
# Settings → Environments → prod → Required reviewers
```

**Documentação**: [CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md) → Seção "Configuração do Environment prod"

### Problema: Smoke tests falhando após deploy

**Sintomas:**
- Deploy completou com sucesso
- Script de smoke tests falha

**Possíveis causas:**
1. API ainda não está pronta (cold start)
2. Endpoint mudou
3. Autenticação necessária
4. Problema real na API

**Solução:**

```powershell
# 1. Aguardar 1-2 minutos (cold start)
Start-Sleep -Seconds 120

# 2. Tentar novamente
.\scripts\smoke-tests-api-dev.ps1

# 3. Testar manualmente
curl https://api-dev.alquimista.ai/health

# 4. Verificar logs da Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1
```

---

## Recursos Adicionais

### Scripts Úteis

| Script | Função | Quando Usar |
|--------|--------|-------------|
| `validate-system-complete.ps1` | Validação completa do sistema | Antes de qualquer deploy |
| `smoke-tests-api-dev.ps1` | Testa endpoints das APIs | Após deploy em dev |
| `validate-migrations-aurora.ps1` | Valida migrations | Após aplicar migrations |
| `manual-rollback-guided.ps1` | Guia de rollback | Problemas pós-deploy |

### Documentação Relacionada

- [CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md) - Índice central do pipeline
- [CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md) - Guia mestre completo
- [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md) - Procedimentos de rollback
- [VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md) - Scripts de validação

### Links Úteis

- [GitHub Actions - Repositório](https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions)
- [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
- [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
- [AWS Lambda Console](https://console.aws.amazon.com/lambda/)

---

## Conclusão

Este guia fornece os fluxos práticos para executar e validar deploys em dev e prod. Lembre-se:

- ✅ **Dev**: Automático, rápido, para iteração
- ✅ **Prod**: Manual, protegido, com validação completa
- ✅ **Sempre validar**: Smoke tests + monitoramento
- ✅ **Estar preparado**: Plano de rollback sempre pronto

**Próximos Passos:**

1. Configure a variável `AWS_ACCOUNT_ID` no GitHub
2. Configure o environment `prod` com revisores
3. Faça um deploy de teste em dev
4. Valide o fluxo completo
5. Documente qualquer ajuste necessário

---

**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI
