# ✅ Spec Completa: WAF + Edge Security

## Status: Pronta para Implementação

A spec de **WAF + Edge Security** foi criada com sucesso e está pronta para execução!

---

## 📋 Resumo Executivo

### Objetivo
Implementar proteção de borda (edge security) para as APIs públicas do sistema AlquimistaAI utilizando AWS WAF v2, protegendo contra ataques comuns, abuso de taxa e outras ameaças de segurança.

### Escopo
- ✅ Web ACLs para ambientes dev e prod
- ✅ AWS Managed Rules (Common, KnownBadInputs, SQLi)
- ✅ Rate limiting diferenciado por ambiente
- ✅ Logging completo em CloudWatch
- ✅ Integração com guardrails existentes
- ✅ Provisionamento via CDK TypeScript
- ✅ Documentação operacional completa

---

## 📁 Estrutura da Spec

```
.kiro/specs/waf-edge-security/
├── README.md              # Visão geral e contexto
├── requirements.md        # 8 requisitos (EARS/INCOSE)
├── design.md             # Arquitetura detalhada
├── tasks.md              # 11 tarefas de implementação
└── SPEC-COMPLETE.md      # Este arquivo
```

---

## 🎯 Requisitos (8 principais)

1. **R1:** Proteção de APIs Dev com Web ACL e rate limiting básico
2. **R2:** Proteção de APIs Prod com Web ACL restritiva
3. **R3:** Utilização de AWS Managed Rules (3 conjuntos)
4. **R4:** Rate limiting (2000 dev / 1000 prod req/5min)
5. **R5:** Logging em CloudWatch (30d dev / 90d prod)
6. **R6:** Integração com GuardDuty/CloudTrail/SNS
7. **R7:** Provisionamento via CDK TypeScript
8. **R8:** Documentação operacional completa

Todos os requisitos seguem padrão **EARS** com acceptance criteria detalhados.

---

## 🏗️ Arquitetura

### Componentes Principais

**Web ACLs:**
- `AlquimistaAI-WAF-Dev` - Modo count inicial, rate limit 2000/5min
- `AlquimistaAI-WAF-Prod` - Modo block, rate limit 1000/5min

**Managed Rules:**
- AWSManagedRulesCommonRuleSet (OWASP Top 10)
- AWSManagedRulesKnownBadInputsRuleSet (Exploits conhecidos)
- AWSManagedRulesSQLiRuleSet (SQL Injection)

**IP Sets:**
- AllowedIPs - Lista de permissões (escritórios, CI/CD)
- BlockedIPs - Lista de bloqueio (IPs maliciosos)

**Logging:**
- `/aws/waf/alquimista-dev` - Retenção 30 dias
- `/aws/waf/alquimista-prod` - Retenção 90 dias

**Associações:**
- Fibonacci API Dev/Prod
- Nigredo API Dev/Prod

### Stack CDK

```typescript
WAFStack (nova)
├── Web ACL Dev
├── Web ACL Prod
├── IP Sets
├── Log Groups
└── Alarmes

FibonacciStack (atualizada)
└── Associações WAF

NigredoStack (atualizada)
└── Associações WAF
```

---

## 📝 Plano de Tarefas (11 principais)

### Fase de Desenvolvimento (15-20 horas)

1. **Mapear APIs** - Identificar recursos alvo
2. **Estrutura base** - WAFStack + IP Sets + integração bin/app.ts
3. **Web ACL Dev** - Managed rules + rate limit (count mode)
4. **Web ACL Prod** - Managed rules + rate limit (block mode)
5. **Logging** - CloudWatch Logs com retenção apropriada
6. **Associações** - Integrar com Fibonacci e Nigredo
7. **Alarmes** - Alto volume bloqueios + rate limiting
8. **Queries Insights** - 4 queries prontas para análise
9. **CI/CD** - Integração workflow + validação + testes smoke
10. **Documentação** - Troubleshooting + runbooks + custos

### Fase de Rollout (3-5 semanas)

11. **Rollout em fases:**
    - Fase 1: Observação (modo count, 1-2 semanas)
    - Fase 2: Ativação dev (semana 3)
    - Fase 3: Ativação prod (semana 4)
    - Fase 4: Otimização contínua

**Todas as tarefas são obrigatórias** para garantir cobertura completa.

---

## 💰 Custos Estimados

| Componente | Dev | Prod | Total |
|------------|-----|------|-------|
| Web ACL | $5 | $5 | $10 |
| Regras (5) | $5 | $5 | $10 |
| Requisições | $6 | $30 | $36 |
| Logs | $5 | $15 | $20 |
| **Total/mês** | **$21** | **$55** | **~$76** |

---

## 🔄 Estratégia de Rollout

