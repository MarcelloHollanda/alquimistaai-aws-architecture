# Plano de Implementação - Sistema de Autenticação Cognito Completo

## Visão Geral

Este documento contém a lista de tarefas para implementar o sistema completo de autenticação com Amazon Cognito, organizada em ordem lógica de execução. Cada tarefa é incremental e referencia os requisitos do documento de requirements.md.

---

## Tarefas

- [x] 1. Configurar infraestrutura base de autenticação




  - Criar/atualizar Cognito User Pool com atributos customizados (custom:tenantId, custom:role)
  - Configurar provedores OAuth (Google e Facebook) no Cognito
  - Configurar Hosted UI do Cognito com domínio customizado
  - Criar bucket S3 para logomarcas: `alquimistaai-logos`
  - Configurar políticas de acesso ao S3
  - _Requisitos: 1.3, 1.4, 3.5, 5.4_

- [x] 2. Implementar biblioteca cliente do Cognito

  - [x] 2.1 Criar/atualizar `lib/cognito-client.ts` com todas as funções


    - Implementar `signIn()` para login com e-mail/senha
    - Implementar `signUp()` para cadastro de usuário
    - Implementar `confirmSignUp()` para confirmação de e-mail
    - Implementar `forgotPassword()` para iniciar recuperação
    - Implementar `confirmPassword()` para redefinir senha
    - Implementar `changePassword()` para alterar senha (usuário autenticado)
    - Implementar `getCurrentUser()` para obter usuário atual
    - Implementar `getAccessToken()` para obter token de acesso
    - Implementar `signOut()` para logout
    - Implementar `signInWithGoogle()` para redirecionar ao OAuth Google
    - Implementar `signInWithFacebook()` para redirecionar ao OAuth Facebook
    - Implementar `handleOAuthCallback()` para processar retorno OAuth
    - _Requisitos: 1.2, 1.3, 1.4, 2.2, 2.5, 4.4, 7.1, 7.2, 7.3_

  - [x] 2.2 Criar hook `hooks/use-auth.ts` para gerenciar estado de autenticação


    - Implementar estado global de usuário autenticado
    - Implementar funções wrapper para cognito-client
    - Implementar loading states e error handling
    - _Requisitos: 1.2, 1.5, 8.2, 10.1_

  - [x] 2.3 Criar utilitário de mapeamento de erros do Cognito


    - Criar `lib/cognito-errors.ts` com mapeamento de erros para português
    - Implementar função `translateCognitoError()`
    - _Requisitos: 1.5, 8.1, 8.2, 10.6_


- [x] 3. Criar migrations de banco de dados

  - [x] 3.1 Criar migration para tabela `companies`


    - Definir schema com campos: id, tenant_id, name, legal_name, cnpj, segment, logo_url
    - Criar índices: tenant_id, cnpj
    - _Requisitos: 3.5, 3.9, 5.6, 9.2_

  - [x] 3.2 Criar migration para tabela `users`


    - Definir schema com campos: id, cognito_sub, tenant_id, email, name, phone, language, timezone
    - Criar índices: tenant_id, cognito_sub, email
    - Adicionar foreign key para companies(tenant_id)
    - _Requisitos: 3.9, 4.6, 9.1_

  - [x] 3.3 Criar migration para tabela `user_roles`


    - Definir schema com campos: id, user_id, tenant_id, role
    - Criar constraint CHECK para role (MASTER, ADMIN, OPERATIONAL, READ_ONLY)
    - Criar índices: user_id, tenant_id
    - Adicionar foreign keys
    - _Requisitos: 3.7, 3.8, 4.3, 9.1_

  - [x] 3.4 Criar migration para tabela `integrations`


    - Definir schema com campos: id, tenant_id, integration_name, status, secrets_path, metadata
    - Criar índice: tenant_id
    - _Requisitos: 6.6, 9.4_


