# Tarefa 4 - Diagnóstico CDK Stacks & Cognito

## Data: 2025-11-17

## 1. Diagnóstico Inicial

### 1.1 Resultado do Build TypeScript

```
npm run build
✅ Exit Code: 0
✅ Sem erros de compilação TypeScript
```

### 1.2 Resultado do CDK Synth

```
npx cdk synth --all
✅ Exit Code: 0
✅ Synth bem-sucedido para todas as stacks
```

**Warnings encontrados:**
- Deprecation warnings do CloudFront S3Origin (não crítico)
- Warnings de SecurityGroup egress rules (não crítico)
- Feature flags não configurados (não crítico)

**Nenhum erro relacionado a stacks ausentes ou CognitoStack foi encontrado no synth atual.**

### 1.3 Análise do Arquivo Principal CDK

**Arquivo:** `bin/app.ts`

**Stacks Instanciadas (3 stacks oficiais):**

1. **FibonacciStack** (`FibonacciStack-${envName}`)
   - Descrição: Fibonacci - Núcleo Orquestrador Central
   - Contém: VPC, Aurora, EventBus, KMS, **Cognito User Pool**, HTTP API, etc.

2. **NigredoStack** (`NigredoStack-${envName}`)
   - Descrição: Nigredo - Núcleo de Prospecção B2B
   - Dependências: FibonacciStack (VPC, DB, EventBus, KMS)

3. **AlquimistaStack** (`AlquimistaStack-${envName}`)
   - Descrição: Alquimista - Plataforma SaaS Multi-Tenant
   - Dependências: FibonacciStack (EventBus, UserPool, DB)

### 1.4 Cognito User Pool - Localização Confirmada

**Arquivo:** `lib/fibonacci-stack.ts`
**Linhas:** 857-897

```typescript
// Cognito User Pool
this.userPool = new cognito.UserPool(this, 'UserPool', {
  userPoolName: `fibonacci-users-${props.envName}`,
  selfSignUpEnabled: true,
  signInAliases: {
    email: true,
    username: false
  },
  // ... configurações
});
```

**Exports públicos do FibonacciStack:**
- `public readonly userPool: cognito.UserPool;` (linha 41)

**Outputs CDK:**
- `UserPoolId` - exportado como `FibonacciUserPoolId-${envName}`
- `UserPoolArn` - exportado como `FibonacciUserPoolArn-${envName}`

### 1.5 Busca por Referências a CognitoStack

**Arquivo `cognito-stack.ts`:**
- ❌ **NÃO EXISTE** no diretório `lib/`

**Referências encontradas em documentação:**

1. **scripts/validate-system-complete.ps1** (linha 155)
   ```powershell
   "lib/cognito-stack.ts"  # ❌ Arquivo inexistente
   ```

2. **COMANDOS-DEPLOY.md** (linhas 112, 164)
   ```bash
   cdk deploy CognitoStack --context env=prod
   USER_POOL_ID=$(cat ../cdk-outputs-cognito.json | jq -r '.CognitoStack.UserPoolId')
   ```

3. **SISTEMA-PRONTO-DEPLOY.md** (linha 422)
   ```bash
   cdk deploy CognitoStack --context env=prod
   ```

4. **GUIA-DEPLOY-RAPIDO.md** (linha 76)
   ```bash
   cdk deploy CognitoStack --context env=prod
   ```

5. **DEPLOY-AGORA.md** (linhas 182, 259)
   ```bash
   cdk deploy CognitoStack --context env=prod
   $USER_POOL_ID = (Get-Content cdk-outputs-cognito.json | ConvertFrom-Json).CognitoStack.UserPoolId
   ```

## 2. Resumo da Situação Atual

### ✅ O que está CORRETO:
- Build TypeScript compila sem erros
- CDK synth funciona perfeitamente
- 3 stacks oficiais estão implementadas e funcionais
- Cognito User Pool está implementado dentro do FibonacciStack
- Não há erros de runtime ou compilação relacionados a stacks

### ❌ O que está INCORRETO:
- **Documentação desatualizada** referencia `CognitoStack` que não existe
- **Script de validação** (`validate-system-complete.ps1`) procura por `lib/cognito-stack.ts`
- **Guias de deploy** instruem deploy de stack inexistente
- **Comandos de extração de outputs** referenciam `CognitoStack` ao invés de `FibonacciStack`

