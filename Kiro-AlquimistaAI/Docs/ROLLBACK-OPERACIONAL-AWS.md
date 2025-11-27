# AlquimistaAI – Rollback Operacional – AWS

> **⚠️ ARQUITETURA OFICIAL**: Lambda + API Gateway + Aurora PostgreSQL + DynamoDB (AWS).  
> Supabase = legado/laboratório, não faz parte do fluxo de produção.

**Sistema**: AlquimistaAI / Fibonacci Orquestrador B2B  
**Região AWS**: us-east-1  
**Data**: 17 de novembro de 2025

---

## 🎯 Visão Geral

Este documento descreve procedimentos detalhados de rollback para o sistema AlquimistaAI na AWS, cobrindo diferentes cenários e estratégias de recuperação.

### Princípios de Rollback

1. **Segurança Primeiro**: Sempre fazer backup antes de rollback
2. **Validação**: Testar rollback em dev antes de prod
3. **Comunicação**: Notificar stakeholders antes de rollback em prod
4. **Documentação**: Registrar todas as ações executadas
5. **Validação Pós-Rollback**: Sempre validar funcionamento após rollback

---

## 📊 Matriz de Decisão de Rollback

| Cenário | Severidade | Ação Imediata | Rollback Necessário? |
|---------|------------|---------------|----------------------|
| Deploy CDK falhou | Baixa | Aguardar rollback automático | Não (CloudFormation reverte) |
| API retorna 500 | Alta | Investigar logs | Depende da causa |
| Funcionalidade quebrada | Média-Alta | Avaliar impacto | Sim, se crítico |
| Migration problemática | Crítica | Parar aplicação | Sim, com cuidado |
| Frontend quebrado | Média | Rollback S3/CloudFront | Sim |
| Problema de performance | Média | Investigar métricas | Não imediato |

---

## 🔧 Cenário 1: Deploy CDK Falhou

### Sintomas

- CloudFormation retorna erro durante deploy
- Stack fica em estado `ROLLBACK_IN_PROGRESS` ou `UPDATE_ROLLBACK_COMPLETE`
- Recursos não são criados/atualizados

### Diagnóstico

```powershell
# Verificar estado do stack
aws cloudformation describe-stacks `
    --stack-name FibonacciStack-dev `
    --query "Stacks[0].StackStatus" `
    --region us-east-1

# Ver eventos do stack (últimos 50)
aws cloudformation describe-stack-events `
    --stack-name FibonacciStack-dev `
    --max-items 50 `
    --region us-east-1
```

### Ação

✅ **BOA NOTÍCIA**: CloudFormation faz rollback automático!

**Passos**:

1. **Aguardar rollback automático**
   ```powershell
   # Monitorar progresso
   aws cloudformation describe-stacks `
       --stack-name FibonacciStack-dev `
       --query "Stacks[0].StackStatus" `
       --region us-east-1
   ```

2. **Identificar causa da falha**
   ```powershell
   # Buscar eventos com falha
   aws cloudformation describe-stack-events `
       --stack-name FibonacciStack-dev `
       --region us-east-1 | `
       Select-String "FAILED"
   ```

3. **Corrigir código**
   - Editar arquivo CDK correspondente
   - Executar `npm run build`
   - Validar com `cdk synth`

4. **Fazer novo deploy**
   ```powershell
   cdk deploy FibonacciStack-dev --context env=dev
   ```

### Validação

```powershell
# Verificar que stack está OK
aws cloudformation describe-stacks `
    --stack-name FibonacciStack-dev `
    --query "Stacks[0].StackStatus" `
    --region us-east-1

# Executar smoke tests
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

---

## 🔧 Cenário 2: API Retornando Erros (500)

### Sintomas

- Endpoints retornam HTTP 500
- Smoke tests falham
- Logs mostram erros de execução

### Diagnóstico

```powershell
# Ver logs da Lambda
aws logs tail /aws/lambda/fibonacci-list-agents-dev `
    --follow `
    --region us-east-1

# Executar smoke tests com verbose
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose

# Validar migrations
.\scripts\validate-migrations-aurora.ps1
```

### Possíveis Causas

1. **Migrations não aplicadas**
   - Solução: Aplicar migrations faltantes

2. **Erro de código na Lambda**
   - Solução: Rollback para versão anterior

3. **Problema de conectividade Aurora**
   - Solução: Verificar Security Groups e VPC

4. **Variáveis de ambiente incorretas**
   - Solução: Corrigir env vars na Lambda

### Ação: Rollback de Código

