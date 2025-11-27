# Acesso ao Login – Ambiente DEV (Painel Operacional AlquimistaAI)

## 1. Subir o servidor

No diretório `frontend`, execute:

```powershell
npm run dev
```

O servidor será iniciado em `http://localhost:3000`

## 2. URL oficial de login (DEV)

Abra no navegador:

```
http://localhost:3000/login
```

**⚠️ ATENÇÃO:** A rota antiga `/auth/login` não é mais utilizada. A rota oficial é `/login`.

## 3. Aviso de "site não é seguro"

No ambiente de desenvolvimento, o acesso é feito via **HTTP** em localhost. O navegador pode exibir avisos de segurança por não ser HTTPS, mas isso é **esperado e normal em DEV**.

**Por que isso acontece?**
- Em desenvolvimento local, usamos HTTP (não criptografado)
- Navegadores modernos alertam sobre sites HTTP
- Isso NÃO é um problema de configuração

**Em produção:**
- O painel será servido via HTTPS (CloudFront + certificado TLS)
- Os avisos de segurança não aparecerão

## 4. Fluxo de autenticação

1. Acesse `http://localhost:3000/login`
2. Clique em "Entrar com Cognito"
3. Você será redirecionado para o Cognito Hosted UI
4. Após autenticação, retornará para `/auth/callback`
5. O callback processará os tokens e redirecionará para o dashboard apropriado

## 5. Variáveis de ambiente necessárias

Certifique-se de que o arquivo `.env.local` contém:

```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=https://alquimista-dev.auth.us-east-1.amazoncognito.com
COGNITO_DOMAIN_HOST=alquimista-dev.auth.us-east-1.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
```

## 6. Troubleshooting

### Erro 404 ao acessar /login
- Verifique se o servidor está rodando (`npm run dev`)
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Tente acessar em uma aba anônima

### Erro ao fazer login
- Verifique as variáveis de ambiente no `.env.local`
- Confirme que o User Pool do Cognito está configurado corretamente
- Verifique os logs do console do navegador (F12)

### Redirecionamento não funciona
- Verifique se a URL de callback está registrada no Cognito
- Confirme que `COGNITO_REDIRECT_URI` está correto no `.env.local`

## 7. Comandos úteis

```powershell
# Instalar dependências
npm install

# Subir servidor de desenvolvimento
npm run dev

# Verificar erros de TypeScript
npm run type-check

# Limpar cache do Next.js
Remove-Item -Recurse -Force .next
```

---

**Última atualização:** Correção final da rota de login - Todas as referências a `/auth/login` foram atualizadas para `/login`