### Fase 1: Observação (Semanas 1-2)
- Deploy em modo `count` (dev e prod)
- Coletar dados de tráfego
- Identificar false positives
- Ajustar regras conforme necessário

### Fase 2: Ativação Dev (Semana 3)
- Mudar para modo `block` em dev
- Validar com equipe de desenvolvimento
- Ajustar allowlist se necessário

### Fase 3: Ativação Prod (Semana 4)
- Mudar para modo `block` em prod
- Monitorar métricas de negócio
- Validar alertas SNS

### Fase 4: Otimização (Contínua)
- Revisão semanal de logs
- Ajuste de thresholds
- Atualização de IP Sets

---

## 📊 Observabilidade

### Métricas CloudWatch
- AllowedRequests
- BlockedRequests
- CountedRequests
- Métricas por regra

### Alarmes
- Alto volume de bloqueios (>100 em 10min)
- Rate limiting acionado (>10 violações)
- Integração com SNS de segurança

### Queries CloudWatch Insights
1. Top IPs bloqueados
2. Regras mais acionadas
3. Análise de rate limiting
4. Análise geográfica

### Integração Guardrails
- Correlação com GuardDuty findings
- Auditoria via CloudTrail
- Alertas via SNS existente

---

## 📚 Documentação

### Documentos a Criar

1. **WAF-TROUBLESHOOTING-GUIDE.md**
   - Como verificar bloqueios
   - Como identificar false positives
   - Como gerenciar IP Sets

2. **WAF-INCIDENT-RESPONSE.md**
   - Runbook para ataques
   - Procedimentos de escalação
   - Comandos AWS CLI úteis

3. **WAF-COST-OPTIMIZATION.md**
   - Componentes de custo
   - Estratégias de otimização
   - Alertas recomendados

4. **Atualizações em Docs Existentes**
   - SECURITY-GUARDRAILS-AWS.md (adicionar seção WAF)
   - INDEX-OPERATIONS-AWS.md (adicionar links)

---

## ✅ Critérios de Sucesso

- [ ] Web ACLs criadas e associadas a todas as APIs
- [ ] Logs sendo gerados em CloudWatch
- [ ] Queries Insights funcionando
- [ ] Alarmes configurados e testados
- [ ] Documentação completa e revisada
- [ ] CI/CD incluindo deploy do WAF
- [ ] Rollout em prod sem incidentes
- [ ] Equipe treinada em operação

---

## 🚀 Como Executar

### 1. Revisar a Spec
```bash
# Ler documentos na ordem
cat .kiro/specs/waf-edge-security/README.md
cat .kiro/specs/waf-edge-security/requirements.md
cat .kiro/specs/waf-edge-security/design.md
cat .kiro/specs/waf-edge-security/tasks.md
```

### 2. Iniciar Implementação
```bash
# Abrir tasks.md no Kiro
# Clicar em "Start task" na primeira tarefa
# Seguir ordem sequencial
```

### 3. Validar Cada Tarefa
```bash
npm run build
cdk synth AlquimistaAI-WAF --context env=dev
cdk diff AlquimistaAI-WAF --context env=dev
```

### 4. Deploy Gradual
```bash
# Fase 1: Observação
cdk deploy AlquimistaAI-WAF --context env=dev

# Aguardar 1-2 semanas, analisar logs

# Fase 2-3: Ativação
# Ajustar configurações conforme necessário
```

---

## 🔗 Referências

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [AWS Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Best Practices](https://docs.aws.amazon.com/waf/latest/developerguide/waf-best-practices.html)
- [Security Guardrails Existentes](../../docs/SECURITY-GUARDRAILS-AWS.md)
- [CI/CD Pipeline](../../docs/CI-CD-PIPELINE-ALQUIMISTAAI.md)

---

## 📞 Suporte

Para dúvidas sobre esta spec:
- Consultar documentação do projeto
- Contatar time de DevOps/Segurança
- Revisar issues relacionadas no GitHub

---

## 🎉 Próximos Passos

1. ✅ **Spec aprovada** - Documentos criados e revisados
2. ⏭️ **Iniciar implementação** - Executar tarefas sequencialmente
3. ⏭️ **Deploy em fases** - Rollout gradual conforme plano
4. ⏭️ **Monitoramento** - Acompanhar métricas e ajustar
5. ⏭️ **Otimização** - Refinar regras baseado em dados reais

---

**Status:** ✅ Spec completa e aprovada  
**Data:** 2025-11-18  
**Próxima ação:** Iniciar implementação da Tarefa 1

---

*Esta spec segue o padrão de desenvolvimento orientado por especificações do Kiro, garantindo clareza, rastreabilidade e execução incremental.*
