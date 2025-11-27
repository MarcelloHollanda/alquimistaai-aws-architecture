# 🎓 Guia de Onboarding DevOps - AlquimistaAI

**Sistema**: AlquimistaAI / Fibonacci Orquestrador B2B  
**Região AWS**: us-east-1  
**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0

---

## 👋 Bem-vindo ao Time!

Este guia foi criado para você que acabou de entrar no time e precisa entender como **não derrubar a infraestrutura** enquanto aprende o sistema.

### O que você vai aprender

- ✅ Arquitetura base do sistema
- ✅ Como funciona o pipeline CI/CD
- ✅ Guardrails de segurança, custo e observabilidade
- ✅ Scripts de validação e rollback
- ✅ Primeiras tarefas práticas
- ✅ Responsabilidades do dia a dia

### Tempo Estimado

- **Leitura**: 2-3 horas
- **Prática**: 2-4 horas
- **Total**: 1 dia de trabalho

---

## 📚 O que Estudar Primeiro (Ordem Sugerida)

### 1. Arquitetura Base (30 minutos)

#### Leia Primeiro

- **[CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md)** → Seção "Arquitetura de Alto Nível"
- **[database/RESUMO-AURORA-OFICIAL.md](../database/RESUMO-AURORA-OFICIAL.md)** → Visão geral do banco

#### O que Entender

```
Frontend (Next.js) → S3 + CloudFront
       ↓
API Gateway HTTP
       ↓
Lambda Node.js 20
       ↓
Aurora Serverless v2 PostgreSQL (Multi-AZ)
```

**Stacks CDK**:
- **FibonacciStack** - Orquestrador B2B
- **NigredoStack** - Prospecção
- **AlquimistaStack** - Plataforma de agentes
- **SecurityStack** - Guardrails

**Ambientes**:
- **dev** - Deploy automático após merge
- **prod** - Deploy manual com aprovação

#### Checkpoint ✅

- [ ] Entendi a arquitetura geral
- [ ] Sei quais são os 4 stacks CDK
- [ ] Entendi a diferença entre dev e prod



### 2. Pipeline CI/CD (45 minutos)

#### Leia Primeiro

- **[CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md)** → Índice central
- **[CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md)** → Seção "Ciclo de Vida do Código"

#### O que Entender

**Fluxo Completo**:
```
PR → CI (validate) → Merge → Deploy DEV (auto) → Validar → Deploy PROD (manual)
```

**Jobs do Workflow**:
1. **build-and-validate** - Roda em todos os PRs
   - npm install
   - npm run build
   - validate-system-complete.ps1
   - cdk synth

2. **deploy-dev** - Roda após merge em main
   - cdk deploy --all --context env=dev

3. **deploy-prod** - Roda via workflow_dispatch ou tag
   - Requer aprovação manual
   - cdk deploy --all --context env=prod

**Autenticação**: OIDC (sem credenciais de longo prazo)

#### Checkpoint ✅

- [ ] Entendi o fluxo de PR → Deploy
- [ ] Sei quando o deploy automático acontece
- [ ] Sei como acionar deploy manual em prod
- [ ] Entendi o que é OIDC

### 3. Guardrails de Custo (30 minutos)

#### Leia Primeiro

- **[COST-GUARDRAILS-AWS.md](./COST-GUARDRAILS-AWS.md)** → Seções "Visão Geral" e "Guia Operacional"
- **[ci-cd/COST-GUARDRAILS-QUICK-REFERENCE.md](./ci-cd/COST-GUARDRAILS-QUICK-REFERENCE.md)** → Referência rápida

#### O que Entender

**Componentes**:
- **AWS Budgets** - Orçamento mensal com alertas em 80%, 100%, 120%
- **Cost Anomaly Detection** - Detecta gastos anormais (threshold $50)
- **SNS Topic** - `alquimista-cost-alerts-{env}`

**O que fazer quando receber alerta**:
1. Acessar AWS Cost Explorer
2. Identificar serviços com maior gasto
3. Avaliar se é esperado ou anômalo
4. Tomar ação: otimizar ou ajustar budget

#### Checkpoint ✅

- [ ] Sei o que é AWS Budgets
- [ ] Sei o que é Cost Anomaly Detection
- [ ] Sei como responder a alertas de custo

### 4. Guardrails de Observabilidade (30 minutos)

#### Leia Primeiro

- **[OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md)** → Seções "Visão Geral" e "Fluxos de Ação"
- **[ci-cd/OBSERVABILITY-QUICK-REFERENCE.md](./ci-cd/OBSERVABILITY-QUICK-REFERENCE.md)** → Referência rápida

#### O que Entender

**Alarmes Configurados**:
- API Gateway 5XX (>= 5 em 5 min)
- Lambda Errors (>= 3 em 5 min)
- Lambda Throttles (>= 1 em 10 min)
- Aurora CPU (>= 80% por 10 min)
- Aurora Conexões (>= 80 por 10 min)

**SNS Topic**: `alquimista-ops-alerts-{env}`

