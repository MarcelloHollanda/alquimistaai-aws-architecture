/**
 * Testes de Integração - Gerador de Documentos
 * Feature: system-inventory-documentation
 * 
 * Testa a geração completa dos documentos de inventário
 */

import { describe, it, expect } from 'vitest';
import { generateMainDocument, generateShortIndex } from '../../../scripts/inventory/generator';
import { SystemInventory } from '../../../scripts/inventory/types';
import { containsSecrets } from '../../../scripts/inventory/sanitizer';

/**
 * Cria um inventário de exemplo para testes
 */
function createMockInventory(): SystemInventory {
  return {
    metadata: {
      generatedAt: new Date('2024-01-15T10:00:00Z'),
      generatedBy: 'test-runner',
      version: '1.0.0'
    },
    infrastructure: {
      region: 'us-east-1',
      stacks: [
        {
          name: 'AlquimistaStack-dev',
          environment: 'dev',
          resources: {
            apis: [
              {
                logicalName: 'FibonacciApi',
                type: 'HTTP',
                id: 'abc123',
                baseUrl: 'https://api-dev.example.com',
                routes: ['/health', '/leads', '/agents']
              }
            ],
            lambdas: [
              {
                logicalName: 'HealthCheckFunction',
                runtime: 'nodejs20.x',
                handler: 'index.handler',
                file: 'lambda/fibonacci/health.ts',
                purpose: 'Health check endpoint'
              }
            ],
            databases: [
              {
                type: 'Aurora',
                name: 'alquimista-cluster',
                engine: 'PostgreSQL',
                mode: 'Serverless v2'
              }
            ],
            storage: [
              {
                type: 'S3',
                name: 'frontend-bucket',
                purpose: 'Frontend hosting'
              }
            ],
            security: [
              {
                type: 'WAF',
                name: 'AlquimistaWAF',
                description: 'Web Application Firewall'
              }
            ]
          }
        }
      ]
    },
    database: {
      engine: 'PostgreSQL 15',
      mode: 'Serverless v2',
      region: 'us-east-1',
      schemas: ['alquimista_platform', 'fibonacci_core', 'nigredo_leads'],
      migrations: [
        {
          number: '001',
          filename: '001_initial_schema.sql',
          summary: 'Schema inicial do sistema',
          status: 'applied'
        },
        {
          number: '002',
          filename: '002_add_tenants.sql',
          summary: 'Adiciona tabela de tenants',
          status: 'applied'
        }
      ],
      decisions: ['Migration 009 deve ser pulada (duplicada da 008)']
    },
    backends: {
      fibonacci: {
        name: 'Fibonacci',
        purpose: 'Sistema de orquestração principal para gestão de leads',
        apiGateway: {
          dev: {
            logicalName: 'FibonacciApiDev',
            type: 'HTTP',
            id: 'fib-dev-123',
            baseUrl: 'https://fibonacci-dev.example.com',
            routes: ['/health', '/leads', '/agents']
          }
        },
        handlers: [
          {
            logicalName: 'HealthHandler',
            file: 'lambda/fibonacci/health.ts',
            purpose: 'Health check',
            routes: ['/health']
          }
        ],
        integrations: ['Aurora', 'Cognito', 'S3']
      },
      nigredo: {
        name: 'Nigredo',
        purpose: 'Núcleo de prospecção e qualificação de leads',
        apiGateway: {
          dev: {
            logicalName: 'NigredoApiDev',
            type: 'HTTP',
            id: 'nig-dev-456',
            baseUrl: 'https://nigredo-dev.example.com',
            routes: ['/pipeline', '/leads']
          }
        },
        handlers: [],
        integrations: ['Aurora', 'Fibonacci']
      },
      operationalDashboard: {
        name: 'Painel Operacional',
        purpose: 'Dashboard de operações internas',
        apiGateway: {
          dev: {
            logicalName: 'DashboardApiDev',
            type: 'HTTP',
            routes: ['/tenants', '/metrics']
          }
        },
        handlers: [],
        integrations: ['Aurora', 'Cognito']
      }
    },
    frontend: {
      operationalPanel: {
        framework: 'Next.js 14',
        location: 'frontend/',
        routes: [
          { path: '/auth/login', type: 'auth' },
          { path: '/dashboard', type: 'dashboard' },
          { path: '/company', type: 'company' }
        ],
        cognito: {
          userPoolId: 'us-east-1_ABC123',
          clientId: 'client-123',
          region: 'us-east-1',
          hostedUiDomain: 'https://auth.example.com',
          redirectUri: 'https://app.example.com/auth/callback',
          logoutUri: 'https://app.example.com/auth/logout',
          authFlow: 'AUTHORIZATION_CODE',
          groups: [
            { name: 'INTERNAL_ADMIN', role: 'Administrador interno' },
            { name: 'TENANT_ADMIN', role: 'Administrador de tenant' }
          ],
          middlewareProtection: true,
          files: ['middleware.ts', 'lib/cognito-client.ts']
        },
        apiClients: [
          {
            name: 'TenantClient',
            file: 'lib/api/tenant-client.ts',
            baseUrlSource: 'NEXT_PUBLIC_API_BASE_URL'
          }
        ],
        tests: {
          unit: { total: 50, passing: 48, status: 'passando' },
          integration: { total: 30, passing: 30, status: 'passando' },
          e2e: { total: 15, passing: 15, status: 'passando' },
          security: { total: 38, passing: 38, status: 'passando' }
        }
      },
      commercialSites: {
        type: 'S3+CloudFront',
        bucket: 'alquimista-frontend',
        distributionId: 'E123ABC',
        domain: 'www.example.com'
      }
    },
    authentication: {
      userPool: {
        name: 'AlquimistaUserPool',
        region: 'us-east-1',
        id: 'us-east-1_ABC123',
        clientIds: ['client-123', 'client-456'],
        hostedUiDomain: 'https://auth.example.com'
      },
      groups: [
        { name: 'INTERNAL_ADMIN', role: 'Administrador interno' },
        { name: 'INTERNAL_SUPPORT', role: 'Suporte interno' },
        { name: 'TENANT_ADMIN', role: 'Administrador de tenant' },
        { name: 'TENANT_USER', role: 'Usuário de tenant' }
      ],
      users: [
        {
          email: 'ad***@example.com',
          groups: ['INTERNAL_ADMIN']
        }
      ]
    },
    cicd: {
      workflow: {
        file: '.github/workflows/ci-cd-alquimistaai.yml',
        exists: true,
        name: 'CI/CD AlquimistaAI',
        triggers: ['push', 'pull_request', 'workflow_dispatch'],
        jobs: [
          {
            id: 'test',
            name: 'Run Tests',
            runsOn: 'ubuntu-latest',
            needs: [],
            environment: null,
            steps: 5
          },
          {
            id: 'deploy-dev',
            name: 'Deploy to DEV',
            runsOn: 'ubuntu-latest',
            needs: ['test'],
            environment: 'dev',
            steps: 8
          }
        ]
      },
      oidc: {
        configured: true,
        role: 'GitHubActionsRole',
        provider: 'token.actions.githubusercontent.com'
      },
      scripts: [
        {
          name: 'validate-system-complete',
          path: 'scripts/validate-system-complete.ps1',
          description: 'Valida sistema completo',
          type: 'validation'
        },
        {
          name: 'smoke-tests-api-dev',
          path: 'scripts/smoke-tests-api-dev.ps1',
          description: 'Smoke tests da API DEV',
          type: 'smoke-test'
        }
      ],
      tests: [
        {
          path: 'docs/ci-cd/TEST-LOG.md',
          title: 'Log de Testes CI/CD',
          type: 'summary'
        }
      ]
    },
    guardrails: {
      security: {
        cloudTrail: {
          enabled: true,
          trailName: 'alquimista-trail',
          bucketName: 'alquimista-cloudtrail',
          region: 'us-east-1',
          retentionDays: 90,
          logFileValidation: true,
          multiRegion: true
        },
        guardDuty: {
          enabled: true,
          detectorId: 'detector-123',
          region: 'us-east-1',
          findingPublishingFrequency: 'FIFTEEN_MINUTES',
          s3Protection: true,
          malwareProtection: true
        },
        waf: {
          enabled: true,
          webAcls: [
            {
              name: 'AlquimistaWAF-dev',
              scope: 'REGIONAL',
              environment: 'dev',
              defaultAction: 'ALLOW',
              rules: ['RateLimitRule', 'GeoBlockRule'],
              description: 'WAF para ambiente DEV'
            }
          ],
          ipSets: [],
          logGroups: [
            {
              name: 'aws-waf-logs-alquimista-dev',
              retentionDays: 30,
              environment: 'dev'
            }
          ]
        },
        snsTopics: [
          {
            name: 'security-alerts',
            displayName: 'Security Alerts',
            purpose: 'Alertas de segurança',
            subscriptions: ['email:security@example.com']
          }
        ]
      },
      cost: {
        budgets: [
          {
            name: 'Monthly Budget',
            budgetType: 'COST',
            timeUnit: 'MONTHLY',
            amount: 1000,
            currency: 'USD',
            thresholds: [80, 100, 120],
            notificationTypes: ['ACTUAL', 'FORECASTED']
          }
        ],
        anomalyDetection: {
          monitorName: 'Cost Anomaly Monitor',
          monitorType: 'DIMENSIONAL',
          dimension: 'SERVICE',
          threshold: 10,
          frequency: 'DAILY'
        },
        snsTopics: []
      },
      observability: {
        dashboards: [
          {
            name: 'Fibonacci Core Dashboard',
            widgets: ['API Latency', 'Error Rate', 'Request Count'],
            purpose: 'Monitoramento do Fibonacci'
          }
        ]
      }
    },
    environment: {
      variables: [
        {
          name: 'AWS_REGION',
          usedIn: ['lambda', 'frontend', 'cdk'],
          storedIn: ['.env', 'CDK context'],
          description: 'Região AWS principal'
        },
        {
          name: 'DATABASE_URL',
          usedIn: ['lambda'],
          storedIn: ['Secrets Manager'],
          description: 'URL de conexão com Aurora'
        },
        {
          name: 'STRIPE_SECRET_KEY',
          usedIn: ['lambda'],
          storedIn: ['Secrets Manager'],
          description: 'Chave secreta do Stripe'
        }
      ],
      integrations: [
        {
          name: 'Stripe',
          type: 'Payment Gateway',
          files: ['lambda/shared/stripe-client.ts'],
          variables: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
        }
      ]
    },
    gaps: {
      known: [
        {
          description: 'Migration 009 duplicada',
          reference: 'database/migrations/009_*.sql',
          severity: 'medium'
        },
        {
          description: 'Falta documentação de rollback',
          reference: 'docs/deploy/ROLLBACK.md',
          severity: 'low'
        }
      ],
      risks: [
        {
          description: 'Configuração manual do Cognito',
          impact: 'Pode causar inconsistências entre ambientes',
          mitigation: 'Migrar para CDK'
        }
      ],
      nextSteps: [
        'Implementar testes de carga',
        'Adicionar monitoramento de custos',
        'Documentar procedimentos de rollback',
        'Automatizar configuração do Cognito',
        'Implementar backup automático'
      ]
    }
  };
}

