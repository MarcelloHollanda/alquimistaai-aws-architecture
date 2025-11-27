/**
 * Analisador de Banco de Dados
 * 
 * Extrai informações sobre o banco de dados Aurora PostgreSQL,
 * migrations, schemas e decisões técnicas.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { DatabaseInfo, MigrationInfo, MigrationStatus } from '../types';

export interface DatabaseAnalyzerResult {
  database: DatabaseInfo;
  warnings: string[];
  errors: string[];
}

/**
 * Analisa o banco de dados e migrations do projeto
 */
export async function analyzeDatabaseStructure(
  workspaceRoot: string
): Promise<DatabaseAnalyzerResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Ler informações do README principal
  const readmePath = path.join(workspaceRoot, 'database', 'README.md');
  let readmeContent = '';
  
  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf-8');
  } else {
    warnings.push('database/README.md não encontrado');
  }

  // Extrair informações básicas
  const engine = extractEngine(readmeContent);
  const mode = extractMode(readmeContent);
  const region = extractRegion(readmeContent);

  // Analisar migrations
  const migrationsPath = path.join(workspaceRoot, 'database', 'migrations');
  const migrations = await analyzeMigrations(migrationsPath, warnings, errors);

  // Extrair schemas
  const schemas = extractSchemas(migrations, readmeContent);

  // Extrair decisões conhecidas
  const decisions = extractDecisions(readmeContent, migrations);

  const database: DatabaseInfo = {
    engine,
    mode,
    region,
    schemas,
    migrations,
    decisions
  };

  return {
    database,
    warnings,
    errors
  };
}

/**
 * Extrai o engine do banco de dados
 */
function extractEngine(readmeContent: string): string {
  // Procurar por "Aurora PostgreSQL" ou similar
  if (readmeContent.includes('Aurora PostgreSQL')) {
    return 'aurora-postgresql';
  }
  
  if (readmeContent.includes('PostgreSQL')) {
    return 'postgresql';
  }

  if (readmeContent.includes('Aurora MySQL')) {
    return 'aurora-mysql';
  }

  return 'aurora-postgresql'; // Default baseado no contexto do projeto
}

/**
 * Extrai o modo do banco de dados
 */
function extractMode(readmeContent: string): string {
  if (readmeContent.includes('Serverless v2')) {
    return 'Serverless v2';
  }

  if (readmeContent.includes('Serverless')) {
    return 'Serverless';
  }

  if (readmeContent.includes('Provisioned')) {
    return 'Provisioned';
  }

  return 'Serverless v2'; // Default baseado no contexto do projeto
}

/**
 * Extrai a região AWS
 */
function extractRegion(readmeContent: string): string {
  const regionMatch = readmeContent.match(/Região[:\s]+([a-z]{2}-[a-z]+-\d+)/i);
  if (regionMatch) {
    return regionMatch[1];
  }

  // Procurar por us-east-1 especificamente
  if (readmeContent.includes('us-east-1')) {
    return 'us-east-1';
  }

  return 'us-east-1'; // Default baseado no contexto do projeto
}

/**
 * Analisa todas as migrations do projeto
 */