```powershell
# 1. Identificar commit anterior estável
git log --oneline --graph -20

# 2. Checkout do commit
git checkout <commit-hash-estavel>

# 3. Reinstalar dependências
npm install

# 4. Rebuild
npm run build

# 5. Deploy
cdk deploy --all --context env=dev --require-approval never

# 6. Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

### Ação: Corrigir Migrations

```powershell
# 1. Verificar estado
.\scripts\validate-migrations-aurora.ps1

# 2. Aplicar migrations faltantes
.\scripts\apply-migrations-aurora-dev.ps1

# 3. Validar novamente
.\scripts\validate-migrations-aurora.ps1

# 4. Testar API
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

### Validação

```powershell
# Smoke tests devem passar
.\scripts\smoke-tests-api-dev.ps1 -Environment dev

# Verificar logs (não deve ter erros)
aws logs tail /aws/lambda/fibonacci-list-agents-dev --region us-east-1

# Testar endpoints manualmente
Invoke-WebRequest -Uri "https://<api-url>/health" -Method GET
```

---

## 🔧 Cenário 3: Funcionalidade Quebrada

### Sintomas

- Deploy passou sem erros
- API responde, mas funcionalidade não funciona
- Usuários reportam problemas

### Diagnóstico

```powershell
# Verificar logs de aplicação
aws logs tail /aws/lambda/<function-name> --follow --region us-east-1

# Verificar métricas CloudWatch
aws cloudwatch get-metric-statistics `
    --namespace AWS/Lambda `
    --metric-name Errors `
    --dimensions Name=FunctionName,Value=<function-name> `
    --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
    --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
    --period 300 `
    --statistics Sum `
    --region us-east-1
```

### Avaliação de Severidade

#### Crítico (Rollback Imediato)
- Funcionalidade core quebrada
- Perda de dados
- Segurança comprometida
- Ambiente de produção afetado

#### Não Crítico (Hotfix)
- Funcionalidade secundária
- Ambiente de dev/staging
- Workaround disponível

### Ação: Rollback Imediato (Crítico)

```powershell
# 1. Notificar stakeholders
# Enviar email/Slack informando sobre rollback

# 2. Identificar último commit estável
git log --oneline --graph -20

# 3. Criar branch de rollback (opcional, para rastreabilidade)
git checkout -b rollback/prod-$(Get-Date -Format 'yyyyMMdd-HHmmss')

# 4. Checkout do commit estável
git checkout <commit-hash-estavel>

# 5. Reinstalar dependências
npm install

# 6. Rebuild
npm run build

# 7. Validar localmente
.\scripts\validate-system-complete.ps1

# 8. Deploy em prod
cdk deploy --all --context env=prod --require-approval never

# 9. Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment prod

# 10. Notificar conclusão
# Enviar email/Slack confirmando rollback
```

### Ação: Hotfix (Não Crítico)

```powershell
# 1. Criar branch de hotfix
git checkout -b hotfix/descricao-do-problema

# 2. Corrigir problema
# Editar arquivos necessários

# 3. Testar localmente
npm run build
.\scripts\validate-system-complete.ps1

# 4. Commit e push
git add .
git commit -m "hotfix: descrição da correção"
git push origin hotfix/descricao-do-problema

# 5. Criar PR e fazer merge

# 6. Deploy
cdk deploy --all --context env=dev

# 7. Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

### Validação

```powershell
# Funcionalidade deve estar funcionando
# Testar manualmente ou com testes automatizados

# Smoke tests devem passar
.\scripts\smoke-tests-api-dev.ps1 -Environment prod

# Verificar métricas CloudWatch
# Não deve haver picos de erros
```

---

## 🔧 Cenário 4: Problema com Migrations

### Sintomas

- Erro ao executar queries
- Tabelas/colunas faltando
- Dados inconsistentes

### ⚠️ ATENÇÃO

**Rollback de migrations é DELICADO e pode causar perda de dados!**

### Diagnóstico

```powershell
# 1. Verificar estado das migrations
.\scripts\validate-migrations-aurora.ps1

# 2. Ver migrations aplicadas
psql -c "SELECT * FROM public.migrations ORDER BY applied_at DESC LIMIT 10;"

# 3. Verificar estrutura do banco
psql -c "\dt fibonacci_core.*"
psql -c "\dt nigredo_leads.*"
psql -c "\dt alquimista_platform.*"
```

### Tipos de Migrations e Rollback

#### Tipo 1: Migration Adicionou Tabelas/Colunas (Seguro)

**Exemplo**: Migration 010 adicionou tabela `subnucleos`

**Rollback**:
```sql
-- database/migrations/011_rollback_010.sql
BEGIN;

