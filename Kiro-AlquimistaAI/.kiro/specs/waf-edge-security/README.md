# Spec: WAF + Edge Security para APIs Fibonacci/Nigredo

## Visão Geral

Esta spec define a implementação de proteção de borda (edge security) para as APIs públicas do sistema AlquimistaAI utilizando AWS WAF v2. O objetivo é proteger as APIs HTTP do Fibonacci e Nigredo contra ataques comuns, abuso de taxa e outras ameaças de segurança.

## Contexto

**Projeto:** AlquimistaAI AWS Architecture  
**Repositório:** github.com/MarcelloHollanda/alquimistaai-aws-architecture  
**Região AWS:** us-east-1  

### Arquitetura Atual

- **Backend:** API Gateway (HTTP APIs) + Lambda (Node.js 20)
- **Banco de Dados:** Aurora Serverless v2 PostgreSQL
- **IaC:** CDK TypeScript
- **Ambientes:** dev e prod (recursos separados)

### Guardrails Existentes

- CloudTrail + GuardDuty + SNS (segurança)
- AWS Budgets + Cost Anomaly Detection + SNS (custo)
- CI/CD completo com OIDC, validação e smoke tests
- Dashboards CloudWatch (AlquimistaAI-Dev-Overview, AlquimistaAI-Prod-Overview)

## Objetivos da Spec

1. **Proteção de APIs:** Implementar Web ACLs WAF v2 para ambientes dev e prod
2. **Defesa em Camadas:** Utilizar managed rules + rate limiting + regras customizadas
3. **Observabilidade:** Integrar logs WAF com CloudWatch e correlacionar com GuardDuty/CloudTrail
4. **Automação:** Provisionar toda infraestrutura via CDK TypeScript
5. **Operação:** Fornecer documentação completa para troubleshooting e resposta a incidentes

## Escopo

### Dentro do Escopo

- ✅ Criação de Web ACLs para dev e prod
- ✅ Associação com HTTP APIs do Fibonacci e Nigredo
- ✅ Configuração de AWS Managed Rules
- ✅ Implementação de rate-based rules
- ✅ Configuração de logging (CloudWatch Logs)
- ✅ Integração com CI/CD existente
- ✅ Documentação operacional completa

### Fora do Escopo

- ❌ Implementação de frontend S3+CloudFront (passo 3 futuro)
- ❌ Alterações em autenticação/autorização (já tratado)
- ❌ Mudanças no banco de dados Aurora
- ❌ Implementação de CDN ou cache

## Estrutura da Spec

```
.kiro/specs/waf-edge-security/
├── README.md           # Este arquivo (visão geral)
├── requirements.md     # Requisitos detalhados (EARS/INCOSE)
├── design.md          # Arquitetura e decisões técnicas
└── tasks.md           # Plano de implementação
```

## Workflow

Esta spec segue o workflow padrão de specs do Kiro:

1. **Requirements** → Definir requisitos claros (EARS/INCOSE)
2. **Design** → Criar arquitetura detalhada
3. **Tasks** → Plano de implementação incremental
4. **Execution** → Implementar tarefas uma a uma

## Status Atual

- [x] Requirements criado
- [ ] Requirements aprovado
- [ ] Design criado
- [ ] Design aprovado
- [ ] Tasks criado
- [ ] Tasks aprovado
- [ ] Implementação iniciada

## Próximos Passos

1. Revisar e aprovar o documento de requisitos
2. Criar documento de design detalhado
3. Criar plano de tarefas
4. Executar implementação

## Referências

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [AWS Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [Security Guardrails Existentes](../../docs/SECURITY-GUARDRAILS-AWS.md)
- [CI/CD Pipeline](../../docs/CI-CD-PIPELINE-ALQUIMISTAAI.md)

## Contato

Para dúvidas sobre esta spec, consulte a documentação do projeto ou o time de DevOps/Segurança.