- [x] 4. Implementar handlers Lambda de backend

  - [x] 4.1 Criar handler `lambda/platform/create-company.ts`



    - Validar dados de entrada (nome, CNPJ, segmento)
    - Gerar tenantId único
    - Inserir registro em companies
    - Retornar tenantId e dados da empresa
    - _Requisitos: 3.9, 9.2_

  - [x] 4.2 Criar handler `lambda/platform/update-company.ts`



    - Validar permissões (Master ou Admin)
    - Validar dados de entrada
    - Atualizar registro em companies
    - Retornar dados atualizados

    - _Requisitos: 5.2, 5.3, 5.6_

  - [x] 4.3 Criar handler `lambda/platform/upload-logo.ts`

    - Validar tipo de arquivo (imagem)
    - Validar tamanho (máx 2MB)
    - Fazer upload para S3: `alquimistaai-logos/{tenantId}/logo.{ext}`
    - Retornar URL pública
    - _Requisitos: 3.5, 5.4_


  - [x] 4.4 Criar handler `lambda/platform/create-user.ts`

    - Validar dados de entrada
    - Inserir registro em users
    - Inserir registro em user_roles
    - Retornar userId e dados do usuário
    - _Requisitos: 3.9, 9.1_


  - [x] 4.5 Criar handler `lambda/platform/update-user.ts`

    - Validar permissões (próprio usuário)
    - Validar dados de entrada
    - Atualizar registro em users
    - Retornar dados atualizados
    - _Requisitos: 4.6_

  - [x] 4.6 Criar handler `lambda/platform/get-user.ts`


    - Buscar usuário por ID ou cognito_sub
    - Incluir dados da empresa (JOIN)
    - Incluir papel do usuário (JOIN user_roles)
    - Retornar dados completos
    - _Requisitos: 4.1, 5.1_

  - [x] 4.7 Criar handler `lambda/platform/connect-integration.ts`


    - Validar permissões (Master ou Admin)
    - Armazenar credenciais no Secrets Manager
    - Path: `/alquimista/{env}/{tenantId}/{integration}`
    - Atualizar status em integrations
    - _Requisitos: 6.5, 6.6_

  - [x] 4.8 Criar handler `lambda/platform/disconnect-integration.ts`


    - Validar permissões (Master ou Admin)
    - Remover credenciais do Secrets Manager
    - Atualizar status em integrations
    - _Requisitos: 6.7_

  - [x] 4.9 Criar handler `lambda/platform/list-integrations.ts`


    - Buscar integrações do tenant
    - Retornar lista com status de cada integração
    - _Requisitos: 6.4_



- [ ] 5. Criar componentes de UI reutilizáveis
  - [x] 5.1 Criar componente `components/auth/login-form.tsx`

    - Campos: e-mail, senha
    - Validação client-side
    - Integração com use-auth hook
    - Exibição de erros
    - _Requisitos: 1.1, 1.2, 1.5, 8.2, 10.1, 10.2_

  - [x] 5.2 Criar componente `components/auth/social-login-buttons.tsx`


    - Botão "Continuar com Google"
    - Botão "Continuar com Facebook"
    - Estilização com ícones dos provedores
    - _Requisitos: 1.3, 1.4_


  - [x] 5.3 Criar componente `components/auth/forgot-password-form.tsx`

    - Campo: e-mail
    - Validação de e-mail
    - Integração com cognito-client
    - _Requisitos: 2.1, 2.2, 10.2_


  - [x] 5.4 Criar componente `components/auth/reset-password-form.tsx`

    - Campos: código de verificação, nova senha, confirmar senha
    - Validação de senha (força)
    - Integração com cognito-client
    - _Requisitos: 2.4, 2.5, 2.7, 10.3_

  - [x] 5.5 Atualizar componente `components/auth/register-wizard.tsx`


    - Garantir 3 passos: dados pessoais, empresa, confirmação
    - Validação por passo
    - Upload de logomarca
    - Integração com handlers de backend
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_


  - [x] 5.6 Criar componente `components/settings/settings-tabs.tsx`

    - Container com 3 abas: Perfil, Empresa, Integrações
    - Navegação entre abas
    - _Requisitos: 4.1, 5.1, 6.1_

  - [x] 5.7 Criar componente `components/settings/profile-tab.tsx`

    - Campos: nome, telefone, idioma, fuso horário
    - Exibição de papel (read-only)
    - Botão "Alterar senha"
    - Integração com handler update-user
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_


  - [x] 5.8 Criar componente `components/settings/company-tab.tsx`


    - Campos: nome fantasia, razão social, CNPJ, segmento
    - Upload de logomarca
    - Controle de permissões (Master/Admin pode editar)
    - Campos read-only: tenantId, data de criação
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.9 Criar componente `components/settings/integrations-tab.tsx`


    - Verificação de permissões (Master/Admin)
    - Lista de integrações disponíveis
    - Status de cada integração (Conectado/Não conectado)
    - Botões "Conectar"/"Desconectar"
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_



- [ ] 6. Criar páginas de autenticação
  - [x] 6.1 Atualizar página `app/auth/login/page.tsx`

    - Renderizar LoginForm
    - Renderizar SocialLoginButtons
    - Links para "Esqueci minha senha" e "Criar nova conta"
    - Layout responsivo
    - _Requisitos: 1.1, 1.6, 1.7, 8.4_

  - [x] 6.2 Criar página `app/auth/forgot-password/page.tsx`


    - Renderizar ForgotPasswordForm
    - Redirecionar para reset-password após sucesso
    - _Requisitos: 2.1, 2.2, 2.3_

  - [x] 6.3 Criar página `app/auth/reset-password/page.tsx`


    - Renderizar ResetPasswordForm
    - Receber e-mail via query params
    - Redirecionar para login após sucesso
    - _Requisitos: 2.4, 2.5, 2.6_

  - [x] 6.4 Atualizar página `app/auth/register/page.tsx`


    - Renderizar RegisterWizard
    - Redirecionar para confirmação após sucesso
    - _Requisitos: 3.1, 3.10_

  - [x] 6.5 Criar página `app/auth/callback/page.tsx`


    - Processar callback OAuth (Google/Facebook)
    - Extrair código da URL
    - Chamar handleOAuthCallback
    - Armazenar tokens
    - Redirecionar para dashboard
    - _Requisitos: 1.3, 1.4, 1.8_

  - [x] 6.6 Criar página `app/auth/confirm/page.tsx`


    - Exibir mensagem de confirmação de e-mail
    - Permitir reenvio de código
    - Link para login
    - _Requisitos: 3.10_



