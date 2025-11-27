# 🔐 Guia de Configuração AWS - Passo a Passo

## ❌ Erro Atual
```
InvalidClientTokenId: The security token included in the request is invalid
```

Isso significa que o AWS CLI não está configurado com credenciais válidas.

---

## 📍 ONDE DIGITAR OS COMANDOS

### No PowerShell (janela azul que você já está usando):

```
PS C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI>
```

Digite os comandos abaixo **nesta mesma janela**.

---

## 🔑 Passo 1: Obter Credenciais AWS

### Se você JÁ TEM uma conta AWS:

1. Acesse: https://console.aws.amazon.com/
2. Faça login
3. No canto superior direito, clique no seu nome
4. Clique em **"Security credentials"**
5. Role até **"Access keys"**
6. Clique em **"Create access key"**
7. Escolha **"Command Line Interface (CLI)"**
8. Marque o checkbox de confirmação
9. Clique em **"Create access key"**
10. **COPIE** as duas chaves:
    - Access key ID (ex: `AKIAIOSFODNN7EXAMPLE`)
    - Secret access key (ex: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

### Se você NÃO TEM conta AWS:

1. Acesse: https://aws.amazon.com/free/
2. Clique em **"Create a Free Account"**
3. Siga o processo de cadastro
4. Depois, siga os passos acima para criar as credenciais

---

## 🔧 Passo 2: Configurar AWS CLI

### No PowerShell, digite:

```powershell
aws configure
```

### Você verá 4 perguntas. Responda assim:

```
AWS Access Key ID [None]: COLE_SUA_ACCESS_KEY_AQUI
AWS Secret Access Key [None]: COLE_SUA_SECRET_KEY_AQUI
Default region name [None]: us-east-1
Default output format [None]: json
```

**Exemplo:**
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

---

## ✅ Passo 3: Testar Configuração

### No PowerShell, digite:

```powershell
aws sts get-caller-identity
```

### Se funcionar, você verá:

```json
{
    "UserId": "AIDAXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/seu-usuario"
}
```

✅ **Sucesso!** Suas credenciais estão configuradas.

---

## 🚀 Passo 4: Deploy do Backend

Depois que as credenciais estiverem configuradas:

```powershell
# 1. Build
npm run build

# 2. Deploy
npm run deploy:prod
```

---

## 🆘 Problemas Comuns

### "aws: command not found"
**Solução**: Instale o AWS CLI
- Download: https://awscli.amazonaws.com/AWSCLIV2.msi
- Instale e reinicie o PowerShell

### "InvalidClientTokenId"
**Solução**: Credenciais inválidas ou expiradas
- Verifique se copiou as chaves corretamente
- Crie novas credenciais no console AWS
- Execute `aws configure` novamente

### "Access Denied"
**Solução**: Usuário sem permissões
- No IAM, anexe a policy **AdministratorAccess** ao usuário
- Ou crie um usuário novo com permissões de admin

---

## 📋 Checklist

- [ ] Tenho conta AWS
- [ ] Criei Access Key no console AWS
- [ ] Copiei Access Key ID
- [ ] Copiei Secret Access Key
- [ ] Executei `aws configure` no PowerShell
- [ ] Colei as credenciais
- [ ] Escolhi região: us-east-1
- [ ] Escolhi formato: json
- [ ] Testei com `aws sts get-caller-identity`
- [ ] Recebi resposta com sucesso

---

## 🎯 Resumo Visual

```
1. Console AWS → Security credentials → Create access key
   ↓
2. Copiar Access Key ID e Secret Access Key
   ↓
3. PowerShell → aws configure
   ↓
4. Colar as credenciais
   ↓
5. Testar → aws sts get-caller-identity
   ↓
6. Deploy → npm run deploy:prod
```

---

## 💡 Dica de Segurança

⚠️ **NUNCA compartilhe suas credenciais AWS!**
- Não commite no Git
- Não compartilhe em chat/email
- Não poste em fóruns
- Guarde em local seguro

---

**Próximo passo**: Depois de configurar, me avise para continuarmos com o deploy! 🚀
