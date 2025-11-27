# IAM Roles Documentation - Navigation Guide

## 📚 Documentação Completa de IAM

Este diretório contém toda a documentação relacionada às IAM Roles do Ecossistema Alquimista.AI.

---

## 🗂️ Estrutura de Documentos

### 1. 📖 Documentação Principal

#### [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md)
**Descrição**: Documentação completa e detalhada de todas as IAM Roles

**Conteúdo**:
- Descrição de cada role (13 Lambdas)
- Justificativa para cada permissão
- Políticas em formato JSON
- Recursos acessados
- Recomendações de segurança
- Troubleshooting
- Compliance (LGPD, SOC 2)

**Quando usar**: Para entender em detalhes as permissões de uma Lambda específica

---

#### [IAM-QUICK-REFERENCE.md](./IAM-QUICK-REFERENCE.md)
**Descrição**: Referência rápida com tabelas e matrizes visuais

**Conteúdo**:
- Matriz de permissões visual
- Tabelas comparativas
- Checklist de segurança
- Comandos úteis
- Links de referência

**Quando usar**: Para consulta rápida de permissões ou troubleshooting

---

### 2. 🔧 Implementação e Validação

#### [TASK-30-CHECKLIST.md](./TASK-30-CHECKLIST.md)
**Descrição**: Checklist completo de validação da Task 30

**Conteúdo**:
- Status de cada subtarefa
- Resumo de permissões
- Validação final
- Próximos passos

**Quando usar**: Para verificar se a task foi completada corretamente

---

#### [TASK-30-IMPLEMENTATION-SUMMARY.md](./TASK-30-IMPLEMENTATION-SUMMARY.md)
**Descrição**: Resumo executivo da implementação

**Conteúdo**:
- Objetivos alcançados
- Análise de segurança
- Matriz de permissões completa
- Métricas e resultados
- Lições aprendidas

**Quando usar**: Para apresentar resultados ou revisar implementação

---

### 3. 💡 Melhorias e Recomendações

#### [IAM-IMPROVEMENTS-RECOMMENDATIONS.md](./IAM-IMPROVEMENTS-RECOMMENDATIONS.md)
**Descrição**: Melhorias opcionais para produção

**Conteúdo**:
- Implementações corretas atuais
- Melhorias opcionais
- Priorização de implementações
- Guia de implementação
- Comparação antes/depois

**Quando usar**: Para planejar melhorias futuras ou deploy em produção crítica

---

## 🛠️ Scripts de Auditoria

### PowerShell
```powershell
# Auditar ambiente dev
.\scripts\audit-iam-permissions.ps1 -Environment dev

# Auditar ambiente staging
.\scripts\audit-iam-permissions.ps1 -Environment staging

# Auditar ambiente prod
.\scripts\audit-iam-permissions.ps1 -Environment prod
```

### Bash
```bash
# Auditar ambiente dev
./scripts/audit-iam-permissions.sh dev

# Auditar ambiente staging
./scripts/audit-iam-permissions.sh staging

# Auditar ambiente prod
./scripts/audit-iam-permissions.sh prod
```

---

## 🚀 Guia de Uso Rápido

### Para Desenvolvedores

1. **Entender permissões de uma Lambda**:
   - Consulte [IAM-QUICK-REFERENCE.md](./IAM-QUICK-REFERENCE.md) para visão geral
   - Consulte [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md) para detalhes

2. **Adicionar nova Lambda**:
   - Siga exemplos em [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md)
   - Use grant methods do CDK
   - Documente permissões

3. **Troubleshooting de permissões**:
   - Consulte seção "Troubleshooting" em [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md)
   - Execute script de auditoria
   - Verifique CloudTrail logs

---

### Para Gestores

1. **Revisar segurança do sistema**:
   - Leia [TASK-30-IMPLEMENTATION-SUMMARY.md](./TASK-30-IMPLEMENTATION-SUMMARY.md)
   - Verifique matriz de permissões
   - Revise conformidade (LGPD, SOC 2)

2. **Planejar melhorias**:
   - Consulte [IAM-IMPROVEMENTS-RECOMMENDATIONS.md](./IAM-IMPROVEMENTS-RECOMMENDATIONS.md)
   - Priorize implementações
   - Estime custos

3. **Auditar permissões**:
   - Execute scripts de auditoria
   - Revise relatórios
   - Tome ações corretivas

---

### Para Auditores

1. **Verificar conformidade**:
   - Leia [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md)
   - Execute scripts de auditoria
   - Verifique CloudTrail logs

2. **Validar princípio de menor privilégio**:
   - Consulte [IAM-QUICK-REFERENCE.md](./IAM-QUICK-REFERENCE.md)
   - Verifique matriz de permissões
   - Valide justificativas