-- Remover tabelas na ordem inversa
DROP TABLE IF EXISTS public.tenant_agents CASCADE;
DROP TABLE IF EXISTS public.tenant_subnucleos CASCADE;
DROP TABLE IF EXISTS public.subnucleo_agents CASCADE;
DROP TABLE IF EXISTS public.subnucleos CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Remover registro da migration
DELETE FROM public.migrations WHERE migration_name = '010_create_plans_structure.sql';

COMMIT;
```

**Aplicar**:
```powershell
# Fazer backup primeiro!
pg_dump -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -F c -f backup_before_rollback.dump

# Aplicar rollback
psql -f database/migrations/011_rollback_010.sql

# Validar
.\scripts\validate-migrations-aurora.ps1
```

#### Tipo 2: Migration Modificou Dados (PERIGOSO)

**Exemplo**: Migration atualizou valores em tabela existente

**⚠️ CUIDADO**: Pode causar perda de dados!

**Rollback**:
1. **Restaurar de backup** (recomendado)
   ```powershell
   # Restaurar backup
   pg_restore -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -c backup_before_migration.dump
   ```

2. **Criar migration de reversão** (se possível)
   ```sql
   -- Apenas se houver como reverter sem perda de dados
   BEGIN;
   
   -- Reverter mudanças de dados
   UPDATE tabela SET coluna = valor_anterior WHERE condicao;
   
   -- Remover registro da migration
   DELETE FROM public.migrations WHERE migration_name = 'XXX_migration_problematica.sql';
   
   COMMIT;
   ```

#### Tipo 3: Migration Removeu Colunas/Tabelas (CRÍTICO)

**⚠️ PERDA DE DADOS IRREVERSÍVEL!**

**Rollback**:
- **ÚNICA OPÇÃO**: Restaurar de backup completo
- Não há como recuperar dados deletados sem backup

```powershell
# Restaurar backup completo
pg_restore -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -c backup_completo.dump
```

### Procedimento Seguro de Rollback de Migration

```powershell
# 1. FAZER BACKUP COMPLETO
pg_dump -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -F c -f backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump

# 2. Testar rollback em ambiente de dev PRIMEIRO
# Nunca testar rollback direto em prod!

# 3. Criar migration de rollback
# Editar database/migrations/0XX_rollback_YYY.sql

# 4. Aplicar em dev
psql -h <dev-host> -U <dev-user> -d <dev-db> -f database/migrations/0XX_rollback_YYY.sql

# 5. Validar em dev
.\scripts\validate-migrations-aurora.ps1
.\scripts\smoke-tests-api-dev.ps1 -Environment dev

# 6. Se OK, aplicar em prod (com janela de manutenção)
psql -h <prod-host> -U <prod-user> -d <prod-db> -f database/migrations/0XX_rollback_YYY.sql

# 7. Validar em prod
.\scripts\validate-migrations-aurora.ps1
.\scripts\smoke-tests-api-dev.ps1 -Environment prod
```

### Validação

```powershell
# Verificar estado das migrations
.\scripts\validate-migrations-aurora.ps1

# Verificar estrutura do banco
psql -c "\dt *.*"

# Testar funcionalidade
.\scripts\smoke-tests-api-dev.ps1 -Environment prod

# Verificar integridade dos dados
psql -c "SELECT COUNT(*) FROM <tabela_critica>;"
```

---

## 🔧 Cenário 5: Frontend Quebrado

### Sintomas

- Página não carrega
- Erros de JavaScript no console
- Assets não encontrados (404)

### Diagnóstico

```powershell
# Verificar distribuição CloudFront
aws cloudfront list-distributions --region us-east-1

# Verificar bucket S3
aws s3 ls s3://alquimista-frontend-prod/ --recursive

# Verificar logs CloudFront
aws cloudfront get-distribution-config --id <distribution-id> --region us-east-1
```

### Ação: Rollback Frontend

```powershell
# 1. Identificar versão anterior estável
git log --oneline frontend/ -20

# 2. Checkout do commit
git checkout <commit-hash-estavel>

# 3. Rebuild frontend
cd frontend
npm install
npm run build

# 4. Deploy para S3
npm run deploy

# 5. Invalidar cache CloudFront
aws cloudfront create-invalidation `
    --distribution-id <distribution-id> `
    --paths "/*" `
    --region us-east-1

# 6. Aguardar propagação (5-10 minutos)
Start-Sleep -Seconds 300

# 7. Validar
Invoke-WebRequest -Uri "https://<cloudfront-domain>/" -Method GET
```

