# Design - Onboarding de Usuários no Cognito (AlquimistaAI)

## Overview

Este documento descreve o design da solução de onboarding de usuários no Amazon Cognito para a plataforma AlquimistaAI. A solução foca em **documentação operacional** e **padronização de processos**, sem alterações no código de autenticação já validado (38/38 testes passando).

## Architecture

### Componentes Existentes (Não Alterar)

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRAESTRUTURA EXISTENTE                  │
│                         (NÃO TOCAR)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────┐                │
│  │   Cognito    │──────│  Authorization   │                │
│  │  User Pools  │      │   Middleware     │                │
│  └──────────────┘      └──────────────────┘                │
│         │                       │                            │
│         │                       │                            │
│         ▼                       ▼                            │
│  ┌──────────────────────────────────────┐                  │
│  │  Testes de Segurança (38/38 ✓)      │                  │
│  │  operational-dashboard-security.test │                  │
│  └──────────────────────────────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Novos (Documentação)

```
┌─────────────────────────────────────────────────────────────┐
│                  DOCUMENTAÇÃO OPERACIONAL                    │
│                         (CRIAR)                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │  ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md     │         │
│  │  ┌──────────────────────────────────────────┐ │         │
│  │  │  1. Localizar User Pools (dev/prod)      │ │         │
│  │  │  2. Criar grupos oficiais                │ │         │
│  │  │  3. Criar primeiro INTERNAL_ADMIN        │ │         │
│  │  │  4. Criar INTERNAL_SUPPORT (opcional)    │ │         │
│  │  │  5. Fluxo onboarding TENANT_ADMIN        │ │         │
│  │  │  6. Checklists dev/prod                  │ │         │
│  │  └──────────────────────────────────────────┘ │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │  SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md     │         │
│  │  ┌──────────────────────────────────────────┐ │         │
│  │  │  - Arquitetura de identidade             │ │         │
│  │  │  - Claims esperados                      │ │         │
│  │  │  - Grupos e permissões                   │ │         │
│  │  │  - Integração com testes                 │ │         │
│  │  └──────────────────────────────────────────┘ │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. User Pools (Cognito)

**Ambientes:**

| Ambiente | Nome do Pool | Região | Status |
|----------|--------------|--------|--------|
| Dev | `fibonacci-users-dev` | us-east-1 | Existente (via CDK) |
| Prod | `fibonacci-users-prod` | us-east-1 | Existente (via CDK) |

**Configuração Esperada:**
- Atributos padrão: email (verificado), sub
- Atributo customizado: `custom:tenant_id` (string, mutável)
- Políticas de senha: Mínimo 8 caracteres, maiúsculas, minúsculas, números
- MFA: Opcional (recomendado para INTERNAL_ADMIN em prod)

### 2. Grupos de Permissão

**Grupos Oficiais:**

```typescript
// Definição conceitual (não implementar código)
interface CognitoGroup {
  name: 'INTERNAL_ADMIN' | 'INTERNAL_SUPPORT' | 'TENANT_ADMIN' | 'TENANT_USER';
  description: string;
  precedence: number; // Menor = maior prioridade
}

const OFFICIAL_GROUPS: CognitoGroup[] = [
  {
    name: 'INTERNAL_ADMIN',
    description: 'Equipe AlquimistaAI - Acesso total',
    precedence: 1
  },
  {
    name: 'INTERNAL_SUPPORT',
    description: 'Equipe AlquimistaAI - Suporte e troubleshooting',
    precedence: 2
  },
  {
    name: 'TENANT_ADMIN',
    description: 'Cliente - Administrador do tenant',
    precedence: 3
  },
  {
    name: 'TENANT_USER',
    description: 'Cliente - Usuário do tenant',
    precedence: 4
  }
];
```

**Matriz de Permissões:**

| Ação | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|------|----------------|------------------|--------------|-------------|
| Ver todos os tenants | ✅ | ✅ | ❌ | ❌ |
| Ver próprio tenant | ✅ | ✅ | ✅ | ✅ |
| Criar/editar tenant | ✅ | ❌ | ❌ | ❌ |
| Gerenciar billing | ✅ | ❌ | ✅ | ❌ |
| Criar usuários no tenant | ✅ | ❌ | ✅ | ❌ |
| Usar agentes | ✅ | ✅ | ✅ | ✅ |
| Configurar integrações | ✅ | ❌ | ✅ | ❌ |
| Ver logs e métricas | ✅ | ✅ | ✅ | ❌ |

### 3. Claims JWT

**Estrutura do Token:**

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "marcello.admin@alquimista.ai",
  "email_verified": true,
  "cognito:groups": ["INTERNAL_ADMIN"],
  "custom:tenant_id": null,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXX",
  "iat": 1700000000,
  "exp": 1700003600
}
```

