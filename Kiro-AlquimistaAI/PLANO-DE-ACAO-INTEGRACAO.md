# 🎯 Plano de Ação: Integração Nigredo ↔ Fibonacci

## 📌 Situação Atual

✅ **Código Lambda:** 100% implementado e pronto  
⚠️ **Infraestrutura:** Existe em CDK, você quer Terraform  
⚠️ **Deploy:** Não foi feito ainda

---

## 🚀 Opções de Ação

### Opção 1: Deploy Rápido com CDK (Recomendado para MVP)

**Tempo estimado:** 2-4 horas  
**Complexidade:** Baixa  
**Risco:** Baixo

#### Passos:

1. **Configurar Secrets Manager** (15 min)
   ```bash
   # Fibonacci webhook secret
   aws secretsmanager create-secret \
     --name /repo/aws/fibonacci/nigredo-webhook-secret \
     --secret-string "$(openssl rand -hex 32)" \
     --region us-east-1

   # Nigredo integration config
   aws secretsmanager create-secret \
     --name /repo/aws/nigredo/fibonacci-integration \
     --secret-string '{
       "FIBONACCI_API_BASE_URL": "https://api-dev.fibonacci.alquimista.ai",
       "FIBONACCI_NIGREDO_TOKEN": "seu-token-seguro"
     }' \
     --region us-east-1
   ```

2. **Deploy Fibonacci** (30 min)
   ```bash
   cd /caminho/do/repo
   npm install
   cdk deploy FibonacciStack-dev --require-approval never
   ```

3. **Deploy Nigredo** (30 min)
   ```bash
   cdk deploy NigredoStack-dev --require-approval never
   cdk deploy NigredoFrontendStack-dev --require-approval never
   ```

4. **Testar Integração** (1 hora)
   ```bash
   # Criar lead
   curl -X POST https://api-nigredo-dev.alquimista.ai/api/leads \
     -H "Content-Type: application/json" \
     -d '{
       "name": "João Silva",
       "email": "joao@example.com",
       "phone": "+5511999999999",
       "company": "Acme Corp",
       "message": "Teste de integração"
     }'

   # Verificar logs
   aws logs tail /aws/lambda/dev-nigredo-create-lead --follow
   aws logs tail /aws/lambda/dev-fibonacci-handle-nigredo-event --follow

   # Verificar banco
   psql -h <aurora-endpoint> -U <user> -d fibonacci -c \
     "SELECT * FROM nigredo_leads.leads ORDER BY created_at DESC LIMIT 5;"
   ```

5. **Monitorar** (1 hora)
   - Abrir CloudWatch dashboards
   - Verificar métricas
   - Testar cenários de erro

**Vantagens:**
- ✅ Rápido
- ✅ Código já testado
- ✅ Infraestrutura já definida
- ✅ Funciona imediatamente

**Desvantagens:**
- ⚠️ Usa CDK (não Terraform)
- ⚠️ Precisará migrar depois

---

### Opção 2: Migração Completa para Terraform

**Tempo estimado:** 2-3 dias  
**Complexidade:** Alta  
**Risco:** Médio

#### Passos:

**Dia 1: Preparação**

1. **Criar estrutura Terraform** (4 horas)
   ```bash
   mkdir -p terraform/{modules,envs/{dev,prod}}
   mkdir -p terraform/modules/{app_fibonacci_api,app_nigredo_api,app_nigredo_frontend}
   ```

2. **Configurar backend S3** (1 hora)
   ```hcl
   # terraform/backend.tf
   terraform {
     backend "s3" {
       bucket         = "alquimista-terraform-state"
       key            = "alquimista/terraform.tfstate"
       region         = "us-east-1"
       dynamodb_table = "alquimista-terraform-locks"
       encrypt        = true
     }
   }
   ```

3. **Criar módulo Fibonacci** (3 horas)
   - `terraform/modules/app_fibonacci_api/main.tf`
   - Lambda function
   - API Gateway
   - IAM roles
   - Security groups

**Dia 2: Implementação**

4. **Criar módulo Nigredo API** (3 horas)
   - `terraform/modules/app_nigredo_api/main.tf`
   - 3 Lambda functions (create, list, get)
   - API Gateway
   - IAM roles

5. **Criar módulo Nigredo Frontend** (2 horas)
   - `terraform/modules/app_nigredo_frontend/main.tf`
   - S3 bucket
   - CloudFront distribution
   - WAF

6. **Instanciar em dev** (2 horas)
   - `terraform/envs/dev/main.tf`
   - Chamar todos os módulos
   - Configurar variáveis

**Dia 3: Deploy e Testes**

