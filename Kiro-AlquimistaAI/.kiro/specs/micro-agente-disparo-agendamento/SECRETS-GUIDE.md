# 🔐 Guia de Secrets - Micro Agente Disparo & Agendamento

**Data**: 24 de Novembro de 2024  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Uso

---

## 📋 Visão Geral

Este guia explica como criar e gerenciar os 3 secrets necessários para o Micro Agente de Disparo Automático & Agendamento no AWS Secrets Manager.

### Secrets Necessários

1. **`/repo/terraform/micro-agente-disparo-agendamento/whatsapp`**
   - Credenciais do MCP WhatsApp Server
   - Campos: `endpoint`, `api_key`

2. **`/repo/terraform/micro-agente-disparo-agendamento/email`**
   - Credenciais do MCP Email Server
   - Campos: `endpoint`, `api_key`

3. **`/repo/terraform/micro-agente-disparo-agendamento/calendar`**
   - Credenciais do MCP Calendar Server (Google Calendar)
   - Campos: `endpoint`, `api_key`, `calendar_id`

---

## 🚀 Como Executar o Script

### Pré-requisitos

1. **AWS CLI configurado**
   ```powershell
   aws sts get-caller-identity
   ```
   Deve retornar Account, UserId e Arn.

2. **Região configurada**
   ```powershell
   $env:AWS_REGION = "us-east-1"
   $env:AWS_DEFAULT_REGION = "us-east-1"
   ```

3. **Política de execução do PowerShell**
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

### Execução Básica

```powershell
# Navegar até a pasta do projeto
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI

# Executar o script
powershell -ExecutionPolicy Bypass -File .\.kiro\specs\micro-agente-disparo-agendamento\create-secrets.ps1
```

### O que o Script Faz

1. **Verifica credenciais AWS**
   - Confirma que AWS CLI está configurado
   - Mostra Account e UserId

2. **Solicita valores dos secrets**
   - Endpoint WhatsApp
   - API Key WhatsApp
   - Endpoint Email
   - API Key Email
   - Endpoint Calendar
   - API Key Calendar
   - Calendar ID

3. **Detecta secrets existentes**
   - Se o secret já existe: usa `put-secret-value` para atualizar
   - Se não existe: usa `create-secret` para criar

4. **Exibe resumo**
   - Mostra quais secrets foram criados/atualizados
   - Lista comandos úteis para verificação

---

## 📝 Estrutura dos Secrets

### WhatsApp Secret

```json
{
  "endpoint": "https://api.whatsapp.example.com",
  "api_key": "whatsapp-api-key-123"
}
```

**Campos**:
- `endpoint`: URL base do MCP WhatsApp Server
- `api_key`: Chave de autenticação da API

### Email Secret

```json
{
  "endpoint": "https://api.email.example.com",
  "api_key": "email-api-key-456"
}
```

**Campos**:
- `endpoint`: URL base do MCP Email Server
- `api_key`: Chave de autenticação da API

### Calendar Secret

```json
{
  "endpoint": "https://api.calendar.example.com",
  "api_key": "calendar-api-key-789",
  "calendar_id": "vendas@alquimista.ai"
}
```

**Campos**:
- `endpoint`: URL base do MCP Calendar Server
- `api_key`: Chave de autenticação da API
- `calendar_id`: ID do calendário do Google (email)

---

## 🔍 Comandos Úteis

### Listar Secrets Criados

```powershell
aws secretsmanager list-secrets --region us-east-1 --query "SecretList[?contains(Name, 'micro-agente-disparo-agendamento')].Name"
```

### Verificar um Secret (sem mostrar valor)

```powershell
aws secretsmanager describe-secret --region us-east-1 --secret-id /repo/terraform/micro-agente-disparo-agendamento/whatsapp
```

### Ver Valor de um Secret (CUIDADO: mostra dados sensíveis)

```powershell
aws secretsmanager get-secret-value --region us-east-1 --secret-id /repo/terraform/micro-agente-disparo-agendamento/whatsapp
```

### Atualizar um Secret Manualmente

```powershell
aws secretsmanager put-secret-value `
  --region us-east-1 `
  --secret-id /repo/terraform/micro-agente-disparo-agendamento/whatsapp `
  --secret-string '{"endpoint":"https://nova-url.com","api_key":"nova-key"}'
```

### Deletar um Secret (CUIDADO: ação destrutiva)

```powershell
# Deletar com período de recuperação de 30 dias
aws secretsmanager delete-secret --region us-east-1 --secret-id /repo/terraform/micro-agente-disparo-agendamento/whatsapp --recovery-window-in-days 30

