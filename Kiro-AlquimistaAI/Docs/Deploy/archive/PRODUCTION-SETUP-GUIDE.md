# 🚀 Guia de Configuração para Produção

## ✅ O Que Foi Feito

1. ✅ Dados demo foram **comentados** no `database/seeds/initial_data.sql`
2. ✅ Template criado em `database/seeds/001_production_data.template.sql`
3. ✅ Arquivo de produção adicionado ao `.gitignore` para segurança

## 📋 Como Configurar Dados de Produção

### Passo 1: Copiar o Template

```bash
cp database/seeds/001_production_data.template.sql database/seeds/001_production_data.sql
```

### Passo 2: Editar com Seus Dados Reais

Abra `database/seeds/001_production_data.sql` e substitua os placeholders:

```sql
-- Substitua:
'[YOUR_COMPANY_NAME]'     → 'Sua Empresa Ltda'
'[YOUR_CNPJ]'             → '12.345.678/0001-90'
'[SUBSCRIPTION_TIER]'     → 'professional'
'[YOUR_CALENDAR_EMAIL]'   → 'vendas@suaempresa.com'
'[YOUR_SALES_EMAIL]'      → 'vendas@suaempresa.com'
'[YOUR_WHATSAPP]'         → '+5511987654321'
'[YOUR_ADMIN_EMAIL]'      → 'admin@suaempresa.com'
'[YOUR_FULL_NAME]'        → 'João Silva'
```

### Passo 3: Executar as Migrations

Após o deploy do backend, execute as migrations:

```bash
# Conectar ao banco Aurora
# (Use as credenciais do Secrets Manager)

# Executar migrations em ordem
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/migrations/001_create_schemas.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/migrations/002_create_leads_tables.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/migrations/003_create_platform_tables.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/migrations/004_create_core_tables.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/migrations/005_create_approval_tables.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/migrations/006_add_lgpd_consent.sql

# Executar seeds
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/seeds/002_default_permissions.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/seeds/initial_data.sql
psql -h <aurora-endpoint> -U <username> -d fibonacci_db -f database/seeds/001_production_data.sql
```

## 🔐 Configurar Secrets no AWS

### 1. Credenciais do Banco de Dados

```bash
aws secretsmanager create-secret \
  --name fibonacci-dev-db-credentials \
  --secret-string '{
    "username": "postgres",
    "password": "SUA_SENHA_SEGURA",
    "host": "fibonacci-cluster-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "fibonacci_db"
  }'
```

### 2. WhatsApp Business API

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/whatsapp-api-key \
  --secret-string '{
    "apiKey": "SUA_API_KEY_WHATSAPP",
    "phoneNumberId": "SEU_PHONE_NUMBER_ID"
  }'
```

### 3. Google Calendar

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/google-calendar-credentials \
  --secret-string '{
    "type": "service_account",
    "project_id": "seu-projeto",
    "private_key_id": "...",
    "private_key": "...",
    "client_email": "...",
    "client_id": "...",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token"
  }'
```

## 🔧 Configurar AWS Cognito

### 1. Criar User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name fibonacci-users-dev \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email
```

### 2. Criar Usuário Admin

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username admin@suaempresa.com \
  --user-attributes Name=email,Value=admin@suaempresa.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS
```

## 📊 Verificar Configuração

### 1. Verificar Tenant Criado

```sql
SELECT * FROM alquimista_platform.tenants;
```

### 2. Verificar Usuário Criado

```sql
SELECT * FROM alquimista_platform.users;
```

### 3. Verificar Agentes Ativados

```sql
SELECT 
  t.company_name,
  a.name,
  aa.status
FROM alquimista_platform.agent_activations aa
JOIN alquimista_platform.tenants t ON t.id = aa.tenant_id
JOIN alquimista_platform.agents a ON a.id = aa.agent_id;
```

## 🎯 Próximos Passos

1. ✅ Configurar dados de produção
2. ✅ Executar migrations
3. ✅ Configurar secrets
4. ✅ Configurar Cognito
5. ✅ Testar login
6. ✅ Testar agentes
7. ✅ Configurar frontend

## ⚠️ Segurança

**IMPORTANTE**:
- ✅ Arquivo `001_production_data.sql` está no `.gitignore`
- ✅ Nunca commite credenciais ou dados sensíveis
- ✅ Use AWS Secrets Manager para todas as credenciais
- ✅ Rotacione senhas regularmente
- ✅ Use MFA para usuários admin

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs do CloudWatch
2. Consulte a documentação em `docs/`
3. Entre em contato com o suporte técnico

---

**Status**: Sistema configurado para produção sem dados demo! 🎉
