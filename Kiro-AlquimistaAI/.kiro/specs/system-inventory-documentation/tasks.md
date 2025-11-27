# Implementation Plan - Inventário e Documentação do Sistema

- [x] 1. Configurar estrutura base do projeto


  - Criar diretório `scripts/inventory/` com subdiretórios
  - Configurar TypeScript para scripts
  - Instalar dependências necessárias (fast-check, gray-matter, glob, fs-extra)
  - _Requirements: Todos_






- [x] 2. Implementar tipos e interfaces base




  - Criar `scripts/inventory/types.ts` com todas as interfaces do design
  - Definir tipos para SystemInventory, StackInfo, DatabaseInfo, etc.

  - Exportar tipos para uso nos analisadores
  - _Requirements: Todos_

- [x] 3. Implementar Sanitizador de Segredos





  - Criar `scripts/inventory/sanitizer.ts`


  - Implementar detecção de padrões sensíveis (AWS keys, Stripe keys, tokens)


  - Implementar função de mascaramento
  - _Requirements: 5.3, 8.2_
-

- [x] 3.1 Escrever testes de propriedade para sanitizador






  - **Property 2: Sanitização de Segredos**
  - **Valida: Requirements 5.3, 8.2**
  - Testar que nenhum padrão sensível passa sem mascaramento
  - Configurar 100+ iterações

-

- [x] 4. Implementar Analisador de Infraestrutura CDK



  - Criar `scripts/inventory/analyzers/cdk-analyzer.ts`
  - Ler e parsear arquivos em `bin/app.ts` e `lib/*.ts`
  - Extrair informações de stacks, recursos, outputs
  - Mapear APIs, Lambdas, bancos, storage, segurança
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

-

- [x] 4.1 Escrever testes unitários para analisador CDK





  - Testar parsing de stacks
  - Testar extração de recursos
  - Testar mapeamento de relações
-

- [x] 5. Implementar Analisador de Banco de Dados




  - Criar `scripts/inventory/analyzers/database-analyzer.ts`
  - Ler migrations em `database/migrations/*.sql`
  - Ler READMEs de migrations
  - Extrair informações de schemas e decisões
  - Identificar migration 009 como duplicada
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.1 Escrever testes de propriedade para analisador de banco

  - **Property 5: Completude de Migrations**
  - **Valida: Requirements 2.3**
  - Testar correspondência entre arquivos SQL e documentação

- [x] 6. Implementar Analisador de APIs Backend





  - Criar `scripts/inventory/analyzers/api-analyzer.ts`
  - Analisar handlers em `lambda/fibonacci/`, `lambda/nigredo/`, `lambda/platform/`, `lambda/internal/`
  - Extrair rotas de API Gateway dos stacks
  - Diferenciar claramente API Fibonacci vs API Painel
  - Mapear integrações entre serviços
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.1 Escrever testes unitários para analisador de APIs


  - Testar identificação de handlers
  - Testar extração de rotas
  - Testar diferenciação de APIs
-

- [x] 7. Implementar Analisador de Frontend









  - Criar `scripts/inventory/analyzers/frontend-analyzer.ts`
  - Analisar estrutura em `frontend/src/app/`
  - Identificar rotas Next.js (auth, dashboard, company)
  - Listar API clients em `frontend/src/lib/`
  - Documentar integração Cognito
  - Extrair status de testes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.1 Escrever testes unitários para analisador de frontend


  - Testar identificação de rotas
  - Testar listagem de clients
  - Testar extração de configuração Cognito
-


