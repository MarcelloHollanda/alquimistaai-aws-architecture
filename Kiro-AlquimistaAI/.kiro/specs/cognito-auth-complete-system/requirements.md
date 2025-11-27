# Documento de Requisitos - Sistema de Autenticação Cognito Completo

## Introdução

Este documento especifica os requisitos para um sistema completo de autenticação utilizando Amazon Cognito User Pools, incluindo login tradicional (e-mail/senha), login social (Google e Facebook), recuperação de senha, cadastro de novos usuários com criação de empresa (multi-tenant), e gerenciamento de perfil e configurações.

O sistema será implementado em Next.js 14 (App Router) com TypeScript, Tailwind CSS e shadcn/ui no frontend, integrado com backend serverless (API Gateway + Lambda) na AWS.

## Glossário

- **Sistema de Autenticação**: O conjunto de componentes frontend e backend responsável por autenticar e autorizar usuários
- **Cognito User Pool**: Serviço AWS que gerencia identidades de usuários e autenticação
- **Hosted UI**: Interface de autenticação hospedada pelo Cognito para login social OAuth
- **Tenant**: Empresa/organização no sistema multi-tenant; cada empresa é isolada logicamente
- **Master**: Papel de usuário com permissões totais; o primeiro usuário de um tenant
- **Frontend**: Aplicação Next.js 14 que roda no navegador do usuário
- **Backend**: Funções Lambda expostas via API Gateway
- **Secrets Manager**: Serviço AWS para armazenamento seguro de credenciais e tokens de integração

## Requisitos

### Requisito 1: Tela de Login Completa

**User Story:** Como um usuário existente, quero fazer login no sistema usando e-mail/senha ou contas sociais (Google/Facebook), para acessar a plataforma AlquimistaAI.

#### Acceptance Criteria

1. WHEN o usuário acessa a rota `/auth/login`, THE Sistema de Autenticação SHALL exibir um formulário com campos de e-mail e senha
2. WHEN o usuário preenche credenciais válidas e clica em "Entrar", THE Sistema de Autenticação SHALL autenticar via Cognito User Pool e redirecionar para `/app/dashboard`
3. WHEN o usuário clica em "Continuar com Google", THE Sistema de Autenticação SHALL redirecionar para Cognito Hosted UI com provedor Google OAuth
4. WHEN o usuário clica em "Continuar com Facebook", THE Sistema de Autenticação SHALL redirecionar para Cognito Hosted UI com provedor Facebook OAuth
5. WHEN o usuário fornece credenciais inválidas, THE Sistema de Autenticação SHALL exibir mensagem de erro amigável em português brasileiro
6. WHEN o usuário clica em "Esqueci minha senha", THE Sistema de Autenticação SHALL redirecionar para `/auth/forgot-password`
7. WHEN o usuário clica em "Criar nova conta", THE Sistema de Autenticação SHALL redirecionar para `/auth/register`
8. WHEN a autenticação é bem-sucedida, THE Sistema de Autenticação SHALL armazenar tokens em cookies HttpOnly via backend

### Requisito 2: Fluxo de Recuperação de Senha

**User Story:** Como um usuário que esqueceu sua senha, quero recuperar o acesso à minha conta através do meu e-mail, para poder fazer login novamente.

#### Acceptance Criteria

1. WHEN o usuário acessa `/auth/forgot-password`, THE Sistema de Autenticação SHALL exibir um formulário solicitando o e-mail
2. WHEN o usuário submete um e-mail válido, THE Sistema de Autenticação SHALL invocar `forgotPassword` no Cognito User Pool
3. WHEN o Cognito envia o código de verificação, THE Sistema de Autenticação SHALL redirecionar para `/auth/reset-password`
4. WHEN o usuário acessa `/auth/reset-password`, THE Sistema de Autenticação SHALL exibir formulário com campos para código de verificação, nova senha e confirmação de senha
5. WHEN o usuário submete código válido e nova senha, THE Sistema de Autenticação SHALL invocar `confirmForgotPassword` no Cognito User Pool
6. WHEN a redefinição é bem-sucedida, THE Sistema de Autenticação SHALL redirecionar para `/auth/login` com mensagem de sucesso
7. WHEN o código de verificação é inválido ou expirado, THE Sistema de Autenticação SHALL exibir mensagem de erro apropriada

### Requisito 3: Cadastro de Novo Usuário e Empresa

**User Story:** Como um novo usuário, quero me cadastrar no sistema fornecendo meus dados pessoais e da minha empresa, para começar a usar a plataforma AlquimistaAI.

