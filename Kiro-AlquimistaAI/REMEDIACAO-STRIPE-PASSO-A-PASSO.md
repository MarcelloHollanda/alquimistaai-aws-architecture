# Remediação de Chave Stripe - Passo a Passo

## Data: 2024-11-27

---

## 📋 Situação Atual

**Problema**: GitHub bloqueou push devido a padrão de chave Stripe no histórico

**Arquivo identificado**: `tests/unit/inventory/sanitizer.test.ts` (blob `097097d8`)

**Tipo de chave**: Exemplo fake de teste (`sk_live_abcdefghijklmnopqrstuvwxyz`)

**Status**: ✅ Arquivo já corrigido no commit atual

---

## ✅ O Que Já Foi Feito

1. ✅ Identificado o arquivo com o padrão problemático
2. ✅ Substituído `sk_live_abcdefghijklmnopqrstuvwxyz` por `sk_live_FAKE_KEY_FOR_TESTING_ONLY_123456`
3. ✅ Commit criado: "security: substituir exemplo de chave Stripe por valor claramente fake"
4. ✅ Scripts de remediação criados

---

## 🚀 Próximos Passos (Execute Agora)

### Opção A: Reescrita Completa do Histórico (RECOMENDADO)

Esta é a opção mais simples e segura. Cria uma nova história limpa.

```powershell
# Executar script automatizado
.\rewrite-history-clean.ps1

# Quando solicitado, digite: REESCREVER
```

**O que o script faz:**
1. Cria branch orphan (sem histórico)
2. Adiciona todos os arquivos atuais
3. Cria commit inicial limpo
4. Substitui a main
5. Faz push forçado

**Resultado**: GitHub verá apenas 1 commit inicial, sem histórico antigo.

---

### Opção B: Limpeza Manual do Histórico

Se preferir fazer manualmente:

```powershell
# 1. Garantir que está na main
git checkout main

# 2. Criar branch orphan
git checkout --orphan clean-main

# 3. Adicionar todos os arquivos
git add .

# 4. Commit inicial
git commit -m "chore: initial clean commit (history rewritten to remove secrets)"

# 5. Renomear para main
git branch -M main

# 6. Push forçado
git push -u origin main --force
```

---

## 🔍 Verificação

Após executar a remediação:

```powershell
# Ver histórico (deve ter apenas 1 commit)
git log --oneline

# Tentar push novamente
git push origin main

# Deve funcionar sem bloqueio do GitHub
```

---

## 📚 Documentação Criada

1. **`docs/security/STRIPE-KEY-LEAK-REMEDIATION.md`**
   - Guia completo de remediação
   - Troubleshooting
   - Prevenção de futuros vazamentos

2. **`scripts/security/remediate-stripe-leak.ps1`**
   - Script automatizado de scan e limpeza
   - Usa git-filter-repo ou filter-branch

3. **`scripts/security/clean-stripe-history.ps1`**
   - Script simplificado de limpeza

4. **`rewrite-history-clean.ps1`** ⭐ RECOMENDADO
   - Script de reescrita completa (orphan branch)
   - Mais simples e seguro

5. **`REMEDIACAO-STRIPE-PASSO-A-PASSO.md`** (este arquivo)
   - Guia rápido de execução

---

## ⚠️ Notas Importantes

### Sobre a "Chave" Encontrada

- **NÃO era uma chave real**: Era apenas um exemplo fake em testes
- **Padrão**: `sk_live_abcdefghijklmnopqrstuvwxyz` (claramente fake)
- **Localização**: Arquivo de teste unitário
- **Risco**: Nenhum (não havia chave real exposta)

### Por Que Fazer a Remediação Mesmo Assim?

1. **Protocolo de segurança**: Seguir o processo correto
2. **GitHub bloqueou**: Não podemos fazer push sem corrigir
3. **Boa prática**: Evitar padrões que parecem secrets
4. **Documentação**: Criar processo para casos futuros reais

### Não É Necessário Rotacionar Chaves

Como não havia chave real, **NÃO é necessário**:
- ❌ Rotacionar chaves na Stripe
- ❌ Atualizar Secrets Manager
- ❌ Modificar código de produção

Apenas precisamos limpar o histórico do Git.

---

## 🎯 Comando Rápido (TL;DR)

```powershell
# Execute isto:
.\rewrite-history-clean.ps1

# Digite quando solicitado:
REESCREVER

# Aguarde conclusão e verifique:
git log --oneline
```

---

## 🆘 Se Algo Der Errado

### Push ainda bloqueado

```powershell
# Verificar se há mais padrões
git log --all --oneline | Select-Object -First 10

# Verificar histórico
git log --all --source --all -- '*stripe*'
```

### Erro no script

```powershell
# Reverter para estado anterior
git checkout main
git branch -D clean-main

# Tentar novamente
.\rewrite-history-clean.ps1
```

### Precisa de ajuda

Consulte a documentação completa:
- `docs/security/STRIPE-KEY-LEAK-REMEDIATION.md`

---

## ✅ Checklist Final

Após executar a remediação:

- [ ] Histórico reescrito (apenas 1 commit)
- [ ] Push funcionando sem bloqueio
- [ ] Verificado que não há mais padrões problemáticos
- [ ] Documentação revisada
- [ ] Scripts de prevenção configurados (opcional)

---

## 📞 Contato

Se precisar de ajuda adicional, consulte:
- Documentação em `docs/security/`
- Scripts em `scripts/security/`

---

**Criado em**: 2024-11-27  
**Status**: Pronto para execução  
**Ação recomendada**: Execute `.\rewrite-history-clean.ps1`
