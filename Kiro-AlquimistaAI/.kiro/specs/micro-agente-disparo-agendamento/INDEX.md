# Índice · Micro Agente de Disparos & Agendamentos

## 🎯 Comece Aqui

Se você é novo no projeto, comece por:

1. **[README.md](./README.md)** - Visão geral e quick start
2. **[SPEC-TECNICA.md](./SPEC-TECNICA.md)** - Spec técnica completa

---

## 📚 Documentação Oficial

### Especificação

| Documento | Descrição | Status |
|-----------|-----------|--------|
| [SPEC-TECNICA.md](./SPEC-TECNICA.md) | Spec técnica completa consolidada | ✅ Pronto |
| [requirements.md](./requirements.md) | Requisitos funcionais e não-funcionais | ✅ Pronto |
| [design.md](./design.md) | Design técnico e arquitetura | ✅ Pronto |
| [tasks.md](./tasks.md) | Tarefas de implementação | ✅ Pronto |

### Fluxos e Implementação

| Documento | Descrição | Status |
|-----------|-----------|--------|
| [FLUXO-INGESTAO-LEADS.md](./FLUXO-INGESTAO-LEADS.md) | Fluxo oficial de ingestão de leads | ✅ Pronto |
| [IMPLEMENTACAO-INGESTAO.md](./IMPLEMENTACAO-INGESTAO.md) | Implementação técnica da ingestão | ✅ Pronto |
| [DRY-RUN-IMPLEMENTATION.md](./DRY-RUN-IMPLEMENTATION.md) | Implementação do fluxo dry-run | ✅ Pronto |
| [RELATORIO-SESSAO-ATUAL.md](./RELATORIO-SESSAO-ATUAL.md) | Relatório da última sessão | ✅ Atualizado |

### Infraestrutura

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| [schema-ingestao.sql](./schema-ingestao.sql) | Schema completo do banco de dados | ✅ Pronto |
| [migrations/007_create_dry_run_log_table.sql](./migrations/007_create_dry_run_log_table.sql) | Migration da tabela dry_run_log | ✅ Pronto |
| [build-ingestao-lambda.ps1](./build-ingestao-lambda.ps1) | Script de build e deploy | ✅ Pronto |
| [build-lambdas.ps1](./build-lambdas.ps1) | Script de build geral | ✅ Pronto |
| [validate-terraform-vars.ps1](./validate-terraform-vars.ps1) | Validação de variáveis Terraform | ✅ Pronto |
| [create-secrets.ps1](./create-secrets.ps1) | Criação de secrets no AWS | ✅ Pronto |
| [test-dry-run-local.ps1](./test-dry-run-local.ps1) | Teste local do fluxo dry-run | ✅ Pronto |

---

## 💻 Código-Fonte

### Lambda de Ingestão

Localização: `lambda-src/agente-disparo-agenda/ingestao/`

| Arquivo | Descrição |
|---------|-----------|
| [handler.ts](../../../lambda-src/agente-disparo-agenda/ingestao/handler.ts) | Handler principal |
| [parser.ts](../../../lambda-src/agente-disparo-agenda/ingestao/parser.ts) | Parser de XLSX |
| [validator.ts](../../../lambda-src/agente-disparo-agenda/ingestao/validator.ts) | Validações |
| [transformer.ts](../../../lambda-src/agente-disparo-agenda/ingestao/transformer.ts) | Transformações |
| [loader.ts](../../../lambda-src/agente-disparo-agenda/ingestao/loader.ts) | Inserção no banco |
| [types.ts](../../../lambda-src/agente-disparo-agenda/ingestao/types.ts) | Tipos TypeScript |

### Lambda Dry-Run

Localização: `lambda-src/agente-disparo-agenda/src/`

| Arquivo | Descrição |
|---------|-----------|
| [handlers/dry-run.ts](../../../lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts) | Handler do fluxo dry-run |
| [utils/canal-decision.ts](../../../lambda-src/agente-disparo-agenda/src/utils/canal-decision.ts) | Lógica de decisão de canal |

### Configuração

| Arquivo | Descrição |
|---------|-----------|
| [package.json](../../../lambda-src/agente-disparo-agenda/package.json) | Dependências |
| [tsconfig.json](../../../lambda-src/agente-disparo-agenda/tsconfig.json) | Config TypeScript |

---

## 🗂️ Estrutura do Projeto

