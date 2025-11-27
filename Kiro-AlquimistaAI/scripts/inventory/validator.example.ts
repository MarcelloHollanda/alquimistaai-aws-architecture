/**
 * Exemplo de Uso do Validador de Consistência
 * 
 * Este arquivo demonstra como usar o validador em diferentes cenários.
 */

import {
  validateInventory,
  validateStackCompleteness,
  validateIdentifierUniqueness,
  validateCrossReferences,
  validateEnvironmentDifferentiation,
  validateMigrationCompleteness,
  generateValidationReport
} from './validator';
import { SystemInventory } from './types';

// ============================================================================
// EXEMPLO 1: Validação Completa
// ============================================================================

export function example1_fullValidation() {
  console.log('=== Exemplo 1: Validação Completa ===\n');

  // Criar um inventário de exemplo
  const inventory: SystemInventory = {
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'example-script',
      version: '1.0.0'
    },
    infrastructure: {
      region: 'us-east-1',
      stacks: [
        {
          name: 'FibonacciStack',
          description: 'Stack principal do Fibonacci',
          environment: 'dev',
          resources: {
            apis: [
              {
                logicalName: 'FibonacciApi',
                type: 'HTTP',
                name: 'fibonacci-api-dev',
                routes: ['/health', '/leads', '/agents'],
                id: 'abc123',
                baseUrl: 'https://api-dev.alquimista.ai'
              }
            ],
            lambdas: [
              {
                logicalName: 'HealthCheckHandler',
                functionName: 'fibonacci-health-dev',
                file: 'lambda/fibonacci/health.ts',
                purpose: 'Health check endpoint',
                runtime: 'nodejs20.x',
                routes: ['/health']
              }
            ],
            databases: [],
            storage: [],
            security: []
          }
        }
      ]
    },
    database: {
      engine: 'aurora-postgresql',
      mode: 'Serverless v2',
      region: 'us-east-1',
      schemas: ['alquimista_platform', 'fibonacci_core'],
      migrations: [
        {
          number: '001',
          filename: '001_initial_schema.sql',
          summary: 'Schema inicial do sistema',
          status: 'applied'
        }
      ],
      decisions: ['Uso de Aurora Serverless v2 para escalabilidade']
    },
    backends: {
      fibonacci: {
        name: 'Fibonacci',
        purpose: 'Orquestrador principal',
        apiGateway: {
          dev: {
            logicalName: 'FibonacciApi',
            type: 'HTTP',
            name: 'fibonacci-api-dev',
            routes: ['/health'],
            baseUrl: 'https://api-dev.alquimista.ai'
          }
        },
        handlers: [],
        integrations: []
      },
      nigredo: {
        name: 'Nigredo',
        purpose: 'Núcleo de prospecção',
        apiGateway: {},
        handlers: [],
        integrations: ['Fibonacci']
      },
      operationalDashboard: {
        name: 'Painel Operacional',
        purpose: 'Dashboard interno',
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
          userPoolId: 'us-east-1_ABC123',
          clientId: 'client123',
          region: 'us-east-1',
          hostedUiDomain: 'alquimista-dev.auth.us-east-1.amazoncognito.com',
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
        name: 'alquimista-dev',
        region: 'us-east-1',
        id: 'us-east-1_ABC123',
        clientIds: ['client123'],
        hostedUiDomain: 'alquimista-dev.auth.us-east-1.amazoncognito.com'
      },
      groups: [
        { name: 'INTERNAL_ADMIN', role: 'Administrador interno' },
        { name: 'TENANT_ADMIN', role: 'Administrador de tenant' }
      ],
      users: []
    },
    cicd: {
      workflow: {
        file: '.github/workflows/ci-cd-alquimistaai.yml',
        exists: true,
        triggers: ['push', 'pull_request'],
        jobs: []
      },
      oidc: {
        configured: true,
        role: 'GitHubActionsRole',
        provider: 'GitHub'
      },
      scripts: [],
      tests: []
    },
    guardrails: {
      security: {
        cloudTrail: {
          enabled: true,
          trailName: 'alquimista-trail',
          bucketName: 'alquimista-cloudtrail-logs',
          region: 'us-east-1',
          retentionDays: 90,
          logFileValidation: true,
          multiRegion: false
        },
        guardDuty: {
          enabled: true,
          detectorId: 'detector123',
          region: 'us-east-1',
          findingPublishingFrequency: 'FIFTEEN_MINUTES',
          s3Protection: true,
          malwareProtection: true
        },
        waf: {
          enabled: true,
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

  // Executar validação
  const result = validateInventory(inventory, process.cwd());

  // Exibir resultado
  console.log(`Status: ${result.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(`Erros: ${result.errors.length}`);
  console.log(`Avisos: ${result.warnings.length}`);
  console.log();

  if (result.errors.length > 0) {
    console.log('Erros encontrados:');
    result.errors.forEach(error => console.log(`  ❌ ${error}`));
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log('Avisos encontrados:');
    result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    console.log();
  }

  // Gerar relatório
  const report = generateValidationReport(result);
  console.log('Relatório gerado:');
  console.log(report);
}

// ============================================================================
// EXEMPLO 2: Validação Incremental
// ============================================================================

export function example2_incrementalValidation() {
  console.log('=== Exemplo 2: Validação Incremental ===\n');

  const inventory = createMinimalInventory();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar apenas stacks
  console.log('Validando completude de stacks...');
  validateStackCompleteness(inventory, errors, warnings);
  console.log(`  Erros: ${errors.length}, Avisos: ${warnings.length}`);

  // Validar apenas unicidade
  console.log('Validando unicidade de identificadores...');
  validateIdentifierUniqueness(inventory, errors, warnings);
  console.log(`  Erros: ${errors.length}, Avisos: ${warnings.length}`);

  // Validar apenas ambientes
  console.log('Validando diferenciação de ambientes...');
  validateEnvironmentDifferentiation(inventory, errors, warnings);
  console.log(`  Erros: ${errors.length}, Avisos: ${warnings.length}`);

  console.log();
  console.log(`Total: ${errors.length} erros, ${warnings.length} avisos`);
}

// ============================================================================
// EXEMPLO 3: Validação com Tratamento de Erros
// ============================================================================

export function example3_errorHandling() {
  console.log('=== Exemplo 3: Validação com Tratamento de Erros ===\n');

  const inventory = createMinimalInventory();

  try {
    const result = validateInventory(inventory, process.cwd());

    if (!result.valid) {
      throw new Error(
        `Validação falhou com ${result.errors.length} erro(s):\n` +
        result.errors.map(e => `  - ${e}`).join('\n')
      );
    }

    console.log('✅ Validação passou!');

    if (result.warnings.length > 0) {
      console.warn(`⚠️  ${result.warnings.length} aviso(s) encontrado(s):`);
      result.warnings.forEach(w => console.warn(`  - ${w}`));
    }

    // Continuar com geração de documentos
    console.log('\nProsseguindo com geração de documentos...');

  } catch (error) {
    console.error('❌ Erro na validação:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// ============================================================================
// EXEMPLO 4: Validação de Migrations
// ============================================================================

export function example4_migrationValidation() {
  console.log('=== Exemplo 4: Validação de Migrations ===\n');

  const migrations = [
    {
      number: '001',
      filename: '001_initial_schema.sql',
      summary: 'Schema inicial',
      status: 'applied' as const
    },
    {
      number: '002',
      filename: '002_add_tenants.sql',
      summary: 'Adiciona tabela de tenants',
      status: 'applied' as const
    },
    {
      number: '003',
      filename: '003_add_users.sql',
      summary: '', // Sem resumo - deve gerar aviso
      status: 'applied' as const
    }
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  validateMigrationCompleteness(migrations, process.cwd(), errors, warnings);

  console.log(`Migrations validadas: ${migrations.length}`);
  console.log(`Erros: ${errors.length}`);
  console.log(`Avisos: ${warnings.length}`);
  console.log();

  if (warnings.length > 0) {
    console.log('Avisos:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }
}

// ============================================================================
// EXEMPLO 5: Validação de Referências Cruzadas
// ============================================================================

export function example5_crossReferences() {
  console.log('=== Exemplo 5: Validação de Referências Cruzadas ===\n');

  const inventory = createMinimalInventory();

  // Adicionar algumas referências
  inventory.cicd.workflow.file = 'package.json'; // Existe
  inventory.cicd.scripts = [
    {
      name: 'deploy',
      path: 'scripts/deploy.ps1', // Pode não existir
      description: 'Script de deploy',
      type: 'deploy'
    }
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  validateCrossReferences(inventory, process.cwd(), errors, warnings);

  console.log('Referências validadas');
  console.log(`Erros: ${errors.length}`);
  console.log(`Avisos: ${warnings.length}`);
  console.log();

  if (errors.length > 0) {
    console.log('Arquivos não encontrados:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
  }
}

// ============================================================================
// HELPER: Criar inventário mínimo
// ============================================================================

function createMinimalInventory(): SystemInventory {
  return {
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'example',
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
          userPoolId: 'test',
          clientId: 'test',
          region: 'us-east-1',
          hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com',
          redirectUri: 'http://localhost:3000',
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
      commercialSites: { type: 'S3+CloudFront' }
    },
    authentication: {
      userPool: {
        name: 'test',
        region: 'us-east-1',
        id: 'test',
        clientIds: [],
        hostedUiDomain: 'test.auth.us-east-1.amazoncognito.com'
      },
      groups: [],
      users: []
    },
    cicd: {
      workflow: {
        file: '',
        exists: false,
        triggers: [],
        jobs: []
      },
      oidc: { configured: false, role: null, provider: null },
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
        waf: { enabled: false, webAcls: [], ipSets: [], logGroups: [] },
        snsTopics: []
      },
      cost: { budgets: [], anomalyDetection: null, snsTopics: [] },
      observability: { dashboards: [] }
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

// ============================================================================
// EXECUTAR EXEMPLOS
// ============================================================================

if (require.main === module) {
  console.log('Exemplos de Uso do Validador\n');
  console.log('='.repeat(60));
  console.log();

  example1_fullValidation();
  console.log('\n' + '='.repeat(60) + '\n');

  example2_incrementalValidation();
  console.log('\n' + '='.repeat(60) + '\n');

  example3_errorHandling();
  console.log('\n' + '='.repeat(60) + '\n');

  example4_migrationValidation();
  console.log('\n' + '='.repeat(60) + '\n');

  example5_crossReferences();
}
