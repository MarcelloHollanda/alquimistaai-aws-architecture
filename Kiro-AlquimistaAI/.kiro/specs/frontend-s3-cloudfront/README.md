# Spec: Frontend S3 + CloudFront + WAF (AlquimistaAI)

## Visão Geral

Esta spec define a arquitetura oficial para o frontend web estático do AlquimistaAI, incluindo:

- **Buckets S3** para hospedar arquivos estáticos (dev e prod)
- **CloudFront Distributions** para entrega de conteúdo com baixa latência
- **Integração com WAF** para proteção em produção
- **Documentação operacional** para deploy e manutenção

## Contexto

O projeto AlquimistaAI possui páginas estáticas comerciais (`index.html`, `produtos.html`, `fibonacci.html`) que atualmente existem apenas localmente. Esta spec define como essas páginas serão hospedadas na AWS com:

- URLs públicas estáveis para dev e prod
- Proteção WAF em produção
- Integração com APIs backend (Fibonacci, Nigredo)
- Processo de deploy documentado

## Escopo

### Dentro do Escopo
- Infraestrutura S3 + CloudFront (dev/prod)
- Integração com WAFStack existente
- Configuração de base URLs das APIs
- Documentação operacional

### Fora do Escopo
- Domínio customizado (ex: app.alquimistaai.com)
- Certificados ACM para domínio próprio
- Build de frameworks SPA (Next.js, React)

## Documentos da Spec

1. **requirements.md** - Requisitos funcionais e não-funcionais
2. **design.md** - Arquitetura detalhada da solução
3. **tasks.md** - Plano de implementação passo a passo

## Status

- [x] Requisitos definidos
- [x] Design aprovado
- [ ] Implementação pendente

## Próximos Passos

Após aprovação desta spec, a implementação será realizada através da tarefa:
> "Kiro · Tarefa — Implementar FrontendStack (S3 + CloudFront + WAF) e expor as URLs dev/prod para o sistema AlquimistaAI."
