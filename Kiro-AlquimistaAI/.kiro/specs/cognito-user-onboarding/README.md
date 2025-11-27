# Spec: Onboarding de Usuários no Cognito (AlquimistaAI)

## Visão Geral

Esta spec define o processo completo de onboarding de usuários no Amazon Cognito para a plataforma AlquimistaAI, incluindo:

- Padronização de User Pools para dev e prod
- Criação de grupos oficiais de permissão
- Fluxos de criação de usuários internos e clientes
- Documentação operacional para equipe não-técnica
- Integração com testes de segurança existentes

## Contexto

O sistema AlquimistaAI já possui:
- ✅ Infraestrutura de autenticação com Cognito (CDK)
- ✅ Authorization middleware validado
- ✅ 38/38 testes de segurança passando (100%)
- ❌ Falta: Usuários e grupos reais materializados no Cognito
- ❌ Falta: Documentação operacional para equipe não-técnica

## Objetivos

1. **Padronizar** User Pools do Cognito para dev/prod
2. **Criar** grupos oficiais de permissão (INTERNAL_*, TENANT_*)
3. **Provisionar** primeiro usuário INTERNAL_ADMIN (CEO)
4. **Documentar** fluxos de onboarding para equipe operacional
5. **Validar** integração com testes de segurança existentes

## Estrutura de Grupos

| Grupo | Tipo | Acesso Principal |
|-------|------|------------------|
| INTERNAL_ADMIN | Equipe AlquimistaAI | Todos os tenants, configurações globais |
| INTERNAL_SUPPORT | Equipe AlquimistaAI | Suporte e troubleshooting, sem poderes críticos |
| TENANT_ADMIN | Cliente | Gestão do próprio tenant, usuários, integrações |
| TENANT_USER | Cliente | Uso diário dos agentes, acesso restrito |

## Claims Esperados

O authorization-middleware espera os seguintes claims do Cognito:

- `sub` → ID do usuário no Cognito
- `email` → E-mail de login
- `cognito:groups` → Grupos de permissão (array)
- `custom:tenant_id` → UUID do tenant (quando usuário for cliente)

## Arquivos da Spec

- `requirements.md` - Requisitos detalhados com user stories e acceptance criteria
- `design.md` - Design da solução e arquitetura de onboarding
- `tasks.md` - Plano de implementação com tarefas específicas

## Documentação Gerada

Esta spec irá gerar/atualizar:

- `docs/security/ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md` - Guia principal de onboarding
- `docs/security/SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md` - Visão geral de identidade e acesso
- `docs/INDEX-OPERATIONS-AWS.md` - Índice atualizado com entrada de Cognito
- `docs/README.md` - Link para documentação de onboarding

## Testes de Segurança

Os testes em `tests/security/operational-dashboard-security.test.ts` são o **contrato oficial** entre Cognito e o backend. Devem permanecer 100% verdes (38/38) sempre.

Antes de qualquer deploy relevante:
```bash
npm test -- tests/security/operational-dashboard-security.test.ts
```

## Ambientes

### Dev
- User Pool: `fibonacci-users-dev`
- Região: `us-east-1`
- Propósito: Desenvolvimento e testes

### Prod
- User Pool: `fibonacci-users-prod`
- Região: `us-east-1`
- Propósito: Produção com governança

## Próximos Passos

1. ✅ Requisitos definidos
2. ⏳ Criar design.md com arquitetura detalhada
3. ⏳ Criar tasks.md com plano de implementação
4. ⏳ Executar tarefas de documentação
5. ⏳ Validar com testes de segurança

## Referências

- Blueprint original: `.kiro/steering/blueprint-comercial-assinaturas.md`
- Testes de segurança: `tests/security/operational-dashboard-security.test.ts`
- Authorization middleware: `lambda/shared/authorization-middleware.ts`
- Contexto do projeto: `.kiro/steering/contexto-projeto-alquimista.md`
