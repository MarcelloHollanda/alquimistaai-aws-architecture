# 📚 Índice de Deploy - Alquimista.AI

Guia completo de toda a documentação de deploy disponível.

---

## 🎯 Por Onde Começar?

### Novo no Projeto?
1. **[START-HERE.md](./START-HERE.md)** ⭐ - Comece aqui!
2. **[QUICK-START-DEPLOY.md](./QUICK-START-DEPLOY.md)** - Guia rápido
3. **[DEPLOY-READY-SUMMARY.md](./DEPLOY-READY-SUMMARY.md)** - Resumo executivo

### Já Conhece o Projeto?
1. **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)** - Referência rápida
2. Execute: `.\DEPLOY-FULL-SYSTEM.ps1`

---

## 📖 Documentação Completa

### Guias de Deploy

| Arquivo | Descrição | Tempo de Leitura |
|---------|-----------|------------------|
| **[START-HERE.md](./START-HERE.md)** | Ponto de partida - Leia primeiro! | 5 min |
| **[QUICK-START-DEPLOY.md](./QUICK-START-DEPLOY.md)** | Guia rápido de deploy | 5 min |
| **[DEPLOY-INTEGRATION-GUIDE.md](./DEPLOY-INTEGRATION-GUIDE.md)** | Guia completo e detalhado | 15 min |
| **[DEPLOY-READY-SUMMARY.md](./DEPLOY-READY-SUMMARY.md)** | Resumo executivo do projeto | 10 min |
| **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)** | Referência de comandos | 3 min |

### Documentação Antiga (Referência)

| Arquivo | Descrição |
|---------|-----------|
| **[LEIA-ME-DEPLOY.md](./LEIA-ME-DEPLOY.md)** | Documentação consolidada antiga |
| **[docs/deploy/DEPLOY-COMPLETO.md](./docs/deploy/DEPLOY-COMPLETO.md)** | Guia antigo de deploy |
| **[docs/deploy/README.md](./docs/deploy/README.md)** | Índice da pasta docs/deploy |
| **[docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)** | Soluções para problemas |

---

## 🛠️ Scripts Disponíveis

### Scripts Principais

| Script | Descrição | Uso |
|--------|-----------|-----|
| **DEPLOY-FULL-SYSTEM.ps1** | Deploy completo (backend + frontend) | `.\DEPLOY-FULL-SYSTEM.ps1` |
| **VALIDATE-INTEGRATION.ps1** | Validação completa do sistema | `.\VALIDATE-INTEGRATION.ps1` |
| **deploy-limpo.ps1** | Deploy limpo do backend | `.\deploy-limpo.ps1` |
| **VALIDAR-DEPLOY.ps1** | Validação básica | `.\VALIDAR-DEPLOY.ps1` |
| **limpar-stack.ps1** | Limpar stack com falha | `.\limpar-stack.ps1` |

### Scripts de Frontend

| Script | Descrição | Uso |
|--------|-----------|-----|
| **frontend/deploy-frontend.ps1** | Deploy apenas frontend | `cd frontend && .\deploy-frontend.ps1` |
| **frontend/START-DEV.ps1** | Iniciar dev server | `cd frontend && .\START-DEV.ps1` |
| **frontend/CHECK-STATUS.ps1** | Verificar status | `cd frontend && .\CHECK-STATUS.ps1` |

### Scripts de Backend

| Script | Descrição | Uso |
|--------|-----------|-----|
| **deploy-backend.ps1** | Deploy apenas backend | `.\deploy-backend.ps1` |
| **deploy-alquimista.ps1** | Deploy completo (antigo) | `.\deploy-alquimista.ps1` |

---

## 📂 Estrutura de Documentação

