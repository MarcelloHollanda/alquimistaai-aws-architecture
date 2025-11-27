# ⚡ Comandos Rápidos de Deploy

## 🚀 Deploy em 3 Passos

### Opção 1: Vercel (Mais Rápido)
```bash
# 1. Validar
npm run pre-deploy

# 2. Instalar CLI (se necessário)
npm i -g vercel

# 3. Deploy
cd frontend
vercel --prod
```

### Opção 2: AWS Amplify
```bash
# 1. Validar
npm run pre-deploy

# 2. Commit e push
git add .
git commit -m "Deploy frontend"
git push origin main

# 3. Configure no console AWS
# https://console.aws.amazon.com/amplify
```

### Opção 3: Netlify
```bash
# 1. Validar
npm run pre-deploy

# 2. Instalar CLI (se necessário)
npm i -g netlify-cli

# 3. Deploy
cd frontend
netlify deploy --prod
```

### Opção 4: Docker
```bash
# 1. Build
cd frontend
docker build -t alquimista-frontend .

# 2. Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.alquimista.ai \
  alquimista-frontend
```

---

## 🔍 Comandos de Validação

```bash
# Validação completa
npm run pre-deploy

# Build local
npm run build

# Testar produção
npm run build && npm start

# TypeScript
npm run type-check

# Lint
npm run lint
```

---

## 🔧 Comandos de Desenvolvimento

```bash
# Dev server
npm run dev

# Build
npm run build

# Start produção
npm start

# Limpar cache
rm -rf .next node_modules
npm install
```

---

## 📊 Comandos de Monitoramento

### Vercel
```bash
# Ver logs
vercel logs

# Ver deployments
vercel ls

# Rollback
vercel rollback
```

### AWS Amplify
```bash
# Listar apps
aws amplify list-apps

# Ver status
aws amplify get-app --app-id <app-id>

# Iniciar build
aws amplify start-job \
  --app-id <app-id> \
  --branch-name main \
  --job-type RELEASE
```

### Netlify
```bash
# Ver sites
netlify sites:list

# Ver logs
netlify logs

# Rollback
netlify rollback
```

---

## 🆘 Comandos de Troubleshooting

```bash
# Limpar tudo e reinstalar
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Verificar versões
node --version
npm --version
npx next --version

# Debug build
npm run build -- --debug

# Verificar portas
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux
```

---

## 📝 Variáveis de Ambiente

### Criar .env.local
```bash
# Copiar exemplo
cp .env.example .env.local

# Editar
# NEXT_PUBLIC_API_URL=https://api.alquimista.ai
```

### Verificar variáveis
```bash
# Ver variáveis
cat .env.local

# Testar com variável
NEXT_PUBLIC_API_URL=https://api.alquimista.ai npm run dev
```

---

## 🔄 Git Commands

```bash
# Status
git status

# Add e commit
git add .
git commit -m "Deploy frontend"

# Push
git push origin main

# Ver branches
git branch -a

# Criar branch
git checkout -b feature/deploy
```

---

## 📦 NPM Commands

```bash
# Instalar dependências
npm install

# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix

# Limpar cache
npm cache clean --force
```

---

## 🎯 One-Liners Úteis

```bash
# Build e start
npm run build && npm start

# Limpar e build
rm -rf .next && npm run build

# Validar e deploy (Vercel)
npm run pre-deploy && vercel --prod

# Build com análise
ANALYZE=true npm run build

# Build sem cache
rm -rf .next/cache && npm run build
```

---

## 🔐 Comandos de Segurança

```bash
# Audit
npm audit

# Audit fix
npm audit fix

# Verificar outdated
npm outdated

# Update específico
npm update <package-name>
```

---

## 📊 Comandos de Performance

```bash
# Analisar bundle
npm run build -- --profile

# Lighthouse
npx lighthouse https://alquimista.ai

# Bundle analyzer (se configurado)
ANALYZE=true npm run build
```

---

## 🎨 Comandos de Estilo

```bash
# Format com Prettier (se configurado)
npx prettier --write .

# Lint
npm run lint

# Lint fix
npm run lint -- --fix
```

---

## 🧪 Comandos de Teste

```bash
# Rodar testes (se configurado)
npm test

# Testes com coverage
npm test -- --coverage

# Testes em watch mode
npm test -- --watch
```

---

## 📱 Comandos Mobile/Responsive

```bash
# Dev com network access
npm run dev -- -H 0.0.0.0

# Testar em dispositivo móvel
# Acesse: http://<seu-ip>:3000
```

---

## 🔗 Links Úteis

- **Vercel**: https://vercel.com
- **AWS Amplify**: https://console.aws.amazon.com/amplify
- **Netlify**: https://netlify.com
- **Next.js Docs**: https://nextjs.org/docs

---

**Dica**: Salve este arquivo como referência rápida! 📌
