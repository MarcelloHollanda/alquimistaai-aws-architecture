# 🎯 Deploy Manual do Frontend - Instruções

O backend já está funcionando na AWS. Agora vamos fazer deploy do frontend.

## ✅ Status Atual

- **Backend API (PROD)**: https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/
- **Frontend**: Build concluído com sucesso
- **Variáveis de ambiente**: Configuradas

## 🚀 Opções de Deploy

### Opção 1: Vercel (Recomendado)

```powershell
# 1. Fazer login no Vercel
cd frontend
vercel login

# 2. Deploy de produção
vercel --prod

# 3. Voltar para raiz
cd ..
```

### Opção 2: AWS Amplify

```powershell
# 1. Instalar Amplify CLI
npm install -g @aws-amplify/cli

# 2. Configurar Amplify
cd frontend
amplify init

# 3. Deploy
amplify publish

# 4. Voltar para raiz
cd ..
```

### Opção 3: Netlify

```powershell
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Fazer login
cd frontend
netlify login

# 3. Deploy
netlify deploy --prod --dir=.next

# 4. Voltar para raiz
cd ..
```

### Opção 4: Deploy Manual (S3 + CloudFront)

Já temos o build pronto em `frontend/.next`. Você pode:

1. Criar um bucket S3
2. Fazer upload dos arquivos
3. Configurar CloudFront
4. Apontar para o bucket

## 📊 Após o Deploy

### Testar a Integração

1. Acesse a URL do frontend
2. Teste o login
3. Verifique se o dashboard carrega
4. Teste a listagem de agentes

### Validar

```powershell
# Testar API
curl https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/health

# Validar integração
.\VALIDATE-INTEGRATION.ps1 -FrontendUrl "https://[SEU-APP].vercel.app"
```

## 🎉 Próximos Passos

Após o deploy:

1. Configure um domínio customizado
2. Adicione certificado SSL (automático no Vercel)
3. Configure variáveis de ambiente de produção
4. Monitore logs e métricas

---

**Nota**: O backend já está 100% funcional na AWS. Só precisamos fazer deploy do frontend!

