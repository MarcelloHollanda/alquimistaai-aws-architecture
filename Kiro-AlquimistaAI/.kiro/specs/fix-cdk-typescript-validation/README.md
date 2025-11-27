# Spec: Correção de Validação CDK e TypeScript

## 📋 Resumo Executivo

Esta spec resolve os avisos de validação do sistema AlquimistaAI relacionados à infraestrutura CDK e compilação TypeScript, **sem alterar migrations ou fluxo de banco de dados Aurora**.

### Problemas Identificados

1. **CDK Stack Faltando**: Validador procura `lib/cognito-stack.ts` que não existe
   - **Realidade**: Cognito User Pool está integrado ao `FibonacciStack` (decisão arquitetural válida)

2. **19 Erros TypeScript** em 9 arquivos:
   - 12 erros de imports incorretos (`getDatabase`, `handleError`)
   - 4 erros de dependência faltando (`stripe`)
   - 5 erros de sintaxe do logger estruturado
   - 2 erros de tipos implícitos `any`

### Solução

- ✅ Ajustar validador para reconhecer arquitetura CDK real (3 stacks + Cognito integrado)
- ✅ Corrigir todos os 19 erros de compilação TypeScript
- ✅ Adicionar dependência Stripe ao projeto
- ✅ Documentar estado atual do sistema
- ✅ Manter integridade total do banco Aurora (0 alterações)

### Resultado Esperado

```powershell
# Antes
npm run build
# ❌ 19 errors in 9 files

.\scripts\validate-system-complete.ps1
# ⚠️ CDK Stacks: 3/4 (cognito-stack.ts faltando)
# ❌ Compilação TypeScript: Erro

# Depois
npm run build
# ✅ Compilação bem-sucedida

.\scripts\validate-system-complete.ps1
# ✅ CDK Stacks: 3/3 OK
# ✅ Cognito User Pool (integrado ao FibonacciStack)
# ✅ Compilação TypeScript: OK
```

---

## 📁 Estrutura da Spec

- **requirements.md**: 5 requisitos com critérios de aceitação EARS/INCOSE
- **design.md**: Solução técnica detalhada com diagramas
- **tasks.md**: 8 tarefas principais, 20 sub-tarefas
- **README.md**: Este arquivo (visão geral)

---

## 🎯 Objetivos

### Objetivo Principal
Corrigir validações e erros de compilação para permitir deploy do sistema.

### Objetivos Secundários
1. Documentar decisões arquiteturais (Cognito integrado)
2. Criar documento de status do sistema
3. Garantir compatibilidade Windows
4. Manter integridade do banco Aurora

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- npm instalado
- PowerShell (Windows)
- Acesso ao repositório AlquimistaAI

### Início Rápido

1. **Abrir a spec no Kiro**:
   - Navegar até `.kiro/specs/fix-cdk-typescript-validation/tasks.md`
   - Clicar em "Start task" na primeira tarefa

2. **Ou executar manualmente**:
   ```powershell
   # 1. Analisar exports
   Get-Content lambda/shared/database.ts | Select-String "export"
   Get-Content lambda/shared/error-handler.ts | Select-String "export"
   
   # 2. Seguir tarefas em tasks.md
   # 3. Validar após cada categoria de correção
   npm run build
   ```

### Validação Final

```powershell
# Compilação
npm run build

# Validador completo
.\scripts\validate-system-complete.ps1

# Síntese CDK
npx cdk synth --context env=dev
```

---

## 📊 Progresso

### Status Atual
- [x] Requirements definidos
- [x] Design completo
- [x] Tasks planejadas
- [ ] Implementação iniciada
- [ ] Validação completa
- [ ] Documentação atualizada

### Tarefas Principais
- [ ] 1. Analisar exports dos módulos compartilhados
- [ ] 2. Corrigir imports incorretos (4 handlers)
- [ ] 3. Adicionar Stripe e corrigir handlers (2 handlers)
- [ ] 4. Corrigir sintaxe do logger (3 handlers)
- [ ] 5. Validar compilação TypeScript
- [ ] 6. Atualizar script de validação CDK
- [ ] 7. Criar documentação de status
- [ ] 8. Validação final completa

