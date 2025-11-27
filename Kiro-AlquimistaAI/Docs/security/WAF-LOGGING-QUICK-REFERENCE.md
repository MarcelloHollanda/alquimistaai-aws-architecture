# WAF Logging - Referência Rápida

## Padrão de Nomenclatura

```
aws-waf-logs-<sistema>-<ambiente>
```

**Exemplos:**
- `aws-waf-logs-alquimista-dev`
- `aws-waf-logs-alquimista-prod`

⚠️ **IMPORTANTE:** O prefixo `aws-waf-logs-` é **obrigatório** pela AWS.

---

## Código CDK Padrão

### 1. Criar Log Group

```typescript
const logGroup = new logs.LogGroup(this, 'WAFLogGroup', {
  logGroupName: 'aws-waf-logs-alquimista-dev',
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

### 2. Construir ARN Correto

```typescript
const wafLogGroupArn = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: logGroup.logGroupName,
});
```

⚠️ **NUNCA** adicione `:*` manualmente ao ARN!

### 3. Configurar Logging

```typescript
const logging = new wafv2.CfnLoggingConfiguration(this, 'WAFLogging', {
  resourceArn: webAcl.attrArn,
  logDestinationConfigs: [wafLogGroupArn],
});

// Ocultar campos sensíveis
logging.addPropertyOverride('RedactedFields', [
  { SingleHeader: { Name: 'authorization' } },
  { SingleHeader: { Name: 'cookie' } },
]);
```

---

## Comandos de Deploy

```bash
# Build
npm run build

# Synth
npx cdk synth WAFStack-dev --context env=dev

# Deploy Dev
npx cdk deploy WAFStack-dev --context env=dev --require-approval never

# Deploy Prod
npx cdk deploy WAFStack-prod --context env=prod --require-approval never
```

---

## Validação Rápida

### Console AWS WAF
1. Acesse **AWS WAF → Web ACLs**
2. Selecione a Web ACL
3. Aba **Logging and metrics**
4. Verifique: **Logging enabled** ✅

### Console CloudWatch
1. Acesse **CloudWatch → Log groups**
2. Procure por `aws-waf-logs-alquimista-*`
3. Verifique se há log streams sendo criados

---

## Troubleshooting

### Erro: "The ARN isn't valid"

**Causa:** ARN com formato incorreto (provavelmente com `:*` no final)

**Solução:**
```typescript
// ❌ ERRADO
const arn = logGroup.logGroupArn; // Pode ter :*

// ✅ CORRETO
const arn = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: logGroup.logGroupName,
});
```

### Erro: "Invalid log group name"

**Causa:** Nome do log group não começa com `aws-waf-logs-`

**Solução:**
```typescript
// ❌ ERRADO
logGroupName: '/aws/waf/alquimista-dev'

// ✅ CORRETO
logGroupName: 'aws-waf-logs-alquimista-dev'
```

---

## Retenção de Logs

| Ambiente | Retenção | Removal Policy |
|----------|----------|----------------|
| Dev      | 30 dias  | DESTROY        |
| Prod     | 90 dias  | RETAIN         |

---

## Campos Redacted (Ocultos)

Por padrão, sempre ocultar:
- `authorization` - Tokens de autenticação
- `cookie` - Cookies de sessão

---

## Referências

- [Documentação Completa](./WAF-LOGGING-ALQUIMISTAAI.md)
- [AWS WAF Logging Documentation](https://docs.aws.amazon.com/waf/latest/developerguide/logging.html)
- [Spec de Implementação](../../.kiro/specs/waf-stack-description-logging-fix/)
