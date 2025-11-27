# Plano de Implementação - WAF + Edge Security

## Visão Geral

Este documento contém o plano de implementação incremental para o WAF + Edge Security do sistema AlquimistaAI. Cada tarefa é executável por um agente de código e referencia requisitos específicos do documento de requisitos.

---

## Tarefas

- [x] 1. Mapear APIs e recursos alvo


  - Identificar ARNs das HTTP APIs Fibonacci e Nigredo (dev/prod)
  - Verificar estrutura atual das stacks CDK
  - Documentar pontos de integração necessários
  - _Requisitos: R7_



- [ ] 2. Criar estrutura base da WAFStack
  - [ ] 2.1 Criar arquivo `lib/waf-stack.ts`
    - Definir classe WAFStack estendendo cdk.Stack
    - Configurar construtor com parâmetros de ambiente
    - Adicionar tags padrão (Project, Component, Environment)

    - Exportar propriedades públicas (webAclDev, webAclProd)
    - _Requisitos: R7_

  - [ ] 2.2 Criar IP Sets (AllowedIPs e BlockedIPs)
    - Implementar método `createIPSet()` para IPs permitidos
    - Implementar método `createIPSet()` para IPs bloqueados


    - Configurar scope REGIONAL
    - Adicionar descrições e tags
    - _Requisitos: R4, R8_

  - [ ] 2.3 Integrar WAFStack no bin/app.ts
    - Importar WAFStack

    - Instanciar antes das stacks Fibonacci/Nigredo
    - Configurar dependências entre stacks
    - Passar Web ACLs como props para outras stacks
    - _Requisitos: R7_

- [x] 3. Implementar Web ACL Dev

  - [ ] 3.1 Criar método `createWebACLDev()`
    - Configurar Web ACL com nome 'AlquimistaAI-WAF-Dev'
    - Definir defaultAction como allow
    - Configurar visibilityConfig com métricas
    - Adicionar tags apropriadas
    - _Requisitos: R1, R7_


  - [ ] 3.2 Adicionar Managed Rules ao Web ACL Dev
    - Adicionar AWSManagedRulesCommonRuleSet (priority 1)
    - Adicionar AWSManagedRulesKnownBadInputsRuleSet (priority 2)
    - Adicionar AWSManagedRulesSQLiRuleSet (priority 3)
    - Configurar em modo count inicialmente
    - _Requisitos: R1, R3_


  - [ ] 3.3 Adicionar Rate-based Rule ao Web ACL Dev
    - Criar regra com limite de 2000 req/5min
    - Configurar aggregateKeyType como IP
    - Definir action como count (observação)
    - Adicionar visibilityConfig

    - _Requisitos: R1, R4_

- [ ] 4. Implementar Web ACL Prod
  - [ ] 4.1 Criar método `createWebACLProd()`
    - Configurar Web ACL com nome 'AlquimistaAI-WAF-Prod'
    - Definir defaultAction como allow

    - Configurar visibilityConfig com métricas
    - Adicionar tags apropriadas
    - _Requisitos: R2, R7_

  - [ ] 4.2 Adicionar Managed Rules ao Web ACL Prod
    - Adicionar AWSManagedRulesCommonRuleSet (priority 1, modo block)
    - Adicionar AWSManagedRulesKnownBadInputsRuleSet (priority 2, modo block)

    - Adicionar AWSManagedRulesSQLiRuleSet (priority 3, modo block)
    - Configurar overrideAction apropriadamente
    - _Requisitos: R2, R3_

  - [ ] 4.3 Adicionar Rate-based Rule ao Web ACL Prod
    - Criar regra com limite de 1000 req/5min

    - Configurar aggregateKeyType como IP
    - Definir action como block
    - Adicionar scopeDownStatement para excluir AllowedIPs
    - _Requisitos: R2, R4_

- [x] 5. Configurar logging do WAF

  - [ ] 5.1 Criar Log Group para Dev
    - Criar CloudWatch Log Group `/aws/waf/alquimista-dev`
    - Configurar retenção de 30 dias
    - Habilitar encriptação com KMS
    - Adicionar tags apropriadas
    - _Requisitos: R5_



  - [ ] 5.2 Criar Log Group para Prod
    - Criar CloudWatch Log Group `/aws/waf/alquimista-prod`
    - Configurar retenção de 90 dias
    - Habilitar encriptação com KMS
    - Adicionar tags apropriadas


    - _Requisitos: R5_

  - [ ] 5.3 Associar logging aos Web ACLs
    - Criar CfnLoggingConfiguration para Web ACL Dev
    - Criar CfnLoggingConfiguration para Web ACL Prod
    - Configurar redactionConfig para remover dados sensíveis

    - Verificar permissões IAM necessárias
    - _Requisitos: R5_

