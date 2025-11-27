

# **Blueprint Markdown — IaC Mínimo (CDK TypeScript) · us-east-1**

## **Estrutura de pastas**

`fibonacci-aws/`  
`├─ bin/`  
`│  └─ app.ts`  
`├─ lib/`  
`│  └─ fibonacci-stack.ts`  
`├─ lambda/`  
`│  └─ handler.ts`  
`├─ package.json`  
`├─ tsconfig.json`  
`└─ cdk.json`

## **package.json**

`{`  
  `"name": "fibonacci-aws",`  
  `"version": "0.1.0",`  
  `"bin": { "fibonacci-aws": "bin/app.ts" },`  
  `"scripts": {`  
    `"build": "tsc",`  
    `"watch": "tsc -w",`  
    `"cdk": "cdk",`  
    `"deploy": "npm run build && cdk deploy",`  
    `"destroy": "cdk destroy",`  
    `"synth": "npm run build && cdk synth",`  
    `"bootstrap": "cdk bootstrap aws://$ACCOUNT_ID/us-east-1"`  
  `},`  
  `"devDependencies": {`  
    `"aws-cdk-lib": "^2.152.0",`  
    `"constructs": "^10.3.0",`  
    `"ts-node": "^10.9.2",`  
    `"typescript": "^5.4.5",`  
    `"esbuild": "^0.21.5",`  
    `"aws-cdk": "^2.152.0"`  
  `},`  
  `"dependencies": {`  
    `"source-map-support": "^0.5.21",`  
    `"aws-sdk": "^2.1577.0"`  
  `}`  
`}`

## **tsconfig.json**

`{`  
  `"compilerOptions": {`  
    `"target": "ES2021",`  
    `"module": "commonjs",`  
    `"lib": ["es2021"],`  
    `"strict": true,`  
    `"esModuleInterop": true,`  
    `"skipLibCheck": true,`  
    `"outDir": "dist"`  
  `},`  
  `"include": ["bin", "lib", "lambda"]`  
`}`

## **cdk.json**

`{`  
  `"app": "npx ts-node --prefer-ts-exts bin/app.ts",`  
  `"context": {`  
    `"@aws-cdk/core:bootstrapQualifier": "fib",`  
    `"aws-cdk:enableDiffNoFail": "true"`  
  `}`  
`}`

## **bin/app.ts**

`import 'source-map-support/register';`  
`import * as cdk from 'aws-cdk-lib';`  
`import { FibonacciStack } from '../lib/fibonacci-stack';`

`const app = new cdk.App();`

`const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };`

`// Use um destes nomes após decidir o alvo:`  
`// const projectName = 'fibonacci-orquestrador-b2b';`  
`const projectName = 'fibonacci-core';`

`new FibonacciStack(app, 'FibonacciStack', {`  
  `env,`  
  `tags: {`  
    `project: projectName,`  
    `owner: 'alquimista.ai',`  
    `env: 'prod',`  
    `costcenter: 'core'`  
  `}`  
`});`

## **lib/fibonacci-stack.ts**

`import * as cdk from 'aws-cdk-lib';`  
`import { Construct } from 'constructs';`  
`import * as s3 from 'aws-cdk-lib/aws-s3';`  
`import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';`  
`import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';`  
`import * as iam from 'aws-cdk-lib/aws-iam';`  
`import * as lambda from 'aws-cdk-lib/aws-lambda';`  
`import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';`  
`import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';`  
`import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';`  
`import * as events from 'aws-cdk-lib/aws-events';`  
`import * as targets from 'aws-cdk-lib/aws-events-targets';`  
`import * as sqs from 'aws-cdk-lib/aws-sqs';`  
`import * as ec2 from 'aws-cdk-lib/aws-ec2';`  
`import * as rds from 'aws-cdk-lib/aws-rds';`  
`import * as secrets from 'aws-cdk-lib/aws-secretsmanager';`  
`import * as cognito from 'aws-cdk-lib/aws-cognito';`

