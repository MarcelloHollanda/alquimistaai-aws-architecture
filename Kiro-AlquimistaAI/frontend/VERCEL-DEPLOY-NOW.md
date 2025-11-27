# 🚀 Deploy AGORA na Vercel (Sem Git)

## ⚡ Método Mais Rápido - 5 Minutos

### Passo 1: Instalar Vercel CLI

Abra um **NOVO PowerShell** e execute:

```powershell
npm install -g vercel
```

### Passo 2: Fazer Login

```powershell
vercel login
```

Isso vai abrir o navegador para você fazer login.

### Passo 3: Deploy

```powershell
cd frontend
vercel --prod
```

Pronto! O Vercel vai fazer upload direto dos arquivos.

---

## 📋 Comandos Completos

```powershell
# 1. Instalar Vercel
npm install -g vercel

# 2. Login
vercel login

# 3. Ir para o frontend
cd frontend

# 4. Deploy
vercel --prod
```

---

## ✅ O que o Vercel vai perguntar:

1. **Set up and deploy?** → Yes
2. **Which scope?** → Escolha sua conta
3. **Link to existing project?** → No
4. **Project name?** → alquimista-ai-frontend (ou outro nome)
5. **Directory?** → ./ (deixe como está)
6. **Override settings?** → No

Depois disso, aguarde 2-3 minutos e você terá uma URL!

---

## 🔧 Configurar Variáveis de Ambiente

Depois do primeiro deploy, configure no painel da Vercel:

1. Acesse https://vercel.com/dashboard
2. Clique no seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   ```
   NEXT_PUBLIC_API_URL=https://api.alquimista.ai
   ```
5. Faça redeploy: `vercel --prod`

---

## 🎉 Vantagens do Vercel

- ✅ Não precisa de Git configurado
- ✅ Deploy em 3 minutos
- ✅ SSL automático
- ✅ CDN global
- ✅ Preview de cada deploy
- ✅ Rollback fácil

---

## 🆘 Se der erro "vercel not found"

Feche e abra um **NOVO PowerShell** depois de instalar.

---

**Recomendação**: Use Vercel agora para ter o site no ar rapidamente. Depois você configura o Git com calma para usar AWS Amplify se quiser.
