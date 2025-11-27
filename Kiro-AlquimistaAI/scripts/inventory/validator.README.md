# Validador de Consistência do Inventário

## Visão Geral

O validador de consistência garante que o inventário do sistema AlquimistaAI esteja completo, consistente e livre de erros. Ele implementa várias propriedades de correção que devem ser mantidas em todo o inventário.

## Propriedades Validadas

### Property 1: Completude de Stacks

**Descrição:** Para qualquer stack CDK listada no documento, todas as informações obrigatórias (nome, ambiente, recursos principais) devem estar presentes e não vazias.

**Valida:** Requirements 1.1, 1.2

**Exemplo:**
```typescript
// ✅ Stack válida
{
  name: 'FibonacciStack',
  environment: 'dev',
  resources: {
    apis: [...],
    lambdas: [...],
    // ...
  }
}

// ❌ Stack inválida (sem nome)
{
  name: '',
  environment: 'dev',
  resources: { ... }
}
```

### Property 3: Consistência de Referências

**Descrição:** Para qualquer referência cruzada a outro documento, o arquivo referenciado deve existir no repositório.

**Valida:** Requirements 9.1

**Exemplo:**
```typescript
// ✅ Referência válida
{
  file: 'lambda/fibonacci/handler.ts' // Arquivo existe
}

// ❌ Referência inválida
{
  file: 'lambda/nao-existe.ts' // Arquivo não existe
}
```

### Property 4: Unicidade de Identificadores

**Descrição:** Para qualquer recurso AWS documentado, o identificador (ID, ARN, nome lógico) deve ser único dentro de seu tipo e ambiente.

**Valida:** Requirements 1.3, 3.1

**Exemplo:**
```typescript
// ✅ Identificadores únicos
[
  { name: 'FibonacciApi', environment: 'dev' },
  { name: 'FibonacciApi', environment: 'prod' } // OK: ambientes diferentes
]

// ❌ Identificadores duplicados
[
  { name: 'FibonacciApi', environment: 'dev' },
  { name: 'FibonacciApi', environment: 'dev' } // ERRO: mesmo ambiente
]
```

### Property 5: Completude de Migrations

**Descrição:** Para qualquer migration listada, deve haver correspondência entre o arquivo SQL e a entrada na documentação.

**Valida:** Requirements 2.3

**Exemplo:**
```typescript
// ✅ Migration completa
{
  number: '007',
  filename: '007_create_nigredo_schema.sql', // Arquivo existe
  summary: 'Cria schema do Nigredo', // Tem resumo
  status: 'applied'
}

// ❌ Migration incompleta
{
  number: '008',
  filename: '008_missing.sql', // Arquivo não existe
  summary: '', // Sem resumo
  status: 'applied'
}
```

### Property 6: Diferenciação de Ambientes

**Descrição:** Para qualquer recurso que existe em múltiplos ambientes, o documento deve claramente diferenciar entre dev e prod.

**Valida:** Requirements 1.5, 3.1

**Exemplo:**
```typescript
// ✅ Ambientes diferenciados
{
  name: 'FibonacciApi',
  environment: 'dev',
  baseUrl: 'https://api-dev.alquimista.ai'
}
{
  name: 'FibonacciApi',
  environment: 'prod',
  baseUrl: 'https://api.alquimista.ai'
}

// ⚠️ Ambientes não diferenciados
{
  name: 'FibonacciApi',
  environment: 'dev',
  baseUrl: undefined // Sem URL para diferenciar
}
```

## Uso

### Validação Completa

```typescript
import { validateInventory } from './validator';
import { SystemInventory } from './types';

const inventory: SystemInventory = {
  // ... seu inventário
};

const result = validateInventory(inventory, process.cwd());

if (result.valid) {
  console.log('✅ Inventário válido!');
} else {
  console.error('❌ Erros encontrados:');
  result.errors.forEach(error => console.error(`  - ${error}`));
}

if (result.warnings.length > 0) {
  console.warn('⚠️  Avisos:');
  result.warnings.forEach(warning => console.warn(`  - ${warning}`));
}
```

### Validações Individuais

```typescript
import {
  validateStackCompleteness,
  validateIdentifierUniqueness,
  validateCrossReferences,
  validateEnvironmentDifferentiation,
  validateMigrationCompleteness
} from './validator';

const errors: string[] = [];
const warnings: string[] = [];

// Validar apenas completude de stacks
validateStackCompleteness(inventory, errors, warnings);

// Validar apenas unicidade
validateIdentifierUniqueness(inventory, errors, warnings);

// Validar apenas referências
validateCrossReferences(inventory, workspaceRoot, errors, warnings);

// Validar apenas ambientes
validateEnvironmentDifferentiation(inventory, errors, warnings);

// Validar apenas migrations
validateMigrationCompleteness(
  inventory.database.migrations,
  workspaceRoot,
  errors,
  warnings
);
```

### Gerar Relatório

```typescript
import { generateValidationReport } from './validator';

const result = validateInventory(inventory, process.cwd());
const report = generateValidationReport(result);

console.log(report);
// Ou salvar em arquivo
fs.writeFileSync('validation-report.md', report);
```

