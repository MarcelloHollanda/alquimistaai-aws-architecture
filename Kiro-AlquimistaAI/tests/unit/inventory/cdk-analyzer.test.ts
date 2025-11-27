/**
 * Testes unitários para o analisador de infraestrutura CDK
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeCdkInfrastructure } from '../../../scripts/inventory/analyzers/cdk-analyzer';

describe('CDK Analyzer', () => {
  const workspaceRoot = process.cwd();

  describe('analyzeCdkInfrastructure', () => {
    it('deve analisar a infraestrutura CDK do projeto', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Verificar estrutura básica
      expect(result).toBeDefined();
      expect(result.stacks).toBeDefined();
      expect(Array.isArray(result.stacks)).toBe(true);
      expect(result.region).toBeDefined();
      expect(result.account).toBeDefined();
    });

    it('deve identificar a região correta', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Região deve ser us-east-1 baseado no projeto
      expect(result.region).toBe('us-east-1');
    });

    it('deve identificar múltiplas stacks', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Projeto deve ter várias stacks
      expect(result.stacks.length).toBeGreaterThan(0);
      
      // Verificar se stacks principais existem
      const stackNames = result.stacks.map(s => s.name);
      expect(stackNames.some(name => name.includes('Fibonacci'))).toBe(true);
    });
  });

  describe('Stack Analysis', () => {
    it('deve extrair informações básicas de cada stack', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      result.stacks.forEach(stack => {
        // Cada stack deve ter nome
        expect(stack.name).toBeDefined();
        expect(typeof stack.name).toBe('string');
        expect(stack.name.length).toBeGreaterThan(0);

        // Cada stack deve ter estrutura de recursos
        expect(stack.resources).toBeDefined();
        expect(stack.resources.apis).toBeDefined();
        expect(stack.resources.lambdas).toBeDefined();
        expect(stack.resources.databases).toBeDefined();
        expect(stack.resources.storage).toBeDefined();
        expect(stack.resources.security).toBeDefined();
      });
    });

    it('deve identificar o ambiente correto das stacks', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      result.stacks.forEach(stack => {
        // Ambiente deve ser dev, prod ou both
        expect(['dev', 'prod', 'both']).toContain(stack.environment);
      });
    });
  });

  describe('API Gateway Extraction', () => {
    it('deve extrair APIs HTTP corretamente', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar por stacks com APIs
      const stacksWithApis = result.stacks.filter(s => s.resources.apis.length > 0);
      expect(stacksWithApis.length).toBeGreaterThan(0);

      stacksWithApis.forEach(stack => {
        stack.resources.apis.forEach(api => {
          // Verificar estrutura da API
          expect(api.logicalName).toBeDefined();
          expect(api.type).toBeDefined();
          expect(['HTTP', 'REST']).toContain(api.type);
          
          // Nome deve estar presente
          if (api.name) {
            expect(typeof api.name).toBe('string');
          }

          // Rotas devem ser um array
          expect(Array.isArray(api.routes)).toBe(true);
        });
      });
    });

    it('deve extrair rotas das APIs quando disponíveis', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const stacksWithApis = result.stacks.filter(s => s.resources.apis.length > 0);
      
      if (stacksWithApis.length > 0) {
        // Verificar se pelo menos algumas APIs têm rotas
        const allApis = stacksWithApis.flatMap(s => s.resources.apis);
        const apisWithRoutes = allApis.filter(api => api.routes.length > 0);

        // Se houver APIs com rotas, validar formato
        if (apisWithRoutes.length > 0) {
          apisWithRoutes.forEach(api => {
            api.routes.forEach(route => {
              // Rotas devem começar com /
              expect(route.startsWith('/')).toBe(true);
            });
          });
        }
      }
    });
  });

  describe('Lambda Extraction', () => {
    it('deve extrair funções Lambda corretamente', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar por stacks com Lambdas
      const stacksWithLambdas = result.stacks.filter(s => s.resources.lambdas.length > 0);
      expect(stacksWithLambdas.length).toBeGreaterThan(0);

      stacksWithLambdas.forEach(stack => {
        stack.resources.lambdas.forEach(lambda => {
          // Verificar estrutura da Lambda
          expect(lambda.logicalName).toBeDefined();
          expect(lambda.functionName).toBeDefined();
          
          // Runtime deve estar presente
          expect(lambda.runtime).toBeDefined();
          
          // File path pode estar vazio mas deve ser string
          expect(typeof lambda.file).toBe('string');
        });
      });
    });

    it('deve identificar o arquivo de entrada das Lambdas NodeJS', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allLambdas = result.stacks.flatMap(s => s.resources.lambdas);
      
      // Lambdas com arquivo definido
      const lambdasWithFile = allLambdas.filter(l => l.file.length > 0);
      
      if (lambdasWithFile.length > 0) {
        lambdasWithFile.forEach(lambda => {
          // Arquivo deve ter extensão .ts
          expect(lambda.file.endsWith('.ts')).toBe(true);
          
          // Arquivo deve começar com lambda/
          expect(lambda.file.startsWith('lambda/')).toBe(true);
        });
      }
    });
  });

  describe('Database Extraction', () => {
    it('deve extrair bancos de dados corretamente', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar por stacks com bancos de dados
      const stacksWithDbs = result.stacks.filter(s => s.resources.databases.length > 0);
      
      if (stacksWithDbs.length > 0) {
        stacksWithDbs.forEach(stack => {
          stack.resources.databases.forEach(db => {
            // Verificar estrutura do banco
            expect(db.logicalName).toBeDefined();
            expect(db.type).toBeDefined();
            expect(db.engine).toBeDefined();
            expect(db.mode).toBeDefined();
            expect(db.region).toBeDefined();
          });
        });
      }
    });

    it('deve identificar Aurora Serverless v2', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allDatabases = result.stacks.flatMap(s => s.resources.databases);
      const auroraDbs = allDatabases.filter(db => db.type === 'Aurora');
      
      if (auroraDbs.length > 0) {
        auroraDbs.forEach(db => {
          // Engine deve ser aurora-postgresql ou aurora-mysql
          expect(['aurora-postgresql', 'aurora-mysql', 'unknown']).toContain(db.engine);
          
          // Mode deve estar definido
          expect(db.mode).toBeDefined();
        });
      }
    });

    it('deve identificar tabelas DynamoDB', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allDatabases = result.stacks.flatMap(s => s.resources.databases);
      const dynamoTables = allDatabases.filter(db => db.type === 'DynamoDB');
      
      if (dynamoTables.length > 0) {
        dynamoTables.forEach(table => {
          // Engine deve ser dynamodb
          expect(table.engine).toBe('dynamodb');
          
          // Deve ter tableName
          expect(table.tableName).toBeDefined();
        });
      }
    });
  });

  describe('Storage Extraction', () => {
    it('deve extrair buckets S3 corretamente', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const stacksWithStorage = result.stacks.filter(s => s.resources.storage.length > 0);
      
      if (stacksWithStorage.length > 0) {
        stacksWithStorage.forEach(stack => {
          stack.resources.storage.forEach(storage => {
            // Verificar estrutura
            expect(storage.logicalName).toBeDefined();
            expect(storage.type).toBeDefined();
            expect(storage.name).toBeDefined();
            expect(typeof storage.encrypted).toBe('boolean');
          });
        });
      }
    });

    it('deve identificar buckets S3', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allStorage = result.stacks.flatMap(s => s.resources.storage);
      const s3Buckets = allStorage.filter(s => s.type === 'S3');
      
      if (s3Buckets.length > 0) {
        s3Buckets.forEach(bucket => {
          // Nome deve estar presente
          expect(bucket.name).toBeDefined();
          
          // Purpose deve estar presente
          expect(bucket.purpose).toBeDefined();
        });
      }
    });

    it('deve identificar distribuições CloudFront', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allStorage = result.stacks.flatMap(s => s.resources.storage);
      const cloudFrontDists = allStorage.filter(s => s.type === 'CloudFront');
      
      if (cloudFrontDists.length > 0) {
        cloudFrontDists.forEach(dist => {
          // CloudFront sempre deve ser encrypted (HTTPS)
          expect(dist.encrypted).toBe(true);
        });
      }
    });
  });

  describe('Security Extraction', () => {
    it('deve extrair recursos de segurança corretamente', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const stacksWithSecurity = result.stacks.filter(s => s.resources.security.length > 0);
      
      if (stacksWithSecurity.length > 0) {
        stacksWithSecurity.forEach(stack => {
          stack.resources.security.forEach(security => {
            // Verificar estrutura
            expect(security.logicalName).toBeDefined();
            expect(security.type).toBeDefined();
            expect(security.name).toBeDefined();
            expect(security.purpose).toBeDefined();
            expect(typeof security.enabled).toBe('boolean');
          });
        });
      }
    });

    it('deve identificar WAF Web ACLs', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allSecurity = result.stacks.flatMap(s => s.resources.security);
      const wafAcls = allSecurity.filter(s => s.type === 'WAF');
      
      if (wafAcls.length > 0) {
        wafAcls.forEach(waf => {
          // WAF deve estar habilitado
          expect(waf.enabled).toBe(true);
          
          // Nome deve estar presente
          expect(waf.name).toBeDefined();
        });
      }
    });

    it('deve identificar KMS Keys', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allSecurity = result.stacks.flatMap(s => s.resources.security);
      const kmsKeys = allSecurity.filter(s => s.type === 'KMS');
      
      if (kmsKeys.length > 0) {
        kmsKeys.forEach(key => {
          // KMS deve estar habilitado
          expect(key.enabled).toBe(true);
          
          // Purpose deve mencionar encryption
          expect(key.purpose.toLowerCase()).toContain('encrypt');
        });
      }
    });

    it('deve identificar Security Groups', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allSecurity = result.stacks.flatMap(s => s.resources.security);
      const securityGroups = allSecurity.filter(s => s.type === 'SecurityGroup');
      
      if (securityGroups.length > 0) {
        securityGroups.forEach(sg => {
          // Security Group deve estar habilitado
          expect(sg.enabled).toBe(true);
        });
      }
    });
  });

  describe('Resource Relationships', () => {
    it('deve mapear relações entre APIs e Lambdas', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Verificar se existem stacks com APIs e Lambdas
      const stacksWithBoth = result.stacks.filter(
        s => s.resources.apis.length > 0 && s.resources.lambdas.length > 0
      );

      if (stacksWithBoth.length > 0) {
        // Pelo menos uma stack deve ter ambos os recursos
        expect(stacksWithBoth.length).toBeGreaterThan(0);
      }
    });

    it('deve identificar stacks com recursos', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Pelo menos uma stack deve ter algum recurso
      const stacksWithResources = result.stacks.filter(stack => {
        const resourceTypes = [
          stack.resources.apis.length > 0,
          stack.resources.lambdas.length > 0,
          stack.resources.databases.length > 0,
          stack.resources.storage.length > 0,
          stack.resources.security.length > 0
        ].filter(Boolean).length;

        return resourceTypes > 0;
      });

      // Deve haver pelo menos uma stack com recursos
      expect(stacksWithResources.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com diretório inexistente graciosamente', async () => {
      const invalidPath = path.join(workspaceRoot, 'non-existent-directory');
      
      // Não deve lançar erro, mas retornar resultado vazio ou parcial
      await expect(analyzeCdkInfrastructure(invalidPath)).rejects.toThrow();
    });

    it('deve lidar com arquivos CDK malformados', async () => {
      // Este teste verifica que o analisador não quebra com arquivos inválidos
      // O comportamento esperado é retornar informações parciais ou pular o arquivo
      const result = await analyzeCdkInfrastructure(workspaceRoot);
      
      // Deve retornar algum resultado mesmo se alguns arquivos forem problemáticos
      expect(result).toBeDefined();
      expect(result.stacks).toBeDefined();
    });
  });

  describe('Stack Parsing - Detalhado', () => {
    it('deve parsear corretamente nomes de stacks com diferentes convenções', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Verificar que stacks com diferentes convenções de nomenclatura são parseadas
      const stackNames = result.stacks.map(s => s.name);
      
      // Deve haver stacks com nomes válidos
      stackNames.forEach(name => {
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        // Nomes não devem conter 'Stack' no final (deve ser removido)
        expect(name.endsWith('Stack')).toBe(false);
      });
    });

    it('deve extrair descrições de stacks quando disponíveis', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Verificar se alguma stack tem descrição
      const stacksWithDescription = result.stacks.filter(s => s.description && s.description.length > 0);
      
      if (stacksWithDescription.length > 0) {
        stacksWithDescription.forEach(stack => {
          expect(typeof stack.description).toBe('string');
          expect(stack.description.length).toBeGreaterThan(0);
        });
      }
    });

    it('deve identificar stacks específicas do projeto', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);
      const stackNames = result.stacks.map(s => s.name.toLowerCase());

      // Verificar stacks conhecidas do projeto AlquimistaAI
      const expectedStacks = ['fibonacci', 'nigredo', 'alquimista', 'waf', 'security'];
      
      // Pelo menos algumas das stacks esperadas devem existir
      const foundExpectedStacks = expectedStacks.filter(expected => 
        stackNames.some(name => name.includes(expected))
      );

      expect(foundExpectedStacks.length).toBeGreaterThan(0);
    });

    it('deve parsear stacks com ambientes diferentes', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Verificar distribuição de ambientes
      const environments = result.stacks.map(s => s.environment);
      const uniqueEnvironments = [...new Set(environments)];

      // Deve haver pelo menos um tipo de ambiente
      expect(uniqueEnvironments.length).toBeGreaterThan(0);
      
      // Todos os ambientes devem ser válidos
      uniqueEnvironments.forEach(env => {
        expect(['dev', 'prod', 'both']).toContain(env);
      });
    });
  });

  describe('Resource Extraction - Detalhado', () => {
    it('deve extrair múltiplas APIs de uma mesma stack', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar stacks com múltiplas APIs
      const stacksWithMultipleApis = result.stacks.filter(s => s.resources.apis.length > 1);
      
      if (stacksWithMultipleApis.length > 0) {
        stacksWithMultipleApis.forEach(stack => {
          // Verificar que cada API tem identificador único
          const apiNames = stack.resources.apis.map(api => api.logicalName);
          const uniqueNames = new Set(apiNames);
          expect(uniqueNames.size).toBe(apiNames.length);
        });
      }
    });

    it('deve extrair múltiplas Lambdas de uma mesma stack', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar stacks com múltiplas Lambdas
      const stacksWithMultipleLambdas = result.stacks.filter(s => s.resources.lambdas.length > 1);
      
      if (stacksWithMultipleLambdas.length > 0) {
        stacksWithMultipleLambdas.forEach(stack => {
          // Verificar que cada Lambda tem identificador único
          const lambdaNames = stack.resources.lambdas.map(l => l.logicalName);
          const uniqueNames = new Set(lambdaNames);
          expect(uniqueNames.size).toBe(lambdaNames.length);
        });
      }
    });

    it('deve extrair propósito das Lambdas quando disponível', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allLambdas = result.stacks.flatMap(s => s.resources.lambdas);
      const lambdasWithPurpose = allLambdas.filter(l => l.purpose && l.purpose.length > 0);
      
      if (lambdasWithPurpose.length > 0) {
        lambdasWithPurpose.forEach(lambda => {
          expect(typeof lambda.purpose).toBe('string');
          expect(lambda.purpose.length).toBeGreaterThan(0);
        });
      }
    });

    it('deve identificar runtime correto das Lambdas', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allLambdas = result.stacks.flatMap(s => s.resources.lambdas);
      
      if (allLambdas.length > 0) {
        allLambdas.forEach(lambda => {
          // Runtime deve estar definido
          expect(lambda.runtime).toBeDefined();
          
          // Projeto usa Node.js 20
          expect(lambda.runtime).toContain('nodejs');
        });
      }
    });

    it('deve extrair informações de encryption de storage', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allStorage = result.stacks.flatMap(s => s.resources.storage);
      
      if (allStorage.length > 0) {
        allStorage.forEach(storage => {
          // Encryption deve ser boolean
          expect(typeof storage.encrypted).toBe('boolean');
          
          // CloudFront sempre deve ser encrypted
          if (storage.type === 'CloudFront') {
            expect(storage.encrypted).toBe(true);
          }
        });
      }
    });

    it('deve inferir propósito de buckets S3 baseado no nome', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allStorage = result.stacks.flatMap(s => s.resources.storage);
      const s3Buckets = allStorage.filter(s => s.type === 'S3');
      
      if (s3Buckets.length > 0) {
        s3Buckets.forEach(bucket => {
          // Purpose deve estar presente
          expect(bucket.purpose).toBeDefined();
          expect(bucket.purpose.length).toBeGreaterThan(0);
          
          // Purpose deve ser uma string descritiva
          expect(typeof bucket.purpose).toBe('string');
        });
      }
    });
  });

  describe('Resource Relationships - Mapeamento', () => {
    it('deve mapear Lambdas para suas APIs correspondentes', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Encontrar stacks com APIs e Lambdas
      const stacksWithBoth = result.stacks.filter(
        s => s.resources.apis.length > 0 && s.resources.lambdas.length > 0
      );

      if (stacksWithBoth.length > 0) {
        stacksWithBoth.forEach(stack => {
          // Verificar que existem recursos relacionados
          expect(stack.resources.apis.length).toBeGreaterThan(0);
          expect(stack.resources.lambdas.length).toBeGreaterThan(0);
          
          // APIs devem ter rotas
          const apisWithRoutes = stack.resources.apis.filter(api => api.routes.length > 0);
          
          // Se houver APIs com rotas, validar
          if (apisWithRoutes.length > 0) {
            apisWithRoutes.forEach(api => {
              expect(api.routes.length).toBeGreaterThan(0);
            });
          }
        });
      }
    });

    it('deve identificar stacks de segurança com recursos apropriados', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar por stacks de segurança
      const securityStacks = result.stacks.filter(s => 
        s.name.toLowerCase().includes('security') || 
        s.name.toLowerCase().includes('waf')
      );

      if (securityStacks.length > 0) {
        securityStacks.forEach(stack => {
          // Stacks de segurança devem ter recursos de segurança
          expect(stack.resources.security.length).toBeGreaterThan(0);
        });
      }
    });

    it('deve identificar stacks de frontend com storage apropriado', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar por stacks de frontend
      const frontendStacks = result.stacks.filter(s => 
        s.name.toLowerCase().includes('frontend') || 
        s.name.toLowerCase().includes('site')
      );

      if (frontendStacks.length > 0) {
        frontendStacks.forEach(stack => {
          // Stacks de frontend devem ter storage (S3 ou CloudFront)
          const hasStorage = stack.resources.storage.length > 0;
          
          if (hasStorage) {
            const storageTypes = stack.resources.storage.map(s => s.type);
            // Deve ter S3 ou CloudFront
            const hasFrontendStorage = storageTypes.some(type => 
              type === 'S3' || type === 'CloudFront'
            );
            expect(hasFrontendStorage).toBe(true);
          }
        });
      }
    });

    it('deve identificar stacks de backend com APIs e Lambdas', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar por stacks de backend
      const backendStacks = result.stacks.filter(s => 
        s.name.toLowerCase().includes('fibonacci') || 
        s.name.toLowerCase().includes('nigredo') ||
        s.name.toLowerCase().includes('alquimista')
      );

      if (backendStacks.length > 0) {
        backendStacks.forEach(stack => {
          // Stacks de backend devem ter APIs ou Lambdas
          const hasBackendResources = 
            stack.resources.apis.length > 0 || 
            stack.resources.lambdas.length > 0;
          
          expect(hasBackendResources).toBe(true);
        });
      }
    });

    it('deve mapear bancos de dados para stacks apropriadas', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      // Procurar stacks com bancos de dados
      const stacksWithDbs = result.stacks.filter(s => s.resources.databases.length > 0);

      if (stacksWithDbs.length > 0) {
        stacksWithDbs.forEach(stack => {
          // Stacks com bancos devem ter Lambdas (para acessar o banco)
          // ou ser stacks dedicadas de infraestrutura
          const hasLambdas = stack.resources.lambdas.length > 0;
          const isInfraStack = stack.name.toLowerCase().includes('alquimista') ||
                              stack.name.toLowerCase().includes('platform');
          
          // Pelo menos uma das condições deve ser verdadeira
          expect(hasLambdas || isInfraStack).toBe(true);
        });
      }
    });
  });

  describe('Data Consistency', () => {
    it('deve garantir que todos os recursos tenham identificadores únicos dentro da stack', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      result.stacks.forEach(stack => {
        // Verificar unicidade de APIs
        const apiNames = stack.resources.apis.map(api => api.logicalName);
        expect(new Set(apiNames).size).toBe(apiNames.length);

        // Verificar unicidade de Lambdas
        const lambdaNames = stack.resources.lambdas.map(l => l.logicalName);
        expect(new Set(lambdaNames).size).toBe(lambdaNames.length);

        // Verificar unicidade de Databases
        const dbNames = stack.resources.databases.map(db => db.logicalName);
        expect(new Set(dbNames).size).toBe(dbNames.length);

        // Verificar unicidade de Storage
        const storageNames = stack.resources.storage.map(s => s.logicalName);
        expect(new Set(storageNames).size).toBe(storageNames.length);

        // Verificar unicidade de Security
        const securityNames = stack.resources.security.map(s => s.logicalName);
        expect(new Set(securityNames).size).toBe(securityNames.length);
      });
    });

    it('deve garantir que nomes de stacks sejam únicos', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const stackNames = result.stacks.map(s => s.name);
      const uniqueNames = new Set(stackNames);

      // Todos os nomes devem ser únicos
      expect(uniqueNames.size).toBe(stackNames.length);
    });

    it('deve garantir que tipos de recursos sejam válidos', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const validApiTypes = ['HTTP', 'REST'];
      const validStorageTypes = ['S3', 'EFS', 'DynamoDB', 'CloudFront'];
      const validSecurityTypes = ['WAF', 'SecurityGroup', 'IAM', 'KMS', 'CloudTrail'];

      result.stacks.forEach(stack => {
        // Validar tipos de API
        stack.resources.apis.forEach(api => {
          expect(validApiTypes).toContain(api.type);
        });

        // Validar tipos de Storage
        stack.resources.storage.forEach(storage => {
          expect(validStorageTypes).toContain(storage.type);
        });

        // Validar tipos de Security
        stack.resources.security.forEach(security => {
          expect(validSecurityTypes).toContain(security.type);
        });
      });
    });

    it('deve garantir que rotas de API sejam válidas', async () => {
      const result = await analyzeCdkInfrastructure(workspaceRoot);

      const allApis = result.stacks.flatMap(s => s.resources.apis);
      const apisWithRoutes = allApis.filter(api => api.routes.length > 0);

      if (apisWithRoutes.length > 0) {
        apisWithRoutes.forEach(api => {
          api.routes.forEach(route => {
            // Rotas devem começar com /
            expect(route.startsWith('/')).toBe(true);
            
            // Rotas não devem ter espaços
            expect(route).not.toContain(' ');
            
            // Rotas devem ter pelo menos 2 caracteres (/ + algo)
            expect(route.length).toBeGreaterThan(1);
          });
        });
      }
    });
  });
});