**O que fazer quando receber alerta**:
1. Acessar CloudWatch Logs
2. Filtrar logs do período do alarme
3. Identificar causa raiz
4. Avaliar necessidade de rollback
5. Corrigir e validar

#### Checkpoint ✅

- [ ] Sei quais alarmes estão configurados
- [ ] Sei como investigar erros via CloudWatch
- [ ] Sei quando considerar rollback

### 5. Scripts de Validação e Rollback (45 minutos)

#### Leia Primeiro

- **[VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md)** → Todos os scripts
- **[ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)** → Procedimentos

#### O que Entender

**Scripts Principais**:
1. **validate-system-complete.ps1** - Validação completa
2. **validate-migrations-aurora.ps1** - Valida migrations
3. **smoke-tests-api-dev.ps1** - Testa APIs
4. **manual-rollback-guided.ps1** - Guia de rollback

**Quando Usar**:
- Antes de deploy → validate-system-complete
- Após deploy → smoke-tests
- Problemas → manual-rollback-guided

#### Checkpoint ✅

- [ ] Sei quais scripts existem
- [ ] Sei quando usar cada script
- [ ] Entendi que rollback é guiado (não automático)

---

## 🛠️ Primeiras Tarefas Práticas

### Tarefa 1: Setup Local (30 minutos)

#### Pré-requisitos

- [ ] Node.js 20.x instalado
- [ ] AWS CLI configurado
- [ ] PowerShell 7+ instalado
- [ ] Git configurado
- [ ] Acesso ao repositório GitHub

#### Passos

```powershell
# 1. Clonar repositório
git clone https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git
cd alquimistaai-aws-architecture

# 2. Instalar dependências
npm install

# 3. Build local
npm run build

# 4. Validar sistema
.\scripts\validate-system-complete.ps1
```

#### Resultado Esperado

- ✅ Build sem erros
- ✅ Validação passa (ou mostra o que falta configurar)

### Tarefa 2: Executar Scripts de Validação (30 minutos)

#### Objetivo

Familiarizar-se com os scripts sem executar nada destrutivo.

#### Passos

```powershell
# 1. Validação completa (modo dry-run)
.\scripts\validate-system-complete.ps1

# 2. Ver ajuda do script de migrations
Get-Help .\scripts\validate-migrations-aurora.ps1 -Full

# 3. Ver ajuda do script de smoke tests
Get-Help .\scripts\smoke-tests-api-dev.ps1 -Full

# 4. Ver guia de rollback (não executa nada)
.\scripts\manual-rollback-guided.ps1
```

#### Resultado Esperado

- ✅ Entendeu como cada script funciona
- ✅ Viu exemplos de uso
- ✅ Não executou nada destrutivo

### Tarefa 3: Ler Checklist de Rollback (15 minutos)

#### Objetivo

Entender procedimentos de rollback **sem executar nada**.

#### Passos

1. Abrir [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)
2. Ler seção "Matriz de Decisão de Rollback"
3. Ler seção "Cenário 1: Deploy CDK Falhou"
4. Ler seção "Cenário 2: API com Erros"

#### Resultado Esperado

- ✅ Entendeu quando fazer rollback
- ✅ Entendeu como fazer rollback
- ✅ Sabe que CloudFormation reverte automaticamente

### Tarefa 4: Explorar Console AWS (30 minutos)

#### Objetivo

Familiarizar-se com recursos AWS do projeto.

#### Passos

1. **CloudFormation**
   - Acessar: https://console.aws.amazon.com/cloudformation/
   - Ver stacks: FibonacciStack-dev, NigredoStack-dev, etc.
   - Ver recursos de cada stack

2. **CloudWatch**
   - Acessar: https://console.aws.amazon.com/cloudwatch/
   - Ver alarmes configurados
   - Ver logs de Lambda

3. **Cost Explorer**
   - Acessar: https://console.aws.amazon.com/cost-management/
   - Ver gastos do mês atual
   - Ver breakdown por serviço

4. **GuardDuty**
   - Acessar: https://console.aws.amazon.com/guardduty/
   - Ver findings (se houver)

#### Resultado Esperado

- ✅ Sabe onde encontrar cada recurso
- ✅ Viu stacks deployadas
- ✅ Viu alarmes configurados

### Tarefa 5: Acompanhar um Deploy (1-2 horas)

#### Objetivo

Ver o fluxo completo na prática.

#### Passos

1. **Criar branch de teste**
   ```powershell
   git checkout -b test/onboarding-$(Get-Date -Format 'yyyyMMdd')
   ```

2. **Fazer mudança trivial**
   ```powershell
   # Editar README.md (adicionar linha)
   git add README.md
   git commit -m "docs: teste de onboarding"
   git push origin test/onboarding-$(Get-Date -Format 'yyyyMMdd')
   ```

3. **Abrir PR**
   - Acessar GitHub
   - Criar PR
   - Observar CI executando

4. **Aguardar aprovação e merge**
   - Pedir para alguém do time revisar
   - Observar deploy automático em dev

5. **Validar deploy**
   ```powershell
   .\scripts\smoke-tests-api-dev.ps1
   ```

