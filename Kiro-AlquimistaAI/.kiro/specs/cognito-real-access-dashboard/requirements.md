# Documento de Requisitos - Acesso Real ao Painel com Cognito

## Introdução

Este documento especifica os requisitos para implementar o fluxo completo de autenticação real com Amazon Cognito no Painel Operacional AlquimistaAI, permitindo que usuários façam login e sejam redirecionados automaticamente para o dashboard apropriado baseado em seus grupos Cognito.

## Glossário

- **Cognito User Pool**: Serviço AWS de gerenciamento de identidade e autenticação de usuários
- **Hosted UI**: Interface de login hospedada pelo Cognito para OAuth 2.0
- **ID Token**: Token JWT contendo claims de identidade do usuário
- **Access Token**: Token JWT para autorização de acesso a recursos
- **Refresh Token**: Token para renovação de sessão sem novo login
- **Claims**: Informações sobre o usuário contidas no token JWT
- **Grupos Cognito**: Categorias de usuários (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
- **Dashboard Interno**: Interface administrativa para equipe AlquimistaAI (/app/company)
- **Dashboard do Cliente**: Interface para clientes tenant (/app/dashboard)
- **Middleware**: Camada de proteção de rotas no Next.js

## Requisitos

### Requisito 1

**User Story:** Como desenvolvedor, quero integrar o Cognito Hosted UI ao frontend, para que usuários possam fazer login usando o fluxo OAuth 2.0 padrão.

#### Acceptance Criteria

1. WHEN o sistema inicia THEN o módulo de autenticação SHALL configurar o Cognito client com User Pool ID, Client ID e domínio do Hosted UI
2. WHEN um usuário não autenticado acessa uma rota protegida THEN o sistema SHALL redirecionar para a página de login
3. WHEN um usuário clica em "Entrar" THEN o sistema SHALL iniciar o fluxo OAuth redirecionando para o Cognito Hosted UI
4. WHEN o Cognito retorna o código de autorização THEN o sistema SHALL trocar o código por tokens (ID, Access, Refresh)
5. WHEN os tokens são obtidos THEN o sistema SHALL armazená-los de forma segura em cookies HTTP-only

### Requisito 2

**User Story:** Como desenvolvedor, quero extrair e mapear os grupos Cognito do token JWT, para que o sistema identifique corretamente o perfil do usuário.

#### Acceptance Criteria

1. WHEN o ID token é recebido THEN o sistema SHALL decodificar o payload JWT
2. WHEN o payload é decodificado THEN o sistema SHALL extrair o claim `cognito:groups` como array de strings
3. WHEN os grupos são extraídos THEN o sistema SHALL mapear para perfis internos (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
4. WHEN o usuário pertence a INTERNAL_ADMIN ou INTERNAL_SUPPORT THEN o sistema SHALL marcar como usuário interno
5. WHEN o usuário pertence a TENANT_ADMIN ou TENANT_USER THEN o sistema SHALL extrair o `custom:tenant_id` do token

### Requisito 3

**User Story:** Como usuário interno da AlquimistaAI, quero ser redirecionado automaticamente para o dashboard interno após login, para que eu acesse as funcionalidades administrativas.

#### Acceptance Criteria

1. WHEN um usuário com grupo INTERNAL_ADMIN faz login THEN o sistema SHALL redirecionar para /app/company
2. WHEN um usuário com grupo INTERNAL_SUPPORT faz login THEN o sistema SHALL redirecionar para /app/company
3. WHEN um usuário interno acessa /app/dashboard THEN o sistema SHALL redirecionar para /app/company
4. WHEN um usuário interno acessa /app THEN o sistema SHALL redirecionar para /app/company
5. WHEN um usuário interno navega no dashboard interno THEN o sistema SHALL permitir acesso a todas as rotas /app/company/*

### Requisito 4

**User Story:** Como cliente tenant, quero ser redirecionado automaticamente para o dashboard do cliente após login, para que eu acesse apenas as funcionalidades do meu tenant.

#### Acceptance Criteria

1. WHEN um usuário com grupo TENANT_ADMIN faz login THEN o sistema SHALL redirecionar para /app/dashboard
2. WHEN um usuário com grupo TENANT_USER faz login THEN o sistema SHALL redirecionar para /app/dashboard
3. WHEN um usuário tenant acessa /app/company THEN o sistema SHALL bloquear acesso e redirecionar para /app/dashboard
4. WHEN um usuário tenant acessa /app THEN o sistema SHALL redirecionar para /app/dashboard
5. WHEN um usuário tenant navega no dashboard THEN o sistema SHALL permitir acesso apenas a rotas /app/dashboard/*

### Requisito 5

**User Story:** Como desenvolvedor, quero implementar middleware de proteção de rotas, para que apenas usuários autenticados e autorizados acessem recursos protegidos.

#### Acceptance Criteria

1. WHEN uma requisição chega a uma rota protegida THEN o middleware SHALL verificar a presença de tokens nos cookies
2. WHEN os tokens não existem THEN o middleware SHALL redirecionar para /auth/login com parâmetro de redirect
3. WHEN os tokens existem THEN o middleware SHALL validar a expiração do ID token
4. WHEN o token está expirado THEN o middleware SHALL limpar cookies e redirecionar para login
5. WHEN o token é válido THEN o middleware SHALL extrair grupos e aplicar regras de autorização por rota

### Requisito 6

**User Story:** Como desenvolvedor, quero implementar a página de callback OAuth, para que o sistema processe o retorno do Cognito após autenticação.

#### Acceptance Criteria

1. WHEN o Cognito redireciona para /auth/callback THEN o sistema SHALL capturar o código de autorização da URL
2. WHEN o código é capturado THEN o sistema SHALL fazer requisição ao endpoint /oauth2/token do Cognito
3. WHEN os tokens são recebidos THEN o sistema SHALL armazená-los em cookies seguros (httpOnly, secure, sameSite)
4. WHEN os tokens são armazenados THEN o sistema SHALL extrair grupos do ID token
5. WHEN os grupos são extraídos THEN o sistema SHALL redirecionar para a rota apropriada baseada no perfil

### Requisito 7

**User Story:** Como desenvolvedor, quero implementar logout completo, para que usuários possam encerrar sessão de forma segura.

#### Acceptance Criteria

1. WHEN um usuário clica em "Sair" THEN o sistema SHALL limpar todos os cookies de autenticação
2. WHEN os cookies são limpos THEN o sistema SHALL redirecionar para o endpoint de logout do Cognito
3. WHEN o Cognito processa logout THEN o sistema SHALL redirecionar para /auth/login
4. WHEN o usuário tenta acessar rota protegida após logout THEN o sistema SHALL exigir novo login
5. WHEN o logout é concluído THEN o sistema SHALL limpar qualquer estado de autenticação no cliente

### Requisito 8

**User Story:** Como desenvolvedor, quero configurar variáveis de ambiente para Cognito, para que o sistema funcione em desenvolvimento e produção.

#### Acceptance Criteria

1. WHEN o sistema inicia THEN o sistema SHALL carregar variáveis de ambiente do Cognito
2. WHEN as variáveis são carregadas THEN o sistema SHALL validar presença de COGNITO_USER_POOL_ID
3. WHEN as variáveis são carregadas THEN o sistema SHALL validar presença de COGNITO_CLIENT_ID
4. WHEN as variáveis são carregadas THEN o sistema SHALL validar presença de COGNITO_DOMAIN_HOST
5. WHEN as variáveis estão ausentes THEN o sistema SHALL exibir erro claro no console

### Requisito 9

**User Story:** Como desenvolvedor, quero testar o fluxo de login com os 4 usuários DEV existentes, para que eu valide o redirecionamento correto por grupo.

#### Acceptance Criteria

1. WHEN jmrhollanda@gmail.com (INTERNAL_ADMIN) faz login THEN o sistema SHALL redirecionar para /app/company
2. WHEN alquimistafibonacci@gmail.com (INTERNAL_SUPPORT) faz login THEN o sistema SHALL redirecionar para /app/company
3. WHEN marcello@c3comercial.com.br (TENANT_ADMIN) faz login THEN o sistema SHALL redirecionar para /app/dashboard
4. WHEN leylany@c3comercial.com.br (TENANT_USER) faz login THEN o sistema SHALL redirecionar para /app/dashboard
5. WHEN qualquer usuário tenta acessar dashboard não autorizado THEN o sistema SHALL bloquear e redirecionar

### Requisito 10

**User Story:** Como desenvolvedor, quero documentar o processo de configuração e teste, para que outros desenvolvedores possam replicar o ambiente.

#### Acceptance Criteria

1. WHEN a implementação é concluída THEN o sistema SHALL incluir documentação de variáveis de ambiente
2. WHEN a documentação é criada THEN o sistema SHALL incluir instruções de teste para cada usuário
3. WHEN a documentação é criada THEN o sistema SHALL incluir troubleshooting de erros comuns
4. WHEN a documentação é criada THEN o sistema SHALL incluir diagrama de fluxo de autenticação
5. WHEN a documentação é criada THEN o sistema SHALL incluir lista de arquivos criados/modificados