## 3. Impacto

### Impacto Técnico:
- ⚠️ **BAIXO** - O código CDK funciona corretamente
- ⚠️ **MÉDIO** - Script de validação reporta falso negativo (3/4 stacks)
- ⚠️ **ALTO** - Documentação pode confundir desenvolvedores

### Impacto Operacional:
- Comandos de deploy em documentos podem falhar
- Extração de outputs do Cognito usa path incorreto
- Validação automática reporta sistema incompleto incorretamente

## 4. Plano de Correção

### T4.2 ✅ - Mapear Stacks Reais
- [x] Identificar stacks no `bin/app.ts`
- [x] Confirmar localização do Cognito User Pool
- [x] Documentar estrutura real

### T4.3 - Remover/Alinhar Referências a CognitoStack
- [ ] Atualizar `scripts/validate-system-complete.ps1`
- [ ] Atualizar `COMANDOS-DEPLOY.md`
- [ ] Atualizar `SISTEMA-PRONTO-DEPLOY.md`
- [ ] Atualizar `GUIA-DEPLOY-RAPIDO.md`
- [ ] Atualizar `DEPLOY-AGORA.md`
- [ ] Buscar outras referências em arquivos .md

### T4.4 - Ajustar Tipagem/Exports
- [ ] Verificar exports do FibonacciStack
- [ ] Verificar imports em outras stacks
- [ ] Padronizar tipos e interfaces

### T4.5 - Validar e Documentar
- [ ] Executar build e synth novamente
- [ ] Executar script de validação atualizado
- [ ] Atualizar documentação da spec

## 5. Arquitetura Real Confirmada

```
┌─────────────────────────────────────────────────────────────┐
│                     bin/app.ts                              │
│                  (Entry Point CDK)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────────────────────┐
                            │                                 │
                            ▼                                 ▼
┌───────────────────────────────────────┐   ┌─────────────────────────────┐
│      FibonacciStack-${env}            │   │   NigredoStack-${env}       │
│  (Núcleo Orquestrador Central)        │   │  (Núcleo de Prospecção)     │
│                                       │   │                             │
│  ✅ VPC                               │   │  Depende de:                │
│  ✅ Aurora Serverless v2              │   │  - FibonacciStack.vpc       │
│  ✅ EventBridge                       │   │  - FibonacciStack.dbCluster │
│  ✅ KMS Key                           │   │  - FibonacciStack.eventBus  │
│  ✅ Cognito User Pool ⭐              │   │  - FibonacciStack.kmsKey    │
│  ✅ HTTP API Gateway                  │   │                             │
│  ✅ Lambda Functions                  │   │  ✅ Lambda Functions        │
│  ✅ S3 + CloudFront                   │   │  ✅ API Routes              │
│                                       │   │                             │
│  Exports:                             │   └─────────────────────────────┘
│  - userPool (UserPool)                │                 │
│  - vpc (VPC)                          │                 │
│  - dbCluster (DatabaseCluster)        │                 │
│  - eventBus (EventBus)                │                 │
│  - kmsKey (Key)                       │                 │
└───────────────────────────────────────┘                 │
                            │                             │
                            └─────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────┐
                        │  AlquimistaStack-${env}         │
                        │  (Plataforma SaaS Multi-Tenant) │
                        │                                 │
                        │  Depende de:                    │
                        │  - FibonacciStack.eventBus      │
                        │  - FibonacciStack.userPool ⭐   │
                        │  - FibonacciStack.dbCluster     │
                        │  - FibonacciStack.dbSecret      │
                        │                                 │
                        │  ✅ Lambda Functions            │
                        │  ✅ API Routes                  │
                        │  ✅ Multi-tenant Logic          │
                        └─────────────────────────────────┘
```

## 6. Observações Importantes

1. **Cognito User Pool** está DENTRO do FibonacciStack, não em stack separada
2. **Não existe** e **nunca existiu** um arquivo `lib/cognito-stack.ts`
3. **AlquimistaStack** usa o UserPool do FibonacciStack via propriedade `userPool`
4. **Outputs CDK** do Cognito são exportados pelo FibonacciStack:
   - `FibonacciUserPoolId-${env}`
   - `FibonacciUserPoolArn-${env}`

## 7. Próximos Passos

Seguir para **T4.3** - Remover/Alinhar todas as referências a CognitoStack inexistente.
