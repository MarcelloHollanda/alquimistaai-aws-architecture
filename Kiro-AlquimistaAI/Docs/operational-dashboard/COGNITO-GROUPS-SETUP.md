# Configuração de Grupos e Papéis no Cognito

## Visão Geral

Este documento descreve a configuração de grupos e papéis no Amazon Cognito User Pool para o Painel Operacional AlquimistaAI.

## Grupos Configurados

### 1. INTERNAL_ADMIN

**Descrição**: Administradores internos da AlquimistaAI com acesso total ao painel operacional

**Precedência**: 1 (maior prioridade)

**Permissões**:
- Acesso completo ao Painel Operacional (`/app/company/*`)
- Acesso a todas as APIs internas (`/internal/*`)
- Visualização de dados de todos os tenants
- Execução de comandos operacionais
- Acesso à visão financeira e billing

**Casos de Uso**:
- CEO, CTO, Diretores
- Gestão estratégica da plataforma
- Análise financeira e métricas globais

### 2. INTERNAL_SUPPORT

**Descrição**: Equipe de suporte interno da AlquimistaAI com acesso ao painel operacional

**Precedência**: 2

**Permissões**:
- Acesso ao Painel Operacional (`/app/company/*`)
- Acesso a APIs internas de leitura (`GET /internal/*`)
- Visualização de dados de todos os tenants
- Execução de comandos operacionais (exceto críticos)
- **SEM** acesso à visão financeira

**Casos de Uso**:
- Equipe de suporte técnico
- Analistas de operações
- Troubleshooting e resolução de incidentes

### 3. TENANT_ADMIN

**Descrição**: Administradores de empresas clientes com acesso total ao dashboard do tenant

**Precedência**: 3

**Permissões**:
- Acesso ao Dashboard do Cliente (`/app/dashboard/*`)
- Acesso a todas as APIs do tenant (`/tenant/*`)
- Gerenciamento de usuários do tenant
- Configuração de agentes e integrações
- Visualização de métricas e uso

**Casos de Uso**:
- Administradores de empresas clientes
- Gestores responsáveis pela conta
- Configuração e gerenciamento da plataforma

### 4. TENANT_USER

**Descrição**: Usuários de empresas clientes com acesso limitado ao dashboard do tenant

**Precedência**: 4 (menor prioridade)

**Permissões**:
- Acesso ao Dashboard do Cliente (`/app/dashboard/*`)
- Acesso a APIs de leitura do tenant (`GET /tenant/*`)
- Visualização de métricas e uso
- **SEM** permissão para alterar configurações

**Casos de Uso**:
- Usuários operacionais de empresas clientes
- Visualização de dashboards e relatórios
- Monitoramento de agentes

## Custom Attributes

### custom:tenant_id

**Tipo**: String

**Mutável**: Não (definido no cadastro)

**Descrição**: Identificador único do tenant ao qual o usuário pertence

**Formato**: UUID (ex: `550e8400-e29b-41d4-a716-446655440000`)

**Uso**:
- Isolamento de dados entre tenants
- Validação de acesso a recursos
- Filtro de queries no backend

**Regras**:
- Obrigatório para grupos `TENANT_ADMIN` e `TENANT_USER`
- Opcional para grupos `INTERNAL_ADMIN` e `INTERNAL_SUPPORT`
- Não pode ser alterado após criação do usuário

### custom:company_name

**Tipo**: String

**Mutável**: Sim

**Descrição**: Nome da empresa do tenant

**Uso**:
- Exibição no frontend
- Personalização da interface

### custom:user_role

**Tipo**: String

**Mutável**: Sim

**Descrição**: Papel adicional do usuário dentro do tenant

**Valores possíveis**: `admin`, `user`, `viewer`

## Matriz de Permissões