### Validação

```powershell
# Acessar URL do frontend
Start-Process "https://<cloudfront-domain>/"

# Verificar console do navegador (não deve ter erros)

# Testar funcionalidades principais
```

---

## 📋 Checklist de Rollback

### Antes do Rollback

- [ ] **Backup criado**
  - Banco de dados: `pg_dump`
  - Código: commit/tag no Git
  - Configurações: documentadas

- [ ] **Stakeholders notificados**
  - Email enviado
  - Slack/Teams atualizado
  - Janela de manutenção agendada (se prod)

- [ ] **Ambiente correto identificado**
  - dev, staging ou prod?
  - Variáveis de ambiente corretas?

- [ ] **Causa raiz identificada**
  - Logs analisados
  - Problema documentado
  - Solução planejada

- [ ] **Plano de rollback revisado**
  - Passos documentados
  - Comandos preparados
  - Validações definidas

### Durante o Rollback

- [ ] **Executar em ordem**
  - Seguir passos do plano
  - Documentar cada ação
  - Não pular etapas

- [ ] **Monitorar progresso**
  - Verificar logs
  - Acompanhar métricas
  - Identificar problemas

- [ ] **Comunicar status**
  - Atualizar stakeholders
  - Reportar progresso
  - Alertar sobre problemas

### Após o Rollback

- [ ] **Validar funcionamento**
  - Smoke tests passam
  - Funcionalidades OK
  - Sem erros nos logs

- [ ] **Verificar dados**
  - Integridade mantida
  - Sem perda de dados
  - Queries funcionando

- [ ] **Notificar conclusão**
  - Email de confirmação
  - Slack/Teams atualizado
  - Documentar lições aprendidas

- [ ] **Planejar correção**
  - Identificar causa raiz
  - Criar issue/ticket
  - Agendar hotfix

---

## 🚨 Situações de Emergência

### Produção Completamente Quebrada

**Ação Imediata**:

1. **Ativar página de manutenção** (se disponível)
2. **Notificar equipe completa**
3. **Executar rollback completo**

```powershell
# Rollback completo (código + banco)
git checkout <ultimo-commit-estavel-prod>
npm install
npm run build

# Deploy de todas as stacks
cdk deploy --all --context env=prod --require-approval never

# Restaurar banco (se necessário)
pg_restore -h <prod-host> -U <prod-user> -d <prod-db> -c backup_ultimo_estavel.dump

# Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment prod
```

### Perda de Dados Detectada

**Ação Imediata**:

1. **PARAR TODAS AS ESCRITAS NO BANCO**
   ```sql
   -- Revogar permissões de escrita temporariamente
   REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM <app_user>;
   ```

2. **Restaurar de backup**
   ```powershell
   pg_restore -h <prod-host> -U <prod-user> -d <prod-db> -c backup_mais_recente.dump
   ```

3. **Investigar causa**
4. **Corrigir problema**
5. **Restaurar permissões**
   ```sql
   GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO <app_user>;
   ```

### Segurança Comprometida

**Ação Imediata**:

1. **Desativar sistema** (se necessário)
2. **Rotacionar credenciais**
   ```powershell
   # Rotacionar secrets no Secrets Manager
   aws secretsmanager rotate-secret --secret-id <secret-id> --region us-east-1
   ```

3. **Investigar escopo do comprometimento**
4. **Aplicar patches de segurança**
5. **Reativar sistema após validação**

---

## 📞 Contatos de Emergência

### Equipe Técnica

- **Infraestrutura**: [email/slack]
- **Backend**: [email/slack]
- **Frontend**: [email/slack]
- **DBA**: [email/slack]

### Escalação

1. **Nível 1**: Equipe de plantão
2. **Nível 2**: Tech Lead
3. **Nível 3**: CTO

### Ferramentas

- **Monitoramento**: CloudWatch, X-Ray
- **Comunicação**: Slack, Email
- **Documentação**: Confluence, GitHub Wiki

---

## 📚 Documentação Relacionada

- **`docs/VALIDACAO-E-SUPORTE-AWS.md`**: Scripts de validação e suporte
- **`database/COMANDOS-RAPIDOS-AURORA.md`**: Comandos Aurora
- **`docs/CI-CD-PIPELINE-ALQUIMISTAAI.md`**: Pipeline CI/CD
- **`scripts/manual-rollback-guided.ps1`**: Guia interativo de rollback

---

**Última atualização**: 17 de novembro de 2025  
**Versão**: 1.0  
**Status**: ✅ DOCUMENTO OFICIAL
