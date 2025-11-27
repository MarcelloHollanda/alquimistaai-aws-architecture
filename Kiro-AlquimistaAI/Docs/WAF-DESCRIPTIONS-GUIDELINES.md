# Diretrizes para Descrições de IP Sets do AWS WAF

## Visão Geral

Este documento estabelece as diretrizes para criação e manutenção de descrições de IP Sets no AWS WAF, garantindo conformidade com os requisitos da AWS e prevenindo erros de deploy.

## Regex Obrigatório

O AWS WAFv2 exige que todas as descrições de IP Sets sigam o seguinte padrão regex:

```
^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$
```

### Interpretação do Regex

- **Início**: `^[\w+=:#@/\-,\.]` - Deve começar com um caractere válido (não pode começar com espaço)
- **Meio**: `[\w+=:#@/\-,\.\s]+` - Pode conter caracteres válidos e espaços
- **Fim**: `[\w+=:#@/\-,\.]$` - Deve terminar com um caractere válido (não pode terminar com espaço)

## Caracteres Permitidos

### ✅ Permitidos

- **Letras**: a-z, A-Z (apenas ASCII, sem acentos)
- **Números**: 0-9
- **Underscore**: _
- **Espaços**: ` ` (apenas entre caracteres válidos)
- **Símbolos especiais**:
  - `+` (mais)
  - `=` (igual)
  - `:` (dois pontos)
  - `#` (hashtag)
  - `@` (arroba)
  - `/` (barra)
  - `-` (hífen)
  - `,` (vírgula)
  - `.` (ponto)

### ❌ Proibidos

- **Acentos**: á, é, í, ó, ú, ã, õ, ç, etc.
- **Parênteses**: ( )
- **Colchetes**: [ ]
- **Chaves**: { }
- **Aspas**: " '
- **Outros símbolos**: !, ?, *, &, %, $, etc.
- **Caracteres Unicode**: emojis, símbolos especiais, etc.

## Exemplos

### ✅ Descrições Válidas

```typescript
// Correto - apenas ASCII, sem acentos ou parênteses
'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks'

// Correto - símbolos permitidos
'Blocklist de IPs maliciosos identificados'

// Correto - uso de símbolos especiais permitidos
'Production IPs - offices@company.com #security'

// Correto - números e underscores
'IP_Set_v2.0 - Updated 2024/11/18'
```

### ❌ Descrições Inválidas

```typescript
// Incorreto - contém acentos
'Lista de IPs permitidos - escritórios, CI/CD'

// Incorreto - contém parênteses
'Allowed IPs (offices, CI/CD, health checks)'

// Incorreto - começa com espaço
' Allowlist de IPs confiaveis'

// Incorreto - termina com espaço
'Blocklist de IPs maliciosos '

// Incorreto - contém caracteres especiais não permitidos
'IPs bloqueados! Atenção: maliciosos'

// Incorreto - contém aspas
'Lista de IPs "confiáveis"'
```

## Implementação no Código

### Função de Validação

O arquivo `lib/waf-stack.ts` contém uma função de validação que deve ser usada para todas as descrições de IP Sets:

```typescript
const WAF_DESCRIPTION_REGEX = /^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$/;

function validateWafDescription(desc: string): string {
  if (!WAF_DESCRIPTION_REGEX.test(desc)) {
    throw new Error(
      `Invalid WAF IPSet description: "${desc}". ` +
      'Use only ASCII letters, digits, underscore, spaces and symbols + = : # @ / - , . ' +
      'Do not use accented characters or parentheses.'
    );
  }
  return desc;
}
```

### Uso Correto

```typescript
// Sempre usar a função de validação
this.allowedIPs = new wafv2.CfnIPSet(this, 'AllowedIPs', {
  name: `alquimista-allowed-ips-${env}`,
  description: validateWafDescription(
    'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks'
  ),
  scope: 'REGIONAL',
  ipAddressVersion: 'IPV4',
  addresses: [],
});
```

## Checklist de Validação

Antes de adicionar ou modificar uma descrição de IP Set, verifique:

- [ ] Não contém acentos (á, é, í, ó, ú, ã, õ, ç)
- [ ] Não contém parênteses ( )
- [ ] Não contém aspas " '
- [ ] Não começa com espaço
- [ ] Não termina com espaço
- [ ] Usa apenas caracteres ASCII
- [ ] Usa apenas símbolos permitidos: + = : # @ / - , .
- [ ] Passa pela função `validateWafDescription()`

## Tratamento de Erros

### Erro em Tempo de Synth

Se a validação falhar durante `cdk synth`, você verá:

```
Error: Invalid WAF IPSet description: "Lista de IPs permitidos (allowlist)".
Use only ASCII letters, digits, underscore, spaces and symbols + = : # @ / - , .
Do not use accented characters or parentheses.
```

**Solução**: Remova os caracteres inválidos e use apenas ASCII.

### Erro em Tempo de Deploy

Se o erro ocorrer durante `cdk deploy`:

```
Resource handler returned message: "1 validation error detected:
Value 'Lista de IPs permitidos (allowlist)' at 'description' failed to satisfy constraint:
Member must satisfy regular expression pattern: ^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$"
```

**Solução**: Corrija a descrição no código e execute `cdk deploy` novamente.

## Boas Práticas

1. **Use inglês quando possível**: Evita problemas com acentuação
   - ✅ `Allowlist of trusted IPs - offices, CI/CD, health checks`
   - ❌ `Lista de IPs confiáveis - escritórios, CI/CD, health checks`

2. **Use hífen em vez de parênteses**: Para separar informações
   - ✅ `Allowed IPs - offices, CI/CD, health checks`
   - ❌ `Allowed IPs (offices, CI/CD, health checks)`

3. **Remova acentos**: Substitua por letras sem acento
   - ✅ `escritorios` em vez de `escritórios`
   - ✅ `confiaveis` em vez de `confiáveis`
   - ✅ `maliciosos` em vez de `maliciosos` (já está correto)

4. **Seja descritivo mas conciso**: Máximo de 256 caracteres
   - ✅ `Allowlist de IPs confiaveis - escritorios, CI/CD e health checks`
   - ❌ `Esta é uma lista muito longa de endereços IP que são permitidos...`

5. **Use a função de validação**: Sempre passe descrições por `validateWafDescription()`

## Referências

- [AWS WAFv2 API Reference - IPSet](https://docs.aws.amazon.com/waf/latest/APIReference/API_IPSet.html)
- [AWS WAFv2 CloudFormation Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-ipset.html)
- Arquivo de implementação: `lib/waf-stack.ts`

## Histórico de Mudanças

| Data | Versão | Descrição |
|------|--------|-----------|
| 2024-11-18 | 1.0 | Criação inicial do documento com diretrizes e exemplos |

## Contato

Para dúvidas ou sugestões sobre este documento, consulte a equipe de DevOps/Segurança.