| Recurso | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|---------|----------------|------------------|--------------|-------------|
| `/app/dashboard/*` | ✅ | ✅ | ✅ | ✅ |
| `/app/company/*` | ✅ | ✅ | ❌ | ❌ |
| `GET /tenant/*` | ✅ | ✅ | ✅ | ✅ |
| `POST /tenant/*` | ✅ | ✅ | ✅ | ❌ |
| `PUT /tenant/*` | ✅ | ✅ | ✅ | ❌ |
| `DELETE /tenant/*` | ✅ | ✅ | ✅ | ❌ |
| `GET /internal/tenants` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/usage/*` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/billing/*` | ✅ | ❌ | ❌ | ❌ |
| `POST /internal/operations/commands` | ✅ | ✅ | ❌ | ❌ |

## Configuração via Script

### Pré-requisitos

- AWS CLI configurado
- Credenciais com permissões no Cognito
- PowerShell 5.1 ou superior

### Execução

```powershell
# Ambiente dev
.\scripts\setup-cognito-operational-groups.ps1 -Environment dev

# Ambiente prod
.\scripts\setup-cognito-operational-groups.ps1 -Environment prod

# Com região específica
.\scripts\setup-cognito-operational-groups.ps1 -Environment dev -Region us-east-1
```

### O que o script faz

1. ✅ Obtém o User Pool ID do ambiente
2. ✅ Cria os 4 grupos operacionais
3. ✅ Verifica se custom attribute `tenant_id` existe
4. ✅ Lista todos os grupos configurados
5. ✅ Opcionalmente cria usuários de teste

## Configuração Manual via Console

### Criar Grupos

1. Acesse o Console AWS Cognito
2. Selecione o User Pool: `fibonacci-users-{env}`
3. Navegue para **Groups**
4. Clique em **Create group**
5. Preencha os dados:
   - **Group name**: Nome do grupo (ex: `INTERNAL_ADMIN`)
   - **Description**: Descrição do grupo
   - **Precedence**: Número de precedência (1-4)
6. Clique em **Create group**
7. Repita para os 4 grupos

### Verificar Custom Attributes

1. No User Pool, navegue para **Attributes**
2. Verifique se `custom:tenant_id` está listado
3. Se não estiver, o atributo será criado no próximo deploy do CDK

### Atribuir Usuário a Grupo

1. Navegue para **Users**
2. Selecione o usuário
3. Clique na aba **Group memberships**
4. Clique em **Add user to group**
5. Selecione o grupo apropriado
6. Clique em **Add**

### Configurar tenant_id para Usuário

1. Selecione o usuário
2. Clique na aba **Attributes**
3. Clique em **Edit**
4. Adicione/edite o atributo `custom:tenant_id`
5. Insira o UUID do tenant
6. Clique em **Save changes**

## Processo de Atribuição de Grupos

### Para Novos Usuários Internos

1. Criar usuário no Cognito
2. Atribuir ao grupo `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT`
3. **NÃO** configurar `tenant_id`
4. Enviar credenciais temporárias
5. Usuário altera senha no primeiro login

### Para Novos Usuários de Tenant

1. Criar tenant no banco de dados (tabela `tenants`)
2. Obter UUID do tenant criado
3. Criar usuário no Cognito
4. Atribuir ao grupo `TENANT_ADMIN` ou `TENANT_USER`
5. Configurar `custom:tenant_id` com UUID do tenant
6. Configurar `custom:company_name` com nome da empresa
7. Enviar credenciais temporárias
8. Usuário altera senha no primeiro login

### Fluxo de Cadastro Automatizado

```typescript
// Exemplo de código para cadastro automatizado
async function createTenantUser(
  email: string,
  tenantId: string,
  companyName: string,
  role: 'admin' | 'user'
) {
  // 1. Criar usuário no Cognito
  const user = await cognito.adminCreateUser({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'custom:tenant_id', Value: tenantId },
      { Name: 'custom:company_name', Value: companyName }
    ],
    TemporaryPassword: generateSecurePassword()
  });

  // 2. Adicionar ao grupo apropriado
  const groupName = role === 'admin' ? 'TENANT_ADMIN' : 'TENANT_USER';
  await cognito.adminAddUserToGroup({
    UserPoolId: USER_POOL_ID,
    Username: email,
    GroupName: groupName
  });

  // 3. Registrar no banco de dados
  await db.query(`
    INSERT INTO tenant_users (tenant_id, cognito_sub, email, role)
    VALUES ($1, $2, $3, $4)
  `, [tenantId, user.User.Username, email, role]);

  return user;
}
```

## Validação de Configuração

### Verificar Grupos

```bash
# Listar grupos
aws cognito-idp list-groups \
  --user-pool-id <USER_POOL_ID> \
  --region us-east-1

# Verificar membros de um grupo
aws cognito-idp list-users-in-group \
  --user-pool-id <USER_POOL_ID> \
  --group-name INTERNAL_ADMIN \
  --region us-east-1
```

### Verificar Atributos de Usuário

```bash
# Obter detalhes do usuário
aws cognito-idp admin-get-user \
  --user-pool-id <USER_POOL_ID> \
  --username <EMAIL> \
  --region us-east-1
```

### Testar Autenticação

```bash
# Iniciar autenticação
aws cognito-idp admin-initiate-auth \
  --user-pool-id <USER_POOL_ID> \
  --client-id <CLIENT_ID> \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<EMAIL>,PASSWORD=<PASSWORD> \
  --region us-east-1
```

## Troubleshooting

### Erro: "Group already exists"

**Causa**: Grupo já foi criado anteriormente

**Solução**: Ignorar erro ou verificar se o grupo está configurado corretamente

### Erro: "User already exists"

**Causa**: Usuário já foi criado anteriormente

**Solução**: Usar `admin-update-user-attributes` para atualizar atributos

### Erro: "Invalid custom attribute"

**Causa**: Custom attribute não existe no User Pool

**Solução**: 
1. Verificar se o CDK foi deployado com a configuração de custom attributes
2. Executar `cdk deploy` para atualizar o User Pool

### Usuário não consegue acessar recursos

**Causa**: Grupo ou tenant_id não configurado corretamente

**Solução**:
1. Verificar se usuário está no grupo correto
2. Verificar se `tenant_id` está configurado (para usuários de tenant)
3. Verificar logs do middleware de autorização

## Segurança

### Boas Práticas

1. ✅ **Princípio do Menor Privilégio**: Atribuir apenas as permissões necessárias
2. ✅ **Separação de Responsabilidades**: Usar grupos diferentes para funções diferentes
3. ✅ **Auditoria**: Registrar todas as atribuições de grupos em audit log
4. ✅ **Revisão Periódica**: Revisar membros dos grupos mensalmente
5. ✅ **Remoção de Acesso**: Remover usuários inativos dos grupos

### Alertas de Segurança

- ⚠️ Nunca atribuir `INTERNAL_ADMIN` a usuários externos
- ⚠️ Sempre validar `tenant_id` antes de atribuir a usuários
- ⚠️ Monitorar mudanças em grupos via CloudTrail
- ⚠️ Implementar MFA para usuários `INTERNAL_ADMIN`

## Referências

- [AWS Cognito User Pool Groups](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html)
- [Custom Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
- [Authorization with Groups](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html#cognito-user-pools-user-groups-authorization)

## Changelog

| Data | Versão | Alteração |
|------|--------|-----------|
| 2024-11-18 | 1.0.0 | Criação inicial do documento |
