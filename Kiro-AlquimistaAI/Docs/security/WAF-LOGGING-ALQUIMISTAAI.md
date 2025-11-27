# WAF + CloudWatch Logs – Padrão Oficial AlquimistaAI

## 1. Contexto

Este documento registra a configuração oficial de **logging do AWS WAF** para a arquitetura AlquimistaAI na AWS.

Stacks envolvidas:
- `WAFStack-dev`
- `WAFStack-prod`

Objetivo:
- Garantir que o WAF tenha **logging funcional e aceito pelo serviço**, em ambos ambientes (`dev` e `prod`), com nomes de Log Group compatíveis com as regras da AWS e ARNs corretos para `LOG_DESTINATION`.

---

## 2. Problema Original

Durante o deploy da `WAFStack-dev`, o CloudFormation falhava com:

> Error reason: The ARN isn't valid. A valid ARN begins with arn: and includes other information separated by colons or slashes., field: LOG_DESTINATION, parameter: arn:aws:logs:us-east-1:207933152643:log-group:/aws/waf/alquimista-dev

Causas principais:

1. **Nome do Log Group incompatível com o WAF**
   - Estava sendo usado algo como:
     - `/aws/waf/alquimista-dev`
     - `/aws/waf/alquimista-prod`
   - O WAF exige que o nome do log group comece com:
     - `aws-waf-logs-`

2. Ajustes anteriores removendo `:*` no ARN já estavam corretos, mas **o nome em si ainda não atendia ao padrão do WAF**, causando o erro de `LOG_DESTINATION`.

---

## 3. Decisão de Design

Adotamos o seguinte padrão **oficial** para logging do WAF:

- **Log Groups:**
  - `aws-waf-logs-alquimista-dev`
  - `aws-waf-logs-alquimista-prod`

- **ARNs construídos via:**
  - `cdk.Stack.of(this).formatArn(...)` com `ArnFormat.COLON_RESOURCE_NAME`

- **Nada de `:*` no final do ARN.**

- **`WAFLoggingDev` e `WAFLoggingProd`** apontando para esses ARNs formatados.

Este padrão passa a ser o **modelo oficial** para qualquer WAF futuro na AlquimistaAI.

---

## 4. Implementação CDK – Trecho Oficial (`lib/waf-stack.ts`)

### 4.1. Log Groups do WAF

```typescript
// 2. CloudWatch Log Groups para WAF Logs

// Log Group para Dev (retenção 30 dias)
this.logGroupDev = new logs.LogGroup(this, 'WAFLogGroupDev', {
  // Obrigatório para WAF: prefixo aws-waf-logs-
  logGroupName: 'aws-waf-logs-alquimista-dev',
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// Log Group para Prod (retenção 90 dias)
this.logGroupProd = new logs.LogGroup(this, 'WAFLogGroupProd', {
  // Obrigatório para WAF: prefixo aws-waf-logs-
  logGroupName: 'aws-waf-logs-alquimista-prod',
  retention: logs.RetentionDays.THREE_MONTHS,
  removalPolicy: env === 'prod'
    ? cdk.RemovalPolicy.RETAIN
    : cdk.RemovalPolicy.DESTROY,
});
```

### 4.2. Logging Configuration (ARN correto e RedactedFields)

```typescript
// 5. Logging Configuration

// WAF exige ARN de Log Group sem :* no final
// e com nome começando por aws-waf-logs-
const wafLogGroupDevArnForWaf = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: this.logGroupDev.logGroupName,
});

const loggingDev = new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingDev', {
  resourceArn: this.webAclDev.attrArn,
  logDestinationConfigs: [wafLogGroupDevArnForWaf],
});

// Campos sensíveis ocultos
loggingDev.addPropertyOverride('RedactedFields', [
  {
    SingleHeader: {
      Name: 'authorization',
    },
  },
  {
    SingleHeader: {
      Name: 'cookie',
    },
  },
]);

const wafLogGroupProdArnForWaf = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: this.logGroupProd.logGroupName,
});

const loggingProd = new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingProd', {
  resourceArn: this.webAclProd.attrArn,
  logDestinationConfigs: [wafLogGroupProdArnForWaf],
});

loggingProd.addPropertyOverride('RedactedFields', [
  {
    SingleHeader: {
      Name: 'authorization',
    },
  },
  {
    SingleHeader: {
      Name: 'cookie',
    },
  },
]);
```

---

## 5. Checklist de Validação

### 5.1. Build e Synth

Na raiz do projeto:

```bash
npm run build

npx cdk synth WAFStack-dev --context env=dev
```

**Critérios de sucesso:**
- Build sem erros.
- `cdk synth` gera o template da `WAFStack-dev` sem reclamações de `LOG_DESTINATION`.

### 5.2. Deploy DEV e PROD

```bash
npx cdk deploy WAFStack-dev --context env=dev --require-approval never

npx cdk deploy WAFStack-prod --context env=prod --require-approval never
```

**Critérios de sucesso:**
- Stacks `WAFStack-dev` e `WAFStack-prod` em `CREATE_COMPLETE` ou `UPDATE_COMPLETE`.
- Nenhum erro de `LOG_DESTINATION` nos eventos do CloudFormation.

### 5.3. Console WAF

Verificar em **AWS WAF → Web ACLs:**
- `AlquimistaAI-WAF-Dev`
- `AlquimistaAI-WAF-Prod`

Na aba **Logging and metrics:**
- Logging enabled.
- Destinos de log:
  - `aws-waf-logs-alquimista-dev`
  - `aws-waf-logs-alquimista-prod`

### 5.4. CloudWatch Logs

Ir em **CloudWatch → Log groups:**

Confirmar existência de:
- `aws-waf-logs-alquimista-dev`
- `aws-waf-logs-alquimista-prod`

Gerar tráfego nas APIs (dev/prod) e verificar:
- Criação de novos log streams.
- Eventos de log do WAF sendo escritos.

---

## 6. Operação & Troubleshooting Rápido

### 6.1. Sintoma: Erro em LOG_DESTINATION

Se voltar a aparecer erro do tipo:

```
LOG_DESTINATION ... arn:aws:logs:...:log-group:/alguma-coisa...
```

**Verificar:**
- Se o `logGroupName` ainda começa com `aws-waf-logs-`.
- Se não há nenhum `:*` sendo concatenado manualmente no ARN.
- Se não há overrides antigos de `logDestinationConfigs` em `addOverride`/`addPropertyOverride`.

### 6.2. Alterar Nome ou Retenção

Se for necessário mudar:
- Nome dos log groups,
- Período de retenção,

então:

1. Ajustar em `lib/waf-stack.ts` nos `LogGroup`.
2. Rodar:
   ```bash
   npm run build
   npx cdk deploy WAFStack-dev --context env=dev --require-approval never
   ```
3. Validar novamente no console WAF e CloudWatch.

---

## 7. Padrão Oficial AlquimistaAI

A partir desta correção, o padrão oficial para WAF + logging na AlquimistaAI é:

### Nome de Log Group
- Sempre começando com `aws-waf-logs-<sistema>-<env>`.

### ARN de destino do WAF
- Sempre gerado via `Stack.of(this).formatArn` com `ArnFormat.COLON_RESOURCE_NAME`.
- Nunca adicionar `:*` manualmente.

### Logging Ativo em Dev e Prod
- Ambas Web ACLs (Dev e Prod) devem ter logging habilitado com destinos válidos.

### RedactedFields
- Cabeçalhos sensíveis `authorization` e `cookie` sempre ocultos no log.

---

Este documento serve como referência para qualquer futura stack de WAF no ecossistema AlquimistaAI.