```
.kiro/specs/micro-agente-disparo-agendamento/
├── INDEX.md                          # Este arquivo
├── README.md                         # Visão geral
├── SPEC-TECNICA.md                   # ⭐ Spec técnica completa
├── requirements.md                   # Requisitos
├── design.md                         # Design
├── tasks.md                          # Tarefas
├── FLUXO-INGESTAO-LEADS.md          # Fluxo de ingestão
├── IMPLEMENTACAO-INGESTAO.md        # Implementação
├── schema-ingestao.sql              # Schema SQL
├── build-ingestao-lambda.ps1        # Build script
├── build-lambdas.ps1                # Build geral
├── validate-terraform-vars.ps1      # Validação
└── create-secrets.ps1               # Secrets

lambda-src/agente-disparo-agenda/
├── ingestao/
│   ├── handler.ts                   # Handler principal
│   ├── parser.ts                    # Parser XLSX
│   ├── validator.ts                 # Validações
│   ├── transformer.ts               # Transformações
│   ├── loader.ts                    # Loader DB
│   └── types.ts                     # Tipos
├── package.json                     # Dependências
└── tsconfig.json                    # Config TS
```

---

## 🚀 Guias Rápidos

### Para Desenvolvedores

1. Ler [SPEC-TECNICA.md](./SPEC-TECNICA.md) - Entender arquitetura
2. Ler [FLUXO-INGESTAO-LEADS.md](./FLUXO-INGESTAO-LEADS.md) - Entender fluxo de dados
3. Executar [schema-ingestao.sql](./schema-ingestao.sql) - Criar banco local
4. Rodar `npm install` em `lambda-src/agente-disparo-agenda/`
5. Rodar `npm run build` para compilar

### Para DevOps

1. Ler [IMPLEMENTACAO-INGESTAO.md](./IMPLEMENTACAO-INGESTAO.md) - Entender deploy
2. Executar [create-secrets.ps1](./create-secrets.ps1) - Criar secrets
3. Executar [validate-terraform-vars.ps1](./validate-terraform-vars.ps1) - Validar vars
4. Executar [build-ingestao-lambda.ps1](./build-ingestao-lambda.ps1) - Build e deploy

### Para Product Owners

1. Ler [README.md](./README.md) - Visão geral do sistema
2. Ler [requirements.md](./requirements.md) - Requisitos de negócio
3. Ler [tasks.md](./tasks.md) - Roadmap de implementação

---

## 🔗 Referências Externas

### Blueprints

- [Blueprint Disparo & Agendamento](../../../.kiro/steering/blueprint-disparo-agendamento.md)
- [Blueprint Comercial & Assinaturas](../../../.kiro/steering/blueprint-comercial-assinaturas.md)

### Contexto do Projeto

- [Contexto Projeto Alquimista](../../../.kiro/steering/contexto-projeto-alquimista.md)
- [Fluxo ChatGPT ⇄ Kiro](../../../.kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md)

### Agentes Executores

- [Agente Executor DevOps](../../../.kiro/steering/AGENTE-EXECUTOR-DEVOPS-ALQUIMISTAAI.md)
- [Agente Executor Frontend](../../../.kiro/steering/AGENTE-EXECUTOR-FRONTEND-ALQUIMISTAAI.md)

---

## 📊 Status do Projeto

### Fase 1: MVP - Ingestão ✅

- [x] Schema do banco de dados
- [x] Lambda de ingestão
- [x] Parser de XLSX
- [x] Validações e transformações
- [x] Scripts de build e deploy
- [x] Documentação completa
- [ ] Testes unitários
- [ ] Deploy em dev

### Fase 1.5: Dry-Run ✅

- [x] Handler dry-run implementado
- [x] Lógica de decisão de canal
- [x] Feature flag `MICRO_AGENT_DISPARO_ENABLED`
- [x] Tabela `dry_run_log` (migration 007)
- [x] Terraform configurado
- [x] Script de teste local
- [x] Documentação completa
- [ ] Migration executada no Aurora
- [ ] Testes end-to-end
- [ ] Deploy em dev

### Fase 2: Disparo 🚧

- [ ] Lambda de disparo
- [ ] Integração com MCP WhatsApp
- [ ] Integração com MCP Email
- [ ] Rate limiting
- [ ] Scheduler EventBridge

### Fase 3: Agendamento 📋

- [ ] Lambda de agendamento
- [ ] Integração com Google Calendar
- [ ] Geração de briefings
- [ ] Sistema de lembretes

---

## 🤝 Contribuindo

Para contribuir com este projeto:

1. Leia a documentação relevante
2. Siga os padrões definidos nos blueprints
3. Mantenha a documentação atualizada
4. Teste localmente antes de fazer deploy
5. Use os scripts fornecidos

---

## 📞 Suporte

- **Email**: alquimistafibonacci@gmail.com
- **WhatsApp**: +55 84 99708-4444

---

**Última atualização**: 2024-11-27  
**Versão**: 1.1.0 (Dry-Run implementado)  
**Mantido por**: Equipe AlquimistaAI
