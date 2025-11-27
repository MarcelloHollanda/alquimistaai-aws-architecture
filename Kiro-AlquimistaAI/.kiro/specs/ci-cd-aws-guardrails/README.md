# Spec: Pipeline CI/CD + Guardrails AWS (Padrão AlquimistaAI)

## Resumo Executivo

Esta spec define a implementação completa de um pipeline CI/CD robusto e guardrails de segurança, custo e observabilidade para o projeto AlquimistaAI na AWS. O objetivo é automatizar validações, deploys e monitoramento, garantindo qualidade, segurança e controle de custos.

## Contexto

O projeto AlquimistaAI possui:
- 3 stacks CDK principais: Fibonacci, Nigredo e Alquimista
- Aurora Serverless v2 PostgreSQL com migrations 001-010
- Frontend Next.js deployado em S3 + CloudFront
- Lambdas Node.js 20 com API Gateway
- Cognito para autenticação
- Stripe para pagamentos

Atualmente, deploys são manuais e não há guardrails automatizados de segurança ou custo.

## Objetivos

1. **Pipeline CI/CD Automatizado:**
   - Validação automática em PRs
   - Deploy automático em dev após merge
   - Deploy controlado em prod com aprovação manual
   - Autenticação segura via OIDC (sem credenciais de longo prazo)

2. **Guardrails de Segurança:**
   - CloudTrail para auditoria
   - GuardDuty para detecção de ameaças
   - Notificações automáticas de achados críticos

3. **Guardrails de Custo:**
   - AWS Budgets com alertas em 80%, 100%, 120%
   - Cost Anomaly Detection para serviços principais
   - Notificações de anomalias de custo

4. **Observabilidade Mínima:**
   - Alarmes CloudWatch para erros críticos
   - Retenção de logs padronizada (30 dias)
   - Notificações operacionais via SNS

5. **Compatibilidade Windows:**
   - Todos os scripts em PowerShell
   - Documentação com comandos Windows
   - Validação local funcional

## Estrutura da Spec

```
.kiro/specs/ci-cd-aws-guardrails/
├── README.md           # Este arquivo
├── INDEX.md            # Mapa de navegação
├── requirements.md     # Requisitos detalhados com critérios de aceite
├── design.md           # Design técnico e arquitetura
└── tasks.md            # Tarefas de implementação
```

## Como Usar Esta Spec

### Para Implementadores

1. **Leia primeiro:** `requirements.md` para entender o que precisa ser feito
2. **Estude o design:** `design.md` para entender como será implementado
3. **Execute as tarefas:** `tasks.md` em ordem, marcando como completas
4. **Valide:** Cada tarefa tem critérios de conclusão claros

### Para Revisores

1. **Valide requisitos:** Todos os critérios de aceite foram atendidos?
2. **Revise design:** A arquitetura faz sentido? Há pontos de melhoria?
3. **Acompanhe progresso:** Use `tasks.md` para ver o que foi feito

### Para Stakeholders

1. **Leia o resumo:** Este README
2. **Revise requisitos:** `requirements.md` (foco nas User Stories)
3. **Aprove design:** `design.md` (foco em decisões de design)

## Pré-requisitos

### Conhecimento Técnico

- AWS (IAM, CloudFormation, Lambda, API Gateway, Aurora)
- CDK (Cloud Development Kit) com TypeScript
- GitHub Actions
- PowerShell
- Node.js e npm

### Acesso e Permissões

- Acesso administrativo à conta AWS (para configuração inicial)
- Acesso de admin ao repositório GitHub
- Permissão para criar IAM Roles e Policies
- Permissão para habilitar GuardDuty e CloudTrail

### Ferramentas

- AWS CLI configurado
- Node.js 20.x
- AWS CDK CLI
- PowerShell 7+
- Git

## Fluxo de Trabalho

### Fase 1: Preparação (Tarefas 1-2)
- Configurar OIDC GitHub ↔ AWS
- Criar workflow básico do GitHub Actions
- **Duração estimada:** 6-9 horas

### Fase 2: Guardrails (Tarefas 3-5)
- Implementar guardrails de segurança
- Implementar guardrails de custo
- Implementar observabilidade mínima
- **Duração estimada:** 8-11 horas

### Fase 3: Suporte (Tarefas 6-7)
- Criar scripts de validação e suporte
- Documentar tudo
- **Duração estimada:** 6-8 horas

