# Spec Completa: Frontend S3 + CloudFront + WAF

## Status: ✅ APROVADA

Data de Aprovação: 18 de novembro de 2025

---

## Resumo Executivo

Esta spec define a arquitetura oficial para hospedagem do frontend estático do AlquimistaAI na AWS, utilizando S3 para armazenamento, CloudFront para distribuição global de conteúdo e WAF para proteção em produção.

### Objetivo

Criar infraestrutura AWS para servir as páginas comerciais do AlquimistaAI (`index.html`, `produtos.html`, `fibonacci.html`) com:
- URLs públicas estáveis para dev e prod
- Proteção WAF em produção
- Integração com APIs backend
- Processo de deploy documentado

### Escopo

**Dentro do Escopo:**
- Buckets S3 privados (dev e prod)
- CloudFront Distributions (dev e prod)
- Integração com WAFStack existente
- Sistema de configuração de APIs
- Scripts de deploy para Windows
- Documentação operacional completa

**Fora do Escopo:**
- Domínio customizado (ex: app.alquimistaai.com)
- Certificados ACM para domínio próprio
- Build de frameworks SPA (Next.js, React)
- CI/CD automatizado (fase futura)

---

## Arquitetura

### Componentes Principais

1. **S3 Buckets (Privados)**
   - `alquimistaai-frontend-dev-{ACCOUNT_ID}`
   - `alquimistaai-frontend-prod-{ACCOUNT_ID}`
   - Encryption: SSE-S3
   - Versioning habilitado
   - Block Public Access

2. **CloudFront Distributions**
   - Dev: Sem WAF, cache otimizado
   - Prod: Com WAF, cache otimizado, global
   - HTTPS obrigatório
   - Compressão Gzip/Brotli

3. **Origin Access Control (OAC)**
   - Acesso seguro CloudFront → S3
   - Buckets permanecem privados

4. **WAF Integration (Prod)**
   - WebAclProd da WAFStack
   - Rate limiting: 1000 req/5min
   - AWS Managed Rules

### Decisões de Design

**Por que OAC em vez de Static Website Hosting?**
- Maior segurança (buckets privados)
- Melhor alinhamento com boas práticas AWS
- Controle de acesso centralizado
- Proteção contra acesso direto

**Por que separar Dev e Prod?**
- Isolamento completo entre ambientes
- Testes seguros sem impacto em produção
- Configurações diferentes (WAF, cache, edge locations)

---

## Requisitos (8 principais)

1. **R1 - Frontend Dev S3 + CloudFront**: Ambiente dev isolado
2. **R2 - Frontend Prod S3 + CloudFront + WAF**: Ambiente prod protegido
3. **R3 - Separação Dev/Prod**: Isolamento completo
4. **R4 - Acesso Simples às URLs**: Outputs CDK e documentação
5. **R5 - Integração com APIs Backend**: Configuração de base URLs
6. **R6 - Deploy Simples**: Scripts PowerShell documentados
7. **R7 - Provisionamento via CDK**: Infraestrutura como código
8. **R8 - Documentação Operacional**: Guias completos

Todos os requisitos seguem padrão EARS com user stories e acceptance criteria.

---

## Plano de Implementação

### Fase 1 - Preparação (Tarefas 1-2)
- Mapear arquivos frontend existentes
- Definir estrutura de buckets

### Fase 2 - Infraestrutura (Tarefas 3-4)
- Criar FrontendStack CDK
- Integrar no bin/app.ts
- Deploy de dev e prod

### Fase 3 - Configuração (Tarefas 5-6)
- Sistema de configuração de APIs
- Scripts de deploy automatizados

### Fase 4 - Documentação (Tarefa 7)
- Guias operacionais
- Quick reference
- Troubleshooting

### Fase 5 - Validação (Tarefas 8-10)
- Testes de infraestrutura
- Testes funcionais
- Testes de segurança
- Monitoramento e alarmes

**Total: 10 tarefas principais, 21 sub-tarefas**

---

## Entregáveis

### Código
- `lib/frontend-stack.ts` - Stack CDK
- `bin/app.ts` - Integração da stack
- `scripts/deploy-frontend-dev.ps1` - Deploy dev
- `scripts/deploy-frontend-prod.ps1` - Deploy prod
- `scripts/generate-api-config.ps1` - Geração de config

### Documentação
- `docs/frontend/FRONTEND-DEPLOY-ALQUIMISTAAI.md` - Guia completo
- `docs/frontend/FRONTEND-QUICK-REFERENCE.md` - Referência rápida
- `docs/INDEX-OPERATIONS-AWS.md` - Atualização com seção frontend

