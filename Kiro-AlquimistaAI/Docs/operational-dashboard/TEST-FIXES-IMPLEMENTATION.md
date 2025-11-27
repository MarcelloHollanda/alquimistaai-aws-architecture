# Plano de Correção de Testes - Operational Dashboard

## Status Atual
- **Total de Testes**: 74
- **Testes Passando**: 33
- **Testes Falhando**: 41

## Problemas Identificados

### 1. Testes de Penetração (11 falhas)
**Arquivo**: `tests/security/penetration-tests.test.ts`

**Problema**: Os testes estão verificando se caracteres especiais estão escapados com `\`, mas `JSON.stringify()` escapa com `\"` para aspas, não para todos os caracteres especiais.

**Solução**: Ajustar as asserções para verificar corretamente o escape de caracteres perigosos.

### 2. Testes get-tenant-me (4 falhas)
**Arquivo**: `tests/unit/operational-dashboard/get-tenant-me.test.ts`

**Problemas**:
- Mocks não estão sendo aplicados corretamente antes da importação do handler
- Validação de acesso ao tenant não está funcionando como esperado
- Mensagens de erro não correspondem às expectativas

**Solução**: 
- Reorganizar a ordem dos mocks
- Ajustar as expectativas dos testes
- Corrigir a lógica de validação

### 3. Testes process-operational-command (14 falhas)
**Arquivo**: `tests/unit/operational-dashboard/process-operational-command.test.ts`

**Problema**: Dependência `@aws-sdk/lib-dynamodb` não está instalada.

**Solução**: 
- Instalar a dependência
- Ajustar os mocks para usar a versão correta do SDK

## Plano de Ação

### Fase 1: Correção dos Testes de Penetração ✓
1. Ajustar validações de escape de caracteres
2. Melhorar testes de injeção SQL/NoSQL/Command/LDAP

### Fase 2: Correção dos Testes get-tenant-me
1. Reorganizar estrutura de mocks
2. Ajustar expectativas de erro
3. Corrigir validação de acesso

### Fase 3: Correção dos Testes process-operational-command
1. Instalar dependência @aws-sdk/lib-dynamodb
2. Atualizar mocks do AWS SDK
3. Ajustar importações

### Fase 4: Validação Final
1. Executar todos os testes
2. Verificar cobertura
3. Documentar resultados

## Próximos Passos
1. Implementar correções na Fase 1
2. Testar cada correção individualmente
3. Avançar para próximas fases
