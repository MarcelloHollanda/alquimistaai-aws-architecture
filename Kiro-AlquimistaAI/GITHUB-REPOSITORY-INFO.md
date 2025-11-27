# 📦 Informações do Repositório GitHub

**Repositório**: MarcelloHollanda/alquimistaai-aws-architecture  
**Plataforma**: GitHub  
**Gerenciamento**: Terraform  
**Status**: ✅ Ativo e Versionado

---

## 🔗 Links do Repositório

### GitHub
- **URL**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture
- **Owner**: MarcelloHollanda
- **Repo**: alquimistaai-aws-architecture

### Branches Principais
- `main` - Produção
- `develop` - Desenvolvimento
- `staging` - Staging (se aplicável)

---

## 📂 Estrutura do Repositório

```
alquimistaai-aws-architecture/
├── terraform/
│   ├── envs/
│   │   ├── dev/          # Configurações DEV
│   │   └── prod/         # Configurações PROD
│   ├── modules/          # Módulos Terraform reutilizáveis
│   └── ...
├── lambda/               # Código das funções Lambda
│   ├── handlers/
│   ├── agents/
│   └── platform/
├── frontend/             # Frontend Next.js (este projeto)
├── database/             # Migrations e seeds
├── docs/                 # Documentação
└── README.md
```

---

## 🏗️ Infraestrutura Gerenciada

### Terraform State
- **Backend**: S3 + DynamoDB (lock)
- **Região**: us-east-1
- **Versionamento**: ✅ Habilitado

### Recursos Gerenciados
- ✅ VPC (vpc-081703d5feea3c2ab)
- ✅ API Gateway (DEV + PROD)
- ✅ Lambda Functions
- ✅ Aurora Serverless v2
- ✅ Secrets Manager
- ✅ S3 Buckets
- ✅ IAM Roles e Policies

---

## 🌐 Ambientes Deployados

### Desenvolvimento (DEV)
- **API**: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com
- **Database**: fibonacci-dev-aurora.cluster-csriwuis6v0w.us-east-1.rds.amazonaws.com
- **Secret**: /repo/github/alquimistaai-aws-architecture/fibonacci-dev/db/postgres

### Produção (PROD)
- **API**: https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
- **Database**: fibonacci-prod-aurora.cluster-csriwuis6v0w.us-east-1.rds.amazonaws.com
- **Secret**: /repo/github/alquimistaai-aws-architecture/fibonacci-prod/db/postgres
- **Frontend**: http://alquimistaai-fibonacci-frontend-prod.s3-website-us-east-1.amazonaws.com

---

## 🔐 Secrets Manager

### Naming Convention
```
/repo/github/alquimistaai-aws-architecture/{environment}/db/postgres
```

### Secrets Armazenados
- **DEV**: arn:aws:secretsmanager:us-east-1:207933152643:secret:/repo/github/alquimistaai-aws-architecture/fibonacci-dev/db/postgres-...
- **PROD**: arn:aws:secretsmanager:us-east-1:207933152643:secret:/repo/github/alquimistaai-aws-architecture/fibonacci-prod/db/postgres-N8NXPx

---

## 🚀 Workflow de Deploy

### 1. Desenvolvimento Local
```bash
# Fazer alterações no código
git checkout develop
# ... fazer mudanças ...
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop
```

### 2. Deploy para DEV
```bash
cd terraform/envs/dev
terraform plan
terraform apply
```

### 3. Deploy para PROD
```bash
# Merge para main
git checkout main
git merge develop
git push origin main

# Deploy via Terraform
cd terraform/envs/prod
terraform plan
terraform apply
```

---

## 📊 Outputs do Terraform

### Comandos Úteis

```bash
# Ver outputs do ambiente DEV
cd terraform/envs/dev
terraform output

# Ver outputs do ambiente PROD
cd terraform/envs/prod
terraform output

# Outputs específicos
terraform output aurora_cluster_endpoint
terraform output aurora_secret_arn
terraform output api_gateway_url
terraform output vpc_id
```

