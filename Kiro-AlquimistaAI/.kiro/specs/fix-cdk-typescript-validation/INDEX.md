# 📑 Índice - Spec de Correção CDK e TypeScript

## 🎯 Visão Geral

Esta spec resolve avisos de validação CDK e erros de compilação TypeScript no sistema AlquimistaAI, **sem alterar banco de dados Aurora**.

---

## 📚 Documentos da Spec

### 1. 📋 [requirements.md](./requirements.md)
**O QUE** precisa ser feito

- 5 requisitos com critérios EARS/INCOSE
- Requirement 1: Corrigir validação de CDK Stack
- Requirement 2: Corrigir erros de compilação TypeScript (19 erros)
- Requirement 3: Atualizar documentação de status
- Requirement 4: Preservar integridade do banco de dados
- Requirement 5: Compatibilidade com Windows

**Quando ler**: Antes de começar, para entender os objetivos

---

### 2. 🏗️ [design.md](./design.md)
**COMO** será implementado

- Arquitetura CDK atual (3 stacks + Cognito integrado)
- Análise detalhada dos 19 erros TypeScript
- Soluções técnicas por categoria
- Diagramas de fluxo e arquitetura
- Estratégias de correção e validação

**Quando ler**: Antes de implementar, para entender a solução técnica

---

### 3. ✅ [tasks.md](./tasks.md)
**PASSO A PASSO** da implementação

- 8 tarefas principais
- 20 sub-tarefas detalhadas
- Ordem de execução recomendada
- Comandos de validação Windows
- Critérios de sucesso

**Quando ler**: Durante implementação, seguir tarefa por tarefa

---

### 4. 📖 [README.md](./README.md)
**RESUMO EXECUTIVO** da spec

- Visão geral dos problemas
- Como executar
- Troubleshooting
- Garantias (o que NÃO será alterado)
- Critérios de conclusão

**Quando ler**: Para visão geral rápida ou referência

---

### 5. 📝 [INDEX.md](./INDEX.md)
**NAVEGAÇÃO** entre documentos (você está aqui)

---

## 🚀 Fluxo de Trabalho Recomendado

```
1. Ler README.md (5 min)
   ↓
2. Ler requirements.md (10 min)
   ↓
3. Ler design.md (15 min)
   ↓
4. Abrir tasks.md e iniciar Tarefa 1
   ↓
5. Seguir tarefas em ordem (2-3 horas)
   ↓
6. Validação final completa
```

---

## 🎓 Conceitos Importantes

### Arquitetura CDK Atual

```
FibonacciStack (lib/fibonacci-stack.ts)
├── VPC, Aurora, EventBridge
├── Cognito User Pool ✅ (linha 857-897)
├── S3, CloudFront, WAF
└── Lambda API Handler

NigredoStack (lib/nigredo-stack.ts)
└── Depende do FibonacciStack

AlquimistaStack (lib/alquimista-stack.ts)
└── Depende do FibonacciStack
```

**Decisão Arquitetural**: Cognito está integrado ao FibonacciStack (não em stack separada)

---

### Erros TypeScript (19 total)

#### Categoria 1: Imports Incorretos (12 erros)
- `getDatabase` não existe → usar export real
- `handleError` não existe → usar export real
- **Arquivos**: 4 handlers

#### Categoria 2: Stripe Faltando (4 erros)
- `Cannot find module 'stripe'`
- **Solução**: Adicionar ao package.json
- **Arquivos**: 2 handlers

#### Categoria 3: Logger (5 erros)
- Sintaxe incorreta do logger estruturado
- **Solução**: Usar formato correto
- **Arquivos**: 7 handlers

#### Categoria 4: Tipos (2 erros)
- Tipos implícitos `any`
- **Solução**: Adicionar tipagem Stripe
- **Arquivos**: 1 handler

---

## 🔒 Garantias

### ❌ NÃO será alterado
- Migrations (10 arquivos)
- Scripts de banco
- Documentação Aurora
- Fluxo de migrations
- Supabase em fluxos obrigatórios

### ✅ Será alterado
- 9 arquivos Lambda
- package.json (Stripe)
- Script de validação
- Criar documentação de status

---

## 📊 Progresso

### Documentação
- [x] Requirements
- [x] Design
- [x] Tasks
- [x] README
- [x] INDEX