#### Resultado Esperado

- ✅ Viu CI executando no PR
- ✅ Viu deploy automático em dev
- ✅ Executou smoke tests com sucesso

---

## 📋 Responsabilidades Básicas

### O que é Esperado de DevOps/Operações

#### Diariamente

- [ ] Monitorar alertas SNS (configurar assinaturas de email)
- [ ] Revisar CloudWatch Dashboards
- [ ] Responder a alertas operacionais em tempo hábil

#### Após Cada Deploy

- [ ] Executar smoke tests
- [ ] Validar que alarmes não dispararam
- [ ] Documentar problemas encontrados

#### Semanalmente

- [ ] Revisar custos no Cost Explorer
- [ ] Revisar findings do GuardDuty
- [ ] Revisar logs do CloudTrail (se necessário)

#### Mensalmente

- [ ] Revisar e ajustar budgets
- [ ] Revisar e ajustar alarmes
- [ ] Atualizar documentação

### O que NÃO Fazer (Pelo Menos no Início)

- ❌ **NÃO** fazer deploy manual em prod sem aprovação
- ❌ **NÃO** modificar guardrails sem entender impacto
- ❌ **NÃO** fazer rollback de migrations sem backup
- ❌ **NÃO** desabilitar alarmes sem documentar
- ❌ **NÃO** ignorar alertas de segurança

---

## 🚨 Cenários de Emergência

### Alerta de Custo Alto

**Sintoma**: Email "AWS Budget Alert - 100% do orçamento atingido"

**O que fazer**:
1. Acessar Cost Explorer
2. Identificar serviço com maior gasto
3. Notificar time
4. Avaliar se é esperado (ex: pico de uso)
5. Se anômalo, investigar e otimizar

**Documentação**: [COST-GUARDRAILS-AWS.md](./COST-GUARDRAILS-AWS.md)

### Alerta de Segurança Crítico

**Sintoma**: Email "GuardDuty Finding - CRITICAL Severity"

**O que fazer**:
1. Acessar GuardDuty no Console
2. Revisar detalhes do finding
3. Notificar time de segurança IMEDIATAMENTE
4. Seguir procedimentos de resposta a incidentes
5. Documentar tudo

**Documentação**: [SECURITY-GUARDRAILS-AWS.md](./SECURITY-GUARDRAILS-AWS.md)

### API Retornando 500

**Sintoma**: Email "CloudWatch Alarm - Fibonacci API 5XX Errors"

**O que fazer**:
1. Acessar CloudWatch Logs
2. Filtrar logs do período do alarme
3. Identificar causa raiz
4. Avaliar necessidade de rollback
5. Se crítico, executar rollback
6. Corrigir problema e redeploy

**Documentação**: [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)

---

## 📚 Recursos Adicionais

### Documentação Completa

- **[INDEX-OPERATIONS-AWS.md](./INDEX-OPERATIONS-AWS.md)** - Índice operacional completo
- **[CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md)** - Guia mestre
- **[.kiro/specs/ci-cd-aws-guardrails/](../.kiro/specs/ci-cd-aws-guardrails/)** - Spec original

### Links Úteis

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS Cost Management](https://docs.aws.amazon.com/cost-management/)

### Contatos

- **Time DevOps**: [Slack/Teams channel]
- **Time Segurança**: [Contato]
- **Suporte AWS**: [Caso tenha suporte enterprise]

---

## ✅ Checklist de Conclusão do Onboarding

### Conhecimento

- [ ] Entendi a arquitetura geral do sistema
- [ ] Entendi o fluxo de CI/CD
- [ ] Entendi os guardrails de segurança
- [ ] Entendi os guardrails de custo
- [ ] Entendi os guardrails de observabilidade
- [ ] Entendi os scripts de validação
- [ ] Entendi os procedimentos de rollback

### Prática

- [ ] Executei build local com sucesso
- [ ] Executei scripts de validação
- [ ] Explorei Console AWS
- [ ] Acompanhei um deploy completo
- [ ] Executei smoke tests

### Acesso

- [ ] Tenho acesso ao repositório GitHub
- [ ] Tenho acesso ao Console AWS
- [ ] Tenho AWS CLI configurado
- [ ] Estou inscrito nos SNS Topics de alertas
- [ ] Tenho acesso aos canais de comunicação do time

### Próximos Passos

- [ ] Revisar documentação conforme necessário
- [ ] Participar de deploys com supervisão
- [ ] Começar a responder alertas (com supervisão)
- [ ] Contribuir com melhorias na documentação

---

## 🎉 Parabéns!

Você completou o onboarding básico! Agora você está pronto para começar a operar o sistema com supervisão.

**Lembre-se**:
- ✅ Sempre validar antes de deploy
- ✅ Sempre testar após deploy
- ✅ Sempre documentar problemas
- ✅ Sempre pedir ajuda quando necessário

**Boa sorte e bem-vindo ao time!** 🚀

---

**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0  
**Mantido por**: Time DevOps AlquimistaAI
