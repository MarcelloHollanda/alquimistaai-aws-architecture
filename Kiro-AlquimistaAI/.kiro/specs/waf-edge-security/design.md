# Design - WAF + Edge Security

## Visão Geral

Este documento detalha a arquitetura técnica da solução de WAF + Edge Security para as APIs do sistema AlquimistaAI. A solução utiliza AWS WAF v2 para proteger as HTTP APIs do Fibonacci e Nigredo contra ataques comuns, abuso de taxa e outras ameaças.

## Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   AWS WAF v2          │
         │  ┌─────────────────┐  │
         │  │  Web ACL Dev    │  │ ◄── Fibonacci API Dev
         │  │  Web ACL Prod   │  │ ◄── Fibonacci API Prod
         │  └─────────────────┘  │ ◄── Nigredo API Dev
         │                       │ ◄── Nigredo API Prod
         │  • Managed Rules      │
         │  • Rate Limiting      │
         │  • Custom Rules       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  API Gateway          │
         │  (HTTP APIs)          │
         │                       │
         │  • Fibonacci          │
         │  • Nigredo            │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Lambda Functions     │
         │  (Node.js 20)         │
         └───────────────────────┘

         ┌───────────────────────┐
         │  CloudWatch Logs      │
         │                       │
         │  • /aws/waf/alq-dev   │
         │  • /aws/waf/alq-prod  │
         └───────────────────────┘

         ┌───────────────────────┐
         │  Guardrails           │
         │                       │
         │  • GuardDuty          │
         │  • CloudTrail         │
         │  • SNS Alerts         │
         └───────────────────────┘
