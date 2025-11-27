# ✅ Checklist Final de Deploy - Produção

Este checklist deve ser seguido antes de qualquer deploy para produção do Ecossistema Alquimista.AI.

## 📋 Pré-Deploy

### 🔍 Validações de Código
- [ ] Código compilado sem erros (`npm run build`)
- [ ] Todos os testes passando (`npm test`)
- [ ] Linter sem erros (`npm run lint`)
- [ ] Cobertura de testes ≥ 80%
- [ ] Security scan sem vulnerabilidades críticas (`npm run security:scan`)
- [ ] Dependências atualizadas e sem vulnerabilidades (`npm audit`)

### 🏗️ Validações de Infraestrutura
- [ ] CDK diff revisado (`npm run diff -- --context env=prod`)
- [ ] Todas as stacks existem e estão saudáveis
- [ ] Funções Lambda configuradas corretamente
- [ ] Banco Aurora disponível e com backup habilitado
- [ ] Buckets S3 com versionamento e criptografia
- [ ] VPC e Security Groups configurados

### 🔒 Validações de Segurança
- [ ] Nenhum secret hardcoded no código
- [ ] Todas as credenciais no Secrets Manager
- [ ] IAM roles seguem princípio de menor privilégio
- [ ] Criptografia habilitada em todos os recursos
- [ ] WAF configurado no CloudFront
- [ ] CloudTrail habilitado e funcionando

### 📊 Validações de Monitoramento
- [ ] CloudWatch dashboards criados
- [ ] Alarmes críticos configurados
- [ ] X-Ray tracing habilitado
- [ ] Logs estruturados implementados
- [ ] Métricas de negócio configuradas

### 💾 Validações de Backup
- [ ] Aurora com backup automático (≥7 dias)
- [ ] S3 com versionamento habilitado
- [ ] Secrets com rotação configurada
- [ ] Procedimentos de restore documentados

## 🚀 Processo de Deploy

### 1. Preparação
```bash
# Validar ambiente
npm run validate:final

# Criar backup das stacks atuais
npm run stack:version:create FibonacciStack prod cdk.out/FibonacciStack-prod.template.json "Pre-deploy backup"
npm run stack:version:create NigredoStack prod cdk.out/NigredoStack-prod.template.json "Pre-deploy backup"
npm run stack:version:create AlquimistaStack prod cdk.out/AlquimistaStack-prod.template.json "Pre-deploy backup"
```

### 2. Deploy
```bash
# Deploy com validação completa
npm run deploy:prod:complete
```

### 3. Validação Pós-Deploy
- [ ] Health check da API (`curl https://api.alquimista.ai/health`)
- [ ] Verificar logs das Lambdas
- [ ] Confirmar alarmes não disparados
- [ ] Testar fluxo crítico end-to-end
- [ ] Verificar métricas no dashboard

### 4. Documentação
```bash
# Gerar documentação dos outputs
npm run document:outputs:prod
```

## 🧪 Smoke Tests

### API Principal
```bash
# Health check
curl -f https://api.alquimista.ai/health

# Teste de evento
curl -X POST https://api.alquimista.ai/events \
  -H "Content-Type: application/json" \
  -d '{"source": "test", "type": "smoke-test", "detail": {"test": true}}'
```

### Agentes Nigredo
- [ ] Agente de Recebimento: Processar lead de teste
- [ ] Agente de Estratégia: Criar campanha de teste
- [ ] Agente de Disparo: Verificar rate limiting
- [ ] Agente de Atendimento: Processar resposta de teste
- [ ] Agente de Sentimento: Analisar texto de teste
- [ ] Agente de Agendamento: Consultar disponibilidade
- [ ] Agente de Relatórios: Gerar relatório de teste

### Integrações MCP
- [ ] WhatsApp Business API: Enviar mensagem de teste
- [ ] Google Calendar: Consultar disponibilidade
- [ ] Receita Federal: Buscar CNPJ de teste
- [ ] Google Places: Buscar empresa de teste

## 📊 Métricas de Sucesso

### Performance
- [ ] API latency p95 < 3s
- [ ] Lambda cold start < 2s
- [ ] Database query time < 50ms
- [ ] Error rate < 1%

### Disponibilidade
- [ ] API uptime > 99.9%
- [ ] Database uptime > 99.9%
- [ ] Todos os alarmes em estado OK

### Custos
- [ ] Custos dentro do budget esperado
- [ ] Nenhum recurso com custos inesperados

## 🔄 Rollback Plan

### Critérios para Rollback
- Error rate > 5%
- Latency p95 > 10s
- Qualquer alarme crítico disparado
- Falha em smoke tests

### Processo de Rollback
```bash
# Rollback automático via blue-green
npm run blue-green-deploy fibonacci-api-handler

# Rollback manual via versioning
npm run stack:version:rollback FibonacciStack prod <previous-version>

# Verificar health após rollback
curl -f https://api.alquimista.ai/health
```

## 📞 Contatos de Emergência

### Equipe Técnica
- **Tech Lead**: tech-lead@alquimista.ai
- **DevOps**: devops@alquimista.ai
- **On-call**: +55 11 99999-9999

### Escalação
1. **Nível 1**: Desenvolvedor responsável
2. **Nível 2**: Tech Lead
3. **Nível 3**: CTO

### Canais de Comunicação
- **Slack**: #alquimista-ai-incidents
- **Email**: incidents@alquimista.ai
- **WhatsApp**: Grupo "Alquimista AI - Ops"

## 📚 Documentação Pós-Deploy

### Atualizar Documentação
- [ ] README.md com novas funcionalidades
- [ ] CHANGELOG.md com mudanças
- [ ] Documentação de APIs
- [ ] Guias de troubleshooting

### Comunicação
- [ ] Notificar equipe de sucesso do deploy
- [ ] Atualizar status page (se aplicável)
- [ ] Comunicar mudanças aos usuários

## 🎯 Critérios de Aceitação

### Deploy Considerado Bem-Sucedido Quando:
- [ ] Todos os itens deste checklist foram verificados
- [ ] Smoke tests passaram
- [ ] Métricas dentro dos SLAs
- [ ] Nenhum alarme crítico ativo
- [ ] Documentação atualizada
- [ ] Equipe notificada

### Deploy Considerado Falhado Quando:
- [ ] Qualquer smoke test falhou
- [ ] Error rate > 5%
- [ ] Latency fora do SLA
- [ ] Alarmes críticos disparados
- [ ] Rollback necessário

---

## 📝 Log de Deploy

**Data**: ___________  
**Responsável**: ___________  
**Versão**: ___________  
**Commit**: ___________  

### Checklist Executado
- [ ] Pré-deploy validado
- [ ] Deploy executado
- [ ] Pós-deploy validado
- [ ] Smoke tests executados
- [ ] Documentação atualizada

### Observações
```
[Espaço para observações específicas do deploy]
```

### Assinatura
**Responsável pelo Deploy**: ___________  
**Data/Hora**: ___________  

---

*Este checklist deve ser seguido rigorosamente para garantir deploys seguros e confiáveis em produção.*