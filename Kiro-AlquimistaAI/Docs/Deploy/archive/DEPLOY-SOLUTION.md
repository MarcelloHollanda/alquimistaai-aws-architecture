# Solução para Problemas de Deploy

## Problemas Resolvidos

### 1. CloudTrail - Permissões Insuficientes
**Problema**: CloudTrail não conseguia acessar o bucket S3 ou chave KMS.

**Solução**: Adicionadas permissões explícitas ao bucket do CloudTrail:
- `s3:GetBucketAcl` para o CloudTrail verificar ACLs
- `s3:PutObject` para o CloudTrail escrever logs

### 2. Bucket StackVersions com RETAIN
**Problema**: Bucket `fibonacci-stack-versions-dev-*` tinha `RemovalPolicy.RETAIN`, causando conflitos em redeploys.

**Solução**: Alterado para usar `deletionProtection` config:
- Dev: `RemovalPolicy.DESTROY` + `autoDeleteObjects: true`
- Prod: `RemovalPolicy.RETAIN`

## Comandos para Deploy

```powershell
# Deploy do ambiente de desenvolvimento
npm run deploy:dev

# Se houver problemas, deletar stack e tentar novamente
aws cloudformation delete-stack --stack-name FibonacciStack-dev
# Aguardar alguns segundos
npm run deploy:dev
```

## Próximos Passos

Após o deploy bem-sucedido:
1. Verificar outputs do CloudFormation
2. Configurar variáveis de ambiente no frontend
3. Testar conectividade com a API
4. Validar acesso ao banco de dados
