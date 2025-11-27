import * as cdk from 'aws-cdk-lib';
import { ArnFormat } from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

// NOTE: WAF IPSet description must match the AWS regex:
// ^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$
// Use only ASCII letters, digits, underscore, spaces and symbols: + = : # @ / - , .
// Do not use accented characters or parentheses.
const WAF_DESCRIPTION_REGEX = /^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$/;

/**
 * Valida descrição de IP Set do WAF contra o regex exigido pela AWS
 * @param desc Descrição a ser validada
 * @returns A descrição validada
 * @throws Error se a descrição contiver caracteres inválidos
 */
function validateWafDescription(desc: string): string {
  if (!WAF_DESCRIPTION_REGEX.test(desc)) {
    throw new Error(
      `Invalid WAF IPSet description: "${desc}". ` +
      'Use only ASCII letters, digits, underscore, spaces and symbols + = : # @ / - , . ' +
      'Do not use accented characters or parentheses.'
    );
  }
  return desc;
}

export interface WAFStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  /**
   * SNS Topic para alertas de segurança (integração com SecurityStack)
   */
  securityAlertTopic?: sns.ITopic;
}

/**
 * Stack de WAF + Edge Security para AlquimistaAI
 * 
 * Implementa:
 * - Web ACLs separadas para dev e prod
 * - AWS Managed Rules (Common, KnownBadInputs, SQLi)
 * - Rate limiting (2000 req/5min dev, 1000 req/5min prod)
 * - IP Sets para allowlist e blocklist
 * - Logging com retenção configurável (30d dev, 90d prod)
 * - Alarmes CloudWatch integrados com SNS de segurança
 */
export class WAFStack extends cdk.Stack {
  public readonly webAclDev: wafv2.CfnWebACL;
  public readonly webAclProd: wafv2.CfnWebACL;
  public readonly allowedIPs: wafv2.CfnIPSet;
  public readonly blockedIPs: wafv2.CfnIPSet;
  public readonly logGroupDev: logs.LogGroup;
  public readonly logGroupProd: logs.LogGroup;