# Deletar imediatamente (sem recuperação)
aws secretsmanager delete-secret --region us-east-1 --secret-id /repo/terraform/micro-agente-disparo-agendamento/whatsapp --force-delete-without-recovery
```

---

## ⚠️ Segurança e Boas Práticas

### ✅ O que o Script FAZ

- ✅ Solicita valores em tempo de execução (não hardcoded)
- ✅ Não loga valores sensíveis no console
- ✅ Detecta e atualiza secrets existentes
- ✅ Usa JSON compacto para armazenamento
- ✅ Valida credenciais AWS antes de executar

### ❌ O que o Script NÃO FAZ

- ❌ Não armazena valores em arquivos locais
- ❌ Não exibe valores sensíveis no console
- ❌ Não commita valores para o GitHub
- ❌ Não deleta secrets automaticamente

### 🔒 Recomendações de Segurança

1. **Nunca versionar valores reais**
   - Não adicionar valores hardcoded no script
   - Não commitar arquivos `.env` com secrets

2. **Usar valores de teste em DEV**
   - Endpoints de teste/mock para desenvolvimento
   - API keys de teste (não produção)

3. **Rotacionar secrets regularmente**
   - Atualizar API keys periodicamente
   - Usar AWS Secrets Manager rotation (opcional)

4. **Limitar acesso IAM**
   - Apenas usuários/roles necessários devem ter acesso
   - Usar políticas de least privilege

5. **Auditar acesso**
   - Habilitar CloudTrail para logs de acesso
   - Monitorar tentativas de leitura de secrets

---

## 🐛 Troubleshooting

### Erro: "ResourceExistsException"

**Sintoma**: Secret já existe e o script falha ao criar.

**Solução**: O script atualizado detecta automaticamente e usa `put-secret-value`. Se ainda ocorrer:
```powershell
aws secretsmanager put-secret-value --region us-east-1 --secret-id NOME_DO_SECRET --secret-string '{"endpoint":"URL","api_key":"KEY"}'
```

### Erro: "UnrecognizedClientException"

**Sintoma**: AWS CLI não reconhece credenciais.

**Solução**:
```powershell
# Verificar credenciais
aws sts get-caller-identity

# Reconfigurar se necessário
aws configure
```

### Erro: "AccessDeniedException"

**Sintoma**: Usuário não tem permissão para criar/atualizar secrets.

**Solução**: Adicionar permissões IAM:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:PutSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:/repo/terraform/micro-agente-disparo-agendamento/*"
    }
  ]
}
```

### Erro: "Execution Policy"

**Sintoma**: PowerShell bloqueia execução de scripts.

**Solução**:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Ou executar com bypass:
```powershell
powershell -ExecutionPolicy Bypass -File .\create-secrets.ps1
```

---

## 📊 Exemplo de Execução Completa

```powershell
PS C:\...\Kiro-AlquimistaAI> powershell -ExecutionPolicy Bypass -File .\.kiro\specs\micro-agente-disparo-agendamento\create-secrets.ps1

========================================
Criação de Secrets - Micro Agente Disparo e Agendamento
========================================

Este script criará 3 secrets no AWS Secrets Manager:
  1. /repo/terraform/micro-agente-disparo-agendamento/whatsapp
  2. /repo/terraform/micro-agente-disparo-agendamento/email
  3. /repo/terraform/micro-agente-disparo-agendamento/calendar

Região AWS: us-east-1

Verificando AWS CLI...
✓ AWS CLI configurado
  Account: 123456789012
  UserId: AIDAI...

IMPORTANTE: Os valores sensíveis serão solicitados agora.
            Esses valores NÃO serão exibidos nos logs.

Deseja continuar? (S/N): S

========================================
Coletando Valores dos Secrets
========================================

1. MCP WhatsApp
   Endpoint WhatsApp (padrão: https://api.whatsapp.example.com): https://mcp.whatsapp.alquimista.ai
   API Key WhatsApp (padrão: whatsapp-test-key-123): wa_prod_key_abc123

2. MCP Email
   Endpoint Email (padrão: https://api.email.example.com): https://mcp.email.alquimista.ai
   API Key Email (padrão: email-test-key-456): email_prod_key_def456

3. MCP Calendar
   Endpoint Calendar (padrão: https://api.calendar.example.com): https://mcp.calendar.alquimista.ai
   API Key Calendar (padrão: calendar-test-key-789): cal_prod_key_ghi789
   Calendar ID (padrão: vendas@alquimista.ai): vendas@alquimista.ai

========================================
Criando/Atualizando Secrets no AWS
========================================

1. Processando secret MCP WhatsApp...
  Secret não existe. Criando...
  ✓ Secret criado com sucesso!

2. Processando secret MCP Email...
  Secret não existe. Criando...
  ✓ Secret criado com sucesso!

3. Processando secret MCP Calendar...
  Secret não existe. Criando...
  ✓ Secret criado com sucesso!

========================================
Resumo da Operação
========================================

Secrets processados: 3/3

  ✓ /repo/terraform/micro-agente-disparo-agendamento/whatsapp
  ✓ /repo/terraform/micro-agente-disparo-agendamento/email
  ✓ /repo/terraform/micro-agente-disparo-agendamento/calendar

Comandos úteis:

  # Listar secrets criados
  aws secretsmanager list-secrets --region us-east-1 --query "SecretList[?contains(Name, 'micro-agente-disparo-agendamento')].Name"

  # Verificar um secret específico (sem mostrar valor)
  aws secretsmanager describe-secret --region us-east-1 --secret-id /repo/terraform/micro-agente-disparo-agendamento/whatsapp

  # Atualizar um secret manualmente
  aws secretsmanager put-secret-value --region us-east-1 --secret-id NOME_DO_SECRET --secret-string '{"endpoint":"URL","api_key":"KEY"}'

✓ Todos os secrets foram criados/atualizados com sucesso!
```

---

## 🔄 Próximos Passos

Após criar os secrets com sucesso:

1. **Validar secrets criados**
   ```powershell
   .\validate-terraform-vars.ps1
   ```

2. **Build e upload das Lambdas**
   ```powershell
   .\build-and-upload-lambdas.ps1
   ```

3. **Deploy com Terraform**
   ```powershell
   cd terraform/envs/dev
   terraform init
   terraform plan
   terraform apply
   ```

---

## 📚 Referências

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS CLI Secrets Manager Commands](https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/)
- [Design do Micro Agente](./design.md)
- [Terraform Module](../../terraform/modules/agente_disparo_agenda/)

---

**Última Atualização**: 24/11/2024  
**Mantido por**: Equipe AlquimistaAI  
**Status**: 🟢 Pronto para Uso
