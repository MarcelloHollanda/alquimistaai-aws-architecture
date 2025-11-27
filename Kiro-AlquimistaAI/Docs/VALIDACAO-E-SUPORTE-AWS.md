# AlquimistaAI – Validação e Suporte Operacional – AWS

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

**Sistema**: AlquimistaAI / Fibonacci Orquestrador B2B  
**Região AWS**: us-east-1  
**Data**: 17 de novembro de 2025

---

## 🎯 Visão Geral

Este documento descreve os scripts de validação e suporte operacional criados para facilitar a manutenção e troubleshooting do sistema AlquimistaAI na AWS.

### Scripts Disponíveis

| Script | Propósito | Quando Usar |
|--------|-----------|-------------|
| `validate-migrations-aurora.ps1` | Valida estado de migrations no Aurora | Antes/depois de aplicar migrations |
| `smoke-tests-api-dev.ps1` | Testa endpoints das APIs | Após deploy, para validar funcionamento |
| `manual-rollback-guided.ps1` | Guia para rollback seguro | Em caso de problemas pós-deploy |
| `validate-system-complete.ps1` | Validação completa do sistema | Antes de qualquer deploy |

---

## 📊 Script 1: validate-migrations-aurora.ps1

### Propósito

Validar o estado real do banco Aurora vs migrations esperadas, garantindo consistência com a decisão oficial:
- Migrations 001-008, 010 aplicadas
- Migration 009 PULADA (duplicada)

### Uso

#### Opção 1: Variáveis de Ambiente

```powershell
# Configurar variáveis
$env:PGHOST = "<host_aurora_dev>"
$env:PGUSER = "<usuario_dev>"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "<senha_dev>"

# Executar validação
.\scripts\validate-migrations-aurora.ps1
```

#### Opção 2: Parâmetros

```powershell
.\scripts\validate-migrations-aurora.ps1 `
    -Host "<host_aurora_dev>" `
    -User "<usuario_dev>" `
    -Database "alquimista_dev" `
    -Password "<senha_dev>"
```

#### Opção 3: AWS Secrets Manager

```powershell
.\scripts\validate-migrations-aurora.ps1 `
    -SecretName "/alquimista/dev/aurora/credentials"
```

### O Que o Script Valida

1. **Conexão com Aurora**
   - Testa conectividade
   - Verifica versão do PostgreSQL

2. **Tabela de Migrations**
   - Verifica se `public.migrations` existe
   - Lista migrations aplicadas

3. **Migrations Esperadas**
   - ✅ 001-008, 010 devem estar aplicadas
   - ❌ 009 NÃO deve estar aplicada (duplicada)

4. **Schemas Criados**
   - `fibonacci_core`
   - `nigredo_leads`
   - `alquimista_platform`

### Saída Esperada

```
========================================
VALIDAÇÃO DE MIGRATIONS - AURORA
========================================

Configuração:
  Host: alquimista-dev.cluster-xxx.us-east-1.rds.amazonaws.com
  User: alquimista_admin
  Database: alquimista_dev
  Port: 5432

Testando conexão com Aurora...
✅ Conexão OK
   Versão: PostgreSQL 15.4 on x86_64-pc-linux-gnu

========================================
VALIDANDO ESTADO DAS MIGRATIONS
========================================

Verificando tabela public.migrations...
✅ Tabela public.migrations existe

Buscando migrations aplicadas...
✅ Migrations aplicadas no banco: 9

========================================
ANÁLISE DETALHADA
========================================

✅ Migration 001 - Schemas base
   Arquivo: 001_initial_schema.sql
   Status: Aplicada (conforme esperado)

✅ Migration 002 - Tabelas Nigredo Leads
   Arquivo: 002_tenants_users.sql
   Status: Aplicada (conforme esperado)

...

✅ Migration 009 - DUPLICADA - NÃO APLICAR
   Arquivo: 009_create_subscription_tables.sql
   Status: NÃO APLICADA (conforme esperado - duplicada)

✅ Migration 010 - Estrutura de planos
   Arquivo: 010_create_plans_structure.sql
   Status: Aplicada (conforme esperado)

========================================
VALIDANDO SCHEMAS
========================================

✅ Schema: fibonacci_core
✅ Schema: nigredo_leads
✅ Schema: alquimista_platform

========================================
RESUMO DA VALIDAÇÃO
========================================
Migrations OK: 10
Erros: 0
Avisos: 0

✅ ESTADO DO BANCO CONSISTENTE COM O FLUXO OFICIAL!

Migrations aplicadas: 001-008, 010 (009 pulada)
Schemas criados: fibonacci_core, nigredo_leads, alquimista_platform

