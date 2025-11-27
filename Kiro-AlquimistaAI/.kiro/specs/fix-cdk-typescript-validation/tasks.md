# Implementation Plan - Correção de Validação CDK e TypeScript

## Visão Geral

Este plano implementa as correções necessárias para resolver avisos de validação CDK e erros de compilação TypeScript, sem alterar migrations ou fluxo Aurora.

---

## Tarefas

- [x] 1. Analisar exports reais dos módulos compartilhados



  - Verificar exports de `lambda/shared/database.ts`
  - Verificar exports de `lambda/shared/error-handler.ts`
  - Verificar exports de `lambda/shared/logger.ts`
  - Documentar funções disponíveis para correção de imports





  - _Requirements: 2.2_

- [x] 2. Corrigir imports incorretos nos handlers Lambda
  - [x] 2.1 Corrigir `lambda/platform/commercial-contact.ts`
    - Ajustar import de database
    - Ajustar import de error-handler
    - Corrigir sintaxe do logger (linha 89)
    - _Requirements: 2.2, 2.4_

  - [x] 2.2 Corrigir `lambda/platform/get-agents.ts`
    - Ajustar import de database
    - Ajustar import de error-handler
    - Corrigir sintaxe do logger (linha 55)
    - _Requirements: 2.2, 2.4_

  - [x] 2.3 Corrigir `lambda/platform/trial-invoke.ts`
    - Ajustar import de database
    - Ajustar import de error-handler
    - Corrigir sintaxe do logger (linha 142)
    - _Requirements: 2.2, 2.4_

  - [x] 2.4 Corrigir `lambda/platform/trial-start.ts`
    - Ajustar import de database
    - Ajustar import de error-handler
    - Corrigir sintaxe do logger (linha 147)
    - _Requirements: 2.2, 2.4_

  - [x] 2.5 Corrigir `lambda/platform/get-tenant-subscription.ts`
    - Ajustar sintaxe do logger (linha 110)
    - _Requirements: 2.4_

  - [x] 2.6 Corrigir `lambda/platform/list-plans.ts`
    - Ajustar sintaxe do logger (linha 51)
    - _Requirements: 2.4_

  - [x] 2.7 Corrigir `lambda/platform/update-tenant-subscription.ts`
    - Ajustar sintaxe do logger (linha 203)
    - _Requirements: 2.4_

- [x] 3. Corrigir erros relacionados ao Stripe (4 erros restantes)
  - [x] 3.1 Identificar precisamente os 4 erros Stripe
    - Executar `npm run build` e filtrar erros de Stripe
    - Documentar cada erro com arquivo, linha e causa
    - Criar arquivo TASK-3-STRIPE-DIAGNOSTICS.md
    - _Requirements: 2.3_

  - [x] 3.2 Padronizar import e tipagem do Stripe
    - Instalar `stripe` no package.json dependencies (v14.21.0)
    - Remover `@types/stripe` (deprecated - Stripe fornece tipos próprios)
    - Executar `npm install`
    - Verificar se existe módulo compartilhado de Stripe (não existe)
    - Padronizar import: `import Stripe from 'stripe';`
    - Definir apiVersion consistente: `'2023-10-16'`
    - _Requirements: 2.3_

  - [x] 3.3 Ajustar uso do Stripe nos handlers de billing/planos
    - Corrigir `lambda/platform/create-checkout-session.ts`:
      - Uso correto de `stripe.checkout.sessions.create()` já estava OK
      - Tipagem explícita já estava adequada
      - Parâmetros da sessão já estavam corretos
    - Corrigir `lambda/platform/webhook-payment.ts`:
      - Uso correto de `stripe.webhooks.constructEvent()` já estava OK
      - Adicionar tipagem no reduce (linha 198) ✅
      - Tipar `sum: number` e `item: Stripe.SubscriptionItem` ✅
    - _Requirements: 2.3, 2.5_

  - [x] 3.4 Variáveis de ambiente e tipagem
    - Verificar `STRIPE_SECRET_KEY` em uso ✅
    - Verificar `STRIPE_WEBHOOK_SECRET` em uso ✅
    - Adicionar validação de env vars com checagem ✅
    - Garantir tipagem como string ✅
    - _Requirements: 2.3_

  - [x] 3.5 Validação final (Build + Registro na Spec)
    - Executar `npm run build` ✅
    - Verificar 0 erros de Stripe ✅
    - Atualizar TASK-3-STRIPE-DIAGNOSTICS.md com status RESOLVIDO ✅
    - Atualizar INDEX.md com progresso ✅
    - Documentar correções aplicadas ✅
    - _Requirements: 2.1, 2.3_

- [ ] 4. Corrigir sintaxe do logger em handlers restantes
  - [ ] 4.1 Corrigir `lambda/platform/get-tenant-subscription.ts`
    - Ajustar sintaxe do logger (linha 110)
    - Usar formato correto para requestId
    - _Requirements: 2.4_

  - [ ] 4.2 Corrigir `lambda/platform/list-plans.ts`
    - Ajustar sintaxe do logger (linha 51)
    - Usar formato correto para requestId
    - _Requirements: 2.4_

  - [ ] 4.3 Corrigir `lambda/platform/update-tenant-subscription.ts`
    - Ajustar sintaxe do logger (linha 203)
    - Usar formato correto para requestId
    - _Requirements: 2.4_

