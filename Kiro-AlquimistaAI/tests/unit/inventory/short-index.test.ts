/**
 * Testes de Propriedade para Índice Compacto
 * Feature: system-inventory-documentation, Property 9: Índice Compacto Sincronizado
 * Valida: Requirements 10.2, 10.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateMainDocument, generateShortIndex } from '../../../scripts/inventory/generator';
import { SystemInventory } from '../../../scripts/inventory/types';

/**
 * Cria um inventário de teste válido
 */
function createTestInventory(): SystemInventory {
  return {
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'test-runner',
      version: '1.0.0'
    },
    infrastructure: {
      region: 'us-east-1',
      stacks: [
        {
          name: 'TestStack',
          environment: 'dev',
          resources: {
            apis: [
              {
                logicalName: 'TestApi',
                type: 'HTTP',
                id: 'test-api-id',
                baseUrl: 'https://test.api.com',
                routes: ['/health', '/test']
              }
            ],
            lambdas: [
              {
                logicalName: 'TestLambda',
                runtime: 'nodejs20.x',
                purpose: 'Test handler',
                memorySize: 256,
                timeout: 30
              }
            ],
            databases: [
              {
                name: 'TestDB',
                type: 'Aurora',
                engine: 'PostgreSQL',
                mode: 'Serverless v2'
              }
            ],
            storage: [
              {
                name: 'TestBucket',
                type: 'S3',
                purpose: 'Test storage'
              }
            ],
            security: [
              {
                name: 'TestWAF',
                type: 'WAF',
                description: 'Test firewall'
              }
            ]
          }
        }
      ]
    },
    database: {
      engine: 'PostgreSQL',
      mode: 'Serverless v2',
      region: 'us-east-1',
      schemas: ['test_schema'],
      migrations: [
        {
          number: '001',
          filename: '001_test.sql',
          summary: 'Test migration',
          status: 'applied'
        }
      ],
      decisions: ['Test decision']
    },
    backends: {
      fibonacci: {
        name: 'Fibonacci',
        purpose: 'Test Fibonacci',
        apiGateway: {
          dev: {
            logicalName: 'FibonacciApiDev',
            type: 'HTTP',
            id: 'fib-dev-id',
            baseUrl: 'https://fib-dev.api.com',
            routes: ['/health']
          }
        },
        handlers: [
          {
            logicalName: 'FibHandler',
            file: 'handler.ts',
            purpose: 'Test handler',
            routes: ['/test']
          }
        ],
        integrations: ['Aurora']
      },
      nigredo: {
        name: 'Nigredo',
        purpose: 'Test Nigredo',
        apiGateway: {
          dev: {
            logicalName: 'NigredoApiDev',
            type: 'HTTP',
            id: 'nig-dev-id',
            baseUrl: 'https://nig-dev.api.com',
            routes: ['/health']
          }
        },
        handlers: [],
        integrations: []
      },
      operationalDashboard: {
        name: 'Dashboard',
        purpose: 'Test Dashboard',
        apiGateway: {
          dev: {
            logicalName: 'DashApiDev',
            type: 'HTTP',
            id: 'dash-dev-id',
            baseUrl: 'https://dash-dev.api.com',
            routes: ['/health']
          }
        },
        handlers: [],
        integrations: []
      }
    },
    frontend: {
      operationalPanel: {
        framework: 'Next.js',
        location: 'frontend/',
        routes: [
          { path: '/dashboard', type: 'dashboard' }
        ],
        cognito: {
          userPoolId: 'test-pool-id',
          clientId: 'test-client-id',
          region: 'us-east-1',
          hostedUiDomain: 'https://test.auth.com',
          redirectUri: 'https://test.com/callback',
          logoutUri: 'https://test.com/logout',
          authFlow: 'code',
          middlewareProtection: true
        },
        apiClients: [
          {
            name: 'TestClient',
            file: 'test-client.ts',
            baseUrlSource: 'NEXT_PUBLIC_API_URL'
          }
        ],
        tests: {
          unit: { total: 10, passing: 10, status: 'passing' },
          integration: { total: 5, passing: 5, status: 'passing' },
          e2e: { total: 3, passing: 3, status: 'passing' },
          security: { total: 2, passing: 2, status: 'passing' }
        }
      },
      commercialSites: {
        type: 'S3 + CloudFront',
        bucket: 'test-bucket',
        distributionId: 'test-dist-id',
        domain: 'test.com'
      }
    },
    authentication: {
      userPool: {
        name: 'TestPool',
        region: 'us-east-1',
        id: 'test-pool-id',
        clientIds: ['test-client-id'],
        hostedUiDomain: 'https://test.auth.com'
      },
      groups: [
        {
          name: 'INTERNAL_ADMIN',
          role: 'Administrator'
        }
      ],
      users: [
        {
          email: 'test@example.com',
          groups: ['INTERNAL_ADMIN']
        }
      ]
    },
    cicd: {
      workflow: {
        exists: true,
        file: '.github/workflows/test.yml',
        name: 'Test Workflow',
        triggers: ['push'],
        jobs: [
          {
            id: 'test',
            name: 'Test Job',
            runsOn: 'ubuntu-latest',
            environment: 'dev',
            needs: [],
            steps: 5
          }
        ]
      },
      oidc: {
        configured: true,
        role: 'TestRole',
        provider: 'GitHub'
      },
      scripts: [
        {
          path: 'scripts/test.ps1',
          type: 'validation',
          description: 'Test script'
        }
      ],
      tests: [
        {
          path: 'docs/test.md',
          title: 'Test Doc',
          type: 'validation'
        }
      ]
    },
    guardrails: {
      security: {
        cloudTrail: {
          enabled: true,
          trailName: 'TestTrail',
          bucketName: 'test-trail-bucket',
          region: 'us-east-1',
          retentionDays: 90,
          logFileValidation: true,
          multiRegion: true
        },
        guardDuty: {
          enabled: true,
          detectorId: 'test-detector',
          region: 'us-east-1',
          findingPublishingFrequency: 'FIFTEEN_MINUTES',
          s3Protection: true,
          malwareProtection: true
        },
        waf: {
          enabled: true,
          webAcls: [
            {
              name: 'TestWAF',
              scope: 'REGIONAL',
              environment: 'dev',
              defaultAction: 'ALLOW',
              description: 'Test WAF',
              rules: ['RateLimit']
            }
          ],
          logGroups: [
            {
              name: 'test-waf-logs',
              environment: 'dev',
              retentionDays: 30
            }
          ]
        },
        snsTopics: [
          {
            name: 'test-topic',
            displayName: 'Test Topic',
            purpose: 'Test notifications',
            subscriptions: ['email']
          }
        ]
      },
      cost: {
        budgets: [
          {
            name: 'TestBudget',
            budgetType: 'COST',
            timeUnit: 'MONTHLY',
            amount: 100,
            currency: 'USD',
            thresholds: [80, 100],
            notificationTypes: ['ACTUAL']
          }
        ],
        anomalyDetection: {
          monitorName: 'TestMonitor',
          monitorType: 'DIMENSIONAL',
          dimension: 'SERVICE',
          threshold: 10,
          frequency: 'DAILY'
        }
      },
      observability: {
        dashboards: [
          {
            name: 'TestDashboard',
            purpose: 'Test monitoring',
            widgets: ['Metric1', 'Metric2']
          }
        ]
      }
    },
    environment: {
      variables: [
        {
          name: 'TEST_VAR',
          usedIn: ['frontend'],
          storedIn: ['.env.local'],
          description: 'Test variable'
        }
      ],
      integrations: [
        {
          name: 'TestIntegration',
          type: 'API',
          files: ['test.ts'],
          variables: ['TEST_VAR']
        }
      ]
    },
    gaps: {
      known: [
        {
          description: 'Test gap',
          reference: 'test.ts:10',
          severity: 'low'
        }
      ],
      risks: [
        {
          description: 'Test risk',
          impact: 'Low impact',
          mitigation: 'Test mitigation'
        }
      ],
      nextSteps: ['Test next step']
    }
  };
}