O banco está pronto para uso.
========================================
```

### Códigos de Saída

- `0`: Validação bem-sucedida (com ou sem avisos)
- `1`: Erros encontrados (migrations faltando ou inconsistências)

### Troubleshooting

#### Erro: "psql não encontrado"

**Solução**:
```powershell
# Instalar PostgreSQL Client
choco install postgresql

# OU baixar de: https://www.postgresql.org/download/windows/
```

#### Erro: "Não foi possível conectar ao Aurora"

**Possíveis causas**:
1. Credenciais incorretas
2. Security Group não permite conexão
3. Aurora não está acessível da sua rede

**Solução**:
```powershell
# Verificar credenciais
echo $env:PGHOST
echo $env:PGUSER
echo $env:PGDATABASE

# Testar conexão manualmente
psql -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -c "SELECT version();"
```

#### Aviso: "Migration 009 aplicada (não deveria)"

**Impacto**: Baixo - migration 009 é duplicada com 008, mas não causa problemas críticos

**Ação**: Pode manter ou reverter (opcional)

---

## 🧪 Script 2: smoke-tests-api-dev.ps1

### Propósito

Executar testes rápidos (smoke tests) para garantir que os serviços principais respondem corretamente após deploy.

### Uso

#### Busca Automática de URLs

```powershell
# O script busca URLs automaticamente dos stacks CDK
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

#### URLs Manuais

```powershell
.\scripts\smoke-tests-api-dev.ps1 `
    -Environment dev `
    -BaseUrlFibonacci "https://xxx.execute-api.us-east-1.amazonaws.com" `
    -BaseUrlNigredo "https://yyy.execute-api.us-east-1.amazonaws.com"
```

#### Modo Verbose

```powershell
# Mostra detalhes completos das respostas
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose
```

#### Pular Testes Específicos

```powershell
# Pular testes do Fibonacci
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -SkipFibonacci

# Pular testes do Nigredo
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -SkipNigredo
```

### Testes Executados

#### Fibonacci Orquestrador

1. **Health Check**
   - Endpoint: `GET /health`
   - Esperado: Status 200, JSON com `"ok": true`

2. **Listar Agentes**
   - Endpoint: `GET /api/agents`
   - Esperado: Status 200, JSON com `"agents"`

3. **Listar Planos**
   - Endpoint: `GET /api/plans`
   - Esperado: Status 200, JSON com `"plans"`

4. **Listar SubNúcleos**
   - Endpoint: `GET /api/subnucleos`
   - Esperado: Status 200, JSON com `"subnucleos"`

#### Nigredo (Prospecção)

1. **Health Check**
   - Endpoint: `GET /api/nigredo/health`
   - Esperado: Status 200, JSON com `"ok": true`

2. **Status do Pipeline**
   - Endpoint: `GET /api/nigredo/pipeline/status`
   - Esperado: Status 200

3. **Métricas do Pipeline**
   - Endpoint: `GET /api/nigredo/pipeline/metrics`
   - Esperado: Status 200

### Saída Esperada

```
========================================
SMOKE TESTS - APIs ALQUIMISTA.AI
Ambiente: dev
========================================

Buscando URL da API Fibonacci...
✅ URL encontrada: https://xxx.execute-api.us-east-1.amazonaws.com

Buscando URL da API Nigredo...
✅ URL encontrada: https://yyy.execute-api.us-east-1.amazonaws.com

========================================
FIBONACCI ORQUESTRADOR - SMOKE TESTS
========================================

🧪 Teste: Fibonacci - Health Check
   URL: https://xxx.execute-api.us-east-1.amazonaws.com/health
   Método: GET
   ✅ Status: 200 (esperado: 200)
   ✅ Conteúdo contém padrão esperado
   ✅ Resposta JSON válida

🧪 Teste: Fibonacci - Listar Agentes
   URL: https://xxx.execute-api.us-east-1.amazonaws.com/api/agents
   Método: GET
   ✅ Status: 200 (esperado: 200)
   ✅ Conteúdo contém padrão esperado
   ✅ Resposta JSON válida

...

========================================
RESUMO DOS SMOKE TESTS
========================================
Total de testes: 7
Testes passados: 7
Testes falhados: 0
Testes pulados: 0

✅ TODOS OS TESTES PASSARAM!

As APIs estão respondendo corretamente.
O sistema está pronto para uso.
========================================
```

### Códigos de Saída

- `0`: Todos os testes passaram
- `1`: Um ou mais testes falharam

### Troubleshooting

#### Erro: "Não foi possível buscar outputs do stack"

**Solução**:
```powershell
# Verificar se stack existe
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --region us-east-1

