/**
 * Testes de Propriedade para o Analisador de Banco de Dados
 * 
 * **Feature: system-inventory-documentation, Property 5: Completude de Migrations**
 * **Valida: Requirements 2.3**
 * 
 * Testa a correspondência entre arquivos SQL de migrations e documentação.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import {
  analyzeDatabaseStructure,
  readMigrationReadme,
  extractTablesFromMigration,
  extractFunctionsFromMigration
} from '../../../scripts/inventory/analyzers/database-analyzer';

describe('Analisador de Banco de Dados', () => {
  const workspaceRoot = process.cwd();

  describe('Testes Unitários', () => {
    it('deve analisar a estrutura do banco de dados', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);

      expect(result).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.database.engine).toBeTruthy();
      expect(result.database.mode).toBeTruthy();
      expect(result.database.region).toBeTruthy();
      expect(Array.isArray(result.database.schemas)).toBe(true);
      expect(Array.isArray(result.database.migrations)).toBe(true);
      expect(Array.isArray(result.database.decisions)).toBe(true);
    });

    it('deve identificar o engine como aurora-postgresql', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);
      expect(result.database.engine).toBe('aurora-postgresql');
    });

    it('deve identificar o modo como Serverless v2', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);
      expect(result.database.mode).toBe('Serverless v2');
    });

    it('deve identificar a região como us-east-1', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);
      expect(result.database.region).toBe('us-east-1');
    });

    it('deve identificar schemas principais', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);
      const schemas = result.database.schemas;

      // Schemas conhecidos do projeto
      const expectedSchemas = ['alquimista_platform', 'fibonacci_core', 'nigredo_leads'];
      
      for (const schema of expectedSchemas) {
        expect(schemas).toContain(schema);
      }
    });

    it('deve listar todas as migrations oficiais', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);
      const migrations = result.database.migrations;

      // Deve ter pelo menos as migrations principais (001-015)
      expect(migrations.length).toBeGreaterThanOrEqual(15);

      // Migrations devem ter números sequenciais
      const numbers = migrations.map(m => parseInt(m.number)).sort((a, b) => a - b);
      expect(numbers[0]).toBe(1);
    });

    it('deve incluir decisões técnicas conhecidas', async () => {
      const result = await analyzeDatabaseStructure(workspaceRoot);
      const decisions = result.database.decisions;

      // Deve ter pelo menos algumas decisões
      expect(decisions.length).toBeGreaterThan(0);

      // Deve incluir decisão sobre Aurora Serverless v2
      const hasAuroraDecision = decisions.some(
        d => d.includes('Aurora') || d.includes('Serverless')
      );
      expect(hasAuroraDecision).toBe(true);
    });

    it('deve extrair tabelas de uma migration', () => {
      const tables = extractTablesFromMigration(workspaceRoot, '007_create_nigredo_schema.sql');
      
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
      
      // Tabelas conhecidas da migration 007
      expect(tables).toContain('nigredo_leads.form_submissions');
      expect(tables).toContain('nigredo_leads.webhook_logs');
      expect(tables).toContain('nigredo_leads.rate_limits');
    });

    it('deve extrair funções de uma migration', () => {
      const functions = extractFunctionsFromMigration(workspaceRoot, '007_create_nigredo_schema.sql');
      
      expect(Array.isArray(functions)).toBe(true);
      expect(functions.length).toBeGreaterThan(0);
      
      // Funções conhecidas da migration 007
      expect(functions).toContain('cleanup_old_rate_limits');
      expect(functions).toContain('check_rate_limit');
      expect(functions).toContain('increment_rate_limit');
    });

    it('deve ler README de migration quando existir', () => {
      const readme = readMigrationReadme(workspaceRoot, '007');
      
      if (readme) {
        expect(readme).toBeTruthy();
        expect(readme.length).toBeGreaterThan(0);
        expect(readme).toContain('Migration 007');
      }
    });
  });

  describe('Property 5: Completude de Migrations', () => {
    /**
     * **Feature: system-inventory-documentation, Property 5: Completude de Migrations**
     * **Valida: Requirements 2.3**
     * 
     * Para qualquer migration listada, deve haver correspondência entre o arquivo SQL
     * e a entrada na documentação.
     */
    it('deve ter correspondência entre arquivos SQL e documentação', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const migrations = result.database.migrations;

            // Para cada migration
            for (const migration of migrations) {
              // 1. O arquivo SQL deve existir
              const sqlPath = path.join(root, 'database', 'migrations', migration.filename);
              const sqlExists = fs.existsSync(sqlPath);
              
              if (!sqlExists) {
                throw new Error(`Arquivo SQL não encontrado: ${migration.filename}`);
              }

              // 2. Deve ter um número válido
              expect(migration.number).toMatch(/^\d+$/);

              // 3. Deve ter um resumo não vazio
              expect(migration.summary).toBeTruthy();
              expect(migration.summary.length).toBeGreaterThan(0);

              // 4. Deve ter um status válido
              expect(['applied', 'pending', 'skip']).toContain(migration.status);

              // 5. Se for migration >= 007, deve ter README (ou warning)
              if (parseInt(migration.number) >= 7) {
                const readmePath = path.join(
                  root,
                  'database',
                  'migrations',
                  `README-${migration.number}.md`
                );
                const hasReadme = fs.existsSync(readmePath);

                if (!hasReadme) {
                  // Deve ter um warning sobre README faltando
                  const hasWarning = result.warnings.some(
                    w => w.includes(migration.number) && w.includes('README')
                  );
                  expect(hasWarning).toBe(true);
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: Todas as migrations devem ter números únicos
     */
    it('deve ter números de migration únicos', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const migrations = result.database.migrations;

            const numbers = migrations.map(m => m.number);
            const uniqueNumbers = new Set(numbers);

            // Todos os números devem ser únicos
            expect(uniqueNumbers.size).toBe(numbers.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: Migrations devem estar em ordem sequencial
     */
    it('deve ter migrations em ordem sequencial', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const migrations = result.database.migrations;

            // Ordenar por número
            const sorted = [...migrations].sort((a, b) => 
              parseInt(a.number) - parseInt(b.number)
            );

            // Verificar se está em ordem
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = parseInt(sorted[i].number);
              const next = parseInt(sorted[i + 1].number);
              
              // Próxima migration deve ser maior que a atual
              expect(next).toBeGreaterThan(current);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: Schemas extraídos devem ser válidos
     */
    it('deve extrair apenas schemas válidos', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const schemas = result.database.schemas;

            // Todos os schemas devem seguir convenção de nomenclatura
            for (const schema of schemas) {
              // Schema deve ser snake_case ou lowercase
              expect(schema).toMatch(/^[a-z][a-z0-9_]*$/);
              
              // Não deve estar vazio
              expect(schema.length).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: Decisões devem ser strings não vazias
     */
    it('deve ter decisões como strings não vazias', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const decisions = result.database.decisions;

            for (const decision of decisions) {
              // Decisão deve ser string não vazia
              expect(typeof decision).toBe('string');
              expect(decision.length).toBeGreaterThan(0);
              expect(decision.trim()).toBe(decision); // Não deve ter espaços nas pontas
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: Tabelas extraídas devem ter formato válido
     */
    it('deve extrair tabelas com formato válido', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const migrations = result.database.migrations;

            for (const migration of migrations) {
              const tables = extractTablesFromMigration(root, migration.filename);

              for (const table of tables) {
                // Tabela deve ser schema.table ou table
                expect(table).toMatch(/^([a-z_]+\.)?[a-z_]+$/);
                
                // Não deve estar vazia
                expect(table.length).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: Funções extraídas devem ter formato válido
     */
    it('deve extrair funções com formato válido', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const migrations = result.database.migrations;

            for (const migration of migrations) {
              const functions = extractFunctionsFromMigration(root, migration.filename);

              for (const func of functions) {
                // Função deve ser snake_case
                expect(func).toMatch(/^[a-z][a-z0-9_]*$/);
                
                // Não deve estar vazia
                expect(func.length).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Propriedade: READMEs devem conter informações sobre a migration
     */
    it('deve ter READMEs com informações relevantes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(workspaceRoot),
          async (root) => {
            const result = await analyzeDatabaseStructure(root);
            const migrations = result.database.migrations;

            for (const migration of migrations) {
              const readme = readMigrationReadme(root, migration.number);

              if (readme) {
                // README deve mencionar o número da migration
                expect(readme).toContain(migration.number);
                
                // README deve ter conteúdo substancial (> 100 caracteres)
                expect(readme.length).toBeGreaterThan(100);
                
                // README deve ter seções (indicadas por ##)
                expect(readme).toMatch(/##/);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