async function analyzeMigrations(
  migrationsPath: string,
  warnings: string[],
  errors: string[]
): Promise<MigrationInfo[]> {
  const migrations: MigrationInfo[] = [];

  if (!fs.existsSync(migrationsPath)) {
    errors.push(`Diretório de migrations não encontrado: ${migrationsPath}`);
    return migrations;
  }

  // Buscar todos os arquivos .sql (exceto _ARCHIVE_)
  const sqlFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql') && !file.startsWith('_ARCHIVE_'))
    .sort();

  for (const filename of sqlFiles) {
    const filePath = path.join(migrationsPath, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extrair número da migration
    const numberMatch = filename.match(/^(\d+)_/);
    const number = numberMatch ? numberMatch[1] : '000';

    // Extrair resumo do conteúdo
    const summary = extractMigrationSummary(content, filename);

    // Determinar status
    const status = determineMigrationStatus(number, filename, content);

    // Verificar se existe README correspondente
    const readmePath = path.join(migrationsPath, `README-${number}.md`);
    const hasReadme = fs.existsSync(readmePath);

    if (!hasReadme && parseInt(number) >= 7) {
      warnings.push(`Migration ${number} não possui README correspondente`);
    }

    migrations.push({
      number,
      filename,
      summary,
      status
    });
  }

  // Verificar migration 009 duplicada (baseado em documentação conhecida)
  // Nota: A migration 009 não é realmente duplicada, mas tem tabelas similares à 008
  // Mantemos ambas como 'applied' pois servem propósitos diferentes

  return migrations;
}

/**
 * Extrai o resumo de uma migration
 */
function extractMigrationSummary(content: string, filename: string): string {
  // Procurar por comentário de propósito
  const purposeMatch = content.match(/--\s*Purpose:\s*(.+)/i);
  if (purposeMatch) {
    return purposeMatch[1].trim();
  }

  // Procurar por comentário de descrição
  const descMatch = content.match(/--\s*Description:\s*(.+)/i);
  if (descMatch) {
    return descMatch[1].trim();
  }

  // Procurar por comentário de migration
  const migrationMatch = content.match(/--\s*Migration\s+\d+:\s*(.+)/i);
  if (migrationMatch) {
    return migrationMatch[1].trim();
  }

  // Tentar inferir do nome do arquivo
  const nameWithoutNumber = filename.replace(/^\d+_/, '').replace(/\.sql$/, '');
  return nameWithoutNumber
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Determina o status de uma migration
 */
function determineMigrationStatus(
  number: string,
  filename: string,
  content: string
): MigrationStatus {
  // Migrations arquivadas
  if (filename.startsWith('_ARCHIVE_')) {
    return 'skip';
  }

  // Por padrão, considerar como aplicada se for uma migration oficial
  // (em produção, isso seria verificado consultando o banco)
  return 'applied';
}

/**
 * Extrai schemas do banco de dados
 */
function extractSchemas(migrations: MigrationInfo[], readmeContent: string): string[] {
  const schemas = new Set<string>();

  // Schemas conhecidos do README
  const schemaMatches = readmeContent.matchAll(/['"`]([a-z_]+)['"`]\s*-\s*Schema/gi);
  for (const match of schemaMatches) {
    schemas.add(match[1]);
  }

  // Procurar por CREATE SCHEMA nas migrations
  for (const migration of migrations) {
    const migrationPath = path.join(
      process.cwd(),
      'database',
      'migrations',
      migration.filename
    );

    if (fs.existsSync(migrationPath)) {
      const content = fs.readFileSync(migrationPath, 'utf-8');
      const createSchemaMatches = content.matchAll(/CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi);
      
      for (const match of createSchemaMatches) {
        schemas.add(match[1]);
      }
    }
  }

  // Schemas conhecidos do projeto
  const knownSchemas = [
    'alquimista_platform',
    'fibonacci_core',
    'nigredo_leads',
    'public'
  ];

  for (const schema of knownSchemas) {
    if (readmeContent.includes(schema)) {
      schemas.add(schema);
    }
  }

  return Array.from(schemas).sort();
}

/**
 * Extrai decisões técnicas conhecidas
 */
function extractDecisions(readmeContent: string, migrations: MigrationInfo[]): string[] {
  const decisions: string[] = [];

  // Decisão sobre migration 009
  const migration009 = migrations.find(m => m.number === '009');
  if (migration009 && migration009.status === 'skip') {
    decisions.push('Migration 009 deve ser pulada (duplicada da 008)');
  }

  // Decisão sobre Supabase
  if (readmeContent.includes('Supabase') && readmeContent.includes('legado')) {
    decisions.push('Supabase é considerado legado/lab - Aurora é o fluxo oficial');
  }

  // Decisão sobre Aurora Serverless v2
  if (readmeContent.includes('Serverless v2')) {
    decisions.push('Uso de Aurora Serverless v2 para escalabilidade automática');
  }

  // Decisão sobre região
  if (readmeContent.includes('us-east-1')) {
    decisions.push('Região principal: us-east-1');
  }

  // Decisão sobre multi-tenant
  if (readmeContent.includes('multi-tenant') || readmeContent.includes('tenants')) {
    decisions.push('Arquitetura multi-tenant com isolamento por tenant_id');
  }

  // Procurar por seções de decisões no README
  const decisionsSection = readmeContent.match(/##\s*Decisões[^#]*/i);
  if (decisionsSection) {
    const lines = decisionsSection[0].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const decision = trimmed.replace(/^[-*]\s*/, '').trim();
        if (decision && !decisions.includes(decision)) {
          decisions.push(decision);
        }
      }
    }
  }

  return decisions;
}

/**
 * Lê o conteúdo de um README de migration
 */
export function readMigrationReadme(
  workspaceRoot: string,
  migrationNumber: string
): string | null {
  const readmePath = path.join(
    workspaceRoot,
    'database',
    'migrations',
    `README-${migrationNumber}.md`
  );

  if (fs.existsSync(readmePath)) {
    return fs.readFileSync(readmePath, 'utf-8');
  }

  return null;
}

/**
 * Extrai tabelas criadas por uma migration
 */
export function extractTablesFromMigration(
  workspaceRoot: string,
  migrationFilename: string
): string[] {
  const tables: string[] = [];
  const migrationPath = path.join(
    workspaceRoot,
    'database',
    'migrations',
    migrationFilename
  );

  if (!fs.existsSync(migrationPath)) {
    return tables;
  }

  const content = fs.readFileSync(migrationPath, 'utf-8');

  // Procurar por CREATE TABLE
  const createTableMatches = content.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+\.[a-z_]+|[a-z_]+)/gi
  );

  for (const match of createTableMatches) {
    tables.push(match[1]);
  }

  return tables;
}

/**
 * Extrai funções criadas por uma migration
 */
export function extractFunctionsFromMigration(
  workspaceRoot: string,
  migrationFilename: string
): string[] {
  const functions: string[] = [];
  const migrationPath = path.join(
    workspaceRoot,
    'database',
    'migrations',
    migrationFilename
  );

  if (!fs.existsSync(migrationPath)) {
    return functions;
  }

  const content = fs.readFileSync(migrationPath, 'utf-8');

  // Procurar por CREATE FUNCTION
  const createFunctionMatches = content.matchAll(
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-z_]+)\s*\(/gi
  );

  for (const match of createFunctionMatches) {
    functions.push(match[1]);
  }

  return functions;
}
