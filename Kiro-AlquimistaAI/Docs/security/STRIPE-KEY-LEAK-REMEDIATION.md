# Remediação de Vazamento de Chave Stripe

## Data: 2024-11-27

---

## 🚨 Problema Identificado

O GitHub bloqueou o push devido à detecção de uma Stripe API Key no histórico do repositório:

```
GH013: Repository rule violations found
Push cannot contain secrets
—— Stripe API Key
locations: blob id: 097097d8...
```

**Causa**: Em algum commit do histórico existe uma chave Stripe real (não apenas exemplos de documentação).

---

## ✅ Plano de Remediação Seguro

### Fase 1: Rotacionar a Chave (URGENTE)

**⚠️ FAZER PRIMEIRO, ANTES DE QUALQUER COISA:**

1. **Acessar Dashboard da Stripe**
   - Login em: https://dashboard.stripe.com/
   - Ir para: Developers → API Keys

2. **Revogar a Chave Antiga**
   - Encontrar a chave que vazou
   - Clicar em "Delete" ou "Revoke"
   - Confirmar revogação

3. **Gerar Nova Chave**
   - Clicar em "Create secret key"
   - Copiar a nova chave (aparece apenas uma vez)
   - **NÃO colar em nenhum arquivo versionado**

4. **Armazenar no AWS Secrets Manager**
   ```bash
   # DEV
   aws secretsmanager create-secret \
     --name /alquimista/dev/stripe/secret-key \
     --secret-string "NOVA_CHAVE_AQUI" \
     --region us-east-1
   
   # PROD (se aplicável)
   aws secretsmanager create-secret \
     --name /alquimista/prod/stripe/secret-key \
     --secret-string "NOVA_CHAVE_AQUI" \
     --region us-east-1
   ```

---

### Fase 2: Localizar e Remover a Chave do Código

#### 2.1. Buscar Arquivos com Chaves Reais

```powershell
# Buscar por padrões de chaves Stripe
git grep -E "sk_live_[0-9a-zA-Z]{24,}" $(git rev-list --all)
git grep -E "sk_test_[0-9a-zA-Z]{24,}" $(git rev-list --all)
```

#### 2.2. Identificar Commits Problemáticos

```powershell
# Ver histórico de um arquivo específico
git log --all --full-history -- caminho/do/arquivo

# Ver conteúdo de um commit específico
git show <commit-hash>:caminho/do/arquivo
```

#### 2.3. Remover Chave dos Arquivos Atuais

**Se a chave estiver em arquivo de configuração:**

```bash
# Exemplo: .env ou config file
# ANTES:
STRIPE_SECRET_KEY=sk_live_51234567890abcdef

# DEPOIS:
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY} # Vem do Secrets Manager
```

**Se a chave estiver em código:**

```typescript
// ANTES:
const stripeKey = 'sk_live_51234567890abcdef';

// DEPOIS:
import { getSecret } from './utils/secrets';
const stripeKey = await getSecret('/alquimista/dev/stripe/secret-key');
```

---

### Fase 3: Limpar o Histórico do Git

**⚠️ ATENÇÃO: Isso reescreve o histórico. Faça backup primeiro!**

#### Opção A: Usar BFG Repo-Cleaner (Recomendado)

```powershell
# 1. Instalar BFG
# Download: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Fazer backup
git clone --mirror https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git backup-repo.git

# 3. Criar arquivo com padrões a remover
@"
sk_live_*
sk_test_*
"@ | Out-File -FilePath secrets-to-remove.txt -Encoding UTF8

# 4. Executar BFG
java -jar bfg.jar --replace-text secrets-to-remove.txt alquimistaai-aws-architecture.git

# 5. Limpar e compactar
cd alquimistaai-aws-architecture.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Push forçado
git push --force
```

#### Opção B: Usar git filter-branch (Manual)

```powershell
# 1. Backup
git clone . ../backup-alquimistaai

# 2. Filtrar histórico
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch caminho/do/arquivo/com/chave" `
  --prune-empty --tag-name-filter cat -- --all

# 3. Limpar referências
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Push forçado
git push origin --force --all
git push origin --force --tags
```

#### Opção C: Usar git-filter-repo (Mais Moderno)

```powershell
# 1. Instalar git-filter-repo
pip install git-filter-repo

# 2. Criar arquivo de substituição
@"
regex:sk_live_[0-9a-zA-Z]{24,}==>STRIPE_KEY_REMOVED
regex:sk_test_[0-9a-zA-Z]{24,}==>STRIPE_KEY_REMOVED
"@ | Out-File -FilePath replace-patterns.txt -Encoding UTF8

# 3. Executar filtro
git filter-repo --replace-text replace-patterns.txt

# 4. Re-adicionar remote (filter-repo remove)
git remote add origin https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git

