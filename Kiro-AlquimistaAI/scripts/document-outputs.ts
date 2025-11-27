#!/usr/bin/env node

/**
 * Script para documentar outputs do CloudFormation
 * Gera documentação com URLs e credenciais importantes
 */

import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';

interface StackOutput {
  stackName: string;
  outputs: Array<{
    key: string;
    value: string;
    description?: string;
    exportName?: string;
  }>;
}

class OutputDocumenter {
  private cloudformation: CloudFormationClient;

  constructor() {
    this.cloudformation = new CloudFormationClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
  }

  /**
   * Documenta outputs de todas as stacks
   */
  async documentOutputs(environment: string): Promise<void> {
    console.log(`📋 Documentando outputs para ambiente: ${environment}`);

    const stackNames = [
      `FibonacciStack-${environment}`,
      `NigredoStack-${environment}`,
      `AlquimistaStack-${environment}`
    ];

    const allOutputs: StackOutput[] = [];

    for (const stackName of stackNames) {
      try {
        const outputs = await this.getStackOutputs(stackName);
        if (outputs.length > 0) {
          allOutputs.push({ stackName, outputs });
        }
      } catch (error) {
        console.warn(`⚠️ Stack ${stackName} não encontrada ou sem outputs`);
      }
    }

    // Gerar documentação
    await this.generateDocumentation(environment, allOutputs);
    
    console.log(`✅ Documentação gerada em: docs/deploy/outputs-${environment}.md`);
  }

  /**
   * Obter outputs de uma stack específica
   */
  private async getStackOutputs(stackName: string): Promise<Array<{
    key: string;
    value: string;
    description?: string;
    exportName?: string;
  }>> {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await this.cloudformation.send(command);

    const stack = response.Stacks?.[0];
    if (!stack?.Outputs) {
      return [];
    }

    return stack.Outputs.map(output => ({
      key: output.OutputKey || '',
      value: output.OutputValue || '',
      description: output.Description,
      exportName: output.ExportName
    }));
  }

  /**
   * Gerar documentação em Markdown
   */
  private async generateDocumentation(environment: string, stackOutputs: StackOutput[]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    let markdown = `# Outputs do CloudFormation - ${environment.toUpperCase()}\n\n`;
    markdown += `**Gerado em**: ${timestamp}\n`;
    markdown += `**Região AWS**: ${process.env.AWS_REGION || 'us-east-1'}\n\n`;

    // Seção de URLs importantes
    markdown += `## 🌐 URLs Importantes\n\n`;
    
    const importantUrls = this.extractImportantUrls(stackOutputs);
    for (const [label, url] of Object.entries(importantUrls)) {
      markdown += `- **${label}**: ${url}\n`;
    }
    markdown += '\n';

    // Seção de recursos por stack
    for (const stackOutput of stackOutputs) {
      markdown += `## 📦 ${stackOutput.stackName}\n\n`;
      
      if (stackOutput.outputs.length === 0) {
        markdown += `*Nenhum output encontrado*\n\n`;
        continue;
      }

      markdown += `| Output Key | Value | Description |\n`;
      markdown += `|------------|-------|-------------|\n`;
      
      for (const output of stackOutput.outputs) {
        const description = output.description || '-';
        const value = this.formatOutputValue(output.value);
        markdown += `| ${output.key} | ${value} | ${description} |\n`;
      }
      markdown += '\n';
    }

    // Seção de comandos úteis
    markdown += this.generateUsefulCommands(environment);

    // Seção de troubleshooting
    markdown += this.generateTroubleshooting();

    // Salvar arquivo
    const outputDir = 'docs/deploy';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(`${outputDir}/outputs-${environment}.md`, markdown);
  }

  /**
   * Extrair URLs importantes dos outputs
   */
  private extractImportantUrls(stackOutputs: StackOutput[]): Record<string, string> {
    const urls: Record<string, string> = {};

    for (const stackOutput of stackOutputs) {
      for (const output of stackOutput.outputs) {
        // API Gateway URLs
        if (output.key.includes('ApiEndpoint') || output.key.includes('HttpApiUrl')) {
          urls['API Principal'] = output.value;
        }
        
        // CloudFront URLs
        if (output.key.includes('CloudFrontUrl') || output.key.includes('DistributionUrl')) {
          urls['Site/CDN'] = output.value;
        }
        
        // Dashboard URLs
        if (output.key.includes('Dashboard')) {
          urls[`Dashboard ${output.key}`] = `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=${output.value}`;
        }
      }
    }

    return urls;
  }

