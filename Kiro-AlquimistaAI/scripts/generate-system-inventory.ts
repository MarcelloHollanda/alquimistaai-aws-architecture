#!/usr/bin/env ts-node
/**
 * Script Principal de Geração de Inventário do Sistema
 * Feature: system-inventory-documentation
 * 
 * Orquestra a coleta de dados, validação e geração de documentos
 * de inventário do Sistema AlquimistaAI.
 * 
 * Uso:
 *   npm run generate:inventory           # Gera ambos os documentos
 *   npm run generate:inventory:main      # Gera apenas documento principal
 *   npm run generate:inventory:index     # Gera apenas índice compacto
 *   npm run validate:inventory           # Valida sem gerar
 */

import * as fs from 'fs';
import * as path from 'path';
import { SystemInventory, ValidationResult } from './inventory/types';
import { 
  analyzeCdkInfrastructure,
  analyzeDatabaseStructure,
  analyzeAllApis,
  analyzeFrontend,
  analyzeAuthentication,
  analyzeCiCd,
  analyzeGuardrails
} from './inventory/analyzers';
import { validateInventory, generateValidationReport } from './inventory/validator';
import { generateMainDocument, generateShortIndex } from './inventory/generator';
import { sanitizeObject, objectContainsSecrets } from './inventory/sanitizer';

// Configuração
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(WORKSPACE_ROOT, 'docs');
const MAIN_DOC_PATH = path.join(DOCS_DIR, 'STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md');
const SHORT_INDEX_PATH = path.join(DOCS_DIR, 'STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md');
const VALIDATION_REPORT_PATH = path.join(DOCS_DIR, 'VALIDATION-REPORT-INVENTORY.md');

/**
 * Modo de execução
 */
