/**
 * Testes de Propriedade para o Validador de Consistência
 * 
 * Feature: system-inventory-documentation
 * Properties: 1, 3, 4, 6
 * Valida: Requirements 1.1, 1.2, 1.5, 3.1, 9.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateInventory,
  validateStackCompleteness,
  validateIdentifierUniqueness,
  validateCrossReferences,
  validateEnvironmentDifferentiation,
  validateMigrationCompleteness
} from '../../../scripts/inventory/validator';
import {
  SystemInventory,
  StackInfo,
  ApiGatewayInfo,
  LambdaInfo,
  MigrationInfo,
  Environment
} from '../../../scripts/inventory/types';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// GERADORES PARA PROPERTY-BASED TESTING
// ============================================================================

/**
 * Gerador de ambientes válidos
 */
const environmentArb = fc.constantFrom<Environment>('dev', 'prod', 'both');

/**
 * Gerador de nomes de stack válidos
 */
const stackNameArb = fc.oneof(
  fc.constant('FibonacciStack'),
  fc.constant('NigredonStack'),
  fc.constant('AlquimistaStack'),
  fc.constant('SecurityStack'),
  fc.constant('WAFStack'),
  fc.constant('FrontendStack')
);

/**
 * Gerador de API Gateway válida
 */
const apiGatewayArb = fc.record({
  logicalName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  type: fc.constantFrom<'HTTP' | 'REST'>('HTTP', 'REST'),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  routes: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
  id: fc.option(fc.string({ minLength: 10, maxLength: 20 }), { nil: undefined }),
  baseUrl: fc.option(fc.webUrl(), { nil: undefined })
});

/**
 * Gerador de Lambda válida
 */
const lambdaArb = fc.record({
  logicalName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  functionName: fc.string({ minLength: 1, maxLength: 50 }),
  file: fc.string({ minLength: 1, maxLength: 100 }),
  purpose: fc.string({ maxLength: 200 }),
  runtime: fc.constant('nodejs20.x'),
  routes: fc.array(fc.string(), { maxLength: 5 })
});

/**
 * Gerador de Stack válida
 */
const stackArb = fc.record({
  name: stackNameArb,
  description: fc.string({ maxLength: 200 }),
  environment: environmentArb,
  resources: fc.record({
    apis: fc.array(apiGatewayArb, { maxLength: 3 }),
    lambdas: fc.array(lambdaArb, { maxLength: 5 }),
    databases: fc.constant([]),
    storage: fc.constant([]),
    security: fc.constant([])
  })
});

/**
 * Gerador de Migration válida
 */
const migrationArb = fc.record({
  number: fc.integer({ min: 1, max: 20 }).map(n => n.toString().padStart(3, '0')),
  filename: fc.integer({ min: 1, max: 20 }).map(n => `${n.toString().padStart(3, '0')}_migration.sql`),
  summary: fc.string({ minLength: 10, maxLength: 100 }),
  status: fc.constantFrom<'applied' | 'pending' | 'skip'>('applied', 'pending', 'skip')
});

/**
 * Gerador de inventário mínimo válido
 */