```
📁 Raiz do Projeto
│
├── 📄 START-HERE.md                    ⭐ COMECE AQUI
├── 📄 QUICK-START-DEPLOY.md            Guia rápido
├── 📄 DEPLOY-INTEGRATION-GUIDE.md      Guia completo
├── 📄 DEPLOY-READY-SUMMARY.md          Resumo executivo
├── 📄 COMANDOS-RAPIDOS.md              Referência de comandos
├── 📄 DEPLOY-INDEX.md                  Este arquivo
│
├── 🔧 DEPLOY-FULL-SYSTEM.ps1           Script principal
├── 🔧 VALIDATE-INTEGRATION.ps1         Validação completa
├── 🔧 deploy-limpo.ps1                 Deploy limpo
├── 🔧 VALIDAR-DEPLOY.ps1               Validação básica
│
├── 📁 docs/
│   ├── 📁 deploy/
│   │   ├── 📄 README.md                Índice
│   │   ├── 📄 DEPLOY-COMPLETO.md       Guia antigo
│   │   ├── 📄 TROUBLESHOOTING.md       Soluções
│   │   └── 📁 archive/                 Arquivos antigos
│   │
│   ├── 📁 ecosystem/                   Arquitetura
│   └── 📁 agents/                      Documentação dos agentes
│
├── 📁 frontend/
│   ├── 📄 README.md                    README do frontend
│   ├── 📄 COMECE-AQUI.md               Guia do frontend
│   ├── 🔧 deploy-frontend.ps1          Deploy frontend
│   └── 🔧 START-DEV.ps1                Dev server
│
└── 📁 .kiro/specs/                     Especificações
    ├── 📁 frontend-implementation/
    └── 📁 fibonacci-aws-setup/
```

---

## 🎯 Fluxos de Trabalho

### Fluxo 1: Primeiro Deploy (Novo Usuário)

```
1. Ler START-HERE.md (5 min)
   ↓
2. Verificar pré-requisitos
   aws sts get-caller-identity
   node --version
   vercel --version
   ↓
3. Instalar dependências
   npm install
   cd frontend && npm install && cd ..
   ↓
4. Executar deploy
   .\DEPLOY-FULL-SYSTEM.ps1
   ↓
5. Validar
   .\VALIDATE-INTEGRATION.ps1
   ↓
6. Testar no navegador
```

### Fluxo 2: Deploy Rápido (Usuário Experiente)

```
1. Verificar comandos
   Get-Content COMANDOS-RAPIDOS.md
   ↓
2. Deploy
   .\DEPLOY-FULL-SYSTEM.ps1
   ↓
3. Validar
   .\VALIDATE-INTEGRATION.ps1
```

### Fluxo 3: Deploy Apenas Backend

```
1. Deploy backend
   .\DEPLOY-FULL-SYSTEM.ps1 -SkipFrontend
   ↓
2. Validar
   .\VALIDATE-INTEGRATION.ps1
   ↓
3. Testar API
   curl https://[API-URL]/health
```

### Fluxo 4: Deploy Apenas Frontend

```
1. Configurar .env.production
   ↓
2. Deploy frontend
   .\DEPLOY-FULL-SYSTEM.ps1 -SkipBackend
   ↓
3. Testar no navegador
```

---

## 🔍 Busca Rápida

### Preciso de...

#### "Como fazer o deploy?"
→ **[START-HERE.md](./START-HERE.md)**

#### "Comandos rápidos"
→ **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)**

#### "Guia completo"
→ **[DEPLOY-INTEGRATION-GUIDE.md](./DEPLOY-INTEGRATION-GUIDE.md)**

#### "Resumo do projeto"
→ **[DEPLOY-READY-SUMMARY.md](./DEPLOY-READY-SUMMARY.md)**

#### "Problemas no deploy"
→ **[docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)**

#### "Validar deploy"
→ Execute: `.\VALIDATE-INTEGRATION.ps1`

#### "Ver logs"
→ `aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow`

#### "Testar API"
→ `curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/health`

---

## 📊 Documentação por Tópico

