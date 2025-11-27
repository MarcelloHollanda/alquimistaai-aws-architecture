# 🚀 Quick Start - Autenticação Cognito

## ✅ Já Feito

- ✅ Código completo implementado
- ✅ Dependências instaladas
- ✅ Arquivos de configuração criados

## 🎯 Faça Agora (30 minutos)

### 1. AWS Cognito (10 min)

🔗 https://console.aws.amazon.com/cognito

```
1. Create user pool
2. Sign-in options: Email
3. Password: Minimum 8 characters
4. MFA: Optional
5. Self-service sign-up: Enabled
6. Required attributes: name, email
7. Custom attributes: 
   - tenantId (String)
   - role (String)
8. Create App Client:
   - Type: Public client
   - Name: alquimista-web
   - Auth flows: ALLOW_USER_PASSWORD_AUTH
9. Create Domain: alquimista-{seu-id}
10. Callback URLs:
    - http://localhost:3000/auth/callback
```

### 2. Google OAuth (5 min)

🔗 https://console.cloud.google.com/apis/credentials

```
1. Create OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs:
   https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
4. Copy Client ID and Client Secret
5. In Cognito → Add Google provider
```

### 3. Facebook OAuth (5 min)

🔗 https://developers.facebook.com/apps

```
1. Create App → Consumer
2. Add Facebook Login product
3. Valid OAuth Redirect URIs:
   https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
4. Copy App ID and App Secret
5. In Cognito → Add Facebook provider
```

### 4. Configurar .env.local (2 min)

```bash
# Edite frontend/.env.local
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://sua-api.execute-api.us-east-1.amazonaws.com
```

### 5. Testar (2 min)

```bash
cd frontend
npm run dev
```

Acesse: http://localhost:3000/auth/login

## 📝 APIs do Backend (Implementar depois)

```typescript
// lambda/auth/companies.ts
export const createCompany = async (event) => {
  const { name, legalName, cnpj, segment } = JSON.parse(event.body);
  const tenantId = uuid();
  
  await db.query(
    'INSERT INTO companies (tenant_id, name, legal_name, cnpj, segment) VALUES ($1, $2, $3, $4, $5)',
    [tenantId, name, legalName, cnpj, segment]
  );
  
  return { statusCode: 200, body: JSON.stringify({ tenantId }) };
};

// lambda/auth/users.ts
export const createUser = async (event) => {
  const { email, name, phone, tenantId, role } = JSON.parse(event.body);
  
  await db.query(
    'INSERT INTO users (email, name, phone, tenant_id, role) VALUES ($1, $2, $3, $4, $5)',
    [email, name, phone, tenantId, role]
  );
  
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};

// lambda/auth/upload-logo.ts
export const uploadLogo = async (event) => {
  const { file, tenantId } = event;
  const key = `logos/${tenantId}/logo.png`;
  
  await s3.putObject({
    Bucket: 'alquimista-logos',
    Key: key,
    Body: file,
    ContentType: 'image/png'
  });
  
  const url = `https://alquimista-logos.s3.amazonaws.com/${key}`;
  return { statusCode: 200, body: JSON.stringify({ url }) };
};
```

## 🔗 Links Úteis

- **Cognito Console**: https://console.aws.amazon.com/cognito
- **Google Cloud**: https://console.cloud.google.com
- **Facebook Developers**: https://developers.facebook.com
- **Documentação Completa**: frontend/AUTH-SETUP-README.md
- **Resumo**: COGNITO-AUTH-SUMMARY.md

## ✅ Checklist Rápido

- [ ] Criar Cognito User Pool
- [ ] Configurar Google OAuth
- [ ] Configurar Facebook OAuth
- [ ] Preencher .env.local
- [ ] Testar login
- [ ] Implementar APIs backend

## 🆘 Problemas Comuns

**Erro: "User pool client does not exist"**
→ Verifique NEXT_PUBLIC_COGNITO_CLIENT_ID

**Erro: "redirect_uri_mismatch"**
→ Adicione callback URL no Cognito App Client

**Login social não funciona**
→ Verifique se domínio do Hosted UI está configurado

**Erro: "Invalid custom attribute"**
→ Crie custom attributes (tenantId, role) no User Pool

## 🎉 Pronto!

Após configurar tudo, você terá:
- ✅ Login com e-mail/senha
- ✅ Login com Google
- ✅ Login com Facebook
- ✅ Cadastro de usuários
- ✅ Recuperação de senha
- ✅ Página de configurações
- ✅ Multi-tenancy
- ✅ Controle de permissões

---

**Tempo estimado**: 30 minutos  
**Dificuldade**: Média  
**Resultado**: Autenticação completa funcionando