  constructor(scope: Construct, id: string, props: WAFStackProps) {
    super(scope, id, props);

    const env = props.envName;

    // ========================================
    // 1. IP Sets (AllowedIPs e BlockedIPs)
    // ========================================
    
    // IP Set para IPs permitidos (allowlist)
    this.allowedIPs = new wafv2.CfnIPSet(this, 'AllowedIPs', {
      name: `alquimista-allowed-ips-${env}`,
      description: validateWafDescription(
        'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks'
      ),
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [
        // Lista inicial vazia - adicionar IPs conforme necessário
        // Exemplo: '203.0.113.0/24', '198.51.100.0/24'
      ],
    });

    // IP Set para IPs bloqueados (blocklist)
    this.blockedIPs = new wafv2.CfnIPSet(this, 'BlockedIPs', {
      name: `alquimista-blocked-ips-${env}`,
      description: validateWafDescription(
        'Blocklist de IPs maliciosos identificados'
      ),
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [
        // Lista inicial vazia - adicionar IPs conforme necessário
      ],
    });

    // ========================================
    // 2. CloudWatch Log Groups para WAF Logs
    // ========================================
    
    // Log Group para Dev (retenção 30 dias)
    // IMPORTANTE: WAF exige que o nome comece com 'aws-waf-logs-'
    // Referência: https://docs.aws.amazon.com/waf/latest/developerguide/logging.html
    this.logGroupDev = new logs.LogGroup(this, 'WAFLogGroupDev', {
      logGroupName: 'aws-waf-logs-alquimista-dev',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Log Group para Prod (retenção 90 dias)
    // IMPORTANTE: WAF exige que o nome comece com 'aws-waf-logs-'
    this.logGroupProd = new logs.LogGroup(this, 'WAFLogGroupProd', {
      logGroupName: 'aws-waf-logs-alquimista-prod',
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // 3. Web ACL Dev
    // ========================================
    
    this.webAclDev = this.createWebACLDev(env);

    // ========================================
    // 4. Web ACL Prod
    // ========================================
    
    this.webAclProd = this.createWebACLProd(env);

    // ========================================
    // 5. Logging Configuration
    // ========================================
    
    // Construir ARN correto para WAF usando Stack.formatArn
    // IMPORTANTE: WAF exige ARN sem :* no final e log group com nome começando em 'aws-waf-logs-'
    // Referência: https://docs.aws.amazon.com/waf/latest/APIReference/API_LoggingConfiguration.html
    const wafLogGroupDevArnForWaf = cdk.Stack.of(this).formatArn({
      service: 'logs',
      resource: 'log-group',
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
      resourceName: this.logGroupDev.logGroupName,
    });
    
    const loggingDev = new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingDev', {
      resourceArn: this.webAclDev.attrArn,
      logDestinationConfigs: [wafLogGroupDevArnForWaf],
    });
    
    // Usar addPropertyOverride para garantir capitalização correta
    loggingDev.addPropertyOverride('RedactedFields', [
      {
        SingleHeader: {
          Name: 'authorization',
        },
      },
      {
        SingleHeader: {
          Name: 'cookie',
        },
      },
    ]);

    // Construir ARN correto para WAF Prod usando Stack.formatArn
    const wafLogGroupProdArnForWaf = cdk.Stack.of(this).formatArn({
      service: 'logs',
      resource: 'log-group',
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
      resourceName: this.logGroupProd.logGroupName,
    });
    
    const loggingProd = new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingProd', {
      resourceArn: this.webAclProd.attrArn,
      logDestinationConfigs: [wafLogGroupProdArnForWaf],
    });
    
    // Usar addPropertyOverride para garantir capitalização correta
    loggingProd.addPropertyOverride('RedactedFields', [
      {
        SingleHeader: {
          Name: 'authorization',
        },
      },
      {
        SingleHeader: {
          Name: 'cookie',
        },
      },
    ]);

    // ========================================
    // 6. CloudWatch Alarmes
    // ========================================
    
    if (props.securityAlertTopic) {
      this.createAlarms(env, props.securityAlertTopic);
    }

    // ========================================
    // Tags
    // ========================================
    cdk.Tags.of(this).add('Project', 'AlquimistaAI');
    cdk.Tags.of(this).add('Component', 'WAF');
    cdk.Tags.of(this).add('Environment', env);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // ========================================
    // Outputs
    // ========================================
    
    new cdk.CfnOutput(this, 'WebAclDevArn', {
      value: this.webAclDev.attrArn,
      description: 'ARN do Web ACL Dev',
      exportName: `${env}-WebAclDevArn`,
    });

    new cdk.CfnOutput(this, 'WebAclProdArn', {
      value: this.webAclProd.attrArn,
      description: 'ARN do Web ACL Prod',
      exportName: `${env}-WebAclProdArn`,
    });

    new cdk.CfnOutput(this, 'AllowedIPsArn', {
      value: this.allowedIPs.attrArn,
      description: 'ARN do IP Set de IPs permitidos',
      exportName: `${env}-AllowedIPsArn`,
    });

    new cdk.CfnOutput(this, 'BlockedIPsArn', {
      value: this.blockedIPs.attrArn,
      description: 'ARN do IP Set de IPs bloqueados',
      exportName: `${env}-BlockedIPsArn`,
    });

    new cdk.CfnOutput(this, 'WAFLogGroupDevName', {
      value: this.logGroupDev.logGroupName,
      description: 'Nome do Log Group WAF Dev',
    });

    new cdk.CfnOutput(this, 'WAFLogGroupProdName', {
      value: this.logGroupProd.logGroupName,
      description: 'Nome do Log Group WAF Prod',
    });
  }