describe('Índice Compacto - Testes de Propriedade', () => {
  /**
   * Property 9: Índice Compacto Sincronizado
   * Para qualquer identificador-chave no índice compacto, deve haver correspondência 
   * com informação detalhada no documento principal.
   * 
   * Valida: Requirements 10.2, 10.3
   */
  it('deve conter todos os identificadores-chave presentes no documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar que o índice compacto contém seção de identificadores
          expect(shortIndex).toContain('## Identificadores-Chave');
          
          // Verificar região AWS
          if (mainDoc.includes('us-east-1')) {
            expect(shortIndex).toContain('us-east-1');
          }
          
          // Verificar Aurora
          if (mainDoc.includes('Aurora')) {
            expect(shortIndex).toContain('Aurora');
          }
          
          // Verificar User Pool Cognito
          const userPoolMatch = mainDoc.match(/User Pool ID:\s*([^\s\n]+)/);
          if (userPoolMatch && userPoolMatch[1]) {
            expect(shortIndex).toContain(userPoolMatch[1]);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve incluir todos os IDs de API Gateway do documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar que os IDs de API dos backends estão no índice compacto
          // O índice compacto lista apenas os IDs das APIs dos backends principais
          const backends = [
            inventory.backends.fibonacci,
            inventory.backends.nigredo,
            inventory.backends.operationalDashboard
          ];
          
          for (const backend of backends) {
            if (backend.apiGateway.dev?.id) {
              expect(shortIndex).toContain(backend.apiGateway.dev.id);
            }
            if (backend.apiGateway.prod?.id) {
              expect(shortIndex).toContain(backend.apiGateway.prod.id);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve listar todas as stacks CDK do documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar que todas as stacks estão listadas
          for (const stack of inventory.infrastructure.stacks) {
            if (mainDoc.includes(stack.name)) {
              expect(shortIndex).toContain(stack.name);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve incluir informações de backends do documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar seção de backends
          expect(shortIndex).toContain('## Backends');
          
          // Verificar que os backends principais estão mencionados
          if (mainDoc.includes('Fibonacci')) {
            expect(shortIndex).toContain('Fibonacci');
          }
          
          if (mainDoc.includes('Nigredo')) {
            expect(shortIndex).toContain('Nigredo');
          }
          
          if (mainDoc.includes('Painel Operacional') || mainDoc.includes('Dashboard')) {
            expect(shortIndex).toMatch(/Painel Operacional|Dashboard/);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve incluir informações de frontend do documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar seção de frontends
          expect(shortIndex).toContain('## Frontends');
          
          // Verificar framework
          if (mainDoc.includes('Next.js')) {
            expect(shortIndex).toContain('Next.js');
          }
          
          // Verificar número de rotas
          const routeCount = inventory.frontend.operationalPanel.routes.length;
          if (mainDoc.includes(`${routeCount}`)) {
            expect(shortIndex).toContain(`${routeCount}`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve incluir informações de CI/CD do documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar seção de CI/CD
          expect(shortIndex).toContain('## CI/CD');
          
          // Verificar GitHub Actions
          if (mainDoc.includes('GitHub Actions')) {
            expect(shortIndex).toContain('GitHub Actions');
          }
          
          // Verificar OIDC
          if (inventory.cicd.oidc.configured && mainDoc.includes('OIDC')) {
            expect(shortIndex).toContain('OIDC');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve incluir informações de segurança do documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar seção de segurança
          expect(shortIndex).toContain('## Segurança');
          
          // Verificar CloudTrail
          if (inventory.guardrails.security.cloudTrail.enabled && mainDoc.includes('CloudTrail')) {
            expect(shortIndex).toContain('CloudTrail');
          }
          
          // Verificar GuardDuty
          if (inventory.guardrails.security.guardDuty.enabled && mainDoc.includes('GuardDuty')) {
            expect(shortIndex).toContain('GuardDuty');
          }
          
          // Verificar WAF
          if (inventory.guardrails.security.waf.enabled && mainDoc.includes('WAF')) {
            expect(shortIndex).toContain('WAF');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve listar variáveis de ambiente sem valores', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar seção de variáveis
          expect(shortIndex).toContain('## Variáveis-Chave');
          
          // Verificar que há aviso sobre valores não incluídos
          expect(shortIndex).toMatch(/Valores não incluídos|sem valores/i);
          
          // Verificar que variáveis estão listadas
          for (const envVar of inventory.environment.variables.slice(0, 5)) {
            expect(shortIndex).toContain(envVar.name);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve ser significativamente mais curto que o documento principal', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // O índice compacto deve ter no máximo 30% do tamanho do documento principal
          const maxSize = mainDoc.length * 0.3;
          expect(shortIndex.length).toBeLessThan(maxSize);
          
          // Mas não deve ser vazio
          expect(shortIndex.length).toBeGreaterThan(100);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve ter estrutura otimizada para parsing por IA', () => {
    fc.assert(
      fc.property(
        fc.constant(createTestInventory()),
        (inventory) => {
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar que tem cabeçalho indicando otimização para IA
          expect(shortIndex).toMatch(/otimizado para.*IA|parsing por IA/i);
          
          // Verificar que tem seções claramente delimitadas
          expect(shortIndex).toContain('## Identificadores-Chave');
          expect(shortIndex).toContain('## Backends');
          expect(shortIndex).toContain('## Frontends');
          expect(shortIndex).toContain('## CI/CD');
          expect(shortIndex).toContain('## Segurança');
          expect(shortIndex).toContain('## Variáveis-Chave');
          
          // Verificar que usa formato de lista simples
          const lines = shortIndex.split('\n');
          const listLines = lines.filter(l => l.trim().startsWith('-'));
          expect(listLines.length).toBeGreaterThan(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deve manter sincronização quando inventário muda', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        (stackName, apiId) => {
          const inventory = createTestInventory();
          
          // Modificar inventário
          inventory.infrastructure.stacks[0].name = stackName;
          if (inventory.backends.fibonacci.apiGateway.dev) {
            inventory.backends.fibonacci.apiGateway.dev.id = apiId;
          }
          
          const mainDoc = generateMainDocument(inventory);
          const shortIndex = generateShortIndex(inventory);
          
          // Verificar que mudanças estão refletidas em ambos
          if (mainDoc.includes(stackName)) {
            expect(shortIndex).toContain(stackName);
          }
          
          if (mainDoc.includes(apiId)) {
            expect(shortIndex).toContain(apiId);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