describe('Gerador de Documento Principal', () => {
  it('deve gerar documento completo', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    // Documento não deve estar vazio
    expect(doc).toBeTruthy();
    expect(doc.length).toBeGreaterThan(1000);
  });
  
  it('deve conter título principal', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('# STATUS GERAL DO SISTEMA ALQUIMISTAAI');
  });
  
  it('deve conter todas as seções obrigatórias', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    // Verificar presença de todas as seções
    expect(doc).toContain('## Resumo Executivo');
    expect(doc).toContain('## 1. Infraestrutura AWS');
    expect(doc).toContain('## 2. Bancos de Dados e Migrations');
    expect(doc).toContain('## 3. Backends de API');
    expect(doc).toContain('## 4. Frontend');
    expect(doc).toContain('## 5. Autenticação & Autorização');
    expect(doc).toContain('## 6. CI/CD e Guardrails');
    expect(doc).toContain('## 7. Segurança, Custo e Observabilidade');
    expect(doc).toContain('## 8. Variáveis de Ambiente');
    expect(doc).toContain('## 9. Gaps, Riscos e Próximos Passos');
  });
  
  it('deve incluir metadata no cabeçalho', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('**Versão:** 1.0.0');
    expect(doc).toContain('**Gerado por:** test-runner');
    expect(doc).toContain('**Região AWS Principal:** us-east-1');
  });
  
  it('deve incluir aviso de segurança', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('⚠️ AVISO DE SEGURANÇA');
    expect(doc).toContain('sanitizado');
  });
  
  it('não deve conter segredos expostos', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    // Verificar que não há chaves AWS, tokens ou senhas expostas
    expect(doc).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(doc).not.toMatch(/sk_live_[0-9a-zA-Z]{24,}/);
    expect(doc).not.toMatch(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/);
    expect(doc).not.toContain('password:');
  });
  
  it('deve listar stacks por ambiente', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('AlquimistaStack-dev');
    expect(doc).toContain('Ambiente DEV');
  });
  
  it('deve incluir informações de banco de dados', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('PostgreSQL 15');
    expect(doc).toContain('Serverless v2');
    expect(doc).toContain('alquimista_platform');
    expect(doc).toContain('fibonacci_core');
    expect(doc).toContain('nigredo_leads');
  });
  
  it('deve listar migrations', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('001_initial_schema.sql');
    expect(doc).toContain('002_add_tenants.sql');
  });
  
  it('deve documentar backends separadamente', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('Fibonacci Orquestrador');
    expect(doc).toContain('Nigredo - Núcleo de Prospecção');
    expect(doc).toContain('Painel Operacional');
  });
  
  it('deve incluir informações de Cognito', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('us-east-1_ABC123');
    expect(doc).toContain('INTERNAL_ADMIN');
    expect(doc).toContain('TENANT_ADMIN');
  });
  
  it('deve listar guardrails de segurança', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('CloudTrail');
    expect(doc).toContain('GuardDuty');
    expect(doc).toContain('WAF');
  });
  
  it('deve incluir tabela de variáveis de ambiente', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('| Variável | Usado Em | Armazenado Em | Descrição |');
    expect(doc).toContain('AWS_REGION');
    expect(doc).toContain('DATABASE_URL');
  });
  
  it('deve listar gaps conhecidos', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('Migration 009 duplicada');
    expect(doc).toContain('Falta documentação de rollback');
  });
  
  it('deve incluir próximos passos', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    
    expect(doc).toContain('Implementar testes de carga');
    expect(doc).toContain('Adicionar monitoramento de custos');
  });
});