#### Acceptance Criteria

1. WHEN o usuário acessa `/auth/register`, THE Sistema de Autenticação SHALL exibir um wizard de cadastro em múltiplos passos
2. WHEN o usuário está no Passo 1, THE Sistema de Autenticação SHALL solicitar nome completo, e-mail, senha, confirmação de senha e telefone/WhatsApp
3. WHEN o usuário completa o Passo 1 e avança, THE Sistema de Autenticação SHALL validar formato de e-mail e força da senha
4. WHEN o usuário está no Passo 2, THE Sistema de Autenticação SHALL solicitar nome fantasia, razão social, CNPJ, segmento de atuação e upload de logomarca
5. WHEN o usuário faz upload de logomarca, THE Sistema de Autenticação SHALL enviar a imagem para bucket S3 no path `alquimistaai-logos/{tenantId}/logo.png`
6. WHEN o usuário está no Passo 3 e é o primeiro usuário da empresa, THE Sistema de Autenticação SHALL atribuir automaticamente o papel MASTER
7. WHEN o usuário está no Passo 3 e a empresa já existe, THE Sistema de Autenticação SHALL permitir seleção entre papéis Master, Administrador, Operacional ou Somente Leitura
8. WHEN o usuário completa todos os passos, THE Sistema de Autenticação SHALL criar usuário no Cognito User Pool
9. WHEN o usuário é criado no Cognito, THE Backend SHALL criar registros nas tabelas `companies`, `users` e `user_roles`
10. WHEN o cadastro é concluído com sucesso, THE Sistema de Autenticação SHALL redirecionar para `/auth/login` com mensagem de sucesso

### Requisito 4: Tela de Configurações - Perfil do Usuário

**User Story:** Como um usuário autenticado, quero visualizar e editar meu perfil pessoal, para manter minhas informações atualizadas.

#### Acceptance Criteria

1. WHEN o usuário acessa `/app/settings` com aba "Perfil" selecionada, THE Sistema de Autenticação SHALL exibir dados atuais do usuário (nome, telefone, idioma, fuso horário)
2. WHEN o usuário edita campos do perfil, THE Sistema de Autenticação SHALL permitir alteração de nome, telefone, idioma e fuso horário
3. WHEN o usuário visualiza seu papel, THE Sistema de Autenticação SHALL exibir papel atual (Master/Admin/Operacional/Leitura) em modo somente leitura
4. WHEN o usuário clica em "Alterar senha", THE Sistema de Autenticação SHALL invocar `changePassword` no Cognito User Pool
5. WHEN a alteração de senha é bem-sucedida, THE Sistema de Autenticação SHALL exibir mensagem de confirmação
6. WHEN o usuário salva alterações no perfil, THE Backend SHALL atualizar registro na tabela `users`

### Requisito 5: Tela de Configurações - Dados da Empresa

**User Story:** Como um usuário com papel Master ou Administrador, quero visualizar e editar os dados da minha empresa, para manter as informações corporativas atualizadas.

#### Acceptance Criteria

1. WHEN o usuário acessa `/app/settings` com aba "Empresa" selecionada, THE Sistema de Autenticação SHALL exibir dados atuais da empresa
2. WHEN o usuário tem papel Master ou Admin, THE Sistema de Autenticação SHALL permitir edição de nome fantasia, razão social, CNPJ e segmento
3. WHEN o usuário tem papel Operacional ou Leitura, THE Sistema de Autenticação SHALL exibir dados da empresa em modo somente leitura
4. WHEN o usuário faz upload de nova logomarca, THE Sistema de Autenticação SHALL enviar para S3 e atualizar URL no backend
5. WHEN o usuário visualiza tenantId e data de criação, THE Sistema de Autenticação SHALL exibir esses campos em modo somente leitura
6. WHEN o usuário salva alterações, THE Backend SHALL atualizar registro na tabela `companies`

### Requisito 6: Tela de Configurações - Integrações

**User Story:** Como um usuário Master ou Administrador, quero configurar integrações com serviços externos (Google, Meta, Telefonia), para habilitar funcionalidades dos agentes AlquimistaAI.

#### Acceptance Criteria

