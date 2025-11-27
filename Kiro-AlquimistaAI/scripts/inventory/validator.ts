/**
 * Validador de Consistência do Inventário do Sistema
 * 
 * Implementa validações de completude, unicidade, referências cruzadas
 * e diferenciação de ambientes para o inventário do sistema AlquimistaAI.
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  SystemInventory, 
  ValidationResult, 
  StackInfo,
  ApiGatewayInfo,
  LambdaInfo,
  MigrationInfo,
  Environment
} from './types';

/**
 * Valida a consistência completa do inventário
 */
export function validateInventory(
  inventory: SystemInventory,
  workspaceRoot: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validação 1: Completude de Stacks
  validateStackCompleteness(inventory, errors, warnings);

  // Validação 2: Unicidade de Identificadores
  validateIdentifierUniqueness(inventory, errors, warnings);

  // Validação 3: Referências Cruzadas
  validateCrossReferences(inventory, workspaceRoot, errors, warnings);

  // Validação 4: Diferenciação de Ambientes
  validateEnvironmentDifferentiation(inventory, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valida completude de stacks
 * Property 1: Para qualquer stack CDK listada, todas as informações obrigatórias
 * (nome, ambiente, recursos principais) devem estar presentes e não vazias.
 */
export function validateStackCompleteness(
  inventory: SystemInventory,
  errors: string[],
  warnings: string[]
): void {
  const stacks = inventory.infrastructure.stacks;

  if (!stacks || stacks.length === 0) {
    errors.push('Nenhuma stack CDK encontrada no inventário');
    return;
  }

  for (const stack of stacks) {
    const stackId = stack.name || '<sem nome>';

    // Validar nome
    if (!stack.name || stack.name.trim() === '') {
      errors.push(`Stack sem nome encontrada`);
    }

    // Validar ambiente
    if (!stack.environment) {
      errors.push(`Stack ${stackId}: ambiente não especificado`);
    } else if (!['dev', 'prod', 'both'].includes(stack.environment)) {
      errors.push(`Stack ${stackId}: ambiente inválido '${stack.environment}'`);
    }

    // Validar recursos
    if (!stack.resources) {
      errors.push(`Stack ${stackId}: objeto 'resources' ausente`);
      continue;
    }

    // Verificar se pelo menos um tipo de recurso está presente
    const hasResources = 
      (stack.resources.apis && stack.resources.apis.length > 0) ||
      (stack.resources.lambdas && stack.resources.lambdas.length > 0) ||
      (stack.resources.databases && stack.resources.databases.length > 0) ||
      (stack.resources.storage && stack.resources.storage.length > 0) ||
      (stack.resources.security && stack.resources.security.length > 0);

    if (!hasResources) {
      warnings.push(`Stack ${stackId}: nenhum recurso principal encontrado`);
    }

    // Validar completude de APIs
    if (stack.resources.apis) {
      for (const api of stack.resources.apis) {
        validateApiCompleteness(api, stackId, errors, warnings);
      }
    }

    // Validar completude de Lambdas
    if (stack.resources.lambdas) {
      for (const lambda of stack.resources.lambdas) {
        validateLambdaCompleteness(lambda, stackId, errors, warnings);
      }
    }
  }
}

/**
 * Valida completude de uma API Gateway
 */
function validateApiCompleteness(
  api: ApiGatewayInfo,
  stackId: string,
  errors: string[],
  warnings: string[]
): void {
  if (!api.logicalName || api.logicalName.trim() === '') {
    errors.push(`Stack ${stackId}: API sem logicalName`);
  }

  if (!api.type || !['HTTP', 'REST'].includes(api.type)) {
    errors.push(`Stack ${stackId}, API ${api.logicalName}: tipo inválido ou ausente`);
  }

  if (!api.routes || api.routes.length === 0) {
    warnings.push(`Stack ${stackId}, API ${api.logicalName}: nenhuma rota definida`);
  }
}

/**
 * Valida completude de uma Lambda
 */
function validateLambdaCompleteness(
  lambda: LambdaInfo,
  stackId: string,
  errors: string[],
  warnings: string[]
): void {
  if (!lambda.logicalName || lambda.logicalName.trim() === '') {
    errors.push(`Stack ${stackId}: Lambda sem logicalName`);
  }

  if (!lambda.runtime || lambda.runtime.trim() === '') {
    warnings.push(`Stack ${stackId}, Lambda ${lambda.logicalName}: runtime não especificado`);
  }

  if (!lambda.file || lambda.file.trim() === '') {
    warnings.push(`Stack ${stackId}, Lambda ${lambda.logicalName}: arquivo não especificado`);
  }
}

/**
 * Valida unicidade de identificadores
 * Property 4: Para qualquer recurso AWS documentado, o identificador
 * (ID, ARN, nome lógico) deve ser único dentro de seu tipo e ambiente.
 */
export function validateIdentifierUniqueness(
  inventory: SystemInventory,
  errors: string[],
  warnings: string[]
): void {
  // Mapas para rastrear identificadores por tipo e ambiente
  const apiIds = new Map<string, string[]>(); // id -> [stack, env]
  const lambdaNames = new Map<string, string[]>();
  const stackNames = new Map<string, string[]>();

  for (const stack of inventory.infrastructure.stacks) {
    const env = stack.environment;
    const stackKey = `${stack.name}-${env}`;

    // Verificar unicidade de nomes de stack
    if (stackNames.has(stack.name)) {
      const existing = stackNames.get(stack.name)!;
      // Permitir mesmo nome em ambientes diferentes
      if (existing.includes(env)) {
        errors.push(
          `Nome de stack duplicado: '${stack.name}' no ambiente '${env}'`
        );
      }
    } else {
      stackNames.set(stack.name, [env]);
    }

    // Verificar unicidade de APIs
    if (stack.resources.apis) {
      for (const api of stack.resources.apis) {
        const apiKey = `${api.logicalName}-${env}`;
        
        if (apiIds.has(apiKey)) {
          errors.push(
            `API logicalName duplicado: '${api.logicalName}' no ambiente '${env}' ` +
            `(stack: ${stack.name})`
          );
        } else {
          apiIds.set(apiKey, [stack.name, env]);
        }

        // Se tiver ID real, verificar unicidade
        if (api.id) {
          const idKey = `${api.id}-${env}`;
          if (apiIds.has(idKey)) {
            errors.push(
              `API ID duplicado: '${api.id}' no ambiente '${env}'`
            );
          } else {
            apiIds.set(idKey, [stack.name, env]);
          }
        }
      }
    }

    // Verificar unicidade de Lambdas
    if (stack.resources.lambdas) {
      for (const lambda of stack.resources.lambdas) {
        const lambdaKey = `${lambda.logicalName}-${env}`;
        
        if (lambdaNames.has(lambdaKey)) {
          errors.push(
            `Lambda logicalName duplicado: '${lambda.logicalName}' no ambiente '${env}' ` +
            `(stack: ${stack.name})`
          );
        } else {
          lambdaNames.set(lambdaKey, [stack.name, env]);
        }
      }
    }
  }

  // Verificar unicidade de migrations
  const migrationNumbers = new Set<string>();
  for (const migration of inventory.database.migrations) {
    if (migrationNumbers.has(migration.number)) {
      errors.push(`Número de migration duplicado: ${migration.number}`);
    } else {
      migrationNumbers.add(migration.number);
    }
  }

  // Verificar unicidade de grupos Cognito
  const cognitoGroups = new Set<string>();
  for (const group of inventory.authentication.groups) {
    if (cognitoGroups.has(group.name)) {
      errors.push(`Grupo Cognito duplicado: ${group.name}`);
    } else {
      cognitoGroups.add(group.name);
    }
  }
}

/**
 * Valida referências cruzadas
 * Property 3: Para qualquer referência cruzada a outro documento,
 * o arquivo referenciado deve existir no repositório.
 */
export function validateCrossReferences(
  inventory: SystemInventory,
  workspaceRoot: string,
  errors: string[],
  warnings: string[]
): void {
  // Coletar todas as referências de arquivos mencionadas
  const fileReferences: string[] = [];

  // Referências de Lambda handlers
  for (const stack of inventory.infrastructure.stacks) {
    if (stack.resources.lambdas) {
      for (const lambda of stack.resources.lambdas) {
        if (lambda.file) {
          fileReferences.push(lambda.file);
        }
      }
    }
  }

  // Referências de migrations
  for (const migration of inventory.database.migrations) {
    const migrationPath = path.join('database', 'migrations', migration.filename);
    fileReferences.push(migrationPath);

    // Verificar README correspondente
    const readmePath = path.join(
      'database',
      'migrations',
      `README-${migration.number}.md`
    );
    fileReferences.push(readmePath);
  }

  // Referências de frontend
  if (inventory.frontend.operationalPanel.routes) {
    for (const route of inventory.frontend.operationalPanel.routes) {
      if (route.file) {
        fileReferences.push(route.file);
      }
    }
  }

  if (inventory.frontend.operationalPanel.apiClients) {
    for (const client of inventory.frontend.operationalPanel.apiClients) {
      fileReferences.push(client.file);
    }
  }

  // Referências de CI/CD
  if (inventory.cicd.workflow.file) {
    fileReferences.push(inventory.cicd.workflow.file);
  }

  for (const script of inventory.cicd.scripts) {
    fileReferences.push(script.path);
  }

  for (const testLog of inventory.cicd.tests) {
    fileReferences.push(testLog.path);
  }

  // Verificar existência de cada arquivo
  for (const fileRef of fileReferences) {
    const fullPath = path.join(workspaceRoot, fileRef);
    
    if (!fs.existsSync(fullPath)) {
      // Alguns arquivos podem ser opcionais (como READMEs de migrations antigas)
      if (fileRef.includes('README-') && fileRef.includes('migrations')) {
        warnings.push(`Arquivo opcional não encontrado: ${fileRef}`);
      } else {
        errors.push(`Arquivo referenciado não encontrado: ${fileRef}`);
      }
    }
  }

  // Validar referências de integração entre backends
  validateBackendIntegrations(inventory, errors, warnings);
}

/**
 * Valida integrações entre backends
 */
function validateBackendIntegrations(
  inventory: SystemInventory,
  errors: string[],
  warnings: string[]
): void {
  // Verificar se Nigredo referencia Fibonacci
  const nigredonIntegrations = inventory.backends.nigredo.integrations || [];
  
  if (nigredonIntegrations.includes('Fibonacci')) {
    // Verificar se Fibonacci tem endpoint para receber eventos do Nigredo
    const fibonacciRoutes = inventory.backends.fibonacci.handlers
      .flatMap(h => h.routes);
    
    const hasNigredonWebhook = fibonacciRoutes.some(route => 
      route.includes('nigredo') || route.includes('public/nigredo-event')
    );

    if (!hasNigredonWebhook) {
      warnings.push(
        'Nigredo declara integração com Fibonacci, mas nenhuma rota de webhook foi encontrada'
      );
    }
  }
}

/**
 * Valida diferenciação de ambientes
 * Property 6: Para qualquer recurso que existe em múltiplos ambientes,
 * o documento deve claramente diferenciar entre dev e prod.
 */
export function validateEnvironmentDifferentiation(
  inventory: SystemInventory,
  errors: string[],
  warnings: string[]
): void {
  // Agrupar stacks por nome base
  const stacksByBaseName = new Map<string, StackInfo[]>();

  for (const stack of inventory.infrastructure.stacks) {
    // Remover sufixos de ambiente do nome
    const baseName = stack.name
      .replace(/-dev$/i, '')
      .replace(/-prod$/i, '')
      .replace(/Dev$/i, '')
      .replace(/Prod$/i, '');

    if (!stacksByBaseName.has(baseName)) {
      stacksByBaseName.set(baseName, []);
    }
    stacksByBaseName.get(baseName)!.push(stack);
  }

  // Verificar stacks que existem em múltiplos ambientes
  for (const [baseName, stacks] of stacksByBaseName.entries()) {
    if (stacks.length > 1) {
      // Verificar se ambientes estão claramente diferenciados
      const environments = stacks.map(s => s.environment);
      const uniqueEnvs = new Set(environments);

      if (uniqueEnvs.size === 1 && uniqueEnvs.has('both')) {
        warnings.push(
          `Stack '${baseName}' existe em múltiplas instâncias mas todas marcadas como 'both'`
        );
      }

      // Verificar se recursos têm diferenciação clara
      for (const stack of stacks) {
        if (stack.resources.apis) {
          for (const api of stack.resources.apis) {
            if (!api.baseUrl) {
              warnings.push(
                `API '${api.logicalName}' na stack '${stack.name}' não tem baseUrl definida ` +
                `para diferenciação de ambiente`
              );
            }
          }
        }
      }
    }
  }

  // Verificar APIs que devem existir em dev e prod
  const apisByName = new Map<string, ApiGatewayInfo[]>();

  for (const stack of inventory.infrastructure.stacks) {
    if (stack.resources.apis) {
      for (const api of stack.resources.apis) {
        const key = api.logicalName;
        if (!apisByName.has(key)) {
          apisByName.set(key, []);
        }
        apisByName.get(key)!.push(api);
      }
    }
  }

  // Verificar se APIs críticas existem em ambos os ambientes
  const criticalApis = ['FibonacciApi', 'NigredonApi', 'OperationalDashboardApi'];
  
  for (const apiName of criticalApis) {
    const apis = apisByName.get(apiName) || [];
    
    if (apis.length === 0) {
      warnings.push(`API crítica '${apiName}' não encontrada em nenhum ambiente`);
    } else if (apis.length === 1) {
      warnings.push(
        `API crítica '${apiName}' encontrada em apenas um ambiente ` +
        `(esperado: dev e prod)`
      );
    }
  }

  // Verificar User Pool Cognito
  if (inventory.authentication.userPool) {
    const userPool = inventory.authentication.userPool;
    
    // Verificar se há indicação de ambiente no nome ou ID
    const hasEnvIndicator = 
      userPool.name.includes('dev') || 
      userPool.name.includes('prod') ||
      userPool.id.includes('dev') ||
      userPool.id.includes('prod');

    if (!hasEnvIndicator) {
      warnings.push(
        'User Pool Cognito não tem indicação clara de ambiente no nome ou ID'
      );
    }
  }

  // Verificar diferenciação de frontend
  if (inventory.frontend.operationalPanel) {
    const frontend = inventory.frontend.operationalPanel;
    
    if (frontend.cognito) {
      const cognito = frontend.cognito;
      
      // Verificar se URLs de redirect diferenciam ambientes
      if (cognito.redirectUri && !cognito.redirectUri.includes('localhost')) {
        const hasEnvInUrl = 
          cognito.redirectUri.includes('dev') ||
          cognito.redirectUri.includes('prod') ||
          cognito.redirectUri.includes('staging');

        if (!hasEnvInUrl) {
          warnings.push(
            'URL de redirect do Cognito não indica claramente o ambiente'
          );
        }
      }
    }
  }
}

/**
 * Valida completude de migrations
 * Property 5: Para qualquer migration listada, deve haver correspondência
 * entre o arquivo SQL e a entrada na documentação.
 */
export function validateMigrationCompleteness(
  migrations: MigrationInfo[],
  workspaceRoot: string,
  errors: string[],
  warnings: string[]
): void {
  const migrationsPath = path.join(workspaceRoot, 'database', 'migrations');

  if (!fs.existsSync(migrationsPath)) {
    errors.push(`Diretório de migrations não encontrado: ${migrationsPath}`);
    return;
  }

  // Verificar cada migration documentada
  for (const migration of migrations) {
    const sqlPath = path.join(migrationsPath, migration.filename);
    
    if (!fs.existsSync(sqlPath)) {
      errors.push(
        `Migration ${migration.number} documentada mas arquivo não encontrado: ${migration.filename}`
      );
    }

    // Verificar se tem resumo
    if (!migration.summary || migration.summary.trim() === '') {
      warnings.push(`Migration ${migration.number} não tem resumo`);
    }

    // Verificar se migrations recentes têm README
    const migrationNum = parseInt(migration.number);
    if (migrationNum >= 7) {
      const readmePath = path.join(migrationsPath, `README-${migration.number}.md`);
      if (!fs.existsSync(readmePath)) {
        warnings.push(
          `Migration ${migration.number} não possui README correspondente (esperado para migrations >= 007)`
        );
      }
    }
  }

  // Verificar se há arquivos SQL não documentados
  const sqlFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql') && !file.startsWith('_ARCHIVE_'));

  for (const sqlFile of sqlFiles) {
    const documented = migrations.some(m => m.filename === sqlFile);
    
    if (!documented) {
      warnings.push(`Arquivo SQL não documentado: ${sqlFile}`);
    }
  }
}

/**
 * Valida consistência de variáveis de ambiente
 */
export function validateEnvironmentVariables(
  inventory: SystemInventory,
  errors: string[],
  warnings: string[]
): void {
  const variables = inventory.environment.variables;

  for (const variable of variables) {
    // Validar campos obrigatórios
    if (!variable.name || variable.name.trim() === '') {
      errors.push('Variável de ambiente sem nome encontrada');
      continue;
    }

    if (!variable.usedIn || variable.usedIn.length === 0) {
      warnings.push(`Variável ${variable.name}: campo 'usedIn' vazio`);
    }

    if (!variable.storedIn || variable.storedIn.length === 0) {
      warnings.push(`Variável ${variable.name}: campo 'storedIn' vazio`);
    }

    if (!variable.description || variable.description.trim() === '') {
      warnings.push(`Variável ${variable.name}: sem descrição`);
    }
  }
}

/**
 * Valida estrutura de gaps e riscos
 */
export function validateGapsAndRisks(
  inventory: SystemInventory,
  errors: string[],
  warnings: string[]
): void {
  // Validar gaps
  for (const gap of inventory.gaps.known) {
    if (!gap.description || gap.description.trim() === '') {
      errors.push('Gap sem descrição encontrado');
    }

    if (!gap.reference || gap.reference.trim() === '') {
      warnings.push(`Gap "${gap.description}": sem referência de arquivo/linha`);
    }

    if (!gap.severity || !['low', 'medium', 'high'].includes(gap.severity)) {
      warnings.push(`Gap "${gap.description}": severidade inválida ou ausente`);
    }
  }

  // Validar riscos
  for (const risk of inventory.gaps.risks) {
    if (!risk.description || risk.description.trim() === '') {
      errors.push('Risco sem descrição encontrado');
    }

    if (!risk.impact || risk.impact.trim() === '') {
      warnings.push(`Risco "${risk.description}": sem descrição de impacto`);
    }
  }
}

/**
 * Gera relatório de validação em formato legível
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('# Relatório de Validação do Inventário');
  lines.push('');
  lines.push(`Status: ${result.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('## Erros');
    lines.push('');
    for (const error of result.errors) {
      lines.push(`- ❌ ${error}`);
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('## Avisos');
    lines.push('');
    for (const warning of result.warnings) {
      lines.push(`- ⚠️  ${warning}`);
    }
    lines.push('');
  }

  if (result.valid && result.warnings.length === 0) {
    lines.push('✅ Nenhum erro ou aviso encontrado.');
    lines.push('');
  }

  lines.push('---');
  lines.push(`Gerado em: ${new Date().toISOString()}`);

  return lines.join('\n');
}
