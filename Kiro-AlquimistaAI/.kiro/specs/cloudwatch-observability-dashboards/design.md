# Design Document

## Overview

Este documento descreve o design técnico para implementação de dashboards de observabilidade no CloudWatch para os ambientes dev e prod do sistema AlquimistaAI. Os dashboards fornecerão visibilidade consolidada sobre o estado dos serviços críticos (Fibonacci, Nigredo, Aurora, API Gateway) permitindo resposta rápida a incidentes.

## Architecture

### Stack CDK

Será criada uma nova stack CDK chamada `ObservabilityDashboardStack` que:
- Receberá referências aos recursos principais via props
- Criará dois dashboards CloudWatch (dev e prod)
- Será instanciada no `bin/app.ts` após as stacks principais

### Padrão de Implementação

Seguiremos o padrão já estabelecido nos dashboards existentes:
- Uso de `cloudwatch.Dashboard` do CDK
- Widgets organizados em rows (linhas)
- Métricas agrupadas por serviço
- Nomenclatura clara com prefixo de ambiente

## Components and Interfaces

### 1. ObservabilityDashboardStack

**Localização**: `lib/observability-dashboard-stack.ts`

**Props Interface**:
```typescript
export interface ObservabilityDashboardStackProps extends cdk.StackProps {
  envName: string;
  
  // Recursos do Fibonacci
  fibonacciApiId: string;
  fibonacciApiHandler: lambda.IFunction;
  fibonacciAuroraClusterId: string;
  
  // Recursos do Nigredo
  nigredoApiId: string;
  nigredoLambdas: {
    recebimento: lambda.IFunction;
    estrategia: lambda.IFunction;
    disparo: lambda.IFunction;
    atendimento: lambda.IFunction;
    sentimento: lambda.IFunction;
    agendamento: lambda.IFunction;
  };
}
```

**Exports**:
```typescript
export class ObservabilityDashboardStack extends cdk.Stack {
  public readonly devDashboard: cloudwatch.Dashboard;
  public readonly prodDashboard: cloudwatch.Dashboard;
  
  constructor(scope: Construct, id: string, props: ObservabilityDashboardStackProps) {
    // Implementação
  }
}
```

### 2. Dashboard Structure

Cada dashboard (dev/prod) terá a seguinte estrutura de widgets:

#### Seção 1: API Gateway - Fibonacci
- **Widget 1.1**: Latência (p50, p90, p99) - 12 cols
- **Widget 1.2**: Erros (4xx, 5xx) - 12 cols
- **Widget 1.3**: Throughput (requests/min) - 24 cols

#### Seção 2: Lambda - Fibonacci
- **Widget 2.1**: Invocações - 8 cols
- **Widget 2.2**: Erros - 8 cols
- **Widget 2.3**: Duração (avg, p95) - 8 cols

#### Seção 3: API Gateway - Nigredo
- **Widget 3.1**: Latência (p50, p90, p99) - 12 cols
- **Widget 3.2**: Erros (4xx, 5xx) - 12 cols
- **Widget 3.3**: Throughput (requests/min) - 24 cols

#### Seção 4: Lambdas - Nigredo (Principais)
- **Widget 4.1**: Invocações por Lambda - 24 cols
- **Widget 4.2**: Erros por Lambda - 24 cols
- **Widget 4.3**: Duração (avg, p95) por Lambda - 24 cols

#### Seção 5: Aurora PostgreSQL
- **Widget 5.1**: CPU Utilization - 8 cols
- **Widget 5.2**: Database Connections - 8 cols
- **Widget 5.3**: Free Storage Space - 8 cols

## Data Models

### Métricas CloudWatch

#### API Gateway Metrics
```typescript
// Namespace: AWS/ApiGateway
// Dimensions: { ApiId: string }

- Count: Número total de requisições
- 4XXError: Erros de cliente
- 5XXError: Erros de servidor
- Latency: Latência da requisição (ms)
  - Statistic: Average, p50, p90, p99
```

#### Lambda Metrics
```typescript
// Namespace: AWS/Lambda
// Dimensions: { FunctionName: string }

- Invocations: Número de invocações
- Errors: Número de erros
- Duration: Duração da execução (ms)
  - Statistic: Average, p95, p99
- Throttles: Número de throttles
- ConcurrentExecutions: Execuções concorrentes
```

