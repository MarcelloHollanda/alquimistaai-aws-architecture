import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AuroraMigrationsRunnerStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  dbCluster: rds.DatabaseCluster;
  dbSecret: rds.DatabaseSecret;
}

/**
 * Stack para Lambda que executa migrations no Aurora PostgreSQL
 * 
 * Esta Lambda roda dentro da VPC e tem acesso direto ao Aurora,
 * eliminando a necessidade de expor o banco para a internet.
 * 
 * Uso:
 * ```bash
 * aws lambda invoke \
 *   --function-name aurora-migrations-runner-dev \
 *   --payload '{"action":"run-migration","target":"017"}' \
 *   output.json
 * ```
 */
export class AuroraMigrationsRunnerStack extends cdk.Stack {
  public readonly migrationRunnerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AuroraMigrationsRunnerStackProps) {
    super(scope, id, props);

    const { envName, vpc, dbCluster, dbSecret } = props;

    // ========================================
    // Security Group para Lambda
    // ========================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'MigrationRunnerSG', {
      vpc,
      description: 'Security group for Aurora Migrations Runner Lambda',
      allowAllOutbound: true
    });

    // Permitir que a Lambda acesse o Aurora na porta 5432
    dbCluster.connections.allowFrom(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow migrations runner Lambda to access Aurora'
    );

    // ========================================
    // Lambda Function
    // ========================================
    this.migrationRunnerFunction = new lambda.Function(this, 'MigrationRunnerFunction', {
      functionName: `aurora-migrations-runner-${envName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda-src/aurora-migrations-runner/dist', {
        // Incluir migrations SQL no pacote
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash', '-c', [
              'cp -r /asset-input/* /asset-output/',
              'cd /asset-output',
              'npm ci --omit=dev',
              'npm run build',
              'cp -r migrations dist/',
              'rm -rf src node_modules package*.json tsconfig.json'
            ].join(' && ')
          ]
        }
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        AWS_REGION: this.region,
        NODE_OPTIONS: '--enable-source-maps'
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Executa migrations SQL no Aurora PostgreSQL de dentro da VPC'
    });

    // ========================================
    // Permissões IAM
    // ========================================
    
    // Permitir leitura do secret do Aurora
    dbSecret.grantRead(this.migrationRunnerFunction);

    // Permitir acesso ao Aurora via Data API (opcional, para futuras melhorias)
    this.migrationRunnerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:ExecuteStatement',
          'rds-data:BatchExecuteStatement',
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:RollbackTransaction'
        ],
        resources: [dbCluster.clusterArn]
      })
    );

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'MigrationRunnerFunctionName', {
      value: this.migrationRunnerFunction.functionName,
      description: 'Nome da Lambda para executar migrations',
      exportName: `aurora-migrations-runner-function-${envName}`
    });

    new cdk.CfnOutput(this, 'MigrationRunnerFunctionArn', {
      value: this.migrationRunnerFunction.functionArn,
      description: 'ARN da Lambda para executar migrations',
      exportName: `aurora-migrations-runner-arn-${envName}`
    });

    // ========================================
    // Tags
    // ========================================
    cdk.Tags.of(this).add('Project', 'Alquimista');
    cdk.Tags.of(this).add('Environment', envName);
    cdk.Tags.of(this).add('Component', 'AuroraMigrationsRunner');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
