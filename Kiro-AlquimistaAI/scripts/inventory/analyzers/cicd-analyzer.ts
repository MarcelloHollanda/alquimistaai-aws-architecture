/**
 * Analisador de CI/CD
 * 
 * Extrai informações sobre o pipeline CI/CD, incluindo:
 * - Workflow GitHub Actions
 * - Triggers e jobs
 * - Integração OIDC
 * - Scripts de validação
 * - Documentos de teste
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CiCdInfo, WorkflowInfo, JobInfo, ScriptInfo, TestLogInfo, OidcInfo } from '../types';

/**
 * Analisa a configuração de CI/CD do sistema
 */
export async function analyzeCiCd(): Promise<CiCdInfo> {
  console.log('Analisando CI/CD...');
  
  const workflow = await analyzeWorkflow();
  const oidc = analyzeOidc();
  const scripts = analyzeValidationScripts();
  const tests = analyzeTestLogs();
  
  return {
    workflow,
    oidc,
    scripts,
    tests
  };
}

/**
 * Analisa o workflow principal do GitHub Actions
 */
async function analyzeWorkflow(): Promise<WorkflowInfo> {
  const workflowPath = '.github/workflows/ci-cd-alquimistaai.yml';
  
  if (!fs.existsSync(workflowPath)) {
    console.warn(`Workflow não encontrado: ${workflowPath}`);
    return {
      file: workflowPath,
      exists: false,
      triggers: [],
      jobs: []
    };
  }
  
  try {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as any;
    
    // Extrair triggers
    const triggers: string[] = [];
    if (workflow.on) {
      if (typeof workflow.on === 'string') {
        triggers.push(workflow.on);
      } else if (Array.isArray(workflow.on)) {
        triggers.push(...workflow.on);
      } else if (typeof workflow.on === 'object') {
        triggers.push(...Object.keys(workflow.on));
      }
    }
    
    // Extrair jobs
    const jobs: JobInfo[] = [];
    if (workflow.jobs) {
      for (const [jobId, jobConfig] of Object.entries(workflow.jobs)) {
        const job = jobConfig as any;
        jobs.push({
          id: jobId,
          name: job.name || jobId,
          runsOn: job['runs-on'] || 'unknown',
          needs: Array.isArray(job.needs) ? job.needs : (job.needs ? [job.needs] : []),
          environment: job.environment?.name || null,
          steps: job.steps?.length || 0
        });
      }
    }
    
    return {
      file: workflowPath,
      exists: true,
      name: workflow.name || 'CI/CD AlquimistaAI',
      triggers,
      jobs
    };
  } catch (error) {
    console.error(`Erro ao analisar workflow: ${error}`);
    return {
      file: workflowPath,
      exists: true,
      triggers: [],
      jobs: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Analisa a configuração OIDC
 */
function analyzeOidc(): OidcInfo {
  // Informações OIDC são extraídas do workflow e documentação
  const workflowPath = '.github/workflows/ci-cd-alquimistaai.yml';
  
  if (!fs.existsSync(workflowPath)) {
    return {
      configured: false,
      role: null,
      provider: null
    };
  }
  
  try {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    
    // Buscar role ARN no workflow
    const roleMatch = content.match(/role-to-assume:\s*arn:aws:iam::[^:]+:role\/([^\s\n]+)/);
    const role = roleMatch ? roleMatch[1] : null;
    
    // Provider é sempre o mesmo para GitHub Actions
    const provider = content.includes('configure-aws-credentials') 
      ? 'token.actions.githubusercontent.com' 
      : null;
    
    return {
      configured: !!role && !!provider,
      role,
      provider
    };
  } catch (error) {
    console.error(`Erro ao analisar OIDC: ${error}`);
    return {
      configured: false,
      role: null,
      provider: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Analisa scripts de validação disponíveis
 */
function analyzeValidationScripts(): ScriptInfo[] {
  const scriptsDir = 'scripts';
  const scripts: ScriptInfo[] = [];
  
  if (!fs.existsSync(scriptsDir)) {
    console.warn(`Diretório de scripts não encontrado: ${scriptsDir}`);
    return scripts;
  }
  
  // Scripts de validação conhecidos
  const validationScripts = [
    'validate-system-complete.ps1',
    'validate-migrations-aurora.ps1',
    'validate-cognito-setup.ps1',
    'validate-operational-dashboard-dev.ps1',
    'validate-nigredo-production.ps1',
    'smoke-tests-api-dev.ps1',
    'smoke-tests-operational-dashboard-prod.ps1',
    'verify-nigredo-deployment.ps1',
    'verify-security-guardrails.ps1',
    'post-deploy-validation.ps1'
  ];
  
  for (const scriptName of validationScripts) {
    const scriptPath = path.join(scriptsDir, scriptName);
    
    if (fs.existsSync(scriptPath)) {
      try {
        const content = fs.readFileSync(scriptPath, 'utf-8');
        
        // Extrair descrição do cabeçalho do script
        const lines = content.split('\n');
        const commentLines: string[] = [];
        for (const line of lines) {
          if (line.trim().startsWith('#')) {
            commentLines.push(line.replace(/^#\s*/, ''));
          } else if (commentLines.length > 0) {
            break;
          }
        }
        const description = commentLines.length > 0 
          ? commentLines.join(' ').trim() 
          : 'Script de validação';
        
        scripts.push({
          name: scriptName,
          path: scriptPath,
          description,
          type: determineScriptType(scriptName)
        });
      } catch (error) {
        console.error(`Erro ao ler script ${scriptName}: ${error}`);
      }
    }
  }
  
  return scripts;
}

/**
 * Determina o tipo de script baseado no nome
 */
function determineScriptType(scriptName: string): 'validation' | 'smoke-test' | 'deploy' | 'other' {
  if (scriptName.includes('validate')) return 'validation';
  if (scriptName.includes('smoke-test')) return 'smoke-test';
  if (scriptName.includes('verify')) return 'validation';
  if (scriptName.includes('deploy')) return 'deploy';
  return 'other';
}

/**
 * Analisa documentos de teste do CI/CD
 */
function analyzeTestLogs(): TestLogInfo[] {
  const testDocs: TestLogInfo[] = [];
  
  // Documentos de teste conhecidos
  const testDocuments = [
    { path: 'RESUMO-TESTE-CI-CD.md', type: 'summary' as const },
    { path: 'docs/ci-cd/TESTE-WORKFLOW-RESUMO.md', type: 'workflow-test' as const },
    { path: 'docs/ci-cd/TESTE-WORKFLOW-VALIDACAO.md', type: 'validation' as const },
    { path: 'docs/ci-cd/CHECKLIST-VALIDACAO-WORKFLOW.md', type: 'checklist' as const },
    { path: 'docs/CI-CD-VALIDATION-INTEGRATION-SUMMARY.md', type: 'integration' as const }
  ];
  
  for (const doc of testDocuments) {
    if (fs.existsSync(doc.path)) {
      try {
        const content = fs.readFileSync(doc.path, 'utf-8');
        
        // Extrair título do documento
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : path.basename(doc.path, '.md');
        
        testDocs.push({
          path: doc.path,
          title,
          type: doc.type
        });
      } catch (error) {
        console.error(`Erro ao ler documento de teste ${doc.path}: ${error}`);
      }
    }
  }
  
  return testDocs;
}

/**
 * Gera resumo textual da análise de CI/CD
 */
export function generateCiCdSummary(cicd: CiCdInfo): string {
  const lines: string[] = [];
  
  lines.push('## 6. CI/CD e Guardrails');
  lines.push('');
  
  // Workflow
  if (cicd.workflow.exists) {
    lines.push('### Workflow Principal');
    lines.push('');
    lines.push(`- **Arquivo**: \`${cicd.workflow.file}\``);
    if (cicd.workflow.name) {
      lines.push(`- **Nome**: ${cicd.workflow.name}`);
    }
    lines.push(`- **Triggers**: ${cicd.workflow.triggers.join(', ')}`);
    lines.push('');
    
    lines.push('### Jobs');
    lines.push('');
    for (const job of cicd.workflow.jobs) {
      lines.push(`#### ${job.name}`);
      lines.push('');
      lines.push(`- **ID**: \`${job.id}\``);
      lines.push(`- **Runs on**: ${job.runsOn}`);
      if (job.needs.length > 0) {
        lines.push(`- **Depende de**: ${job.needs.join(', ')}`);
      }
      if (job.environment) {
        lines.push(`- **Environment**: ${job.environment}`);
      }
      lines.push(`- **Steps**: ${job.steps}`);
      lines.push('');
    }
  } else {
    lines.push('⚠️ Workflow principal não encontrado');
    lines.push('');
  }
  
  // OIDC
  lines.push('### Integração OIDC');
  lines.push('');
  if (cicd.oidc.configured) {
    lines.push(`- **Role IAM**: \`${cicd.oidc.role}\``);
    lines.push(`- **Provider**: \`${cicd.oidc.provider}\``);
    lines.push('- **Status**: ✅ Configurado');
  } else {
    lines.push('- **Status**: ⚠️ Não configurado ou não detectado');
  }
  lines.push('');
  
  // Scripts de validação
  lines.push('### Scripts de Validação');
  lines.push('');
  if (cicd.scripts.length > 0) {
    const validationScripts = cicd.scripts.filter(s => s.type === 'validation');
    const smokeTestScripts = cicd.scripts.filter(s => s.type === 'smoke-test');
    
    if (validationScripts.length > 0) {
      lines.push('#### Scripts de Validação');
      lines.push('');
      for (const script of validationScripts) {
        lines.push(`- **${script.name}**: ${script.description}`);
      }
      lines.push('');
    }
    
    if (smokeTestScripts.length > 0) {
      lines.push('#### Smoke Tests');
      lines.push('');
      for (const script of smokeTestScripts) {
        lines.push(`- **${script.name}**: ${script.description}`);
      }
      lines.push('');
    }
  } else {
    lines.push('⚠️ Nenhum script de validação encontrado');
    lines.push('');
  }
  
  // Documentos de teste
  if (cicd.tests.length > 0) {
    lines.push('### Documentação de Testes');
    lines.push('');
    for (const test of cicd.tests) {
      lines.push(`- [${test.title}](${test.path})`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
