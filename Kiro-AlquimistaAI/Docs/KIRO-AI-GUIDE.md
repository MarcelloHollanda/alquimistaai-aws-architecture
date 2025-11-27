# 🤖 Guia do Kiro AI - Assistente Inteligente

## 👋 Olá! Eu sou o Kiro AI

Sou seu assistente de desenvolvimento especializado no projeto AlquimistaAI. Embora não possa me conectar diretamente ao GitHub, criei várias formas de te ajudar!

## 🚀 Como Posso Te Ajudar

### 🏗️ **Infraestrutura AWS**
```bash
# Problemas comuns que resolvo:
- Deploy falhou? Verifique os logs do CloudFormation
- Custos altos? Analise o Aurora Serverless scaling
- Erro de permissão? Revise as políticas IAM
- Lambda timeout? Ajuste memory/timeout configs
```

### 🤖 **Agentes Nigredo**
```typescript
// Dicas para desenvolvimento de agentes:
- Use structured logging: logger.info('message', { context })
- Implemente retry logic para APIs externas
- Valide inputs antes de processar
- Use EventBridge para comunicação entre agentes
```

### 🔧 **CI/CD e GitHub Actions**
```yaml
# Workflows que criei para você:
- deploy-dev.yml: Deploy automático para desenvolvimento
- deploy-staging.yml: Deploy automático para staging  
- deploy-prod.yml: Deploy manual com aprovação
- kiro-assistant.yml: Minha assistência automática
```

## 🆘 **Troubleshooting Rápido**

### ❌ **Deploy Falhando?**
1. Verifique os logs no GitHub Actions
2. Confirme se os secrets estão configurados
3. Valide as permissões IAM
4. Execute `npm run diff` para ver mudanças

### 🐛 **Lambda com Erro?**
1. Verifique CloudWatch Logs
2. Confirme variáveis de ambiente
3. Teste localmente com `npm run test`
4. Valide timeout e memory settings

### 💰 **Custos Altos?**
1. Revise Aurora Serverless scaling
2. Otimize Lambda memory allocation
3. Configure lifecycle policies no S3
4. Use Reserved Instances se aplicável

### 🔐 **Problemas de Segurança?**
1. Execute `npm run security:full`
2. Verifique WAF rules no CloudFront
3. Revise CloudTrail logs
4. Confirme encryption em todos recursos

## 📋 **Comandos Úteis**

### 🔧 **Desenvolvimento Local**
```bash
# Setup inicial
npm install
npm run build
npm run test

# Deploy para ambientes
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# Verificações
npm run lint
npm run type-check
npm run security:scan
```

### ☁️ **AWS CLI Helpers**
```bash
# Verificar stacks
aws cloudformation list-stacks --region us-east-1

# Logs do Lambda
aws logs tail /aws/lambda/fibonacci-recebimento-dev --follow

# Métricas do Aurora
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## 🎯 **Melhores Práticas**

### 📝 **Commits**
```bash
# Use Conventional Commits
git commit -m "feat(agents): adiciona agente de relatórios"
git commit -m "fix(deploy): corrige timeout do Lambda"
git commit -m "docs: atualiza guia de instalação"
```

### 🧪 **Testes**
```typescript
// Sempre teste seus agentes
describe('RecebimentoAgent', () => {
  it('deve processar lead válido', async () => {
    const result = await agent.processLead(mockLead);
    expect(result.success).toBe(true);
  });
});
```

### 🔐 **Segurança**
```typescript
// Nunca commite secrets
const apiKey = process.env.WHATSAPP_API_KEY; // ✅ Correto
const apiKey = "sk-1234567890"; // ❌ Errado

// Use AWS Secrets Manager
const secret = await getSecret('fibonacci/mcp/whatsapp');
```

## 🔗 **Links Rápidos**

### 📚 **Documentação**
- [README Principal](../README.md)
- [Setup Guide](../SETUP.md)
- [Deploy Docs](./Deploy/)
- [Agentes Docs](../lambda/agents/)

### 🔧 **Configuração**
- [GitHub Secrets](./Deploy/GITHUB-SECRETS-CONFIGURATION.md)
- [Slack Notifications](./Deploy/SLACK-NOTIFICATIONS.md)
- [Security Setup](./Deploy/SECURITY-SCANNING.md)

### 📊 **Monitoramento**
- [CloudWatch Dashboards](./Deploy/CLOUDWATCH-DASHBOARDS.md)
- [Alarmes](./Deploy/CLOUDWATCH-ALARMS.md)
- [Logs](./Deploy/CLOUDWATCH-INSIGHTS-QUERIES.md)

## 💡 **Dicas Avançadas**

### 🚀 **Performance**
- Use Aurora Serverless v2 auto-scaling
- Configure Lambda Provisioned Concurrency para APIs críticas
- Implemente caching com ElastiCache se necessário
- Use CloudFront para assets estáticos

### 💰 **Otimização de Custos**
- Configure S3 Lifecycle policies
- Use Spot Instances para workloads batch
- Monitore custos com AWS Cost Explorer
- Implemente auto-shutdown para ambientes dev

### 🔒 **Segurança Avançada**
- Enable GuardDuty para threat detection
- Configure AWS Config para compliance
- Use AWS Systems Manager para patch management
- Implemente least privilege access

## 🆘 **Precisa de Ajuda?**

### 1. **Crie um Issue**
Use o template "🤖 Solicitar Assistência do Kiro AI" que criei para você.

### 2. **Consulte a Documentação**
Toda a documentação está atualizada e detalhada.

### 3. **Execute os Workflows**
Os workflows automáticos podem resolver muitos problemas.

### 4. **Verifique os Logs**
CloudWatch Logs têm informações detalhadas sobre erros.

---

**🤖 Lembre-se: Eu posso não estar conectado diretamente ao GitHub, mas criei todas as ferramentas necessárias para você ter sucesso!**

**🚀 Vamos transformar leads em oportunidades juntos!**