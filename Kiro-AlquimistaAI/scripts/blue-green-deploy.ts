#!/usr/bin/env node

/**
 * Script para implementar blue-green deployment usando Lambda aliases
 * Permite traffic shifting gradual e rollback automático
 */

import { LambdaClient, CreateAliasCommand, UpdateAliasCommand, GetAliasCommand, PublishVersionCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

interface DeploymentConfig {
  functionName: string;
  aliasName: string;
  newVersion: string;
  trafficShiftSteps: number[];
  rollbackThreshold: {
    errorRate: number;
    duration: number;
  };
}

class BlueGreenDeployment {
  private lambda: LambdaClient;
  private cloudwatch: CloudWatchClient;

  constructor() {
    this.lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  /**
   * Executa deployment blue-green com traffic shifting gradual
   */
  async deploy(config: DeploymentConfig): Promise<void> {
    console.log(`🚀 Iniciando blue-green deployment para ${config.functionName}`);
    
    try {
      // 1. Publicar nova versão
      const newVersion = await this.publishVersion(config.functionName);
      console.log(`✅ Nova versão publicada: ${newVersion}`);

      // 2. Obter versão atual do alias
      const currentVersion = await this.getCurrentVersion(config.functionName, config.aliasName);
      console.log(`📋 Versão atual: ${currentVersion}`);

      // 3. Executar traffic shifting gradual
      for (const trafficPercent of config.trafficShiftSteps) {
        console.log(`🔄 Direcionando ${trafficPercent}% do tráfego para nova versão...`);
        
        await this.updateTrafficSplit(
          config.functionName,
          config.aliasName,
          currentVersion,
          newVersion,
          trafficPercent
        );

        // Aguardar e monitorar métricas
        await this.sleep(60000); // 1 minuto
        
        const shouldRollback = await this.checkMetrics(
          config.functionName,
          config.rollbackThreshold
        );

        if (shouldRollback) {
          console.log('❌ Métricas degradadas detectadas. Iniciando rollback...');
          await this.rollback(config.functionName, config.aliasName, currentVersion);
          throw new Error('Deployment cancelado devido a métricas degradadas');
        }

        console.log(`✅ ${trafficPercent}% do tráfego migrado com sucesso`);
      }

      // 4. Finalizar deployment (100% na nova versão)
      await this.updateTrafficSplit(
        config.functionName,
        config.aliasName,
        currentVersion,
        newVersion,
        100
      );

      console.log('🎉 Blue-green deployment concluído com sucesso!');

    } catch (error) {
      console.error('💥 Erro durante deployment:', error);
      throw error;
    }
  }

  /**
   * Publica nova versão da função Lambda
   */
  private async publishVersion(functionName: string): Promise<string> {
    const command = new PublishVersionCommand({
      FunctionName: functionName,
      Description: `Deployment ${new Date().toISOString()}`
    });

    const response = await this.lambda.send(command);
    return response.Version!;
  }

  /**
   * Obtém versão atual do alias
   */
  private async getCurrentVersion(functionName: string, aliasName: string): Promise<string> {
    try {
      const command = new GetAliasCommand({
        FunctionName: functionName,
        Name: aliasName
      });

      const response = await this.lambda.send(command);
      return response.FunctionVersion!;
    } catch (error) {
      // Se alias não existe, criar com versão $LATEST
      console.log(`📝 Alias ${aliasName} não existe. Criando...`);
      
      const createCommand = new CreateAliasCommand({
        FunctionName: functionName,
        Name: aliasName,
        FunctionVersion: '$LATEST'
      });

      await this.lambda.send(createCommand);
      return '$LATEST';
    }
  }

  /**
   * Atualiza divisão de tráfego entre versões
   */
  private async updateTrafficSplit(
    functionName: string,
    aliasName: string,
    oldVersion: string,
    newVersion: string,
    newVersionPercent: number
  ): Promise<void> {
    const oldVersionPercent = 100 - newVersionPercent;

    const additionalVersionWeights: Record<string, number> = {};
    if (oldVersionPercent > 0) {
      additionalVersionWeights[oldVersion] = oldVersionPercent / 100;
    }

    const command = new UpdateAliasCommand({
      FunctionName: functionName,
      Name: aliasName,
      FunctionVersion: newVersion,
      RoutingConfig: newVersionPercent < 100 ? {
        AdditionalVersionWeights: additionalVersionWeights
      } : undefined
    });

    await this.lambda.send(command);
  }

  /**
   * Verifica métricas para decidir se deve fazer rollback
   */
  private async checkMetrics(
    functionName: string,
    threshold: { errorRate: number; duration: number }
  ): Promise<boolean> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - threshold.duration * 1000);

    try {
      // Verificar taxa de erro
      const errorCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 60,
        Statistics: ['Sum']
      });

      const invocationCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 60,
        Statistics: ['Sum']
      });

      const [errorResponse, invocationResponse] = await Promise.all([
        this.cloudwatch.send(errorCommand),
        this.cloudwatch.send(invocationCommand)
      ]);

      const totalErrors = errorResponse.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;
      const totalInvocations = invocationResponse.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;

      if (totalInvocations === 0) {
        return false; // Sem invocações, não há como avaliar
      }

      const errorRate = (totalErrors / totalInvocations) * 100;
      console.log(`📊 Taxa de erro atual: ${errorRate.toFixed(2)}% (threshold: ${threshold.errorRate}%)`);

      return errorRate > threshold.errorRate;

    } catch (error) {
      console.warn('⚠️ Erro ao verificar métricas:', error);
      return false; // Em caso de erro, não fazer rollback
    }
  }

  /**
   * Executa rollback para versão anterior
   */
  private async rollback(
    functionName: string,
    aliasName: string,
    previousVersion: string
  ): Promise<void> {
    console.log(`🔄 Executando rollback para versão ${previousVersion}...`);

    const command = new UpdateAliasCommand({
      FunctionName: functionName,
      Name: aliasName,
      FunctionVersion: previousVersion,
      RoutingConfig: undefined // Remove traffic splitting
    });

    await this.lambda.send(command);
    console.log('✅ Rollback concluído');
  }

  /**
   * Utilitário para aguardar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Configurações de deployment para diferentes funções
const deploymentConfigs: DeploymentConfig[] = [
  {
    functionName: 'fibonacci-handler',
    aliasName: 'LIVE',
    newVersion: '$LATEST',
    trafficShiftSteps: [10, 25, 50, 75],
    rollbackThreshold: {
      errorRate: 5, // 5% de taxa de erro
      duration: 300 // 5 minutos
    }
  },
  {
    functionName: 'nigredo-recebimento',
    aliasName: 'LIVE',
    newVersion: '$LATEST',
    trafficShiftSteps: [20, 50, 100],
    rollbackThreshold: {
      errorRate: 3,
      duration: 180
    }
  }
];

// Execução principal
async function main() {
  const functionName = process.argv[2];
  
  if (!functionName) {
    console.log('Uso: npm run blue-green-deploy <function-name>');
    console.log('Funções disponíveis:');
    deploymentConfigs.forEach(config => {
      console.log(`  - ${config.functionName}`);
    });
    process.exit(1);
  }

  const config = deploymentConfigs.find(c => c.functionName === functionName);
  if (!config) {
    console.error(`❌ Configuração não encontrada para função: ${functionName}`);
    process.exit(1);
  }

  const deployment = new BlueGreenDeployment();
  
  try {
    await deployment.deploy(config);
    console.log('🎉 Deployment concluído com sucesso!');
  } catch (error) {
    console.error('💥 Deployment falhou:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { BlueGreenDeployment };