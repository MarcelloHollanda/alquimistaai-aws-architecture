# Nigredo Stack - Índice de Documentação

## 🚨 Correção de Deploy (COMECE AQUI)

1. **[NIGREDO-QUICK-FIX.md](NIGREDO-QUICK-FIX.md)** ⭐
   - Guia rápido para corrigir e fazer redeploy
   - Solução automatizada e manual
   - Troubleshooting comum

2. **[NIGREDO-EXPORT-FIX-SUMMARY.md](NIGREDO-EXPORT-FIX-SUMMARY.md)**
   - Detalhes técnicos das correções aplicadas
   - Explicação do problema de conflito de exports
   - Padrão de nomenclatura estabelecido

3. **[fix-and-deploy-nigredo.ps1](fix-and-deploy-nigredo.ps1)**
   - Script automatizado para correção e deploy
   - Execução: `.\fix-and-deploy-nigredo.ps1`

---

## 📚 Documentação Principal

### Referência Rápida
- **[NIGREDO-COMMANDS.md](NIGREDO-COMMANDS.md)** - Comandos úteis para operação diária
- **[NIGREDO-README.md](frontend/NIGREDO-README.md)** - Visão geral do sistema

### Deployment
- **[docs/nigredo/DEPLOYMENT.md](docs/nigredo/DEPLOYMENT.md)** - Guia completo de deployment
- **[docs/nigredo/PRODUCTION-GUIDE.md](docs/nigredo/PRODUCTION-GUIDE.md)** - Deploy em produção
- **[docs/nigredo/PRODUCTION-CHECKLIST.md](docs/nigredo/PRODUCTION-CHECKLIST.md)** - Checklist pré-deploy

### Operações
- **[docs/nigredo/OPERATIONS.md](docs/nigredo/OPERATIONS.md)** - Guia operacional
- **[docs/nigredo/API.md](docs/nigredo/API.md)** - Documentação da API

### Monitoramento
- **[lib/dashboards/NIGREDO-MONITORING-README.md](lib/dashboards/NIGREDO-MONITORING-README.md)** - Dashboards e métricas
- **[lambda/nigredo/MONITORING-QUICK-REFERENCE.md](lambda/nigredo/MONITORING-QUICK-REFERENCE.md)** - Referência rápida de monitoramento

### Testes
- **[docs/nigredo/INTEGRATION-TESTING.md](docs/nigredo/INTEGRATION-TESTING.md)** - Testes de integração
- **[scripts/test-nigredo-integration.ps1](scripts/test-nigredo-integration.ps1)** - Script de testes

---

## 🏗️ Arquitetura & Design

### Especificações
- **[.kiro/specs/nigredo-prospecting-core/requirements.md](.kiro/specs/nigredo-prospecting-core/requirements.md)** - Requisitos
- **[.kiro/specs/nigredo-prospecting-core/design.md](.kiro/specs/nigredo-prospecting-core/design.md)** - Design
- **[.kiro/specs/nigredo-prospecting-core/tasks.md](.kiro/specs/nigredo-prospecting-core/tasks.md)** - Tarefas

### Código-Fonte
- **[lib/nigredo-stack.ts](lib/nigredo-stack.ts)** - Stack principal CDK
- **[lib/cloudwatch-insights-queries.ts](lib/cloudwatch-insights-queries.ts)** - Queries CloudWatch
- **[lambda/nigredo/](lambda/nigredo/)** - Funções Lambda da API
- **[lambda/agents/](lambda/agents/)** - Agentes de prospecção

---

## 🗄️ Database

### Migrações
- **[database/migrations/007_create_nigredo_schema.sql](database/migrations/007_create_nigredo_schema.sql)** - Schema Nigredo
- **[database/migrations/NIGREDO-SCHEMA-QUICK-REFERENCE.md](database/migrations/NIGREDO-SCHEMA-QUICK-REFERENCE.md)** - Referência rápida

### Seeds
- **[database/seeds/initial_data.sql](database/seeds/initial_data.sql)** - Dados iniciais

---

## 🎨 Frontend

### Componentes
- **[frontend/src/components/nigredo/](frontend/src/components/nigredo/)** - Componentes React
- **[frontend/src/app/(nigredo)/](frontend/src/app/(nigredo)/)** - Páginas Next.js

### Hooks & Utils
- **[frontend/src/hooks/use-nigredo.ts](frontend/src/hooks/use-nigredo.ts)** - Hook React
- **[frontend/src/lib/nigredo-api.ts](frontend/src/lib/nigredo-api.ts)** - Cliente API

---

## 🔧 Scripts de Deployment

### Principais
- **[fix-and-deploy-nigredo.ps1](fix-and-deploy-nigredo.ps1)** ⭐ - Correção e deploy automatizado
- **[scripts/deploy-nigredo-full.ps1](scripts/deploy-nigredo-full.ps1)** - Deploy completo
- **[scripts/deploy-nigredo-backend.ps1](scripts/deploy-nigredo-backend.ps1)** - Deploy backend
- **[scripts/deploy-nigredo-frontend.ps1](scripts/deploy-nigredo-frontend.ps1)** - Deploy frontend

