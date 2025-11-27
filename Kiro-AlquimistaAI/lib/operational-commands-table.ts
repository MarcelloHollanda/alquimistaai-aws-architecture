/**
 * Configuração da tabela DynamoDB para Comandos Operacionais
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface OperationalCommandsTableProps {
  envName: string;
  removalPolicy?: cdk.RemovalPolicy;
}

export class OperationalCommandsTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: OperationalCommandsTableProps) {
    super(scope, id);

    // Criar tabela DynamoDB para comandos operacionais
    this.table = new dynamodb.Table(this, 'OperationalCommandsTable', {
      tableName: `operational-commands-${props.envName}`,
      partitionKey: {
        name: 'command_id',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // GSI: tenant_id-created_at-index
    this.table.addGlobalSecondaryIndex({
      indexName: 'tenant_id-created_at-index',
      partitionKey: {
        name: 'tenant_id',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI: status-created_at-index
    this.table.addGlobalSecondaryIndex({
      indexName: 'status-created_at-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Tags
    cdk.Tags.of(this.table).add('Project', 'Alquimista');
    cdk.Tags.of(this.table).add('Environment', props.envName);
    cdk.Tags.of(this.table).add('Component', 'OperationalDashboard');
    cdk.Tags.of(this.table).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'Nome da tabela DynamoDB de comandos operacionais',
      exportName: `OperationalCommandsTableName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'ARN da tabela DynamoDB de comandos operacionais',
      exportName: `OperationalCommandsTableArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'TableStreamArn', {
      value: this.table.tableStreamArn || 'N/A',
      description: 'ARN do stream da tabela DynamoDB',
      exportName: `OperationalCommandsTableStreamArn-${props.envName}`
    });
  }
}
