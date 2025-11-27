# 🔧 Fix: Stack em ROLLBACK_IN_PROGRESS

## Problema

O stack `FibonacciStack-dev` está em estado `ROLLBACK_IN_PROGRESS` e não pode ser atualizado.

## Solução Rápida

### Opção 1: Script Automatizado (Recomendado)

```powershell
.\limpar-stack.ps1
```

Este script vai:
1. Aguardar o rollback terminar
2. Deletar o stack automaticamente
3. Avisar quando estiver pronto para novo deploy

### Opção 2: Manual

```powershell
# 1. Aguardar rollback terminar (pode levar 5-10 minutos)
aws cloudformation wait stack-rollback-complete --stack-name FibonacciStack-dev

# 2. Deletar o stack
aws cloudformation delete-stack --stack-name FibonacciStack-dev

# 3. Aguardar deleção
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev

# 4. Fazer deploy novamente
.\deploy-backend.ps1
```

### Opção 3: Monitorar Manualmente

```powershell
# Ver status atual
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"

# Quando mostrar ROLLBACK_COMPLETE, deletar:
aws cloudformation delete-stack --stack-name FibonacciStack-dev

# Aguardar 2-3 minutos e tentar deploy novamente
.\deploy-backend.ps1
```

## Por Que Isso Aconteceu?

O stack tentou fazer deploy mas encontrou um erro (provavelmente relacionado ao CloudTrail ou buckets) e iniciou um rollback automático para voltar ao estado anterior.

## Prevenção

Para evitar isso no futuro:

1. Sempre deletar stacks em estado de erro antes de novo deploy
2. Verificar se não há recursos órfãos (buckets, etc.)
3. Usar `--require-approval never` para deploys automatizados

## Tempo Estimado

- Rollback: 5-10 minutos
- Deleção: 2-3 minutos
- Novo deploy: 20-25 minutos
- **Total**: ~30-40 minutos

## Comandos Úteis

```powershell
# Ver eventos do stack (para debug)
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 20

# Ver recursos do stack
aws cloudformation describe-stack-resources --stack-name FibonacciStack-dev

# Forçar deleção (se travado)
aws cloudformation delete-stack --stack-name FibonacciStack-dev
```

## Próximo Passo

Execute:
```powershell
.\limpar-stack.ps1
```

E aguarde a mensagem de conclusão!
