/**
 * Exporta todos os analisadores de código
 */
export { CodeAnalyzer } from './code-analyzer';
export { analyzeCdkInfrastructure } from './cdk-analyzer';
export type { CdkAnalyzerResult } from './cdk-analyzer';
export { analyzeDatabaseStructure, readMigrationReadme, extractTablesFromMigration, extractFunctionsFromMigration } from './database-analyzer';
export type { DatabaseAnalyzerResult } from './database-analyzer';
export { 
  analyzeFibonacciApi, 
  analyzeNigredoApi, 
  analyzeOperationalDashboardApi, 
  analyzeAlquimistaPlatformApi,
  analyzeAllApis 
} from './api-analyzer';
export { analyzeFrontend } from './frontend-analyzer';
export { analyzeAuthentication } from './auth-analyzer';
export { analyzeCiCd, generateCiCdSummary } from './cicd-analyzer';
export { analyzeGuardrails } from './guardrails-analyzer';