- [ ] 6. Implementar associações WAF com APIs
  - [ ] 6.1 Atualizar FibonacciStack
    - Adicionar propriedades webAclDev e webAclProd ao construtor

    - Criar CfnWebACLAssociation para Fibonacci API Dev
    - Criar CfnWebACLAssociation para Fibonacci API Prod
    - Adicionar dependência da WAFStack
    - _Requisitos: R1, R2, R7_

  - [x] 6.2 Atualizar NigredoStack


    - Adicionar propriedades webAclDev e webAclProd ao construtor
    - Criar CfnWebACLAssociation para Nigredo API Dev
    - Criar CfnWebACLAssociation para Nigredo API Prod
    - Adicionar dependência da WAFStack
    - _Requisitos: R1, R2, R7_

- [ ] 7. Criar métricas e alarmes CloudWatch
  - [x] 7.1 Implementar alarme de alto volume de bloqueios


    - Criar alarme para BlockedRequests > 100 em 10 minutos
    - Configurar para ambiente prod
    - Integrar com SNS de segurança existente
    - Adicionar descrição e tags
    - _Requisitos: R6_


  - [ ] 7.2 Implementar alarme de rate limiting
    - Criar alarme para RateLimitProd > 10 violações
    - Configurar threshold apropriado
    - Integrar com SNS de segurança
    - Adicionar descrição e tags

    - _Requisitos: R4, R6_

  - [ ] 7.3 Criar dashboard CloudWatch para WAF
    - Adicionar widgets para métricas de bloqueio
    - Adicionar widgets para rate limiting
    - Adicionar widgets por managed rule group

    - Integrar com dashboards existentes (AlquimistaAI-*-Overview)
    - _Requisitos: R6_

- [ ] 8. Criar queries CloudWatch Insights
  - [ ] 8.1 Implementar query de top IPs bloqueados
    - Criar arquivo `lib/dashboards/waf-insights-queries.ts`
    - Implementar query para listar top 20 IPs bloqueados
    - Adicionar filtros por período
    - Documentar uso da query
    - _Requisitos: R5, R6_

  - [ ] 8.2 Implementar query de regras mais acionadas
    - Criar query para estatísticas por regra
    - Incluir contagem de blocks vs counts
    - Ordenar por frequência
    - Documentar uso da query
    - _Requisitos: R5, R6_

  - [ ] 8.3 Implementar query de análise de rate limiting
    - Criar query para violações de rate limit
    - Agrupar por IP e URI
    - Identificar padrões de abuso
    - Documentar uso da query
    - _Requisitos: R4, R5_

  - [ ] 8.4 Implementar query de análise geográfica
    - Criar query para distribuição por país
    - Incluir estatísticas de allow vs block
    - Identificar origens suspeitas
    - Documentar uso da query
    - _Requisitos: R5, R6_

- [ ] 9. Integrar com CI/CD
  - [ ] 9.1 Atualizar workflow de deploy
    - Adicionar deploy da WAFStack ao workflow existente
    - Configurar ordem correta de deploy (WAF antes de APIs)
    - Adicionar validação de sintaxe CDK
    - Testar em ambiente dev primeiro
    - _Requisitos: R7_

  - [ ] 9.2 Criar script de validação WAF
    - Criar `scripts/validate-waf.ps1`
    - Verificar existência das Web ACLs
    - Verificar associações com APIs
    - Verificar configuração de logging
    - Integrar ao workflow de validação pós-deploy
    - _Requisitos: R7_

  - [ ] 9.3 Adicionar testes de smoke para WAF
    - Criar testes para verificar Web ACLs ativas
    - Testar rate limiting (sem ultrapassar limites)
    - Verificar logs sendo gerados
    - Integrar ao smoke-tests-api-dev.ps1
    - _Requisitos: R7_

- [ ] 10. Criar documentação operacional
  - [ ] 10.1 Criar guia de troubleshooting
    - Criar `docs/WAF-TROUBLESHOOTING-GUIDE.md`
    - Documentar como verificar bloqueios
    - Documentar como identificar false positives
    - Documentar como adicionar IPs a allowlist/blocklist
    - Incluir exemplos de queries úteis
    - _Requisitos: R8_

  - [ ] 10.2 Criar runbook de resposta a incidentes
    - Criar `docs/WAF-INCIDENT-RESPONSE.md`
    - Documentar procedimentos para ataque em andamento
    - Documentar escalação para equipe de segurança
    - Incluir comandos AWS CLI úteis
    - Documentar processo de rollback se necessário
    - _Requisitos: R8_

  - [ ] 10.3 Atualizar documentação de segurança
    - Adicionar seção WAF ao `docs/SECURITY-GUARDRAILS-AWS.md`
    - Documentar integração com GuardDuty/CloudTrail
    - Incluir diagramas de arquitetura
    - Adicionar referências cruzadas
    - _Requisitos: R6, R8_

  - [ ] 10.4 Atualizar índice operacional
    - Adicionar links WAF ao `docs/INDEX-OPERATIONS-AWS.md`
    - Criar seção "Edge Security"
    - Linkar para troubleshooting e runbooks
    - Atualizar quick reference
    - _Requisitos: R8_

  - [ ] 10.5 Criar guia de custos e otimização
    - Criar `docs/WAF-COST-OPTIMIZATION.md`
    - Documentar componentes de custo
    - Incluir estimativas mensais
    - Documentar estratégias de otimização
    - Adicionar alertas de custo recomendados
    - _Requisitos: R8_

