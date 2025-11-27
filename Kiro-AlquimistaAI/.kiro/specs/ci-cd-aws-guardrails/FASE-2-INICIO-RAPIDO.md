# 🚀 Fase 2: Início Rápido - Configurar OIDC

**Tempo**: 10-20 minutos (com script automatizado)  
**Complexidade**: Baixa (script faz tudo)  
**Requisitos**: Acesso AWS + PowerShell

---

## ⚡ Opção 1: Script Automatizado (RECOMENDADO)

### Passo 1: Abrir PowerShell

Abra o PowerShell como Administrador no diretório do projeto.

### Passo 2: Executar Script

```powershell
# Navegar para o diretório do projeto
cd C:\caminho\para\alquimistaai-aws-architecture

# Executar script de configuração OIDC
.\scripts\setup-oidc-github-actions.ps1
```

### Passo 3: Aguardar Conclusão

O script irá:
1. ✅ Verificar pré-requisitos
2. ✅ Criar Identity Provider OIDC
3. ✅ Criar Trust Policy
4. ✅ Criar IAM Role
5. ✅ Criar Política de Permissões
6. ✅ Anexar política à role
7. ✅ Validar configuração
8. ✅ Gerar resumo

**Tempo**: 5-10 minutos

### Passo 4: Copiar ARNs

Ao final, o script exibirá um resumo com os ARNs criados:

```
=== ARNs CRIADOS ===

1. Identity Provider ARN:
arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com

2. IAM Role ARN:
arn:aws:iam::123456789012:role/GitHubActionsAlquimistaAICICD

3. IAM Policy ARN:
arn:aws:iam::123456789012:policy/GitHubActionsAlquimistaAIPolicy
```

**⚠️ IMPORTANTE**: Copie o **Role ARN** (item 2) - você precisará dele!

### Passo 5: Configurar GitHub Secrets

1. Acesse: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/secrets/actions

2. Clique em **"New repository secret"**

3. Adicione o primeiro secret:
   - **Name**: `AWS_ROLE_ARN`
   - **Value**: Cole o Role ARN copiado
   - Clique em **"Add secret"**

4. Adicione o segundo secret:
   - **Name**: `AWS_REGION`
   - **Value**: `us-east-1`
   - Clique em **"Add secret"**

**✅ PRONTO!** Fase 2 completa!

---

## 📋 Opção 2: Passo-a-Passo Manual

Se preferir fazer manualmente ou se o script falhar:

### Guia Completo

Abra e siga: `.kiro/specs/ci-cd-aws-guardrails/FASE-2-EXECUCAO-INTERATIVA.md`

**Tempo**: 1-2 horas

---

## 🚨 Troubleshooting Rápido

### Erro: "AWS CLI não encontrado"

**Solução**:
```powershell
# Instalar AWS CLI
winget install Amazon.AWSCLI

# Ou baixar de: https://aws.amazon.com/cli/
```

### Erro: "Credenciais não configuradas"

**Solução**:
```powershell
# Configurar AWS CLI
aws configure

# Informar:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

### Erro: "Access Denied"

**Solução**: Você precisa de permissões IAM para:
- Criar Identity Providers
- Criar Roles
- Criar Policies
- Anexar Policies

Solicite ao administrador AWS.

### Erro: "EntityAlreadyExists"

**Solução**: Componente já existe. O script detecta e reutiliza automaticamente.

Se quiser recriar:
```powershell
# Deletar role existente
aws iam delete-role --role-name GitHubActionsAlquimistaAICICD

# Executar script novamente
.\scripts\setup-oidc-github-actions.ps1
```

---

## ✅ Validação

### Como Saber se Funcionou?

Execute:

```powershell
# Verificar Identity Provider
aws iam list-open-id-connect-providers

# Verificar Role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD

# Verificar Políticas Anexadas
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD
```

**Resultado Esperado**: Todos os comandos retornam dados sem erros.

### Teste no GitHub

1. Faça um commit em uma branch
2. Abra um Pull Request
3. Vá para: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
4. Verifique se o workflow inicia

**Se o workflow executar sem erros de autenticação AWS, está funcionando!**

---

## 📊 Checklist de Conclusão

- [ ] Script executado com sucesso
- [ ] ARNs copiados e salvos
- [ ] GitHub Secret `AWS_ROLE_ARN` configurado
- [ ] GitHub Secret `AWS_REGION` configurado
- [ ] Validação executada
- [ ] Sem erros

**Se todos os itens estão marcados**: ✅ **FASE 2 COMPLETA!**

---

## 🚀 Próxima Fase

**Fase 3: Executar Testes**

**O que fazer**:
1. Abrir: `.kiro/specs/ci-cd-aws-guardrails/TASK-8-TESTING-GUIDE.md`
2. Seguir guia de testes
3. Validar pipeline end-to-end

**Tempo**: 2-3 horas  
**Quando**: Após configurar GitHub Secrets

---

## 📞 Precisa de Ajuda?

### Documentação Completa

- **Guia Interativo**: `.kiro/specs/ci-cd-aws-guardrails/FASE-2-EXECUCAO-INTERATIVA.md`
- **Documentação OIDC**: `docs/ci-cd/OIDC-SETUP.md`
- **Troubleshooting**: `docs/ci-cd/TROUBLESHOOTING.md`

### Comandos Úteis

- **Comandos Rápidos**: `docs/ci-cd/QUICK-COMMANDS.md`
- **Validação**: `scripts/setup-oidc-github-actions.ps1 -SkipValidation:$false`

---

**Status**: 🚀 PRONTO PARA EXECUTAR  
**Tempo Estimado**: 10-20 minutos  
**Próxima Ação**: Executar script PowerShell
