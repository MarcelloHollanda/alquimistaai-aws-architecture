/**
 * Testes de Integração End-to-End - Geração Completa de Inventário
 * Feature: system-inventory-documentation
 * 
 * Testa o fluxo completo de geração de inventário do sistema.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');
const DOCS_DIR = path.join(WORKSPACE_ROOT, 'docs');
const MAIN_DOC_PATH = path.join(DOCS_DIR, 'STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md');
const SHORT_INDEX_PATH = path.join(DOCS_DIR, 'STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md');
const VALIDATION_REPORT_PATH = path.join(DOCS_DIR, 'VALIDATION-REPORT-INVENTORY.md');

// Backup dos arquivos existentes
let mainDocBackup: string | null = null;
let shortIndexBackup: string | null = null;
let validationReportBackup: string | null = null;

describe('Geração Completa de Inventário - End-to-End', () => {
  beforeAll(() => {
    // Fazer backup dos arquivos existentes
    if (fs.existsSync(MAIN_DOC_PATH)) {
      mainDocBackup = fs.readFileSync(MAIN_DOC_PATH, 'utf-8');
    }
    if (fs.existsSync(SHORT_INDEX_PATH)) {
      shortIndexBackup = fs.readFileSync(SHORT_INDEX_PATH, 'utf-8');
    }
    if (fs.existsSync(VALIDATION_REPORT_PATH)) {
      validationReportBackup = fs.readFileSync(VALIDATION_REPORT_PATH, 'utf-8');
    }
  });

  afterAll(() => {
    // Restaurar backups
    if (mainDocBackup !== null) {
      fs.writeFileSync(MAIN_DOC_PATH, mainDocBackup, 'utf-8');
    }
    if (shortIndexBackup !== null) {
      fs.writeFileSync(SHORT_INDEX_PATH, shortIndexBackup, 'utf-8');
    }
    if (validationReportBackup !== null) {
      fs.writeFileSync(VALIDATION_REPORT_PATH, validationReportBackup, 'utf-8');
    }
  });

  it('deve executar o script completo sem erros', () => {
    // Executar script de geração
    const result = execSync('npm run generate:inventory', {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    // Verificar que não houve erro
    expect(result).toBeDefined();
    expect(result).toContain('GERAÇÃO DE INVENTÁRIO CONCLUÍDA COM SUCESSO');
  });

  it('deve criar o documento principal', () => {
    expect(fs.existsSync(MAIN_DOC_PATH)).toBe(true);
  });

  it('deve criar o índice compacto', () => {
    expect(fs.existsSync(SHORT_INDEX_PATH)).toBe(true);
  });

  it('deve criar o relatório de validação', () => {
    expect(fs.existsSync(VALIDATION_REPORT_PATH)).toBe(true);
  });

  describe('Documento Principal', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(MAIN_DOC_PATH, 'utf-8');
    });

    it('deve conter o cabeçalho correto', () => {
      expect(content).toContain('# STATUS GERAL DO SISTEMA ALQUIMISTAAI');
      expect(content).toContain('**Data de Geração:**');
      expect(content).toContain('**Versão:**');
      expect(content).toContain('**Região AWS Principal:**');
    });

    it('deve conter aviso de segurança', () => {
      expect(content).toContain('⚠️ AVISO DE SEGURANÇA');
      expect(content).toContain('sanitizado');
    });

    it('deve conter resumo executivo', () => {
      expect(content).toContain('## Resumo Executivo');
      expect(content).toMatch(/\d+ stacks CDK/);
      expect(content).toMatch(/\d+ migrations/);
    });

    it('deve conter todas as seções obrigatórias', () => {
      expect(content).toContain('## 1. Infraestrutura AWS');
      expect(content).toContain('## 2. Bancos de Dados e Migrations');
      expect(content).toContain('## 3. Backends de API');
      expect(content).toContain('## 4. Frontend');
      expect(content).toContain('## 5. Autenticação & Autorização');
      expect(content).toContain('## 6. CI/CD e Guardrails');
      expect(content).toContain('## 7. Segurança, Custo e Observabilidade');
      expect(content).toContain('## 8. Variáveis de Ambiente');
      expect(content).toContain('## 9. Gaps, Riscos e Próximos Passos');
    });

    it('deve mencionar a região us-east-1', () => {
      expect(content).toContain('us-east-1');
    });

    it('deve mencionar os três backends principais', () => {
      expect(content).toContain('Fibonacci');
      expect(content).toContain('Nigredo');
      expect(content).toContain('Painel Operacional');
    });

    it('deve mencionar Aurora PostgreSQL', () => {
      expect(content).toContain('Aurora');
      expect(content).toContain('PostgreSQL');
    });

    it('deve mencionar Cognito', () => {
      expect(content).toContain('Cognito');
      expect(content).toContain('User Pool');
    });

    it('não deve conter chaves AWS expostas', () => {
      // Verificar que não há chaves AWS completas
      expect(content).not.toMatch(/AKIA[0-9A-Z]{16}(?!\*)/);
    });

    it('não deve conter chaves Stripe expostas', () => {
      // Verificar que não há chaves Stripe completas
      expect(content).not.toMatch(/sk_live_[0-9a-zA-Z]{24,}(?!\*)/);
    });

    it('não deve conter senhas expostas', () => {
      // Verificar que não há padrões de senha
      expect(content).not.toMatch(/password[\s:=]+["']?[^\s"']{8,}["']?/i);
    });
  });

  describe('Índice Compacto', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SHORT_INDEX_PATH, 'utf-8');
    });

    it('deve conter o cabeçalho correto', () => {
      expect(content).toContain('# SHORT INDEX — STATUS GERAL ALQUIMISTAAI');
      expect(content).toContain('Índice compacto otimizado para parsing por IA');
    });

    it('deve conter identificadores-chave', () => {
      expect(content).toContain('## Identificadores-Chave');
      expect(content).toContain('**AWS Region:**');
      expect(content).toContain('**Aurora Cluster:**');
    });

    it('deve conter seções resumidas', () => {
      expect(content).toContain('## Backends');
      expect(content).toContain('## Frontends');
      expect(content).toContain('## CI/CD');
      expect(content).toContain('## Segurança');
      expect(content).toContain('## Variáveis-Chave');
    });

    it('deve ser mais curto que o documento principal', () => {
      const mainContent = fs.readFileSync(MAIN_DOC_PATH, 'utf-8');
      expect(content.length).toBeLessThan(mainContent.length);
    });

    it('não deve conter valores de variáveis de ambiente', () => {
      // Verificar que há aviso sobre valores não incluídos
      expect(content).toContain('Valores não incluídos por segurança');
    });
  });

  describe('Relatório de Validação', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(VALIDATION_REPORT_PATH, 'utf-8');
    });

    it('deve conter o cabeçalho correto', () => {
      expect(content).toContain('# Relatório de Validação do Inventário');
    });

    it('deve indicar o status de validação', () => {
      expect(content).toMatch(/Status: (✅ VÁLIDO|❌ INVÁLIDO)/);
    });

    it('deve conter timestamp de geração', () => {
      expect(content).toContain('Gerado em:');
    });
  });

  describe('Validações Pré-Geração', () => {
    it('deve validar sem gerar documentos', () => {
      const result = execSync('npm run validate:inventory', {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('Validação concluída');
      expect(result).toContain('Nenhum documento foi gerado');
    });
  });

  describe('Geração Parcial', () => {
    it('deve gerar apenas documento principal', () => {
      // Remover arquivos existentes
      if (fs.existsSync(MAIN_DOC_PATH)) {
        fs.unlinkSync(MAIN_DOC_PATH);
      }
      if (fs.existsSync(SHORT_INDEX_PATH)) {
        fs.unlinkSync(SHORT_INDEX_PATH);
      }

      // Gerar apenas documento principal
      execSync('npm run generate:inventory:main', {
        cwd: WORKSPACE_ROOT,
        stdio: 'pipe'
      });

      // Verificar que apenas o documento principal foi criado
      expect(fs.existsSync(MAIN_DOC_PATH)).toBe(true);
      expect(fs.existsSync(SHORT_INDEX_PATH)).toBe(false);
    });

    it('deve gerar apenas índice compacto', () => {
      // Remover arquivos existentes
      if (fs.existsSync(MAIN_DOC_PATH)) {
        fs.unlinkSync(MAIN_DOC_PATH);
      }
      if (fs.existsSync(SHORT_INDEX_PATH)) {
        fs.unlinkSync(SHORT_INDEX_PATH);
      }

      // Gerar apenas índice compacto
      execSync('npm run generate:inventory:index', {
        cwd: WORKSPACE_ROOT,
        stdio: 'pipe'
      });

      // Verificar que apenas o índice foi criado
      expect(fs.existsSync(MAIN_DOC_PATH)).toBe(false);
      expect(fs.existsSync(SHORT_INDEX_PATH)).toBe(true);
    });
  });

  describe('Consistência entre Documentos', () => {
    let mainContent: string;
    let indexContent: string;

    beforeAll(() => {
      // Gerar ambos os documentos
      execSync('npm run generate:inventory', {
        cwd: WORKSPACE_ROOT,
        stdio: 'pipe'
      });

      mainContent = fs.readFileSync(MAIN_DOC_PATH, 'utf-8');
      indexContent = fs.readFileSync(SHORT_INDEX_PATH, 'utf-8');
    });

    it('deve ter a mesma região AWS em ambos', () => {
      const mainRegion = mainContent.match(/us-east-1/);
      const indexRegion = indexContent.match(/us-east-1/);

      expect(mainRegion).toBeTruthy();
      expect(indexRegion).toBeTruthy();
    });

    it('deve mencionar os mesmos backends em ambos', () => {
      const backends = ['Fibonacci', 'Nigredo', 'Painel Operacional'];

      for (const backend of backends) {
        expect(mainContent).toContain(backend);
        expect(indexContent).toContain(backend);
      }
    });

    it('deve ter timestamps próximos', () => {
      // Extrair timestamps (formato ISO)
      const mainTimestamp = mainContent.match(/\d{4}-\d{2}-\d{2}/);
      const indexTimestamp = indexContent.match(/\d{4}-\d{2}-\d{2}/);

      expect(mainTimestamp).toBeTruthy();
      expect(indexTimestamp).toBeTruthy();
      expect(mainTimestamp![0]).toBe(indexTimestamp![0]); // Mesma data
    });
  });

  describe('Sanitização de Segredos', () => {
    let mainContent: string;
    let indexContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_DOC_PATH, 'utf-8');
      indexContent = fs.readFileSync(SHORT_INDEX_PATH, 'utf-8');
    });

    it('não deve conter chaves AWS no documento principal', () => {
      expect(mainContent).not.toMatch(/AKIA[0-9A-Z]{16}(?!\*)/);
    });

    it('não deve conter chaves AWS no índice compacto', () => {
      expect(indexContent).not.toMatch(/AKIA[0-9A-Z]{16}(?!\*)/);
    });

    it('não deve conter tokens JWT completos', () => {
      expect(mainContent).not.toMatch(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+(?!\*)/);
      expect(indexContent).not.toMatch(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+(?!\*)/);
    });

    it('não deve conter URLs de banco com credenciais', () => {
      expect(mainContent).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/);
      expect(indexContent).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/);
    });
  });

  describe('Estrutura de Markdown', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_DOC_PATH, 'utf-8');
    });

    it('deve ter hierarquia de headers correta', () => {
      // Verificar que há headers de nível 1
      expect(mainContent).toMatch(/^# /m);

      // Verificar que há headers de nível 2
      expect(mainContent).toMatch(/^## /m);

      // Verificar que há headers de nível 3
      expect(mainContent).toMatch(/^### /m);
    });

    it('deve ter separadores entre seções principais', () => {
      expect(mainContent).toContain('---');
    });

    it('deve ter listas formatadas corretamente', () => {
      // Verificar que há listas com marcadores
      expect(mainContent).toMatch(/^- /m);
      expect(mainContent).toMatch(/^\d+\. /m);
    });

    it('deve ter blocos de código formatados', () => {
      // Verificar que há code blocks inline
      expect(mainContent).toMatch(/`[^`]+`/);
    });
  });
});
