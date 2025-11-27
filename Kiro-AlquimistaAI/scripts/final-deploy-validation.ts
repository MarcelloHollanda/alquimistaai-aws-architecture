#!/usr/bin/env node

/**
 * Script de validação final e deploy para produção
 * Executa todas as verificações necessárias antes do deploy
 */

import { CloudFormationClient, DescribeStacksCommand, ListStacksCommand } from '@aws-sdk/client-cloudformation';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { LambdaClient, ListFunctionsCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { S3Client, ListBucketsCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { execSync } from 'child_process';

interface ValidationResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

class FinalDeployValidator {
  private cloudformation: CloudFormationClient;
  private cloudwatch: CloudWatchClient;
  private lambda: LambdaClient;
  private rds: RDSClient;
  private s3: S3Client;
  private results: ValidationResult[] = [];

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.cloudformation = new CloudFormationClient({ region });
    this.cloudwatch = new CloudWatchClient({ region });
    this.lambda = new LambdaClient({ region });
    this.rds = new RDSClient({ region });
    this.s3 = new S3Client({ region });
  }

  /**
   * Executa todas as validações
   */
  async runValidation(): Promise<boolean> {
    console.log('🚀 Iniciando validação final para deploy de produção...\n');

    try {
      // 1. Validações de código
      await this.validateCode();

      // 2. Validações de infraestrutura
      await this.validateInfrastructure();

      // 3. Validações de segurança
      await this.validateSecurity();

      // 4. Validações de monitoramento
      await this.validateMonitoring();

      // 5. Validações de backup
      await this.validateBackups();

      // 6. Smoke tests
      await this.runSmokeTests();

      // Relatório final
      this.printReport();

      return this.isValidationSuccessful();

    } catch (error) {
      console.error('💥 Erro durante validação:', error);
      return false;
    }
  }

  /**
   * Validações de código
   */
  private async validateCode(): Promise<void> {
    console.log('📝 Validando código...');

    try {
      // Build
      execSync('npm run build', { stdio: 'pipe' });
      this.addResult('Build', 'PASS', 'Código compilado com sucesso');
    } catch (error) {
      this.addResult('Build', 'FAIL', 'Falha na compilação', error);
    }

    try {
      // Linter
      execSync('npm run lint', { stdio: 'pipe' });
      this.addResult('Linter', 'PASS', 'Código segue padrões estabelecidos');
    } catch (error) {
      this.addResult('Linter', 'FAIL', 'Código não segue padrões', error);
    }

    try {
      // Testes
      execSync('npm test', { stdio: 'pipe' });
      this.addResult('Tests', 'PASS', 'Todos os testes passaram');
    } catch (error) {
      this.addResult('Tests', 'FAIL', 'Alguns testes falharam', error);
    }

    try {
      // Security scan
      execSync('npm run security:scan', { stdio: 'pipe' });
      this.addResult('Security Scan', 'PASS', 'Nenhuma vulnerabilidade encontrada');
    } catch (error) {
      this.addResult('Security Scan', 'WARN', 'Vulnerabilidades encontradas', error);
    }
  }

  /**
   * Validações de infraestrutura
   */
  private async validateInfrastructure(): Promise<void> {
    console.log('🏗️ Validando infraestrutura...');

    // Verificar stacks existentes
    await this.validateStacks();

    // Verificar funções Lambda
    await this.validateLambdas();

    // Verificar banco de dados
    await this.validateDatabase();

    // Verificar buckets S3
    await this.validateS3Buckets();
  }

  /**
   * Validar stacks CloudFormation
   */
  private async validateStacks(): Promise<void> {
    const expectedStacks = [
      'FibonacciStack-prod',
      'NigredoStack-prod',
      'AlquimistaStack-prod'
    ];

    try {
      const command = new ListStacksCommand({
        StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
      });
      const response = await this.cloudformation.send(command);

      const existingStacks = response.StackSummaries?.map(s => s.StackName) || [];
      const missingStacks = expectedStacks.filter(stack => !existingStacks.includes(stack));

      if (missingStacks.length === 0) {
        this.addResult('CloudFormation Stacks', 'PASS', 'Todas as stacks estão deployadas');
      } else {
        this.addResult('CloudFormation Stacks', 'FAIL', `Stacks faltando: ${missingStacks.join(', ')}`);
      }
    } catch (error) {
      this.addResult('CloudFormation Stacks', 'FAIL', 'Erro ao verificar stacks', error);
    }
  }

  /**
   * Validar funções Lambda
   */
  private async validateLambdas(): Promise<void> {
    const expectedFunctions = [
      'fibonacci-api-handler-prod',
      'nigredo-recebimento-prod',
      'nigredo-estrategia-prod',
      'nigredo-disparo-prod',
      'nigredo-atendimento-prod',
      'nigredo-sentimento-prod',
      'nigredo-agendamento-prod',
      'nigredo-relatorios-prod'
    ];

    try {
      const command = new ListFunctionsCommand({});
      const response = await this.lambda.send(command);

      const existingFunctions = response.Functions?.map(f => f.FunctionName) || [];
      const missingFunctions = expectedFunctions.filter(func => !existingFunctions.includes(func));

      if (missingFunctions.length === 0) {
        this.addResult('Lambda Functions', 'PASS', 'Todas as funções Lambda estão deployadas');
      } else {
        this.addResult('Lambda Functions', 'FAIL', `Funções faltando: ${missingFunctions.join(', ')}`);
      }

      // Verificar configuração das funções críticas
      for (const funcName of ['fibonacci-api-handler-prod']) {
        await this.validateLambdaConfig(funcName);
      }
    } catch (error) {
      this.addResult('Lambda Functions', 'FAIL', 'Erro ao verificar funções Lambda', error);
    }
  }

  /**
   * Validar configuração específica de uma Lambda
   */
  private async validateLambdaConfig(functionName: string): Promise<void> {
    try {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await this.lambda.send(command);

      const config = response.Configuration;
      if (!config) return;

      // Verificar timeout
      if (config.Timeout && config.Timeout < 10) {
        this.addResult(`Lambda ${functionName}`, 'WARN', 'Timeout muito baixo');
      }

      // Verificar memory
      if (config.MemorySize && config.MemorySize < 512) {
        this.addResult(`Lambda ${functionName}`, 'WARN', 'Memory muito baixa');
      }

      // Verificar tracing
      if (config.TracingConfig?.Mode !== 'Active') {
        this.addResult(`Lambda ${functionName}`, 'WARN', 'X-Ray tracing não ativo');
      }

    } catch (error) {
      this.addResult(`Lambda ${functionName}`, 'FAIL', 'Erro ao verificar configuração', error);
    }
  }

  /**
   * Validar banco de dados
   */
  private async validateDatabase(): Promise<void> {
    try {
      const command = new DescribeDBClustersCommand({});
      const response = await this.rds.send(command);

      const fibonacciCluster = response.DBClusters?.find(c => 
        c.DBClusterIdentifier?.includes('fibonacci-prod')
      );

      if (fibonacciCluster) {
        if (fibonacciCluster.Status === 'available') {
          this.addResult('Aurora Database', 'PASS', 'Cluster disponível');
        } else {
          this.addResult('Aurora Database', 'WARN', `Status: ${fibonacciCluster.Status}`);
        }

        // Verificar backup
        if (fibonacciCluster.BackupRetentionPeriod && fibonacciCluster.BackupRetentionPeriod >= 7) {
          this.addResult('Database Backup', 'PASS', `Retenção: ${fibonacciCluster.BackupRetentionPeriod} dias`);
        } else {
          this.addResult('Database Backup', 'FAIL', 'Retenção de backup insuficiente');
        }

        // Verificar criptografia
        if (fibonacciCluster.StorageEncrypted) {
          this.addResult('Database Encryption', 'PASS', 'Criptografia habilitada');
        } else {
          this.addResult('Database Encryption', 'FAIL', 'Criptografia não habilitada');
        }
      } else {
        this.addResult('Aurora Database', 'FAIL', 'Cluster não encontrado');
      }
    } catch (error) {
      this.addResult('Aurora Database', 'FAIL', 'Erro ao verificar banco', error);
    }
  }

  /**
   * Validar buckets S3
   */
  private async validateS3Buckets(): Promise<void> {
    const expectedBuckets = [
      'fibonacci-site-prod',
      'fibonacci-cloudtrail-prod',
      'fibonacci-stack-versions-prod'
    ];

    try {
      const command = new ListBucketsCommand({});
      const response = await this.s3.send(command);

      const existingBuckets = response.Buckets?.map(b => b.Name) || [];
      
      for (const expectedBucket of expectedBuckets) {
        const bucket = existingBuckets.find(b => b?.includes(expectedBucket));
        
        if (bucket) {
          this.addResult(`S3 Bucket ${expectedBucket}`, 'PASS', 'Bucket existe');
          
          // Verificar versionamento
          try {
            const versionCommand = new GetBucketVersioningCommand({ Bucket: bucket });
            const versionResponse = await this.s3.send(versionCommand);
            
            if (versionResponse.Status === 'Enabled') {
              this.addResult(`S3 Versioning ${expectedBucket}`, 'PASS', 'Versionamento habilitado');
            } else {
              this.addResult(`S3 Versioning ${expectedBucket}`, 'WARN', 'Versionamento não habilitado');
            }
          } catch (error) {
            this.addResult(`S3 Versioning ${expectedBucket}`, 'WARN', 'Erro ao verificar versionamento');
          }
        } else {
          this.addResult(`S3 Bucket ${expectedBucket}`, 'FAIL', 'Bucket não encontrado');
        }
      }
    } catch (error) {
      this.addResult('S3 Buckets', 'FAIL', 'Erro ao verificar buckets', error);
    }
  }

  /**
   * Validações de segurança
   */
  private async validateSecurity(): Promise<void> {
    console.log('🔒 Validando segurança...');

    // Verificar se há secrets hardcoded
    try {
      const result = execSync('grep -r "sk-" lambda/ || true', { encoding: 'utf8' });
      if (result.trim()) {
        this.addResult('Hardcoded Secrets', 'FAIL', 'Possíveis secrets encontrados no código');
      } else {
        this.addResult('Hardcoded Secrets', 'PASS', 'Nenhum secret hardcoded encontrado');
      }
    } catch (error) {
      this.addResult('Hardcoded Secrets', 'WARN', 'Erro ao verificar secrets');
    }

    // Verificar dependências vulneráveis
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      this.addResult('Dependency Vulnerabilities', 'PASS', 'Nenhuma vulnerabilidade crítica');
    } catch (error) {
      this.addResult('Dependency Vulnerabilities', 'WARN', 'Vulnerabilidades encontradas');
    }
  }

  /**
   * Validações de monitoramento
   */
  private async validateMonitoring(): Promise<void> {
    console.log('📊 Validando monitoramento...');

    try {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'fibonacci-'
      });
      const response = await this.cloudwatch.send(command);

      const alarms = response.MetricAlarms || [];
      
      if (alarms.length >= 5) {
        this.addResult('CloudWatch Alarms', 'PASS', `${alarms.length} alarmes configurados`);
      } else {
        this.addResult('CloudWatch Alarms', 'WARN', `Apenas ${alarms.length} alarmes configurados`);
      }

      // Verificar alarmes críticos
      const criticalAlarms = [
        'fibonacci-api-errors-prod',
        'fibonacci-api-latency-prod',
        'fibonacci-dlq-messages-prod'
      ];

      const existingAlarmNames = alarms.map(a => a.AlarmName);
      const missingAlarms = criticalAlarms.filter(alarm => 
        !existingAlarmNames.some(name => name?.includes(alarm))
      );

      if (missingAlarms.length === 0) {
        this.addResult('Critical Alarms', 'PASS', 'Todos os alarmes críticos configurados');
      } else {
        this.addResult('Critical Alarms', 'WARN', `Alarmes faltando: ${missingAlarms.join(', ')}`);
      }
    } catch (error) {
      this.addResult('CloudWatch Alarms', 'FAIL', 'Erro ao verificar alarmes', error);
    }
  }

  /**
   * Validações de backup
   */
  private async validateBackups(): Promise<void> {
    console.log('💾 Validando backups...');

    // Já validado na seção de database
    this.addResult('Backup Validation', 'PASS', 'Validação incluída na seção de database');
  }

  /**
   * Executar smoke tests
   */
  private async runSmokeTests(): Promise<void> {
    console.log('🧪 Executando smoke tests...');

    // Smoke test básico - verificar se API responde
    try {
      const result = execSync('curl -f -s https://api.alquimista.ai/health || echo "FAIL"', { encoding: 'utf8' });
      
      if (result.includes('FAIL')) {
        this.addResult('API Health Check', 'FAIL', 'API não responde');
      } else {
        this.addResult('API Health Check', 'PASS', 'API respondendo');
      }
    } catch (error) {
      this.addResult('API Health Check', 'FAIL', 'Erro no health check', error);
    }
  }

  /**
   * Adicionar resultado de validação
   */
  private addResult(component: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any): void {
    this.results.push({ component, status, message, details });
  }

  /**
   * Imprimir relatório final
   */
  private printReport(): void {
    console.log('\n📋 RELATÓRIO DE VALIDAÇÃO FINAL\n');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    console.log(`✅ PASSOU: ${passed}`);
    console.log(`❌ FALHOU: ${failed}`);
    console.log(`⚠️  AVISOS: ${warnings}`);
    console.log('='.repeat(60));

    // Agrupar por status
    const groupedResults = {
      PASS: this.results.filter(r => r.status === 'PASS'),
      WARN: this.results.filter(r => r.status === 'WARN'),
      FAIL: this.results.filter(r => r.status === 'FAIL')
    };

    // Mostrar falhas primeiro
    if (groupedResults.FAIL.length > 0) {
      console.log('\n❌ FALHAS CRÍTICAS:');
      groupedResults.FAIL.forEach(result => {
        console.log(`   ${result.component}: ${result.message}`);
      });
    }

    // Mostrar avisos
    if (groupedResults.WARN.length > 0) {
      console.log('\n⚠️  AVISOS:');
      groupedResults.WARN.forEach(result => {
        console.log(`   ${result.component}: ${result.message}`);
      });
    }

    // Mostrar sucessos (resumido)
    if (groupedResults.PASS.length > 0) {
      console.log('\n✅ SUCESSOS:');
      console.log(`   ${groupedResults.PASS.length} validações passaram com sucesso`);
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Verificar se validação foi bem-sucedida
   */
  private isValidationSuccessful(): boolean {
    const failures = this.results.filter(r => r.status === 'FAIL').length;
    return failures === 0;
  }
}

// Execução principal
async function main() {
  const validator = new FinalDeployValidator();
  
  const success = await validator.runValidation();
  
  if (success) {
    console.log('\n🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ Sistema pronto para produção');
    process.exit(0);
  } else {
    console.log('\n💥 VALIDAÇÃO FALHOU!');
    console.log('❌ Corrija os problemas antes do deploy');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { FinalDeployValidator };