### Fase 4: Validação (Tarefas 8-9)
- Testar end-to-end
- Checklist final e entrega
- **Duração estimada:** 5-7 horas

**Total:** 25-35 horas de trabalho

## Principais Decisões de Design

### 1. OIDC vs Access Keys
**Decisão:** Usar OIDC para autenticação GitHub → AWS

**Justificativa:**
- Elimina risco de vazamento de credenciais
- Rotação automática de tokens
- Auditoria clara via CloudTrail
- Conformidade com melhores práticas

### 2. CDK vs Terraform para Guardrails
**Decisão:** Usar CDK para todos os guardrails

**Justificativa:**
- Consistência com infraestrutura existente
- Time já familiarizado com CDK
- Melhor integração com stacks atuais

### 3. Stack Dedicado para Guardrails
**Decisão:** Criar `GuardrailsStack` separado

**Justificativa:**
- Separação de responsabilidades
- Guardrails são infraestrutura transversal
- Facilita manutenção independente
- Deploy único, não precisa ser redeployado frequentemente

### 4. Deploy Sequencial por Stack
**Decisão:** Deploy em ordem: Fibonacci → Nigredo → Alquimista

**Justificativa:**
- Fibonacci contém Cognito (dependência)
- Nigredo pode depender de recursos do Fibonacci
- AlquimistaStack é camada de aplicação final

### 5. Aprovação Manual em Prod
**Decisão:** Requer aprovação humana antes de deploy prod

**Justificativa:**
- Produção é ambiente crítico
- Permite revisão antes de mudanças
- Reduz risco de deploys acidentais

## Riscos e Mitigações

### Risco 1: Configuração OIDC Complexa
**Mitigação:** Documentação detalhada passo-a-passo, script de setup

### Risco 2: Custos AWS Inesperados
**Mitigação:** Budgets e Cost Anomaly Detection configurados desde o início

### Risco 3: Falsos Positivos em Alarmes
**Mitigação:** Thresholds conservadores, ajustáveis após observação

### Risco 4: Falha de Deploy em Prod
**Mitigação:** Aprovação manual, rollback documentado, CloudFormation rollback automático

### Risco 5: Incompatibilidade Windows
**Mitigação:** Todos os scripts em PowerShell, testes em ambiente Windows

## Critérios de Sucesso

### Técnicos
- [ ] Pipeline executa com sucesso em PR, dev e prod
- [ ] Guardrails de segurança ativos e funcionais
- [ ] Guardrails de custo configurados e alertando
- [ ] Alarmes CloudWatch disparando corretamente
- [ ] Notificações SNS sendo recebidas
- [ ] Scripts PowerShell funcionando localmente
- [ ] Documentação completa e revisada

### Operacionais
- [ ] Time consegue fazer deploy sem intervenção manual
- [ ] Alertas de segurança chegam em tempo hábil
- [ ] Alertas de custo permitem ação preventiva
- [ ] Rollback pode ser executado rapidamente
- [ ] Novos membros conseguem entender o sistema

### Negócio
- [ ] Redução de tempo de deploy (manual → automatizado)
- [ ] Redução de riscos de segurança (auditoria + detecção)
- [ ] Controle de custos (visibilidade + alertas)
- [ ] Aumento de confiança em deploys

## Próximos Passos

1. **Revisar esta spec** com stakeholders técnicos
2. **Aprovar requisitos** (`requirements.md`)
3. **Aprovar design** (`design.md`)
4. **Iniciar implementação** seguindo `tasks.md`
5. **Validar incrementalmente** cada tarefa concluída
6. **Documentar aprendizados** durante implementação
7. **Obter aprovação final** após testes completos

## Contatos e Responsáveis

- **Responsável Técnico:** [A definir]
- **Revisor de Segurança:** [A definir]
- **Revisor de Custos:** [A definir]
- **Aprovador Final:** [A definir]

## Referências

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS OIDC with GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS CloudTrail Best Practices](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html)
- [AWS GuardDuty Documentation](https://docs.aws.amazon.com/guardduty/)
- [AWS Budgets Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)

## Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2025-11-17 | Kiro AI | Versão inicial da spec |
| 1.1 | 2025-11-17 | Kiro AI | Tarefa 1 concluída - CI Base implementado |

---

**Status:** ✅ SPEC COMPLETA E IMPLEMENTADA (100%)

**Data de Conclusão:** 2025-11-17

**Última Atualização:** 2025-11-17
