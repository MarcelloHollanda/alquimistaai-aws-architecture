# Spec: CloudWatch Observability Dashboards

## Visão Geral

Esta spec define a implementação de dashboards de observabilidade no CloudWatch para os ambientes dev e prod do sistema AlquimistaAI, fornecendo visibilidade consolidada sobre o estado dos serviços críticos.

## Status

- ✅ Requirements: Aprovado
- ✅ Design: Aprovado
- ✅ Tasks: Aprovado
- ⏳ Implementation: Pendente

## Documentos

1. **[requirements.md](./requirements.md)** - Requisitos funcionais e não-funcionais
2. **[design.md](./design.md)** - Arquitetura técnica e decisões de design
3. **[tasks.md](./tasks.md)** - Plano de implementação detalhado

## Objetivo

Criar dashboards CloudWatch que consolidem métricas críticas de:
- API Gateway (Fibonacci e Nigredo)
- Lambda Functions (principais handlers)
- Aurora PostgreSQL (cluster principal)

## Dashboards a Serem Criados

1. **AlquimistaAI-Dev-Overview** - Dashboard para ambiente de desenvolvimento
2. **AlquimistaAI-Prod-Overview** - Dashboard para ambiente de produção

## Métricas Principais

### API Gateway
- Latência: p50, p90, p99
- Erros: 4xx, 5xx
- Throughput: Requisições por minuto

### Lambda Functions
- Invocações
- Erros
- Duração: avg, p95

### Aurora PostgreSQL
- CPU Utilization
- Database Connections
- Free Storage Space

## Próximos Passos

Para iniciar a implementação, execute as tarefas na ordem definida em [tasks.md](./tasks.md):

1. Mapear recursos existentes
2. Criar stack de dashboards
3. Integrar no app CDK
4. Atualizar documentação
5. Validar deployment

## Comandos Úteis

```bash
# Compilar TypeScript
npm run build

# Sintetizar template
cdk synth ObservabilityDashboardStack-dev --context env=dev

# Deploy dev
cdk deploy ObservabilityDashboardStack-dev --context env=dev

# Deploy prod
cdk deploy ObservabilityDashboardStack-prod --context env=prod

# Listar dashboards
aws cloudwatch list-dashboards

# Ver dashboard
aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Dev-Overview
```

## Referências

- [AWS CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [AWS CDK CloudWatch Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html)
- [Dashboards Existentes](../../../lib/dashboards/README.md)
