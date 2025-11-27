# 🚀 Nigredo Stack - Comece Aqui

## ⚡ Deploy Rápido (1 Comando)

```powershell
.\fix-and-deploy-nigredo.ps1
```

Isso é tudo! O script irá:
- ✅ Verificar pré-requisitos (AWS CLI, CDK)
- ✅ Deletar stack com erro (se necessário)
- ✅ Fazer deploy do NigredoStack-dev corrigido

---

## 📖 Documentação Completa

- **[RESUMO-CORRECAO-NIGREDO.md](RESUMO-CORRECAO-NIGREDO.md)** - Resumo executivo
- **[NIGREDO-INDEX.md](NIGREDO-INDEX.md)** - Índice completo
- **[NIGREDO-QUICK-FIX.md](NIGREDO-QUICK-FIX.md)** - Guia rápido
- **[NIGREDO-COMMANDS.md](NIGREDO-COMMANDS.md)** - Comandos úteis

---

## 🔧 Pré-requisitos

Antes de executar o deploy, certifique-se de ter:

- ✅ AWS CLI instalado e configurado
- ✅ AWS CDK instalado (`npm install -g aws-cdk`)
- ✅ Credenciais AWS válidas
- ✅ Node.js 20.x ou superior

### Verificar Pré-requisitos

```powershell
# AWS CLI
aws --version

# AWS CDK
npx cdk --version

# Credenciais
aws sts get-caller-identity

# Node.js
node --version
```

---

## 🎯 O Que Foi Corrigido?

**Problema:** Conflito de exports CloudFormation
```
Export with name dev-FunnelConversionQuery is already exported by stack FibonacciStack-dev
```

**Solução:** Adicionado prefixo "Nigredo-" aos exports

Detalhes completos em: [NIGREDO-EXPORT-FIX-SUMMARY.md](NIGREDO-EXPORT-FIX-SUMMARY.md)

---

## 📊 Após o Deploy

### 1. Verificar Status
```powershell
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].StackStatus'
```

### 2. Obter URL da API
```powershell
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].Outputs[?OutputKey==`NigredoApiUrl`].OutputValue' --output text
```

### 3. Testar API
```powershell
# Substituir [API-URL] pela URL obtida acima
curl https://[API-URL]/api/leads
```

### 4. Acessar Dashboards
- AWS Console > CloudWatch > Dashboards
- Procure por: `nigredo-agents-dev` e `nigredo-prospecting-dev`

---

## 🆘 Problemas?

### Erro: "cdk: command not found"
```powershell
npm install -g aws-cdk
```

### Erro: "aws: command not found"
Instale AWS CLI: https://aws.amazon.com/cli/

### Erro: "Stack still exists"
Aguarde alguns minutos. A deleção pode levar tempo.

### Outros Problemas
Consulte: [NIGREDO-QUICK-FIX.md](NIGREDO-QUICK-FIX.md) - Seção Troubleshooting

---

## 📚 Próximos Passos

Após deploy bem-sucedido:

1. **Testar Integração**
   ```powershell
   .\scripts\test-nigredo-integration.ps1
   ```

2. **Configurar Monitoramento**
   - Acesse CloudWatch Dashboards
   - Configure notificações de alarmes

3. **Integrar com Frontend**
   - Consulte: [frontend/NIGREDO-README.md](frontend/NIGREDO-README.md)

4. **Deploy em Produção**
   - Consulte: [docs/nigredo/PRODUCTION-GUIDE.md](docs/nigredo/PRODUCTION-GUIDE.md)

---

## 🎓 Recursos Adicionais

- **Comandos Úteis:** [NIGREDO-COMMANDS.md](NIGREDO-COMMANDS.md)
- **API Documentation:** [docs/nigredo/API.md](docs/nigredo/API.md)
- **Operations Guide:** [docs/nigredo/OPERATIONS.md](docs/nigredo/OPERATIONS.md)
- **Monitoring:** [lib/dashboards/NIGREDO-MONITORING-README.md](lib/dashboards/NIGREDO-MONITORING-README.md)

---

**Pronto para começar? Execute:**
```powershell
.\fix-and-deploy-nigredo.ps1
```

🚀 Boa sorte com o deploy!

---

**Última Atualização:** 2024  
**Autor:** Kiro AI Assistant
