/**
 * Setup global para testes
 * Configura mocks e variáveis de ambiente
 */

import { vi } from 'vitest';

// Configurar variáveis de ambiente para testes
process.env.AWS_REGION = 'us-east-1';
process.env.AURORA_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret';
process.env.AURORA_CLUSTER_ARN = 'arn:aws:rds:us-east-1:123456789012:cluster:test-cluster';
process.env.NODE_ENV = 'test';

// Mock AWS SDK clients globalmente
vi.mock('@aws-sdk/client-rds-data', () => ({
  RDSDataClient: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({
      records: [],
      numberOfRecordsUpdated: 0,
    }),
  })),
  ExecuteStatementCommand: vi.fn((params) => params),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  PutItemCommand: vi.fn((params) => params),
  GetItemCommand: vi.fn((params) => params),
  UpdateItemCommand: vi.fn((params) => params),
  QueryCommand: vi.fn((params) => params),
  ScanCommand: vi.fn((params) => params),
}));

vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({
      SecretString: JSON.stringify({
        username: 'test_user',
        password: 'test_password',
        host: 'localhost',
        port: 5432,
        dbname: 'test_db',
      }),
    }),
  })),
  GetSecretValueCommand: vi.fn((params) => params),
}));

// Mock Redis Client
vi.mock('../lambda/shared/redis-client', () => ({
  getCacheManager: vi.fn(() => Promise.resolve({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    getOrSet: vi.fn((key: string, fetcher: () => any) => fetcher()),
    invalidate: vi.fn().mockResolvedValue(true),
    invalidatePattern: vi.fn().mockResolvedValue(true),
  })),
  buildCacheKey: vi.fn((...args: any[]) => args.join(':')),
  CacheTTL: {
    TENANTS_LIST: 300,
    TENANT_DETAIL: 600,
    METRICS: 180,
    AGENTS: 300,
  },
}));

// Mock Logger
vi.mock('../lambda/shared/logger', () => ({
  Logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));
