# Referência Rápida - Acesso GitHub via Kiro

## 🚀 Uso Rápido

### Comando Básico

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI
.\.kiro\scripts\get-github-file.ps1 -Path "caminho/do/arquivo.ext"
```

### Exemplos Comuns

```powershell
# Arquivo na raiz
.\.kiro\scripts\get-github-file.ps1 -Path "README.md"

# Terraform
.\.kiro\scripts\get-github-file.ps1 -Path "terraform/envs/dev/main.tf"

# Workflow CI/CD
.\.kiro\scripts\get-github-file.ps1 -Path ".github/workflows/ci-cd-dev.yml"

# Lambda
.\.kiro\scripts\get-github-file.ps1 -Path "lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts"

# Frontend
.\.kiro\scripts\get-github-file.ps1 -Path "frontend/src/middleware.ts"

# CDK Stack
.\.kiro\scripts\get-github-file.ps1 -Path "lib/security-stack.ts"
```

---

## 🔧 Setup Inicial

### 1. Criar Token GitHub

1. Acesse: https://github.com/settings/tokens
2. "Generate new token" → "Generate new token (classic)"
3. Configure:
   - **Note**: `AlquimistaAI Kiro Access`
   - **Expiration**: 90 days
   - **Scopes**: Marque `repo`
4. Copie o token gerado

### 2. Salvar Token

```powershell
# Criar arquivo de token
Set-Content -Path ".kiro\secrets\github-pat-alquimistaai.txt" -Value "ghp_SEU_TOKEN_AQUI"
```

### 3. Testar

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path "README.md"
```

---

## 🔍 Troubleshooting Rápido

### Erro: "Token não fornecido"

```powershell
# Verificar se arquivo existe
Test-Path .kiro\secrets\github-pat-alquimistaai.txt

# Verificar conteúdo
Get-Content .kiro\secrets\github-pat-alquimistaai.txt
```

**Solução:** Criar/atualizar arquivo com token válido.

### Erro: "401 Unauthorized"

**Causa:** Token inválido ou expirado.

**Solução:** Gerar novo token e atualizar arquivo.

### Erro: "404 Not Found"

**Causa:** Arquivo não existe ou path incorreto.

**Solução:** Verificar path no GitHub web interface.

---

## 📋 Parâmetros do Script

| Parâmetro | Obrigatório | Padrão | Descrição |
|-----------|-------------|--------|-----------|
| `-Path` | ✅ Sim | - | Caminho do arquivo no repo |
| `-Owner` | ❌ Não | `MarcelloHollanda` | Dono do repositório |
| `-Repo` | ❌ Não | `alquimistaai-aws-arquitetura` | Nome do repositório |
| `-Ref` | ❌ Não | `main` | Branch ou tag |

---

## 🔐 Segurança

### ✅ Fazer

- Manter token em `.kiro/secrets/github-pat-alquimistaai.txt`
- Rotacionar token a cada 90 dias
- Usar permissões mínimas (`repo` apenas)
- Verificar `.gitignore` protege `.kiro/secrets/`

### ❌ Nunca

- Commitar token no Git
- Compartilhar token em chat/email
- Usar token em código-fonte
- Deixar token em logs

---

## 🔄 Fluxo Operacional

```
1. GPT solicita arquivo
   ↓
2. GPT fornece comando PowerShell
   ↓
3. Fundador executa comando
   ↓
4. Fundador copia output
   ↓
5. Fundador cola na conversa
   ↓
6. GPT analisa código real
   ↓
7. GPT gera blueprint preciso
   ↓
8. Kiro aplica mudanças
```

---

## 📚 Documentação Completa

- **Protocolo oficial**: `docs/FLUXO-GPT-GITHUB-KIRO.md`
- **Changelog completo**: `docs/CHANGELOG-KIRO-GITHUB-ACCESS.md`
- **Setup de segredos**: `.kiro/secrets/README.md`
- **Documentação do script**: `.kiro/scripts/README.md`

---

## 🎯 Casos de Uso

### Análise de Terraform

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path "terraform/envs/dev/main.tf"
```

**Quando usar:** GPT precisa revisar configuração antes de sugerir mudanças.

### Revisão de CI/CD

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path ".github/workflows/ci-cd-dev.yml"
```

**Quando usar:** GPT precisa entender pipeline para sugerir melhorias.

### Análise de Stack CDK

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path "lib/security-stack.ts"
```

**Quando usar:** GPT precisa revisar infraestrutura antes de modificar.

### Debug de Frontend

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path "frontend/src/middleware.ts"
```

**Quando usar:** GPT precisa diagnosticar erro 404/500 em rotas.

### Análise de Lambda

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path "lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts"
```

**Quando usar:** GPT precisa revisar handler antes de sugerir correções.

---

## 💡 Dicas

### Múltiplos Arquivos

Execute comandos sequencialmente e cole todos os outputs:

```powershell
# Arquivo 1
.\.kiro\scripts\get-github-file.ps1 -Path "lib/security-stack.ts"

# Arquivo 2
.\.kiro\scripts\get-github-file.ps1 -Path "lib/waf-stack.ts"
```

Na conversa com GPT:

```
Conteúdo de lib/security-stack.ts:
[colar conteúdo 1]

Conteúdo de lib/waf-stack.ts:
[colar conteúdo 2]
```

### Branch Específica

```powershell
.\.kiro\scripts\get-github-file.ps1 -Path "README.md" -Ref "develop"
```

### Outro Repositório

```powershell
.\.kiro\scripts\get-github-file.ps1 `
  -Owner "outro-usuario" `
  -Repo "outro-repo" `
  -Path "config.yml"
```

---

## 📞 Suporte

**Problemas?** Consulte:
1. Esta referência rápida
2. `docs/FLUXO-GPT-GITHUB-KIRO.md` (troubleshooting completo)
3. `docs/CHANGELOG-KIRO-GITHUB-ACCESS.md` (lições aprendidas)

---

**Versão:** 1.0.0  
**Última Atualização:** 27/11/2024  
**Mantido por:** Equipe AlquimistaAI