### Backend (AWS CDK)
- **[lib/fibonacci-stack.ts](./lib/fibonacci-stack.ts)** - Stack principal
- **[lib/nigredo-stack.ts](./lib/nigredo-stack.ts)** - Stack de agentes
- **[lib/alquimista-stack.ts](./lib/alquimista-stack.ts)** - Stack da plataforma
- **[lambda/](./lambda/)** - Código das Lambdas
- **[database/](./database/)** - Migrations e seeds

### Frontend (Next.js)
- **[frontend/README.md](./frontend/README.md)** - README do frontend
- **[frontend/COMECE-AQUI.md](./frontend/COMECE-AQUI.md)** - Guia do frontend
- **[frontend/src/](./frontend/src/)** - Código fonte
- **[frontend/IMPLEMENTATION-STATUS.md](./frontend/IMPLEMENTATION-STATUS.md)** - Status

### Arquitetura
- **[docs/ecosystem/ALQUIMISTA-AI-ECOSYSTEM.md](./docs/ecosystem/ALQUIMISTA-AI-ECOSYSTEM.md)** - Visão geral
- **[docs/ecosystem/ARQUITETURA-TECNICA-COMPLETA.md](./docs/ecosystem/ARQUITETURA-TECNICA-COMPLETA.md)** - Arquitetura técnica
- **[docs/ecosystem/API-DOCUMENTATION.md](./docs/ecosystem/API-DOCUMENTATION.md)** - APIs

### Agentes
- **[docs/agents/](./docs/agents/)** - Documentação de todos os agentes
- **[lambda/agents/](./lambda/agents/)** - Código dos agentes

### CI/CD
- **[.github/workflows/](./github/workflows/)** - GitHub Actions
- **[scripts/](./scripts/)** - Scripts de automação

---

## 🆘 Suporte

### Problemas Comuns
1. **Stack em ROLLBACK**: [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)
2. **CORS Error**: Verificar API Gateway CORS
3. **Database Connection**: Verificar Security Groups
4. **Frontend não conecta**: Verificar `.env.production`

### Onde Buscar Ajuda
1. **Troubleshooting**: [docs/deploy/TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md)
2. **Validação**: `.\VALIDATE-INTEGRATION.ps1`
3. **Logs**: `aws logs tail /aws/lambda/[FUNCTION-NAME] --follow`
4. **AWS Console**: https://console.aws.amazon.com/

---

## 📈 Próximos Passos

Após deploy bem-sucedido:

1. **Testar Sistema**
   - Login
   - Dashboard
   - Agentes
   - Analytics

2. **Configurar Domínio**
   - Route 53
   - Certificado SSL
   - CloudFront custom domain

3. **Melhorar Observabilidade**
   - CloudWatch Alarms
   - Dashboards customizados
   - Notificações SNS

4. **Otimizar Custos**
   - Aurora scaling
   - Lambda memory
   - CloudFront caching

---

## ✅ Checklist de Documentação

Você leu:

- [ ] START-HERE.md
- [ ] QUICK-START-DEPLOY.md
- [ ] COMANDOS-RAPIDOS.md
- [ ] DEPLOY-INTEGRATION-GUIDE.md (opcional)
- [ ] DEPLOY-READY-SUMMARY.md (opcional)

Você tem:

- [ ] AWS CLI configurado
- [ ] Node.js 18+ instalado
- [ ] Vercel CLI instalado
- [ ] Dependências instaladas
- [ ] ~50 minutos disponíveis

**Pronto? Execute**: `.\DEPLOY-FULL-SYSTEM.ps1`

---

## 🎉 Conclusão

Toda a documentação necessária para fazer o deploy completo do sistema está disponível e organizada.

**Para começar agora**: Leia **[START-HERE.md](./START-HERE.md)** e execute `.\DEPLOY-FULL-SYSTEM.ps1`

---

**Última atualização**: 15 de Novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ DOCUMENTAÇÃO COMPLETA

