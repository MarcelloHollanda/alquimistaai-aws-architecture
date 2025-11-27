#!/usr/bin/env node

/**
 * Database Migration Script
 * Purpose: Execute SQL migrations against Aurora PostgreSQL
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 * 
 * Usage:
 *   node scripts/migrate.js [options]
 * 
 * Options:
 *   --env <environment>    Environment (dev|staging|prod) - default: dev
 *   --dry-run             Show migrations without executing
 *   --rollback            Rollback last migration (not implemented yet)
 * 
 * Environment Variables:
 *   DB_SECRET_ARN         ARN of the Secrets Manager secret with DB credentials
 *   DB_CLUSTER_ARN        ARN of the Aurora cluster
 *   AWS_REGION            AWS region - default: us-east-1
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  migrationsDir: path.join(__dirname, '..', 'database', 'migrations'),
  region: process.env.AWS_REGION || 'us-east-1',
  secretArn: process.env.DB_SECRET_ARN,
  clusterArn: process.env.DB_CLUSTER_ARN,
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  env: 'dev',
  dryRun: false,
  rollback: false,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--env' && args[i + 1]) {
    options.env = args[i + 1];
    i++;
  } else if (args[i] === '--dry-run') {
    options.dryRun = true;
  } else if (args[i] === '--rollback') {
    options.rollback = true;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get database credentials from AWS Secrets Manager
 */
async function getDatabaseCredentials() {
  console.log('📡 Fetching database credentials from Secrets Manager...');
  
  if (!CONFIG.secretArn) {
    throw new Error('DB_SECRET_ARN environment variable is required');
  }

  const client = new SecretsManagerClient({ region: CONFIG.region });
  
  try {
    const command = new GetSecretValueCommand({
      SecretId: CONFIG.secretArn,
    });
    
    const response = await client.send(command);
    const secret = JSON.parse(response.SecretString);
    
    console.log('✅ Credentials retrieved successfully');
    
    return {
      host: secret.host,
      port: secret.port || 5432,
      database: secret.dbname || 'fibonacci',
      user: secret.username,
      password: secret.password,
    };
  } catch (error) {
    console.error('❌ Failed to retrieve credentials:', error.message);
    throw error;
  }
}

/**
 * Create database connection
 */
async function createConnection(credentials) {
  console.log(`🔌 Connecting to database: ${credentials.host}:${credentials.port}/${credentials.database}`);
  
  const client = new Client({
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    user: credentials.user,
    password: credentials.password,
    ssl: {
      rejectUnauthorized: false, // Required for Aurora
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Database connection established');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  console.log(`📂 Reading migrations from: ${CONFIG.migrationsDir}`);
  
  if (!fs.existsSync(CONFIG.migrationsDir)) {
    throw new Error(`Migrations directory not found: ${CONFIG.migrationsDir}`);
  }

  const files = fs.readdirSync(CONFIG.migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure correct order (001, 002, 003, etc.)

  console.log(`📋 Found ${files.length} migration files`);
  return files;
}

/**
 * Get list of applied migrations from database
 */
async function getAppliedMigrations(client) {
  try {
    const result = await client.query(
      'SELECT migration_name FROM public.migrations ORDER BY applied_at'
    );
    return result.rows.map(row => row.migration_name);
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.log('ℹ️  Migrations table does not exist yet (will be created)');
      return [];
    }
    throw error;
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(client, filename, dryRun = false) {
  const filePath = path.join(CONFIG.migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  const migrationName = filename.replace('.sql', '');
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 Migration: ${migrationName}`);
  console.log(`${'='.repeat(80)}`);

  if (dryRun) {
    console.log('🔍 DRY RUN - SQL Preview:');
    console.log(sql.substring(0, 500) + '...\n');
    return;
  }

  try {
    // Execute migration within a transaction
    await client.query('BEGIN');
    
    console.log('⚙️  Executing SQL...');
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log(`✅ Migration ${migrationName} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${migrationName} failed:`, error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigrations() {
  console.log('\n🚀 Starting Database Migration');
  console.log(`Environment: ${options.env}`);
  console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log('');

  let client;

  try {
    // Get database credentials
    const credentials = await getDatabaseCredentials();
    
    // Connect to database
    client = await createConnection(credentials);
    
    // Get migration files
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found');
      return;
    }

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(client);
    console.log(`✅ ${appliedMigrations.length} migrations already applied\n`);

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => {
      const migrationName = file.replace('.sql', '');
      return !appliedMigrations.includes(migrationName);
    });

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!');
      return;
    }

    console.log(`📋 ${pendingMigrations.length} pending migrations:\n`);
    pendingMigrations.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    // Execute pending migrations
    for (const file of pendingMigrations) {
      await executeMigration(client, file, options.dryRun);
    }

    console.log('\n' + '='.repeat(80));
    if (options.dryRun) {
      console.log('🔍 DRY RUN COMPLETE - No changes were made');
    } else {
      console.log('✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY');
    }
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// ============================================================================
// Rollback Function (Future Implementation)
// ============================================================================

async function rollbackMigration() {
  console.log('⚠️  Rollback functionality not yet implemented');
  console.log('To rollback manually:');
  console.log('1. Connect to the database');
  console.log('2. Execute the reverse SQL statements');
  console.log('3. Delete the migration record from public.migrations table');
  process.exit(1);
}

// ============================================================================
// Entry Point
// ============================================================================

if (options.rollback) {
  rollbackMigration();
} else {
  runMigrations();
}