### Validação
- **[scripts/verify-nigredo-deployment.ps1](scripts/verify-nigredo-deployment.ps1)** - Verificar deployment
- **[scripts/validate-nigredo-production.ps1](scripts/validate-nigredo-production.ps1)** - Validar produção

---

## 📊 Dashboards & Monitoramento

### Dashboards CDK
- **[lib/dashboards/nigredo-dashboard.ts](lib/dashboards/nigredo-dashboard.ts)** - Dashboard principal
- **[lib/dashboards/nigredo-agents-dashboard.ts](lib/dashboards/nigredo-agents-dashboard.ts)** - Dashboard de agentes
- **[lib/dashboards/business-metrics-dashboard.ts](lib/dashboards/business-metrics-dashboard.ts)** - Métricas de negócio

### Alarms & Queries
- **[lib/dashboards/nigredo-alarms.ts](lib/dashboards/nigredo-alarms.ts)** - Alarmes CloudWatch
- **[lib/dashboards/nigredo-insights-queries.ts](lib/dashboards/nigredo-insights-queries.ts)** - Queries Insights

---

## 📖 Documentação de Agentes

### Agentes de Prospecção
- **[docs/agents/recebimento.md](docs/agents/recebimento.md)** - Agente de Recebimento
- **[docs/agents/estrategia.md](docs/agents/estrategia.md)** - Agente de Estratégia
- **[docs/agents/disparo.md](docs/agents/disparo.md)** - Agente de Disparo
- **[docs/agents/atendimento.md](docs/agents/atendimento.md)** - Agente de Atendimento
- **[docs/agents/sentimento.md](docs/agents/sentimento.md)** - Agente de Sentimento
- **[docs/agents/agendamento.md](docs/agents/agendamento.md)** - Agente de Agendamento
- **[docs/agents/relatorios.md](docs/agents/relatorios.md)** - Agente de Relatórios

---

## 🔗 Integração com Fibonacci

### Documentação
- **[docs/nigredo/INTEGRATION-STATUS-SUMMARY.md](docs/nigredo/INTEGRATION-STATUS-SUMMARY.md)** - Status da integração
- **[lambda/fibonacci/handle-nigredo-event.ts](lambda/fibonacci/handle-nigredo-event.ts)** - Handler de eventos

### Guias
- **[INTEGRACAO-NIGREDO-FIBONACCI-COMPLETA.md](INTEGRACAO-NIGREDO-FIBONACCI-COMPLETA.md)** - Guia completo
- **[LEIA-ME-INTEGRACAO.md](LEIA-ME-INTEGRACAO.md)** - Resumo executivo

---

## 🎯 Fluxo de Trabalho Recomendado

### Para Desenvolvedores

1. **Primeiro Deploy:**
   ```
   NIGREDO-QUICK-FIX.md → fix-and-deploy-nigredo.ps1
   ```

2. **Desenvolvimento:**
   ```
   lib/nigredo-stack.ts → npx cdk diff → npx cdk deploy
   ```

3. **Testes:**
   ```
   scripts/test-nigredo-integration.ps1
   ```

4. **Monitoramento:**
   ```
   NIGREDO-COMMANDS.md → CloudWatch Dashboards
   ```

### Para Operações

1. **Deploy Produção:**
   ```
   PRODUCTION-CHECKLIST.md → deploy-nigredo-production.ps1
   ```

2. **Monitoramento:**
   ```
   NIGREDO-MONITORING-README.md → CloudWatch
   ```

3. **Troubleshooting:**
   ```
   NIGREDO-COMMANDS.md → Logs → OPERATIONS.md
   ```

---

## 🆘 Suporte

### Problemas Comuns
- **Conflito de Exports:** Ver [NIGREDO-EXPORT-FIX-SUMMARY.md](NIGREDO-EXPORT-FIX-SUMMARY.md)
- **Erros de Deploy:** Ver [NIGREDO-QUICK-FIX.md](NIGREDO-QUICK-FIX.md)
- **Problemas de API:** Ver [docs/nigredo/API.md](docs/nigredo/API.md)

### Comandos Úteis
- **Referência Completa:** [NIGREDO-COMMANDS.md](NIGREDO-COMMANDS.md)
- **Scripts:** [scripts/](scripts/)

---

## 📝 Notas de Versão

### Última Atualização: 2024

**Correções Aplicadas:**
- ✅ Conflito de exports CloudFormation resolvido
- ✅ Prefixo "Nigredo-" adicionado aos exports
- ✅ Erro de sintaxe corrigido em nigredo-stack.ts
- ✅ Scripts de deploy automatizados criados
- ✅ Documentação completa atualizada

---

**Autor:** Kiro AI Assistant  
**Projeto:** Alquimista AI - Nigredo Prospecting Core