1. WHEN o usuário acessa `/app/settings` com aba "Integrações" selecionada, THE Sistema de Autenticação SHALL verificar se usuário tem papel Master ou Admin
2. WHEN o usuário não tem papel Master ou Admin, THE Sistema de Autenticação SHALL exibir mensagem informando que apenas Master/Admin podem acessar integrações
3. WHEN o usuário tem papel adequado, THE Sistema de Autenticação SHALL exibir seções para Google, Meta/WhatsApp, Telefonia e outras integrações
4. WHEN o usuário visualiza uma integração, THE Sistema de Autenticação SHALL exibir status (Conectado/Não conectado)
5. WHEN o usuário clica em "Conectar" para uma integração OAuth, THE Sistema de Autenticação SHALL iniciar fluxo OAuth apropriado
6. WHEN uma integração é conectada com sucesso, THE Backend SHALL armazenar credenciais no AWS Secrets Manager no path `/alquimista/{env}/{tenantId}/{nome_integracao}`
7. WHEN o usuário desconecta uma integração, THE Backend SHALL remover credenciais do Secrets Manager

### Requisito 7: Segurança e Armazenamento de Tokens

**User Story:** Como administrador do sistema, quero garantir que tokens de autenticação sejam armazenados de forma segura, para proteger as contas dos usuários.

#### Acceptance Criteria

1. WHEN o usuário faz login com sucesso, THE Backend SHALL armazenar tokens do Cognito em cookies HttpOnly
2. WHEN o Frontend precisa fazer requisições autenticadas, THE Sistema de Autenticação SHALL incluir cookies HttpOnly automaticamente
3. WHEN tokens expiram, THE Sistema de Autenticação SHALL tentar renovar usando refresh token
4. WHEN renovação falha, THE Sistema de Autenticação SHALL redirecionar usuário para `/auth/login`
5. WHEN credenciais de integrações são armazenadas, THE Backend SHALL utilizar exclusivamente AWS Secrets Manager

### Requisito 8: Experiência do Usuário e Internacionalização

**User Story:** Como usuário brasileiro, quero que todas as mensagens, erros e interfaces estejam em português do Brasil, para facilitar minha compreensão e uso do sistema.

#### Acceptance Criteria

1. WHEN o sistema exibe qualquer mensagem ao usuário, THE Sistema de Autenticação SHALL apresentar texto em português brasileiro
2. WHEN ocorre um erro de autenticação, THE Sistema de Autenticação SHALL exibir mensagem de erro amigável e clara em português
3. WHEN o usuário navega entre telas, THE Sistema de Autenticação SHALL manter consistência visual usando shadcn/ui e Tailwind
4. WHEN o usuário acessa o sistema em dispositivo móvel, THE Frontend SHALL exibir interface responsiva (mobile-first)
5. WHEN o usuário interage com formulários, THE Sistema de Autenticação SHALL minimizar número de cliques necessários

### Requisito 9: Multi-tenancy e Isolamento de Dados

**User Story:** Como administrador do sistema, quero garantir que cada empresa (tenant) tenha seus dados isolados, para manter segurança e privacidade.

#### Acceptance Criteria

1. WHEN um usuário é criado, THE Backend SHALL associar usuário a um tenantId único
2. WHEN o primeiro usuário de uma empresa se cadastra, THE Backend SHALL criar novo registro na tabela `companies` com tenantId único
3. WHEN usuários subsequentes se cadastram para empresa existente, THE Backend SHALL associá-los ao tenantId existente
4. WHEN qualquer operação de dados é realizada, THE Backend SHALL filtrar resultados pelo tenantId do usuário autenticado
5. WHEN integrações são configuradas, THE Backend SHALL armazenar credenciais com path incluindo tenantId

### Requisito 10: Validação e Tratamento de Erros

**User Story:** Como usuário, quero receber feedback claro quando cometo erros no preenchimento de formulários, para corrigir rapidamente e prosseguir.

#### Acceptance Criteria

1. WHEN o usuário submete formulário com campos obrigatórios vazios, THE Sistema de Autenticação SHALL exibir mensagens de validação específicas para cada campo
2. WHEN o usuário fornece e-mail em formato inválido, THE Sistema de Autenticação SHALL exibir mensagem "E-mail inválido"
3. WHEN o usuário fornece senha fraca, THE Sistema de Autenticação SHALL exibir requisitos de senha (mínimo 8 caracteres, maiúsculas, números, caracteres especiais)
4. WHEN o usuário fornece CNPJ inválido, THE Sistema de Autenticação SHALL validar formato e exibir erro se inválido
5. WHEN ocorre erro de rede ou timeout, THE Sistema de Autenticação SHALL exibir mensagem "Erro de conexão. Tente novamente."
6. WHEN o Cognito retorna erro específico, THE Sistema de Autenticação SHALL traduzir erro para português e exibir mensagem apropriada
