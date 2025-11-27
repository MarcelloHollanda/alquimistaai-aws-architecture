# 🔓 Resolver Bloqueio do Navegador - localhost:3000

## ❌ Problema

O navegador está bloqueando o acesso ao `localhost:3000` com a mensagem:
> "Sua conexão com esse site não é segura"

Isso acontece porque o Next.js em desenvolvimento usa HTTP (não HTTPS) e alguns navegadores bloqueiam por padrão.

---

## ✅ Soluções Rápidas

### Solução 1: Permitir Acesso no Chrome/Edge (Mais Rápida)

1. **Na tela de aviso de segurança**, clique em qualquer lugar da página
2. **Digite no teclado**: `thisisunsafe` (sem espaços, tudo junto)
3. A página será carregada automaticamente

**Nota:** Você não verá o texto aparecer enquanto digita, mas funciona!

---

### Solução 2: Configurar Exceção no Navegador

#### Chrome/Edge:

1. Na tela de bloqueio, clique em **"Avançado"** ou **"Advanced"**
2. Clique em **"Continuar para localhost (não seguro)"**
3. O site será carregado

#### Firefox:

1. Na tela de bloqueio, clique em **"Avançado"**
2. Clique em **"Aceitar o risco e continuar"**
3. O site será carregado

---

### Solução 3: Desabilitar Temporariamente o Bloqueio (Chrome/Edge)

1. Abra o Chrome/Edge
2. Digite na barra de endereços:
   ```
   chrome://flags/#allow-insecure-localhost
   ```
   ou
   ```
   edge://flags/#allow-insecure-localhost
   ```

3. Procure por **"Allow invalid certificates for resources loaded from localhost"**
4. Mude para **"Enabled"**
5. Clique em **"Relaunch"** para reiniciar o navegador
6. Acesse novamente: `http://localhost:3000/auth/login`

---

### Solução 4: Usar Modo Anônimo/Privado

1. Abra uma janela anônima/privada:
   - **Chrome/Edge**: `Ctrl + Shift + N`
   - **Firefox**: `Ctrl + Shift + P`

2. Acesse: `http://localhost:3000/auth/login`

3. Aceite o aviso de segurança quando aparecer

---

### Solução 5: Configurar HTTPS Local (Avançado)

Se você precisa de HTTPS em desenvolvimento, siga estes passos:

#### 1. Instalar mkcert

**Windows (PowerShell como Administrador):**
```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar mkcert
choco install mkcert
```

#### 2. Criar Certificados

```bash
cd frontend

# Criar CA local
mkcert -install

# Criar certificados para localhost
mkcert localhost 127.0.0.1 ::1

# Isso criará:
# - localhost+2.pem (certificado)
# - localhost+2-key.pem (chave privada)
```

#### 3. Configurar Next.js para HTTPS

Crie o arquivo `frontend/server.js`:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

#### 4. Atualizar package.json

```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

#### 5. Iniciar com HTTPS

```bash
npm run dev
```

Agora acesse: `https://localhost:3000/auth/login`

---

## 🎯 Solução Recomendada para Desenvolvimento

Para desenvolvimento local, a **Solução 1** (digitar `thisisunsafe`) ou **Solução 2** (clicar em "Avançado" e continuar) são as mais rápidas e práticas.

O aviso de segurança é normal para desenvolvimento local e não representa um risco real quando você está acessando seu próprio servidor local.

---

## 🔧 Verificar se o Servidor Está Rodando

Antes de tentar acessar, certifique-se de que o servidor está rodando:

```bash
cd frontend
npm run dev
```

Você deve ver:
```
> alquimista-ai-frontend@1.0.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully in XXX ms
```

---

## 📋 Checklist de Troubleshooting

- [ ] Servidor Next.js está rodando (`npm run dev`)
- [ ] Porta 3000 não está sendo usada por outro processo
- [ ] Tentou digitar `thisisunsafe` na tela de bloqueio
- [ ] Tentou clicar em "Avançado" e continuar
- [ ] Tentou em modo anônimo/privado
- [ ] Limpou cache do navegador (`Ctrl + Shift + Delete`)
- [ ] Reiniciou o navegador
- [ ] Tentou outro navegador (Chrome, Firefox, Edge)

---

## 🆘 Ainda Não Funciona?

### Verificar Firewall/Antivírus

Alguns antivírus ou firewalls podem bloquear conexões locais:

1. Desabilite temporariamente o antivírus
2. Adicione exceção para `localhost:3000`
3. Verifique configurações do Windows Firewall

### Verificar Hosts File

Certifique-se de que o arquivo hosts está correto:

**Localização:** `C:\Windows\System32\drivers\etc\hosts`

Deve conter:
```
127.0.0.1       localhost
::1             localhost
```

### Usar IP Direto

Tente acessar usando o IP:
```
http://127.0.0.1:3000/auth/login
```

---

## 🎉 Após Resolver o Bloqueio

Depois de conseguir acessar, você verá a página de login do Cognito:

1. Clique em **"Entrar com Cognito"**
2. Será redirecionado para o Cognito Hosted UI
3. Faça login com suas credenciais
4. Será redirecionado de volta para o dashboard

---

## 📚 Links Úteis

- [Next.js Development Server](https://nextjs.org/docs/api-reference/cli#development)
- [mkcert - Local HTTPS](https://github.com/FiloSottile/mkcert)
- [Chrome Flags](chrome://flags)

---

**Última atualização:** 2024
**Status:** ✅ Guia Completo