# 5. Push forçado
git push origin --force --all
git push origin --force --tags
```

---

### Fase 4: Verificar e Validar

#### 4.1. Verificar que a Chave Foi Removida

```powershell
# Buscar em todo o histórico
git grep -E "sk_live_[0-9a-zA-Z]{24,}" $(git rev-list --all)
git grep -E "sk_test_[0-9a-zA-Z]{24,}" $(git rev-list --all)

# Não deve retornar nada (ou apenas exemplos de documentação)
```

#### 4.2. Testar Push

```powershell
# Tentar push novamente
git push origin main

# Deve funcionar sem bloqueio do GitHub
```

#### 4.3. Verificar Aplicação

```bash
# Verificar que a aplicação ainda funciona com a nova chave
# (do Secrets Manager)
```

---

### Fase 5: Prevenir Futuros Vazamentos

#### 5.1. Adicionar ao .gitignore

```gitignore
# Secrets e configurações sensíveis
.env
.env.local
.env.*.local
*.key
*.pem
secrets/
config/secrets.json

# Stripe
stripe-config.json
```

#### 5.2. Configurar Pre-commit Hook

Criar `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Verificar por padrões de secrets
if git diff --cached | grep -E "sk_live_[0-9a-zA-Z]{24,}|sk_test_[0-9a-zA-Z]{24,}"; then
    echo "ERRO: Detectada possível chave Stripe no commit!"
    echo "Remova a chave e use Secrets Manager."
    exit 1
fi

exit 0
```

Tornar executável:
```powershell
chmod +x .git/hooks/pre-commit
```

#### 5.3. Usar git-secrets (Recomendado)

```powershell
# Instalar git-secrets
# Windows: https://github.com/awslabs/git-secrets

# Configurar
git secrets --install
git secrets --register-aws
git secrets --add 'sk_live_[0-9a-zA-Z]{24,}'
git secrets --add 'sk_test_[0-9a-zA-Z]{24,}'
git secrets --add 'pk_live_[0-9a-zA-Z]{24,}'
git secrets --add 'pk_test_[0-9a-zA-Z]{24,}'

# Escanear repositório
git secrets --scan
```

#### 5.4. Documentar Processo

Atualizar `SECURITY.md`:

```markdown
## Gerenciamento de Secrets

### ❌ NUNCA fazer:
- Commitar API keys, tokens ou senhas
- Usar secrets em variáveis de ambiente versionadas
- Compartilhar secrets via chat ou email

### ✅ SEMPRE fazer:
- Usar AWS Secrets Manager para todos os secrets
- Rotacionar secrets regularmente
- Usar git-secrets para prevenir commits acidentais
- Revisar PRs para secrets expostos
```

---

## 📋 Checklist de Remediação

- [ ] **Fase 1: Rotacionar Chave**
  - [ ] Acessar Dashboard Stripe
  - [ ] Revogar chave antiga
  - [ ] Gerar nova chave
  - [ ] Armazenar no Secrets Manager

- [ ] **Fase 2: Remover do Código**
  - [ ] Localizar arquivos com chave
  - [ ] Substituir por referência ao Secrets Manager
  - [ ] Commit das alterações

- [ ] **Fase 3: Limpar Histórico**
  - [ ] Fazer backup do repositório
  - [ ] Escolher método (BFG/filter-branch/filter-repo)
  - [ ] Executar limpeza
  - [ ] Push forçado

- [ ] **Fase 4: Verificar**
  - [ ] Buscar chaves no histórico
  - [ ] Testar push
  - [ ] Validar aplicação

- [ ] **Fase 5: Prevenir**
  - [ ] Atualizar .gitignore
  - [ ] Configurar pre-commit hook
  - [ ] Instalar git-secrets
  - [ ] Documentar processo

---

## 🆘 Troubleshooting

### Problema: Push ainda bloqueado após limpeza

**Causa**: Histórico não foi completamente limpo

**Solução**:
```powershell
# Verificar se ainda há referências
git log --all --full-history --source --all -- '*stripe*'

# Limpar refs antigas
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Problema: Aplicação quebrou após rotação

**Causa**: Nova chave não está acessível

**Solução**:
```bash
# Verificar se secret existe
aws secretsmanager describe-secret \
  --secret-id /alquimista/dev/stripe/secret-key \
  --region us-east-1

# Verificar permissões IAM da Lambda
aws iam get-role-policy \
  --role-name lambda-execution-role \
  --policy-name secrets-access
```

### Problema: Colaboradores com histórico antigo

**Causa**: Outros desenvolvedores têm clones com histórico antigo

**Solução**:
```powershell
# Notificar equipe para re-clonar
# Cada desenvolvedor deve:
git clone https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git novo-clone
cd novo-clone
# Continuar trabalho no novo clone
```

---

## 📚 Referências

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [Stripe API Keys Best Practices](https://stripe.com/docs/keys)

---

**Criado em**: 2024-11-27  
**Mantido por**: Equipe AlquimistaAI  
**Status**: Ativo