### Implementação
- [x] Tarefa 1: Analisar exports ✅
- [x] Tarefa 2: Corrigir imports (7 handlers) ✅
- [x] Tarefa 3: Corrigir erros Stripe (4 erros) ✅
  - [x] 3.1 Diagnóstico ✅
  - [x] 3.2 Instalar Stripe ✅
  - [x] 3.3 Corrigir handlers ✅
  - [x] 3.4 Validar env vars ✅
  - [x] 3.5 Build final ✅
- [x] Tarefa 4: Corrigir Stacks CDK & Cognito ✅
  - [x] 4.1 Diagnóstico CDK ✅
  - [x] 4.2 Mapear stacks reais ✅
  - [x] 4.3 Remover referências CognitoStack ✅
  - [x] 4.4 Ajustar tipagem/exports ✅
  - [x] 4.5 Validar CDK + documentar ✅
- [ ] Tarefa 5: Validação final completa
- [ ] Tarefa 6: Criar documentação de status
- [ ] Tarefa 7: Atualizar CORRECAO-VALIDACAO-CDK-TYPESCRIPT.md

---

## 🛠️ Comandos Rápidos

### Análise
```powershell
# Ver exports de módulos compartilhados
Get-Content lambda/shared/database.ts | Select-String "export"
Get-Content lambda/shared/error-handler.ts | Select-String "export"
```

### Compilação
```powershell
# Compilar TypeScript
npm run build
```

### Validação
```powershell
# Validador completo
.\scripts\validate-system-complete.ps1

# Síntese CDK
npx cdk synth --context env=dev
```

### Instalação
```powershell
# Adicionar Stripe
npm install stripe
npm install --save-dev @types/stripe
```

---

## 📈 Resultado Esperado

### Antes
```
npm run build
❌ 19 errors in 9 files

validate-system-complete.ps1
⚠️ CDK Stacks: 3/4
❌ Compilação: Erro
```

### Progresso Atual (Após Tarefas 1-4)
```
npm run build
✅ Compilação bem-sucedida (0 erros)

npx cdk synth --all
✅ Synth bem-sucedido (3 stacks)

Erros resolvidos:
✅ Tarefa 1: Análise de exports
✅ Tarefa 2: 11 erros de imports/logger (7 handlers)
✅ Tarefa 3: 4 erros de Stripe (2 handlers)
✅ Tarefa 4: Referências CognitoStack (8 arquivos doc)

Total: 19 erros resolvidos + documentação atualizada
```

### Depois (Meta Final)
```
npm run build
✅ Compilação bem-sucedida

validate-system-complete.ps1
✅ CDK Stacks: 3/3 OK
✅ Cognito (integrado)
✅ Compilação: OK
✅ Migrations: 10/10
```

---

## 🎯 Próximos Passos

1. **Agora**: Ler [README.md](./README.md) para visão geral
2. **Depois**: Ler [requirements.md](./requirements.md) para entender objetivos
3. **Em seguida**: Ler [design.md](./design.md) para entender solução
4. **Finalmente**: Abrir [tasks.md](./tasks.md) e iniciar Tarefa 1

---

## 📞 Ajuda Rápida

| Dúvida sobre... | Consultar... |
|-----------------|--------------|
| O que fazer | [requirements.md](./requirements.md) |
| Como fazer | [design.md](./design.md) |
| Passo a passo | [tasks.md](./tasks.md) |
| Visão geral | [README.md](./README.md) |
| Navegação | [INDEX.md](./INDEX.md) (aqui) |

---

## ✅ Checklist Rápido

Antes de começar:
- [ ] Li o README.md
- [ ] Entendi os 5 requisitos
- [ ] Revisei o design técnico
- [ ] Tenho Node.js 20+ instalado
- [ ] Tenho acesso ao repositório

Durante implementação:
- [ ] Seguindo ordem das tarefas
- [ ] Validando após cada correção
- [ ] Documentando mudanças
- [ ] NÃO alterando migrations

Ao finalizar:
- [ ] `npm run build` sem erros
- [ ] Validador reporta 3/3 stacks
- [ ] Cognito reconhecido
- [ ] Documentação criada
- [ ] Log de implementação completo

---

**Versão**: 1.0  
**Criado em**: 17/11/2025  
**Status**: ✅ Pronto para uso

**Início recomendado**: [README.md](./README.md) → [requirements.md](./requirements.md) → [design.md](./design.md) → [tasks.md](./tasks.md)
