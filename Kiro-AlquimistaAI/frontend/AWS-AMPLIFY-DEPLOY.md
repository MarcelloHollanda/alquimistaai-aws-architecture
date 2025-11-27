# 🚀 Deploy no AWS Amplify - Guia Completo

## 📋 Visão Geral

AWS Amplify é ideal para integração com o ecossistema AWS existente do AlquimistaAI.

---

## 🎯 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que os arquivos estão commitados:
```bash
git add .
git commit -m "Preparar frontend para deploy no Amplify"
git push origin main
```

### 2. Acessar AWS Amplify Console

1. Acesse [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Clique em **"New app"** > **"Host web app"**
3. Selecione seu provedor Git (GitHub, GitLab, Bitbucket, etc.)

### 3. Conectar Repositório

1. Autorize o AWS Amplify a acessar seu repositório
2. Selecione o repositório: `Kiro-AlquimistaAI`
3. Selecione a branch: `main`
4. Clique em **"Next"**

### 4. Configurar Build Settings

**IMPORTANTE: Este é um MONOREPO!**

O Amplify detectará automaticamente o Next.js. Configure assim:

```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
```

**Configurações importantes:**
- **App name**: `alquimista-ai-frontend`
- **Environment**: `production`
- **Branch**: `main`
- **Monorepo**: ✅ ATIVE esta opção
- **Base directory**: `frontend` ← IMPORTANTE!
- **Build command**: `npm run build`
- **Output directory**: `.next`

### 5. Configurar Variáveis de Ambiente

Clique em **"Advanced settings"** e adicione:

```bash
# Obrigatória
NEXT_PUBLIC_API_URL=https://api.alquimista.ai

# Opcional
NODE_ENV=production
_LIVE_UPDATES=[{"name":"Next.js version","pkg":"next","type":"internal","version":"latest"}]
```

### 6. Revisar e Deploy

1. Revise todas as configurações
2. Clique em **"Save and deploy"**
3. Aguarde o build (5-10 minutos)

---

## 🔧 Configurações Avançadas

### Domínio Customizado

1. No console do Amplify, vá em **"Domain management"**
2. Clique em **"Add domain"**
3. Configure:
   - **Domain**: `alquimista.ai`
   - **Subdomain**: `app` (opcional)
4. Configure DNS conforme instruções

### SSL/TLS

- SSL é configurado automaticamente pelo Amplify
- Certificado gerenciado via AWS Certificate Manager
- Renovação automática

### Variáveis de Ambiente por Branch

```bash
# Produção (main)
NEXT_PUBLIC_API_URL=https://api.alquimista.ai

# Staging (develop)
NEXT_PUBLIC_API_URL=https://api-staging.alquimista.ai

# Development (dev)
NEXT_PUBLIC_API_URL=https://api-dev.alquimista.ai
```

### Build Settings Customizados

Se precisar customizar o build, edite `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - echo "Installing dependencies..."
    build:
      commands:
        - npm run build
        - echo "Build completed!"
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## 🔄 Deploy Automático

### Configurar CI/CD

O Amplify já configura CI/CD automaticamente:
- ✅ Deploy automático a cada push na branch `main`
- ✅ Preview de PRs (opcional)
- ✅ Rollback automático em caso de falha

### Habilitar Preview de PRs

1. Vá em **"Previews"** no console
2. Ative **"Enable pull request previews"**
3. Selecione as branches para preview

---

## 📊 Monitoramento

### Métricas Disponíveis

No console do Amplify, você pode monitorar:
- **Build duration**: Tempo de build
- **Deploy duration**: Tempo de deploy
- **Traffic**: Tráfego da aplicação
- **Errors**: Erros de build/runtime

### CloudWatch Integration

O Amplify se integra automaticamente com CloudWatch:
- Logs de build
- Logs de acesso
- Métricas de performance

---

## 🚨 Troubleshooting

### Build Falha

**Erro: "npm ci failed"**
```bash
# Solução: Verificar package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

**Erro: "Build timeout"**
```bash
# Solução: Aumentar timeout no console
# Settings > Build settings > Build timeout: 30 minutos
```

### Deploy Falha

**Erro: "Deployment failed"**
1. Verifique logs no console do Amplify
2. Confirme que o build local funciona: `npm run build`
3. Verifique variáveis de ambiente

### Performance Issues

**Página carrega lentamente**
1. Ative cache no CloudFront (automático)
2. Otimize imagens
3. Use `next/image` para otimização automática

---

## 💰 Custos Estimados

### Tier Gratuito (12 meses)
- 1000 build minutes/mês
- 15 GB armazenamento
- 15 GB transferência

### Após Tier Gratuito
- Build: $0.01/minuto
- Hosting: $0.15/GB armazenado
- Data transfer: $0.15/GB

**Estimativa mensal**: $5-20 (dependendo do tráfego)

---

## 🔐 Segurança

### Headers de Segurança

Configurados automaticamente via `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### WAF (Web Application Firewall)

Para adicionar WAF:
1. Vá em **"Access control"** no console
2. Ative **"AWS WAF"**
3. Configure regras de proteção

---

## 🎯 Integração com Backend AWS

### Conectar com API Gateway

```typescript
// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAgents() {
  const response = await fetch(`${API_URL}/agents`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
```

### Configurar CORS no Backend

No API Gateway, adicione:
```json
{
  "Access-Control-Allow-Origin": "https://alquimista.ai",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
}
```

---

## 📞 Comandos Úteis

### Via AWS CLI

```bash
# Listar apps
aws amplify list-apps

# Iniciar build manual
aws amplify start-job \
  --app-id <app-id> \
  --branch-name main \
  --job-type RELEASE

# Ver status do build
aws amplify get-job \
  --app-id <app-id> \
  --branch-name main \
  --job-id <job-id>
```

---

## ✅ Checklist de Deploy

### Antes do Deploy
- [x] Build local funciona
- [x] Variáveis de ambiente definidas
- [ ] Repositório Git configurado
- [ ] Backend AWS funcionando
- [ ] Domínio registrado (opcional)

### Durante o Deploy
- [ ] Conectar repositório
- [ ] Configurar build settings
- [ ] Adicionar variáveis de ambiente
- [ ] Iniciar deploy

### Após o Deploy
- [ ] Verificar URL do Amplify
- [ ] Testar funcionalidades principais
- [ ] Configurar domínio customizado
- [ ] Configurar monitoramento
- [ ] Documentar URLs

---

## 🎉 Próximos Passos

1. **Configurar domínio**: `app.alquimista.ai`
2. **Habilitar preview de PRs**: Para testar antes de mergear
3. **Configurar alarmes**: CloudWatch para monitoramento
4. **Otimizar performance**: Cache e CDN
5. **Configurar backup**: Snapshots automáticos

---

## 📚 Recursos

- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [Next.js on Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [Amplify CLI](https://docs.amplify.aws/cli/)

---

**Status**: Pronto para deploy no AWS Amplify! 🚀
**Tempo estimado**: 10-15 minutos
**Custo estimado**: $5-20/mês