# Fornecer URL manualmente
.\scripts\smoke-tests-api-dev.ps1 -BaseUrlFibonacci "<url>"
```

#### Erro: "Status 500" em algum endpoint

**Ações**:
1. Verificar logs do CloudWatch
2. Validar migrations do banco
3. Verificar conectividade Lambda <-> Aurora

```powershell
# Ver logs da Lambda
aws logs tail /aws/lambda/fibonacci-list-agents-dev --follow --region us-east-1

# Validar migrations
.\scripts\validate-migrations-aurora.ps1

# Verificar Security Groups
aws ec2 describe-security-groups --region us-east-1
```

---

## 🔄 Script 3: manual-rollback-guided.ps1

### Propósito

Guiar o operador através de um processo seguro de rollback, sem executar comandos automáticos perigosos.

### Uso

#### Modo Interativo

```powershell
# Guia completo interativo
.\scripts\manual-rollback-guided.ps1 -Environment dev
```

#### Mostrar Histórico de Commits

```powershell
# Ver últimos 20 commits
.\scripts\manual-rollback-guided.ps1 -ShowCommitHistory
```

#### Com Commit Alvo

```powershell
# Especificar commit para rollback
.\scripts\manual-rollback-guided.ps1 `
    -Environment prod `
    -TargetCommit "abc123def"
```

#### Apenas Verificar Estado

```powershell
# Verificar estado sem guiar rollback
.\scripts\manual-rollback-guided.ps1 -Environment dev -CheckOnly
```

### Cenários Cobertos

#### Cenário 1: Deploy Falhou Durante CDK

**Situação**: CloudFormation retornou erro durante deploy

**Ação Recomendada**:
- ✅ CloudFormation faz rollback automático
- Identificar recurso que falhou
- Corrigir código
- Fazer novo deploy

**Comandos**:
```powershell
# Ver eventos do stack
aws cloudformation describe-stack-events --stack-name <stack-name> --region us-east-1

# Corrigir e re-deploy
npm run build
cdk deploy <stack-name> --context env=dev
```

#### Cenário 2: API Retornando Erros

**Situação**: Deploy passou, mas API retorna 500

**Ação Recomendada**:
1. Verificar logs do CloudWatch
2. Executar smoke tests
3. Validar migrations
4. Se crítico, fazer rollback

**Comandos**:
```powershell
# Diagnóstico
aws logs tail /aws/lambda/<function-name> --follow --region us-east-1
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose
.\scripts\validate-migrations-aurora.ps1

# Rollback (se necessário)
git checkout <commit-anterior>
npm run build
cdk deploy --all --context env=dev
```

#### Cenário 3: Funcionalidade Quebrada

**Situação**: Deploy passou, mas funcionalidade não funciona

**Ação Recomendada**:
- Avaliar severidade
- Crítico: Rollback imediato
- Não crítico: Hotfix e novo deploy

**Comandos**:
```powershell
# Rollback imediato
git checkout <commit-estavel>
npm install
npm run build
cdk deploy --all --context env=prod --require-approval never

# Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment prod
```

#### Cenário 4: Problema com Migrations

**Situação**: Migration causou problema no banco

**Ação Recomendada**:
- ⚠️ CUIDADO: Rollback de migrations é delicado
- Verificar estado atual
- Criar migration de rollback
- Testar em dev primeiro

**Comandos**:
```powershell
# Verificar estado
.\scripts\validate-migrations-aurora.ps1

# Ver migrations aplicadas
psql -c "SELECT * FROM public.migrations ORDER BY applied_at DESC LIMIT 5;"

# Criar e aplicar rollback (com cuidado!)
psql -f database/migrations/0XX_rollback_YYY.sql
```

### Checklist de Segurança

Antes de executar qualquer rollback:

- [ ] Backup do banco de dados foi feito?
- [ ] Ambiente correto (dev/prod)?
- [ ] Stakeholders foram notificados?
- [ ] Janela de manutenção foi agendada (se prod)?
- [ ] Plano de rollback foi revisado?
- [ ] Testes de validação estão prontos?

### Comandos Úteis

```powershell
# Verificar estado dos stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --region us-east-1

# Ver diff antes de deploy
cdk diff <stack-name> --context env=dev

# Deploy com aprovação manual
cdk deploy <stack-name> --context env=dev

# Deploy sem aprovação (cuidado!)
cdk deploy <stack-name> --context env=dev --require-approval never

# Validar após rollback
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

---

## 🔗 Integração com CI/CD

### ✅ Integração Automática Implementada

Os scripts de validação estão **totalmente integrados** ao pipeline CI/CD do GitHub Actions.

