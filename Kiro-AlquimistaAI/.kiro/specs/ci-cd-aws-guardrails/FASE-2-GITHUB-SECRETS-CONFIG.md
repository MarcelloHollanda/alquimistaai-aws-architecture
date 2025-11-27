# 🔐 Configuração dos GitHub Secrets - FASE 2

## ✅ Status Atual

- ✅ OIDC Provider criado
- ✅ IAM Role criada: `GitHubActionsAlquimistaAICICD`
- ✅ Permissões anexadas à role
- ✅ ARN da role obtido

---

## 📋 Secrets a Configurar

Você precisa adicionar **3 secrets** no repositório GitHub:

### 1. `AWS_ROLE_ARN`
```
arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD
```

### 2. `AWS_REGION`
```
us-east-1
```

### 3. `AWS_ACCOUNT_ID`
```
207933152643
```

---

## 🚀 Como Adicionar os Secrets no GitHub

### Passo 1: Acessar o Repositório
1. Acesse: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture
2. Faça login se necessário

### Passo 2: Ir para Settings
1. Clique na aba **Settings** (no topo do repositório)
2. No menu lateral esquerdo, clique em **Secrets and variables**
3. Clique em **Actions**

### Passo 3: Adicionar Cada Secret

#### Secret 1: AWS_ROLE_ARN
1. Clique no botão **New repository secret**
2. **Name**: `AWS_ROLE_ARN`
3. **Secret**: `arn:aws:iam::207933152643:role/GitHubActionsAlquimistaAICICD`
4. Clique em **Add secret**

#### Secret 2: AWS_REGION
1. Clique no botão **New repository secret**
2. **Name**: `AWS_REGION`
3. **Secret**: `us-east-1`
4. Clique em **Add secret**

#### Secret 3: AWS_ACCOUNT_ID
1. Clique no botão **New repository secret**
2. **Name**: `AWS_ACCOUNT_ID`
3. **Secret**: `207933152643`
4. Clique em **Add secret**

---

## ✅ Verificação

Após adicionar os 3 secrets, você deve ver na página de Secrets:

- ✅ `AWS_ROLE_ARN`
- ✅ `AWS_REGION`
- ✅ `AWS_ACCOUNT_ID`

---

## 🎯 Próximos Passos

Depois de configurar os secrets:

1. **Testar o workflow** fazendo um commit e push
2. **Verificar** se o GitHub Actions consegue assumir a role
3. **Validar** se o deploy funciona corretamente

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
- Verifique se os valores foram copiados corretamente
- Confirme que não há espaços extras nos secrets
- Verifique se o repositório está correto

---

**Data de Criação**: 2024
**Última Atualização**: Fase 2 - Configuração OIDC Completa
