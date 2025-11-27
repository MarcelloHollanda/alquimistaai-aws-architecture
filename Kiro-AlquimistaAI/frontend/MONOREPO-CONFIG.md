# 📁 Configuração Monorepo - AWS Amplify

## 🎯 Estrutura do Projeto

```
Kiro-AlquimistaAI/          ← Raiz do repositório
│
├── frontend/               ← SEU FRONTEND ESTÁ AQUI! 🎯
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   └── amplify.yml
│
├── lambda/                 ← Backend AWS
├── lib/                    ← CDK Infrastructure
├── database/               ← Database
└── package.json            ← Root package.json
```

---

## ⚙️ Configuração no AWS Amplify Console

### Passo 1: Conectar Repositório
1. Acesse [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Clique em "New app" > "Host web app"
3. Conecte seu repositório Git
4. Selecione branch: `main`

### Passo 2: Configurar Monorepo ⚠️ IMPORTANTE

Na tela de configuração, você verá:

```
┌─────────────────────────────────────────┐
│ Build settings                          │
├─────────────────────────────────────────┤
│                                         │
│ ☑ My app is a monorepo                 │  ← MARQUE ESTA OPÇÃO!
│                                         │
│ App root directory:                     │
│ ┌─────────────────────────────────┐    │
│ │ frontend                        │    │  ← DIGITE "frontend"
│ └─────────────────────────────────┘    │
│                                         │
│ Build command:                          │
│ ┌─────────────────────────────────┐    │
│ │ npm run build                   │    │
│ └─────────────────────────────────┘    │
│                                         │
│ Output directory:                       │
│ ┌─────────────────────────────────┐    │
│ │ .next                           │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Passo 3: Verificar amplify.yml

O arquivo `frontend/amplify.yml` já está configurado corretamente:

```yaml
version: 1
applications:
  - appRoot: frontend        ← Define o diretório do frontend
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

---

## ✅ Checklist de Configuração

### No Console AWS Amplify:
- [ ] ✅ Marcar "My app is a monorepo"
- [ ] ✅ App root directory: `frontend`
- [ ] ✅ Build command: `npm run build`
- [ ] ✅ Output directory: `.next`
- [ ] ✅ Framework: Next.js (detectado automaticamente)

### Variáveis de Ambiente:
- [ ] ✅ `NEXT_PUBLIC_API_URL=https://api.alquimista.ai`
- [ ] ✅ `NODE_ENV=production`

---

## 🚨 Erros Comuns e Soluções

### Erro: "Cannot find package.json"
**Causa**: Amplify está procurando na raiz do repo  
**Solução**: Certifique-se de marcar "My app is a monorepo" e definir `frontend` como app root

### Erro: "Build failed - npm not found"
**Causa**: Amplify não encontrou o diretório correto  
**Solução**: Verifique se `appRoot: frontend` está no `amplify.yml`

### Erro: "Module not found"
**Causa**: Dependências não instaladas corretamente  
**Solução**: Verifique se `npm ci` está no `preBuild` do `amplify.yml`

---

## 🔍 Como Verificar se Está Correto

### Durante o Build, você deve ver:

```bash
# Build logs no Amplify Console

2024-11-13 10:00:00  Cloning repository...
2024-11-13 10:00:05  ✅ Repository cloned
2024-11-13 10:00:06  📁 Changing to app root: frontend    ← DEVE APARECER!
2024-11-13 10:00:07  Running preBuild commands...
2024-11-13 10:00:08  > npm ci
2024-11-13 10:00:30  ✅ Dependencies installed
2024-11-13 10:00:31  Running build commands...
2024-11-13 10:00:32  > npm run build
2024-11-13 10:01:00  ✅ Build completed
2024-11-13 10:01:01  Deploying...
2024-11-13 10:01:30  ✅ Deployment successful!
```

Se você NÃO ver "Changing to app root: frontend", a configuração está errada!

---

## 📊 Estrutura de Diretórios Durante Build

```
Durante o build, o Amplify faz:

1. Clone do repo completo:
   /codebuild/output/src123/
   ├── frontend/          ← Amplify entra AQUI
   ├── lambda/
   ├── lib/
   └── ...

2. Muda para o app root:
   cd frontend

3. Instala dependências:
   npm ci

4. Executa build:
   npm run build

5. Publica artefatos de:
   frontend/.next/
```

---

## 🎯 Comandos para Testar Localmente

```bash
# Simular o que o Amplify faz:

# 1. Ir para o diretório frontend
cd frontend

# 2. Instalar dependências
npm ci

# 3. Build
npm run build

# 4. Testar
npm start

# Se funcionar localmente, funcionará no Amplify!
```

---

## 📚 Recursos Adicionais

- [AWS Amplify Monorepo Docs](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)
- [Next.js on Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)

---

## 🎉 Resumo

**Seu projeto É um monorepo porque:**
- ✅ Tem múltiplos projetos na raiz (frontend, lambda, lib, etc.)
- ✅ Cada projeto tem seu próprio package.json
- ✅ O frontend está em `frontend/` não na raiz

**Para deploy no Amplify:**
1. ✅ Marque "My app is a monorepo"
2. ✅ Defina `frontend` como app root
3. ✅ Use o `amplify.yml` fornecido
4. ✅ Deploy! 🚀

---

**Status**: Configuração de monorepo pronta! ✅