type ExecutionMode = 'full' | 'main-only' | 'index-only' | 'validate-only';

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando geração de inventário do Sistema AlquimistaAI...\n');
  
  // Determinar modo de execução
  const mode = getExecutionMode();
  console.log(`📋 Modo de execução: ${mode}\n`);
  
  try {
    // Fase 1: Coleta de Dados
    console.log('📊 Fase 1: Coletando dados do sistema...');
    const inventory = await collectSystemInventory();
    console.log('✅ Dados coletados com sucesso\n');
    
    // Fase 2: Validação
    console.log('🔍 Fase 2: Validando consistência...');
    const validationResult = validateInventory(inventory, WORKSPACE_ROOT);
    
    if (!validationResult.valid) {
      console.error('❌ Validação falhou!\n');
      displayValidationErrors(validationResult);
      
      // Salvar relatório de validação
      const report = generateValidationReport(validationResult);
      fs.writeFileSync(VALIDATION_REPORT_PATH, report, 'utf-8');
      console.log(`\n📄 Relatório de validação salvo em: ${VALIDATION_REPORT_PATH}`);
      
      process.exit(1);
    }
    
    console.log('✅ Validação concluída com sucesso');
    if (validationResult.warnings.length > 0) {
      console.log(`⚠️  ${validationResult.warnings.length} avisos encontrados`);
      displayValidationWarnings(validationResult);
    }
    console.log('');
    
    // Se modo é apenas validação, parar aqui
    if (mode === 'validate-only') {
      console.log('✅ Validação concluída. Nenhum documento foi gerado.');
      return;
    }
    
    // Fase 3: Verificação de Segurança
    console.log('🔒 Fase 3: Verificando segurança...');
    if (objectContainsSecrets(inventory)) {
      console.error('❌ ERRO CRÍTICO: Valores sensíveis detectados no inventário!');
      console.error('O inventário contém dados que não foram sanitizados.');
      console.error('Abortando geração de documentos por segurança.');
      process.exit(1);
    }
    console.log('✅ Nenhum valor sensível detectado\n');
    
    // Fase 4: Geração de Documentos
    console.log('📝 Fase 4: Gerando documentos...');
    
    // Garantir que diretório docs existe
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    
    // Gerar documento principal
    if (mode === 'full' || mode === 'main-only') {
      console.log('  📄 Gerando documento principal...');
      const mainDoc = generateMainDocument(inventory);
      fs.writeFileSync(MAIN_DOC_PATH, mainDoc, 'utf-8');
      console.log(`  ✅ Documento principal salvo: ${MAIN_DOC_PATH}`);
    }
    
    // Gerar índice compacto
    if (mode === 'full' || mode === 'index-only') {
      console.log('  📄 Gerando índice compacto...');
      const shortIndex = generateShortIndex(inventory);
      fs.writeFileSync(SHORT_INDEX_PATH, shortIndex, 'utf-8');
      console.log(`  ✅ Índice compacto salvo: ${SHORT_INDEX_PATH}`);
    }
    
    console.log('');
    
    // Fase 5: Relatório Final
    console.log('📊 Fase 5: Gerando relatório final...');
    const report = generateValidationReport(validationResult);
    fs.writeFileSync(VALIDATION_REPORT_PATH, report, 'utf-8');
    console.log(`✅ Relatório de validação salvo: ${VALIDATION_REPORT_PATH}\n`);
    
    // Sumário
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ GERAÇÃO DE INVENTÁRIO CONCLUÍDA COM SUCESSO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Estatísticas:');
    console.log(`  - Stacks CDK: ${inventory.infrastructure.stacks.length}`);
    console.log(`  - Migrations: ${inventory.database.migrations.length}`);
    console.log(`  - Backends: 3 (Fibonacci, Nigredo, Painel)`);
    console.log(`  - Rotas Frontend: ${inventory.frontend.operationalPanel.routes.length}`);
    console.log(`  - Grupos Cognito: ${inventory.authentication.groups.length}`);
    console.log(`  - Variáveis de Ambiente: ${inventory.environment.variables.length}`);
    console.log(`  - Gaps Conhecidos: ${inventory.gaps.known.length}`);
    console.log('');
    console.log('📄 Documentos gerados:');
    if (mode === 'full' || mode === 'main-only') {
      console.log(`  ✅ ${MAIN_DOC_PATH}`);
    }
    if (mode === 'full' || mode === 'index-only') {
      console.log(`  ✅ ${SHORT_INDEX_PATH}`);
    }
    console.log(`  ✅ ${VALIDATION_REPORT_PATH}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Erro durante a geração do inventário:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Coleta dados de todos os analisadores
 */
async function collectSystemInventory(): Promise<SystemInventory> {
  try {
    // 1. Analisar Infraestrutura CDK
    console.log('  📦 Analisando infraestrutura CDK...');
    const cdkResult = await analyzeCdkInfrastructure(WORKSPACE_ROOT);
    
    // 2. Analisar Banco de Dados
    console.log('  🗄️  Analisando banco de dados e migrations...');
    const dbResult = await analyzeDatabaseStructure(WORKSPACE_ROOT);
    
    // 3. Analisar APIs Backend
    console.log('  🔌 Analisando APIs backend...');
    const apisResult = analyzeAllApis();
    
    // 4. Analisar Frontend
    console.log('  🎨 Analisando frontend...');
    const frontendResult = await analyzeFrontend(WORKSPACE_ROOT);
    
    // 5. Analisar Autenticação
    console.log('  🔐 Analisando autenticação Cognito...');
    const authResult = await analyzeAuthentication(WORKSPACE_ROOT);
    
    // 6. Analisar CI/CD
    console.log('  🔄 Analisando CI/CD...');
    const cicdResult = await analyzeCiCd();
    
    // 7. Analisar Guardrails
    console.log('  🛡️  Analisando guardrails...');
    const guardrailsResult = await analyzeGuardrails(WORKSPACE_ROOT);
    
    // Consolidar dados
    const inventory: SystemInventory = {
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'generate-system-inventory.ts',
        version: '1.0.0'
      },
      
      infrastructure: {
        region: cdkResult.region || 'us-east-1',
        stacks: cdkResult.stacks || []
      },
      
      database: dbResult?.database || {
        engine: 'PostgreSQL',
        mode: 'Aurora Serverless v2',
        region: 'us-east-1',
        schemas: [],
        migrations: [],
        decisions: []
      },
      
      backends: {
        fibonacci: apisResult.fibonacci || {
          name: 'Fibonacci',
          purpose: 'Sistema de orquestração principal',
          apiGateway: {},
          handlers: [],
          integrations: []
        },
        nigredo: apisResult.nigredo || {
          name: 'Nigredo',
          purpose: 'Núcleo de prospecção',
          apiGateway: {},
          handlers: [],
          integrations: []
        },
        operationalDashboard: apisResult.operationalDashboard || {
          name: 'Painel Operacional',
          purpose: 'Dashboard operacional interno',
          apiGateway: {},
          handlers: [],
          integrations: []
        }
      },
      
      frontend: {
        operationalPanel: frontendResult || {
          framework: 'Next.js 14',
          location: 'frontend/',
          routes: [],
          cognito: {
            userPoolId: '',
            clientId: '',
            region: 'us-east-1',
            hostedUiDomain: '',
            redirectUri: '',
            logoutUri: '',
            authFlow: 'code',
            groups: [],
            middlewareProtection: false,
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
      
      authentication: authResult || {
        userPool: {
          name: '',
          region: 'us-east-1',
          id: '',
          clientIds: [],
          hostedUiDomain: ''
        },
        groups: [],
        users: []
      },
      
      cicd: cicdResult || {
        workflow: {
          file: '',
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
      
      guardrails: guardrailsResult || {
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
        variables: extractEnvironmentVariables(),
        integrations: extractExternalIntegrations()
      },
      
      gaps: {
        known: collectKnownGaps(),
        risks: collectKnownRisks(),
        nextSteps: generateNextSteps()
      }
    };
    
    // Sanitizar todo o inventário
    return sanitizeObject(inventory);
  } catch (error) {
    console.error('\n❌ Erro durante a coleta de dados:');
    console.error(error);
    throw new Error('Falha na coleta de dados do sistema');
  }
}

/**
 * Extrai variáveis de ambiente do sistema
 */
function extractEnvironmentVariables() {
  // Esta é uma implementação simplificada
  // Em produção, isso deveria analisar arquivos .env, código, etc.
  return [
    {
      name: 'AWS_REGION',
      usedIn: ['CDK', 'Lambda', 'Frontend'],
      storedIn: ['.env', 'CDK Context'],
      description: 'Região AWS principal (us-east-1)'
    },
    {
      name: 'NEXT_PUBLIC_API_BASE_URL',
      usedIn: ['Frontend'],
      storedIn: ['.env.local', '.env.production'],
      description: 'URL base da API para o frontend'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
      usedIn: ['Frontend'],
      storedIn: ['.env.local', '.env.production'],
      description: 'ID do User Pool Cognito'
    },
    {
      name: 'DATABASE_URL',
      usedIn: ['Lambda'],
      storedIn: ['Secrets Manager'],
      description: 'String de conexão do Aurora PostgreSQL'
    },
    {
      name: 'STRIPE_SECRET_KEY',
      usedIn: ['Lambda'],
      storedIn: ['Secrets Manager'],
      description: 'Chave secreta do Stripe para pagamentos'
    }
  ];
}

/**
 * Extrai integrações externas
 */
function extractExternalIntegrations() {
  return [
    {
      name: 'Stripe',
      type: 'Payment Gateway',
      files: ['lambda/platform/create-checkout-session.ts', 'lambda/platform/webhook-payment.ts'],
      variables: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
    },
    {
      name: 'Amazon Cognito',
      type: 'Authentication',
      files: ['frontend/src/lib/cognito-client.ts', 'frontend/middleware.ts'],
      variables: ['NEXT_PUBLIC_COGNITO_USER_POOL_ID', 'NEXT_PUBLIC_COGNITO_CLIENT_ID']
    }
  ];
}

/**
 * Coleta gaps conhecidos do sistema
 */
function collectKnownGaps() {
  return [
    {
      description: 'Migration 009 é duplicada da 008 e deve ser pulada',
      reference: 'database/migrations/README-009.md',
      severity: 'medium' as const
    }
  ];
}

/**
 * Coleta riscos conhecidos
 */
function collectKnownRisks() {
  return [
    {
      description: 'Configurações manuais no Console AWS não estão codificadas em IaC',
      impact: 'Dificulta reprodução de ambiente e aumenta risco de drift',
      mitigation: 'Documentar todas as configurações manuais e migrar para CDK quando possível'
    }
  ];
}

/**
 * Gera próximos passos recomendados
 */
function generateNextSteps() {
  return [
    'Implementar testes de integração end-to-end para fluxos críticos',
    'Adicionar monitoramento de custos com alertas proativos',
    'Documentar procedimentos de rollback para cada stack',
    'Implementar backup automatizado do Aurora com testes de restore',
    'Criar runbook operacional para incidentes comuns'
  ];
}

/**
 * Determina o modo de execução baseado em argumentos
 */
function getExecutionMode(): ExecutionMode {
  const args = process.argv.slice(2);
  
  if (args.includes('--main-only')) {
    return 'main-only';
  }
  
  if (args.includes('--index-only')) {
    return 'index-only';
  }
  
  if (args.includes('--validate-only')) {
    return 'validate-only';
  }
  
  return 'full';
}

/**
 * Exibe erros de validação
 */
function displayValidationErrors(result: ValidationResult): void {
  console.error('\n❌ Erros de Validação:\n');
  result.errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`);
  });
}

/**
 * Exibe avisos de validação
 */
function displayValidationWarnings(result: ValidationResult): void {
  console.warn('\n⚠️  Avisos de Validação:\n');
  result.warnings.slice(0, 10).forEach((warning, index) => {
    console.warn(`  ${index + 1}. ${warning}`);
  });
  
  if (result.warnings.length > 10) {
    console.warn(`\n  ... e mais ${result.warnings.length - 10} avisos`);
    console.warn(`  Veja o relatório completo em: ${VALIDATION_REPORT_PATH}`);
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