### Outputs Disponíveis
- `aurora_cluster_endpoint` - Endpoint do Aurora
- `aurora_secret_arn` - ARN do secret no Secrets Manager
- `api_gateway_url` - URL do API Gateway
- `api_gateway_id` - ID do API Gateway
- `vpc_id` - ID da VPC
- `lambda_function_arns` - ARNs das funções Lambda

---

## 🔄 CI/CD

### GitHub Actions (Recomendado)

Criar workflows em `.github/workflows/`:

#### Deploy DEV
```yaml
# .github/workflows/deploy-dev.yml
name: Deploy to DEV
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Terraform Apply
        run: |
          cd terraform/envs/dev
          terraform init
          terraform apply -auto-approve
```

#### Deploy PROD
```yaml
# .github/workflows/deploy-prod.yml
name: Deploy to PROD
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Terraform Apply
        run: |
          cd terraform/envs/prod
          terraform init
          terraform apply -auto-approve
```

---

## 📝 Convenções de Commit

### Conventional Commits
```bash
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração
test: adição de testes
chore: tarefas de manutenção
```

### Exemplos
```bash
git commit -m "feat(api): adicionar endpoint de autenticação"
git commit -m "fix(lambda): corrigir conexão com Aurora"
git commit -m "docs: atualizar README com novas URLs"
```

---

## 🔍 Monitoramento

### CloudWatch
- **Logs**: `/aws/lambda/fibonacci-{env}-*`
- **Metrics**: Custom metrics por ambiente
- **Alarms**: Configurados via Terraform

### Terraform State
- **Bucket**: `alquimistaai-terraform-state`
- **Key**: `{environment}/terraform.tfstate`
- **Lock Table**: `alquimistaai-terraform-locks`

---

## 🛠️ Comandos Úteis

### Terraform

```bash
# Inicializar
terraform init

# Planejar mudanças
terraform plan

# Aplicar mudanças
terraform apply

# Destruir recursos (cuidado!)
terraform destroy

# Ver outputs
terraform output

# Formatar código
terraform fmt -recursive

# Validar configuração
terraform validate
```

### Git

```bash
# Clonar repositório
git clone https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git

# Atualizar
git pull origin main

# Ver status
git status

# Ver logs
git log --oneline

# Ver diferenças
git diff
```

### AWS CLI

```bash
# Testar API DEV
curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/

# Testar API PROD
curl https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/

# Ver logs Lambda
aws logs tail /aws/lambda/fibonacci-dev-handler --follow

# Listar secrets
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'alquimistaai')]"
```

---

## 📚 Documentação Relacionada

### Neste Repositório
- [AWS Deployment Info](./AWS-DEPLOYMENT-INFO.md)
- [Frontend-Backend Integration](./FRONTEND-BACKEND-INTEGRATION.md)
- [Integration Status](./INTEGRATION-STATUS.md)
- [System Verification Report](./SYSTEM-VERIFICATION-REPORT.md)

### Externa
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [Aurora Serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)

---

## 🤝 Contribuindo

### Fluxo de Trabalho

1. **Fork** o repositório (se necessário)
2. **Clone** localmente
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Faça** suas alterações
5. **Commit**: `git commit -m "feat: descrição"`
6. **Push**: `git push origin feature/nova-funcionalidade`
7. **Abra** um Pull Request

### Code Review
- Todos os PRs devem ser revisados
- Testes devem passar
- Terraform plan deve ser aprovado
- Documentação deve ser atualizada

---

## 📞 Contatos

### Repositório
- **GitHub**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture
- **Issues**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/issues
- **Pull Requests**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/pulls

### Equipe
- **Owner**: Marcello Hollanda
- **Maintainers**: [Lista de maintainers]

---

**Última atualização**: 14 de Novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ ATIVO E VERSIONADO