  /**
   * Formatar valor do output para exibição
   */
  private formatOutputValue(value: string): string {
    // Se for URL, tornar clicável
    if (value.startsWith('http')) {
      return `[${value}](${value})`;
    }
    
    // Se for ARN muito longo, truncar
    if (value.startsWith('arn:') && value.length > 60) {
      return `${value.substring(0, 60)}...`;
    }
    
    return value;
  }

  /**
   * Gerar seção de comandos úteis
   */
  private generateUsefulCommands(environment: string): string {
    return `## 🛠️ Comandos Úteis

### Verificar Status das Stacks
\`\`\`bash
aws cloudformation describe-stacks --stack-name FibonacciStack-${environment}
aws cloudformation describe-stacks --stack-name NigredoStack-${environment}
aws cloudformation describe-stacks --stack-name AlquimistaStack-${environment}
\`\`\`

### Verificar Logs das Lambdas
\`\`\`bash
aws logs tail /aws/lambda/fibonacci-api-handler-${environment} --follow
aws logs tail /aws/lambda/nigredo-recebimento-${environment} --follow
\`\`\`

### Verificar Alarmes
\`\`\`bash
aws cloudwatch describe-alarms --alarm-name-prefix fibonacci-
\`\`\`

### Verificar Métricas
\`\`\`bash
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Invocations \\
  --dimensions Name=FunctionName,Value=fibonacci-api-handler-${environment} \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Sum
\`\`\`

`;
  }

  /**
   * Gerar seção de troubleshooting
   */
  private generateTroubleshooting(): string {
    return `## 🔧 Troubleshooting

### Problemas Comuns

#### API não responde
1. Verificar se Lambda está ativa: \`aws lambda get-function --function-name fibonacci-api-handler-prod\`
2. Verificar logs: \`aws logs tail /aws/lambda/fibonacci-api-handler-prod\`
3. Verificar alarmes: \`aws cloudwatch describe-alarms --alarm-name-prefix fibonacci-api\`

#### Banco de dados inacessível
1. Verificar status do cluster: \`aws rds describe-db-clusters --db-cluster-identifier fibonacci-prod-cluster\`
2. Verificar security groups
3. Verificar secrets: \`aws secretsmanager get-secret-value --secret-id fibonacci/database/credentials\`

#### Agentes não processando
1. Verificar filas SQS: \`aws sqs get-queue-attributes --queue-url <queue-url> --attribute-names All\`
2. Verificar DLQ: \`aws sqs receive-message --queue-url <dlq-url>\`
3. Verificar EventBridge: \`aws events list-rules --name-prefix nigredo\`

### Contatos de Suporte
- **Emergência**: suporte-emergencia@alquimista.ai
- **Técnico**: suporte-tecnico@alquimista.ai
- **Slack**: #alquimista-ai-ops

### Links Úteis
- [AWS Console](https://console.aws.amazon.com/)
- [CloudWatch Dashboards](https://console.aws.amazon.com/cloudwatch/home#dashboards:)
- [Lambda Functions](https://console.aws.amazon.com/lambda/home#/functions)
- [RDS Clusters](https://console.aws.amazon.com/rds/home#databases:)

---

*Documentação gerada automaticamente pelo script de deploy*
`;
  }
}

// Execução principal
async function main() {
  const environment = process.argv[2] || 'prod';
  
  if (!['dev', 'staging', 'prod'].includes(environment)) {
    console.error('❌ Ambiente deve ser: dev, staging ou prod');
    process.exit(1);
  }

  const documenter = new OutputDocumenter();
  
  try {
    await documenter.documentOutputs(environment);
    console.log('🎉 Documentação gerada com sucesso!');
  } catch (error) {
    console.error('💥 Erro ao gerar documentação:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { OutputDocumenter };