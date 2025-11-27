# ✅ Checklist de Deploy - Micro Agente de Disparos & Agendamentos

## Fase 1: Preparação do Ambiente

### 1.1. Pré-requisitos

- [ ] Node.js 20+ instalado
- [ ] AWS CLI configurado
- [ ] Credenciais AWS com permissões adequadas
- [ ] Acesso ao Aurora PostgreSQL
- [ ] PowerShell 7+ (para scripts)

### 1.2. Verificar Estrutura

```powershell
# Verificar que os diretórios existem
Test-Path .kiro\specs\micro-agente-disparo-agendamento
Test-Path lambda-src\agente-disparo-agenda
```

---

## Fase 2: Setup do Banco de Dados

### 2.1. Conectar ao Aurora

```bash
# Obter endpoint do Aurora
aws rds describe-db-clusters \
  --db-cluster-identifier alquimista-aurora-dev \
  --query 'DBClusters[0].Endpoint' \
  --output text
```

### 2.2. Executar Schema

```bash
# Executar schema SQL
psql -h <aurora-endpoint> \
     -U admin \
     -d alquimista \
     -f .kiro/specs/micro-agente-disparo-agendamento/schema-ingestao.sql
```

**Checklist**:
- [ ] Tabela `leads` criada
- [ ] Tabela `lead_telefones` criada
- [ ] Tabela `lead_emails` criada
- [ ] Índices criados
- [ ] Views criadas
- [ ] Função `get_leads_para_disparo` criada

### 2.3. Verificar Criação

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'lead_telefones', 'lead_emails');

-- Verificar views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

---

## Fase 3: Configuração de Secrets

### 3.1. Criar Secrets no AWS Secrets Manager

```powershell
# Executar script de criação
cd .kiro\specs\micro-agente-disparo-agendamento
.\create-secrets.ps1 -Environment dev
```

**Checklist**:
- [ ] Secret `/alquimista/dev/aurora/credentials` criado
- [ ] Secret `/alquimista/dev/mcp/whatsapp` criado
- [ ] Secret `/alquimista/dev/mcp/email` criado

### 3.2. Verificar Secrets

```bash
# Listar secrets
aws secretsmanager list-secrets \
  --region us-east-1 \
  --query "SecretList[?contains(Name, 'alquimista')].Name"
```

---

## Fase 4: Build da Lambda

### 4.1. Instalar Dependências

```powershell
cd lambda-src\agente-disparo-agenda
npm install
```

**Checklist**:
- [ ] `node_modules` criado
- [ ] Todas as dependências instaladas sem erros

### 4.2. Compilar TypeScript

```powershell
npm run build
```

**Checklist**:
- [ ] Diretório `dist` criado
- [ ] Arquivos `.js` gerados
- [ ] Sem erros de compilação

### 4.3. Verificar Build

```powershell
# Verificar estrutura do dist
Get-ChildItem -Path dist -Recurse
```

Deve conter:
- [ ] `dist/ingestao/handler.js`
- [ ] `dist/ingestao/parser.js`
- [ ] `dist/ingestao/validator.js`
- [ ] `dist/ingestao/transformer.js`
- [ ] `dist/ingestao/loader.js`
- [ ] `dist/ingestao/types.js`

---

## Fase 5: Criar Infraestrutura AWS

### 5.1. Criar S3 Bucket de Input

```bash
# Criar bucket
aws s3 mb s3://alquimista-leads-input-dev --region us-east-1

# Habilitar versionamento
aws s3api put-bucket-versioning \
  --bucket alquimista-leads-input-dev \
  --versioning-configuration Status=Enabled
```

**Checklist**:
- [ ] Bucket `alquimista-leads-input-dev` criado
- [ ] Versionamento habilitado

### 5.2. Criar S3 Bucket de Artifacts

```bash
# Criar bucket
aws s3 mb s3://alquimista-lambda-artifacts-dev --region us-east-1
```

**Checklist**:
- [ ] Bucket `alquimista-lambda-artifacts-dev` criado

### 5.3. Criar Lambda Function

```bash
# Criar role IAM (se não existir)
aws iam create-role \
  --role-name alquimista-ingestao-leads-role \
  --assume-role-policy-document file://trust-policy.json

# Anexar políticas
aws iam attach-role-policy \
  --role-name alquimista-ingestao-leads-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole

# Criar Lambda
aws lambda create-function \
  --function-name alquimista-ingestao-leads-dev \
  --runtime nodejs20.x \
  --role arn:aws:iam::<account-id>:role/alquimista-ingestao-leads-role \
  --handler ingestao/handler.handler \
  --timeout 300 \
  --memory-size 1024 \
  --region us-east-1
```

**Checklist**:
- [ ] Role IAM criada
- [ ] Lambda function criada
- [ ] Timeout configurado (300s)
- [ ] Memory configurada (1024MB)

---

## Fase 6: Deploy da Lambda

### 6.1. Executar Script de Deploy

```powershell
cd .kiro\specs\micro-agente-disparo-agendamento
.\build-ingestao-lambda.ps1 -Environment dev
```

**Checklist**:
- [ ] Build executado com sucesso
- [ ] ZIP criado
- [ ] Upload para S3 concluído
- [ ] Lambda atualizada

### 6.2. Verificar Deploy

```bash
# Verificar configuração da Lambda
aws lambda get-function-configuration \
  --function-name alquimista-ingestao-leads-dev \
  --region us-east-1
```

**Checklist**:
- [ ] Runtime: `nodejs20.x`
- [ ] Handler: `ingestao/handler.handler`
- [ ] Timeout: `300`
- [ ] Memory: `1024`

---

## Fase 7: Configurar Trigger S3

### 7.1. Adicionar Permissão