#### Aurora Metrics
```typescript
// Namespace: AWS/RDS
// Dimensions: { DBClusterIdentifier: string }

- CPUUtilization: Utilização de CPU (%)
- DatabaseConnections: Número de conexões ativas
- FreeStorageSpace: Espaço livre em disco (bytes)
- ReadLatency: Latência de leitura (ms)
- WriteLatency: Latência de escrita (ms)
```

### Dashboard Configuration

```typescript
interface DashboardConfig {
  name: string;              // Ex: "AlquimistaAI-Dev-Overview"
  environment: 'dev' | 'prod';
  periodOverride: cloudwatch.PeriodOverride.AUTO;
  widgets: Widget[];
}

interface Widget {
  type: 'graph' | 'number' | 'text';
  title: string;
  metrics: Metric[];
  width: number;             // 1-24
  height: number;            // Recomendado: 6
  yAxis?: {
    min?: number;
    max?: number;
    label?: string;
  };
}
```

## Error Handling

### Validação de Props

```typescript
// Validar que todos os recursos necessários foram fornecidos
if (!props.fibonacciApiId) {
  throw new Error('fibonacciApiId is required');
}

if (!props.fibonacciAuroraClusterId) {
  throw new Error('fibonacciAuroraClusterId is required');
}

// Validar ambiente
if (!['dev', 'prod'].includes(props.envName)) {
  throw new Error(`Invalid environment: ${props.envName}`);
}
```

### Tratamento de Métricas Ausentes

```typescript
// Usar treatMissingData para evitar alarmes falsos
const metric = new cloudwatch.Metric({
  namespace: 'AWS/ApiGateway',
  metricName: 'Latency',
  dimensionsMap: { ApiId: props.fibonacciApiId },
  statistic: 'p99',
  period: cdk.Duration.minutes(5)
});

// Métricas ausentes não devem quebrar o dashboard
// CloudWatch automaticamente mostra "No data" no widget
```

## Testing Strategy

### Validação de Síntese CDK

```bash
# Compilar TypeScript
npm run build

# Sintetizar template CloudFormation
cdk synth ObservabilityDashboardStack-dev --context env=dev

# Verificar que não há erros de síntese
echo $?  # Deve retornar 0
```

### Validação Pós-Deploy

```bash
# Deploy da stack
cdk deploy ObservabilityDashboardStack-dev --context env=dev

# Verificar que o dashboard foi criado
aws cloudwatch list-dashboards \
  --query "DashboardEntries[?DashboardName=='AlquimistaAI-Dev-Overview']"

# Obter definição do dashboard
aws cloudwatch get-dashboard \
  --dashboard-name AlquimistaAI-Dev-Overview
```

### Validação de Métricas

```typescript
// Após deploy, aguardar alguns minutos e verificar métricas
// Usar AWS Console CloudWatch > Dashboards
// Verificar que:
// 1. Dashboard aparece na lista
// 2. Widgets mostram dados (não vazios)
// 3. Títulos estão corretos com prefixo [DEV] ou [PROD]
// 4. Métricas estão populadas
```

### Testes de Integração

```typescript
// Criar testes que validam:
// 1. Stack pode ser instanciada
// 2. Props são validadas corretamente
// 3. Dashboards são criados com nomes corretos
// 4. Widgets têm configuração correta

import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ObservabilityDashboardStack } from '../lib/observability-dashboard-stack';

test('Dashboard Stack creates dashboards', () => {
  const app = new App();
  const stack = new ObservabilityDashboardStack(app, 'TestStack', {
    envName: 'dev',
    fibonacciApiId: 'test-api-id',
    // ... outras props
  });
  
  const template = Template.fromStack(stack);
  
  // Verificar que dashboard foi criado
  template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
    DashboardName: 'AlquimistaAI-Dev-Overview'
  });
});
```

## Implementation Details

### Estrutura de Código

```
lib/
├── observability-dashboard-stack.ts    # Stack principal
└── dashboards/
    └── overview-dashboard.ts           # Classe helper (opcional)

bin/
└── app.ts                              # Instanciação da stack

docs/
├── OBSERVABILITY-GUARDRAILS-AWS.md     # Documentação atualizada
└── INDEX-OPERATIONS-AWS.md             # Índice atualizado
```

### Padrão de Nomenclatura

```typescript
// Dashboards
const dashboardName = `AlquimistaAI-${envName}-Overview`;

// Widgets
const widgetTitle = `[${envName.toUpperCase()}] Fibonacci - API Gateway Latency`;

// Métricas
const metricLabel = `${envName} - p99`;

// Tags
cdk.Tags.of(this).add('Environment', envName);
cdk.Tags.of(this).add('Project', 'AlquimistaAI');
cdk.Tags.of(this).add('Component', 'Observability-Dashboard');
```

