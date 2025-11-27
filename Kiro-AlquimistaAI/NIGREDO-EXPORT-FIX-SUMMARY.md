# Correção de Conflito de Exports - NigredoStack

## Problema Identificado

O deploy do `NigredoStack-dev` estava falha com o erro:
```
Export with name dev-FunnelConversionQuery is already exported by stack FibonacciStack-dev
```

**Causa:** CloudFormation não permite exports com o mesmo nome na mesma conta/região. O NigredoStack estava tentando criar exports que já existiam no FibonacciStack.

## Correções Aplicadas

### 1. lib/cloudwatch-insights-queries.ts

Adicionado prefixo "Nigredo-" a todos os exports para garantir unicidade:

**Antes:**
```typescript
exportName: `${props.envName}-ErrorsByAgentQuery`
exportName: `${props.envName}-LatencyByEndpointQuery`
exportName: `${props.envName}-FunnelConversionQuery`
```

**Depois:**
```typescript
exportName: `Nigredo-${props.envName}-ErrorsByAgentQuery`
exportName: `Nigredo-${props.envName}-LatencyByEndpointQuery`
exportName: `Nigredo-${props.envName}-FunnelConversionQuery`
```

### 2. lib/nigredo-stack.ts

Corrigido erro de sintaxe (vírgula faltando na linha 189):

**Antes:**
```typescript
deadLetterQueue: {
  queue: this.dlq,
  maxReceiveCount: 3
}
encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
```

**Depois:**
```typescript
deadLetterQueue: {
  queue: this.dlq,
  maxReceiveCount: 3
},
encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
```

## Padrão de Nomenclatura Estabelecido

### Fibonacci Stack
- Mantém exports sem prefixo: `dev-FunnelConversionQuery`

### Nigredo Stack
- Usa prefixo "Nigredo-": `Nigredo-dev-FunnelConversionQuery`
- Padrão: `Nigredo-${envName}-${ResourceName}`

## Próximos Passos para Deploy

### 1. Deletar Stack com Erro

No AWS Console CloudFormation (região us-east-1):
1. Selecione `NigredoStack-dev` (status: ROLLBACK_COMPLETE)
2. Clique em "Delete"
3. Aguarde até o stack ser completamente removido

### 2. Deploy Corrigido

Execute no PowerShell:
```powershell
# Sintetizar o template para verificar
npx cdk synth NigredoStack-dev

# Deploy do stack corrigido
npx cdk deploy NigredoStack-dev --verbose
```

## Validação

Após o deploy bem-sucedido, verifique no CloudFormation:
- Stack `NigredoStack-dev` com status `CREATE_COMPLETE`
- Exports criados com prefixo "Nigredo-"
- Sem conflitos com exports do FibonacciStack-dev

## Exports Criados pelo Nigredo

Com o prefixo "Nigredo-", os seguintes exports serão criados:
- `Nigredo-dev-ErrorsByAgentQuery`
- `Nigredo-dev-LatencyByEndpointQuery`
- `Nigredo-dev-FunnelConversionQuery`
- `Nigredo-dev-ProspectConversionQuery`
- `NigredoRecebimentoQueueUrl-dev`
- `NigredoApiUrl-dev`
- E outros recursos específicos do Nigredo...

## Status

✅ Correções aplicadas
✅ Arquivos formatados pelo Kiro IDE
✅ Sem erros de diagnóstico
⏳ Aguardando deleção do stack com erro
⏳ Aguardando novo deploy

---
**Data:** 2024
**Autor:** Kiro AI Assistant