**Para usuários TENANT:**

```json
{
  "sub": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "email": "admin@cliente-x.com",
  "email_verified": true,
  "cognito:groups": ["TENANT_ADMIN"],
  "custom:tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXX",
  "iat": 1700000000,
  "exp": 1700003600
}
```

### 4. Authorization Middleware (Existente)

**Localização:** `lambda/shared/authorization-middleware.ts`

**Validações Realizadas:**
1. Token JWT válido e não expirado
2. Claim `cognito:groups` presente
3. Claim `custom:tenant_id` presente (para TENANT_*)
4. Isolamento por tenant_id em queries
5. Permissões por grupo

**Não alterar este componente** - Já validado por 38 testes.

## Data Models

### Usuário Cognito

```typescript
// Modelo conceitual (não implementar)
interface CognitoUser {
  username: string;           // Ex: "marcello.admin", "cliente-x-admin"
  email: string;              // E-mail verificado
  emailVerified: boolean;     // true
  groups: CognitoGroup[];     // Array de grupos
  attributes: {
    sub: string;              // UUID gerado pelo Cognito
    'custom:tenant_id'?: string; // UUID do tenant (se TENANT_*)
  };
  status: 'CONFIRMED' | 'FORCE_CHANGE_PASSWORD' | 'RESET_REQUIRED';
  createdAt: Date;
  lastModifiedAt: Date;
}
```

### Tenant (Backend - Existente)

```sql
-- Tabela existente no Aurora
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relação:** `custom:tenant_id` no Cognito = `tenants.id` no Aurora

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Isolamento por Tenant

*Para qualquer* usuário com `custom:tenant_id` definido, todas as queries ao banco de dados devem filtrar por esse `tenant_id`, garantindo que o usuário nunca acesse dados de outro tenant.

**Valida: Requisitos 5.5, 6.3, 6.4**

### Property 2: Grupos Oficiais Únicos

*Para qualquer* User Pool configurado, os grupos criados devem ser exatamente os quatro grupos oficiais (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER) com nomes case-sensitive.

**Valida: Requisitos 2.1, 2.4**

### Property 3: Claims Obrigatórios

*Para qualquer* token JWT retornado pelo Cognito após autenticação bem-sucedida, os claims `sub`, `email`, e `cognito:groups` devem estar presentes.

**Valida: Requisitos 1.2, 2.2**

### Property 4: Tenant ID para Clientes

*Para qualquer* usuário nos grupos TENANT_ADMIN ou TENANT_USER, o claim `custom:tenant_id` deve estar presente e ser um UUID válido.

**Valida: Requisitos 5.3, 6.2, 12.1**

### Property 5: INTERNAL sem Tenant ID

*Para qualquer* usuário nos grupos INTERNAL_ADMIN ou INTERNAL_SUPPORT, o claim `custom:tenant_id` deve ser null ou ausente.

**Valida: Requisitos 3.3, 4.3**

### Property 6: Múltiplos INTERNAL_ADMIN em Prod

*Para qualquer* ambiente de produção, deve existir no mínimo 2 usuários no grupo INTERNAL_ADMIN para evitar lock-out.

**Valida: Requisitos 7.3**

### Property 7: E-mails Corporativos em Prod

*Para qualquer* usuário INTERNAL_* criado em produção, o e-mail deve ser de domínio corporativo (@alquimista.ai ou similar), não e-mails pessoais.

**Valida: Requisitos 7.2**

### Property 8: Testes de Segurança Verdes

*Para qualquer* mudança em autenticação ou autorização, os 38 testes em `operational-dashboard-security.test.ts` devem passar (100%).

**Valida: Requisitos 9.1, 9.2, 9.3**

### Property 9: Checklist de Onboarding Completo

*Para qualquer* novo cliente onboardado, todos os passos do checklist (criar tenant, criar usuário Cognito, definir tenant_id, adicionar a grupo, validar acesso) devem ser executados.

**Valida: Requisitos 10.3**

### Property 10: Documentação Atualizada

*Para qualquer* mudança em processos de onboarding, a documentação em `docs/security/ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md` deve ser atualizada e o índice `docs/INDEX-OPERATIONS-AWS.md` deve referenciar a nova documentação.

**Valida: Requisitos 8.4**

## Error Handling

### Erros de Configuração

| Erro | Causa | Solução Documentada |
|------|-------|---------------------|
| User Pool não encontrado | Nome incorreto ou região errada | Verificar CloudFormation outputs |
| Grupo não existe | Grupo não criado ou nome incorreto | Criar grupo com nome exato (case-sensitive) |
| Atributo custom:tenant_id ausente | Atributo não configurado no pool | Verificar schema de atributos do User Pool |
| Usuário sem grupo | Usuário criado mas não adicionado a grupo | Adicionar usuário ao grupo apropriado |

### Erros de Onboarding

| Erro | Causa | Solução Documentada |
|------|-------|---------------------|
| Tenant ID inválido | UUID mal formatado | Validar formato UUID antes de definir |
| E-mail não verificado | Usuário criado sem verificação | Marcar e-mail como verificado no console |
| Múltiplos grupos | Usuário em mais de um grupo | Remover de grupos extras, manter apenas um |
| Acesso negado após login | Claims incorretos ou middleware desatualizado | Verificar token JWT e validar middleware |

### Erros de Testes

| Erro | Causa | Solução Documentada |
|------|-------|---------------------|
| Testes de segurança falhando | Mudança em auth quebrou contrato | Reverter mudança e corrigir antes de deploy |
| Mock de Cognito desatualizado | Testes usando estrutura antiga de claims | Atualizar mocks para refletir claims reais |
| Isolamento de tenant falhando | tenant_id não sendo validado | Verificar authorization-middleware |

## Testing Strategy

### Abordagem Dual

Esta spec foca em **documentação**, não em novos testes. Os testes existentes já cobrem a funcionalidade:

**Testes Existentes (Não Alterar):**
- ✅ `tests/security/operational-dashboard-security.test.ts` (38 testes)
  - Validação de claims
  - Isolamento por tenant
  - Permissões por grupo
  - Bloqueio de acesso cross-tenant

**Validação Manual (Documentar):**
- Checklist de criação de usuários
- Validação de login real no painel
- Verificação de claims no token JWT
- Teste de acesso restrito por tenant

### Testes de Regressão

Antes de qualquer deploy:

```bash
# Executar suite de segurança
npm test -- tests/security/operational-dashboard-security.test.ts

