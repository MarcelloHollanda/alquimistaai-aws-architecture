# Bloqueio de Deploy - Aurora Migrations Runner

**Data:** 2024-11-27  
**Status:** ⚠️ Bloqueado por Dependências Cíclicas  
**Componente:** Lambda Aurora Migrations Runner

---

## 📋 Situação Atual

O stack `AuroraMigrationsRunnerStack-dev` está **pronto para deploy**, mas o deploy está bloqueado por **dependências cíclicas entre outros stacks** do projeto.

### ✅ O Que Está Pronto

1. **Lambda Aurora Migrations Runner**
   - Código TypeScript compilado
   - Build concluído com sucesso
   - Migrations SQL empacotadas

2. **Stack CDK**
   - Configuração completa
   - Ajustes para evitar Docker
   - Correções de variáveis de ambiente

3. **Scripts de Automação**
   - Build script funcionando
   - Run migration script pronto
   - List migrations script pronto

4. **Migration 017**
   - SQL criado e versionado
   - Pronto para execução

### ❌ Problema Atual

**Erro de Deploy:**
```
ValidationError: 'OperationalDashboardStack-dev' depends on 'AlquimistaStack-dev'
({OperationalDashboardStack-dev}.addDependency({AlquimistaStack-dev})). 
Adding this dependency (AlquimistaStack-dev -> OperationalDashboardStack-dev/GetTenantMeFunction/Resource.Arn) 
would create a cyclic reference.
```

**Causa:**
- Dependência cíclica entre `AlquimistaStack` e `OperationalDashboardStack`
- Não relacionado ao `AuroraMigrationsRunnerStack`
- Problema pré-existente na arquitetura de stacks

---

## 🔧 Correções Aplicadas

### 1. Remoção de Docker Bundling

**Problema:** CDK tentava usar Docker para bundling, mas Docker Desktop não estava rodando.

**Solução:** Usar código pré-compilado em `lambda-src/aurora-migrations-runner/dist/`

```typescript
// Antes (com Docker)
code: lambda.Code.fromAsset('lambda-src/aurora-migrations-runner/dist', {
  bundling: { ... }
})

// Depois (sem Docker)
code: lambda.Code.fromAsset('lambda-src/aurora-migrations-runner/dist')
```

### 2. Remoção de AWS_REGION

**Problema:** `AWS_REGION` é variável reservada pela Lambda runtime.

**Solução:** Remover do `environment`. Lambda já tem `AWS_REGION` automaticamente.

```typescript
// Antes
environment: {
  DB_SECRET_ARN: dbSecret.secretArn,
  AWS_REGION: this.region,  // ❌ Erro
  NODE_OPTIONS: '--enable-source-maps'
}

// Depois
environment: {
  DB_SECRET_ARN: dbSecret.secretArn,
  NODE_OPTIONS: '--enable-source-maps'
}
```

### 3. Uso de Subnets Isoladas

**Problema:** VPC não tem subnets `PRIVATE_WITH_EGRESS`.

**Solução:** Usar `PRIVATE_ISOLATED` (disponível na VPC).

```typescript
// Antes
vpcSubnets: {
  subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS  // ❌ Não existe
}

// Depois
vpcSubnets: {
  subnetType: ec2.SubnetType.PRIVATE_ISOLATED  // ✅ Existe
}
```

### 4. Remoção de Configuração Automática de Security Group

**Problema:** Configurar Security Group do Aurora criava dependência cíclica.

**Solução:** Documentar que deve ser configurado manualmente.

```typescript
// Antes
dbCluster.connections.allowFrom(
  lambdaSecurityGroup,
  ec2.Port.tcp(5432),
  'Allow migrations runner Lambda to access Aurora'
);  // ❌ Cria dependência cíclica

// Depois
// Nota: A permissão de acesso ao Aurora deve ser configurada manualmente
// no Security Group do Aurora para permitir conexões da Lambda
// Isso evita dependência cíclica entre stacks
```

---

## 🚀 Próximos Passos

### Opção 1: Resolver Dependências Cíclicas (Recomendado)

**Ação:** Refatorar stacks para eliminar dependências cíclicas.

**Passos:**
1. Analisar dependências entre `AlquimistaStack` e `OperationalDashboardStack`
2. Identificar recursos que causam o ciclo
3. Mover recursos para stack intermediário ou usar exports/imports
4. Testar deploy de todos os stacks

**Tempo estimado:** 2-4 horas

### Opção 2: Deploy Manual da Lambda (Workaround)

**Ação:** Criar Lambda manualmente via Console AWS ou AWS CLI.

**Passos:**