- [ ] 5. Validar compilação TypeScript
  - Executar `npm run build`
  - Verificar que não há erros de compilação
  - Documentar resultado no log de implementação
  - Se houver erros, voltar para correções específicas
  - _Requirements: 2.1_

- [ ] 6. Atualizar script de validação CDK
  - [ ] 6.1 Modificar lista de stacks esperadas
    - Remover `lib/cognito-stack.ts` da lista obrigatória
    - Manter apenas 3 stacks: alquimista, fibonacci, nigredo
    - _Requirements: 1.2, 1.3_

  - [ ] 6.2 Adicionar verificação específica do Cognito
    - Criar seção "7.1. Verificando Cognito User Pool"
    - Usar Select-String para verificar "new cognito.UserPool" em fibonacci-stack.ts
    - Reportar como "✅ Cognito User Pool (integrado ao FibonacciStack)"
    - _Requirements: 1.1, 1.4_

  - [ ] 6.3 Ajustar mensagens de resumo
    - Atualizar contagem de stacks para "3/3"
    - Adicionar nota sobre Cognito integrado
    - _Requirements: 1.3_

- [ ] 7. Criar documentação de status do sistema
  - [ ] 7.1 Criar arquivo `STATUS-SISTEMA-ALQUIMISTA-AI.md`
    - Seção: Banco de Dados (Aurora PostgreSQL)
    - Seção: Infraestrutura (CDK)
    - Seção: Código (TypeScript)
    - Seção: Decisões Arquiteturais
    - _Requirements: 3.1, 3.2_

  - [ ] 7.2 Documentar decisão arquitetural do Cognito
    - Explicar por que Cognito está no FibonacciStack
    - Listar benefícios desta abordagem
    - _Requirements: 1.4, 3.2_

  - [ ] 7.3 Criar log de implementação
    - Arquivo `.kiro/specs/fix-cdk-typescript-validation/IMPLEMENTATION-LOG.md`
    - Listar todos os arquivos modificados
    - Documentar cada correção aplicada
    - _Requirements: 3.4_

- [ ] 8. Validação final completa
  - [ ] 8.1 Executar validador atualizado
    - Rodar `.\scripts\validate-system-complete.ps1`
    - Verificar que reporta 0 erros
    - Verificar que CDK Stacks mostra "3/3 OK"
    - Verificar que Cognito é reconhecido
    - _Requirements: 1.3, 2.1_

  - [ ] 8.2 Testar síntese CDK
    - Executar `npx cdk synth --context env=dev`
    - Verificar que templates são gerados sem erros
    - _Requirements: 1.1_

  - [ ] 8.3 Verificar integridade do banco
    - Confirmar que nenhuma migration foi alterada
    - Confirmar que scripts Aurora não foram modificados
    - Confirmar que documentação Aurora está intacta
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 8.4 Atualizar documento de status com resultados
    - Adicionar resultado do validador
    - Adicionar resultado da compilação
    - Marcar todas as tarefas como concluídas
    - _Requirements: 3.5_

---

## Notas de Implementação

### Ordem de Execução Recomendada

1. **Análise primeiro**: Tarefa 1 deve ser completada antes de qualquer correção
2. **Correções por categoria**: Completar tarefas 2, 3 e 4 em sequência
3. **Validação intermediária**: Executar tarefa 5 após cada categoria de correção
4. **Infraestrutura**: Tarefas 6 e 7 podem ser feitas em paralelo
5. **Validação final**: Tarefa 8 só após todas as anteriores

### Arquivos Protegidos (NÃO MODIFICAR)

- `database/migrations/*.sql`
- `scripts/apply-migrations-aurora-dev.ps1`
- `database/RESUMO-AURORA-OFICIAL.md`
- `database/COMANDOS-RAPIDOS-AURORA.md`
- `database/AURORA-MIGRATIONS-AUDIT.md`
- `database/CONSOLIDACAO-AURORA-COMPLETA.md`

### Comandos de Validação

```powershell
# Compilação TypeScript
npm run build

# Validação completa
.\scripts\validate-system-complete.ps1

# Síntese CDK
npx cdk synth --context env=dev

# Verificar exports de módulos
Get-Content lambda/shared/database.ts | Select-String "export"
Get-Content lambda/shared/error-handler.ts | Select-String "export"
```

### Critérios de Sucesso

- ✅ `npm run build` executa sem erros (exit code 0)
- ✅ Validador reporta "CDK Stacks: 3/3 OK"
- ✅ Validador reconhece Cognito no FibonacciStack
- ✅ Validador reporta "Compilação TypeScript: ✅"
- ✅ Nenhuma migration foi alterada
- ✅ Documentação de status criada e atualizada

### Rollback

Se algo der errado:
1. Reverter alterações em handlers Lambda
2. Reverter package.json (se Stripe causar problemas)
3. Reverter script de validação
4. Executar `npm install` para restaurar dependências
5. Consultar backup de arquivos modificados

---

## Contexto Disponível Durante Implementação

Todos os documentos de contexto estarão disponíveis:
- `.kiro/specs/fix-cdk-typescript-validation/requirements.md`
- `.kiro/specs/fix-cdk-typescript-validation/design.md`
- `.kiro/specs/fix-cdk-typescript-validation/tasks.md` (este arquivo)

Documentação de referência:
- `database/RESUMO-AURORA-OFICIAL.md` (não modificar)
- `database/COMANDOS-RAPIDOS-AURORA.md` (não modificar)
- `lib/fibonacci-stack.ts` (referência para Cognito)