- [x] 8. Implementar Analisador de Autenticação












  - Criar `scripts/inventory/analyzers/auth-analyzer.ts`
  - Extrair configuração Cognito de documentos e código
  - Listar grupos (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
  - Listar usuários DEV (apenas email + grupo, SEM senhas)
  - Documentar Hosted UI
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.1 Escrever testes de propriedade para analisador de auth































  - **Property 10: Ausência de Valores Sensíveis**
  - **Valida: Requirements 5.4**
  - Testar que nenhuma senha é incluída

-
-

- [x] 9. Implementar Analisador de CI/CD






  - Criar `scripts/inventory/analyzers/cicd-analyzer.ts`
  - Analisar `.github/workflows/ci-cd-alquimistaai.yml`
  - Extrair triggers, jobs, integração OIDC
  - Listar scripts de validação em `scripts/`
  - Referenciar documentos de teste
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Escrever testes unitários para analisador de CI/CD


  - Testar parsing de workflow
  - Testar extração de jobs
  - Testar listagem de scripts
-
-

- [x] 10. Implementar Analisador de Guardrails






  - Criar `scripts/inventory/analyzers/guardrails-analyzer.ts`
  - Analisar `lib/security-stack.ts`, `lib/waf-stack.ts`
  - Extrair configuração de CloudTrail, GuardDuty, WAF, SNS
  - Documentar AWS Budgets e Cost Anomaly Detection
  - Listar dashboards CloudWatch
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10.1 Escrever testes unitários para analisador de guardrails


  - Testar extração de configuração de segurança
  - Testar listagem de budgets
  - Testar identificação de dashboards
-

- [x] 11. Implementar Validador de Consistência







  - Criar `scripts/inventory/validator.ts`
  - Implementar validação de completude de stacks
  - Implementar validação de unicidade de identificadores
  - Implementar validação de referências cruzadas
  - Implementar validação de diferenciação de ambientes
  - _Requirements: 9.1, 9.2_

- [x] 11.1 Escrever testes de propriedade para validador


  - **Property 1: Completude de Stacks**
  - **Property 3: Consistência de Referências**
  - **Property 4: Unicidade de Identificadores**
  - **Property 6: Diferenciação de Ambientes**
  - **Valida: Requirements 1.1, 1.2, 1.5, 3.1, 9.1**
-

- [x] 12. Implementar Gerador de Documento Principal







  - Criar `scripts/inventory/generator.ts`
  - Implementar função `generateMainDocument()`
  - Gerar cabeçalho com metadata
  - Gerar resumo executivo
  - Gerar seções 1-9 conforme design
  - Aplicar sanitização em todo conteúdo
  - Formatar em markdown
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9_

- [x] 12.1 Escrever testes de integração para gerador principal


  - Testar geração completa do documento
  - Testar presença de todas as seções
  - Testar ausência de segredos
-

- [x] 13. Implementar Gerador de Índice Compacto







  - Adicionar função `generateShortIndex()` em `generator.ts`
  - Gerar bloco de identificadores-chave
  - Gerar seções resumidas (Backends, Frontends, CI/CD, Segurança)
  - Listar variáveis-chave sem valores
  - Otimizar para parsing por IA
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13.1 Escrever testes de propriedade para índice compacto


  - **Property 9: Índice Compacto Sincronizado**
  - **Valida: Requirements 10.2, 10.3**
  - Testar correspondência com documento principal
-

- [x] 14. Implementar Script Principal de Execução




  - Criar `scripts/generate-system-inventory.ts`
  - Orquestrar chamada de todos os analisadores
  - Consolidar dados coletados
  - Executar validações
  - Gerar ambos os documentos
  - Salvar em `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md` e `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md`
  - _Requirements: Todos_

- [x] 14.1 Escrever testes de integração end-to-end


  - Testar fluxo completo de geração
  - Testar criação de ambos os arquivos
  - Testar validações pré-geração




- [ ] 15. Adicionar Scripts NPM





  - Adicionar `generate:inventory` em `package.json`
  - Adicionar `generate:inventory:main` para documento principal apenas


  - Adicionar `generate:inventory:index` para índice compacto apenas
  - Adicionar `validate:inventory` para validação sem geração
  - _Requirements: Todos_

- [x] 16. Criar Documentação de Uso


  - Criar `scripts/inventory/README.md`
  - Documentar como executar os scripts
  - Documentar estrutura de dados
  - Documentar como adicionar novos analisadores
  - Incluir exemplos de uso
  - _Requirements: Todos_



- [ ] 17. Checkpoint - Executar e Validar








  - Executar `npm run generate:inventory`
  - Revisar documentos gerados
  - Verificar ausência de segredos
  - Validar completude das informações
  - Corrigir gaps identificados
  - Ensure all tests pass, ask the user if questions arise.
