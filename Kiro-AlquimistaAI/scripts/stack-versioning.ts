#!/usr/bin/env node

/**
 * Sistema de versionamento de stacks CDK
 * Permite manter histórico de versões e rollback
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudFormationClient, DescribeStacksCommand, ListStacksCommand } from '@aws-sdk/client-cloudformation';

interface StackVersion {
  version: string;
  timestamp: string;
  environment: string;
  stackName: string;
  templateHash: string;
  deployedBy: string;
  gitCommit?: string;
  description?: string;
}

interface VersionManifest {
  currentVersion: string;
  versions: StackVersion[];
}

class StackVersionManager {
  private s3: S3Client;
  private cloudformation: CloudFormationClient;
  private bucketName: string;

  constructor(bucketName: string) {
    this.s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    this.cloudformation = new CloudFormationClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.bucketName = bucketName;
  }

  /**
   * Cria nova versão da stack
   */
  async createVersion(
    stackName: string,
    environment: string,
    templatePath: string,
    description?: string
  ): Promise<string> {
    console.log(`📦 Criando nova versão para stack ${stackName} (${environment})`);

    // Gerar versão baseada em timestamp
    const version = this.generateVersion();
    
    // Calcular hash do template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const templateHash = this.calculateHash(templateContent);

    // Obter informações do Git (se disponível)
    const gitCommit = await this.getGitCommit();
    const deployedBy = process.env.USER || process.env.USERNAME || 'unknown';

    // Criar objeto de versão
    const stackVersion: StackVersion = {
      version,
      timestamp: new Date().toISOString(),
      environment,
      stackName,
      templateHash,
      deployedBy,
      gitCommit,
      description
    };

    // Salvar template no S3
    await this.saveTemplate(stackName, environment, version, templateContent);

    // Atualizar manifest
    await this.updateManifest(stackName, environment, stackVersion);

    console.log(`✅ Versão ${version} criada para ${stackName}`);
    return version;
  }

  /**
   * Lista versões disponíveis
   */
  async listVersions(stackName: string, environment: string): Promise<StackVersion[]> {
    try {
      const manifest = await this.getManifest(stackName, environment);
      return manifest.versions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.log(`📋 Nenhuma versão encontrada para ${stackName} (${environment})`);
      return [];
    }
  }

  /**
   * Obtém template de uma versão específica
   */
  async getVersionTemplate(
    stackName: string,
    environment: string,
    version: string
  ): Promise<string> {
    const key = `stacks/${stackName}/${environment}/versions/${version}/template.json`;
    
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3.send(command);
      return await response.Body!.transformToString();
    } catch (error) {
      throw new Error(`Template não encontrado para versão ${version}: ${error}`);
    }
  }

  /**
   * Executa rollback para versão anterior
   */
  async rollback(
    stackName: string,
    environment: string,
    targetVersion?: string
  ): Promise<void> {
    console.log(`🔄 Iniciando rollback para ${stackName} (${environment})`);

    const versions = await this.listVersions(stackName, environment);
    if (versions.length < 2) {
      throw new Error('Não há versões suficientes para rollback');
    }

    // Se não especificada, usar versão anterior
    const rollbackVersion = targetVersion || versions[1].version;
    
    console.log(`📋 Fazendo rollback para versão ${rollbackVersion}`);

    // Obter template da versão de rollback
    const template = await this.getVersionTemplate(stackName, environment, rollbackVersion);

    // Salvar template temporário
    const tempPath = path.join(process.cwd(), 'cdk.out', `${stackName}-rollback.template.json`);
    fs.writeFileSync(tempPath, template);

    console.log(`💾 Template de rollback salvo em: ${tempPath}`);
    console.log(`⚠️  Execute manualmente: cdk deploy --template ${tempPath}`);
  }

  /**
   * Limpa versões antigas (mantém últimas N versões)
   */
  async cleanupOldVersions(
    stackName: string,
    environment: string,
    keepVersions: number = 10
  ): Promise<void> {
    console.log(`🧹 Limpando versões antigas de ${stackName} (mantendo ${keepVersions})`);

    const versions = await this.listVersions(stackName, environment);
    const versionsToDelete = versions.slice(keepVersions);

    for (const version of versionsToDelete) {
      await this.deleteVersion(stackName, environment, version.version);
    }

    // Atualizar manifest
    const updatedManifest: VersionManifest = {
      currentVersion: versions[0]?.version || '',
      versions: versions.slice(0, keepVersions)
    };

    await this.saveManifest(stackName, environment, updatedManifest);
    
    console.log(`✅ ${versionsToDelete.length} versões antigas removidas`);
  }

  /**
   * Gera nova versão baseada em timestamp
   */
  private generateVersion(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `v${year}.${month}.${day}.${hour}${minute}`;
  }

  /**
   * Calcula hash SHA-256 do conteúdo
   */
  private calculateHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Obtém commit atual do Git
   */
  private async getGitCommit(): Promise<string | undefined> {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return undefined;
    }
  }

  /**
   * Salva template no S3
   */
  private async saveTemplate(
    stackName: string,
    environment: string,
    version: string,
    template: string
  ): Promise<void> {
    const key = `stacks/${stackName}/${environment}/versions/${version}/template.json`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: template,
      ContentType: 'application/json',
      Metadata: {
        stackName,
        environment,
        version,
        timestamp: new Date().toISOString()
      }
    });

    await this.s3.send(command);
  }

  /**
   * Obtém manifest do S3
   */
  private async getManifest(stackName: string, environment: string): Promise<VersionManifest> {
    const key = `stacks/${stackName}/${environment}/manifest.json`;
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3.send(command);
    const content = await response.Body!.transformToString();
    return JSON.parse(content);
  }

  /**
   * Salva manifest no S3
   */
  private async saveManifest(
    stackName: string,
    environment: string,
    manifest: VersionManifest
  ): Promise<void> {
    const key = `stacks/${stackName}/${environment}/manifest.json`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: 'application/json'
    });

    await this.s3.send(command);
  }

  /**
   * Atualiza manifest com nova versão
   */
  private async updateManifest(
    stackName: string,
    environment: string,
    newVersion: StackVersion
  ): Promise<void> {
    let manifest: VersionManifest;
    
    try {
      manifest = await this.getManifest(stackName, environment);
    } catch {
      manifest = {
        currentVersion: '',
        versions: []
      };
    }

    manifest.currentVersion = newVersion.version;
    manifest.versions.unshift(newVersion); // Adicionar no início

    await this.saveManifest(stackName, environment, manifest);
  }

  /**
   * Remove versão específica
   */
  private async deleteVersion(
    stackName: string,
    environment: string,
    version: string
  ): Promise<void> {
    const key = `stacks/${stackName}/${environment}/versions/${version}/template.json`;
    
    try {
      // Note: S3 DeleteObject não falha se objeto não existe
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3.send(command);
    } catch (error) {
      console.warn(`⚠️ Erro ao deletar versão ${version}: ${error}`);
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const bucketName = process.env.STACK_VERSIONS_BUCKET || 'fibonacci-stack-versions';

  const versionManager = new StackVersionManager(bucketName);

  switch (command) {
    case 'create':
      const stackName = process.argv[3];
      const environment = process.argv[4];
      const templatePath = process.argv[5];
      const description = process.argv[6];

      if (!stackName || !environment || !templatePath) {
        console.error('Uso: npm run stack:version create <stack-name> <environment> <template-path> [description]');
        process.exit(1);
      }

      await versionManager.createVersion(stackName, environment, templatePath, description);
      break;

    case 'list':
      const listStackName = process.argv[3];
      const listEnvironment = process.argv[4];

      if (!listStackName || !listEnvironment) {
        console.error('Uso: npm run stack:version list <stack-name> <environment>');
        process.exit(1);
      }

      const versions = await versionManager.listVersions(listStackName, listEnvironment);
      console.table(versions.map(v => ({
        Version: v.version,
        Timestamp: v.timestamp,
        'Deployed By': v.deployedBy,
        'Git Commit': v.gitCommit?.substring(0, 8) || 'N/A',
        Description: v.description || 'N/A'
      })));
      break;

    case 'rollback':
      const rollbackStackName = process.argv[3];
      const rollbackEnvironment = process.argv[4];
      const targetVersion = process.argv[5];

      if (!rollbackStackName || !rollbackEnvironment) {
        console.error('Uso: npm run stack:version rollback <stack-name> <environment> [target-version]');
        process.exit(1);
      }

      await versionManager.rollback(rollbackStackName, rollbackEnvironment, targetVersion);
      break;

    case 'cleanup':
      const cleanupStackName = process.argv[3];
      const cleanupEnvironment = process.argv[4];
      const keepVersions = parseInt(process.argv[5]) || 10;

      if (!cleanupStackName || !cleanupEnvironment) {
        console.error('Uso: npm run stack:version cleanup <stack-name> <environment> [keep-versions]');
        process.exit(1);
      }

      await versionManager.cleanupOldVersions(cleanupStackName, cleanupEnvironment, keepVersions);
      break;

    default:
      console.log('Comandos disponíveis:');
      console.log('  create   - Criar nova versão');
      console.log('  list     - Listar versões');
      console.log('  rollback - Fazer rollback');
      console.log('  cleanup  - Limpar versões antigas');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
}

export { StackVersionManager };