### Integração com bin/app.ts

```typescript
// bin/app.ts

// Após criação das stacks principais
const fibonacciStack = new FibonacciStack(app, `FibonacciStack-${envName}`, {
  // props
});

const nigredoStack = new NigredoStack(app, `NigredoStack-${envName}`, {
  // props
});

// Criar stack de dashboards
const dashboardStack = new ObservabilityDashboardStack(
  app,
  `ObservabilityDashboardStack-${envName}`,
  {
    env,
    envName,
    // Passar referências dos recursos
    fibonacciApiId: fibonacciStack.httpApi.apiId,
    fibonacciApiHandler: fibonacciStack.apiHandler,
    fibonacciAuroraClusterId: fibonacciStack.dbCluster.clusterIdentifier,
    nigredoApiId: nigredoStack.httpApi.apiId,
    nigredoLambdas: {
      recebimento: nigredoStack.recebimentoLambda,
      estrategia: nigredoStack.estrategiaLambda,
      disparo: nigredoStack.disparoLambda,
      atendimento: nigredoStack.atendimentoLambda,
      sentimento: nigredoStack.sentimentoLambda,
      agendamento: nigredoStack.agendamentoLambda,
    }
  }
);

// Adicionar dependências
dashboardStack.addDependency(fibonacciStack);
dashboardStack.addDependency(nigredoStack);
```

### Exemplo de Widget

```typescript
// Widget de latência do API Gateway
this.dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: `[${props.envName.toUpperCase()}] Fibonacci - API Gateway Latency`,
    left: [
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: { ApiId: props.fibonacciApiId },
        statistic: 'p50',
        period: cdk.Duration.minutes(5),
        label: 'p50',
        color: cloudwatch.Color.GREEN
      }),
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: { ApiId: props.fibonacciApiId },
        statistic: 'p90',
        period: cdk.Duration.minutes(5),
        label: 'p90',
        color: cloudwatch.Color.ORANGE
      }),
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: { ApiId: props.fibonacciApiId },
        statistic: 'p99',
        period: cdk.Duration.minutes(5),
        label: 'p99',
        color: cloudwatch.Color.RED
      })
    ],
    width: 12,
    height: 6,
    leftYAxis: {
      min: 0,
      label: 'Latency (ms)'
    }
  })
);
```

## Design Decisions

### 1. Stack Separada vs Integrada

**Decisão**: Criar stack separada `ObservabilityDashboardStack`

**Rationale**:
- Separação de responsabilidades (infraestrutura vs observabilidade)
- Facilita deploy independente dos dashboards
- Não impacta stacks existentes
- Permite reutilização em outros ambientes

### 2. Um Dashboard por Ambiente vs Dashboard Único

**Decisão**: Um dashboard por ambiente (dev/prod)

**Rationale**:
- Evita confusão durante investigação de incidentes
- Permite configurações específicas por ambiente
- Facilita controle de acesso (dev vs prod)
- Segue padrão já estabelecido no projeto

### 3. Nível de Detalhe dos Widgets

**Decisão**: Foco em métricas críticas (latência, erros, throughput)

**Rationale**:
- Dashboards devem ser "de guerra" - informação rápida
- Detalhes adicionais podem ser obtidos via CloudWatch Insights
- Evita sobrecarga visual
- Alinhado com requisitos (p50/p90/p99, erros, throughput)

### 4. Período de Agregação

**Decisão**: 5 minutos para a maioria das métricas

**Rationale**:
- Balanceia granularidade vs ruído
- Permite detecção rápida de problemas
- Reduz custos de API do CloudWatch
- Alinhado com alarmes existentes

### 5. Cores e Visualização

**Decisão**: Usar cores semânticas (verde/amarelo/vermelho)

**Rationale**:
- p50 = Verde (normal)
- p90 = Laranja (atenção)
- p99 = Vermelho (crítico)
- Facilita interpretação visual rápida
- Padrão da indústria

## Documentation Updates

### 1. docs/OBSERVABILITY-GUARDRAILS-AWS.md

Adicionar nova seção:

