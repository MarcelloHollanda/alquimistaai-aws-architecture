# 🚀 Próximos Comandos - Deploy do Micro Agente

**Data**: 24 de Novembro de 2024  
**Status**: ✅ Pronto para executar comandos

---

## 📋 Ordem de Execução

Execute os comandos na ordem abaixo, a partir da **raiz do repositório**.

---

### 1️⃣ Validar Variáveis e Recursos AWS

```powershell
# Executar da raiz do repositório
.\.kiro\specs\micro-agente-disparo-agendamento\validate-terraform-vars.ps1 -Environment dev
```

**O que este comando faz**:
- ✓ Verifica se você está no diretório correto
- ✓ Valida SNS Topic de alertas
- ✓ Valida Bucket S3 de artefatos
- ✓ Valida VPC e Subnets
- ✓ Valida Aurora Cluster
- ✓ Valida EventBridge Bus
- ✓ Valida 3 Secrets no Secrets Manager
- ✓ Verifica variáveis no terraform.tfvars
- ✓ Verifica 7 handlers Lambda
- ✓ Verifica 9 arquivos do módulo Terraform

**Resultado esperado**:
```
✓ Todas as validações passaram!
Você pode prosseguir com 'terraform apply'!
```

**Se falhar**:
- Leia as mensagens de erro
- Corrija os problemas indicados
- Execute novamente

---

### 2️⃣ (Opcional) Criar terraform.tfvars

Se você quiser customizar as configurações padrão:

```powershell
# Copiar o template
cp terraform/envs/dev/terraform.tfvars.example terraform/envs/dev/terraform.tfvars

# Editar o arquivo (use seu editor preferido)
code terraform/envs/dev/terraform.tfvars
# ou
notepad terraform/envs/dev/terraform.tfvars
```

**Variáveis que você pode ajustar**:
- Rate limits (WhatsApp, Email, SMS)
- Timeouts das Lambdas
- Memória das Lambdas
- Horários comerciais
- Configurações de agendamento

**Se não criar**: Terraform usará os valores padrão (já otimizados para DEV)

---

### 3️⃣ Inicializar Terraform

```powershell
# Navegar para o ambiente DEV
cd terraform/envs/dev

# Inicializar Terraform (baixa providers, configura backend)
terraform init
```

**O que este comando faz**:
- Baixa o provider AWS
- Configura backend S3 para state
- Configura DynamoDB para lock
- Inicializa módulos

**Resultado esperado**:
```
Terraform has been successfully initialized!
```

---

### 4️⃣ Validar Configuração Terraform

```powershell
# Validar sintaxe e configuração
terraform validate
```

**Resultado esperado**:
```
Success! The configuration is valid.
```

---

### 5️⃣ Planejar Deploy (Dry Run)

```powershell
# Ver o que será criado (sem aplicar)
terraform plan
```

**O que este comando faz**:
- Mostra todos os recursos que serão criados
- Mostra mudanças que serão feitas
- Não aplica nenhuma mudança

**Resultado esperado**:
- Lista de ~30-40 recursos a serem criados
- 6 Lambdas
- 3 Tabelas DynamoDB
- 1 API Gateway
- 2 Filas SQS
- 3 Secrets
- EventBridge Scheduler e Rules
- IAM Roles e Policies
- CloudWatch Logs e Alarms

**Revise cuidadosamente**:
- Verifique se os nomes estão corretos
- Verifique se as configurações estão corretas
- Verifique se não há recursos sendo destruídos (deve ser tudo criação)

---

### 6️⃣ Aplicar Deploy

```powershell
# Aplicar as mudanças (CRIA OS RECURSOS NA AWS)
terraform apply
```

**O que este comando faz**:
- Mostra o plano novamente
- Pede confirmação (digite `yes`)
- Cria todos os recursos na AWS
- Salva o state no S3

**Tempo estimado**: 5-10 minutos

**Resultado esperado**:
```
Apply complete! Resources: 35 added, 0 changed, 0 destroyed.

Outputs:

api_gateway_invoke_url = "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com"
lambda_arns = {
  "api_handler" = "arn:aws:lambda:us-east-1:207933152643:function:api-handler-dev"
  ...
}
...
```

---

### 7️⃣ Verificar Deploy

```powershell
# Ver todos os recursos criados
terraform show

# Ver apenas os outputs
terraform output
```

---

### 8️⃣ Testar API

```powershell
# Obter URL da API
$API_URL = terraform output -raw api_gateway_invoke_url

# Testar health check
curl "$API_URL/api/disparo-agenda/health"
```

**Resultado esperado**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-24T...",
  "version": "1.0.0"
}
```

---

### 9️⃣ Verificar Logs

```powershell
# Voltar para a raiz do repositório
cd ../../..

# Ver logs da Lambda API Handler
aws logs tail /aws/lambda/api-handler-dev --follow --region us-east-1
```

**Para parar**: Pressione `Ctrl+C`

---

### 🔟 Monitorar Recursos

```powershell
# Abrir CloudWatch Console
start https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:

# Abrir Lambda Console
start https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions

# Abrir DynamoDB Console
start https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables
```

---

## 🆘 Se Algo Der Errado

### Erro no Terraform Apply

```powershell
# Ver detalhes do erro
terraform show

# Ver state atual
terraform state list

# Tentar novamente
terraform apply
```

### Rollback Completo

```powershell
# CUIDADO: Isso DESTROI todos os recursos criados
terraform destroy

# Confirme digitando: yes
```

### Rollback Parcial

```powershell
# Remover um recurso específico
terraform state rm <resource_name>

# Exemplo:
terraform state rm aws_lambda_function.api_handler
```

---

## 📊 Checklist de Execução

- [ ] 1. Executar `validate-terraform-vars.ps1`
- [ ] 2. (Opcional) Criar `terraform.tfvars`
- [ ] 3. Executar `terraform init`
- [ ] 4. Executar `terraform validate`
- [ ] 5. Executar `terraform plan` e revisar
- [ ] 6. Executar `terraform apply` e confirmar
- [ ] 7. Executar `terraform show` para verificar
- [ ] 8. Testar API com `curl`
- [ ] 9. Verificar logs no CloudWatch
- [ ] 10. Monitorar recursos no Console AWS

---

## 💡 Dicas

1. **Sempre revise o `terraform plan`** antes de aplicar
2. **Salve os outputs** para referência futura
3. **Monitore os custos** no AWS Cost Explorer
4. **Configure alarmes** no CloudWatch
5. **Faça backup do state** regularmente

---

## 📞 Suporte

- **Documentação**: `PRONTO-PARA-DEPLOY.md`
- **Configurações**: `CONFIGURACOES-OTIMIZADAS.md`
- **Logs**: `LOG-TERRAFORM-VARS-OUTPUTS-2024-11-24.md`

---

**Preparado por**: Kiro AI Assistant  
**Data**: 24 de Novembro de 2024  
**Status**: 🟢 PRONTO PARA EXECUTAR