#### Validação Pré-Deploy (Automática)

No job `build-and-validate`, antes de qualquer deploy:

```yaml
- name: Validar Migrations Aurora (Pré-Deploy)
  shell: pwsh
  run: |
    # Valida estrutura das migrations localmente
    # Verifica nomenclatura e padrões
    # Bloqueia deploy se houver problemas
```

**O que é validado:**
- ✅ Diretório de migrations existe
- ✅ Arquivos seguem padrão de nomenclatura (001_*.sql)
- ✅ Estrutura de migrations está consistente

**Quando bloqueia:**
- ❌ Migrations com nomenclatura incorreta
- ❌ Diretório de migrations não encontrado

#### Validação Pós-Deploy DEV (Automática)

Após o deploy em dev, o job `smoke-tests-dev` executa automaticamente:

```yaml
- name: Executar Smoke Tests
  shell: pwsh
  run: |
    .\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose
```

**O que é testado:**
- ✅ Health check das APIs (Fibonacci e Nigredo)
- ✅ Endpoints principais funcionando
- ✅ Respostas JSON válidas
- ✅ Status codes corretos

**Quando falha:**
- ❌ API não responde
- ❌ Endpoints retornam erro
- ❌ Timeout de conexão

**Em caso de falha:**
- Workflow marca como falho
- Logs mostram detalhes do erro
- Mensagem orienta para rollback:
  - `docs/ROLLBACK-OPERACIONAL-AWS.md`
  - `.\scripts\manual-rollback-guided.ps1 -Environment dev`

#### Validação Pós-Deploy PROD (Automática)

Após o deploy em prod, o job `smoke-tests-prod` executa automaticamente:

```yaml
- name: Executar Smoke Tests
  shell: pwsh
  run: |
    # Aguarda 30 segundos para estabilização
    Start-Sleep -Seconds 30
    
    # Executa smoke tests em prod
    .\scripts\smoke-tests-api-dev.ps1 -Environment prod -Verbose
```

**Diferenças do DEV:**
- ⏳ Aguarda 30 segundos antes de testar (cold start)
- ⚠️ Mensagens de erro mais críticas
- 🚨 Orienta notificação imediata da equipe

### Fluxo Completo no CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│ 1. build-and-validate                                       │
│    ├─ Build TypeScript                                      │
│    ├─ Validar sistema                                       │
│    ├─ ✅ Validar migrations (pré-deploy)                    │
│    └─ CDK synth                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. deploy-dev (se push para main)                          │
│    ├─ Configurar AWS OIDC                                   │
│    ├─ Deploy CDK (todas as stacks)                         │
│    └─ Verificar recursos                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. smoke-tests-dev (automático após deploy-dev)            │
│    ├─ Configurar AWS OIDC                                   │
│    ├─ ✅ Executar smoke tests                               │
│    ├─ Validar APIs (Fibonacci + Nigredo)                   │
│    └─ Se falhar: Orientar rollback                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. deploy-prod (manual/tag + aprovação)                    │
│    ├─ Aguardar aprovação manual                            │
│    ├─ Configurar AWS OIDC                                   │
│    ├─ CDK diff (visualizar mudanças)                       │
│    ├─ Deploy CDK (todas as stacks)                         │
│    └─ Verificar recursos                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. smoke-tests-prod (automático após deploy-prod)          │
│    ├─ Aguardar 30s (estabilização)                         │
│    ├─ Configurar AWS OIDC                                   │
│    ├─ ✅ Executar smoke tests                               │
│    ├─ Validar APIs (Fibonacci + Nigredo)                   │
│    └─ Se falhar: Alerta crítico + orientar rollback        │
└─────────────────────────────────────────────────────────────┘
```

### Validação Manual (Quando Necessário)

Para validações manuais ou troubleshooting:

#### Validar Migrations com Conexão ao Banco

```powershell
# Validar migrations no Aurora DEV
.\scripts\validate-migrations-aurora.ps1

# Com credenciais explícitas
.\scripts\validate-migrations-aurora.ps1 `
    -Host "<aurora-host>" `
    -User "<user>" `
    -Database "<database>" `
    -Password "<password>"

# Usando Secrets Manager
.\scripts\validate-migrations-aurora.ps1 `
    -SecretName "/alquimista/dev/aurora/credentials"
```

#### Executar Smoke Tests Manualmente

```powershell
# Smoke tests em DEV
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose

# Smoke tests em PROD
.\scripts\smoke-tests-api-dev.ps1 -Environment prod -Verbose

# Com URLs específicas
.\scripts\smoke-tests-api-dev.ps1 `
    -Environment dev `
    -BaseUrlFibonacci "https://xxx.execute-api.us-east-1.amazonaws.com" `
    -BaseUrlNigredo "https://yyy.execute-api.us-east-1.amazonaws.com"