  /**
   * Cria Web ACL para ambiente Dev
   * - Modo count inicialmente (observação)
   * - Rate limit: 2000 req/5min
   * - Managed Rules em modo count
   */
  private createWebACLDev(env: string): wafv2.CfnWebACL {
    return new wafv2.CfnWebACL(this, 'WebACLDev', {
      name: `AlquimistaAI-WAF-Dev`,
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      description: validateWafDescription(
        'WAF Web ACL para APIs Dev - Modo observacao'
      ),
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AlquimistaAI-WAF-Dev',
      },
      rules: [
        // Regra 1: Bloquear IPs da blocklist
        {
          name: 'BlockedIPsRule',
          priority: 0,
          statement: {
            ipSetReferenceStatement: {
              arn: this.blockedIPs.attrArn,
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'BlockedIPsRule-Dev',
          },
        },
        // Regra 2: AWS Managed Rules - Common Rule Set
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: {
            count: {}, // Modo count em dev
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet-Dev',
          },
        },
        // Regra 3: AWS Managed Rules - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: {
            count: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesKnownBadInputsRuleSet-Dev',
          },
        },
        // Regra 4: AWS Managed Rules - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: {
            count: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSet-Dev',
          },
        },
        // Regra 5: Rate Limiting (2000 req/5min)
        {
          name: 'RateLimitDev',
          priority: 10,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
              // Excluir IPs da allowlist do rate limiting
              scopeDownStatement: {
                notStatement: {
                  statement: {
                    ipSetReferenceStatement: {
                      arn: this.allowedIPs.attrArn,
                    },
                  },
                },
              },
            },
          },
          action: {
            count: {}, // Apenas contar em dev
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitDev',
          },
        },
      ],
    });
  }

  /**
   * Cria Web ACL para ambiente Prod
   * - Modo block (bloqueio ativo)
   * - Rate limit: 1000 req/5min
   * - Managed Rules em modo block
   */
  private createWebACLProd(env: string): wafv2.CfnWebACL {
    return new wafv2.CfnWebACL(this, 'WebACLProd', {
      name: `AlquimistaAI-WAF-Prod`,
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      description: validateWafDescription(
        'WAF Web ACL para APIs Prod - Modo bloqueio'
      ),
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AlquimistaAI-WAF-Prod',
      },
      rules: [
        // Regra 1: Bloquear IPs da blocklist
        {
          name: 'BlockedIPsRule',
          priority: 0,
          statement: {
            ipSetReferenceStatement: {
              arn: this.blockedIPs.attrArn,
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'BlockedIPsRule-Prod',
          },
        },
        // Regra 2: AWS Managed Rules - Common Rule Set
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: {
            none: {}, // Modo block em prod
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet-Prod',
          },
        },
        // Regra 3: AWS Managed Rules - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesKnownBadInputsRuleSet-Prod',
          },
        },
        // Regra 4: AWS Managed Rules - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSet-Prod',
          },
        },
        // Regra 5: Rate Limiting (1000 req/5min)
        {
          name: 'RateLimitProd',
          priority: 10,
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: 'IP',
              // Excluir IPs da allowlist do rate limiting
              scopeDownStatement: {
                notStatement: {
                  statement: {
                    ipSetReferenceStatement: {
                      arn: this.allowedIPs.attrArn,
                    },
                  },
                },
              },
            },
          },
          action: {
            block: {}, // Bloquear em prod
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitProd',
          },
        },
      ],
    });
  }

  /**
   * Cria alarmes CloudWatch para monitoramento do WAF
   */
  private createAlarms(env: string, securityTopic: sns.ITopic): void {
    // Alarme: Alto volume de bloqueios em Prod
    const blockedRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/WAFV2',
      metricName: 'BlockedRequests',
      dimensionsMap: {
        WebACL: 'AlquimistaAI-WAF-Prod',
        Region: this.region,
        Rule: 'ALL',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(10),
    });

    const highBlockRateAlarm = new cloudwatch.Alarm(this, 'HighBlockRateAlarm', {
      alarmName: `alquimista-waf-high-block-rate-${env}`,
      alarmDescription: 'Alto volume de requisições bloqueadas pelo WAF - Possível ataque em andamento',
      metric: blockedRequestsMetric,
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highBlockRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(securityTopic));

    // Alarme: Rate Limiting acionado em Prod
    const rateLimitMetric = new cloudwatch.Metric({
      namespace: 'AWS/WAFV2',
      metricName: 'BlockedRequests',
      dimensionsMap: {
        WebACL: 'AlquimistaAI-WAF-Prod',
        Region: this.region,
        Rule: 'RateLimitProd',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const rateLimitAlarm = new cloudwatch.Alarm(this, 'RateLimitTriggeredAlarm', {
      alarmName: `alquimista-waf-rate-limit-triggered-${env}`,
      alarmDescription: 'Rate limiting acionado - IP excedeu limite de requisições',
      metric: rateLimitMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    rateLimitAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(securityTopic));
  }
}
