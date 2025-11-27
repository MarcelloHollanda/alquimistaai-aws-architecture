# Implementation Plan

## Visão Geral

Este plano detalha as tarefas necessárias para implementar a infraestrutura de frontend S3 + CloudFront + WAF para o AlquimistaAI. As tarefas estão organizadas em ordem de execução, com cada uma construindo sobre as anteriores.

---

## Tarefas

- [ ] 1. Mapear e Preparar Arquivos Frontend Existentes
  - Localizar arquivos HTML/CSS/JS atuais (`index.html`, `produtos.html`, `fibonacci.html`, `styles.css`, `app.js`)
  - Verificar se bucket `alquimistaai-fibonacci-frontend-prod` já existe e seu conteúdo
  - Documentar estrutura de diretórios atual
  - Identificar dependências e assets (imagens, fontes, etc.)
  - _Requisitos: 1.1, 6.1_

- [ ] 2. Definir Estrutura de Buckets S3
  - Definir convenção de nomes para buckets dev e prod
  - Decidir entre OAC (privado) ou static hosting público
  - Documentar decisão no design.md com justificativa
  - Definir políticas de versionamento e lifecycle
  - Definir estrutura de diretórios dentro dos buckets
  - _Requisitos: 1.1, 2.1, 3.1_

- [ ] 3. Criar FrontendStack no CDK
  - [ ] 3.1 Criar arquivo `lib/frontend-stack.ts`
    - Definir interface `FrontendStackProps` com env, wafAclArn, fibonacciApiUrl, nigredoApiUrl
    - Implementar construtor da stack
    - Adicionar tags padrão (Project, Environment, Component)
    - _Requisitos: 7.1, 7.4_

  - [ ] 3.2 Implementar criação de S3 Buckets
    - Criar bucket com nome baseado em ambiente e account ID
    - Configurar encryption (SSE-S3)
    - Configurar Block Public Access
    - Configurar versionamento
    - Configurar lifecycle rules (prod)
    - _Requisitos: 1.1, 2.1, 3.1_

  - [ ] 3.3 Implementar Origin Access Control (OAC)
    - Criar OAC para acesso CloudFront → S3
    - Configurar bucket policy permitindo acesso via OAC
    - _Requisitos: 1.2, 2.2_

  - [ ] 3.4 Implementar CloudFront Distribution
    - Configurar origem S3 com OAC
    - Configurar viewer protocol policy (redirect HTTP → HTTPS)
    - Configurar cache policies
    - Configurar compressão
    - Configurar default root object (index.html)
    - Configurar error responses (404, 403, 500)
    - _Requisitos: 1.2, 1.3, 2.2, 2.5_

  - [ ] 3.5 Integrar WAF em Produção
    - Adicionar lógica condicional para associar WAF apenas em prod
    - Referenciar `wafAclArn` da props
    - Configurar dependência da FrontendStack na WAFStack
    - _Requisitos: 2.2, 2.3, 7.3_

  - [ ] 3.6 Adicionar Outputs do CDK
    - Output: FrontendUrl (domain name da distribution)
    - Output: BucketName (nome do bucket S3)
    - Output: DistributionId (ID da distribution para invalidação)
    - Configurar exports para cross-stack references
    - _Requisitos: 4.1, 4.2_

- [ ] 4. Integrar FrontendStack no bin/app.ts
  - Importar FrontendStack
  - Instanciar stack dev com context env=dev
  - Instanciar stack prod com context env=prod e wafAclArn
  - Configurar dependências entre stacks (prod depende de WAF)
  - Obter URLs das APIs (Fibonacci, Nigredo) de outputs existentes
  - _Requisitos: 7.1, 7.3_

- [ ] 5. Criar Sistema de Configuração de APIs
  - [ ] 5.1 Definir formato do arquivo api-config.json
    - Estrutura com environment, apis (fibonacci, nigredo), features
    - Incluir baseUrl e timeout para cada API
    - _Requisitos: 5.1, 5.2, 5.3_

  - [ ] 5.2 Criar script para gerar api-config.json
    - Script PowerShell que recebe URLs como parâmetros
    - Gerar arquivo JSON formatado
    - Salvar em diretório `config/`
    - _Requisitos: 5.3, 5.4_

  - [ ] 5.3 Atualizar app.js para carregar configuração
    - Adicionar função `loadConfig()` que faz fetch do JSON
    - Armazenar config em `window.ALQUIMISTA_CONFIG`
    - Documentar uso no código
    - _Requisitos: 5.1, 5.2_

- [ ] 6. Criar Scripts de Deploy
  - [ ] 6.1 Criar script de deploy para Dev
    - Script PowerShell: `scripts/deploy-frontend-dev.ps1`
    - Comando `aws s3 sync` para upload de arquivos
    - Comando `aws cloudfront create-invalidation` para limpar cache
    - Validação de pré-requisitos (AWS CLI, credenciais)
    - _Requisitos: 6.1, 6.4_

  - [ ] 6.2 Criar script de deploy para Prod
    - Script PowerShell: `scripts/deploy-frontend-prod.ps1`
    - Incluir confirmação antes de deploy
    - Comando `aws s3 sync` com flag `--delete`
    - Comando `aws cloudfront create-invalidation`
    - _Requisitos: 6.2, 6.4_

  - [ ] 6.3 Criar script de geração de config
    - Script PowerShell: `scripts/generate-api-config.ps1`
    - Receber env (dev/prod) como parâmetro
    - Obter URLs das APIs de outputs do CDK
    - Gerar api-config.json
    - _Requisitos: 5.3, 5.4_