const minimalInventoryArb = fc.record({
  metadata: fc.record({
    generatedAt: fc.date(),
    generatedBy: fc.constant('test'),
    version: fc.constant('1.0.0')
  }),
  infrastructure: fc.record({
    region: fc.constant('us-east-1'),
    stacks: fc.array(stackArb, { minLength: 1, maxLength: 5 })
  }),
  database: fc.record({
    engine: fc.constant('aurora-postgresql'),
    mode: fc.constant('Serverless v2'),
    region: fc.constant('us-east-1'),
    schemas: fc.array(fc.string(), { maxLength: 5 }),
    migrations: fc.array(migrationArb, { maxLength: 10 }),
    decisions: fc.array(fc.string(), { maxLength: 5 })
  }),
  backends: fc.constant({
    fibonacci: { name: 'Fibonacci', purpose: 'Test', apiGateway: {}, handlers: [], integrations: [] },
    nigredo: { name: 'Nigredo', purpose: 'Test', apiGateway: {}, handlers: [], integrations: [] },
    operationalDashboard: { name: 'Dashboard', purpose: 'Test', apiGateway: {}, handlers: [], integrations: [] }
  }),
  frontend: fc.constant({
    operationalPanel: {
      framework: 'Next.js',
      location: 'frontend',
      routes: [],
      cognito: {
        userPoolId: 'test-pool',
        clientId: 'test-client',
        region: 'us-east-1',
        hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com',
        redirectUri: 'http://localhost:3000/auth/callback',
        logoutUri: 'http://localhost:3000',
        authFlow: 'code',
        groups: [],
        middlewareProtection: true,
        files: []
      },
      apiClients: [],
      tests: {
        unit: { total: 0, passing: 0, status: 'não executado' as const },
        integration: { total: 0, passing: 0, status: 'não executado' as const },
        e2e: { total: 0, passing: 0, status: 'não executado' as const },
        security: { total: 0, passing: 0, status: 'não executado' as const }
      }
    },
    commercialSites: { type: 'S3+CloudFront' as const }
  }),
  authentication: fc.constant({
    userPool: {
      name: 'test-pool',
      region: 'us-east-1',
      id: 'us-east-1_TEST',
      clientIds: ['test-client'],
      hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
    },
    groups: [],
    users: []
  }),
  cicd: fc.constant({
    workflow: {
      file: '.github/workflows/ci-cd.yml',
      exists: true,
      triggers: [],
      jobs: []
    },
    oidc: { configured: false, role: null, provider: null },
    scripts: [],
    tests: []
  }),
  guardrails: fc.constant({
    security: {
      cloudTrail: {
        enabled: false,
        trailName: '',
        bucketName: '',
        region: 'us-east-1',
        retentionDays: 0,
        logFileValidation: false,
        multiRegion: false
      },
      guardDuty: {
        enabled: false,
        detectorId: '',
        region: 'us-east-1',
        findingPublishingFrequency: '',
        s3Protection: false,
        malwareProtection: false
      },
      waf: { enabled: false, webAcls: [], ipSets: [], logGroups: [] },
      snsTopics: []
    },
    cost: { budgets: [], anomalyDetection: null, snsTopics: [] },
    observability: { dashboards: [] }
  }),
  environment: fc.constant({
    variables: [],
    integrations: []
  }),
  gaps: fc.constant({
    known: [],
    risks: [],
    nextSteps: []
  })
});

// ============================================================================
// PROPERTY 1: COMPLETUDE DE STACKS
// ============================================================================

