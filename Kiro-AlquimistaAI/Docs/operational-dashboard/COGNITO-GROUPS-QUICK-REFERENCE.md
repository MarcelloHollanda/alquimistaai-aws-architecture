# Guia Rápido - Grupos Cognito

## Comandos Rápidos

### Executar Script de Configuração

```powershell
# Dev
.\scripts\setup-cognito-operational-groups.ps1 -Environment dev

# Prod
.\scripts\setup-cognito-operational-groups.ps1 -Environment prod
```

### Criar Grupo Manualmente

```bash
aws cognito-idp create-group \
  --user-pool-id <USER_POOL_ID> \
  --group-name INTERNAL_ADMIN \
  --description "Administradores internos" \
  --precedence 1 \
  --region us-east-1
```

### Adicionar Usuário a Grupo

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username user@example.com \
  --group-name TENANT_ADMIN \
  --region us-east-1
```

### Configurar tenant_id

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id <USER_POOL_ID> \
  --username user@example.com \
  --user-attributes Name=custom:tenant_id,Value=<TENANT_UUID> \
  --region us-east-1
```

### Listar Grupos

```bash
aws cognito-idp list-groups \
  --user-pool-id <USER_POOL_ID> \
  --region us-east-1
```

### Listar Usuários de um Grupo

```bash
aws cognito-idp list-users-in-group \
  --user-pool-id <USER_POOL_ID> \
  --group-name INTERNAL_ADMIN \
  --region us-east-1
```

## Grupos

| Grupo | Precedência | Acesso |
|-------|-------------|--------|
| INTERNAL_ADMIN | 1 | Painel Operacional + Billing |
| INTERNAL_SUPPORT | 2 | Painel Operacional |
| TENANT_ADMIN | 3 | Dashboard Cliente (Full) |
| TENANT_USER | 4 | Dashboard Cliente (Read) |

## Custom Attributes

| Atributo | Tipo | Mutável | Obrigatório Para |
|----------|------|---------|------------------|
| custom:tenant_id | String | Não | TENANT_ADMIN, TENANT_USER |
| custom:company_name | String | Sim | Todos os tenants |
| custom:user_role | String | Sim | Opcional |

## Fluxo de Cadastro

### Usuário Interno

1. Criar usuário no Cognito
2. Adicionar a `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT`
3. Enviar credenciais

### Usuário de Tenant

1. Criar tenant no DB
2. Criar usuário no Cognito
3. Configurar `custom:tenant_id`
4. Adicionar a `TENANT_ADMIN` ou `TENANT_USER`
5. Enviar credenciais

## Validação

```bash
# Verificar grupos do usuário
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id <USER_POOL_ID> \
  --username user@example.com \
  --region us-east-1

# Verificar atributos do usuário
aws cognito-idp admin-get-user \
  --user-pool-id <USER_POOL_ID> \
  --username user@example.com \
  --region us-east-1
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Grupo já existe | Ignorar ou verificar configuração |
| Usuário já existe | Usar `admin-update-user-attributes` |
| Custom attribute inválido | Deploy CDK com configuração atualizada |
| Acesso negado | Verificar grupo e tenant_id |

## Links Úteis

- [Documentação Completa](./COGNITO-GROUPS-SETUP.md)
- [Script de Setup](../../scripts/setup-cognito-operational-groups.ps1)
- [Requirements](../../.kiro/specs/operational-dashboard-alquimistaai/requirements.md)