3. **Gerar relatório de auditoria**:
   - Execute scripts de auditoria
   - Compile resultados
   - Documente findings

---

## 📊 Matriz de Permissões (Resumo)

| Lambda | EventBridge | Secrets | SQS | VPC | Outros |
|--------|-------------|---------|-----|-----|--------|
| **Fibonacci** |
| API Handler | ✅ | ✅ DB | ✅ | ❌ | X-Ray |
| **Nigredo** |
| Recebimento | ✅ | ✅ DB+Enrich | ✅ | ✅ | X-Ray |
| Estratégia | ✅ | ✅ DB+Enrich | ✅ | ✅ | X-Ray |
| Disparo | ✅ | ✅ DB+WhatsApp | ✅ | ✅ | X-Ray |
| Atendimento | ✅ | ✅ DB+WhatsApp | ✅ | ✅ | X-Ray, Bedrock, Lambda |
| Sentimento | ❌ | ❌ | ❌ | ❌ | X-Ray, Comprehend |
| Agendamento | ✅ | ✅ DB+Cal+WA | ✅ | ✅ | X-Ray |
| Relatórios | ✅ | ✅ DB | ✅ | ✅ | X-Ray |
| **Alquimista** |
| List Agents | ❌ | ✅ DB | ❌ | ❌ | X-Ray |
| Activate/Deactivate | ✅ | ✅ DB | ❌ | ❌ | X-Ray |
| Audit Log | ❌ | ✅ DB | ❌ | ❌ | X-Ray |
| Agent Metrics | ❌ | ✅ DB | ❌ | ❌ | X-Ray, CloudWatch |
| Approval Flow | ✅ | ✅ DB | ❌ | ❌ | X-Ray |

**Legenda**: ✅ = Tem permissão | ❌ = Não tem permissão

---

## 🔍 Comandos Úteis

### Listar roles do projeto
```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `Fibonacci`) || contains(RoleName, `Nigredo`) || contains(RoleName, `Alquimista`)].RoleName'
```

### Ver políticas de uma role
```bash
aws iam list-attached-role-policies --role-name <ROLE_NAME>
aws iam list-role-policies --role-name <ROLE_NAME>
```

### Ver detalhes de uma política
```bash
aws iam get-role-policy --role-name <ROLE_NAME> --policy-name <POLICY_NAME>
```

### Habilitar IAM Access Analyzer
```bash
aws accessanalyzer create-analyzer --analyzer-name fibonacci-analyzer --type ACCOUNT
```

---

## ✅ Checklist de Segurança

- [ ] Todas as roles seguem princípio de menor privilégio
- [ ] Nenhuma role tem permissão `*` em actions
- [ ] Nenhuma role tem permissão `*` em resources (exceto X-Ray e Comprehend)
- [ ] Secrets Manager tem rotação automática configurada
- [ ] CloudTrail está habilitado para auditoria
- [ ] IAM Access Analyzer está ativo
- [ ] Permissões são revisadas trimestralmente
- [ ] Documentação está atualizada

---

## 🔗 Links Úteis

### AWS Documentation
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Least Privilege Principle](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege)
- [Lambda Execution Role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)

### CDK Documentation
- [CDK Security Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html#best-practices-security)
- [CDK IAM Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam-readme.html)

---

## 📞 Suporte

### Dúvidas sobre permissões?
1. Consulte [IAM-QUICK-REFERENCE.md](./IAM-QUICK-REFERENCE.md)
2. Consulte [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md)
3. Execute script de auditoria
4. Verifique CloudTrail logs

### Erro de permissão?
1. Consulte seção "Troubleshooting" em [IAM-ROLES-DOCUMENTATION.md](./IAM-ROLES-DOCUMENTATION.md)
2. Verifique CloudTrail para detalhes do erro
3. Valide ARNs dos recursos
4. Verifique condições IAM

### Planejar melhorias?
1. Consulte [IAM-IMPROVEMENTS-RECOMMENDATIONS.md](./IAM-IMPROVEMENTS-RECOMMENDATIONS.md)
2. Priorize implementações
3. Estime custos e impacto
4. Implemente em fases

---

## 🎯 Próximos Passos

### Imediato (Sem custo)
1. ✅ Habilitar IAM Access Analyzer
2. ✅ Executar scripts de auditoria
3. ✅ Revisar documentação

### Curto prazo (Baixo custo)
1. ⚠️ Adicionar encryption aos logs
2. ⚠️ Especificar secrets MCP
3. ⚠️ Adicionar condições IAM

### Longo prazo (Médio custo)
1. 💡 Adicionar VPC endpoints
2. 💡 Implementar permissions boundary
3. 💡 Configurar SCPs (se usar Organizations)

---

**Última atualização**: 2024-01-15

**Status**: ✅ Documentação completa e atualizada
