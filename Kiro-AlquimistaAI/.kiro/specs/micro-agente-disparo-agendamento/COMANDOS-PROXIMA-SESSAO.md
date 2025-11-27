# ⚡ Comandos Rápidos - Próxima Sessão

**Para**: Próxima sessão de implementação  
**Objetivo**: Comandos prontos para copy-paste

---

## 📖 Ler Contexto Rapidamente

```bash
# Ver relatório completo da sessão atual
cat .kiro/specs/micro-agente-disparo-agendamento/RELATORIO-SESSAO-ATUAL.md

# Ver resumo visual
cat .kiro/specs/micro-agente-disparo-agendamento/RESUMO-VISUAL-SESSAO.md

# Ver progresso
cat .kiro/specs/micro-agente-disparo-agendamento/PROGRESSO-VISUAL.md

# Ver guia rápido
cat .kiro/specs/micro-agente-disparo-agendamento/QUICK-START.md
```

---

## 🚀 Iniciar Implementação

### Opção 1: Fluxo End-to-End (RECOMENDADO)

```bash
# 1. Criar migrations de banco (2-3h)
cd database/migrations
# Criar arquivos:
# - 016_create_dispatch_queue.sql
# - 017_create_rate_limit_tracker.sql
# - 018_create_meetings.sql
# - 019_create_seller_availability.sql
# - 020_create_calendar_blocks.sql

# 2. Implementar Lambda ingest-contacts (2-3h)
cd lambda-src/agente-disparo-agenda/src
mkdir -p handlers
# Criar: handlers/ingest-contacts.ts

# 3. Implementar Lambda send-messages (3-4h)
# Criar: handlers/send-messages.ts

# 4. Implementar Lambda handle-replies (2-3h)
# Criar: handlers/handle-replies.ts

# 5. Implementar Lambda schedule-meeting (3-4h)
# Criar: handlers/schedule-meeting.ts

# 6. Criar infraestrutura Terraform (4-6h)
cd terraform
mkdir -p modules/agente_disparo_agenda
mkdir -p envs/dev
mkdir -p envs/prod
# Criar arquivos .tf conforme design.md

# 7. Deploy em DEV (1h)
cd terraform/envs/dev
terraform init
terraform plan
terraform apply

# 8. Validar (1-2h)
# Executar smoke tests
# Verificar logs CloudWatch
# Verificar métricas
```

---

## 🔧 Comandos de Desenvolvimento

### Compilar TypeScript

```bash
cd lambda-src/agente-disparo-agenda
npm run build
```

### Gerar ZIPs para Deploy

```bash
cd lambda-src/agente-disparo-agenda
npm run package
```

### Executar Testes

```bash
cd lambda-src/agente-disparo-agenda
npm test
```

### Lint

```bash
cd lambda-src/agente-disparo-agenda
npm run lint
```

---

## 📊 Verificar Status

### Ver Progresso Atual

```bash
# Ver tasks.md com status
cat .kiro/specs/micro-agente-disparo-agendamento/tasks.md | grep -E "^\- \[.\]"

# Contar tarefas completas
cat .kiro/specs/micro-agente-disparo-agendamento/tasks.md | grep -c "^\- \[x\]"

# Contar tarefas pendentes
cat .kiro/specs/micro-agente-disparo-agendamento/tasks.md | grep -c "^\- \[ \]"
```

### Ver Estrutura de Arquivos

```bash
# Ver estrutura TypeScript
tree lambda-src/agente-disparo-agenda/src

# Ver estrutura Terraform
tree terraform/modules/agente_disparo_agenda

# Ver migrations
ls -la database/migrations/0{16,17,18,19,20}*
```

---

## 🗄️ Banco de Dados

### Aplicar Migrations em DEV

```bash
# Conectar ao Aurora DEV
psql -h <aurora-dev-endpoint> -U <user> -d alquimista_dev

# Aplicar migration
\i database/migrations/016_create_dispatch_queue.sql
\i database/migrations/017_create_rate_limit_tracker.sql
\i database/migrations/018_create_meetings.sql
\i database/migrations/019_create_seller_availability.sql
\i database/migrations/020_create_calendar_blocks.sql

# Verificar tabelas criadas
\dt nigredo.*

# Verificar índices
\di nigredo.*
```

### Rollback (se necessário)

```bash
# Dropar tabelas na ordem inversa
DROP TABLE IF EXISTS nigredo.calendar_blocks CASCADE;
DROP TABLE IF EXISTS nigredo.seller_availability CASCADE;
DROP TABLE IF EXISTS nigredo.meetings CASCADE;
DROP TABLE IF EXISTS nigredo.rate_limit_tracker CASCADE;
DROP TABLE IF EXISTS nigredo.dispatch_queue CASCADE;
```

---

## ☁️ AWS - Terraform

### Inicializar Backend

```bash
cd terraform/envs/dev
terraform init \
  -backend-config="bucket=alquimista-terraform-state" \
  -backend-config="key=agente-disparo-agenda/dev/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=alquimista-terraform-locks"
```

### Planejar Deploy

```bash
cd terraform/envs/dev
terraform plan -out=tfplan
```

### Aplicar Deploy

```bash
cd terraform/envs/dev
terraform apply tfplan
```

### Ver Outputs

```bash
cd terraform/envs/dev
terraform output
```

### Destruir (se necessário)

```bash
cd terraform/envs/dev
terraform destroy
```

---

## 📊 Observabilidade

### Ver Logs CloudWatch

