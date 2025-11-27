# Documentação de Segurança - AlquimistaAI

## Visão Geral

Esta pasta contém documentação relacionada à segurança da infraestrutura AlquimistaAI na AWS.

---

## Documentos Disponíveis

### WAF (Web Application Firewall)

#### [WAF Logging - Padrão Oficial](./WAF-LOGGING-ALQUIMISTAAI.md)
Documentação completa do padrão oficial de logging do AWS WAF para AlquimistaAI.

**Conteúdo:**
- Contexto e problema original
- Decisão de design
- Implementação CDK completa
- Checklist de validação
- Troubleshooting

**Quando usar:**
- Implementar novo WAF
- Debugar problemas de logging
- Entender decisões de arquitetura

#### [WAF Logging - Referência Rápida](./WAF-LOGGING-QUICK-REFERENCE.md)
Guia rápido com comandos e snippets de código para logging do WAF.

**Conteúdo:**
- Padrão de nomenclatura
- Código CDK padrão
- Comandos de deploy
- Troubleshooting rápido

**Quando usar:**
- Implementação rápida
- Consulta durante desenvolvimento
- Referência de comandos

#### [WAF Implementation Summary](./WAF-IMPLEMENTATION-SUMMARY.md)
Resumo executivo da implementação do logging do WAF.

**Conteúdo:**
- Status da implementação
- Problema vs Solução
- Checklist de validação
- Próximos passos

**Quando usar:**
- Visão geral rápida
- Validação de implementação
- Referência de status

#### [WAF Logging - Guia Visual](./WAF-LOGGING-VISUAL-GUIDE.md)
Guia visual com diagramas e fluxos para logging do WAF.

**Conteúdo:**
- Diagramas de arquitetura
- Fluxo de implementação
- Checklist visual
- Comparação correto vs incorreto

**Quando usar:**
- Compreensão visual
- Apresentações
- Onboarding de novos desenvolvedores

---

## Outros Documentos de Segurança

### Documentos na Raiz `/docs`

- **[SECURITY-GUARDRAILS-AWS.md](../SECURITY-GUARDRAILS-AWS.md)** - Guardrails de segurança gerais
- **[SECURITY-STACK-FIX-SUMMARY.md](../SECURITY-STACK-FIX-SUMMARY.md)** - Resumo de correções na SecurityStack
- **[SECURITY-STACK-SINGLETON-FIX.md](../SECURITY-STACK-SINGLETON-FIX.md)** - Correção de singleton da SecurityStack
- **[WAF-DESCRIPTIONS-GUIDELINES.md](../WAF-DESCRIPTIONS-GUIDELINES.md)** - Guidelines para descrições do WAF

### Documentos em `/docs/Deploy`

- **[WAF-README.md](../Deploy/WAF-README.md)** - README geral do WAF
- **[WAF-QUICK-REFERENCE.md](../Deploy/WAF-QUICK-REFERENCE.md)** - Referência rápida do WAF
- **[WAF-IMPLEMENTATION.md](../Deploy/WAF-IMPLEMENTATION.md)** - Detalhes de implementação

---

## Padrões de Segurança

### Nomenclatura de Recursos

#### Log Groups do WAF
```
aws-waf-logs-<sistema>-<ambiente>
```

Exemplos:
- `aws-waf-logs-alquimista-dev`
- `aws-waf-logs-alquimista-prod`

#### IP Sets
```
alquimista-<tipo>-ips-<ambiente>
```

Exemplos:
- `alquimista-allowed-ips-dev`
- `alquimista-blocked-ips-prod`

### Descrições de Recursos WAF

**Regex obrigatório:**
```regex
^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$
```

**Caracteres permitidos:**
- Letras: a-z, A-Z
- Números: 0-9
- Underscore: _
- Símbolos: + = : # @ / - , .
- Espaços (no meio da string)

**Caracteres NÃO permitidos:**
- Acentos: á, é, í, ó, ú, ã, õ, ç
- Parênteses: ( )
- Outros caracteres especiais

---

## Specs Relacionadas

### WAF
- [waf-edge-security](../../.kiro/specs/waf-edge-security/) - Implementação inicial do WAF
- [waf-stack-description-logging-fix](../../.kiro/specs/waf-stack-description-logging-fix/) - Correção de logging
- [waf-ipset-description-fix](../../.kiro/specs/waf-ipset-description-fix/) - Correção de descrições de IP Sets

---

## Comandos Úteis

### Deploy WAF

```bash
# Dev
npx cdk deploy WAFStack-dev --context env=dev --require-approval never

# Prod
npx cdk deploy WAFStack-prod --context env=prod --require-approval never
```

### Validação

```bash
# Build
npm run build

# Synth
npx cdk synth WAFStack-dev --context env=dev

# Verificar logs
aws logs describe-log-groups --log-group-name-prefix aws-waf-logs-alquimista
```

---

## Contato e Suporte

Para questões relacionadas à segurança da infraestrutura:
- Consulte a documentação completa
- Revise as specs relacionadas
- Verifique os logs do CloudWatch

---

## Histórico de Atualizações

| Data | Documento | Descrição |
|------|-----------|-----------|
| 2024 | WAF-LOGGING-ALQUIMISTAAI.md | Padrão oficial de logging do WAF |
| 2024 | WAF-LOGGING-QUICK-REFERENCE.md | Referência rápida de logging |
| 2024 | README.md | Índice de documentação de segurança |
