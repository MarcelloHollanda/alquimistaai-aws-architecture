# 🔑 Guia de Configuração de API Keys

## ✅ Status Atual

Todos os secrets foram criados no AWS Secrets Manager com valores vazios. Agora você precisa obter as API keys e configurá-las.

---

## 📋 Secrets Criados

| Secret | ARN | Status |
|--------|-----|--------|
| `fibonacci/mcp/whatsapp` | `arn:aws:secretsmanager:us-east-1:207933152643:secret:fibonacci/mcp/whatsapp-pUV9YZ` | ✅ Criado (vazio) |
| `fibonacci/mcp/enrichment` | `arn:aws:secretsmanager:us-east-1:207933152643:secret:fibonacci/mcp/enrichment-HHcs7i` | ✅ Criado (vazio) |
| `fibonacci/mcp/calendar` | `arn:aws:secretsmanager:us-east-1:207933152643:secret:fibonacci/mcp/calendar-OWnv4h` | ✅ Criado (vazio) |

---

## 🚀 Como Obter as API Keys

### 1. WhatsApp Business API

**O que você precisa:**
- Token de acesso da WhatsApp Business API

**Como obter:**
1. Acesse: https://developers.facebook.com/
2. Crie um app do tipo "Business"
3. Adicione o produto "WhatsApp"
4. Gere um token de acesso permanente
5. Copie o token

**Como configurar:**
```powershell
aws secretsmanager update-secret `
  --secret-id fibonacci/mcp/whatsapp `
  --secret-string '{\"apiKey\":\"SEU_TOKEN_WHATSAPP_AQUI\"}' `
  --region us-east-1
```

**Documentação:**
- https://developers.facebook.com/docs/whatsapp/business-management-api/get-started

---

### 2. Google Places API

**O que você precisa:**
- API Key do Google Cloud Platform

**Como obter:**
1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use existente)
3. Ative a API "Places API"
4. Vá em "Credenciais" → "Criar credenciais" → "Chave de API"
5. Copie a chave

**Como configurar:**
```powershell
aws secretsmanager update-secret `
  --secret-id fibonacci/mcp/enrichment `
  --secret-string '{\"googlePlacesApiKey\":\"SUA_CHAVE_GOOGLE_AQUI\",\"linkedInClientId\":\"\",\"linkedInClientSecret\":\"\",\"linkedInAccessToken\":\"\"}' `
  --region us-east-1
```

**Documentação:**
- https://developers.google.com/maps/documentation/places/web-service/get-api-key

**⚠️ IMPORTANTE:** Configure restrições de API key:
- Restrinja por IP ou domínio
- Limite às APIs necessárias (Places API)

---

### 3. LinkedIn API (Opcional)

**O que você precisa:**
- Client ID
- Client Secret
- Access Token

**Como obter:**
1. Acesse: https://www.linkedin.com/developers/
2. Crie um app
3. Configure OAuth 2.0
4. Obtenha as credenciais

**Como configurar:**
```powershell
aws secretsmanager update-secret `
  --secret-id fibonacci/mcp/enrichment `
  --secret-string '{\"googlePlacesApiKey\":\"SUA_CHAVE_GOOGLE\",\"linkedInClientId\":\"SEU_CLIENT_ID\",\"linkedInClientSecret\":\"SEU_CLIENT_SECRET\",\"linkedInAccessToken\":\"SEU_ACCESS_TOKEN\"}' `
  --region us-east-1
```

**Documentação:**
- https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication

**Nota:** LinkedIn é opcional. O sistema funciona sem ele.

---

### 4. Google Calendar API

**O que você precisa:**
- Client ID
- Client Secret
- Refresh Token

**Como obter:**
1. Acesse: https://console.cloud.google.com/
2. No mesmo projeto do Google Places
3. Ative a API "Google Calendar API"
4. Crie credenciais OAuth 2.0
5. Configure o fluxo OAuth para obter o refresh token

**Como configurar:**
```powershell
aws secretsmanager update-secret `
  --secret-id fibonacci/mcp/calendar `
  --secret-string '{\"clientId\":\"SEU_CLIENT_ID\",\"clientSecret\":\"SEU_CLIENT_SECRET\",\"refreshToken\":\"SEU_REFRESH_TOKEN\"}' `
  --region us-east-1
```

**Documentação:**
- https://developers.google.com/calendar/api/quickstart/nodejs

---

## 🔍 Verificar Configuração

Após configurar as API keys, verifique se estão corretas:

```powershell
# Verificar WhatsApp
aws secretsmanager get-secret-value --secret-id fibonacci/mcp/whatsapp --region us-east-1 --query SecretString --output text

# Verificar Enrichment
aws secretsmanager get-secret-value --secret-id fibonacci/mcp/enrichment --region us-east-1 --query SecretString --output text

# Verificar Calendar
aws secretsmanager get-secret-value --secret-id fibonacci/mcp/calendar --region us-east-1 --query SecretString --output text
```

---

## 💰 Custos Estimados

### AWS Secrets Manager
- **Armazenamento:** $0.40 por secret/mês
- **API calls:** $0.05 por 10.000 chamadas
- **Total estimado:** ~$1.50/mês para 3 secrets

### Google Places API
- **Gratuito:** 200 USD de crédito/mês
- **Text Search:** $32 por 1.000 requisições
- **Place Details:** $17 por 1.000 requisições
- **Recomendação:** Configure alertas de billing

### WhatsApp Business API
- **Varia por país e volume**
- **Brasil:** ~$0.05 por mensagem
- **Recomendação:** Monitore uso no Meta Business Manager

### LinkedIn API
- **Gratuito** para uso básico
- **Limitado** a 100 requisições/dia (tier gratuito)

---

## 🔒 Segurança

### Boas Práticas:

1. **Nunca commite API keys no Git**
   - Já configurado no `.gitignore`

2. **Rotacione as chaves regularmente**
   ```powershell
   # Agendar rotação automática (opcional)
   aws secretsmanager rotate-secret --secret-id fibonacci/mcp/whatsapp --region us-east-1
   ```

3. **Configure alertas de uso**
   - Google Cloud: Configure alertas de billing
   - AWS: Configure CloudWatch alarms

4. **Restrinja permissões**
   - Use IAM roles com least privilege
   - Configure IP whitelisting quando possível

5. **Monitore logs**
   ```powershell
   # Ver logs de acesso aos secrets
   aws cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceName,AttributeValue=fibonacci/mcp/whatsapp --region us-east-1
   ```

---

## 🧪 Testar Integrações

Após configurar as API keys, teste cada integração:

### Teste WhatsApp:
```typescript
import { createWhatsAppMCPServer } from './mcp-integrations/servers/whatsapp';

const whatsapp = createWhatsAppMCPServer();
await whatsapp.sendMessage({
  to: '+5511987654321',
  message: 'Teste de integração'
});
```

### Teste Google Places:
```typescript
import { createEnrichmentMCPServer } from './mcp-integrations/servers/enrichment';

const enrichment = createEnrichmentMCPServer();
await enrichment.lookupPlaces({
  query: 'Empresa Exemplo São Paulo'
});
```

### Teste CNPJ (Receita Federal):
```typescript
const enrichment = createEnrichmentMCPServer();
await enrichment.lookupCNPJ({
  cnpj: '00.000.000/0001-91'
});
```

**Nota:** A API da Receita Federal é gratuita e não requer API key!

---

## 📞 Suporte

Se tiver problemas:

1. **Verifique os logs:**
   ```powershell
   aws logs tail /aws/lambda/fibonacci --follow --region us-east-1
   ```

2. **Teste conectividade:**
   ```powershell
   # Teste se consegue acessar os secrets
   aws secretsmanager describe-secret --secret-id fibonacci/mcp/whatsapp --region us-east-1
   ```

3. **Consulte a documentação:**
   - [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
   - [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
   - [Google Places API](https://developers.google.com/maps/documentation/places)

---

## ✅ Checklist de Configuração

- [ ] Criar conta no Meta for Developers
- [ ] Obter WhatsApp Business API token
- [ ] Configurar secret `fibonacci/mcp/whatsapp`
- [ ] Criar projeto no Google Cloud Platform
- [ ] Ativar Google Places API
- [ ] Obter Google Places API key
- [ ] Configurar secret `fibonacci/mcp/enrichment`
- [ ] (Opcional) Configurar LinkedIn API
- [ ] (Opcional) Configurar Google Calendar API
- [ ] Testar cada integração
- [ ] Configurar alertas de billing
- [ ] Configurar monitoramento de logs

---

## 🎯 Próximos Passos

Depois de configurar as API keys:

1. **Testar as integrações localmente**
2. **Fazer deploy das atualizações**
3. **Configurar monitoramento**
4. **Implementar os fluxos de negócio**

**Comando para re-deploy após configurar:**
```powershell
$env:CDK_DEFAULT_ACCOUNT='207933152643'
$env:CDK_DEFAULT_REGION='us-east-1'
cdk deploy --require-approval never
```