`export class FibonacciStack extends cdk.Stack {`  
  `constructor(scope: Construct, id: string, props?: cdk.StackProps) {`  
    `super(scope, id, props);`

    `// ===== Front estático (S3 + CloudFront) =====`  
    `const siteBucket = new s3.Bucket(this, 'SiteBucket', {`  
      `blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,`  
      `enforceSSL: true`  
    `});`  
    `const oac = new cloudfront.OriginAccessControl(this, 'OAC', {`  
      `originAccessControlName: 'fibonacci-oac',`  
      `signingBehavior: cloudfront.SigningBehavior.ALWAYS,`  
      `signingProtocol: cloudfront.SigningProtocol.SIGV4,`  
      `originType: cloudfront.OriginAccessControlOriginTypes.S3`  
    `});`  
    `const dist = new cloudfront.Distribution(this, 'SiteDistribution', {`  
      `defaultBehavior: {`  
        `origin: new origins.S3BucketOrigin(siteBucket, { originAccessControl: oac }),`  
        `viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS`  
      `},`  
      `defaultRootObject: 'index.html'`  
    `});`  
    `// Permissão do CloudFront ler do S3 (com OAC)`  
    `siteBucket.addToResourcePolicy(new iam.PolicyStatement({`  
      `actions: ['s3:GetObject'],`  
      `resources: [siteBucket.arnForObjects('*')],`  
      `principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],`  
      `conditions: {`  
        ``StringEquals: { 'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${dist.distributionId}` }``  
      `}`  
    `}));`

    `// ===== API + Lambda (Node) =====`  
    `const apiFn = new nodejs.NodejsFunction(this, 'ApiHandler', {`  
      `entry: 'lambda/handler.ts',`  
      `handler: 'handler',`  
      `runtime: lambda.Runtime.NODEJS_20_X,`  
      `memorySize: 512,`  
      `timeout: cdk.Duration.seconds(10),`  
      `environment: {`  
        `POWERTOOLS_SERVICE_NAME: 'fibonacci-api',`  
        `EVENT_BUS_NAME: 'fibonacci-bus'`  
      `}`  
    `});`

    `const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {`  
      `apiName: 'fibonacci-api',`  
      `createDefaultStage: true`  
    `});`

    `httpApi.addRoutes({`  
      `path: '/health',`  
      `methods: [apigwv2.HttpMethod.GET],`  
      `integration: new integrations.HttpLambdaIntegration('HealthInt', apiFn)`  
    `});`

    `httpApi.addRoutes({`  
      `path: '/events',`  
      `methods: [apigwv2.HttpMethod.POST],`  
      `integration: new integrations.HttpLambdaIntegration('EventsInt', apiFn)`  
    `});`

    `// ===== EventBridge (event bus) + regra demo =====`  
    `const bus = new events.EventBus(this, 'EventBus', { eventBusName: 'fibonacci-bus' });`

    `const demoRule = new events.Rule(this, 'DemoRule', {`  
      `eventBus: bus,`  
      `eventPattern: { source: ['fibonacci.demo'] }`  
    `});`

    `// ===== SQS (fila + DLQ) =====`  
    `const dlq = new sqs.Queue(this, 'Dlq', { retentionPeriod: cdk.Duration.days(14) });`  
    `const queue = new sqs.Queue(this, 'Queue', {`  
      `visibilityTimeout: cdk.Duration.seconds(30),`  
      `receiveMessageWaitTime: cdk.Duration.seconds(10),`  
      `deadLetterQueue: { maxReceiveCount: 3, queue: dlq }`  
    `});`

    `demoRule.addTarget(new targets.SqsQueue(queue));`

    `// Permissões para a Lambda publicar no bus`  
    `bus.grantPutEventsTo(apiFn);`

    `// ===== VPC para Aurora =====`  
    `const vpc = new ec2.Vpc(this, 'Vpc', {`  
      `natGateways: 0,`  
      `subnetConfiguration: [`  
        `{ name: 'public', subnetType: ec2.SubnetType.PUBLIC }, // útil p/ futuras integrações`  
        `{ name: 'private-db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED }`  
      `],`  
      `maxAzs: 2`  
    `});`

    `// ===== Aurora Serverless v2 (Postgres) =====`  
    `const dbSecret = new rds.DatabaseSecret(this, 'DbSecret', {`  
      `username: 'dbadmin'`  
    `});`

    `const dbSg = new ec2.SecurityGroup(this, 'DbSg', { vpc, allowAllOutbound: true });`

    `const cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {`  
      `engine: rds.DatabaseClusterEngine.auroraPostgres({`  
        `version: rds.AuroraPostgresEngineVersion.VER_15_4`  
      `}),`  
      `credentials: rds.Credentials.fromSecret(dbSecret),`  
      `writer: rds.ClusterInstance.serverlessV2('writer'),`  
      `readers: [],`  
      `serverlessV2MinCapacity: 0.5,`  
      `serverlessV2MaxCapacity: 2,`  
      `vpc,`  
      `securityGroups: [dbSg],`  
      `defaultDatabaseName: 'fibonacci'`  
    `});`

    `// ===== Cognito (User Pool básico) =====`  
    `const userPool = new cognito.UserPool(this, 'UserPool', {`  
      `selfSignUpEnabled: true,`  
      `signInAliases: { email: true },`  
      `standardAttributes: { email: { required: true, mutable: false } },`  
      `passwordPolicy: { minLength: 8 }`  
    `});`

    `// ===== Saídas úteis =====`  
    ``new cdk.CfnOutput(this, 'CloudFrontURL', { value: `https://${dist.domainName}` });``  
    `new cdk.CfnOutput(this, 'BucketName', { value: siteBucket.bucketName });`  
    `new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.apiEndpoint });`  
    `new cdk.CfnOutput(this, 'EventBusName', { value: bus.eventBusName });`  
    `new cdk.CfnOutput(this, 'QueueUrl', { value: queue.queueUrl });`  
    `new cdk.CfnOutput(this, 'DbSecretName', { value: dbSecret.secretName });`  
    `new cdk.CfnOutput(this, 'DbClusterArn', { value: cluster.clusterArn });`  
    `new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });`  
  `}`  
`}`

## **lambda/handler.ts**

`import { EventBridge } from 'aws-sdk';`  
`const eb = new EventBridge();`

`export const handler = async (event: any) => {`  
  `if (event.requestContext?.http?.path === '/health') {`  
    `return { statusCode: 200, body: JSON.stringify({ ok: true }) };`  
  `}`

  `if (event.requestContext?.http?.path === '/events' && event.requestContext?.http?.method === 'POST') {`  
    `const detail = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;`  
    `await eb.putEvents({`  
      `Entries: [{`  
        `EventBusName: process.env.EVENT_BUS_NAME,`  
        `Source: detail?.source ?? 'fibonacci.demo',`  
        `DetailType: detail?.type ?? 'demo.event',`  
        `Detail: JSON.stringify(detail ?? {})`  
      `}]`  
    `}).promise();`

    `return { statusCode: 202, body: JSON.stringify({ accepted: true }) };`  
  `}`

  `return { statusCode: 404, body: 'Not Found' };`  
`};`

## **Comandos**

`# Pré-requisitos: Node 18+, AWS CLI configurado, conta com permissão de CDK.`  
`npm i`  
`export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)`  
`npm run bootstrap`  
`npm run deploy`

## **Próximos passos**

* **Definir o alvo** (Orquestrador B2B **ou** Assistente Pessoal) para nome/`tags`/domínios.

* Conectar **CI/CD** (GitHub Actions) e políticas de custo (Budgets \+ alerts).

* Adicionar **Step Functions** e **EventBridge Scheduler** conforme os seus fluxos.

* Conectar o backend do **Replit** (se mantiver parte dele) via API Gateway/Lambda ou migrar funções gradualmente.

