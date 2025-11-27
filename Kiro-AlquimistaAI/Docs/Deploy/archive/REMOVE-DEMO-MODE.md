# 🔧 Remover Modo Demo - Alquimista.AI

## 📋 O Que É o Modo Demo

Atualmente, o sistema tem dados de demonstração configurados:
- **Tenant Demo**: "Empresa Demo" (CNPJ: 12.345.678/0001-90)
- **Usuário Demo**: admin@demo.com
- **Agentes pré-ativados** para o tenant demo

## 🎯 Opções para Remover o Modo Demo

### Opção 1: Remover Completamente os Dados Demo

Remover o tenant e usuário demo dos seeds do banco de dados.

### Opção 2: Substituir por Dados Reais

Substituir os dados demo por dados reais da sua empresa.

### Opção 3: Manter Demo + Adicionar Dados Reais

Manter o demo para testes e adicionar dados reais em paralelo.

## 🚀 Implementação Recomendada: Opção 2

Vou criar um novo arquivo de seed com seus dados reais.

### Passo 1: Fornecer Dados Reais

Preciso das seguintes informações:

1. **Dados da Empresa**:
   - Nome da empresa
   - CNPJ
   - Tier de assinatura (starter, professional, enterprise)

2. **Dados do Usuário Admin**:
   - Email
   - Nome completo

3. **Configurações**:
   - Email de vendas
   - Número WhatsApp (formato: +5511999999999)
   - Calendar ID (email do Google Calendar)

### Passo 2: Criar Novo Seed

Vou criar `database/seeds/001_production_data.sql` com seus dados reais.

### Passo 3: Remover/Comentar Dados Demo

Vou comentar ou remover as linhas de demo do `initial_data.sql`.

## 📝 Exemplo de Dados Reais

```sql
-- Tenant Real
INSERT INTO alquimista_platform.tenants (
    id,
    company_name,
    cnpj,
    subscription_tier,
    subscription_status,
    settings
) VALUES (
    gen_random_uuid(),
    'Sua Empresa Ltda',
    '12.345.678/0001-90',  -- Seu CNPJ real
    'professional',
    'active',
    '{
        "calendarId": "vendas@suaempresa.com",
        "salesEmail": "vendas@suaempresa.com",
        "whatsappNumber": "+5511987654321",
        "rateLimits": {
            "messagesPerHour": 100,
            "messagesPerDay": 500
        }
    }'::jsonb
);

-- Usuário Admin Real
INSERT INTO alquimista_platform.users (
    id,
    tenant_id,
    email,
    full_name,
    user_role,
    status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM alquimista_platform.tenants WHERE company_name = 'Sua Empresa Ltda'),
    'admin@suaempresa.com',
    'Seu Nome',
    'admin',
    'active'
);
```

## ⚙️ Configuração Adicional Necessária

Após remover o modo demo, você precisará:

1. **Configurar AWS Cognito** com o email real
2. **Configurar Secrets Manager** com credenciais reais:
   - WhatsApp Business API key
   - Google Calendar credentials
   - Outras integrações

3. **Atualizar variáveis de ambiente** no frontend

## 🔒 Segurança

**IMPORTANTE**: Nunca commite dados reais (emails, telefones, CNPJs) no repositório público!

Use variáveis de ambiente ou AWS Secrets Manager para dados sensíveis.

## 📊 Status Atual

- [ ] Dados reais fornecidos
- [ ] Novo seed criado
- [ ] Dados demo removidos/comentados
- [ ] Secrets configurados
- [ ] Cognito configurado
- [ ] Deploy realizado
- [ ] Testes com dados reais

---

**Próximo Passo**: Me forneça os dados reais da sua empresa para eu criar o seed de produção.

Ou, se preferir manter privado, posso criar um template que você preenche manualmente.