### Infraestrutura
- 2 S3 Buckets (dev, prod)
- 2 CloudFront Distributions (dev, prod)
- 2 Origin Access Controls
- Alarmes CloudWatch
- Integração com WAF (prod)

---

## Outputs Esperados

Após deploy, os seguintes outputs estarão disponíveis:

**Dev:**
```
FrontendStack-dev.FrontendUrl = d1234567890abc.cloudfront.net
FrontendStack-dev.BucketName = alquimistaai-frontend-dev-123456789012
FrontendStack-dev.DistributionId = E1234567890ABC
```

**Prod:**
```
FrontendStack-prod.FrontendUrl = d0987654321xyz.cloudfront.net
FrontendStack-prod.BucketName = alquimistaai-frontend-prod-123456789012
FrontendStack-prod.DistributionId = E0987654321XYZ
```

---

## Segurança

### Controles Implementados

1. **Encryption at Rest**: SSE-S3 em todos os buckets
2. **Encryption in Transit**: HTTPS obrigatório (TLS 1.2+)
3. **Access Control**: Buckets privados, acesso via OAC
4. **WAF Protection**: Prod protegido contra ataques comuns
5. **Rate Limiting**: 1000 req/5min em produção
6. **Audit Logs**: CloudTrail e Access Logs habilitados

### Compliance

- ✅ Block Public Access habilitado
- ✅ Encryption obrigatória
- ✅ Versioning habilitado
- ✅ Logs de acesso configurados
- ✅ WAF em produção
- ✅ HTTPS obrigatório

---

## Performance

### Otimizações

1. **Cache CloudFront**:
   - HTML: 5 minutos
   - CSS/JS: 1 ano (com versionamento)
   - Imagens: 1 ano

2. **Compressão**:
   - Gzip/Brotli automático
   - Redução de ~70% no tamanho

3. **Edge Locations**:
   - Dev: NA + Europa (Price Class 100)
   - Prod: Global (Price Class All)

4. **HTTP/2 e HTTP/3**: Habilitado por padrão

### Métricas Esperadas

- **Latência**: < 100ms (p95)
- **Disponibilidade**: > 99.9%
- **Cache Hit Rate**: > 80%
- **4xx Error Rate**: < 5%
- **5xx Error Rate**: < 1%

---

## Custos Estimados

### Mensal (estimativa)

**Dev:**
- S3: ~$1 (1GB storage, 10k requests)
- CloudFront: ~$5 (10GB transfer, NA+EU)
- **Total Dev: ~$6/mês**

**Prod:**
- S3: ~$2 (2GB storage, 100k requests)
- CloudFront: ~$50 (100GB transfer, global)
- WAF: ~$5 (incluído na WAFStack)
- **Total Prod: ~$57/mês**

**Total Estimado: ~$63/mês**

*Nota: Custos reais dependem do tráfego e uso.*

---

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Cache desatualizado | Médio | Média | Invalidação automática após deploy |
| Custo inesperado | Alto | Baixa | Alarmes de custo + Budget |
| Ataque DDoS | Alto | Média | WAF + Rate Limiting + CloudFront Shield |
| Falha de deploy | Médio | Baixa | Versionamento S3 + Rollback documentado |
| Acesso não autorizado | Alto | Baixa | Buckets privados + OAC + WAF |

---

## Próximos Passos

### Imediato (Pós-Aprovação)

1. Executar Tarefa 1: Mapear arquivos frontend existentes
2. Executar Tarefa 2: Definir estrutura de buckets
3. Executar Tarefa 3: Criar FrontendStack CDK

### Curto Prazo (1-2 semanas)

1. Deploy de infraestrutura dev e prod
2. Criação de scripts de deploy
3. Documentação operacional

### Médio Prazo (1-2 meses)

1. Monitoramento e otimização
2. Integração com CI/CD
3. Domínio customizado (opcional)

---

## Aprovações

- [x] **Requisitos**: Aprovados em 18/11/2025
- [x] **Design**: Aprovado em 18/11/2025
- [x] **Tarefas**: Aprovadas em 18/11/2025

## Responsáveis

- **Spec Owner**: Kiro AI
- **Implementação**: A definir
- **Revisão Técnica**: A definir
- **Aprovação Final**: Marcello Hollanda

---

## Referências

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [CDK TypeScript Documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
- [Contexto Projeto AlquimistaAI](.kiro/steering/contexto-projeto-alquimista.md)
- [Blueprint Comercial](.kiro/steering/blueprint-comercial-assinaturas.md)

---

**Spec Version**: 1.0  
**Last Updated**: 18 de novembro de 2025  
**Status**: ✅ Aprovada e pronta para implementação