```markdown
### Dashboards de Observabilidade – Visão Geral

#### Dashboards Disponíveis

**AlquimistaAI-Dev-Overview**
- Ambiente: Desenvolvimento
- Propósito: Monitoramento contínuo durante desenvolvimento
- Acesso: CloudWatch Console > Dashboards

**AlquimistaAI-Prod-Overview**
- Ambiente: Produção
- Propósito: Monitoramento de produção e resposta a incidentes
- Acesso: CloudWatch Console > Dashboards

#### Métricas Principais

**API Gateway (Fibonacci e Nigredo)**
- Latência: p50, p90, p99 (ms)
- Erros: 4xx (cliente), 5xx (servidor)
- Throughput: Requisições por minuto

**Lambda Functions**
- Invocações: Total de execuções
- Erros: Falhas de execução
- Duração: Tempo de processamento (avg, p95)

**Aurora PostgreSQL**
- CPU: Utilização de processador (%)
- Conexões: Número de conexões ativas
- Storage: Espaço livre em disco

#### Como Acessar

1. Acesse o AWS Console
2. Navegue para CloudWatch > Dashboards
3. Selecione o dashboard desejado:
   - `AlquimistaAI-Dev-Overview`
   - `AlquimistaAI-Prod-Overview`

Ou via AWS CLI:
```bash
aws cloudwatch get-dashboard \
  --dashboard-name AlquimistaAI-Prod-Overview
```

#### O Que Olhar Primeiro em Caso de Incidente

1. **Erros 5xx no API Gateway** - Indica problemas no backend
2. **Latência p99 elevada** - Indica degradação de performance
3. **Erros nas Lambdas** - Identifica função problemática
4. **CPU Aurora > 80%** - Indica necessidade de scaling
5. **Conexões Aurora altas** - Verifica connection pooling
```

### 2. docs/INDEX-OPERATIONS-AWS.md

Adicionar entrada:

```markdown
## Observabilidade

### Dashboards CloudWatch
- **Localização**: CloudWatch Console > Dashboards
- **Dashboards**:
  - `AlquimistaAI-Dev-Overview` - Visão geral do ambiente dev
  - `AlquimistaAI-Prod-Overview` - Visão geral do ambiente prod
- **Documentação**: [OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md#dashboards-de-observabilidade)
- **Métricas**: API Gateway, Lambda, Aurora
- **Uso**: Monitoramento contínuo e resposta a incidentes
```

## Constraints and Limitations

### Limitações do CloudWatch

1. **Retenção de Métricas**:
   - Métricas de 1 minuto: 15 dias
   - Métricas de 5 minutos: 63 dias
   - Métricas de 1 hora: 455 dias

2. **Limites de API**:
   - GetMetricData: 180.000 métricas/segundo
   - PutMetricData: 150 transações/segundo

3. **Limites de Dashboard**:
   - Máximo 500 métricas por dashboard
   - Máximo 100 widgets por dashboard

### Considerações de Custo

```typescript
// Estimativa de custos (us-east-1)
// - Dashboards: $3/mês por dashboard
// - Métricas customizadas: $0.30 por métrica/mês
// - API calls: $0.01 por 1.000 requests

// Para 2 dashboards (dev + prod):
// - Dashboards: $6/mês
// - Métricas AWS (incluídas): $0
// - Total estimado: ~$6-10/mês
```

### Restrições de Implementação

1. **Não alterar stacks existentes**:
   - Fibonacci, Nigredo, Alquimista, Security
   - Apenas adicionar nova stack de dashboards

2. **Não criar alarmes**:
   - Alarmes já existem na SecurityStack
   - Dashboards são apenas para visualização

3. **Seguir padrões existentes**:
   - Nomenclatura de recursos
   - Estrutura de código
   - Tags e metadados

## Future Enhancements

### Fase 2 (Futuro)

1. **Dashboards Adicionais**:
   - Dashboard de custos (Cost Explorer)
   - Dashboard de segurança (GuardDuty findings)
   - Dashboard de negócio (métricas customizadas)

2. **Métricas Customizadas**:
   - Taxa de conversão de leads
   - Tempo médio de resposta
   - ROI por campanha

3. **Integração com X-Ray**:
   - Service map no dashboard
   - Trace analysis widgets

4. **Alertas Contextuais**:
   - Annotations nos gráficos
   - Links para runbooks
   - Integração com PagerDuty/Slack

5. **Dashboards Dinâmicos**:
   - Filtros por tenant
   - Comparação entre períodos
   - Drill-down automático

## References

- [AWS CloudWatch Dashboards Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [AWS CDK CloudWatch Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html)
- [CloudWatch Metrics Reference](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/aws-services-cloudwatch-metrics.html)
- [Dashboard Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/best-practices-for-creating-dashboards.html)
- [Projeto: Dashboards Existentes](./lib/dashboards/README.md)
