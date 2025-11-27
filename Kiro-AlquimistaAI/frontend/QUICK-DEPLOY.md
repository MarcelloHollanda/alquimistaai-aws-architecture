# 🚀 Deploy Rápido - AlquimistaAI Frontend

## ✅ Status: Pronto para Deploy!

O build está funcionando perfeitamente. Escolha uma das opções abaixo:

---

## 🔵 Opção 1: Vercel (Mais Rápido - Recomendado)

### Via Interface Web
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe seu repositório
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Adicione variáveis de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://api.alquimista.ai
   NODE_ENV=production
   ```

6. Clique em "Deploy"

### Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

**Tempo estimado**: 3-5 minutos

---

## 🟢 Opção 2: Netlify

### Via Interface Web
1. Acesse [netlify.com](https://netlify.com)
2. Clique em "Add new site"
3. Importe seu repositório
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`

5. Adicione variáveis de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://api.alquimista.ai
   NODE_ENV=production
   ```

6. Clique em "Deploy site"

### Via CLI
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

**Tempo estimado**: 3-5 minutos

---

## ☁️ Opção 3: AWS Amplify

1. Acesse [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Clique em "New app" > "Host web app"
3. Conecte seu repositório
4. Configure:
   - **App name**: alquimista-ai-frontend
   - **Branch**: main
   - **Build settings**: Detectado automaticamente

5. Adicione variáveis de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://api.alquimista.ai
   ```

6. Clique em "Save and deploy"

**Tempo estimado**: 5-10 minutos

---

## 🐳 Opção 4: Docker (Para Produção Própria)

```bash
# Build da imagem
cd frontend
docker build -t alquimista-frontend .

# Testar localmente
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.alquimista.ai \
  alquimista-frontend

# Acesse http://localhost:3000
```

**Tempo estimado**: 5 minutos

---

## 📋 Checklist Pré-Deploy

- [x] Build funciona (`npm run build`) ✅
- [x] TypeScript sem erros ✅
- [x] Componentes funcionando ✅
- [ ] Backend AWS configurado
- [ ] Variáveis de ambiente definidas
- [ ] Domínio configurado (opcional)

---

## 🔧 Variáveis de Ambiente Necessárias

```bash
# Obrigatória
NEXT_PUBLIC_API_URL=https://api.alquimista.ai

# Opcional
NODE_ENV=production
```

---

## 🎯 Próximos Passos Após Deploy

1. Acesse a URL do deploy
2. Teste o login
3. Verifique o dashboard
4. Configure domínio customizado (opcional)
5. Configure SSL/TLS (geralmente automático)

---

## 🆘 Problemas Comuns

### Build falha
```bash
# Limpar e reinstalar
rm -rf .next node_modules
npm install
npm run build
```

### API não conecta
- Verifique a variável `NEXT_PUBLIC_API_URL`
- Confirme que o backend está rodando
- Verifique CORS no backend

### Página em branco
- Verifique o console do navegador
- Confirme que todas as variáveis de ambiente estão configuradas

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da plataforma
2. Teste o build local: `npm run build && npm start`
3. Consulte `DEPLOY.md` para guia completo

---

**Recomendação**: Use Vercel para deploy mais rápido e fácil! 🚀