describe('Property 1: Completude de Stacks', () => {
  it('**Feature: system-inventory-documentation, Property 1: Completude de Stacks**', () => {
    fc.assert(
      fc.property(minimalInventoryArb, (inventory) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        validateStackCompleteness(inventory, errors, warnings);

        // Para qualquer stack no inventário, se ela tem nome e ambiente,
        // não deve haver erro de completude básica
        for (const stack of inventory.infrastructure.stacks) {
          if (stack.name && stack.name.trim() !== '' && stack.environment) {
            // Não deve haver erro sobre nome ou ambiente ausente para esta stack
            const hasNameError = errors.some(e => 
              e.includes(stack.name) && e.includes('sem nome')
            );
            const hasEnvError = errors.some(e => 
              e.includes(stack.name) && e.includes('ambiente não especificado')
            );

            expect(hasNameError).toBe(false);
            expect(hasEnvError).toBe(false);
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('deve detectar stacks sem nome', () => {
    const inventory = createTestInventory();
    inventory.infrastructure.stacks.push({
      name: '',
      description: 'Test',
      environment: 'dev',
      resources: { apis: [], lambdas: [], databases: [], storage: [], security: [] }
    });

    const errors: string[] = [];
    const warnings: string[] = [];
    validateStackCompleteness(inventory, errors, warnings);

    expect(errors.some(e => e.includes('sem nome'))).toBe(true);
  });

  it('deve detectar stacks sem ambiente', () => {
    const inventory = createTestInventory();
    inventory.infrastructure.stacks.push({
      name: 'TestStack',
      description: 'Test',
      environment: '' as any,
      resources: { apis: [], lambdas: [], databases: [], storage: [], security: [] }
    });

    const errors: string[] = [];
    const warnings: string[] = [];
    validateStackCompleteness(inventory, errors, warnings);

    expect(errors.some(e => e.includes('ambiente não especificado'))).toBe(true);
  });
});

// ============================================================================
// PROPERTY 3: CONSISTÊNCIA DE REFERÊNCIAS
// ============================================================================

describe('Property 3: Consistência de Referências', () => {
  it('**Feature: system-inventory-documentation, Property 3: Consistência de Referências**', () => {
    // Para qualquer arquivo referenciado que existe, não deve haver erro
    const workspaceRoot = process.cwd();
    const inventory = createTestInventory();

    // Adicionar referência a arquivo que sabemos que existe
    inventory.cicd.workflow.file = 'package.json'; // Arquivo que sempre existe

    const errors: string[] = [];
    const warnings: string[] = [];

    validateCrossReferences(inventory, workspaceRoot, errors, warnings);

    // Não deve haver erro sobre package.json não encontrado
    const hasPackageJsonError = errors.some(e => 
      e.includes('package.json') && e.includes('não encontrado')
    );

    expect(hasPackageJsonError).toBe(false);
  });

  it('deve detectar arquivos referenciados que não existem', () => {
    const workspaceRoot = process.cwd();
    const inventory = createTestInventory();

    // Adicionar referência a arquivo que não existe
    inventory.cicd.workflow.file = 'arquivo-que-nao-existe-12345.yml';

    const errors: string[] = [];
    const warnings: string[] = [];

    validateCrossReferences(inventory, workspaceRoot, errors, warnings);

    expect(errors.some(e => e.includes('não encontrado'))).toBe(true);
  });
});

// ============================================================================
// PROPERTY 4: UNICIDADE DE IDENTIFICADORES
// ============================================================================

describe('Property 4: Unicidade de Identificadores', () => {
  it('**Feature: system-inventory-documentation, Property 4: Unicidade de Identificadores**', () => {
    fc.assert(
      fc.property(
        fc.array(stackArb, { minLength: 1, maxLength: 5 }),
        (stacks) => {
          // Garantir que todos os nomes são únicos por ambiente
          const uniqueStacks = stacks.filter((stack, index, self) => {
            return index === self.findIndex(s => 
              s.name === stack.name && s.environment === stack.environment
            );
          });

          const inventory = createTestInventory();
          inventory.infrastructure.stacks = uniqueStacks;

          const errors: string[] = [];
          const warnings: string[] = [];

          validateIdentifierUniqueness(inventory, errors, warnings);

          // Não deve haver erros de duplicação se todos são únicos
          const hasDuplicateError = errors.some(e => e.includes('duplicado'));

          return !hasDuplicateError;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve detectar nomes de stack duplicados no mesmo ambiente', () => {
    const inventory = createTestInventory();
    inventory.infrastructure.stacks = [
      {
        name: 'TestStack',
        description: 'First',
        environment: 'dev',
        resources: { apis: [], lambdas: [], databases: [], storage: [], security: [] }
      },
      {
        name: 'TestStack',
        description: 'Second',
        environment: 'dev',
        resources: { apis: [], lambdas: [], databases: [], storage: [], security: [] }
      }
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    validateIdentifierUniqueness(inventory, errors, warnings);

    expect(errors.some(e => e.includes('duplicado') && e.includes('TestStack'))).toBe(true);
  });

  it('deve permitir mesmo nome de stack em ambientes diferentes', () => {
    const inventory = createTestInventory();
    inventory.infrastructure.stacks = [
      {
        name: 'TestStack',
        description: 'Dev',
        environment: 'dev',
        resources: { apis: [], lambdas: [], databases: [], storage: [], security: [] }
      },
      {
        name: 'TestStack',
        description: 'Prod',
        environment: 'prod',
        resources: { apis: [], lambdas: [], databases: [], storage: [], security: [] }
      }
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    validateIdentifierUniqueness(inventory, errors, warnings);

    // Não deve haver erro de duplicação
    expect(errors.some(e => e.includes('duplicado'))).toBe(false);
  });
});

// ============================================================================
// PROPERTY 6: DIFERENCIAÇÃO DE AMBIENTES
// ============================================================================

describe('Property 6: Diferenciação de Ambientes', () => {
  it('**Feature: system-inventory-documentation, Property 6: Diferenciação de Ambientes**', () => {
    fc.assert(
      fc.property(
        fc.array(stackArb, { minLength: 2, maxLength: 4 }),
        (stacks) => {
          // Criar pares de stacks com mesmo nome base mas ambientes diferentes
          const devStack = { ...stacks[0], environment: 'dev' as Environment };
          const prodStack = { ...stacks[0], environment: 'prod' as Environment };

          const inventory = createTestInventory();
          inventory.infrastructure.stacks = [devStack, prodStack];

          const errors: string[] = [];
          const warnings: string[] = [];

          validateEnvironmentDifferentiation(inventory, errors, warnings);

          // Se ambos os ambientes estão presentes e diferenciados, não deve haver erro crítico
          const hasCriticalError = errors.some(e => 
            e.includes('ambiente') && e.includes('não especificado')
          );

          return !hasCriticalError;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve avisar quando API não tem baseUrl para diferenciação', () => {
    const inventory = createTestInventory();
    inventory.infrastructure.stacks = [
      {
        name: 'TestStack-dev',
        description: 'Dev',
        environment: 'dev',
        resources: {
          apis: [{
            logicalName: 'TestApi',
            type: 'HTTP',
            name: 'TestApi',
            routes: ['/test'],
            id: undefined,
            baseUrl: undefined // Sem baseUrl
          }],
          lambdas: [],
          databases: [],
          storage: [],
          security: []
        }
      },
      {
        name: 'TestStack-prod',
        description: 'Prod',
        environment: 'prod',
        resources: {
          apis: [{
            logicalName: 'TestApi',
            type: 'HTTP',
            name: 'TestApi',
            routes: ['/test'],
            id: undefined,
            baseUrl: undefined // Sem baseUrl
          }],
          lambdas: [],
          databases: [],
          storage: [],
          security: []
        }
      }
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    validateEnvironmentDifferentiation(inventory, errors, warnings);

    expect(warnings.some(w => w.includes('baseUrl'))).toBe(true);
  });
});

// ============================================================================
// PROPERTY 5: COMPLETUDE DE MIGRATIONS
// ============================================================================

describe('Property 5: Completude de Migrations', () => {
  it('**Feature: system-inventory-documentation, Property 5: Completude de Migrations**', () => {
    const workspaceRoot = process.cwd();
    
    fc.assert(
      fc.property(
        fc.array(migrationArb, { minLength: 1, maxLength: 10 }),
        (migrations) => {
          // Filtrar para garantir números únicos
          const uniqueMigrations = migrations.filter((m, index, self) => {
            return index === self.findIndex(x => x.number === m.number);
          });

          const errors: string[] = [];
          const warnings: string[] = [];

          validateMigrationCompleteness(uniqueMigrations, workspaceRoot, errors, warnings);

          // Para migrations com números únicos, não deve haver erro de duplicação
          const hasDuplicateError = errors.some(e => 
            e.includes('duplicado') && e.includes('migration')
          );

          return !hasDuplicateError;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve detectar migration sem resumo', () => {
    const migrations: MigrationInfo[] = [
      {
        number: '001',
        filename: '001_test.sql',
        summary: '', // Sem resumo
        status: 'applied'
      }
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    validateMigrationCompleteness(migrations, process.cwd(), errors, warnings);

    expect(warnings.some(w => w.includes('não tem resumo'))).toBe(true);
  });
});

// ============================================================================
// HELPERS
// ============================================================================

function createTestInventory(): SystemInventory {
  return {
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'test',
      version: '1.0.0'
    },
    infrastructure: {
      region: 'us-east-1',
      stacks: []
    },
    database: {
      engine: 'aurora-postgresql',
      mode: 'Serverless v2',
      region: 'us-east-1',
      schemas: [],
      migrations: [],
      decisions: []
    },
    backends: {
      fibonacci: {
        name: 'Fibonacci',
        purpose: 'Test',
        apiGateway: {},
        handlers: [],
        integrations: []
      },
      nigredo: {
        name: 'Nigredo',
        purpose: 'Test',
        apiGateway: {},
        handlers: [],
        integrations: []
      },
      operationalDashboard: {
        name: 'Dashboard',
        purpose: 'Test',
        apiGateway: {},
        handlers: [],
        integrations: []
      }
    },
    frontend: {
      operationalPanel: {
        framework: 'Next.js',
        location: 'frontend',
        routes: [],
        cognito: {
          userPoolId: 'test-pool',
          clientId: 'test-client',
          region: 'us-east-1',
          hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com',
          redirectUri: 'http://localhost:3000/auth/callback',
          logoutUri: 'http://localhost:3000',
          authFlow: 'code',
          groups: [],
          middlewareProtection: true,
          files: []
        },
        apiClients: [],
        tests: {
          unit: { total: 0, passing: 0, status: 'não executado' },
          integration: { total: 0, passing: 0, status: 'não executado' },
          e2e: { total: 0, passing: 0, status: 'não executado' },
          security: { total: 0, passing: 0, status: 'não executado' }
        }
      },
      commercialSites: {
        type: 'S3+CloudFront'
      }
    },
    authentication: {
      userPool: {
        name: 'test-pool',
        region: 'us-east-1',
        id: 'us-east-1_TEST',
        clientIds: ['test-client'],
        hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
      },
      groups: [],
      users: []
    },
    cicd: {
      workflow: {
        file: '.github/workflows/ci-cd.yml',
        exists: false,
        triggers: [],
        jobs: []
      },
      oidc: {
        configured: false,
        role: null,
        provider: null
      },
      scripts: [],
      tests: []
    },
    guardrails: {
      security: {
        cloudTrail: {
          enabled: false,
          trailName: '',
          bucketName: '',
          region: 'us-east-1',
          retentionDays: 0,
          logFileValidation: false,
          multiRegion: false
        },
        guardDuty: {
          enabled: false,
          detectorId: '',
          region: 'us-east-1',
          findingPublishingFrequency: '',
          s3Protection: false,
          malwareProtection: false
        },
        waf: {
          enabled: false,
          webAcls: [],
          ipSets: [],
          logGroups: []
        },
        snsTopics: []
      },
      cost: {
        budgets: [],
        anomalyDetection: null,
        snsTopics: []
      },
      observability: {
        dashboards: []
      }
    },
    environment: {
      variables: [],
      integrations: []
    },
    gaps: {
      known: [],
      risks: [],
      nextSteps: []
    }
  };
}