1. **Criar Lambda via AWS CLI:**
   ```powershell
   # Criar ZIP do código
   cd lambda-src\aurora-migrations-runner\dist
   Compress-Archive -Path * -DestinationPath ..\aurora-migrations-runner.zip
   
   # Upload para S3
   aws s3 cp ..\aurora-migrations-runner.zip s3://seu-bucket/lambdas/
   
   # Criar Lambda
   aws lambda create-function `
     --function-name aurora-migrations-runner-dev `
     --runtime nodejs20.x `
     --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role `
     --handler index.handler `
     --code S3Bucket=seu-bucket,S3Key=lambdas/aurora-migrations-runner.zip `
     --timeout 300 `
     --memory-size 512 `
     --environment Variables="{DB_SECRET_ARN=arn:aws:secretsmanager:...}"
   ```

2. **Configurar VPC:**
   ```powershell
   aws lambda update-function-configuration `
     --function-name aurora-migrations-runner-dev `
     --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-zzz
   ```

3. **Configurar Security Group do Aurora:**
   ```powershell
   # Adicionar regra de entrada no SG do Aurora
   aws ec2 authorize-security-group-ingress `
     --group-id sg-aurora `
     --protocol tcp `
     --port 5432 `
     --source-group sg-lambda
   ```

4. **Executar Migration 017:**
   ```powershell
   .\scripts\run-migration-017.ps1 -Environment dev
   ```

**Tempo estimado:** 30-60 minutos

### Opção 3: Deploy Isolado (Temporário)

**Ação:** Comentar dependências problemáticas temporariamente.

**Passos:**
1. Comentar linha de dependência em `bin/app.ts`:
   ```typescript
   // operationalDashboardStack.addDependency(alquimistaStack);
   ```

2. Deploy apenas do `AuroraMigrationsRunnerStack`:
   ```powershell
   npx cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev
   ```

3. Descomentar dependência após deploy

**Tempo estimado:** 15 minutos

**⚠️ Atenção:** Pode causar problemas se outros stacks forem deployados.

---

## 📊 Análise de Dependências

### Dependências do AuroraMigrationsRunnerStack

```
AuroraMigrationsRunnerStack-dev
  └─ FibonacciStack-dev (OK)
      ├─ VPC
      ├─ Aurora Cluster
      └─ DB Secret
```

**Status:** ✅ Sem problemas

### Dependências Problemáticas (Outros Stacks)

```
AlquimistaStack-dev
  └─ OperationalDashboardStack-dev
      └─ AlquimistaStack-dev  ❌ CICLO!
```

**Causa do Ciclo:**
- `OperationalDashboardStack` depende de `AlquimistaStack` (platformApi)
- `AlquimistaStack` tenta usar recursos de `OperationalDashboardStack`

---

## 🔍 Diagnóstico Completo

### Comandos Executados

```powershell
# 1. Build (✅ Sucesso)
.\scripts\build-aurora-migrations-runner.ps1

# 2. Deploy (❌ Bloqueado)
npx cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev
```

### Erros Encontrados e Corrigidos

1. ✅ **Docker não disponível** → Removido bundling
2. ✅ **AWS_REGION reservado** → Removido variável
3. ✅ **Subnets não existem** → Mudado para PRIVATE_ISOLATED
4. ✅ **Dependência cíclica (próprio stack)** → Removido allowFrom
5. ❌ **Dependência cíclica (outros stacks)** → Bloqueio atual

---

## 📚 Referências

- [Stack CDK](../../lib/aurora-migrations-runner-stack.ts)
- [Lambda Handler](../../lambda-src/aurora-migrations-runner/src/index.ts)
- [Runbook Operacional](../../.kiro/specs/micro-agente-disparo-agendamento/RUNBOOK-OPERACIONAL-MIGRATION-017.md)
- [Pipeline Migrations VPC](../../.kiro/specs/micro-agente-disparo-agendamento/PIPELINE-MIGRATIONS-VPC.md)

---

## ✅ Checklist de Desbloqueio

Para desbloquear o deploy, escolha uma opção acima e complete:

**Opção 1 (Recomendado):**
- [ ] Analisar dependências cíclicas
- [ ] Refatorar stacks
- [ ] Testar deploy de todos os stacks
- [ ] Deploy do AuroraMigrationsRunnerStack

**Opção 2 (Workaround):**
- [ ] Criar Lambda manualmente
- [ ] Configurar VPC e Security Groups
- [ ] Executar migration 017
- [ ] Validar funcionamento

**Opção 3 (Temporário):**
- [ ] Comentar dependências problemáticas
- [ ] Deploy do AuroraMigrationsRunnerStack
- [ ] Descomentar dependências
- [ ] Validar que nada quebrou

---

**Status:** ⚠️ Aguardando Resolução de Dependências  
**Última Atualização:** 2024-11-27  
**Próxima Ação:** Escolher opção de desbloqueio