---

## 🔒 Garantias

### O que NÃO será alterado
- ❌ Migrations em `database/migrations/`
- ❌ Scripts de banco (`apply-migrations-aurora-dev.ps1`)
- ❌ Documentação Aurora (`RESUMO-AURORA-OFICIAL.md`, etc.)
- ❌ Fluxo de aplicação de migrations
- ❌ Dependências de Supabase em fluxos obrigatórios

### O que será alterado
- ✅ 9 arquivos Lambda com erros TypeScript
- ✅ `package.json` (adicionar Stripe)
- ✅ `scripts/validate-system-complete.ps1`
- ✅ Criar `STATUS-SISTEMA-ALQUIMISTA-AI.md`
- ✅ Criar log de implementação

---

## 📚 Documentação de Referência

### Arquitetura CDK
- `lib/fibonacci-stack.ts` - Stack principal com Cognito (linha 857-897)
- `lib/nigredo-stack.ts` - Stack de prospecção
- `lib/alquimista-stack.ts` - Stack da plataforma
- `bin/app.ts` - Entry point do CDK

### Banco de Dados (Não Modificar)
- `database/RESUMO-AURORA-OFICIAL.md` - Visão geral Aurora
- `database/COMANDOS-RAPIDOS-AURORA.md` - Comandos Windows
- `database/AURORA-MIGRATIONS-AUDIT.md` - Auditoria completa
- `database/CONSOLIDACAO-AURORA-COMPLETA.md` - Consolidação

### Validação
- `scripts/validate-system-complete.ps1` - Script de validação
- `APLICACAO-MIGRATIONS-AURORA-DEV.md` - Fluxo de migrations

---

## 🐛 Troubleshooting

### Erro: "Module has no exported member"
- **Causa**: Import incorreto
- **Solução**: Verificar exports reais em `lambda/shared/`
- **Tarefa**: 1, 2

### Erro: "Cannot find module 'stripe'"
- **Causa**: Dependência não instalada
- **Solução**: `npm install stripe @types/stripe`
- **Tarefa**: 3.1

### Erro: "Object literal may only specify known properties"
- **Causa**: Sintaxe incorreta do logger
- **Solução**: Usar formato `{ error: error.message }`
- **Tarefa**: 2, 4

### Erro: "Parameter implicitly has an 'any' type"
- **Causa**: Falta tipagem explícita
- **Solução**: Adicionar tipos Stripe
- **Tarefa**: 3.3

---

## 📞 Suporte

### Dúvidas sobre a Spec
- Consultar `requirements.md` para critérios de aceitação
- Consultar `design.md` para detalhes técnicos
- Consultar `tasks.md` para passos de implementação

### Dúvidas sobre Aurora
- **NÃO** modificar migrations ou scripts
- Consultar documentação existente em `database/`
- Manter fluxo atual intacto

### Problemas Durante Implementação
1. Verificar que está seguindo ordem de tarefas
2. Executar `npm run build` após cada correção
3. Consultar seção "Rollback" em `tasks.md`
4. Documentar problemas no log de implementação

---

## ✅ Critérios de Conclusão

A spec está completa quando:

- [x] Todos os requisitos têm critérios de aceitação EARS
- [x] Design documenta solução técnica completa
- [x] Tasks cobrem todas as correções necessárias
- [ ] `npm run build` executa sem erros
- [ ] Validador reporta "CDK Stacks: 3/3 OK"
- [ ] Validador reconhece Cognito no FibonacciStack
- [ ] Nenhuma migration foi alterada
- [ ] Documentação de status criada
- [ ] Log de implementação completo

---

## 📝 Notas Finais

Esta spec foi criada seguindo a metodologia EARS (Easy Approach to Requirements Syntax) e INCOSE para garantir requisitos claros e testáveis.

**Princípio fundamental**: Corrigir validações e compilação sem alterar funcionalidades existentes ou banco de dados.

**Próximo passo**: Abrir `tasks.md` e clicar em "Start task" na primeira tarefa para iniciar a implementação.

---

**Criado em**: 2025-11-17  
**Versão**: 1.0  
**Status**: Pronto para implementação
