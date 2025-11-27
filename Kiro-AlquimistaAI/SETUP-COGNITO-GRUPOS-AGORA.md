# 🚀 Setup Cognito Grupos - EXECUTE AGORA

## Passo 1: Encontrar User Pool ID

```powershell
# Listar User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

**Copie o ID do User Pool** (formato: `us-east-1_XXXXXXXXX`)

## Passo 2: Executar Script

```powershell
# Substituir XXXXXXXXX pelo ID real
.\scripts\setup-cognito-groups.ps1 -UserPoolId "us-east-1_XXXXXXXXX"
```

## ✅ Resultado Esperado

```
========================================
Configuração Grupos Cognito
========================================

User Pool ID: us-east-1_ABC123XYZ
Região: us-east-1

✓ AWS CLI: aws-cli/2.x.x

Criando grupos...

Criando grupo: INTERNAL_ADMIN... ✓
Criando grupo: INTERNAL_SUPPORT... ✓
Criando grupo: TENANT_ADMIN... ✓
Criando grupo: TENANT_USER... ✓

Grupos processados: 4/4

Verificando grupos criados...
+-------------------+
|   GroupName       |
+-------------------+
| INTERNAL_ADMIN    |
| INTERNAL_SUPPORT  |
| TENANT_ADMIN      |
| TENANT_USER       |
+-------------------+

========================================
Configuração Concluída!
========================================
```

## 🆘 Se Não Tiver User Pool

```powershell
# Criar User Pool via CDK
cdk deploy AlquimistaCognitoStack --context env=dev

# Depois execute o script de grupos
```

## 📋 Próximo Passo

Após criar os grupos com sucesso:

```powershell
# Abrir tasks e começar Task 2
code .kiro\specs\operational-dashboard-alquimistaai\tasks.md
```

**Task 2**: Implementar Middleware de Autorização

---

**IMPORTANTE**: Substitua `us-east-1_XXXXXXXXX` pelo ID real do seu User Pool!