## Estrutura do Resultado

```typescript
interface ValidationResult {
  valid: boolean;        // true se não há erros
  errors: string[];      // Erros críticos que impedem uso
  warnings: string[];    // Avisos não críticos
}
```

## Tipos de Mensagens

### Erros (Críticos)

Impedem que o inventário seja considerado válido:

- Stack sem nome
- Stack sem ambiente
- Ambiente inválido
- Identificadores duplicados no mesmo ambiente
- Arquivos referenciados não encontrados
- Migrations documentadas mas arquivos ausentes

### Avisos (Não Críticos)

Indicam problemas potenciais mas não impedem uso:

- Stack sem recursos
- API sem rotas definidas
- Lambda sem runtime especificado
- Migration sem resumo
- API sem baseUrl para diferenciação de ambiente
- README de migration ausente (para migrations >= 007)

## Integração com Testes

O validador possui testes de propriedade usando `fast-check`:

```bash
# Executar testes
npm test -- tests/unit/inventory/validator.test.ts --run

# Executar com cobertura
npm test -- tests/unit/inventory/validator.test.ts --coverage
```

## Boas Práticas

1. **Execute validação antes de gerar documentos**
   ```typescript
   const result = validateInventory(inventory, workspaceRoot);
   if (!result.valid) {
     throw new Error('Inventário inválido, corrija os erros antes de gerar documentos');
   }
   ```

2. **Trate avisos como oportunidades de melhoria**
   - Avisos não impedem geração de documentos
   - Mas indicam áreas que podem ser melhoradas

3. **Use validações individuais durante desenvolvimento**
   - Mais rápido para testar mudanças específicas
   - Facilita debug de problemas

4. **Mantenha referências atualizadas**
   - Sempre que mover/renomear arquivos
   - Execute validação para detectar referências quebradas

## Exemplos de Uso

### Exemplo 1: Validação em Pipeline CI/CD

```typescript
// scripts/validate-inventory.ts
import { validateInventory } from './inventory/validator';
import { collectSystemInventory } from './inventory/collector';

async function main() {
  const inventory = await collectSystemInventory(process.cwd());
  const result = validateInventory(inventory, process.cwd());

  if (!result.valid) {
    console.error('❌ Validação falhou!');
    result.errors.forEach(e => console.error(`  ${e}`));
    process.exit(1);
  }

  console.log('✅ Validação passou!');
  if (result.warnings.length > 0) {
    console.warn(`⚠️  ${result.warnings.length} avisos encontrados`);
  }
}

main();
```

### Exemplo 2: Validação Incremental

```typescript
// Validar apenas o que mudou
const errors: string[] = [];
const warnings: string[] = [];

if (stacksChanged) {
  validateStackCompleteness(inventory, errors, warnings);
  validateIdentifierUniqueness(inventory, errors, warnings);
}

if (migrationsChanged) {
  validateMigrationCompleteness(
    inventory.database.migrations,
    workspaceRoot,
    errors,
    warnings
  );
}

if (filesChanged) {
  validateCrossReferences(inventory, workspaceRoot, errors, warnings);
}
```

### Exemplo 3: Relatório Detalhado

```typescript
import { generateValidationReport } from './validator';

const result = validateInventory(inventory, workspaceRoot);
const report = generateValidationReport(result);

// Adicionar contexto adicional
const detailedReport = `
${report}

## Contexto

- Total de stacks: ${inventory.infrastructure.stacks.length}
- Total de migrations: ${inventory.database.migrations.length}
- Total de APIs: ${inventory.infrastructure.stacks.reduce((acc, s) => 
    acc + (s.resources.apis?.length || 0), 0)}

## Próximos Passos

${result.errors.length > 0 ? '1. Corrigir erros críticos' : ''}
${result.warnings.length > 0 ? '2. Revisar e resolver avisos' : ''}
${result.valid ? '3. Gerar documentação' : ''}
`;

fs.writeFileSync('validation-report-detailed.md', detailedReport);
```

## Troubleshooting

### Erro: "Stack sem nome encontrada"

**Causa:** Uma stack no inventário tem `name` vazio ou undefined.

**Solução:** Verifique o analisador CDK e garanta que todas as stacks têm nome.

### Erro: "Arquivo referenciado não encontrado"

**Causa:** Um arquivo mencionado no inventário não existe no workspace.

**Solução:** 
- Verifique se o caminho está correto
- Verifique se o arquivo foi movido/deletado
- Atualize a referência no código

### Aviso: "API sem baseUrl para diferenciação"

**Causa:** Uma API existe em múltiplos ambientes mas não tem baseUrl definida.

**Solução:** Adicione baseUrl às APIs ou documente os IDs/URLs em runtime.

### Erro: "Identificador duplicado"

**Causa:** Dois recursos têm o mesmo identificador no mesmo ambiente.

**Solução:** Renomeie um dos recursos ou verifique se são realmente duplicados.

## Referências

- [Design Document](../../.kiro/specs/system-inventory-documentation/design.md)
- [Requirements](../../.kiro/specs/system-inventory-documentation/requirements.md)
- [Types](./types.ts)
- [Testes](../../tests/unit/inventory/validator.test.ts)
