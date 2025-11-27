# 🚀 Guia de Deploy - Frontend AlquimistaAI

## 📋 Opções de Deploy

### 1. Vercel (Recomendado) ⭐
### 2. Netlify
### 3. AWS Amplify
### 4. Docker + AWS ECS

---

## 🎯 Deploy na Vercel (Recomendado)

### Pré-requisitos
- Conta na Vercel
- Repositório Git (GitHub/GitLab)
- Backend AWS funcionando

### Passo a Passo

#### 1. Preparar o Projeto
```bash
cd frontend
npm install
npm run build
npm start
```

#### 2. Configurar Variáveis de Ambiente
No painel da Vercel, adicione:

```bash
NEXT_PUBLIC_API_URL=https://api.alquimista.ai
NODE_ENV=production
```

#### 3. Deploy Automático
1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório
3. Configure o domínio customizado
4. Deploy automático a cada push

#### 4. Comandos CLI (Opcional)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

---

## 🌐 Deploy na Netlify

### Build Settings
```bash
# Build command
npm run build

# Publish directory
.next

# Base directory
frontend
```

### Variáveis de Ambiente
```bash
NEXT_PUBLIC_API_URL=https://api.alquimista.ai
NODE_ENV=production
```

### Deploy CLI
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

---

## ☁️ Deploy na AWS Amplify

### amplify.yml
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - frontend/.next/cache/**/*
```

### Variáveis de Ambiente
```bash
NEXT_PUBLIC_API_URL=https://api.alquimista.ai
_LIVE_UPDATES=[{"name":"Next.js version","pkg":"next","type":"internal","version":"latest"}]
```

---

## 🐳 Deploy com Docker

### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.alquimista.ai
    restart: unless-stopped
```

### Deploy
```bash
# Build
docker build -t alquimista-frontend ./frontend

# Run local
docker run -p 3000:3000 alquimista-frontend

# Push para ECR (AWS)
docker tag alquimista-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/alquimista-frontend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/alquimista-frontend:latest
```

---

## 🔧 Configurações de Produção

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts']
  },
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

## 🔍 Checklist de Deploy

### Antes do Deploy
- [ ] Build local funciona (`npm run build`)
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Backend AWS funcionando
- [ ] Domínio configurado
- [ ] SSL/TLS configurado

### Após o Deploy
- [ ] Homepage carrega corretamente
- [ ] Login funciona
- [ ] Dashboard carrega dados
- [ ] Todas as rotas funcionam
- [ ] Performance OK (Lighthouse > 90)
- [ ] SEO configurado

---

## 🚨 Troubleshooting

### Erro: "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf .next node_modules
npm install
npm run build
```

### Erro: "API calls failing"
- Verificar CORS no backend
- Confirmar URL da API
- Verificar variáveis de ambiente

### Erro: "Build timeout"
- Aumentar timeout na plataforma
- Otimizar imports
- Usar dynamic imports

---

## 🎯 URLs de Produção

- **Frontend**: https://alquimista.ai
- **API**: https://api.alquimista.ai
- **Docs**: https://docs.alquimista.ai

---

**Status**: Frontend pronto para deploy ✅