```bash
# Lambda Disparo
aws logs tail /aws/lambda/disparo-dev --follow

# Lambda Agendamento
aws logs tail /aws/lambda/agendamento-dev --follow

# Filtrar por erro
aws logs tail /aws/lambda/disparo-dev --follow --filter-pattern "ERROR"
```

### Ver Métricas

```bash
# Mensagens enviadas
aws cloudwatch get-metric-statistics \
  --namespace Alquimista/Nigredo/Disparo \
  --metric-name MessagesSent \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Taxa de falha
aws cloudwatch get-metric-statistics \
  --namespace Alquimista/Nigredo/Disparo \
  --metric-name MessagesFailedRate \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Ver Alarmes

```bash
# Listar alarmes
aws cloudwatch describe-alarms \
  --alarm-names DisparoHighFailureRate AgendamentoLowConfirmationRate

# Ver estado dos alarmes
aws cloudwatch describe-alarm-history \
  --alarm-name DisparoHighFailureRate \
  --max-records 10
```

---

## 🧪 Testes

### Smoke Tests

```bash
# Testar Lambda Disparo
aws lambda invoke \
  --function-name disparo-dev \
  --payload '{"test": true}' \
  response.json

cat response.json

# Testar Lambda Agendamento
aws lambda invoke \
  --function-name agendamento-dev \
  --payload '{"test": true}' \
  response.json

cat response.json
```

### Testes de Integração

```bash
# Enviar mensagem de teste via SQS
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/.../agente-disparo-message-queue-dev \
  --message-body '{"type":"send_message","contactId":"test-123","data":{}}'

# Verificar DLQ
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/.../agente-disparo-dlq-dev
```

---

## 🔐 Secrets Manager

### Criar Secrets

```bash
# WhatsApp
aws secretsmanager create-secret \
  --name /alquimista/dev/agente-disparo-agenda/mcp-whatsapp \
  --secret-string '{"endpoint":"https://...","apiKey":"..."}'

# Email
aws secretsmanager create-secret \
  --name /alquimista/dev/agente-disparo-agenda/mcp-email \
  --secret-string '{"endpoint":"https://...","apiKey":"..."}'

# Calendar
aws secretsmanager create-secret \
  --name /alquimista/dev/agente-disparo-agenda/mcp-calendar \
  --secret-string '{"endpoint":"https://...","apiKey":"..."}'
```

### Ver Secrets

```bash
# Listar secrets
aws secretsmanager list-secrets \
  --filters Key=name,Values=/alquimista/dev/agente-disparo-agenda/

# Ver valor de secret
aws secretsmanager get-secret-value \
  --secret-id /alquimista/dev/agente-disparo-agenda/mcp-whatsapp
```

---

## 📝 Atualizar Documentação

### Marcar Tarefa como Completa

```bash
# Editar tasks.md
# Mudar: - [ ] 2.1 Criar migration...
# Para:  - [x] 2.1 Criar migration...

# Atualizar PROGRESSO-VISUAL.md
# Atualizar percentuais
```

### Criar Relatório de Sessão

```bash
# Copiar template
cp .kiro/specs/micro-agente-disparo-agendamento/CONCLUSAO-SESSAO-2024-01-15.md \
   .kiro/specs/micro-agente-disparo-agendamento/CONCLUSAO-SESSAO-$(date +%Y-%m-%d).md

# Editar com resultados da sessão
```

---

## 🆘 Troubleshooting

### Lambda não está sendo invocada

```bash
# Verificar EventBridge Rule
aws events list-rules --name-prefix nigredo

# Verificar targets da rule
aws events list-targets-by-rule --rule nigredo-estrategia-campaign-ready

# Verificar permissões
aws lambda get-policy --function-name disparo-dev
```

### Erro de permissão IAM

```bash
# Ver role da Lambda
aws lambda get-function-configuration --function-name disparo-dev | jq .Role

# Ver policies da role
aws iam list-attached-role-policies --role-name disparo-dev-role

# Ver inline policies
aws iam list-role-policies --role-name disparo-dev-role
```

### Erro de conexão com Aurora

```bash
# Verificar security group
aws ec2 describe-security-groups --group-ids sg-xxx

# Verificar subnet da Lambda
aws lambda get-function-configuration --function-name disparo-dev | jq .VpcConfig

# Testar conectividade (de dentro da VPC)
psql -h <aurora-endpoint> -U <user> -d alquimista_dev -c "SELECT 1"
```

---

## 📚 Referências Rápidas

### Documentos Importantes

```bash
# Requirements
cat .kiro/specs/micro-agente-disparo-agendamento/requirements.md

# Design
cat .kiro/specs/micro-agente-disparo-agendamento/design.md

# Tasks
cat .kiro/specs/micro-agente-disparo-agendamento/tasks.md

# Blueprint
cat .kiro/steering/blueprint-disparo-agendamento.md
```

### Contatos

- **Email**: alquimistafibonacci@gmail.com
- **WhatsApp**: +55 84 99708-4444

---

## ✅ Checklist Antes de Começar

```
[ ] Li o RELATORIO-SESSAO-ATUAL.md
[ ] Li o RESUMO-VISUAL-SESSAO.md
[ ] Entendi o estado atual (38% completo)
[ ] Decidi qual opção seguir (End-to-End ou Completa)
[ ] Tenho acesso ao AWS (credenciais configuradas)
[ ] Tenho acesso ao Aurora DEV
[ ] Tenho Node.js 20 instalado
[ ] Tenho Terraform instalado
[ ] Tenho psql instalado (para migrations)
```

---

**Pronto para começar!** 🚀

