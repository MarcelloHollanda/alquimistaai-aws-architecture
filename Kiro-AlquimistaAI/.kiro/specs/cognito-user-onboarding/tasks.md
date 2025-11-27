# Plano de Implementação - Onboarding de Usuários no Cognito

## Visão Geral

Este plano detalha as tarefas para criar documentação operacional completa sobre onboarding de usuários no Amazon Cognito para a plataforma AlquimistaAI. **Não há alterações de código** - apenas documentação.

---

## Tarefas

- [x] 1. Criar documentação principal de onboarding



  - Criar arquivo `docs/security/ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md`
  - Incluir todas as seções: Introdução, Ambiente DEV, Ambiente PROD, Checklists, Integração com Testes, Troubleshooting, Referências
  - Adicionar comandos AWS CLI úteis
  - Incluir exemplos de estrutura de claims JWT
  - _Requisitos: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4, 12.1, 12.2, 12.3, 12.4_

- [ ] 2. Documentar seção: Introdução e Contexto
  - Explicar arquitetura de identidade do sistema
  - Descrever User Pools (dev e prod)
  - Listar claims esperados pelo authorization-middleware
  - Criar tabela de grupos e permissões
  - _Requisitos: 1.1, 1.2, 2.1, 2.2_

- [ ] 3. Documentar seção: Ambiente DEV - Localizar User Pools
  - Passo a passo para acessar Console AWS → Amazon Cognito
  - Como identificar o pool dev (fibonacci-users-dev)
  - Cross-check opcional via CloudFormation
  - Incluir screenshots ou descrições detalhadas
  - _Requisitos: 1.1, 1.3, 8.1_

- [ ] 4. Documentar seção: Ambiente DEV - Criar Grupos Oficiais
  - Passo a passo para criar os 4 grupos no User Pool
  - Nomes exatos: INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER
  - Explicar importância de case-sensitivity
  - Documentar que esses nomes são assumidos pelos testes
  - _Requisitos: 2.1, 2.3, 2.4_

- [ ] 5. Documentar seção: Ambiente DEV - Criar Primeiro INTERNAL_ADMIN
  - Passo a passo para criar usuário marcello.admin
  - Como definir e-mail e marcar como verificado
  - Como adicionar usuário ao grupo INTERNAL_ADMIN
  - Explicar que este é o usuário master do painel interno
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Documentar seção: Ambiente DEV - Criar INTERNAL_SUPPORT (Opcional)
  - Passo a passo para criar usuário support.internal
  - Como adicionar ao grupo INTERNAL_SUPPORT
  - Explicar diferença de permissões vs INTERNAL_ADMIN
  - Documentar que este perfil é para operadores de suporte
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Documentar seção: Ambiente DEV - Fluxo Onboarding TENANT_ADMIN
  - Passo 1: Criar tenant no backend (gerar UUID)
  - Passo 2: Criar usuário Cognito (cliente-x-admin)
  - Passo 3: Definir atributo custom:tenant_id
  - Passo 4: Adicionar usuário ao grupo TENANT_ADMIN
  - Explicar que testes garantem isolamento por tenant_id
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 12.1, 12.2_

- [ ] 8. Documentar seção: Ambiente DEV - Criar TENANT_USER
  - Explicar que TENANT_ADMIN pode criar TENANT_USER pelo dashboard
  - Documentar fluxo manual via console (se necessário)
  - Passo a passo para definir custom:tenant_id
  - Passo a passo para adicionar ao grupo TENANT_USER
  - _Requisitos: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Documentar seção: Ambiente PROD - Replicar Estrutura
  - Identificar User Pool prod (fibonacci-users-prod)
  - Repetir criação dos 4 grupos oficiais
  - Documentar diferenças de governança vs dev
  - _Requisitos: 7.1_

- [ ] 10. Documentar seção: Ambiente PROD - Governança
  - Criar ao menos 2 usuários INTERNAL_ADMIN
  - Usar e-mails corporativos (não pessoais)
  - Recomendar MFA para INTERNAL_ADMIN
  - Explicar política de "nunca usar dev em prod"
  - _Requisitos: 7.2, 7.3_

- [ ] 11. Documentar seção: Ambiente PROD - Onboarding de Clientes
  - Somente após contrato assinado
  - Seguir mesmo fluxo de dev
  - Validar e-mails corporativos do cliente
  - Documentar processo de validação de acesso
  - _Requisitos: 7.4_

- [ ] 12. Documentar seção: Checklists Operacionais
  - Criar checklist rápido para preparar dev
  - Criar checklist rápido para preparar prod
  - Criar checklist para onboarding de novo cliente
  - Incluir comandos específicos para cada etapa
  - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Documentar seção: Integração com Testes de Segurança
  - Explicar que testes são contrato oficial entre Cognito e backend
  - Documentar comando: npm test -- tests/security/operational-dashboard-security.test.ts
  - Explicar que 38/38 testes verdes são pré-requisito para deploy
  - Documentar o que fazer se testes falharem
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 11.1, 11.2, 11.3, 11.4_

- [ ] 14. Documentar seção: Troubleshooting
  - Criar tabela de erros comuns de configuração
  - Criar tabela de erros comuns de onboarding
  - Criar tabela de erros comuns de testes
  - Incluir soluções passo a passo para cada erro
  - Documentar como validar claims JWT
  - Documentar como verificar isolamento de tenant
  - _Requisitos: 8.1, 8.2, 8.3_