# Resultado esperado: 38/38 passando
```

Se qualquer teste falhar:
1. ❌ **NÃO** fazer deploy
2. 🔍 Investigar causa da falha
3. 🔧 Corrigir problema
4. ✅ Re-executar testes até 38/38 passar

### Validação de Documentação

**Critérios de Aceitação:**
- [ ] Documentação inclui screenshots do console AWS
- [ ] Checklists são executáveis passo a passo
- [ ] Comandos são testados e funcionam
- [ ] Índices estão atualizados
- [ ] Links internos funcionam

## Implementation Notes

### Princípios

1. **Não Tocar no Código**: Esta spec é 100% documentação
2. **Validar com Testes**: Sempre rodar os 38 testes antes de deploy
3. **Governança em Prod**: Múltiplos admins, e-mails corporativos
4. **Checklists Executáveis**: Documentação deve ser acionável
5. **Screenshots Atualizados**: Console AWS muda, manter docs atualizados

### Estrutura de Documentação

```
docs/
├── security/
│   ├── ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md  ← Principal
│   ├── SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md  ← Visão geral
│   └── README.md                                  ← Índice de segurança
├── INDEX-OPERATIONS-AWS.md                        ← Atualizar
└── README.md                                      ← Atualizar
```

### Seções do Guia Principal

**ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md:**

1. **Introdução**
   - Contexto do sistema
   - Arquitetura de identidade
   - Claims esperados

2. **Ambiente DEV**
   - 2.1. Localizar User Pool
   - 2.2. Criar grupos oficiais
   - 2.3. Criar primeiro INTERNAL_ADMIN
   - 2.4. Criar INTERNAL_SUPPORT (opcional)
   - 2.5. Fluxo onboarding TENANT_ADMIN

3. **Ambiente PROD**
   - 3.1. Replicar estrutura de dev
   - 3.2. Governança (múltiplos admins, e-mails corporativos)
   - 3.3. Onboarding de clientes em prod

4. **Checklists Operacionais**
   - 4.1. Checklist rápido - preparar dev
   - 4.2. Checklist rápido - preparar prod
   - 4.3. Checklist - onboarding de novo cliente

5. **Integração com Testes de Segurança**
   - 5.1. Contrato oficial (38 testes)
   - 5.2. Como executar testes
   - 5.3. O que fazer se testes falharem

6. **Troubleshooting**
   - 6.1. Erros comuns
   - 6.2. Como validar claims
   - 6.3. Como verificar isolamento de tenant

7. **Referências**
   - Links para código
   - Links para testes
   - Links para outros docs

### Comandos Úteis

```bash
# Listar User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Listar grupos de um pool
aws cognito-idp list-groups --user-pool-id us-east-1_XXXXXX --region us-east-1

