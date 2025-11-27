# Plano de Implementação - Acesso Real ao Painel com Cognito

- [x] 1. Configurar variáveis de ambiente e validação


  - Criar arquivo `.env.local.example` com todas as variáveis necessárias
  - Implementar função de validação de configuração no `cognito-client.ts`
  - Adicionar logs claros para variáveis ausentes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 2. Implementar funções OAuth no Cognito Client





  - Criar função `initOAuthFlow()` que redireciona para Hosted UI
  - Criar função `exchangeCodeForTokens(code)` que troca código por tokens
  - Criar função `storeTokensInCookies(tokens)` com flags de segurança
  - Criar função `getTokensFromCookies()` para recuperar tokens
  - Criar função `clearTokensFromCookies()` para logout

  - _Requirements: 1.1, 1.3, 1.4, 1.5, 6.2, 6.3_

- [x] 3. Atualizar Auth Store com mapeamento de grupos

  - Adicionar função `extractClaimsFromToken(idToken)` que decodifica JWT
  - Adicionar função `mapGroupsToRole(groups)` que mapeia grupos para perfis
  - Adicionar função `determineInitialRoute(groups)` que retorna rota baseada em grupos
  - Atualizar estado para incluir `groups`, `role`, `isInternal`, `tenantId`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implementar página de callback OAuth


  - Criar componente `CallbackPage` em `/auth/callback/page.tsx`
  - Implementar captura do código de autorização da URL
  - Implementar troca de código por tokens
  - Implementar armazenamento de tokens em cookies
  - Implementar extração de grupos e redirecionamento
  - Adicionar tratamento de erros (código inválido, falha na troca)
  - Adicionar loading state durante processamento
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Atualizar página de login



  - Modificar botão "Entrar" para chamar `initOAuthFlow()`
  - Adicionar mensagem explicativa sobre login único
  - Remover formulário de email/senha (usar apenas OAuth)
  - Adicionar tratamento de parâmetros de erro na URL
  - _Requirements: 1.2, 1.3_

- [x] 6. Implementar middleware de proteção de rotas





  - Atualizar `middleware.ts` para validar tokens em cookies
  - Implementar validação de expiração de tokens
  - Implementar extração de grupos do token
  - Implementar regras de redirecionamento por grupo
  - Implementar bloqueio de acesso cross-dashboard
  - Adicionar redirecionamento para login com parâmetro de redirect
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 3.3, 4.3_

- [x] 7. Implementar lógica de redirecionamento pós-login





  - Adicionar lógica em callback para redirecionar INTERNAL_* para /app/company
  - Adicionar lógica em callback para redirecionar TENANT_* para /app/dashboard
  - Adicionar lógica em middleware para redirecionar /app para rota apropriada
  - Adicionar lógica em middleware para bloquear tenant de acessar /app/company
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.4, 4.5_
-

- [x] 8. Implementar logout completo




  - Criar página `/auth/logout/page.tsx`
  - Implementar limpeza de cookies
  - Implementar redirecionamento para endpoint de logout do Cognito
  - Criar página `/auth/logout-callback/page.tsx` para retorno do Cognito
  - Adicionar botão de logout nos dashboards
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Testar fluxo com usuários DEV





  - Testar login com jmrhollanda@gmail.com (INTERNAL_ADMIN)
  - Verificar redirecionamento para /app/company
  - Verificar acesso a rotas internas
  - Testar login com alquimistafibonacci@gmail.com (INTERNAL_SUPPORT)
  - Verificar redirecionamento para /app/company
  - Testar login com marcello@c3comercial.com.br (TENANT_ADMIN)
  - Verificar redirecionamento para /app/dashboard
  - Verificar bloqueio de /app/company
  - Testar login com leylany@c3comercial.com.br (TENANT_USER)
  - Verificar redirecionamento para /app/dashboard
  - Verificar bloqueio de /app/company
  - Testar logout para cada usuário
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Criar documentação




  - Criar `docs/operational-dashboard/ACCESS-QUICK-REFERENCE.md`
  - Documentar variáveis de ambiente necessárias
  - Documentar processo de configuração do Cognito
  - Documentar fluxo de autenticação com diagrama
  - Documentar como testar cada usuário DEV
  - Documentar troubleshooting de erros comuns
  - Criar lista de arquivos criados/modificados
  - Adicionar exemplos de uso
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
x

- [x] 11. Checkpoint - Validar implementação completa










  - Executar testes de segurança existentes
  - Verificar que 38/38 testes passam
  - Validar que todos os 4 usuários DEV conseguem fazer login
  - Validar redirecionamento correto por grupo
  - Validar bloqueio de acesso cross-dashboard
  - Validar logout completo
  - Revisar documentação