```

## Componentes e Interfaces

### 1. Web ACLs (Access Control Lists)

#### Web ACL Dev

**Propósito:** Proteger APIs de desenvolvimento com configuração permissiva para não impactar desenvolvimento.

**Configuração:**
```typescript
{
  name: 'AlquimistaAI-WAF-Dev',
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  rules: [
    // Managed Rules (modo count inicialmente)
    // Rate limiting (2000 req/5min)
    // Custom rules (se necessário)
  ],
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'AlquimistaAI-WAF-Dev'
  }
}
```

**Características:**
- Modo inicial: `count` (observação sem bloqueio)
- Rate limit: 2000 requisições / 5 minutos por IP
- Logs detalhados para análise
- Permite ajustes rápidos sem impacto

#### Web ACL Prod

**Propósito:** Proteger APIs de produção com configuração restritiva e bloqueios ativos.

**Configuração:**
```typescript
{
  name: 'AlquimistaAI-WAF-Prod',
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  rules: [
    // Managed Rules (modo block)
    // Rate limiting (1000 req/5min)
    // Custom rules
  ],
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'AlquimistaAI-WAF-Prod'
  }
}
```

**Características:**
- Modo: `block` (bloqueio ativo)
- Rate limit: 1000 requisições / 5 minutos por IP
- Bloqueio automático por 10 minutos após violação
- Alertas para bloqueios críticos

### 2. Managed Rule Groups

#### AWSManagedRulesCommonRuleSet

**Propósito:** Proteção contra ameaças web comuns (OWASP Top 10).

**Regras Incluídas:**
- Cross-Site Scripting (XSS)
- Local File Inclusion (LFI)
- Remote File Inclusion (RFI)
- Path Traversal
- Command Injection
- Tamanho de corpo excessivo

**Configuração:**
```typescript
{
  name: 'AWSManagedRulesCommonRuleSet',
  priority: 1,
  overrideAction: { none: {} }, // Dev: count, Prod: none
  vendorName: 'AWS',
  managedRuleGroupStatement: {
    vendorName: 'AWS',
    name: 'AWSManagedRulesCommonRuleSet'
  }
}
```

#### AWSManagedRulesKnownBadInputsRuleSet

**Propósito:** Bloquear padrões de entrada conhecidamente maliciosos.

**Regras Incluídas:**
- Payloads de exploits conhecidos
- Assinaturas de malware
- Padrões de scanning automatizado

**Configuração:**
```typescript
{
  name: 'AWSManagedRulesKnownBadInputsRuleSet',
  priority: 2,
  overrideAction: { none: {} },
  vendorName: 'AWS',
  managedRuleGroupStatement: {
    vendorName: 'AWS',
    name: 'AWSManagedRulesKnownBadInputsRuleSet'
  }
}
```

#### AWSManagedRulesSQLiRuleSet

**Propósito:** Proteção específica contra SQL Injection.

**Regras Incluídas:**
- Detecção de comandos SQL em parâmetros
- Proteção contra union-based SQLi
- Proteção contra blind SQLi
- Proteção contra time-based SQLi

**Configuração:**
```typescript
{
  name: 'AWSManagedRulesSQLiRuleSet',
  priority: 3,
  overrideAction: { none: {} },
  vendorName: 'AWS',
  managedRuleGroupStatement: {
    vendorName: 'AWS',
    name: 'AWSManagedRulesSQLiRuleSet'
  }
}
```

### 3. Rate-Based Rules

#### Rate Limit Dev

**Propósito:** Limitar abuso em desenvolvimento sem impactar testes.

**Configuração:**
```typescript
{
  name: 'RateLimitDev',
  priority: 10,
  action: { count: {} }, // Apenas contar, não bloquear
  statement: {
    rateBasedStatement: {
      limit: 2000,
      aggregateKeyType: 'IP',
      evaluationWindowSec: 300 // 5 minutos
    }
  },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'RateLimitDev'
  }
}
```

#### Rate Limit Prod

**Propósito:** Bloquear abuso em produção.

**Configuração:**
```typescript
{
  name: 'RateLimitProd',
  priority: 10,
  action: { block: {} },
  statement: {
    rateBasedStatement: {
      limit: 1000,
      aggregateKeyType: 'IP',
      evaluationWindowSec: 300, // 5 minutos
      scopeDownStatement: {
        // Opcional: excluir IPs conhecidos
        notStatement: {
          statement: {
            ipSetReferenceStatement: {
              arn: 'arn:aws:wafv2:us-east-1:ACCOUNT:regional/ipset/AllowedIPs/ID'
            }
          }
        }
      }
    }
  },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'RateLimitProd'
  }
}
```

### 4. IP Sets (Opcional)

#### AllowedIPs

**Propósito:** Lista de IPs que devem ser sempre permitidos (escritórios, CI/CD, etc.).

**Uso:**
- Exceções para rate limiting
- Bypass de regras específicas quando necessário
- IPs de monitoramento/health checks

#### BlockedIPs

**Propósito:** Lista de IPs conhecidamente maliciosos para bloqueio imediato.

**Uso:**
- IPs identificados em ataques anteriores
- IPs reportados por threat intelligence
- Bloqueio manual durante incidentes

### 5. Associações WAF

#### Fibonacci API Dev
```typescript
new CfnWebACLAssociation(this, 'FibonacciDevWAFAssociation', {
  resourceArn: fibonacciApiDev.apiArn,
  webAclArn: webAclDev.attrArn
});
```

#### Fibonacci API Prod
```typescript
new CfnWebACLAssociation(this, 'FibonacciProdWAFAssociation', {
  resourceArn: fibonacciApiProd.apiArn,
  webAclArn: webAclProd.attrArn
});
```

#### Nigredo API Dev
```typescript
new CfnWebACLAssociation(this, 'NigredoDevWAFAssociation', {
  resourceArn: nigredoApiDev.apiArn,
  webAclArn: webAclDev.attrArn
});
```

#### Nigredo API Prod
```typescript
new CfnWebACLAssociation(this, 'NigredoProdWAFAssociation', {
  resourceArn: nigredoApiProd.apiArn,
  webAclArn: webAclProd.attrArn
});
```

## Logging e Observabilidade

### CloudWatch Logs

#### Log Group Dev
```typescript
{
  logGroupName: '/aws/waf/alquimista-dev',
  retentionInDays: 30,
  encryption: {
    kmsKeyId: 'alias/aws/logs'
  }
}
```

#### Log Group Prod
```typescript
{
  logGroupName: '/aws/waf/alquimista-prod',
  retentionInDays: 90,
  encryption: {
    kmsKeyId: 'alias/aws/logs'
  }
}
```

### Estrutura de Logs

Cada log entry contém:
```json
{
  "timestamp": 1234567890,
  "formatVersion": 1,
  "webaclId": "arn:aws:wafv2:...",
  "terminatingRuleId": "RateLimitProd",
  "terminatingRuleType": "RATE_BASED",
  "action": "BLOCK",
  "httpSourceName": "CF",
  "httpSourceId": "...",
  "ruleGroupList": [],
  "rateBasedRuleList": [],
  "nonTerminatingMatchingRules": [],
  "httpRequest": {
    "clientIp": "1.2.3.4",
    "country": "BR",
    "headers": [...],
    "uri": "/api/fibonacci/leads",
    "args": "",
    "httpVersion": "HTTP/2.0",
    "httpMethod": "POST",
    "requestId": "..."
  }
}
```

### CloudWatch Insights Queries

#### Query 1: Top IPs Bloqueados
```sql
fields @timestamp, httpRequest.clientIp, terminatingRuleId, action
| filter action = "BLOCK"
| stats count() as requestCount by httpRequest.clientIp
| sort requestCount desc
| limit 20
```

#### Query 2: Regras Mais Acionadas
```sql
fields @timestamp, terminatingRuleId, action
| stats count() as ruleCount by terminatingRuleId, action
| sort ruleCount desc
```

#### Query 3: Análise de Rate Limiting
```sql
fields @timestamp, httpRequest.clientIp, httpRequest.uri
| filter terminatingRuleType = "RATE_BASED"
| stats count() as violations by httpRequest.clientIp, httpRequest.uri
| sort violations desc
```

#### Query 4: Análise Geográfica
```sql
fields @timestamp, httpRequest.country, action
| stats count() as requests by httpRequest.country, action
| sort requests desc
```

### Métricas CloudWatch

**Métricas Automáticas:**
- `AllowedRequests` - Requisições permitidas
- `BlockedRequests` - Requisições bloqueadas
- `CountedRequests` - Requisições contadas (modo count)
- `PassedRequests` - Requisições que passaram por todas as regras

**Métricas por Regra:**
- `AWSManagedRulesCommonRuleSet` - Violações do conjunto comum
- `RateLimitDev/Prod` - Violações de rate limit
- Cada managed rule group tem suas próprias métricas

### Alarmes CloudWatch

#### Alarme: Alto Volume de Bloqueios
```typescript
new cloudwatch.Alarm(this, 'HighBlockRate', {
  metric: webAclProd.metricBlockedRequests(),
  threshold: 100,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
});
```

#### Alarme: Rate Limiting Acionado
```typescript
new cloudwatch.Alarm(this, 'RateLimitTriggered', {
  metric: rateLimitRule.metricBlockedRequests(),
  threshold: 10,
  evaluationPeriods: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
});
```

## Integração com Guardrails Existentes

### GuardDuty

**Correlação:**
- Findings do GuardDuty sobre IPs maliciosos podem ser cruzados com logs WAF
- IPs identificados pelo GuardDuty podem ser adicionados ao BlockedIPs automaticamente

**Procedimento:**
1. GuardDuty detecta atividade suspeita
2. Lambda processa finding
3. Adiciona IP ao IP Set de bloqueio
4. WAF bloqueia automaticamente

### CloudTrail

**Correlação:**
- Eventos de modificação do WAF são registrados no CloudTrail
- Mudanças em regras, IP Sets, Web ACLs são auditadas
- Permite rastreamento de quem fez alterações

**Eventos Relevantes:**
- `CreateWebACL`
- `UpdateWebACL`
- `DeleteWebACL`
- `AssociateWebACL`
- `DisassociateWebACL`

### SNS (Alertas de Segurança)

**Integração:**
- Alarmes críticos do WAF publicam no tópico SNS existente
- Equipe de segurança recebe notificações em tempo real
- Integração com ferramentas de incident response

**Cenários de Alerta:**
- Volume anormal de bloqueios (possível ataque)
- IP violando múltiplas regras simultaneamente
- Padrões de ataque coordenado detectados

## Estrutura CDK

### Opção 1: Stack Dedicada (Recomendada)

```typescript
// lib/waf-stack.ts
export class WAFStack extends cdk.Stack {
  public readonly webAclDev: wafv2.CfnWebACL;
  public readonly webAclProd: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const env = this.node.tryGetContext('env') || 'dev';

