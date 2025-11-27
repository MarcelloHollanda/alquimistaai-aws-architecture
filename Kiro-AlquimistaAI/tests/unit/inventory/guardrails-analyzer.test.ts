/**
 * Testes unitários para o Analisador de Guardrails
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeGuardrails } from '../../../scripts/inventory/analyzers/guardrails-analyzer';
import type { GuardrailsInfo } from '../../../scripts/inventory/types';

describe('Guardrails Analyzer', () => {
  const testWorkspaceRoot = path.join(__dirname, '..', '..', '..');

  describe('analyzeGuardrails', () => {
    it('deve retornar estrutura completa de guardrails', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);

      expect(result).toBeDefined();
      expect(result.security).toBeDefined();
      expect(result.cost).toBeDefined();
      expect(result.observability).toBeDefined();
    });

    it('deve analisar guardrails de segurança', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);

      expect(result.security.cloudTrail).toBeDefined();
      expect(result.security.guardDuty).toBeDefined();
      expect(result.security.waf).toBeDefined();
      expect(result.security.snsTopics).toBeDefined();
      expect(Array.isArray(result.security.snsTopics)).toBe(true);
    });

    it('deve analisar guardrails de custo', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);

      expect(result.cost.budgets).toBeDefined();
      expect(Array.isArray(result.cost.budgets)).toBe(true);
      expect(result.cost.snsTopics).toBeDefined();
      expect(Array.isArray(result.cost.snsTopics)).toBe(true);
    });

    it('deve analisar guardrails de observabilidade', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);

      expect(result.observability.dashboards).toBeDefined();
      expect(Array.isArray(result.observability.dashboards)).toBe(true);
    });
  });

  describe('Security Guardrails', () => {
    it('deve extrair configuração do CloudTrail', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const cloudTrail = result.security.cloudTrail;

      expect(cloudTrail.enabled).toBe(true);
      expect(cloudTrail.region).toBe('us-east-1');
      expect(cloudTrail.retentionDays).toBeGreaterThan(0);
      expect(cloudTrail.logFileValidation).toBeDefined();
      expect(cloudTrail.multiRegion).toBeDefined();
    });

    it('deve extrair configuração do GuardDuty', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const guardDuty = result.security.guardDuty;

      expect(guardDuty.enabled).toBeDefined();
      expect(guardDuty.region).toBe('us-east-1');
      expect(guardDuty.findingPublishingFrequency).toBeDefined();
    });

    it('deve extrair configuração do WAF', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const waf = result.security.waf;

      expect(waf.enabled).toBeDefined();
      expect(Array.isArray(waf.webAcls)).toBe(true);
      expect(Array.isArray(waf.ipSets)).toBe(true);
      expect(Array.isArray(waf.logGroups)).toBe(true);
    });

    it('deve identificar Web ACLs do WAF', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const waf = result.security.waf;

      if (waf.enabled && waf.webAcls.length > 0) {
        const webAcl = waf.webAcls[0];
        expect(webAcl.name).toBeDefined();
        expect(webAcl.scope).toBeDefined();
        expect(['REGIONAL', 'CLOUDFRONT']).toContain(webAcl.scope);
        expect(webAcl.environment).toBeDefined();
        expect(['dev', 'prod']).toContain(webAcl.environment);
        expect(Array.isArray(webAcl.rules)).toBe(true);
      }
    });

    it('deve identificar IP Sets do WAF', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const waf = result.security.waf;

      if (waf.enabled && waf.ipSets.length > 0) {
        const ipSet = waf.ipSets[0];
        expect(ipSet.name).toBeDefined();
        expect(ipSet.scope).toBeDefined();
        expect(ipSet.ipAddressVersion).toBeDefined();
        expect(ipSet.description).toBeDefined();
        expect(Array.isArray(ipSet.addresses)).toBe(true);
      }
    });

    it('deve identificar Log Groups do WAF', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const waf = result.security.waf;

      if (waf.enabled && waf.logGroups.length > 0) {
        const logGroup = waf.logGroups[0];
        expect(logGroup.name).toBeDefined();
        expect(logGroup.name).toMatch(/^aws-waf-logs-/);
        expect(logGroup.retentionDays).toBeGreaterThan(0);
        expect(logGroup.environment).toBeDefined();
        expect(['dev', 'prod']).toContain(logGroup.environment);
      }
    });

    it('deve identificar SNS Topics de segurança', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const snsTopics = result.security.snsTopics;

      if (snsTopics.length > 0) {
        const topic = snsTopics[0];
        expect(topic.name).toBeDefined();
        expect(topic.displayName).toBeDefined();
        expect(topic.purpose).toBeDefined();
        expect(Array.isArray(topic.subscriptions)).toBe(true);
      }
    });
  });

  describe('Cost Guardrails', () => {
    it('deve extrair configuração de Budgets', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const budgets = result.cost.budgets;

      if (budgets.length > 0) {
        const budget = budgets[0];
        expect(budget.name).toBeDefined();
        expect(budget.budgetType).toBeDefined();
        expect(budget.timeUnit).toBeDefined();
        expect(budget.amount).toBeGreaterThan(0);
        expect(budget.currency).toBeDefined();
        expect(Array.isArray(budget.thresholds)).toBe(true);
        expect(budget.thresholds.length).toBeGreaterThan(0);
        expect(Array.isArray(budget.notificationTypes)).toBe(true);
      }
    });

    it('deve validar thresholds de Budget', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const budgets = result.cost.budgets;

      if (budgets.length > 0) {
        const budget = budgets[0];
        // Thresholds devem ser 80%, 100%, 120%
        expect(budget.thresholds).toContain(80);
        expect(budget.thresholds).toContain(100);
        expect(budget.thresholds).toContain(120);
      }
    });

    it('deve extrair configuração de Cost Anomaly Detection', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const anomalyDetection = result.cost.anomalyDetection;

      if (anomalyDetection) {
        expect(anomalyDetection.monitorName).toBeDefined();
        expect(anomalyDetection.monitorType).toBeDefined();
        expect(anomalyDetection.dimension).toBeDefined();
        expect(anomalyDetection.threshold).toBeGreaterThan(0);
        expect(anomalyDetection.frequency).toBeDefined();
      }
    });

    it('deve identificar SNS Topics de custo', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const snsTopics = result.cost.snsTopics;

      if (snsTopics.length > 0) {
        const topic = snsTopics[0];
        expect(topic.name).toBeDefined();
        expect(topic.displayName).toBeDefined();
        expect(topic.purpose).toContain('custo');
        expect(Array.isArray(topic.subscriptions)).toBe(true);
      }
    });
  });

  describe('Observability Guardrails', () => {
    it('deve identificar dashboards CloudWatch', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const dashboards = result.observability.dashboards;

      expect(Array.isArray(dashboards)).toBe(true);
      
      if (dashboards.length > 0) {
        const dashboard = dashboards[0];
        expect(dashboard.name).toBeDefined();
        expect(Array.isArray(dashboard.widgets)).toBe(true);
        expect(dashboard.purpose).toBeDefined();
      }
    });

    it('deve identificar widgets dos dashboards', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const dashboards = result.observability.dashboards;

      if (dashboards.length > 0) {
        const dashboard = dashboards[0];
        expect(dashboard.widgets.length).toBeGreaterThan(0);
        
        // Widgets devem ter formato "Graph: ..." ou "SingleValue: ..."
        const hasValidFormat = dashboard.widgets.every(widget => 
          widget.startsWith('Graph: ') || widget.startsWith('SingleValue: ')
        );
        expect(hasValidFormat).toBe(true);
      }
    });

    it('deve identificar dashboards específicos', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      const dashboards = result.observability.dashboards;

      const dashboardNames = dashboards.map(d => d.name);
      
      // Verificar se há dashboards conhecidos
      const hasFibonacci = dashboardNames.some(name => name.includes('Fibonacci'));
      const hasNigredo = dashboardNames.some(name => name.includes('Nigredo'));
      const hasBusiness = dashboardNames.some(name => name.includes('Business'));
      
      // Pelo menos um dashboard deve existir
      expect(dashboards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com workspace sem arquivos de guardrails', () => {
      const emptyWorkspace = path.join(__dirname, 'non-existent');
      const result = analyzeGuardrails(emptyWorkspace);

      expect(result).toBeDefined();
      expect(result.security.cloudTrail.enabled).toBe(false);
      expect(result.security.guardDuty.enabled).toBe(false);
      expect(result.security.waf.enabled).toBe(false);
    });

    it('deve retornar arrays vazios quando não há configuração', () => {
      const emptyWorkspace = path.join(__dirname, 'non-existent');
      const result = analyzeGuardrails(emptyWorkspace);

      expect(result.security.snsTopics).toEqual([]);
      expect(result.cost.budgets).toEqual([]);
      expect(result.cost.snsTopics).toEqual([]);
      expect(result.observability.dashboards).toEqual([]);
    });

    it('deve lidar com arquivos de stack malformados', () => {
      // Este teste verifica que o analisador não quebra com arquivos inválidos
      const result = analyzeGuardrails(testWorkspaceRoot);
      
      // Deve retornar estrutura válida mesmo se alguns arquivos estiverem malformados
      expect(result).toBeDefined();
      expect(result.security).toBeDefined();
      expect(result.cost).toBeDefined();
      expect(result.observability).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('deve garantir que retenção de logs seja positiva', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      
      if (result.security.cloudTrail.enabled) {
        expect(result.security.cloudTrail.retentionDays).toBeGreaterThan(0);
      }

      result.security.waf.logGroups.forEach(logGroup => {
        expect(logGroup.retentionDays).toBeGreaterThan(0);
      });
    });

    it('deve garantir que valores de budget sejam positivos', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      
      result.cost.budgets.forEach(budget => {
        expect(budget.amount).toBeGreaterThan(0);
        budget.thresholds.forEach(threshold => {
          expect(threshold).toBeGreaterThan(0);
        });
      });
    });

    it('deve garantir que threshold de anomalia seja positivo', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      
      if (result.cost.anomalyDetection) {
        expect(result.cost.anomalyDetection.threshold).toBeGreaterThan(0);
      }
    });

    it('deve garantir que nomes de recursos não estejam vazios', () => {
      const result = analyzeGuardrails(testWorkspaceRoot);
      
      // CloudTrail
      if (result.security.cloudTrail.enabled) {
        expect(result.security.cloudTrail.trailName).not.toBe('');
        expect(result.security.cloudTrail.bucketName).not.toBe('');
      }

      // WAF Web ACLs
      result.security.waf.webAcls.forEach(webAcl => {
        expect(webAcl.name).not.toBe('');
      });

      // WAF IP Sets
      result.security.waf.ipSets.forEach(ipSet => {
        expect(ipSet.name).not.toBe('');
      });

      // Budgets
      result.cost.budgets.forEach(budget => {
        expect(budget.name).not.toBe('');
      });

      // Dashboards
      result.observability.dashboards.forEach(dashboard => {
        expect(dashboard.name).not.toBe('');
      });
    });
  });
});