describe('Gerador de Índice Compacto', () => {
  it('deve gerar índice compacto', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    // Índice não deve estar vazio
    expect(index).toBeTruthy();
    expect(index.length).toBeGreaterThan(500);
  });
  
  it('deve conter título do índice', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('# SHORT INDEX — STATUS GERAL ALQUIMISTAAI');
  });
  
  it('deve conter seções principais', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('## Identificadores-Chave');
    expect(index).toContain('## Backends');
    expect(index).toContain('## Frontends');
    expect(index).toContain('## CI/CD');
    expect(index).toContain('## Segurança');
    expect(index).toContain('## Variáveis-Chave');
  });
  
  it('deve incluir identificadores de APIs', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('API Gateway Fibonacci DEV');
    expect(index).toContain('fib-dev-123');
  });
  
  it('deve incluir User Pool ID', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('us-east-1_ABC123');
  });
  
  it('deve ser mais compacto que o documento principal', () => {
    const inventory = createMockInventory();
    const doc = generateMainDocument(inventory);
    const index = generateShortIndex(inventory);
    
    // Índice deve ser significativamente menor
    expect(index.length).toBeLessThan(doc.length * 0.3);
  });
  
  it('não deve conter segredos expostos', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    // Verificar que não há chaves AWS, tokens ou senhas expostas
    expect(index).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(index).not.toMatch(/sk_live_[0-9a-zA-Z]{24,}/);
    expect(index).not.toMatch(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/);
  });
  
  it('deve listar stacks CDK', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('AlquimistaStack-dev');
  });
  
  it('deve incluir resumo de backends', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('Fibonacci Orquestrador');
    expect(index).toContain('Nigredo');
    expect(index).toContain('Painel Operacional');
  });
  
  it('deve incluir status de segurança', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('CloudTrail:');
    expect(index).toContain('GuardDuty:');
    expect(index).toContain('WAF:');
  });
  
  it('deve listar variáveis sem valores', () => {
    const inventory = createMockInventory();
    const index = generateShortIndex(inventory);
    
    expect(index).toContain('AWS_REGION');
    expect(index).toContain('DATABASE_URL');
    expect(index).toContain('Valores não incluídos por segurança');
  });
});