- [x] 7. Criar página de configurações

  - [x] 7.1 Criar página `app/settings/page.tsx`

    - Renderizar SettingsTabs
    - Carregar dados do usuário e empresa
    - Gerenciar estado das abas
    - _Requisitos: 4.1, 5.1, 6.1_

- [x] 8. Implementar proteção de rotas e middleware



  - [x] 8.1 Criar/atualizar `middleware.ts`

    - Verificar token em cookies para rotas /app/*
    - Redirecionar para /auth/login se não autenticado
    - Permitir acesso a rotas públicas (/auth/*)

    - _Requisitos: 7.4_

  - [x] 8.2 Criar API route `app/api/auth/session/route.ts`

    - Armazenar tokens do Cognito em cookies HttpOnly
    - Configurar cookies com flags Secure e SameSite
    - Implementar refresh token rotation
    - _Requisitos: 1.8, 7.1, 7.2_


- [x] 9. Adicionar rotas no API Gateway

  - Adicionar rota POST /api/companies
  - Adicionar rota PUT /api/companies/{tenantId}
  - Adicionar rota POST /api/upload/logo
  - Adicionar rota POST /api/users
  - Adicionar rota PUT /api/users/{userId}
  - Adicionar rota GET /api/users/{userId}
  - Adicionar rota POST /api/integrations/connect
  - Adicionar rota POST /api/integrations/disconnect
  - Adicionar rota GET /api/integrations
  - Configurar CORS apropriado
  - _Requisitos: Todos os requisitos de backend_


- [x] 10. Configurar variáveis de ambiente

  - Adicionar NEXT_PUBLIC_COGNITO_USER_POOL_ID
  - Adicionar NEXT_PUBLIC_COGNITO_CLIENT_ID
  - Adicionar NEXT_PUBLIC_COGNITO_DOMAIN
  - Adicionar NEXT_PUBLIC_APP_URL
  - Adicionar AWS_REGION
  - Adicionar S3_LOGOS_BUCKET
  - Documentar variáveis em .env.example
  - _Requisitos: Configuração geral_



- [ ] 11. Implementar validações e tratamento de erros
  - [x] 11.1 Criar utilitário `lib/validators.ts`


    - Função validateEmail()
    - Função validatePassword() com requisitos
    - Função validateCNPJ()
    - Função validatePhone()
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_


  - [x] 11.2 Adicionar tratamento de erros em todos os componentes



    - Exibir mensagens de erro amigáveis
    - Traduzir erros do Cognito para português
    - Exibir erros de validação específicos por campo
    - _Requisitos: 1.5, 2.7, 8.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 12. Adicionar testes





  - [x] 12.1 Criar testes unitários para validadores


    - Testar validateEmail com casos válidos e inválidos
    - Testar validatePassword com diferentes cenários
    - Testar validateCNPJ
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_


  - [x] 12.2 Criar testes de integração para fluxos principais

    - Testar fluxo completo de cadastro
    - Testar fluxo completo de login
    - Testar fluxo de recuperação de senha
    - _Requisitos: 1.2, 2.6, 3.10_

  - [x] 12.3 Criar testes E2E com Playwright


    - Testar cadastro → login → dashboard
    - Testar recuperação de senha completa
    - Testar edição de perfil e empresa

    - _Requisitos: Todos os fluxos principais_

- [ ] 13. Documentação e finalização

  - Criar README.md específico para autenticação
  - Documentar fluxos OAuth (Google/Facebook)
  - Documentar estrutura de permissões (papéis)
  - Criar guia de troubleshooting
  - Atualizar documentação principal do projeto
  - _Requisitos: Documentação geral_

---

## Notas Importantes

- **Ordem de Execução**: As tarefas devem ser executadas na ordem apresentada, pois há dependências entre elas
- **Testes Obrigatórios**: Todos os testes (unitários, integração e E2E) são obrigatórios para garantir qualidade
- **Incremental**: Cada tarefa deve ser testada individualmente antes de prosseguir
- **Multi-tenant**: Sempre validar tenantId em operações de backend
- **Segurança**: Nunca armazenar tokens em localStorage; sempre usar cookies HttpOnly
- **Português**: Todas as mensagens de erro e UI devem estar em português brasileiro

## Dependências Externas

- amazon-cognito-identity-js (já instalado)
- @aws-sdk/client-s3 (para upload de logos)
- @aws-sdk/client-secrets-manager (para integrações)
- shadcn/ui components (já configurado)

## Estimativa de Tempo

- Tarefas 1-2: Infraestrutura e biblioteca cliente (4-6 horas)
- Tarefas 3-4: Banco de dados e backend (6-8 horas)
- Tarefas 5-7: Componentes e páginas frontend (8-10 horas)
- Tarefas 8-11: Segurança, rotas e validações (4-6 horas)
- Tarefas 12-13: Testes e documentação (6-8 horas)

**Total estimado**: 28-38 horas de desenvolvimento