- [ ] 11. Executar rollout em fases
  - [ ] 11.1 Fase 1: Deploy em modo observação
    - Deploy WAFStack em dev e prod (modo count)
    - Verificar logs sendo gerados
    - Monitorar por 1-2 semanas
    - Coletar dados sobre padrões de tráfego
    - Identificar possíveis false positives
    - _Requisitos: R1, R2, R5_

  - [ ] 11.2 Fase 2: Ativação em dev
    - Mudar Web ACL Dev para modo block
    - Monitorar impacto no desenvolvimento
    - Ajustar allowlist se necessário
    - Validar com equipe de desenvolvimento
    - Documentar lições aprendidas
    - _Requisitos: R1, R4_

  - [ ] 11.3 Fase 3: Ativação em prod
    - Mudar Web ACL Prod para modo block
    - Monitorar métricas de negócio
    - Verificar alertas SNS funcionando
    - Validar com equipe de operações
    - Documentar configuração final
    - _Requisitos: R2, R4, R6_

  - [ ] 11.4 Fase 4: Otimização contínua
    - Configurar revisão semanal de logs
    - Ajustar thresholds baseado em dados reais
    - Atualizar IP Sets conforme necessário
    - Adicionar regras customizadas se identificado padrão
    - Documentar todas as mudanças
    - _Requisitos: R4, R8_

---

## Notas de Implementação

### Ordem de Execução
As tarefas devem ser executadas na ordem apresentada, pois há dependências entre elas:
- Tarefas 1-2: Preparação e estrutura base
- Tarefas 3-4: Implementação das Web ACLs
- Tarefa 5: Configuração de logging
- Tarefa 6: Associações com APIs
- Tarefas 7-8: Observabilidade
- Tarefa 9: Integração CI/CD
- Tarefa 10: Documentação
- Tarefa 11: Rollout gradual

### Tarefas Obrigatórias
Todas as tarefas são obrigatórias para garantir cobertura completa de testes e validação.

### Validação
Após cada tarefa principal (1-10), executar:
```bash
npm run build
cdk synth AlquimistaAI-WAF --context env=dev
```

### Rollback
Se necessário fazer rollback:
```bash
cdk destroy AlquimistaAI-WAF --context env=dev
```

### Testes Locais
Antes de deploy:
```bash
# Validar sintaxe
npm run build

# Sintetizar template
cdk synth AlquimistaAI-WAF --context env=dev

# Verificar diff
cdk diff AlquimistaAI-WAF --context env=dev
```

## Estimativa de Tempo

- Tarefas 1-2: 2-3 horas (estrutura base)
- Tarefas 3-4: 3-4 horas (Web ACLs)
- Tarefa 5: 1-2 horas (logging)
- Tarefa 6: 1-2 horas (associações)
- Tarefas 7-8: 2-3 horas (observabilidade)
- Tarefa 9: 2-3 horas (CI/CD)
- Tarefa 10: 3-4 horas (documentação)
- Tarefa 11: 2-4 semanas (rollout gradual)

**Total de desenvolvimento:** ~15-20 horas  
**Total com rollout:** 3-5 semanas

## Critérios de Sucesso

- [ ] Web ACLs criadas e associadas a todas as APIs
- [ ] Logs sendo gerados em CloudWatch
- [ ] Queries Insights funcionando
- [ ] Alarmes configurados e testados
- [ ] Documentação completa e revisada
- [ ] CI/CD incluindo deploy do WAF
- [ ] Rollout em prod sem incidentes
- [ ] Equipe treinada em operação

## Próximos Passos Após Conclusão

1. Monitoramento contínuo de métricas
2. Revisão mensal de regras e thresholds
3. Integração com threat intelligence feeds
4. Expansão para CloudFront (quando frontend for migrado)
5. Automação de resposta a incidentes (Lambda + GuardDuty)

---

**Nota:** Este plano de tarefas está pronto para execução. Cada tarefa pode ser executada individualmente, e o progresso pode ser rastreado marcando os checkboxes conforme conclusão.
