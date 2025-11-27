# Comandos Rápidos - Configuração de Grupos Cognito

**Data**: 25/11/2024

---

## 🚀 Opção 1: Script Automatizado (RECOMENDADO)

```powershell
# Navegar para o diretório de scripts
cd frontend/scripts

# Executar script de configuração
.\setup-cognito-groups.ps1
```

O script irá guiá-lo através de todo o processo interativamente.

---

## 🔧 Opção 2: Comandos AWS CLI Manuais

### Obter User Pool ID

```powershell
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty UserPools | `
  Where-Object { $_.Name -like "*alquimista*" }
```

### Criar Grupos

```powershell
# Substituir USER_POOL_ID pelo ID obtido acima

# Criar grupo Admins
aws cognito-idp create-group `
  --user-pool-id USER_POOL_ID `
  --group-name Admins `
  --description "Administradores da plataforma" `
  --precedence 1 `
  --region us-east-1

# Criar grupo Users
aws cognito-idp create-group `
  --user-pool-id USER_POOL_ID `
  --group-name Users `
  --description "Usuários tenants" `
  --precedence 2 `
  --region us-east-1
```

### Listar Usuários

```powershell
aws cognito-idp list-users `
  --user-pool-id USER_POOL_ID `
  --region us-east-1
```

### Adicionar Usuário ao Grupo

```powershell
# Substituir USERNAME pelo email do usuário

# Adicionar ao grupo Admins
aws cognito-idp admin-add-user-to-group `
  --user-pool-id USER_POOL_ID `
  --username USERNAME `
  --group-name Admins `
  --region us-east-1

# OU adicionar ao grupo Users
aws cognito-idp admin-add-user-to-group `
  --user-pool-id USER_POOL_ID `
  --username USERNAME `
  --group-name Users `
  --region us-east-1
```

### Verificar Grupos do Usuário

```powershell
aws cognito-idp admin-list-groups-for-user `
  --user-pool-id USER_POOL_ID `
  --username USERNAME `
  --region us-east-1
```

---

## 🧪 Teste Após Configuração

### 1. Limpar Estado do Navegador

Abra o console do navegador (F12) e execute:

```javascript
localStorage.clear();
sessionStorage.clear();
```

### 2. Fazer Novo Login

```
1. Acesse: http://localhost:3000/auth/login
2. Clique em "Login com Cognito"
3. Faça login com suas credenciais
4. Observe os logs no console
```

### 3. Verificar Logs Esperados

```
[Callback] Processando callback OAuth
[Callback] Código recebido: abc123...
[Cognito] Trocando código por tokens
[Cognito] Tokens obtidos
[Auth Store] Claims extraídos: {
  "cognito:groups": ["Admins"]
}
[Auth Store] Rota determinada: { route: "/app/company" }
[Callback] Redirecionando para: /app/company
```

---

## 🔍 Troubleshooting Rápido

### Erro: AWS CLI não encontrado

```powershell
# Instalar AWS CLI
winget install Amazon.AWSCLI
```

### Erro: Credenciais AWS não configuradas

```powershell
aws configure
```

### Erro: Grupos ainda não aparecem

```powershell
# Verificar se o grupo foi criado
aws cognito-idp list-groups `
  --user-pool-id USER_POOL_ID `
  --region us-east-1

# Verificar se o usuário foi adicionado
aws cognito-idp admin-list-groups-for-user `
  --user-pool-id USER_POOL_ID `
  --username USERNAME `
  --region us-east-1
```

### Erro: invalid_grant persiste

```powershell
# Reiniciar servidor Next.js
# No terminal do servidor: Ctrl+C
npm run dev

# Limpar navegador completamente
# Fechar todas as abas
# Reabrir navegador
```

---

## 📋 Checklist de Validação

- [ ] User Pool ID obtido
- [ ] Grupos criados (Admins e Users)
- [ ] Usuário adicionado a um grupo
- [ ] Grupos verificados via AWS CLI
- [ ] Estado do navegador limpo
- [ ] Servidor Next.js reiniciado
- [ ] Login testado
- [ ] Grupos aparecem nos logs
- [ ] Redirecionamento funciona corretamente

---

## 🎯 Resultado Final Esperado

```
✅ Grupos configurados no Cognito
✅ Usuário pertence a um grupo
✅ Login bem-sucedido
✅ Token contém grupos
✅ Redirecionamento correto
✅ Acesso ao dashboard apropriado
```

---

**Próximo passo**: Execute o script ou os comandos acima e teste o login!
