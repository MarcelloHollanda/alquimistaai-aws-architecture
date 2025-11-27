# ⚡ Quick Start - Deploy DEV

**Status:** ✅ Pronto  
**Tempo Total:** ~10 minutos

---

## 🚀 4 Comandos para Deploy

### 1. Criar Secrets (30s)

```powershell
cd .kiro\specs\micro-agente-disparo-agendamento
.\create-secrets.ps1
```

### 2. Build + Upload Lambdas (2-3min)

```powershell
.\build-and-upload-lambdas.ps1
```

### 3. Validar Recursos (30s)

```powershell
.\validate-terraform-vars.ps1
```

### 4. Deploy Terraform (5-10min)

```powershell
cd ..\..\..\..\terraform\envs\dev
terraform init
terraform plan
terraform apply
```

---

## ✅ Pronto!

**Testar:**
```powershell
curl "$(terraform output -raw api_gateway_url)/api/disparo-agenda/health"
```

---

## 📚 Docs Completos

- `COMANDOS-DEPLOY-DEV.md` - Guia detalhado
- `SESSAO-ALINHAMENTO-SECRETS-DEPLOY-2024-11-24.md` - O que foi alinhado
- `ALINHAMENTO-COMPLETO-RESUMO.md` - Resumo executivo