    // Criar Web ACLs
    this.webAclDev = this.createWebACL('dev');
    this.webAclProd = this.createWebACL('prod');

    // Criar IP Sets
    const allowedIPs = this.createIPSet('allowed');
    const blockedIPs = this.createIPSet('blocked');

    // Configurar logging
    this.setupLogging('dev', this.webAclDev);
    this.setupLogging('prod', this.webAclProd);

    // Tags
    cdk.Tags.of(this).add('Project', 'AlquimistaAI');
    cdk.Tags.of(this).add('Component', 'WAF');
    cdk.Tags.of(this).add('Environment', env);
  }

  private createWebACL(env: 'dev' | 'prod'): wafv2.CfnWebACL {
    // Implementação
  }

  private createIPSet(type: 'allowed' | 'blocked'): wafv2.CfnIPSet {
    // Implementação
  }

  private setupLogging(env: string, webAcl: wafv2.CfnWebACL): void {
    // Implementação
  }
}
```

### Opção 2: Extensão da SecurityStack

```typescript
// lib/security-stack.ts (estender existente)
export class SecurityStack extends cdk.Stack {
  // ... código existente ...

  private setupWAF(): void {
    // Adicionar Web ACLs à stack de segurança existente
  }
}
```

**Decisão:** Usar **Opção 1** (Stack Dedicada) para:
- Melhor separação de responsabilidades
- Facilitar manutenção independente
- Permitir deploy isolado do WAF
- Evitar impacto em guardrails existentes

### Integração com Stacks Existentes

```typescript
// bin/app.ts
const wafStack = new WAFStack(app, 'AlquimistaAI-WAF', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
});

