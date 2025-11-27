# Documento de Design – Correção de Descrições dos IP Sets do WAF

## 1. Visão Geral

Este design descreve como implementar a correção das descrições dos IP Sets da WAFStack para que:

- Respeitem o regex obrigatório do AWS WAFv2
- Não causem mais falhas de deploy (GeneralServiceException)
- Mantenham o significado funcional (allowlist / blocklist)
- Introduzam um mecanismo simples de validação em tempo de synth, reduzindo risco de regressão futura

O escopo é limitado a:

- Ajustes em `lib/waf-stack.ts`
- Ajustes leves de documentação e comentários
- Sem alteração de regras de WAF, apenas metadados (description)

## 2. Componentes Impactados

### 2.1. Código

**Arquivo principal:** `lib/waf-stack.ts`

- Recursos CfnIPSet (allowlist e blocklist)
- (Opcional) Função utilitária local de validação de descrição

### 2.2. Infraestrutura

**Stacks:**
- WAFStack-dev
- WAFStack-prod

**Recursos afetados:**
- AWS::WAFv2::IPSet (allowlist)
- AWS::WAFv2::IPSet (blocklist)

### 2.3. Documentação

Documento(s) relacionado(s) ao WAF:
- `docs/SECURITY-GUARDRAILS-AWS.md` ou
- Novo arquivo `docs/WAF-DESCRIPTIONS-GUIDELINES.md`

## 3. Estratégia de Implementação

### 3.1. Ajuste direto das descrições (Requisitos 1 e 2)

**Ideia:** substituir as descrições problemáticas por versões equivalentes, apenas com caracteres permitidos pelo regex.

**Regex exigido pelo WAF:**
```
^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$
```

**Regras derivadas:**

Permitidos:
- Letras (a–z, A–Z)
- Dígitos (0–9)
- _ (underscore)
- Espaço (apenas entre caracteres válidos)
- Símbolos: `+ = : # @ / - , .`

Proibidos:
- Acentos (á, é, ç etc.)
- Parênteses `( )`
- Aspas e outros símbolos não listados

**Descrições propostas (ASCII only):**

IP Set Allowlist:
```typescript
description: 'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks',
```

IP Set Blocklist:
```typescript
description: 'Blocklist de IPs maliciosos identificados',
```

Essas strings:
- Mantêm o sentido original
- Não usam acentos nem parênteses
- Começam e terminam com caractere permitido
- Atendem ao regex

### 3.2. Função de validação de descrição (Requisito 4)

Para evitar regressões futuras, será criada uma pequena função utilitária dentro de `lib/waf-stack.ts`:

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

**Uso nos IP Sets:**

```typescript
const allowlistIpSet = new wafv2.CfnIPSet(this, 'IpSetAllowlist', {
  // ...
  description: validateWafDescription(
    'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks',
  ),
  // ...
});

const blocklistIpSet = new wafv2.CfnIPSet(this, 'IpSetBlocklist', {
  // ...
  description: validateWafDescription(
    'Blocklist de IPs maliciosos identificados',
  ),
  // ...
});
```

**Benefícios:**
- Se no futuro alguém introduzir uma descrição inválida, o erro ocorre em tempo de synth, com mensagem clara
- Atende aos requisitos de prevenção de regressão (validação e mensagem clara)

### 3.3. Validação via CDK synth / deploy

**Fluxo esperado:**

1. `npm run build`
   - Garante que o TypeScript compila com as novas alterações

2. `npx cdk synth WAFStack-dev --context env=dev` / `WAFStack-prod`
   - Verifica se não há erros de validação internos (validateWafDescription)
   - Verifica se o template gerado atende ao schema do CloudFormation

3. `npx cdk deploy WAFStack-dev --context env=dev`
   - Confirma criação/atualização bem-sucedida dos IP Sets com descrições válidas

4. (Opcional, mas recomendado) `npx cdk deploy WAFStack-prod --context env=prod`
   - Alinha dev e prod com a mesma lógica de descrições

## 4. Estratégia de Documentação (Requisito 3)