```

### Benefícios da Integração Automática

✅ **Detecção Precoce de Problemas**
- Migrations validadas antes do deploy
- APIs testadas imediatamente após deploy
- Falhas detectadas em minutos, não horas

✅ **Rollback Mais Rápido**
- Problema identificado automaticamente
- Logs detalhados disponíveis
- Orientação clara para rollback

✅ **Confiança no Deploy**
- Deploy só é considerado sucesso se testes passarem
- Validação consistente em todos os ambientes
- Menos surpresas em produção

✅ **Documentação Viva**
- Logs do CI/CD documentam cada deploy
- Histórico de testes disponível
- Rastreabilidade completa

---

## 📚 Documentação Relacionada

### Documentos Principais

1. **`database/RESUMO-AURORA-OFICIAL.md`**
   - Visão geral do Aurora PostgreSQL
   - Estrutura de migrations
   - Comandos de manutenção

2. **`database/COMANDOS-RAPIDOS-AURORA.md`**
   - Comandos passo a passo para Windows
   - Troubleshooting específico
   - Validação pós-aplicação

3. **`docs/ROLLBACK-OPERACIONAL-AWS.md`**
   - Procedimentos detalhados de rollback
   - Cenários específicos
   - Estratégias de recuperação

4. **`docs/CI-CD-PIPELINE-ALQUIMISTAAI.md`**
   - Arquitetura do pipeline
   - Fluxos de deploy
   - Integração com guardrails

### Scripts Relacionados

- **`scripts/apply-migrations-aurora-dev.ps1`**
  - Aplica migrations em Aurora DEV
  - Segue ordem oficial (001-008, 010)

- **`scripts/validate-system-complete.ps1`**
  - Validação completa do sistema
  - Verifica migrations, seeds, handlers, frontend

---

## 🎯 Fluxo Recomendado

### Antes de Deploy

```powershell
# 1. Validar sistema completo
.\scripts\validate-system-complete.ps1

# 2. Verificar estado do banco (se aplicável)
.\scripts\validate-migrations-aurora.ps1

# 3. Fazer deploy
cdk deploy --all --context env=dev
```

### Após Deploy

```powershell
# 1. Executar smoke tests
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose

# 2. Validar migrations (se aplicável)
.\scripts\validate-migrations-aurora.ps1

# 3. Testar funcionalidades críticas manualmente
```

### Em Caso de Problema

```powershell
# 1. Executar guia de rollback
.\scripts\manual-rollback-guided.ps1 -Environment dev

# 2. Seguir instruções do guia

# 3. Validar após rollback
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
.\scripts\validate-migrations-aurora.ps1
```

---

## 🔧 Manutenção dos Scripts

### Atualizar Migrations Esperadas

Se novas migrations forem adicionadas, atualizar em `validate-migrations-aurora.ps1`:

```powershell
$expectedMigrations = @(
    # ... migrations existentes ...
    @{Number="011"; File="011_nova_migration.sql"; Description="Nova feature"; Expected=$true}
)
```

### Adicionar Novos Endpoints aos Smoke Tests

Em `smoke-tests-api-dev.ps1`:

```powershell
# Adicionar novo teste
Invoke-SmokeTest `
    -Name "Fibonacci - Novo Endpoint" `
    -Url "$BaseUrlFibonacci/api/novo-endpoint" `
    -ExpectedStatus 200 `
    -ExpectedContentPattern '"data"'
```

### Adicionar Novo Cenário de Rollback

Em `manual-rollback-guided.ps1`, adicionar novo case no switch:

```powershell
"6" {
    Write-Host "CENÁRIO 6: NOVO CENÁRIO" -ForegroundColor Cyan
    # ... instruções ...
}
```

---

## 📞 Suporte

### Problemas Comuns

1. **Script não executa**
   - Verificar ExecutionPolicy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

2. **Erro de conexão com Aurora**
   - Verificar Security Groups
   - Verificar credenciais
   - Verificar conectividade de rede

3. **Smoke tests falhando**
   - Verificar logs do CloudWatch
   - Validar migrations
   - Verificar configuração de variáveis de ambiente

### Contato

- **Documentação**: Consulte docs/ para mais informações
- **Issues**: Abra issue no repositório GitHub
- **Equipe**: Consulte equipe de infraestrutura

---

**Última atualização**: 17 de novembro de 2025  
**Versão**: 1.0  
**Status**: ✅ DOCUMENTO OFICIAL