- [ ] 15. Documentar seção: Referências
  - Links para authorization-middleware
  - Links para testes de segurança
  - Links para outros documentos relevantes
  - Comandos AWS CLI úteis
  - _Requisitos: 8.4_

- [ ] 16. Criar documentação de visão geral de identidade
  - Criar arquivo `docs/security/SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md`
  - Seção: Arquitetura de identidade
  - Seção: Claims esperados
  - Seção: Grupos e permissões (matriz completa)
  - Seção: Integração com testes
  - Seção: Fluxos de autenticação
  - _Requisitos: 1.2, 2.1, 2.2, 8.4_

- [ ] 17. Atualizar índice de operações AWS
  - Abrir arquivo `docs/INDEX-OPERATIONS-AWS.md`
  - Adicionar entrada "Identidade & Acesso (Cognito)"
  - Linkar para ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md
  - Linkar para SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md
  - _Requisitos: 8.4_

- [ ] 18. Atualizar README de segurança
  - Abrir arquivo `docs/security/README.md`
  - Adicionar seção sobre onboarding de usuários
  - Linkar para documentos criados
  - Atualizar índice de conteúdo
  - _Requisitos: 8.4_

- [ ] 19. Atualizar README principal de docs
  - Abrir arquivo `docs/README.md`
  - Adicionar link para onboarding do Cognito
  - Atualizar seção de segurança
  - _Requisitos: 8.4_

- [ ] 20. Validar testes de segurança
  - Executar: npm test -- tests/security/operational-dashboard-security.test.ts
  - Confirmar que 38/38 testes passam
  - Documentar resultado em arquivo de validação
  - Se falhar, investigar e corrigir antes de prosseguir
  - _Requisitos: 9.1, 9.2, 9.3, 9.4_

- [ ] 21. Validar links internos da documentação
  - Verificar todos os links em ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md
  - Verificar todos os links em SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md
  - Verificar links nos índices atualizados
  - Corrigir links quebrados
  - _Requisitos: 8.4_

- [ ] 22. Criar arquivo de resumo da spec
  - Criar arquivo `.kiro/specs/cognito-user-onboarding/SPEC-COMPLETE.md`
  - Resumir o que foi implementado
  - Listar arquivos criados/atualizados
  - Documentar validações realizadas
  - Incluir próximos passos (se houver)
  - _Requisitos: Todos_

- [ ] 23. Checkpoint Final - Validação Completa
  - Executar testes de segurança novamente
  - Validar que todos os arquivos foram criados
  - Validar que todos os índices foram atualizados
  - Validar que links funcionam
  - Confirmar com usuário se documentação está adequada
  - _Requisitos: Todos_

---

## Notas de Implementação

### Princípios

1. **Documentação Clara**: Usar linguagem simples e direta
2. **Passo a Passo**: Cada seção deve ser executável
3. **Screenshots/Descrições**: Facilitar para equipe não-técnica
4. **Comandos Testados**: Todos os comandos devem funcionar
5. **Links Funcionais**: Validar todos os links internos

### Estrutura de Arquivos

```
docs/
├── security/
│   ├── ONBOARDING-USERS-COGNITO-ALQUIMISTAAI.md  ← Criar (Tarefas 1-15)
│   ├── SECURITY-IDENTITY-AND-ACCESS-OVERVIEW.md  ← Criar (Tarefa 16)
│   └── README.md                                  ← Atualizar (Tarefa 18)
├── INDEX-OPERATIONS-AWS.md                        ← Atualizar (Tarefa 17)
└── README.md                                      ← Atualizar (Tarefa 19)

.kiro/specs/cognito-user-onboarding/
└── SPEC-COMPLETE.md                               ← Criar (Tarefa 22)
```

### Validações

Após cada grupo de tarefas:

1. **Após Tarefas 1-15**: Validar que documento principal está completo
2. **Após Tarefa 16**: Validar que visão geral está clara
3. **Após Tarefas 17-19**: Validar que índices estão atualizados
4. **Após Tarefa 20**: Confirmar 38/38 testes passando
5. **Após Tarefa 21**: Confirmar todos os links funcionam
6. **Após Tarefa 23**: Validação final completa

### Comandos Úteis

```bash
# Executar testes de segurança
npm test -- tests/security/operational-dashboard-security.test.ts

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
```

### Referências

- Authorization Middleware: `lambda/shared/authorization-middleware.ts`
- Testes de Segurança: `tests/security/operational-dashboard-security.test.ts`
- Contexto do Projeto: `.kiro/steering/contexto-projeto-alquimista.md`
- Blueprint Comercial: `.kiro/steering/blueprint-comercial-assinaturas.md`

---

## Critérios de Conclusão

A spec estará completa quando:

- ✅ Documento principal de onboarding criado e completo
- ✅ Documento de visão geral de identidade criado
- ✅ Todos os índices atualizados
- ✅ Testes de segurança passando (38/38)
- ✅ Links internos validados e funcionando
- ✅ Arquivo de resumo da spec criado
- ✅ Usuário confirma que documentação está adequada

---

## Próximos Passos (Fora do Escopo)

Após conclusão desta spec, considerar:

1. **Automação**: Script para criar tenant + usuário automaticamente
2. **Self-Service**: Interface para TENANT_ADMIN criar TENANT_USER
3. **SSO**: Integração com SAML/OIDC para clientes enterprise
4. **Auditoria**: Dashboard de ações de usuários
5. **Templates**: Customizar e-mails de convite do Cognito
