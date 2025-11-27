# Comandos para Próximos Passos · Fluxo Dry-Run

**Data**: 2024-11-27  
**Objetivo**: Guia passo a passo para testar e deployar o fluxo dry-run

---

## 📋 Pré-requisitos

- ✅ Código do fluxo dry-run implementado
- ✅ Terraform configurado
- ✅ AWS CLI configurado
- ✅ Node.js 20 instalado
- ⚠️ Aurora Serverless v2 provisionado (verificar)
- ⚠️ Secrets Manager configurado (verificar)

---

## 🔍 Passo 1: Verificar Estado do Repositório

```powershell
# Navegar para o repositório
cd "C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI"

# Verificar status
git status

# Ver arquivos modificados/criados
git diff --name-status
```

**Arquivos esperados**:
- ✅ `terraform/modules/agente_disparo_agenda/lambda_dry_run.tf` (novo)
- ✅ `terraform/modules/agente_disparo_agenda/outputs.tf` (modificado)
- ✅ `docs/micro-agente-disparo-agendamento/IMPLEMENTATION-STATUS.md` (modificado)
- ✅ `.kiro/specs/micro-agente-disparo-agendamento/SPEC-TECNICA.md` (modificado)
- ✅ `.kiro/specs/micro-agente-disparo-agendamento/INDEX.md` (modificado)
- ✅ `.kiro/specs/micro-agente-disparo-agendamento/RELATORIO-SESSAO-ATUAL.md` (novo)

---

## 🧪 Passo 2: Testar Handler Localmente (Opcional)

```powershell
# Navegar para a spec
cd .kiro\specs\micro-agente-disparo-agendamento

# Teste básico (1 lead)
.\test-dry-run-local.ps1

# Teste com múltiplos leads
.\test-dry-run-local.ps1 -BatchSize 3
```

**Resultado esperado**: Saída JSON com decisões de canal para cada lead mock.

---

## 🏗️ Passo 3: Build da Lambda

```powershell
# Navegar para o código da Lambda
cd lambda-src\agente-disparo-agenda

# Instalar dependências (se ainda não instalou)
npm install

# Compilar TypeScript
npm run build

# Verificar se compilou
dir dist\handlers\dry-run.js
```

**Resultado esperado**: Arquivo `dist/handlers/dry-run.js` criado.

---

## 📦 Passo 4: Criar Pacote ZIP da Lambda

```powershell
# Ainda em lambda-src\agente-disparo-agenda

# Criar diretório de build se não existir
if (!(Test-Path "build")) { New-Item -ItemType Directory -Path "build" }

# Copiar código compilado e node_modules
Copy-Item -Recurse -Force dist build\
Copy-Item -Recurse -Force node_modules build\

# Criar ZIP
Compress-Archive -Path build\* -DestinationPath build\dry-run.zip -Force

# Verificar tamanho do ZIP
(Get-Item build\dry-run.zip).Length / 1MB
```

**Resultado esperado**: Arquivo `build/dry-run.zip` criado (tamanho ~5-10 MB).

---

## ☁️ Passo 5: Upload para S3 (Se Necessário)

```powershell
# Verificar se bucket existe
aws s3 ls s3://alquimista-lambda-artifacts-dev --region us-east-1

# Se não existir, criar
aws s3 mb s3://alquimista-lambda-artifacts-dev --region us-east-1

# Upload do ZIP
aws s3 cp build\dry-run.zip s3://alquimista-lambda-artifacts-dev/micro-agente-disparo-agendamento/dry-run.zip --region us-east-1

# Verificar upload
aws s3 ls s3://alquimista-lambda-artifacts-dev/micro-agente-disparo-agendamento/ --region us-east-1
```

**Resultado esperado**: Arquivo `dry-run.zip` no S3.

---

## 🗄️ Passo 6: Executar Migration do Banco de Dados

```powershell
# Navegar para migrations
cd .kiro\specs\micro-agente-disparo-agendamento\migrations

# Verificar conexão com Aurora (ajustar credenciais)
$env:PGHOST = "alquimista-aurora-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com"
$env:PGUSER = "admin"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "sua-senha-aqui"

# Executar migration 007
psql -f 007_create_dry_run_log_table.sql

# Verificar se tabela foi criada
psql -c "\dt dry_run_log"
```

**Resultado esperado**: Tabela `dry_run_log` criada no Aurora.