```bash
# Permitir S3 invocar Lambda
aws lambda add-permission \
  --function-name alquimista-ingestao-leads-dev \
  --statement-id s3-trigger \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::alquimista-leads-input-dev \
  --region us-east-1
```

### 7.2. Configurar Notificação S3

```bash
# Criar configuração de notificação
aws s3api put-bucket-notification-configuration \
  --bucket alquimista-leads-input-dev \
  --notification-configuration file://s3-notification.json
```

**s3-notification.json**:
```json
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:<account-id>:function:alquimista-ingestao-leads-dev",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {
              "Name": "suffix",
              "Value": ".xlsx"
            }
          ]
        }
      }
    }
  ]
}
```

**Checklist**:
- [ ] Permissão adicionada
- [ ] Notificação S3 configurada
- [ ] Filtro `.xlsx` aplicado

---

## Fase 8: Configurar Variáveis de Ambiente

### 8.1. Atualizar Lambda com Variáveis

```bash
aws lambda update-function-configuration \
  --function-name alquimista-ingestao-leads-dev \
  --environment Variables="{
    DB_HOST=alquimista-aurora-dev.cluster-xxx.us-east-1.rds.amazonaws.com,
    DB_PORT=5432,
    DB_NAME=alquimista,
    DB_USER=admin,
    DB_PASSWORD=<from-secrets>,
    AWS_REGION=us-east-1,
    EVENT_BUS_NAME=fibonacci-bus-dev
  }" \
  --region us-east-1
```

**Checklist**:
- [ ] `DB_HOST` configurado
- [ ] `DB_PORT` configurado
- [ ] `DB_NAME` configurado
- [ ] `DB_USER` configurado
- [ ] `DB_PASSWORD` configurado
- [ ] `AWS_REGION` configurado
- [ ] `EVENT_BUS_NAME` configurado

---

## Fase 9: Testes

### 9.1. Teste Manual

```powershell
# Upload de arquivo de teste
aws s3 cp test-data\Leads_Organizados.xlsx s3://alquimista-leads-input-dev/test/

# Monitorar logs
aws logs tail /aws/lambda/alquimista-ingestao-leads-dev --follow
```

**Checklist**:
- [ ] Arquivo enviado para S3
- [ ] Lambda foi invocada
- [ ] Logs mostram processamento
- [ ] Sem erros nos logs

### 9.2. Verificar Dados no Banco

```sql
-- Verificar leads criados
SELECT COUNT(*) FROM leads;

-- Verificar telefones
SELECT COUNT(*) FROM lead_telefones;

-- Verificar emails
SELECT COUNT(*) FROM lead_emails;

-- Ver estatísticas
SELECT * FROM v_stats_ingestao;
```

**Checklist**:
- [ ] Leads inseridos no banco
- [ ] Telefones explodidos corretamente
- [ ] Emails explodidos corretamente
- [ ] Estatísticas corretas

### 9.3. Teste de Erro

```powershell
# Upload de arquivo inválido
echo "teste" > invalid.xlsx
aws s3 cp invalid.xlsx s3://alquimista-leads-input-dev/test/

# Verificar tratamento de erro
aws logs tail /aws/lambda/alquimista-ingestao-leads-dev --follow
```

**Checklist**:
- [ ] Erro capturado corretamente
- [ ] Mensagem de erro clara nos logs
- [ ] Lambda não crashou

---

## Fase 10: Monitoramento

### 10.1. Configurar Alarmes CloudWatch

```bash
# Criar alarme de erro
aws cloudwatch put-metric-alarm \
  --alarm-name alquimista-ingestao-errors-dev \
  --alarm-description "Erros na ingestão de leads" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=alquimista-ingestao-leads-dev
```

**Checklist**:
- [ ] Alarme de erros criado
- [ ] Alarme de duração criado
- [ ] Alarme de throttling criado

### 10.2. Criar Dashboard

```bash
# Criar dashboard CloudWatch
aws cloudwatch put-dashboard \
  --dashboard-name alquimista-ingestao-dev \
  --dashboard-body file://dashboard.json
```

**Checklist**:
- [ ] Dashboard criado
- [ ] Métricas de invocação visíveis
- [ ] Métricas de erro visíveis
- [ ] Métricas de duração visíveis

---

## Fase 11: Documentação

### 11.1. Atualizar Documentação

**Checklist**:
- [ ] README.md atualizado com endpoints reais
- [ ] IMPLEMENTATION-STATUS.md criado
- [ ] Variáveis de ambiente documentadas
- [ ] Comandos de deploy documentados

### 11.2. Criar Runbook

**Checklist**:
- [ ] Procedimento de rollback documentado
- [ ] Troubleshooting comum documentado
- [ ] Contatos de suporte documentados

---

## Fase 12: Validação Final

### 12.1. Checklist Geral

- [ ] Banco de dados criado e populado
- [ ] Secrets configurados
- [ ] Lambda deployada e funcionando
- [ ] Trigger S3 configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Testes manuais passando
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

### 12.2. Smoke Test

```powershell
# Executar smoke test completo
.\smoke-test.ps1 -Environment dev
```

**Checklist**:
- [ ] Upload de planilha funciona
- [ ] Processamento completa sem erros
- [ ] Dados aparecem no banco
- [ ] Logs estão corretos
- [ ] Métricas estão sendo publicadas

---

## 🎉 Deploy Completo!

Se todos os itens acima estão marcados, o deploy está completo e o sistema está pronto para uso.

### Próximos Passos

1. Monitorar logs por 24h
2. Validar com planilha real de produção
3. Iniciar Fase 2 (Disparo Automático)

---

**Última atualização**: 2024-11-26  
**Versão**: 1.0.0  
**Mantido por**: Equipe AlquimistaAI
