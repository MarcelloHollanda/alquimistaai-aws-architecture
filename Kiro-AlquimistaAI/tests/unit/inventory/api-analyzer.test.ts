/**
 * Testes Unitários para API Analyzer
 * 
 * Testa:
 * - Identificação de handlers
 * - Extração de rotas
 * - Diferenciação de APIs
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeFibonacciApi,
  analyzeNigredoApi,
  analyzeOperationalDashboardApi,
  analyzeAlquimistaPlatformApi,
  analyzeAllApis
} from '../../../scripts/inventory/analyzers/api-analyzer';

describe('API Analyzer', () => {
  describe('analyzeFibonacciApi', () => {
    it('deve identificar a API do Fibonacci', () => {
      const result = analyzeFibonacciApi();
      
      expect(result.name).toBe('Fibonacci Orquestrador');
      expect(result.purpose).toContain('orquestração');
      expect(result.apiGateway.dev).toBeDefined();
      expect(result.apiGateway.prod).toBeDefined();
    });

    it('deve ter tipo HTTP para API Gateway', () => {
      const result = analyzeFibonacciApi();
      
      expect(result.apiGateway.dev?.type).toBe('HTTP');
      expect(result.apiGateway.prod?.type).toBe('HTTP');
    });

    it('deve listar handlers do Fibonacci', () => {
      const result = analyzeFibonacciApi();
      
      expect(result.handlers).toBeDefined();
      expect(Array.isArray(result.handlers)).toBe(true);
    });

    it('deve listar integrações do Fibonacci', () => {
      const result = analyzeFibonacciApi();
      
      expect(result.integrations).toBeDefined();
      expect(result.integrations).toContain('Aurora PostgreSQL');
      expect(result.integrations).toContain('EventBridge');
    });
  });

  describe('analyzeNigredoApi', () => {
    it('deve identificar a API do Nigredo', () => {
      const result = analyzeNigredoApi();
      
      expect(result.name).toBe('Nigredo - Núcleo de Prospecção');
      expect(result.purpose).toContain('prospecção');
      expect(result.apiGateway.dev).toBeDefined();
      expect(result.apiGateway.prod).toBeDefined();
    });

    it('deve ter rotas de leads', () => {
      const result = analyzeNigredoApi();
      
      const devRoutes = result.apiGateway.dev?.routes || [];
      const hasLeadsRoute = devRoutes.some(route => route.includes('/api/leads'));
      
      expect(hasLeadsRoute).toBe(true);
    });

    it('deve listar handlers do Nigredo', () => {
      const result = analyzeNigredoApi();
      
      expect(result.handlers).toBeDefined();
      expect(Array.isArray(result.handlers)).toBe(true);
    });

    it('deve listar integrações específicas do Nigredo', () => {
      const result = analyzeNigredoApi();
      
      expect(result.integrations).toContain('AWS Comprehend (análise de sentimento)');
      expect(result.integrations).toContain('Bedrock (LLM para atendimento)');
    });
  });

  describe('analyzeOperationalDashboardApi', () => {
    it('deve identificar a API do Painel Operacional', () => {
      const result = analyzeOperationalDashboardApi();
      
      expect(result.name).toBe('Painel Operacional');
      expect(result.purpose).toContain('dashboard operacional');
      expect(result.apiGateway.dev).toBeDefined();
      expect(result.apiGateway.prod).toBeDefined();
    });

    it('deve ter rotas /tenant/* e /internal/*', () => {
      const result = analyzeOperationalDashboardApi();
      
      const devRoutes = result.apiGateway.dev?.routes || [];
      const hasTenantRoute = devRoutes.some(route => route.includes('/tenant/'));
      const hasInternalRoute = devRoutes.some(route => route.includes('/internal/'));
      
      expect(hasTenantRoute).toBe(true);
      expect(hasInternalRoute).toBe(true);
    });

    it('deve listar handlers de platform e internal', () => {
      const result = analyzeOperationalDashboardApi();
      
      expect(result.handlers).toBeDefined();
      expect(result.handlers.length).toBeGreaterThan(0);
    });

    it('deve listar integrações com Redis e DynamoDB', () => {
      const result = analyzeOperationalDashboardApi();
      
      expect(result.integrations).toContain('ElastiCache Redis (cache)');
      expect(result.integrations).toContain('DynamoDB (operational_commands)');
    });
  });

  describe('analyzeAlquimistaPlatformApi', () => {
    it('deve identificar a API da Plataforma Alquimista', () => {
      const result = analyzeAlquimistaPlatformApi();
      
      expect(result.name).toBe('Alquimista Platform');
      expect(result.purpose).toContain('marketplace');
      expect(result.apiGateway.dev).toBeDefined();
      expect(result.apiGateway.prod).toBeDefined();
    });

    it('deve ter rotas de agentes e assinaturas', () => {
      const result = analyzeAlquimistaPlatformApi();
      
      const devRoutes = result.apiGateway.dev?.routes || [];
      const hasAgentsRoute = devRoutes.some(route => route.includes('/api/agents'));
      const hasTrialsRoute = devRoutes.some(route => route.includes('/api/trials'));
      
      expect(hasAgentsRoute).toBe(true);
      expect(hasTrialsRoute).toBe(true);
    });

    it('deve listar handlers da plataforma', () => {
      const result = analyzeAlquimistaPlatformApi();
      
      expect(result.handlers).toBeDefined();
      expect(result.handlers.length).toBeGreaterThan(0);
    });

    it('deve listar integrações com Stripe e SES', () => {
      const result = analyzeAlquimistaPlatformApi();
      
      expect(result.integrations).toContain('Stripe (pagamentos)');
      expect(result.integrations).toContain('SES (e-mails comerciais)');
    });
  });

  describe('analyzeAllApis', () => {
    it('deve retornar todas as APIs do sistema', () => {
      const result = analyzeAllApis();
      
      expect(result.fibonacci).toBeDefined();
      expect(result.nigredo).toBeDefined();
      expect(result.operationalDashboard).toBeDefined();
      expect(result.alquimistaPlatform).toBeDefined();
    });

    it('deve diferenciar claramente cada API', () => {
      const result = analyzeAllApis();
      
      // Cada API deve ter nome único
      const names = [
        result.fibonacci.name,
        result.nigredo.name,
        result.operationalDashboard.name,
        result.alquimistaPlatform.name
      ];
      
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(4);
    });

    it('deve ter propósitos distintos para cada API', () => {
      const result = analyzeAllApis();
      
      // Fibonacci: orquestração
      expect(result.fibonacci.purpose).toContain('orquestração');
      
      // Nigredo: prospecção
      expect(result.nigredo.purpose).toContain('prospecção');
      
      // Operational Dashboard: dashboard operacional
      expect(result.operationalDashboard.purpose).toContain('dashboard operacional');
      
      // Alquimista Platform: marketplace
      expect(result.alquimistaPlatform.purpose).toContain('marketplace');
    });

    it('deve ter integrações específicas para cada API', () => {
      const result = analyzeAllApis();
      
      // Nigredo tem integrações únicas
      expect(result.nigredo.integrations).toContain('AWS Comprehend (análise de sentimento)');
      
      // Operational Dashboard tem integrações únicas
      expect(result.operationalDashboard.integrations).toContain('ElastiCache Redis (cache)');
      
      // Alquimista Platform tem integrações únicas
      expect(result.alquimistaPlatform.integrations).toContain('Stripe (pagamentos)');
    });
  });

  describe('Diferenciação de APIs', () => {
    it('deve diferenciar API Fibonacci de API Painel Operacional', () => {
      const fibonacci = analyzeFibonacciApi();
      const dashboard = analyzeOperationalDashboardApi();
      
      // Nomes diferentes
      expect(fibonacci.name).not.toBe(dashboard.name);
      expect(fibonacci.name).toBe('Fibonacci Orquestrador');
      expect(dashboard.name).toBe('Painel Operacional');
      
      // Propósitos diferentes
      expect(fibonacci.purpose).not.toBe(dashboard.purpose);
      expect(fibonacci.purpose).toContain('orquestração');
      expect(dashboard.purpose).toContain('dashboard operacional');
      
      // Integrações diferentes
      const fibonacciIntegrations = fibonacci.integrations.join(',');
      const dashboardIntegrations = dashboard.integrations.join(',');
      
      expect(fibonacciIntegrations).not.toBe(dashboardIntegrations);
      
      // Dashboard tem integrações específicas
      expect(dashboard.integrations).toContain('ElastiCache Redis (cache)');
      expect(dashboard.integrations).toContain('DynamoDB (operational_commands)');
    });

    it('deve identificar rotas únicas de cada API', () => {
      const all = analyzeAllApis();
      
      // Nigredo tem rotas /api/leads
      const nigredoRoutes = all.nigredo.apiGateway.dev?.routes || [];
      const hasLeadsRoute = nigredoRoutes.some(r => r.includes('/api/leads'));
      expect(hasLeadsRoute).toBe(true);
      
      // Operational Dashboard tem rotas /tenant/* e /internal/*
      const dashboardRoutes = all.operationalDashboard.apiGateway.dev?.routes || [];
      const hasTenantRoute = dashboardRoutes.some(r => r.includes('/tenant/'));
      const hasInternalRoute = dashboardRoutes.some(r => r.includes('/internal/'));
      expect(hasTenantRoute).toBe(true);
      expect(hasInternalRoute).toBe(true);
      
      // Alquimista Platform tem rotas /api/agents, /api/trials
      const platformRoutes = all.alquimistaPlatform.apiGateway.dev?.routes || [];
      const hasAgentsRoute = platformRoutes.some(r => r.includes('/api/agents'));
      const hasTrialsRoute = platformRoutes.some(r => r.includes('/api/trials'));
      expect(hasAgentsRoute).toBe(true);
      expect(hasTrialsRoute).toBe(true);
    });
  });

  describe('Estrutura de Dados', () => {
    it('deve retornar estrutura BackendApiInfo válida', () => {
      const result = analyzeFibonacciApi();
      
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('purpose');
      expect(result).toHaveProperty('apiGateway');
      expect(result).toHaveProperty('handlers');
      expect(result).toHaveProperty('integrations');
      
      expect(typeof result.name).toBe('string');
      expect(typeof result.purpose).toBe('string');
      expect(Array.isArray(result.handlers)).toBe(true);
      expect(Array.isArray(result.integrations)).toBe(true);
    });

    it('deve ter informações de API Gateway para dev e prod', () => {
      const result = analyzeNigredoApi();
      
      expect(result.apiGateway).toHaveProperty('dev');
      expect(result.apiGateway).toHaveProperty('prod');
      
      if (result.apiGateway.dev) {
        expect(result.apiGateway.dev).toHaveProperty('logicalName');
        expect(result.apiGateway.dev).toHaveProperty('type');
        expect(result.apiGateway.dev).toHaveProperty('routes');
      }
    });

    it('deve ter informações completas de handlers', () => {
      const result = analyzeOperationalDashboardApi();
      
      if (result.handlers.length > 0) {
        const handler = result.handlers[0];
        
        expect(handler).toHaveProperty('logicalName');
        expect(handler).toHaveProperty('file');
        expect(handler).toHaveProperty('purpose');
        expect(handler).toHaveProperty('routes');
        
        expect(typeof handler.logicalName).toBe('string');
        expect(typeof handler.file).toBe('string');
        expect(typeof handler.purpose).toBe('string');
        expect(Array.isArray(handler.routes)).toBe(true);
      }
    });
  });
});
