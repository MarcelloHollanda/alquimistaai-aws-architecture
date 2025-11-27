# Guia de Segurança - Fibonacci AWS

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

Suas credenciais AWS foram expostas durante a configuração inicial. **É CRÍTICO que você tome as seguintes ações IMEDIATAMENTE**:

### 1. Rotacionar Credenciais AWS

```bash
# 1. Acesse o Console AWS IAM
# https://console.aws.amazon.com/iam/

# 2. Vá em "Users" > "jose-marcello33" > "Security credentials"

# 3. Em "Access keys", desative a chave atual:
#    Access Key ID: AKIATA2OIDWBSGYQQHFK

# 4. Crie uma nova access key

# 5. Atualize suas credenciais locais:
aws configure
```

### 2. Verificar Atividade Suspeita

```bash
# Verificar atividade recente na conta
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=jose-marcello33 \
  --max-results 50 \
  --region us-east-1
```

### 3. Habilitar MFA (Multi-Factor Authentication)

1. Acesse: https://console.aws.amazon.com/iam/
2. Clique em seu usuário: `jose-marcello33`
3. Vá em "Security credentials"
4. Em "Multi-factor authentication (MFA)", clique em "Assign MFA device"
5. Siga as instruções para configurar um app autenticador (Google Authenticator, Authy, etc.)

## 🔒 Melhores Práticas de Segurança

### Credenciais

✅ **FAÇA**:
- Use IAM roles ao invés de access keys sempre que possível
- Rotacione credenciais regularmente (a cada 90 dias)
- Use AWS Secrets Manager para armazenar API keys
- Habilite MFA em todas as contas
- Use políticas IAM com menor privilégio possível

❌ **NÃO FAÇA**:
- Nunca commite credenciais no Git
- Nunca compartilhe credenciais em chat/email
- Nunca use credenciais root para operações diárias
- Nunca deixe access keys em código-fonte
- Nunca use credenciais em ambientes de produção (use roles)

### Arquivo .env

O arquivo `.env` contém informações sensíveis e **NUNCA** deve ser commitado no Git.

Verifique se está no `.gitignore`:
```bash
cat .gitignore | grep .env
```

Se você acidentalmente commitou o `.env`:
```bash
# Remover do histórico do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CUIDADO!)
git push origin --force --all
```

### AWS Secrets Manager

Todas as API keys devem ser armazenadas no Secrets Manager:

```bash
# Criar secret
aws secretsmanager create-secret \
  --name fibonacci/mcp/service-name \
  --description "Description" \
  --secret-string '{"key":"value"}' \
  --region us-east-1

# Atualizar secret
aws secretsmanager update-secret \
  --secret-id fibonacci/mcp/service-name \
  --secret-string '{"key":"new-value"}' \
  --region us-east-1

# Rotação automática (recomendado)
aws secretsmanager rotate-secret \
  --secret-id fibonacci/mcp/service-name \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:207933152643:function:rotation-function \
  --rotation-rules AutomaticallyAfterDays=30
```

### IAM Policies

Use o princípio de menor privilégio. Exemplo de política restrita:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "iam:GetRole",
        "iam:PassRole"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

### Logs e Auditoria

Habilite CloudTrail para auditoria completa:

```bash
# Verificar se CloudTrail está habilitado
aws cloudtrail describe-trails --region us-east-1

# Criar trail se não existir
aws cloudtrail create-trail \
  --name fibonacci-audit-trail \
  --s3-bucket-name fibonacci-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation
```

### Criptografia

Todos os dados devem ser criptografados:

- **Em repouso**: KMS para RDS, S3, EBS
- **Em trânsito**: TLS 1.2+ para todas as conexões
- **Secrets**: AWS Secrets Manager com KMS

### Network Security

```typescript
// Security Groups devem ser restritivos
const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
  vpc,
  description: 'Database security group',
  allowAllOutbound: false // Importante!
});

// Permitir apenas tráfego necessário
dbSecurityGroup.addIngressRule(
  ec2.Peer.securityGroupId(lambdaSecurityGroup.securityGroupId),
  ec2.Port.tcp(5432),
  'Allow Lambda to Aurora'
);
```

### WAF Rules

Configure WAF para proteger APIs:

```typescript
const wafRules = [
  // Rate limiting
  {
    name: 'RateLimitRule',
    priority: 1,
    statement: {
      rateBasedStatement: {
        limit: 2000,
        aggregateKeyType: 'IP'
      }
    },
    action: { block: {} }
  },
  // SQL Injection
  {
    name: 'SQLInjectionRule',
    priority: 2,
    statement: {
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesSQLiRuleSet'
      }
    }
  }
];
```

## 🚨 Resposta a Incidentes

### Se você suspeitar de comprometimento:

1. **Desative imediatamente as credenciais comprometidas**:
   ```bash
   aws iam update-access-key \
     --access-key-id AKIATA2OIDWBSGYQQHFK \
     --status Inactive \
     --user-name jose-marcello33
   ```

2. **Revise logs do CloudTrail**:
   ```bash
   aws cloudtrail lookup-events \
     --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
     --region us-east-1
   ```

3. **Verifique recursos criados recentemente**:
   ```bash
   # EC2 instances
   aws ec2 describe-instances --region us-east-1
   
   # Lambda functions
   aws lambda list-functions --region us-east-1
   
   # S3 buckets
   aws s3 ls
   ```

4. **Contate o AWS Support**:
   - Abra um caso de segurança no console AWS
   - Telefone: 1-866-626-8691 (EUA)

5. **Documente o incidente**:
   - Quando foi detectado
   - Quais credenciais foram comprometidas
   - Ações tomadas
   - Impacto estimado

## 📋 Checklist de Segurança

Antes de ir para produção, verifique:

- [ ] MFA habilitado em todas as contas
- [ ] Credenciais rotacionadas
- [ ] CloudTrail habilitado
- [ ] Logs centralizados no CloudWatch
- [ ] Alarmes configurados para atividades suspeitas
- [ ] WAF configurado no API Gateway
- [ ] Security Groups restritivos
- [ ] Criptografia habilitada (KMS)
- [ ] Backup automático configurado
- [ ] Política de retenção de logs definida
- [ ] Secrets no Secrets Manager (não em variáveis de ambiente)
- [ ] IAM policies com menor privilégio
- [ ] VPC com subnets privadas para recursos sensíveis
- [ ] Deletion protection habilitado em produção
- [ ] Testes de penetração realizados
- [ ] Plano de resposta a incidentes documentado

## 📚 Recursos Adicionais

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)

## 🆘 Contatos de Emergência

- **AWS Support**: https://console.aws.amazon.com/support/
- **AWS Abuse**: abuse@amazonaws.com
- **AWS Security**: aws-security@amazon.com

---

**Lembre-se**: Segurança é um processo contínuo, não um estado final. Revise e atualize suas práticas regularmente.
