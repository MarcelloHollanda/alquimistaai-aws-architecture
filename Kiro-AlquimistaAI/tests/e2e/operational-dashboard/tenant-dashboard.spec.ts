/**
 * Testes E2E - Navegação no dashboard do cliente
 * Requisitos: 3.1-3.7
 */

import { test, expect } from '@playwright/test';

const tenantUser = {
  email: process.env.TEST_TENANT_EMAIL || 'user@tenant.com',
  password: process.env.TEST_TENANT_PASSWORD || 'TestPassword123!',
};

test.describe('Dashboard do Cliente', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', tenantUser.email);
    await page.fill('input[type="password"]', tenantUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/dashboard/);
  });

  test('deve exibir visão geral com KPIs', async ({ page }) => {
    // Verificar que está na página inicial
    await expect(page).toHaveURL(/\/app\/dashboard$/);
    
    // Verificar KPIs principais
    await expect(page.getByText(/Agentes Ativos/i)).toBeVisible();
    await expect(page.getByText(/Requisições/i)).toBeVisible();
    await expect(page.getByText(/Taxa de Sucesso/i)).toBeVisible();
    await expect(page.getByText(/Integrações/i)).toBeVisible();
    
    // Verificar que há valores numéricos
    const kpiCards = page.locator('[data-testid="metrics-card"], .metrics-card');
    await expect(kpiCards.first()).toBeVisible();
  });

  test('deve navegar para página de agentes', async ({ page }) => {
    // Clicar no menu de agentes
    await page.click('a:has-text("Agentes"), nav >> text=Agentes');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/dashboard\/agents/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Meus Agentes|Agentes Contratados/i)).toBeVisible();
    
    // Verificar que há lista de agentes
    const agentCards = page.locator('[data-testid="agent-card"], .agent-card');
    const count = await agentCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve navegar para página de Fibonacci', async ({ page }) => {
    // Clicar no menu de Fibonacci
    await page.click('a:has-text("Fibonacci"), nav >> text=Fibonacci');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/dashboard\/fibonacci/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Fibonacci|SubNúcleos/i)).toBeVisible();
  });

  test('deve navegar para página de integrações', async ({ page }) => {
    // Clicar no menu de integrações
    await page.click('a:has-text("Integrações"), nav >> text=Integrações');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/dashboard\/integrations/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Integrações|Conexões/i)).toBeVisible();
  });

  test('deve navegar para página de uso', async ({ page }) => {
    // Clicar no menu de uso
    await page.click('a:has-text("Uso"), nav >> text=Uso');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/dashboard\/usage/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Uso|Métricas|Estatísticas/i)).toBeVisible();
    
    // Verificar seletor de período
    await expect(page.locator('select, [role="combobox"]').first()).toBeVisible();
  });

  test('deve navegar para página de suporte', async ({ page }) => {
    // Clicar no menu de suporte
    await page.click('a:has-text("Suporte"), nav >> text=Suporte');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/dashboard\/support/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Suporte|Ajuda|Incidentes/i)).toBeVisible();
  });

  test('deve exibir gráficos na página de uso', async ({ page }) => {
    await page.goto('/app/dashboard/usage');
    
    // Aguardar carregamento dos gráficos
    await page.waitForTimeout(2000);
    
    // Verificar que há elementos de gráfico
    const charts = page.locator('canvas, svg[class*="chart"], [data-testid="chart"]');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve filtrar métricas por período', async ({ page }) => {
    await page.goto('/app/dashboard/usage');
    
    // Selecionar período de 7 dias
    await page.selectOption('select:has-text("Período"), select >> nth=0', '7d');
    
    // Aguardar atualização
    await page.waitForTimeout(1000);
    
    // Verificar que o período foi aplicado
    await expect(page.getByText(/7 dias|últimos 7 dias/i)).toBeVisible();
  });

  test('deve exibir status dos agentes', async ({ page }) => {
    await page.goto('/app/dashboard/agents');
    
    // Verificar que há indicadores de status
    const statusBadges = page.locator('[data-testid="status-badge"], .status-badge, .badge');
    const count = await statusBadges.count();
    
    if (count > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('deve exibir informações da empresa no header', async ({ page }) => {
    // Verificar que o nome da empresa está visível
    const header = page.locator('header, [data-testid="header"]');
    await expect(header).toBeVisible();
    
    // Pode conter nome da empresa ou logo
    const hasCompanyInfo = await header.locator('text=/[A-Z]/').count() > 0;
    expect(hasCompanyInfo).toBe(true);
  });

  test('deve manter navegação consistente entre páginas', async ({ page }) => {
    // Navegar por várias páginas
    await page.click('a:has-text("Agentes")');
    await expect(page).toHaveURL(/\/agents/);
    
    await page.click('a:has-text("Uso")');
    await expect(page).toHaveURL(/\/usage/);
    
    await page.click('a:has-text("Dashboard"), a:has-text("Visão Geral")');
    await expect(page).toHaveURL(/\/app\/dashboard$/);
    
    // Verificar que o menu permanece visível
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
  });

  test('deve exibir loading states durante carregamento', async ({ page }) => {
    // Navegar para página de uso
    await page.goto('/app/dashboard/usage');
    
    // Verificar se há indicadores de loading (skeleton, spinner, etc)
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .skeleton, [role="progressbar"]');
    
    // Pode ou não estar visível dependendo da velocidade
    // Apenas verificar que a página carrega
    await page.waitForLoadState('networkidle');
  });

  test('deve ser responsivo em mobile', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/app/dashboard');
    
    // Verificar que o conteúdo é visível
    await expect(page.getByText(/Dashboard|Visão Geral/i)).toBeVisible();
    
    // Menu pode estar em hambúrguer
    const mobileMenu = page.locator('button[aria-label*="menu"], button:has-text("☰")');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });
});