**Alternativa (se psql não estiver instalado)**:
- Usar AWS RDS Query Editor no console
- Copiar conteúdo de `007_create_dry_run_log_table.sql` e executar

---

## 🚀 Passo 7: Deploy via Terraform

```powershell
# Navegar para Terraform dev
cd terraform\envs\dev

# Inicializar Terraform (se ainda não fez)
terraform init

# Validar configuração
terraform validate

# Ver plano de mudanças
terraform plan

# Aplicar mudanças (ATENÇÃO: Isso criará recursos na AWS)
terraform apply
```

**Recursos que serão criados**:
- Lambda `micro-agente-disparo-agendamento-dev-dry-run`
- CloudWatch Log Group `/aws/lambda/micro-agente-disparo-agendamento-dev-dry-run`
- Permissões IAM para a Lambda

**Resultado esperado**: 
```
Apply complete! Resources: 3 added, 0 changed, 0 destroyed.
```

---

## ✅ Passo 8: Testar Lambda na AWS

```powershell
# Criar payload de teste
$payload = @{
    tenantId = "test-001"
    batchSize = 1
} | ConvertTo-Json

# Salvar payload em arquivo
$payload | Out-File -FilePath test-payload.json -Encoding utf8

# Invocar Lambda
aws lambda invoke `
  --function-name micro-agente-disparo-agendamento-dev-dry-run `
  --payload file://test-payload.json `
  --region us-east-1 `
  response.json

# Ver resultado
Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Resultado esperado**:
```json
{
  "success": true,
  "leadsProcessados": 1,
  "decisoes": [
    {
      "lead": {
        "id": "mock-lead-001",
        "nome": "Empresa Teste Ltda"
      },
      "canal": "whatsapp",
      "motivo": "Lead possui 1 telefone(s) válido(s) para WhatsApp",
      "seria_executado": true
    }
  ],
  "logs": [...]
}
```

---

## 📊 Passo 9: Verificar Logs no CloudWatch

```powershell
# Ver logs recentes
aws logs tail /aws/lambda/micro-agente-disparo-agendamento-dev-dry-run --follow --region us-east-1
```

**Resultado esperado**: Logs estruturados em JSON com informações do dry-run.

---

## 🔍 Passo 10: Verificar Tabela dry_run_log

```powershell
# Conectar ao Aurora
psql

# Consultar logs
SELECT 
  log_id,
  lead_nome,
  canal_decidido,
  motivo_decisao,
  disparo_seria_executado,
  created_at
FROM dry_run_log
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado**: Registros dos testes dry-run executados.

---

## 🎯 Passo 11: Commit e Push

```powershell
# Voltar para raiz do repositório
cd "C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI"

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: implementar fluxo mínimo dry-run do Micro Agente de Disparos & Agendamentos

- Adicionar Lambda dry-run no Terraform
- Atualizar outputs do Terraform
- Atualizar IMPLEMENTATION-STATUS.md
- Adicionar seção de dry-run na SPEC-TECNICA.md
- Atualizar INDEX.md
- Criar RELATORIO-SESSAO-ATUAL.md
- Criar COMANDOS-PROXIMOS-PASSOS.md

Refs: blueprint-disparo-agendamento.md"

# Push
git push origin main
```

---

## 🐛 Troubleshooting

### Erro: "Lambda artifact not found in S3"

**Solução**: Executar Passo 5 (Upload para S3)

### Erro: "Table dry_run_log does not exist"

**Solução**: Executar Passo 6 (Migration do banco)

### Erro: "Access Denied" ao invocar Lambda

**Solução**: Verificar permissões IAM do usuário AWS CLI

### Erro: "Cannot connect to Aurora"

**Solução**: 
1. Verificar se Aurora está provisionado
2. Verificar security groups
3. Verificar se está na VPC correta

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do CloudWatch
2. Verificar outputs do Terraform
3. Consultar documentação:
   - [DRY-RUN-IMPLEMENTATION.md](./DRY-RUN-IMPLEMENTATION.md)
   - [SPEC-TECNICA.md](./SPEC-TECNICA.md)
4. Contatar equipe:
   - Email: alquimistafibonacci@gmail.com
   - WhatsApp: +55 84 99708-4444

---

**Criado por**: Kiro AI  
**Data**: 2024-11-27  
**Versão**: 1.0.0

