# ✅ Checklist de Validação do Workflow CI/CD

## 📋 Pré-Teste

Antes de executar o teste, confirme:

- [ ] OIDC Provider configurado na AWS
- [ ] IAM Role `GitHubActionsRole` criada
- [ ] Trust Policy configurada para GitHub
- [ ] GitHub Secrets configurados:
  - [ ] `AWS_ACCOUNT_ID`
  - [ ] `AWS_REGION`
  - [ ] `AWS_ROLE_TO_ASSUME`
- [ ] Workflows commitados no repositório
- [ ] Git configurado localmente
- [ ] AWS CLI instalado (opcional)
- [ ] GitHub CLI instalado (opcional)

---

## 🧪 Durante o Teste

### Execução do Script

- [ ] Script iniciou sem erros
- [ ] Pré-requisitos verificados
- [ ] Arquivo de teste criado
- [ ] Commit realizado
- [ ] Push executado
- [ ] Workflow disparado no GitHub

### Monitoramento no GitHub Actions

- [ ] Workflow apareceu na lista
- [ ] Job "setup" executou
- [ ] Job "security-scan" executou
- [ ] Job "deploy" executou
- [ ] Job "validate" executou
- [ ] Todos os jobs passaram (verde)

---

## 🔐 Validação de Autenticação

### OIDC

- [ ] Log mostra "Configuring AWS credentials"
- [ ] Log mostra "Assuming role with OIDC"
- [ ] Log mostra "Successfully assumed role"
- [ ] ARN da role está correto
- [ ] Sem erros de autenticação

### Credenciais

- [ ] Credenciais obtidas via OIDC (não access keys)
- [ ] Região AWS correta (us-east-1)
- [ ] Account ID correto

---

## 🛡️ Validação de Guardrails

### Security Scan

- [ ] Security scan executou
- [ ] Sem credenciais hardcoded detectadas
- [ ] Sem vulnerabilidades críticas
- [ ] Relatório de segurança gerado

### Cost Estimation

- [ ] Cost estimation executou
- [ ] Custo estimado dentro do esperado
- [ ] Alertas de custo (se aplicável)

---

## 🚀 Validação de Deploy

### CDK Synth

- [ ] CDK synth executou sem erros
- [ ] Templates CloudFormation gerados
- [ ] Todos os stacks sintetizados
- [ ] Arquivo cdk.out criado

### CDK Deploy

- [ ] CDK deploy iniciou
- [ ] Stacks sendo atualizadas:
  - [ ] AlquimistaStack
  - [ ] FibonacciStack
  - [ ] NigredoStack
  - [ ] Outros stacks
- [ ] CloudFormation changesets aplicados
- [ ] Deploy completou sem erros

---

## ☁️ Validação na AWS

### CloudFormation

- [ ] Stacks em estado `UPDATE_COMPLETE`
- [ ] Sem stacks em estado de erro
- [ ] Eventos de stack sem erros
- [ ] Recursos criados/atualizados

### Lambda

- [ ] Lambdas deployadas
- [ ] Código atualizado
- [ ] Configuração correta
- [ ] Logs funcionando

### API Gateway

- [ ] APIs atualizadas
- [ ] Endpoints funcionando
- [ ] Logs habilitados
- [ ] Métricas disponíveis

---

## 📊 Validação de Monitoramento

### CloudWatch

- [ ] Logs sendo gerados
- [ ] Métricas disponíveis
- [ ] Alarmes configurados
- [ ] Dashboards atualizados

### X-Ray

- [ ] Tracing habilitado
- [ ] Traces sendo gerados
- [ ] Service map disponível

---

## ✅ Critérios de Sucesso

### Mínimo Necessário

- [ ] Workflow executou sem erros
- [ ] OIDC authentication bem-sucedida
- [ ] CDK synth completou
- [ ] CDK deploy completou
- [ ] Stacks em estado válido

### Ideal

- [ ] Todos os jobs passaram
- [ ] Guardrails executaram
- [ ] Recursos na AWS atualizados
- [ ] Logs e métricas funcionando
- [ ] Sem alertas críticos

---

## 🎯 Pós-Teste

### Documentação

- [ ] ARN da role documentado
- [ ] OIDC Provider ID documentado
- [ ] GitHub Secrets documentados
- [ ] Tempo de deploy documentado

### Configuração

- [ ] Notificações configuradas
- [ ] Alertas de custo configurados
- [ ] Alertas de segurança configurados
- [ ] Contatos de ops atualizados

### Próximos Passos

- [ ] Teste completo executado
- [ ] Teste de segurança executado
- [ ] Ambiente de staging configurado
- [ ] Aprovações manuais para prod configuradas

---

## 📝 Notas

### Problemas Encontrados

```
[Anote aqui qualquer problema encontrado durante o teste]
```

### Tempo de Execução

```
Início: ___:___
Fim: ___:___
Duração total: ___ minutos
```

### Recursos Atualizados

```
[Liste os recursos que foram atualizados]
```

---

## 🆘 Troubleshooting

Se algum item não foi marcado:

1. **Autenticação falhou?**
   - Verificar trust policy
   - Verificar OIDC provider
   - Verificar GitHub Secrets

2. **Deploy falhou?**
   - Ver logs do CloudFormation
   - Verificar permissões da role
   - Verificar recursos existentes

3. **Guardrails falharam?**
   - Ver logs do security scan
   - Verificar configuração de alertas
   - Verificar SNS topics

---

**Data do Teste**: ___/___/______  
**Executado por**: ________________  
**Resultado**: ⬜ Sucesso | ⬜ Falha Parcial | ⬜ Falha Total

---

**Próximo teste agendado para**: ___/___/______
