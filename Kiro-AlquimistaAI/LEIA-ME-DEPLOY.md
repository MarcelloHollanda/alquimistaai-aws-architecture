# 🚀 Deploy - Alquimista.AI

**Documentação consolidada e organizada de deploy.**

---

## ⚡ Início Rápido

### Deploy Completo - Backend + Frontend (RECOMENDADO)

```powershell
# Deploy de todo o sistema em 1 comando
.\deploy-alquimista.ps1
```

### Deploy Apenas Backend

```powershell
# Deploy limpo do backend
.\deploy-limpo.ps1

# Validar
.\VALIDAR-DEPLOY.ps1
```

---

## 📚 Documentação Completa

Toda a documentação de deploy foi organizada em:

**📁 `docs/deploy/`**

- **[README.md](./docs/deploy/README.md)** - Índice principal
- **[QUICK-START.md](./docs/deploy/QUICK-START.md)** - Guia rápido
- **[TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)** - Soluções para problemas

---

## 🛠️ Scripts Disponíveis

### Na Raiz do Projeto

| Script | Descrição |
|--------|-----------|
| `deploy-alquimista.ps1` | **Deploy completo: Backend + Frontend** ⭐ |
| `deploy-limpo.ps1` | Deploy limpo do backend |
| `deploy-backend.ps1` | Deploy apenas do backend |
| `VALIDAR-DEPLOY.ps1` | Validação pós-deploy |
| `limpar-stack.ps1` | Limpar stack com falha |
| `limpar-docs-deploy.ps1` | Organizar documentação |

### Comandos NPM

```powershell
npm run deploy:dev      # Deploy desenvolvimento
npm run deploy:staging  # Deploy staging
npm run deploy:prod     # Deploy produção
```

---

## 📊 Status Atual

```powershell
# Ver status
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"
```

---

## 🧹 Organização de Arquivos

Executamos uma limpeza e consolidação da documentação:

### ✅ Arquivos Mantidos (Raiz)
- `deploy-limpo.ps1` - Script principal
- `deploy-backend.ps1` - Deploy backend
- `VALIDAR-DEPLOY.ps1` - Validação
- `limpar-stack.ps1` - Limpeza
- `README.md` - README principal
- `SETUP.md` - Setup inicial

### 📦 Arquivos Arquivados
Documentos antigos/duplicados foram movidos para:
- `docs/deploy/archive/`

### 📁 Nova Estrutura
```
docs/deploy/
├── README.md              # Índice principal
├── QUICK-START.md         # Guia rápido
├── TROUBLESHOOTING.md     # Soluções
└── archive/               # Arquivos antigos
```

---

## 🆘 Precisa de Ajuda?

1. **Problemas comuns**: [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)
2. **Guia rápido**: [docs/deploy/QUICK-START.md](./docs/deploy/QUICK-START.md)
3. **Documentação completa**: [docs/deploy/README.md](./docs/deploy/README.md)

---

## 🔄 Limpar Documentação Antiga

Se ainda houver arquivos duplicados na raiz:

```powershell
.\limpar-docs-deploy.ps1
```

Isso moverá arquivos antigos para `docs/deploy/archive/`.

---

**Última atualização**: 13 de novembro de 2025