describe('Sanitização no Gerador', () => {
  it('deve sanitizar chaves AWS no inventário', () => {
    const inventory = createMockInventory();
    
    // Adicionar uma chave AWS no inventário
    inventory.environment.variables.push({
      name: 'AWS_ACCESS_KEY_ID',
      usedIn: ['lambda'],
      storedIn: ['Secrets Manager'],
      description: 'AKIAIOSFODNN7EXAMPLE'
    });
    
    const doc = generateMainDocument(inventory);
    
    // Chave não deve aparecer completa
    expect(doc).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(doc).toContain('AKIA');
  });
  
  it('deve sanitizar URLs com credenciais', () => {
    const inventory = createMockInventory();
    
    // Adicionar URL com credenciais
    inventory.backends.fibonacci.apiGateway.dev!.baseUrl = 'postgresql://user:password@host/db';
    
    const doc = generateMainDocument(inventory);
    
    // Senha não deve aparecer
    expect(doc).not.toContain('user:password');
  });
  
  it('deve sanitizar tokens JWT', () => {
    const inventory = createMockInventory();
    
    // Adicionar token JWT
    inventory.environment.variables.push({
      name: 'JWT_TOKEN',
      usedIn: ['lambda'],
      storedIn: ['Secrets Manager'],
      description: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
    });
    
    const doc = generateMainDocument(inventory);
    
    // Token não deve aparecer completo
    expect(doc).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
  });
});