7. **Deploy dev** (2 horas)
   ```bash
   cd terraform/envs/dev
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

8. **Testar integração** (2 horas)
   - Mesmos testes da Opção 1

9. **Documentar** (2 horas)
   - Atualizar READMEs
   - Documentar variáveis
   - Criar runbooks

10. **Replicar para prod** (2 horas)
    - `terraform/envs/prod/main.tf`
    - Deploy em produção

**Vantagens:**
- ✅ Segue padrão Terraform desejado
- ✅ Infraestrutura como código versionada
- ✅ Fácil replicar para outros ambientes
- ✅ Melhor para longo prazo

**Desvantagens:**
- ⚠️ Demora mais
- ⚠️ Requer conhecimento de Terraform
- ⚠️ Risco de erros na migração

---

### Opção 3: Híbrida (Deploy CDK + Migração Gradual)

**Tempo estimado:** 1 semana  
**Complexidade:** Média  
**Risco:** Baixo

#### Passos:

**Semana 1:**

1. **Deploy com CDK** (Dia 1)
   - Seguir Opção 1
   - Sistema funcionando em dev

2. **Criar Terraform em paralelo** (Dias 2-4)
   - Criar módulos Terraform
   - Não fazer deploy ainda
   - Apenas preparar código

3. **Testar Terraform em conta separada** (Dia 5)
   - Deploy em conta de testes
   - Validar que funciona

**Semana 2:**

4. **Migração gradual** (Dias 1-3)
   - Migrar um módulo por vez
   - Fibonacci primeiro
   - Depois Nigredo
   - Por último Frontend

5. **Validação** (Dia 4)
   - Testar tudo
   - Comparar com CDK

6. **Destruir CDK** (Dia 5)
   - `cdk destroy` dos stacks antigos
   - Manter apenas Terraform

**Vantagens:**
- ✅ Sistema funciona desde o início
- ✅ Migração sem pressa
- ✅ Menor risco
- ✅ Aprende Terraform aos poucos

**Desvantagens:**
- ⚠️ Mais demorado
- ⚠️ Gerencia 2 IaCs temporariamente

---

## 🎯 Recomendação

### Para MVP / Teste Rápido:
**→ Opção 1: Deploy com CDK**

Use se:
- Precisa validar a integração rapidamente
- Quer testar com usuários reais
- Pode migrar para Terraform depois

### Para Produção / Longo Prazo:
**→ Opção 2: Terraform Completo**

Use se:
- Tem tempo para fazer direito
- Quer seguir padrão Terraform desde o início
- Não tem pressa para deploy

### Para Equilíbrio:
**→ Opção 3: Híbrida**

Use se:
- Quer sistema funcionando logo
- Mas também quer Terraform
- Tem 1-2 semanas disponíveis

---

## 📋 Checklist de Decisão

Responda estas perguntas para decidir:

1. **Você precisa do sistema funcionando esta semana?**
   - Sim → Opção 1 ou 3
   - Não → Opção 2

2. **Você tem experiência com Terraform?**
   - Sim → Opção 2
   - Não → Opção 1 ou 3

3. **Você pode conviver com CDK temporariamente?**
   - Sim → Opção 1 ou 3
   - Não → Opção 2

4. **Você tem equipe para ajudar?**
   - Sim → Opção 2
   - Não → Opção 1

5. **Qual é a prioridade?**
   - Velocidade → Opção 1
   - Qualidade → Opção 2
   - Ambos → Opção 3

---

## 🚦 Próximo Passo

**Escolha uma opção e me avise!**

Posso ajudar com:
- ✅ Criar módulos Terraform (Opção 2 ou 3)
- ✅ Scripts de deploy CDK (Opção 1)
- ✅ Documentação adicional
- ✅ Testes de integração
- ✅ Troubleshooting

**Qual opção você escolhe?**

---

## 📞 Suporte

**Documentação criada:**
- ✅ `INTEGRACAO-NIGREDO-FIBONACCI-COMPLETA.md` - Visão geral
- ✅ `docs/nigredo/INTEGRATION-STATUS-SUMMARY.md` - Status detalhado
- ✅ `docs/nigredo/TERRAFORM-MIGRATION-GUIDE.md` - Guia Terraform
- ✅ `PLANO-DE-ACAO-INTEGRACAO.md` - Este documento

**Código pronto:**
- ✅ `lambda/fibonacci/handle-nigredo-event.ts`
- ✅ `lambda/nigredo/shared/webhook-sender.ts`
- ✅ `lambda/nigredo/create-lead.ts`

**Tudo pronto para você decidir e agir! 🚀**

---

**Última atualização:** 2024-01-15  
**Status:** Aguardando decisão
