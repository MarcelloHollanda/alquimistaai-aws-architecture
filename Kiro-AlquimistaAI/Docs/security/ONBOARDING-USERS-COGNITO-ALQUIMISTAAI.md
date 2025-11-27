# Onboarding de Usuários no Cognito - AlquimistaAI

## Índice

1. [Introdução](#introdução)
2. [Arquitetura de Identidade](#arquitetura-de-identidade)
3. [Ambiente DEV](#ambiente-dev)
4. [Ambiente PROD](#ambiente-prod)
5. [Checklists Operacionais](#checklists-operacionais)
6. [Integração com Testes de Segurança](#integração-com-testes-de-segurança)
7. [Troubleshooting](#troubleshooting)
8. [Referências](#referências)

---

## Introdução

Este guia documenta o processo completo de onboarding de usuários no Amazon Cognito para a plataforma AlquimistaAI. O sistema utiliza Cognito para autenticação e autorização, com grupos de permissão bem definidos para equipe interna e clientes.

### Contexto do Sistema

- **Backend**: API Gateway HTTP + Lambda (Node.js 20) + Aurora PostgreSQL
- **Autenticação**: Amazon Cognito User Pools
- **Autorização**: Authorization middleware que valida claims JWT
- **Testes**: 38 testes de segurança validando isolamento e permissões
- **Região AWS**: us-east-1

### Objetivo deste Guia

- Padronizar criação de User Pools (dev/prod)
- Documentar criação de grupos oficiais
- Guiar criação de usuários internos e clientes
- Fornecer checklists operacionais
- Integrar com testes de segurança existentes

---

## Arquitetura de Identidade

### User Pools Oficiais

| Ambiente | Nome do Pool | Região | Propósito |
|----------|--------------|--------|-----------|
| Dev | `fibonacci-users-dev` | us-east-1 | Desenvolvimento e testes |
| Prod | `fibonacci-users-prod` | us-east-1 | Produção com governança |

### Claims JWT Esperados

O authorization middleware (`lambda/shared/authorization-middleware.ts`) espera os seguintes claims:

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "usuario@exemplo.com",
  "email_verified": true,
  "cognito:groups": ["INTERNAL_ADMIN"],
  "custom:tenant_id": null,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXX",
  "iat": 1700000000,
  "exp": 1700003600
}
```

**Claims Obrigatórios:**
- `sub` → ID único do usuário no Cognito
- `email` → E-mail de login (verificado)
- `cognito:groups` → Array de grupos de permissão
- `custom:tenant_id` → UUID do tenant (para clientes)

### Grupos de Permissão

| Grupo | Tipo | Acesso Principal | Precedência |
|-------|------|------------------|-------------|
| **INTERNAL_ADMIN** | Equipe AlquimistaAI | Todos os tenants, configurações globais, billing | 1 (maior) |
| **INTERNAL_SUPPORT** | Equipe AlquimistaAI | Suporte e troubleshooting, sem poderes críticos | 2 |
| **TENANT_ADMIN** | Cliente | Gestão do próprio tenant, usuários, integrações | 3 |
| **TENANT_USER** | Cliente | Uso diário dos agentes, acesso restrito | 4 (menor) |

**⚠️ IMPORTANTE**: Os nomes dos grupos são **case-sensitive** e devem ser usados exatamente como especificado. Os testes de segurança assumem esses nomes.

### Matriz de Permissões

| Ação | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|------|:--------------:|:----------------:|:------------:|:-----------:|
| Ver todos os tenants | ✅ | ✅ | ❌ | ❌ |
| Ver próprio tenant | ✅ | ✅ | ✅ | ✅ |
| Criar/editar tenant | ✅ | ❌ | ❌ | ❌ |
| Gerenciar billing | ✅ | ❌ | ✅ | ❌ |
| Criar usuários no tenant | ✅ | ❌ | ✅ | ❌ |
| Usar agentes | ✅ | ✅ | ✅ | ✅ |
| Configurar integrações | ✅ | ❌ | ✅ | ❌ |
| Ver logs e métricas | ✅ | ✅ | ✅ | ❌ |

---

## Ambiente DEV

### 1. Localizar o User Pool DEV

#### Via Console AWS

1. Acesse o [Console AWS](https://console.aws.amazon.com/)
2. Navegue para **Amazon Cognito**
3. Clique em **Pools de usuários**
4. Localize o pool: **`fibonacci-users-dev`**

#### Via CloudFormation (Cross-Check Opcional)

1. Acesse **CloudFormation** no Console AWS
2. Localize a stack: **`FibonacciStack-dev`**
3. Vá para a aba **Recursos**
4. Procure por recursos do tipo: `AWS::Cognito::UserPool`
5. Confirme o nome/ID do User Pool

#### Via AWS CLI

```bash
# Listar todos os User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Buscar especificamente o pool dev
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 | grep fibonacci-users-dev
```

### 2. Criar Grupos Oficiais no User Pool DEV

#### Passo a Passo

1. No Console AWS, abra o User Pool **`fibonacci-users-dev`**
2. No menu lateral, clique em **Grupos de usuários**
3. Clique em **Criar grupo**

#### Criar Grupo: INTERNAL_ADMIN

- **Nome do grupo**: `INTERNAL_ADMIN` (exatamente assim, case-sensitive)
- **Descrição**: `Equipe AlquimistaAI - Acesso total a todos os tenants e configurações`
- **Precedência**: `1` (maior prioridade)
- **Função do IAM**: Deixar em branco (não necessário)
- Clique em **Criar grupo**

#### Criar Grupo: INTERNAL_SUPPORT

- **Nome do grupo**: `INTERNAL_SUPPORT`
- **Descrição**: `Equipe AlquimistaAI - Suporte e troubleshooting sem poderes críticos`
- **Precedência**: `2`
- Clique em **Criar grupo**

#### Criar Grupo: TENANT_ADMIN

- **Nome do grupo**: `TENANT_ADMIN`
- **Descrição**: `Cliente - Administrador do tenant com gestão completa`
- **Precedência**: `3`
- Clique em **Criar grupo**

#### Criar Grupo: TENANT_USER

- **Nome do grupo**: `TENANT_USER`
- **Descrição**: `Cliente - Usuário do tenant com acesso restrito`
- **Precedência**: `4`
- Clique em **Criar grupo**

#### Via AWS CLI

```bash
# Obter o User Pool ID
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 --region us-east-1 --query "UserPools[?Name=='fibonacci-users-dev'].Id" --output text)

# Criar grupos
aws cognito-idp create-group \
  --group-name INTERNAL_ADMIN \
  --user-pool-id $USER_POOL_ID \
  --description "Equipe AlquimistaAI - Acesso total" \
  --precedence 1 \
  --region us-east-1

aws cognito-idp create-group \
  --group-name INTERNAL_SUPPORT \
  --user-pool-id $USER_POOL_ID \
  --description "Equipe AlquimistaAI - Suporte" \
  --precedence 2 \
  --region us-east-1

aws cognito-idp create-group \
  --group-name TENANT_ADMIN \
  --user-pool-id $USER_POOL_ID \
  --description "Cliente - Administrador do tenant" \
  --precedence 3 \
  --region us-east-1

aws cognito-idp create-group \
  --group-name TENANT_USER \
  --user-pool-id $USER_POOL_ID \
  --description "Cliente - Usuário do tenant" \
  --precedence 4 \
  --region us-east-1
```

### 3. Criar Primeiro Usuário INTERNAL_ADMIN

Este será o usuário master do painel interno AlquimistaAI (CEO).

#### Passo a Passo

1. No User Pool **`fibonacci-users-dev`**, clique em **Usuários**
2. Clique em **Criar usuário**

#### Configuração do Usuário

- **Nome de usuário**: `marcello.admin`
- **E-mail**: `<seu-email-principal>` (ex: marcello@alquimista.ai)
- **Marcar e-mail como verificado**: ✅ Sim
- **Senha temporária**: Definir uma senha inicial OU deixar Cognito enviar convite
- **Enviar convite por e-mail**: Opcional (se quiser que o usuário defina a senha)

3. Clique em **Criar usuário**

#### Adicionar ao Grupo INTERNAL_ADMIN

1. Após criar o usuário, clique no nome do usuário (`marcello.admin`)
2. Vá para a aba **Grupos**
3. Clique em **Adicionar ao grupo**
4. Selecione **INTERNAL_ADMIN**
5. Clique em **Adicionar**

#### Via AWS CLI

```bash
# Criar usuário
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username marcello.admin \
  --user-attributes \
    Name=email,Value=marcello@alquimista.ai \
    Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region us-east-1

# Definir senha permanente (opcional)
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username marcello.admin \
  --password "SuaSenhaSegura123!" \
  --permanent \
  --region us-east-1

# Adicionar ao grupo INTERNAL_ADMIN
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username marcello.admin \
  --group-name INTERNAL_ADMIN \
  --region us-east-1
```

**✅ Resultado**: Usuário `marcello.admin` criado com acesso total ao painel operacional.

### 4. Criar Usuário INTERNAL_SUPPORT (Opcional)

Para operadores de suporte que precisam auxiliar clientes sem poderes administrativos críticos.

#### Passo a Passo

1. No User Pool, clique em **Criar usuário**
2. **Nome de usuário**: `support.internal`
3. **E-mail**: `suporte@alquimista.ai` (e-mail corporativo)
4. **Marcar e-mail como verificado**: ✅ Sim
5. Clique em **Criar usuário**
6. Adicionar ao grupo **INTERNAL_SUPPORT**

#### Via AWS CLI

```bash
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username support.internal \
  --user-attributes \
    Name=email,Value=suporte@alquimista.ai \
    Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region us-east-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username support.internal \
  --group-name INTERNAL_SUPPORT \
  --region us-east-1
```

**Diferença de Permissões**:
- ✅ Pode ver todos os tenants
- ✅ Pode fazer troubleshooting
- ❌ Não pode alterar billing
- ❌ Não pode criar/editar tenants
- ❌ Não pode alterar configurações críticas

### 5. Fluxo de Onboarding de Cliente (TENANT_ADMIN)

Este é o fluxo padrão para onboarding de novos clientes na plataforma.

#### Pré-requisitos

- Contrato assinado com o cliente
- Informações do responsável (nome, e-mail, empresa)

#### Passo 1: Criar Tenant no Backend

O tenant deve ser criado primeiro no Aurora PostgreSQL:

```sql
-- Conectar ao Aurora dev
-- Executar:
INSERT INTO tenants (id, name, cnpj, status)
VALUES (
  gen_random_uuid(),  -- Gera UUID automaticamente
  'Nome da Empresa Cliente',
  '12.345.678/0001-90',  -- CNPJ (opcional)
  'active'
);

-- Anotar o UUID gerado:
SELECT id, name FROM tenants WHERE name = 'Nome da Empresa Cliente';
-- Exemplo de UUID: 550e8400-e29b-41d4-a716-446655440000
```

**⚠️ IMPORTANTE**: Anote o UUID do tenant - será necessário no próximo passo.

#### Passo 2: Criar Usuário Cognito para o Cliente

1. No User Pool **`fibonacci-users-dev`**, clique em **Criar usuário**
2. **Nome de usuário**: `cliente-x-admin` (substituir X pelo nome do cliente)
3. **E-mail**: E-mail do responsável pelo contrato
4. **Marcar e-mail como verificado**: ✅ Sim
5. Clique em **Criar usuário**

#### Passo 3: Definir Atributo custom:tenant_id

1. Após criar o usuário, clique no nome do usuário
2. Vá para a aba **Atributos**
3. Clique em **Editar**
4. Adicione o atributo customizado:
   - **Nome**: `custom:tenant_id`
   - **Valor**: `550e8400-e29b-41d4-a716-446655440000` (UUID do tenant)
5. Clique em **Salvar alterações**

#### Passo 4: Adicionar ao Grupo TENANT_ADMIN

1. Vá para a aba **Grupos**
2. Clique em **Adicionar ao grupo**
3. Selecione **TENANT_ADMIN**
4. Clique em **Adicionar**

#### Via AWS CLI (Fluxo Completo)

```bash
# Variáveis
TENANT_ID="550e8400-e29b-41d4-a716-446655440000"  # UUID do tenant
CLIENT_USERNAME="cliente-x-admin"
CLIENT_EMAIL="admin@cliente-x.com"

# Criar usuário
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $CLIENT_USERNAME \
  --user-attributes \
    Name=email,Value=$CLIENT_EMAIL \
    Name=email_verified,Value=true \
    Name=custom:tenant_id,Value=$TENANT_ID \
  --message-action SEND \
  --region us-east-1

# Adicionar ao grupo TENANT_ADMIN
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username $CLIENT_USERNAME \
  --group-name TENANT_ADMIN \
  --region us-east-1
```

**✅ Resultado**: Cliente pode fazer login e acessar apenas o próprio tenant.

#### Validação do Isolamento

O authorization middleware garante que:
- Usuário só acessa dados onde `tenant_id = custom:tenant_id`
- Queries ao Aurora incluem filtro: `WHERE tenant_id = '550e8400-...'`
- Testes de segurança validam esse isolamento (38/38 passando)

### 6. Criar TENANT_USER (Usuário do Cliente)

Usuários adicionais do cliente com permissões restritas.

#### Opção 1: Via Dashboard (Futuro)

O TENANT_ADMIN poderá criar TENANT_USER pelo dashboard da plataforma.

#### Opção 2: Via Console (Manual)

1. Criar usuário no Cognito
2. Definir mesmo `custom:tenant_id` do TENANT_ADMIN
3. Adicionar ao grupo **TENANT_USER**

```bash
# Via CLI
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username cliente-x-user1 \
  --user-attributes \
    Name=email,Value=usuario1@cliente-x.com \
    Name=email_verified,Value=true \
    Name=custom:tenant_id,Value=$TENANT_ID \
  --message-action SEND \
  --region us-east-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username cliente-x-user1 \
  --group-name TENANT_USER \
  --region us-east-1
```

**Diferença de Permissões**:
- ✅ Pode usar agentes
- ✅ Pode ver dados do próprio tenant
- ❌ Não pode criar outros usuários
- ❌ Não pode gerenciar billing
- ❌ Não pode configurar integrações

---

## Ambiente PROD

### 1. Localizar o User Pool PROD

Mesmo processo do DEV, mas procurar por: **`fibonacci-users-prod`**

```bash
# Via CLI
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 | grep fibonacci-users-prod
```

### 2. Replicar Estrutura de Grupos

Criar os mesmos 4 grupos no pool de produção:
- INTERNAL_ADMIN (precedência 1)
- INTERNAL_SUPPORT (precedência 2)
- TENANT_ADMIN (precedência 3)
- TENANT_USER (precedência 4)

**⚠️ IMPORTANTE**: Usar exatamente os mesmos nomes (case-sensitive).

### 3. Governança em Produção

#### Múltiplos Administradores

**SEMPRE** ter no mínimo 2 usuários INTERNAL_ADMIN em produção para evitar lock-out.

Criar:
1. `marcello.admin` (CEO)
2. `admin.backup` (Backup administrativo)

#### E-mails Corporativos

**NUNCA** usar e-mails pessoais em produção. Apenas e-mails corporativos:
- ✅ `marcello@alquimista.ai`
- ✅ `suporte@alquimista.ai`
- ❌ `marcello.pessoal@gmail.com`

#### MFA Recomendado

Habilitar MFA (Multi-Factor Authentication) para todos os usuários INTERNAL_ADMIN em produção:

1. No User Pool, vá para **Configurações de MFA**
2. Selecione **Opcional** ou **Obrigatório**
3. Habilitar **TOTP** (Google Authenticator, Authy, etc.)

### 4. Onboarding de Clientes em PROD

**Pré-requisito**: Contrato assinado e validado.

Seguir exatamente o mesmo fluxo do DEV:
1. Criar tenant no Aurora PROD
2. Criar usuário Cognito no pool PROD
3. Definir `custom:tenant_id`
4. Adicionar ao grupo TENANT_ADMIN
5. Validar login e acesso restrito

**⚠️ IMPORTANTE**: 
- Nunca usar dados de dev em prod
- Validar e-mail corporativo do cliente
- Testar login antes de entregar ao cliente

---

## Checklists Operacionais

### Checklist: Preparar Ambiente DEV

- [ ] Localizar User Pool `fibonacci-users-dev` no Console AWS
- [ ] Criar grupo `INTERNAL_ADMIN` (precedência 1)
- [ ] Criar grupo `INTERNAL_SUPPORT` (precedência 2)
- [ ] Criar grupo `TENANT_ADMIN` (precedência 3)
- [ ] Criar grupo `TENANT_USER` (precedência 4)
- [ ] Criar usuário `marcello.admin` com e-mail verificado
- [ ] Adicionar `marcello.admin` ao grupo INTERNAL_ADMIN
- [ ] (Opcional) Criar usuário `support.internal`
- [ ] (Opcional) Adicionar `support.internal` ao grupo INTERNAL_SUPPORT
- [ ] Executar testes de segurança: `npm test -- tests/security/operational-dashboard-security.test.ts`
- [ ] Confirmar 38/38 testes passando

### Checklist: Preparar Ambiente PROD

- [ ] Localizar User Pool `fibonacci-users-prod` no Console AWS
- [ ] Criar os 4 grupos oficiais (mesmos nomes do dev)
- [ ] Criar usuário `marcello.admin` com e-mail corporativo
- [ ] Criar usuário `admin.backup` com e-mail corporativo
- [ ] Adicionar ambos ao grupo INTERNAL_ADMIN
- [ ] Habilitar MFA para usuários INTERNAL_ADMIN
- [ ] Validar login real no painel com usuário INTERNAL_ADMIN
- [ ] Executar testes de segurança em ambiente de staging
- [ ] Confirmar 38/38 testes passando

### Checklist: Onboarding de Novo Cliente

- [ ] Contrato assinado e validado
- [ ] Criar registro de tenant no Aurora (anotar UUID)
- [ ] Criar usuário Cognito no pool correto (dev ou prod)
- [ ] Definir `custom:tenant_id` com UUID do tenant
- [ ] Adicionar usuário ao grupo TENANT_ADMIN
- [ ] Enviar instruções de primeiro acesso ao cliente
- [ ] Validar login do cliente
- [ ] Confirmar que cliente só acessa próprio tenant
- [ ] Documentar onboarding em sistema interno

---

## Integração com Testes de Segurança

### Contrato Oficial de Segurança

Os testes em `tests/security/operational-dashboard-security.test.ts` são o **contrato oficial** entre Cognito e o backend. Eles validam:

1. ✅ Claims JWT corretos
2. ✅ Isolamento por tenant_id
3. ✅ Permissões por grupo
4. ✅ Bloqueio de acesso cross-tenant
5. ✅ Validação de atributos customizados

### Executar Testes

```bash
# Executar suite completa de segurança
npm test -- tests/security/operational-dashboard-security.test.ts

# Resultado esperado:
# PASS  tests/security/operational-dashboard-security.test.ts
#   ✓ 38 testes passando (100%)
```

### Quando Executar

**SEMPRE** executar testes antes de:
- Deploy em dev
- Deploy em prod
- Mudanças em autenticação
- Mudanças em autorização
- Criação de novos grupos
- Alteração de permissões

### O Que Fazer Se Testes Falharem

1. ❌ **NÃO fazer deploy**
2. 🔍 Investigar causa da falha
3. 📋 Verificar logs do teste
4. 🔧 Corrigir problema
5. ✅ Re-executar testes até 38/38 passar
6. 📝 Documentar correção

**Exemplo de Falha**:
```
FAIL  tests/security/operational-dashboard-security.test.ts
  ✗ Should block access to other tenant data (1 ms)
  
  Expected: Access denied
  Received: Access granted
```

**Ação**: Verificar se `custom:tenant_id` está definido corretamente no usuário.

---

## Troubleshooting

### Erros Comuns de Configuração

| Erro | Causa | Solução |
|------|-------|---------|
| User Pool não encontrado | Nome incorreto ou região errada | Verificar CloudFormation outputs, confirmar região us-east-1 |
| Grupo não existe | Grupo não criado ou nome incorreto | Criar grupo com nome exato (case-sensitive) |
| Atributo `custom:tenant_id` ausente | Atributo não configurado no pool | Verificar schema de atributos do User Pool |
| Usuário sem grupo | Usuário criado mas não adicionado | Adicionar usuário ao grupo apropriado |

### Erros Comuns de Onboarding

| Erro | Causa | Solução |
|------|-------|---------|
| Tenant ID inválido | UUID mal formatado | Validar formato UUID antes de definir |
| E-mail não verificado | Usuário criado sem verificação | Marcar e-mail como verificado no console |
| Múltiplos grupos | Usuário em mais de um grupo | Remover de grupos extras, manter apenas um |
| Acesso negado após login | Claims incorretos ou middleware desatualizado | Verificar token JWT e validar middleware |

### Erros Comuns de Testes

| Erro | Causa | Solução |
|------|-------|---------|
| Testes de segurança falhando | Mudança em auth quebrou contrato | Reverter mudança e corrigir antes de deploy |
| Mock de Cognito desatualizado | Testes usando estrutura antiga de claims | Atualizar mocks para refletir claims reais |
| Isolamento de tenant falhando | tenant_id não sendo validado | Verificar authorization-middleware |

### Como Validar Claims JWT

1. Fazer login no painel
2. Abrir DevTools do navegador (F12)
3. Ir para aba **Application** → **Local Storage**
4. Procurar por token JWT
5. Copiar token e colar em [jwt.io](https://jwt.io)
6. Verificar claims:
   - `sub` presente?
   - `email` presente?
   - `cognito:groups` presente e correto?
   - `custom:tenant_id` presente (para clientes)?

### Como Verificar Isolamento de Tenant

```bash
# Obter token JWT do usuário
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Tentar acessar dados de outro tenant
curl -X GET \
  https://api.alquimista.ai/api/tenants/outro-tenant-uuid \
  -H "Authorization: Bearer $TOKEN"

# Resultado esperado: 403 Forbidden
```

---

## Referências

### Código Relacionado

- **Authorization Middleware**: `lambda/shared/authorization-middleware.ts`
- **Testes de Segurança**: `tests/security/operational-dashboard-security.test.ts`
- **Cognito Stack (CDK)**: Verificar em `lib/` para stack de Cognito

### Documentação AWS

- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito Groups](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html)
- [Custom Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
- [JWT Claims](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)

### Comandos AWS CLI Úteis

```bash
# Listar User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Listar grupos de um pool
aws cognito-idp list-groups --user-pool-id us-east-1_XXXXXX --region us-east-1

# Listar usuários de um pool
aws cognito-idp list-users --user-pool-id us-east-1_XXXXXX --region us-east-1

# Descrever usuário específico
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXX \
  --username marcello.admin \
  --region us-east-1

# Listar grupos de um usuário
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_XXXXXX \
  --username marcello.admin \
  --region us-east-1

# Obter atributos customizados de um usuário
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXX \
  --username cliente-x-admin \
  --region us-east-1 \
  --query 'UserAttributes[?Name==`custom:tenant_id`].Value' \
  --output text
```

### Documentação Interna

- [Visão Geral de Identidade e Acesso](./SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md)
- [Índice de Operações AWS](../INDEX-OPERATIONS-AWS.md)
- [Guia de Segurança](./README.md)

### Contatos

- **Suporte Técnico**: suporte@alquimista.ai
- **Emergências**: +55 84 99708-4444 (WhatsApp)

---

## Histórico de Alterações

| Data | Versão | Autor | Alterações |
|------|--------|-------|------------|
| 2025-11-19 | 1.0.0 | Kiro AI | Criação inicial do documento |

---

**Última Atualização**: 19 de novembro de 2025  
**Mantenedor**: Equipe AlquimistaAI  
**Status**: ✅ Ativo e Validado