### 4.1. Comentários em código

Adicionar comentário próximo à função de validação e aos IP Sets:

```typescript
// NOTE: WAF IPSet description must match the AWS regex:
// ^[\\w+=:#@/\\-,\\.][\\w+=:#@/\\-,\\.\\s]+[\\w+=:#@/\\-,\\.]$
// Use only ASCII letters, digits, underscore, spaces and symbols: + = : # @ / - , .
// Do not use accented characters or parentheses.
```

### 4.2. Documento de referência

Atualizar documento existente ou criar `docs/WAF-DESCRIPTIONS-GUIDELINES.md`:

**Conteúdo mínimo:**
- Regex exigido
- Lista de caracteres permitidos/proibidos
- Exemplos:
  - **Válidos:** `Allowlist de IPs confiaveis - escritorios, CI/CD e health checks`
  - **Inválidos:** `Lista de IPs permitidos (allowlist) - escritórios, CI/CD, health checks`

## 5. Prevenção de Regressão (Requisito 4)

Além da função `validateWafDescription`, podemos considerar:

### 5.1. Validação automatizada simples

Adicionar uma verificação leve em algum teste ou script já existente (opcional):

**Exemplo:** um teste TypeScript/Jest que importa `validateWafDescription` e garante que:
- Strings inválidas disparam erro
- Strings válidas passam

Caso não haja estrutura de testes unitários simples ainda para esse arquivo, a função de validação + synth já cobrem boa parte do requisito de prevenção.

## 6. Fluxo de Implementação

Ordem sugerida de trabalho:

1. **Editar `lib/waf-stack.ts`:**
   - Criar `WAF_DESCRIPTION_REGEX` e `validateWafDescription`
   - Atualizar `description` dos IP Sets (allowlist/blocklist) para as versões ASCII-only
   - Passar as descrições por `validateWafDescription`

2. **Build + Synth:**
   - Rodar `npm run build`
   - Rodar `npx cdk synth WAFStack-dev --context env=dev`
   - Rodar `npx cdk synth WAFStack-prod --context env=prod`

3. **Deploy:**
   - `npx cdk deploy WAFStack-dev --context env=dev --require-approval never`
   - (Opcional, recomendado) `npx cdk deploy WAFStack-prod --context env=prod --require-approval never`

4. **Documentação:**
   - Atualizar ou criar documento com diretrizes de descrição do WAF
   - Incluir exemplos válidos/inválidos

## 7. Tratamento de Erros

### 7.1. Erro de validação em tempo de synth

Se `validateWafDescription` detectar descrição inválida:
- Lançar erro com mensagem clara
- Indicar caracteres problemáticos
- Sugerir correção

### 7.2. Erro de deploy

Se mesmo após validação houver erro de deploy:
- Verificar logs do CloudFormation
- Confirmar que descrição atende ao regex
- Verificar outros parâmetros do IP Set

## 8. Testes

### 8.1. Testes manuais

1. Synth com descrições válidas → sucesso
2. Synth com descrições inválidas → erro claro
3. Deploy dev → sucesso
4. Verificar IP Sets no console AWS → descrições corretas

### 8.2. Testes automatizados (opcional)

```typescript
describe('validateWafDescription', () => {
  it('should accept valid descriptions', () => {
    expect(() => validateWafDescription('Valid description 123')).not.toThrow();
  });

  it('should reject descriptions with accents', () => {
    expect(() => validateWafDescription('Descrição com acentos')).toThrow();
  });

  it('should reject descriptions with parentheses', () => {
    expect(() => validateWafDescription('Description (with parens)')).toThrow();
  });
});
```

## 9. Rollback

Se houver problemas após deploy:

1. Reverter commit no Git
2. Executar `cdk deploy` com versão anterior
3. Investigar causa raiz
4. Aplicar correção adicional

## 10. Considerações de Segurança

- Mudança apenas em metadados (description)
- Não afeta regras de segurança do WAF
- Não altera comportamento de bloqueio/permissão de IPs
- Mantém mesma funcionalidade com descrições mais claras
