/**
 * Lambda Migration Runner - Aurora PostgreSQL
 * 
 * Executa migrations SQL no Aurora PostgreSQL de dentro da VPC.
 * Elimina necessidade de acesso direto ao banco via psql local.
 * 
 * Uso:
 * - Invocar com payload: { "action": "run-migration", "target": "017" }
 * - Ou: { "action": "run-migration", "target": "all" }
 */

import { Handler } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationEvent {
  action: 'run-migration' | 'list-migrations';
  target?: string; // '017' ou 'all'
}

interface MigrationResult {
  status: 'success' | 'error';
  migration?: string;
  message: string;
  executedMigrations?: string[];
  error?: string;
}

interface DbCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Busca credenciais do Aurora no Secrets Manager
 */
async function getDbCredentials(): Promise<DbCredentials> {
  const secretArn = process.env.DB_SECRET_ARN;
  
  if (!secretArn) {
    throw new Error('DB_SECRET_ARN environment variable not set');
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    const secret = JSON.parse(response.SecretString);
    
    return {
      host: secret.host,
      port: secret.port || 5432,
      database: secret.dbname || secret.database,
      username: secret.username,
      password: secret.password
    };
  } catch (error) {
    console.error('Error fetching DB credentials:', error);
    throw new Error(`Failed to fetch DB credentials: ${error}`);
  }
}

/**
 * Conecta ao Aurora PostgreSQL
 */
async function connectToDatabase(credentials: DbCredentials): Promise<Client> {
  const client = new Client({
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    user: credentials.username,
    password: credentials.password,
    ssl: {
      rejectUnauthorized: false // Aurora usa SSL auto-assinado
    },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Connected to Aurora PostgreSQL');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to Aurora:', error);
    throw new Error(`Database connection failed: ${error}`);
  }
}

/**
 * Lê arquivo de migration
 */
function readMigrationFile(migrationNumber: string): string {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir);
  
  // Procurar arquivo que começa com o número da migration
  const migrationFile = files.find(f => f.startsWith(`${migrationNumber}_`) && f.endsWith('.sql'));
  
  if (!migrationFile) {
    throw new Error(`Migration file not found for number: ${migrationNumber}`);
  }

  const filePath = path.join(migrationsDir, migrationFile);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Executa uma migration SQL
 */
async function executeMigration(
  client: Client,
  migrationNumber: string
): Promise<void> {
  console.log(`📄 Executing migration ${migrationNumber}...`);
  
  const sql = readMigrationFile(migrationNumber);
  
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(`✅ Migration ${migrationNumber} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${migrationNumber} failed:`, error);
    throw error;
  }
}

/**
 * Lista migrations disponíveis
 */
function listAvailableMigrations(): string[] {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir);
  
  return files
    .filter(f => f.endsWith('.sql'))
    .map(f => f.split('_')[0])
    .sort();
}

/**
 * Handler principal da Lambda
 */
export const handler: Handler<MigrationEvent, MigrationResult> = async (event) => {
  console.log('📥 Received event:', JSON.stringify(event, null, 2));

  try {
    // Listar migrations disponíveis
    if (event.action === 'list-migrations') {
      const migrations = listAvailableMigrations();
      return {
        status: 'success',
        message: 'Available migrations listed',
        executedMigrations: migrations
      };
    }

    // Executar migration(s)
    if (event.action === 'run-migration') {
      const target = event.target || '017';
      
      // Buscar credenciais
      console.log('🔐 Fetching database credentials...');
      const credentials = await getDbCredentials();
      
      // Conectar ao banco
      console.log('🔌 Connecting to Aurora...');
      const client = await connectToDatabase(credentials);
      
      try {
        if (target === 'all') {
          // Executar todas as migrations disponíveis
          const migrations = listAvailableMigrations();
          const executed: string[] = [];
          
          for (const migration of migrations) {
            await executeMigration(client, migration);
            executed.push(migration);
          }
          
          return {
            status: 'success',
            message: `All migrations executed successfully`,
            executedMigrations: executed
          };
        } else {
          // Executar migration específica
          await executeMigration(client, target);
          
          return {
            status: 'success',
            migration: target,
            message: `Migration ${target} executed successfully`
          };
        }
      } finally {
        await client.end();
        console.log('🔌 Database connection closed');
      }
    }

    return {
      status: 'error',
      message: 'Invalid action. Use "run-migration" or "list-migrations"'
    };

  } catch (error) {
    console.error('❌ Error:', error);
    
    return {
      status: 'error',
      message: 'Migration execution failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