# Listar usuários de um pool
aws cognito-idp list-users --user-pool-id us-east-1_XXXXXX --region us-east-1

# Descrever usuário específico
aws cognito-idp admin-get-user --user-pool-id us-east-1_XXXXXX --username marcello.admin --region us-east-1

# Executar testes de segurança
npm test -- tests/security/operational-dashboard-security.test.ts
```

## Security Considerations

### Governança em Produção

1. **Múltiplos Administradores**: Sempre ter 2+ INTERNAL_ADMIN em prod
2. **E-mails Corporativos**: Nunca usar e-mails pessoais em prod
3. **MFA Recomendado**: Habilitar MFA para INTERNAL_ADMIN
4. **Auditoria**: Logs do Cognito devem ser enviados para CloudWatch

### Isolamento de Tenants

1. **Validação Obrigatória**: Authorization middleware SEMPRE valida tenant_id
2. **Queries Filtradas**: Todas as queries ao Aurora incluem WHERE tenant_id = ?
3. **Testes Contínuos**: 38 testes garantem isolamento
4. **Zero Trust**: Nunca confiar apenas no frontend

### Rotação de Credenciais

1. **Senhas Temporárias**: Usuários devem trocar senha no primeiro login
2. **Tokens de Curta Duração**: JWT expira em 1 hora
3. **Refresh Tokens**: Válidos por 30 dias, podem ser revogados
4. **Revogação de Acesso**: Admin pode desabilitar usuário no Cognito

## Deployment Strategy

### Não Há Deploy de Código

Esta spec **não envolve deploy de código**. Apenas:

1. ✅ Criar documentação em `docs/security/`
2. ✅ Atualizar índices em `docs/`
3. ✅ Validar que testes continuam passando
4. ✅ Commit e push da documentação

### Validação Pós-Documentação

Após criar a documentação:

1. **Executar Testes**: `npm test -- tests/security/operational-dashboard-security.test.ts`
2. **Validar Links**: Verificar que todos os links internos funcionam
3. **Review de Pares**: Outro membro da equipe deve revisar
4. **Atualizar Índices**: Garantir que docs estão referenciados

## Monitoring and Observability

### Logs do Cognito

**CloudWatch Logs Groups:**
- `/aws/cognito/userpools/fibonacci-users-dev`
- `/aws/cognito/userpools/fibonacci-users-prod`

**Eventos Importantes:**
- Login bem-sucedido
- Login falhado (senha incorreta)
- Criação de usuário
- Adição a grupo
- Mudança de senha

### Métricas

**CloudWatch Metrics:**
- `SignInSuccesses` - Logins bem-sucedidos
- `SignInThrottles` - Tentativas bloqueadas por rate limiting
- `UserAuthenticationFailed` - Falhas de autenticação

### Alertas Recomendados

1. **Múltiplas Falhas de Login**: > 5 falhas em 5 minutos para mesmo usuário
2. **Criação Massiva de Usuários**: > 10 usuários criados em 1 hora
3. **Mudanças em Grupos**: Qualquer adição/remoção de grupos INTERNAL_*

## Future Enhancements

### Fora do Escopo Atual

1. **Automação de Onboarding**: Script para criar tenant + usuário automaticamente
2. **Self-Service para TENANT_ADMIN**: Interface para criar TENANT_USER
3. **SSO Corporativo**: Integração com SAML/OIDC para clientes enterprise
4. **Auditoria Avançada**: Dashboard de ações de usuários
5. **Rotação Automática**: Forçar troca de senha a cada 90 dias

### Possíveis Melhorias

1. **Templates de E-mail**: Customizar e-mails de convite do Cognito
2. **Branding**: Logo da AlquimistaAI na tela de login do Cognito
3. **Políticas de Senha**: Aumentar complexidade para INTERNAL_*
4. **Backup de Usuários**: Export periódico de usuários para S3

## Conclusion

Este design foca em **documentação operacional clara e acionável** para onboarding de usuários no Cognito, sem alterar código já validado. A implementação consistirá em criar guias passo a passo, checklists e referências técnicas para a equipe operacional.

**Próximo Passo**: Criar `tasks.md` com plano de implementação detalhado.
