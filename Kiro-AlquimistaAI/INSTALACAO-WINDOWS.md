# Guia de Instalação - Windows

Este guia vai te ajudar a instalar todos os pré-requisitos necessários para o projeto Fibonacci AWS.

## 📋 Checklist de Instalação

- [ ] Node.js 18+
- [ ] AWS CLI v2
- [ ] Git (se ainda não tiver)
- [ ] Configurar AWS CLI com suas credenciais

---

## 1️⃣ Instalar Node.js

### Opção A: Instalador Oficial (Recomendado)

1. **Baixe o Node.js 20 LTS**:
   - Acesse: https://nodejs.org/
   - Clique em "20.x.x LTS" (versão recomendada)
   - Baixe o instalador Windows (.msi)

2. **Execute o instalador**:
   - Aceite os termos de licença
   - Mantenha as opções padrão
   - Marque a opção "Automatically install necessary tools"
   - Clique em "Install"

3. **Verifique a instalação**:
   ```powershell
   # Feche e reabra o PowerShell, depois execute:
   node --version
   npm --version
   ```
   
   Você deve ver algo como:
   ```
   v20.11.0
   10.2.4
   ```

### Opção B: Usando Chocolatey

Se você tem o Chocolatey instalado:

```powershell
choco install nodejs-lts -y
```

---

## 2️⃣ Instalar AWS CLI v2

### Opção A: Instalador MSI (Recomendado)

1. **Baixe o AWS CLI v2**:
   - Acesse: https://awscli.amazonaws.com/AWSCLIV2.msi
   - Ou execute no PowerShell:
     ```powershell
     Start-Process "https://awscli.amazonaws.com/AWSCLIV2.msi"
     ```

2. **Execute o instalador**:
   - Aceite os termos
   - Mantenha o caminho de instalação padrão
   - Clique em "Install"

3. **Verifique a instalação**:
   ```powershell
   # Feche e reabra o PowerShell, depois execute:
   aws --version
   ```
   
   Você deve ver algo como:
   ```
   aws-cli/2.15.0 Python/3.11.6 Windows/10 exe/AMD64
   ```

### Opção B: Usando Chocolatey

```powershell
choco install awscli -y
```

---

## 3️⃣ Configurar AWS CLI

Após instalar o AWS CLI, configure suas credenciais:

```powershell
aws configure
```

Quando solicitado, insira:

```
AWS Access Key ID [None]: AKIATA2OIDWBSGYQQHFK
AWS Secret Access Key [None]: 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
Default region name [None]: us-east-1
Default output format [None]: json
```

### ⚠️ IMPORTANTE - Segurança

**APÓS configurar, você DEVE rotacionar essas credenciais imediatamente!**

Essas credenciais foram expostas e precisam ser desativadas. Veja o arquivo `SECURITY.md` para instruções.

### Verificar Configuração

```powershell
aws sts get-caller-identity
```

Você deve ver:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "207933152643",
    "Arn": "arn:aws:iam::207933152643:user/jose-marcello33"
}
```

---

## 4️⃣ Instalar Dependências do Projeto

Agora que Node.js e AWS CLI estão instalados:

```powershell
# 1. Instalar dependências do projeto
npm install

# 2. Instalar AWS CDK globalmente
npm install -g aws-cdk

# 3. Verificar instalação do CDK
cdk --version
```

---

## 5️⃣ Bootstrap da Conta AWS

Prepare sua conta AWS para o CDK:

```powershell
npm run bootstrap
```

Isso vai criar:
- Bucket S3 para templates do CloudFormation
- Roles IAM necessárias
- Recursos de staging

**Tempo estimado**: 2-3 minutos

---

## 6️⃣ Criar Secrets no AWS Secrets Manager

Crie os secrets necessários para as integrações MCP:

```powershell
# WhatsApp (deixe vazio por enquanto)
aws secretsmanager create-secret `
  --name fibonacci/mcp/whatsapp `
  --secret-string '{\"apiKey\":\"\"}' `
  --region us-east-1

# Google Places + LinkedIn (deixe vazio por enquanto)
aws secretsmanager create-secret `
  --name fibonacci/mcp/enrichment `
  --secret-string '{\"googlePlacesApiKey\":\"\",\"linkedInClientId\":\"\",\"linkedInClientSecret\":\"\",\"linkedInAccessToken\":\"\"}' `
  --region us-east-1

# Google Calendar (deixe vazio por enquanto)
aws secretsmanager create-secret `
  --name fibonacci/mcp/calendar `
  --secret-string '{\"clientId\":\"\",\"clientSecret\":\"\",\"refreshToken\":\"\"}' `
  --region us-east-1
```

**Nota**: Você pode atualizar esses secrets depois quando tiver as API keys reais.

---

## 7️⃣ Verificar Configuração

Antes de fazer o deploy, verifique se está tudo certo:

```powershell
# Verificar que o CDK pode sintetizar os templates
npm run synth
```

Se não houver erros, você está pronto para o deploy!

---

## 8️⃣ Fazer o Deploy

```powershell
# Deploy no ambiente de desenvolvimento
npm run deploy:dev
```

**Tempo estimado**: 15-20 minutos na primeira vez

O deploy vai criar:
- VPC com subnets públicas e privadas
- Aurora Serverless v2 (PostgreSQL)
- Lambda functions
- API Gateway
- EventBridge
- Cognito User Pool
- CloudFront + S3
- E muito mais...

---

## 9️⃣ Executar Migrações do Banco

Após o deploy bem-sucedido:

```powershell
# Executar migrações
npm run db:migrate

# Popular dados iniciais
npm run db:seed
```

---

## 🎉 Pronto!

Sua infraestrutura está no ar! Você pode:

1. **Testar a API**:
   ```powershell
   # O endpoint será exibido nos outputs do deploy
   curl https://YOUR_API_ENDPOINT/health
   ```

2. **Ver logs**:
   ```powershell
   aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow
   ```

3. **Acessar o Console AWS**:
   - https://207933152643.signin.aws.amazon.com/console

---

## 🔧 Troubleshooting

### Erro: "O termo 'aws' não é reconhecido"

**Solução**: Feche e reabra o PowerShell após instalar o AWS CLI.

### Erro: "O termo 'node' não é reconhecido"

**Solução**: Feche e reabra o PowerShell após instalar o Node.js.

### Erro: "execution of scripts is disabled"

**Solução**: Execute os comandos manualmente ao invés de usar o script `.ps1`.

### Erro: "Unable to locate credentials"

**Solução**: Execute `aws configure` e insira suas credenciais.

### Erro: "Stack already exists"

**Solução**: 
```powershell
# Destruir stack existente
npm run destroy

# Tentar deploy novamente
npm run deploy:dev
```

---

## 📚 Próximos Passos

1. ✅ Instalação completa
2. ⏳ Rotacionar credenciais AWS (IMPORTANTE!)
3. ⏳ Configurar API keys das integrações
4. ⏳ Testar endpoints
5. ⏳ Configurar domínio customizado (opcional)

---

## 🆘 Precisa de Ajuda?

- **Documentação completa**: Veja `SETUP.md`
- **Segurança**: Leia `SECURITY.md` (IMPORTANTE!)
- **AWS CLI**: https://docs.aws.amazon.com/cli/
- **Node.js**: https://nodejs.org/docs/
- **CDK**: https://docs.aws.amazon.com/cdk/

---

**Boa sorte! 🚀**