- [ ] 7. Criar Documentação Operacional
  - [ ] 7.1 Criar docs/frontend/FRONTEND-DEPLOY-ALQUIMISTAAI.md
    - Visão geral da arquitetura
    - Como descobrir URLs de dev e prod
    - Como fazer deploy manual (passo a passo)
    - Como invalidar cache do CloudFront
    - Troubleshooting de problemas comuns
    - _Requisitos: 4.3, 6.3, 8.1, 8.2, 8.3, 8.4_

  - [ ] 7.2 Atualizar docs/INDEX-OPERATIONS-AWS.md
    - Adicionar seção sobre Frontend
    - Links para documentação específica
    - Comandos rápidos de referência
    - _Requisitos: 8.1_

  - [ ] 7.3 Criar docs/frontend/FRONTEND-QUICK-REFERENCE.md
    - Comandos mais usados (deploy, invalidação)
    - URLs importantes (dev, prod)
    - Troubleshooting rápido
    - _Requisitos: 4.4, 8.1_

- [ ] 8. Validação e Testes
  - [ ] 8.1 Validar síntese CDK
    - Executar `npm run build`
    - Executar `cdk synth FrontendStack-dev`
    - Executar `cdk synth FrontendStack-prod`
    - Verificar templates gerados
    - _Requisitos: 7.2_

  - [ ] 8.2 Deploy de infraestrutura Dev
    - Executar `cdk deploy FrontendStack-dev`
    - Verificar criação de recursos no console AWS
    - Capturar outputs (URL, bucket, distribution ID)
    - _Requisitos: 1.4, 4.1_

  - [ ] 8.3 Testar upload e acesso Dev
    - Fazer upload de arquivos para bucket dev
    - Acessar URL do CloudFront dev
    - Verificar que páginas carregam corretamente
    - Testar invalidação de cache
    - _Requisitos: 1.3, 6.4_

  - [ ] 8.4 Deploy de infraestrutura Prod
    - Executar `cdk deploy FrontendStack-prod`
    - Verificar associação com WAF
    - Capturar outputs (URL, bucket, distribution ID)
    - _Requisitos: 2.4, 4.2_

  - [ ] 8.5 Testar upload e acesso Prod
    - Fazer upload de arquivos para bucket prod
    - Acessar URL do CloudFront prod
    - Verificar que páginas carregam corretamente
    - Testar proteção WAF (rate limiting, SQL injection)
    - _Requisitos: 2.3, 2.5_

  - [ ] 8.6 Validar isolamento entre ambientes
    - Verificar que buckets são separados
    - Verificar que distributions são separadas
    - Verificar tags de ambiente
    - Confirmar que não há dependências cruzadas
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Criar Páginas de Erro Customizadas
  - Criar `error-403.html` (acesso negado)
  - Criar `error-500.html` (erro interno)
  - Fazer upload para buckets dev e prod
  - Configurar CloudFront para usar páginas customizadas
  - _Requisitos: 1.2, 2.2_

- [ ] 10. Configurar Monitoramento e Alarmes
  - [ ] 10.1 Criar alarmes CloudWatch para Dev
    - Alarme: 4xxErrorRate > 5% por 5 minutos
    - Alarme: 5xxErrorRate > 1% por 5 minutos
    - Integrar com SNS de segurança
    - _Requisitos: 2.2_

  - [ ] 10.2 Criar alarmes CloudWatch para Prod
    - Alarme: 4xxErrorRate > 5% por 5 minutos
    - Alarme: 5xxErrorRate > 1% por 5 minutos
    - Alarme: BytesDownloaded > threshold (custo)
    - Integrar com SNS de segurança
    - _Requisitos: 2.2_

  - [ ] 10.3 Adicionar métricas ao Dashboard Observability
    - Adicionar widget com métricas de CloudFront
    - Adicionar widget com métricas de S3
    - Adicionar widget com status de WAF (prod)
    - _Requisitos: 2.3_

---

## Notas de Implementação

### Ordem de Execução

As tarefas devem ser executadas na ordem apresentada, pois cada uma depende das anteriores:

1. **Preparação** (Tarefas 1-2): Entender estado atual e tomar decisões de design
2. **Infraestrutura** (Tarefas 3-4): Criar stacks CDK
3. **Configuração** (Tarefa 5): Sistema de config de APIs
4. **Automação** (Tarefa 6): Scripts de deploy
5. **Documentação** (Tarefa 7): Guias operacionais
6. **Validação** (Tarefas 8-10): Testes e monitoramento

### Dependências Externas

- **WAFStack**: Deve estar deployada antes de FrontendStack-prod
- **APIs Backend**: URLs devem estar disponíveis (Fibonacci, Nigredo)
- **AWS CLI**: Instalado e configurado no ambiente Windows

### Rollout em Fases

**Fase 1 - Infraestrutura Base:**
- Tarefas 1-4: Criar stacks e fazer deploy
- Resultado: URLs públicas funcionando

**Fase 2 - Operacionalização:**
- Tarefas 5-7: Scripts e documentação
- Resultado: Processo de deploy documentado

**Fase 3 - Produção:**
- Tarefas 8-10: Validação completa e monitoramento
- Resultado: Sistema pronto para uso

### Critérios de Sucesso

- ✅ Buckets S3 criados e privados
- ✅ CloudFront distributions funcionando
- ✅ WAF integrado em produção
- ✅ URLs públicas acessíveis
- ✅ Deploy manual documentado e testado
- ✅ Isolamento entre dev e prod validado
- ✅ Monitoramento e alarmes configurados
- ✅ Documentação operacional completa