const fibonacciStack = new FibonacciStack(app, 'AlquimistaAI-Fibonacci', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  webAclDev: wafStack.webAclDev,
  webAclProd: wafStack.webAclProd
});

const nigredoStack = new NigredoStack(app, 'AlquimistaAI-Nigredo', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  webAclDev: wafStack.webAclDev,
  webAclProd: wafStack.webAclProd
});

// Dependências
fibonacciStack.addDependency(wafStack);
nigredoStack.addDependency(wafStack);
```

## Estratégia de Rollout

### Fase 1: Observação (Semana 1-2)

**Objetivo:** Coletar dados sem impactar tráfego.

**Ações:**
1. Deploy Web ACLs em modo `count` (dev e prod)
2. Associar às APIs
3. Monitorar logs por 1-2 semanas
4. Identificar false positives
5. Ajustar regras conforme necessário

**Critérios de Sucesso:**
- Logs sendo gerados corretamente
- Queries CloudWatch Insights funcionando
- Nenhum false positive crítico identificado

### Fase 2: Ativação Dev (Semana 3)

**Objetivo:** Ativar bloqueios em dev.

**Ações:**
1. Mudar Web ACL Dev para modo `block`
2. Manter rate limit permissivo (2000 req/5min)
3. Monitorar impacto no desenvolvimento
4. Ajustar allowlist se necessário

**Critérios de Sucesso:**
- Desenvolvimento não impactado
- Bloqueios legítimos funcionando
- Equipe confortável com operação

### Fase 3: Ativação Prod (Semana 4)

**Objetivo:** Ativar bloqueios em produção.

**Ações:**
1. Mudar Web ACL Prod para modo `block`
2. Ativar rate limit restritivo (1000 req/5min)
3. Monitorar métricas de negócio
4. Configurar alertas SNS

**Critérios de Sucesso:**
- Nenhum impacto em usuários legítimos
- Bloqueios de ataques funcionando
- Alertas chegando corretamente

### Fase 4: Otimização (Contínua)

**Objetivo:** Refinar regras baseado em dados reais.

**Ações:**
1. Análise semanal de logs
2. Ajuste de thresholds de rate limit
3. Adição de regras customizadas se necessário
4. Atualização de IP Sets

## Custos Estimados

### Componentes de Custo

**Web ACL:** $5.00/mês por Web ACL
- Dev: $5.00
- Prod: $5.00

**Regras:** $1.00/mês por regra
- Managed Rules (3): $3.00
- Rate-based Rules (2): $2.00
- Total: $5.00 por ambiente

**Requisições:** $0.60 por 1 milhão de requisições
- Estimativa dev: 10M req/mês = $6.00
- Estimativa prod: 50M req/mês = $30.00

**Logs CloudWatch:**
- Dev: ~$5.00/mês (30 dias retenção)
- Prod: ~$15.00/mês (90 dias retenção)

### Total Estimado

- **Dev:** $21.00/mês
- **Prod:** $55.00/mês
- **Total:** ~$76.00/mês

**Nota:** Custos podem variar baseado em volume real de tráfego.

## Decisões Técnicas

### 1. WAF Regional vs CloudFront

**Decisão:** WAF Regional (associado a API Gateway)

**Justificativa:**
- APIs já estão em API Gateway (não usam CloudFront ainda)
- CloudFront será adicionado no passo 3 (frontend)
- WAF Regional é suficiente para proteção de APIs
- Menor latência (sem hop adicional)

### 2. Stack Dedicada vs Extensão

**Decisão:** Stack dedicada (WAFStack)

**Justificativa:**
- Separação de responsabilidades
- Deploy independente
- Facilita manutenção
- Não impacta guardrails existentes

### 3. Modo Count vs Block Inicial

**Decisão:** Iniciar em modo count, migrar para block gradualmente

**Justificativa:**
- Evitar false positives em produção
- Coletar dados reais antes de bloquear
- Permitir ajustes finos
- Reduzir risco de impacto negativo

### 4. Rate Limits

**Decisão:** 2000 req/5min (dev), 1000 req/5min (prod)

**Justificativa:**
- Dev: permissivo para não impactar testes
- Prod: restritivo mas razoável para uso legítimo
- Valores podem ser ajustados baseado em dados reais
- Proteção contra DDoS básico

### 5. Managed Rules

**Decisão:** Usar 3 conjuntos principais (Common, KnownBadInputs, SQLi)

**Justificativa:**
- Cobertura adequada para ameaças comuns
- Custo controlado ($3/mês)
- Mantido pela AWS (sempre atualizado)
- Pode adicionar mais conforme necessidade

## Troubleshooting

### Cenário 1: False Positive

**Sintoma:** Requisição legítima sendo bloqueada

**Diagnóstico:**
1. Verificar logs WAF para identificar regra
2. Analisar detalhes da requisição
3. Confirmar se é realmente legítimo

**Solução:**
- Adicionar IP ao AllowedIPs (temporário)
- Ajustar regra específica (permanente)
- Criar exceção na regra (scope down)

### Cenário 2: Ataque em Andamento

**Sintoma:** Alto volume de bloqueios, alarmes disparando

**Diagnóstico:**
1. Verificar métricas CloudWatch
2. Analisar IPs de origem
3. Identificar padrão de ataque

**Solução:**
- Adicionar IPs ao BlockedIPs
- Reduzir threshold de rate limit temporariamente
- Notificar equipe de segurança
- Documentar incidente

### Cenário 3: Performance Degradada

**Sintoma:** Latência aumentada nas APIs

**Diagnóstico:**
1. Verificar métricas de latência
2. Comparar com baseline
3. Verificar número de regras ativas

**Solução:**
- Otimizar ordem de regras (mais específicas primeiro)
- Remover regras não utilizadas
- Considerar cache de decisões

## Próximos Passos

Após aprovação deste design:
1. Criar documento de tasks detalhado
2. Implementar WAFStack via CDK
3. Configurar logging e alarmes
4. Integrar com CI/CD
5. Criar documentação operacional
6. Executar rollout em fases

## Referências

- [AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS Managed Rules for WAF](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Pricing](https://aws.amazon.com/waf/pricing/)
- [Best Practices for WAF](https://docs.aws.amazon.com/waf/latest/developerguide/waf-best-practices.html)
