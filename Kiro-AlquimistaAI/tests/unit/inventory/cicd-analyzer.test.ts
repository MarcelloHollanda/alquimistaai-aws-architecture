/**
 * Testes Unitários - Analisador de CI/CD
 * 
 * Testa a análise de workflows, OIDC, scripts e documentação de CI/CD
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import { analyzeCiCd, generateCiCdSummary } from '../../../scripts/inventory/analyzers/cicd-analyzer';
import type { CiCdInfo } from '../../../scripts/inventory/types';

// Mock do módulo fs
vi.mock('fs');

describe('Analisador de CI/CD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeCiCd', () => {
    it('deve analisar workflow existente com sucesso', async () => {
      // Mock do workflow YAML
      const mockWorkflowContent = `
name: CI/CD AlquimistaAI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options:
          - dev
          - prod

jobs:
  build-and-validate:
    name: Build e Validação
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Build
        run: npm run build
  
  deploy-dev:
    name: Deploy Automático - DEV
    needs: build-and-validate
    runs-on: windows-latest
    steps:
      - name: Deploy
        run: cdk deploy
`;

      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return true;
        if (path === 'scripts') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') {
          return mockWorkflowContent;
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result).toBeDefined();
      expect(result.workflow.exists).toBe(true);
      expect(result.workflow.name).toBe('CI/CD AlquimistaAI');
      expect(result.workflow.triggers).toContain('push');
      expect(result.workflow.triggers).toContain('pull_request');
      expect(result.workflow.triggers).toContain('workflow_dispatch');
      expect(result.workflow.jobs).toHaveLength(2);
      expect(result.workflow.jobs[0].name).toBe('Build e Validação');
      expect(result.workflow.jobs[1].name).toBe('Deploy Automático - DEV');
    });

    it('deve detectar workflow ausente', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await analyzeCiCd();

      expect(result.workflow.exists).toBe(false);
      expect(result.workflow.jobs).toHaveLength(0);
    });

    it('deve extrair informações de OIDC do workflow', async () => {
      const mockWorkflowWithOidc = `
name: CI/CD
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
`;

      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return true;
        if (path === 'scripts') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') {
          return mockWorkflowWithOidc;
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.oidc.configured).toBe(true);
      expect(result.oidc.role).toBe('GitHubActionsRole');
      expect(result.oidc.provider).toBe('token.actions.githubusercontent.com');
    });

    it('deve listar scripts de validação disponíveis', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return false;
        if (path === 'scripts') return true;
        if (path.includes('validate-system-complete.ps1')) return true;
        if (path.includes('smoke-tests-api-dev.ps1')) return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('validate-system-complete.ps1')) {
          return '# Script de Validação Completa do Sistema\n# Verifica componentes';
        }
        if (path.includes('smoke-tests-api-dev.ps1')) {
          return '# Script de Smoke Tests\n# Testa APIs';
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.scripts.length).toBeGreaterThan(0);
      
      const validationScript = result.scripts.find(s => s.name === 'validate-system-complete.ps1');
      expect(validationScript).toBeDefined();
      expect(validationScript?.type).toBe('validation');
      
      const smokeTestScript = result.scripts.find(s => s.name === 'smoke-tests-api-dev.ps1');
      expect(smokeTestScript).toBeDefined();
      expect(smokeTestScript?.type).toBe('smoke-test');
    });

    it('deve identificar documentos de teste', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return false;
        if (path === 'scripts') return true;
        if (path === 'RESUMO-TESTE-CI-CD.md') return true;
        if (path === 'docs/ci-cd/TESTE-WORKFLOW-RESUMO.md') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === 'RESUMO-TESTE-CI-CD.md') {
          return '# Resumo de Teste CI/CD\n\nResumo dos testes';
        }
        if (path === 'docs/ci-cd/TESTE-WORKFLOW-RESUMO.md') {
          return '# Teste de Workflow\n\nDetalhes do teste';
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.tests.length).toBeGreaterThan(0);
      
      const summaryDoc = result.tests.find(t => t.path === 'RESUMO-TESTE-CI-CD.md');
      expect(summaryDoc).toBeDefined();
      expect(summaryDoc?.type).toBe('summary');
      
      const workflowDoc = result.tests.find(t => t.path === 'docs/ci-cd/TESTE-WORKFLOW-RESUMO.md');
      expect(workflowDoc).toBeDefined();
      expect(workflowDoc?.type).toBe('workflow-test');
    });

    it('deve extrair jobs com dependências corretamente', async () => {
      const mockWorkflowWithDeps = `
name: CI/CD
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
  
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  
  deploy:
    needs: [build, test]
    runs-on: ubuntu-latest
    environment:
      name: prod
    steps:
      - run: cdk deploy
`;

      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return true;
        if (path === 'scripts') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') {
          return mockWorkflowWithDeps;
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.workflow.jobs).toHaveLength(3);
      
      const buildJob = result.workflow.jobs.find(j => j.id === 'build');
      expect(buildJob?.needs).toHaveLength(0);
      
      const testJob = result.workflow.jobs.find(j => j.id === 'test');
      expect(testJob?.needs).toContain('build');
      
      const deployJob = result.workflow.jobs.find(j => j.id === 'deploy');
      expect(deployJob?.needs).toContain('build');
      expect(deployJob?.needs).toContain('test');
      expect(deployJob?.environment).toBe('prod');
    });
  });

  describe('generateCiCdSummary', () => {
    it('deve gerar resumo completo de CI/CD', () => {
      const mockCiCd: CiCdInfo = {
        workflow: {
          file: '.github/workflows/ci-cd-alquimistaai.yml',
          exists: true,
          name: 'CI/CD AlquimistaAI',
          triggers: ['push', 'pull_request', 'workflow_dispatch'],
          jobs: [
            {
              id: 'build',
              name: 'Build e Validação',
              runsOn: 'windows-latest',
              needs: [],
              environment: null,
              steps: 5
            },
            {
              id: 'deploy-dev',
              name: 'Deploy DEV',
              runsOn: 'windows-latest',
              needs: ['build'],
              environment: null,
              steps: 3
            },
            {
              id: 'deploy-prod',
              name: 'Deploy PROD',
              runsOn: 'windows-latest',
              needs: ['build'],
              environment: 'prod',
              steps: 4
            }
          ]
        },
        oidc: {
          configured: true,
          role: 'GitHubActionsAlquimistaAICICD',
          provider: 'token.actions.githubusercontent.com'
        },
        scripts: [
          {
            name: 'validate-system-complete.ps1',
            path: 'scripts/validate-system-complete.ps1',
            description: 'Validação completa do sistema',
            type: 'validation'
          },
          {
            name: 'smoke-tests-api-dev.ps1',
            path: 'scripts/smoke-tests-api-dev.ps1',
            description: 'Smoke tests das APIs',
            type: 'smoke-test'
          }
        ],
        tests: [
          {
            path: 'RESUMO-TESTE-CI-CD.md',
            title: 'Resumo de Teste CI/CD',
            type: 'summary'
          }
        ]
      };

      const summary = generateCiCdSummary(mockCiCd);

      expect(summary).toContain('## 6. CI/CD e Guardrails');
      expect(summary).toContain('### Workflow Principal');
      expect(summary).toContain('CI/CD AlquimistaAI');
      expect(summary).toContain('push, pull_request, workflow_dispatch');
      expect(summary).toContain('### Jobs');
      expect(summary).toContain('Build e Validação');
      expect(summary).toContain('Deploy DEV');
      expect(summary).toContain('Deploy PROD');
      expect(summary).toContain('### Integração OIDC');
      expect(summary).toContain('GitHubActionsAlquimistaAICICD');
      expect(summary).toContain('### Scripts de Validação');
      expect(summary).toContain('validate-system-complete.ps1');
      expect(summary).toContain('smoke-tests-api-dev.ps1');
      expect(summary).toContain('### Documentação de Testes');
      expect(summary).toContain('Resumo de Teste CI/CD');
    });

    it('deve gerar resumo quando workflow não existe', () => {
      const mockCiCd: CiCdInfo = {
        workflow: {
          file: '.github/workflows/ci-cd-alquimistaai.yml',
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
      };

      const summary = generateCiCdSummary(mockCiCd);

      expect(summary).toContain('## 6. CI/CD e Guardrails');
      expect(summary).toContain('⚠️ Workflow principal não encontrado');
      expect(summary).toContain('⚠️ Não configurado ou não detectado');
      expect(summary).toContain('⚠️ Nenhum script de validação encontrado');
    });

    it('deve separar scripts de validação e smoke tests', () => {
      const mockCiCd: CiCdInfo = {
        workflow: {
          file: '.github/workflows/ci-cd-alquimistaai.yml',
          exists: true,
          triggers: ['push'],
          jobs: []
        },
        oidc: {
          configured: true,
          role: 'TestRole',
          provider: 'token.actions.githubusercontent.com'
        },
        scripts: [
          {
            name: 'validate-1.ps1',
            path: 'scripts/validate-1.ps1',
            description: 'Validação 1',
            type: 'validation'
          },
          {
            name: 'validate-2.ps1',
            path: 'scripts/validate-2.ps1',
            description: 'Validação 2',
            type: 'validation'
          },
          {
            name: 'smoke-test-1.ps1',
            path: 'scripts/smoke-test-1.ps1',
            description: 'Smoke test 1',
            type: 'smoke-test'
          }
        ],
        tests: []
      };

      const summary = generateCiCdSummary(mockCiCd);

      expect(summary).toContain('#### Scripts de Validação');
      expect(summary).toContain('validate-1.ps1');
      expect(summary).toContain('validate-2.ps1');
      expect(summary).toContain('#### Smoke Tests');
      expect(summary).toContain('smoke-test-1.ps1');
    });
  });

  describe('Parsing de Workflow YAML', () => {
    it('deve lidar com triggers simples (string)', async () => {
      const mockWorkflow = `
name: Simple
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo test
`;

      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return true;
        if (path === 'scripts') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') {
          return mockWorkflow;
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.workflow.triggers).toContain('push');
    });

    it('deve lidar com triggers como array', async () => {
      const mockWorkflow = `
name: Array
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo test
`;

      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return true;
        if (path === 'scripts') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') {
          return mockWorkflow;
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.workflow.triggers).toContain('push');
      expect(result.workflow.triggers).toContain('pull_request');
    });

    it('deve contar steps corretamente', async () => {
      const mockWorkflow = `
name: Steps
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Step 1
        run: echo 1
      - name: Step 2
        run: echo 2
      - name: Step 3
        run: echo 3
`;

      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') return true;
        if (path === 'scripts') return true;
        return false;
      });

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path === '.github/workflows/ci-cd-alquimistaai.yml') {
          return mockWorkflow;
        }
        return '';
      });

      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await analyzeCiCd();

      expect(result.workflow.jobs[0].steps).toBe(3);
    });
  });
});
