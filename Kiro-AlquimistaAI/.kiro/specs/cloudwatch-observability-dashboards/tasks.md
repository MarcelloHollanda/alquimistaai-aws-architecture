# Implementation Plan

- [x] 1. Mapear recursos existentes e estrutura das stacks

  - Identificar onde estão definidos os recursos (API Gateway, Lambda, Aurora) nas stacks Fibonacci e Nigredo
  - Verificar como os ambientes dev/prod são diferenciados (context, props, tags)
  - Documentar ARNs e identificadores necessários para as métricas
  - _Requirements: 1.1, 1.2, 2.1, 2.2_




- [ ] 2. Criar stack de dashboards de observabilidade
  - [x] 2.1 Criar arquivo `lib/observability-dashboard-stack.ts`


    - Definir interface `ObservabilityDashboardStackProps` com referências aos recursos
    - Implementar classe `ObservabilityDashboardStack` que estende `cdk.Stack`
    - Criar dois dashboards: `AlquimistaAI-Dev-Overview` e `AlquimistaAI-Prod-Overview`
    - Aplicar tags apropriadas (Environment, Project, Component)

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 5.1, 5.2, 5.3_

  - [ ] 2.2 Implementar widgets para API Gateway do Fibonacci
    - Widget de latência (p50, p90, p99) - 12 cols
    - Widget de erros (4xx, 5xx) - 12 cols
    - Widget de throughput (requests/min) - 24 cols

    - Adicionar prefixo [DEV] ou [PROD] nos títulos
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 5.4_

  - [ ] 2.3 Implementar widgets para Lambdas do Fibonacci
    - Widget de invocações - 8 cols

    - Widget de erros - 8 cols
    - Widget de duração (avg, p95) - 8 cols
    - _Requirements: 1.5, 2.5_

  - [ ] 2.4 Implementar widgets para API Gateway do Nigredo
    - Widget de latência (p50, p90, p99) - 12 cols

    - Widget de erros (4xx, 5xx) - 12 cols
    - Widget de throughput (requests/min) - 24 cols
    - Adicionar prefixo [DEV] ou [PROD] nos títulos
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.4_


  - [ ] 2.5 Implementar widgets para Lambdas do Nigredo
    - Widget de invocações por Lambda (todas as 6 Lambdas) - 24 cols
    - Widget de erros por Lambda - 24 cols
    - Widget de duração (avg, p95) por Lambda - 24 cols
    - _Requirements: 4.1, 4.2, 4.3_


  - [ ] 2.6 Implementar widgets para Aurora PostgreSQL
    - Widget de CPU Utilization - 8 cols
    - Widget de Database Connections - 8 cols
    - Widget de Free Storage Space - 8 cols



    - Diferenciar métricas por ambiente (dev/prod)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 2.7 Adicionar comentários em português explicando os widgets
    - Documentar intenção de cada seção de widgets
    - Explicar escolha de métricas e percentis


    - Adicionar notas sobre interpretação dos dados
    - _Requirements: 6.5_

- [x] 3. Integrar stack de dashboards no app CDK



  - [ ] 3.1 Atualizar `bin/app.ts`
    - Importar `ObservabilityDashboardStack`
    - Instanciar stack após Fibonacci e Nigredo
    - Passar referências corretas dos recursos via props
    - Adicionar dependências entre stacks
    - _Requirements: 6.3, 6.4_


  - [ ] 3.2 Validar síntese CDK
    - Executar `npm run build` para compilar TypeScript
    - Executar `cdk synth` para ambos os ambientes (dev e prod)
    - Verificar que não há erros de síntese
    - Confirmar que templates CloudFormation são gerados corretamente
    - _Requirements: 8.1_


- [ ] 4. Atualizar documentação operacional
  - [ ] 4.1 Atualizar `docs/OBSERVABILITY-GUARDRAILS-AWS.md`
    - Adicionar seção "Dashboards de Observabilidade – Visão Geral"
    - Documentar dashboards disponíveis (dev e prod)
    - Listar métricas principais de cada dashboard
    - Explicar como acessar os dashboards (Console e CLI)
    - Adicionar seção "O Que Olhar Primeiro em Caso de Incidente"
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 4.2 Atualizar `docs/INDEX-OPERATIONS-AWS.md`
    - Adicionar entrada na seção de Observabilidade
    - Incluir links para os dashboards
    - Referenciar documentação detalhada
    - Descrever uso principal (monitoramento e resposta a incidentes)
    - _Requirements: 7.4_

  - [ ] 4.3 Criar guia rápido de troubleshooting
    - Documentar cenários comuns de incidentes
    - Mapear sintomas para widgets específicos
    - Incluir comandos CLI úteis para investigação
    - _Requirements: 7.5_

- [ ] 5. Validar deployment e métricas
  - [ ] 5.1 Deploy em ambiente dev
    - Executar `cdk deploy ObservabilityDashboardStack-dev --context env=dev`
    - Verificar que stack é criada sem erros
    - Confirmar outputs do CloudFormation
    - _Requirements: 8.2_

  - [ ] 5.2 Verificar dashboards no console CloudWatch
    - Acessar CloudWatch Console > Dashboards
    - Confirmar que `AlquimistaAI-Dev-Overview` aparece na lista
    - Abrir dashboard e verificar que todos os widgets são exibidos
    - Aguardar alguns minutos para métricas popularem
    - _Requirements: 8.3_

  - [x] 5.3 Validar métricas populadas


    - Verificar que widgets mostram dados (não vazios)
    - Confirmar que títulos incluem prefixo [DEV]
    - Validar que métricas de latência mostram p50/p90/p99
    - Verificar que métricas de Aurora estão corretas
    - _Requirements: 8.4_

  - [ ] 5.4 Deploy em ambiente prod
    - Executar `cdk deploy ObservabilityDashboardStack-prod --context env=prod`
    - Verificar que stack é criada sem erros
    - Confirmar que `AlquimistaAI-Prod-Overview` aparece no console
    - Validar métricas e títulos com prefixo [PROD]
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ] 5.5 Testar acesso via CLI
    - Listar dashboards: `aws cloudwatch list-dashboards`
    - Obter definição: `aws cloudwatch get-dashboard --dashboard-name AlquimistaAI-Dev-Overview`
    - Verificar estrutura JSON retornada
    - _Requirements: 7.3_

  - [ ] 5.6 Validar que stacks existentes não foram alteradas
    - Verificar que Fibonacci, Nigredo, Alquimista e Security não foram modificadas
    - Confirmar que apenas nova stack foi adicionada
    - Validar que não há mudanças inesperadas no diff do CDK
    - _Requirements: 8.5_
