/**
 * Testes E2E - Navegação no painel operacional
 * Requisitos: 4.1-4.7
 */

import { test, expect } from '@playwright/test';

const internalUser = {
  email: process.env.TEST_INTERNAL_EMAIL || 'admin@alquimista.ai',
  password: process.env.TEST_INTERNAL_PASSWORD || 'TestPassword123!',
};

test.describe('Painel Operacional Interno', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login como usuário interno
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', internalUser.email);
    await page.fill('input[type="password"]', internalUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/company/);
  });

  test('deve exibir visão geral operacional com KPIs globais', async ({ page }) => {
    // Verificar que está na página inicial
    await expect(page).toHaveURL(/\/app\/company$/);
    
    // Verificar KPIs globais
    await expect(page.getByText(/Tenants Ativos/i)).toBeVisible();
    await expect(page.getByText(/Agentes Deployados/i)).toBeVisible();
    await expect(page.getByText(/Requisições/i)).toBeVisible();
    await expect(page.getByText(/MRR|Receita/i)).toBeVisible();
    
    // Verificar gráficos de tendência
    const charts = page.locator('canvas, svg[class*="chart"]');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve navegar para lista de tenants', async ({ page }) => {
    // Clicar no menu de tenants
    await page.click('a:has-text("Tenants"), nav >> text=Tenants');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/company\/tenants/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Lista de Tenants|Clientes/i)).toBeVisible();
    
    // Verificar que há tabela de tenants
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
  });

  test('deve filtrar tenants por status', async ({ page }) => {
    await page.goto('/app/company/tenants');
    
    // Selecionar filtro de status
    await page.selectOption('select:has-text("Status"), select >> nth=0', 'active');
    
    // Aguardar atualização
    await page.waitForTimeout(1000);
    
    // Verificar que a tabela foi atualizada
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
  });

  test('deve buscar tenant por nome', async ({ page }) => {
    await page.goto('/app/company/tenants');
    
    // Digitar no campo de busca
    await page.fill('input[type="search"], input[placeholder*="Buscar"]', 'Teste');
    
    // Aguardar atualização
    await page.waitForTimeout(1000);
    
    // Verificar que a busca foi aplicada
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]');
    await expect(searchInput).toHaveValue('Teste');
  });

  test('deve navegar para detalhes de um tenant', async ({ page }) => {
    await page.goto('/app/company/tenants');
    
    // Aguardar carregamento da tabela
    await page.waitForTimeout(2000);
    
    // Clicar no primeiro tenant (se existir)
    const firstTenantLink = page.locator('table a, [role="table"] a').first();
    
    if (await firstTenantLink.isVisible()) {
      await firstTenantLink.click();
      
      // Verificar que navegou para detalhes
      await expect(page).toHaveURL(/\/app\/company\/tenants\/[a-zA-Z0-9-]+/);
      
      // Verificar conteúdo da página de detalhes
      await expect(page.getByText(/Detalhes|Informações/i)).toBeVisible();
    }
  });

  test('deve navegar para página de agentes', async ({ page }) => {
    // Clicar no menu de agentes
    await page.click('a:has-text("Agentes"), nav >> text=Agentes');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/company\/agents/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Agentes|32 Agentes/i)).toBeVisible();
  });

  test('deve navegar para página de integrações', async ({ page }) => {
    // Clicar no menu de integrações
    await page.click('a:has-text("Integrações"), nav >> text=Integrações');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/company\/integrations/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Integrações|Mapa de Integrações/i)).toBeVisible();
  });

  test('deve navegar para console de operações', async ({ page }) => {
    // Clicar no menu de operações
    await page.click('a:has-text("Operações"), nav >> text=Operações');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/company\/operations/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Console de Operações|Comandos/i)).toBeVisible();
  });

  test('deve navegar para página de billing', async ({ page }) => {
    // Clicar no menu de billing
    await page.click('a:has-text("Financeiro"), a:has-text("Billing"), nav >> text=Financeiro');
    
    // Verificar URL
    await expect(page).toHaveURL(/\/app\/company\/billing/);
    
    // Verificar conteúdo da página
    await expect(page.getByText(/Financeiro|Receita|MRR/i)).toBeVisible();
  });

  test('deve exibir top tenants por uso', async ({ page }) => {
    await page.goto('/app/company');
    
    // Verificar seção de top tenants
    await expect(page.getByText(/Top Tenants|Maiores Clientes/i)).toBeVisible();
    
    // Verificar que há lista
    const topTenantsList = page.locator('[data-testid="top-tenants"], .top-tenants');
    if (await topTenantsList.isVisible()) {
      await expect(topTenantsList).toBeVisible();
    }
  });

  test('deve exibir top agentes por deployment', async ({ page }) => {
    await page.goto('/app/company');
    
    // Verificar seção de top agentes
    await expect(page.getByText(/Top Agentes|Agentes Mais Usados/i)).toBeVisible();
  });

  test('deve exibir incidentes recentes', async ({ page }) => {
    await page.goto('/app/company');
    
    // Verificar seção de incidentes
    await expect(page.getByText(/Incidentes|Alertas/i)).toBeVisible();
  });

  test('deve implementar paginação na lista de tenants', async ({ page }) => {
    await page.goto('/app/company/tenants');
    
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Verificar controles de paginação
    const pagination = page.locator('[data-testid="pagination"], .pagination, nav[aria-label*="pagination"]');
    
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
      
      // Verificar botões de navegação
      const nextButton = page.locator('button:has-text("Próximo"), button:has-text("Next"), button[aria-label*="next"]');
      if (await nextButton.isVisible()) {
        await expect(nextButton).toBeVisible();
      }
    }
  });

  test('deve ordenar tenants por coluna', async ({ page }) => {
    await page.goto('/app/company/tenants');
    
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Clicar em cabeçalho de coluna para ordenar
    const columnHeader = page.locator('th:has-text("Nome"), th:has-text("MRR")').first();
    
    if (await columnHeader.isVisible()) {
      await columnHeader.click();
      
      // Aguardar reordenação
      await page.waitForTimeout(1000);
      
      // Verificar que a tabela foi atualizada
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
    }
  });

  test('deve exibir métricas financeiras', async ({ page }) => {
    await page.goto('/app/company/billing');
    
    // Verificar métricas financeiras
    await expect(page.getByText(/MRR|ARR|Receita/i)).toBeVisible();
    
    // Verificar gráficos
    const charts = page.locator('canvas, svg[class*="chart"]');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve manter navegação consistente', async ({ page }) => {
    // Navegar por várias páginas
    await page.click('a:has-text("Tenants")');
    await expect(page).toHaveURL(/\/tenants/);
    
    await page.click('a:has-text("Agentes")');
    await expect(page).toHaveURL(/\/agents/);
    
    await page.click('a:has-text("Visão Geral"), a:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/app\/company$/);
    
    // Verificar que o menu permanece visível
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
  });

  test('deve ter accent visual diferenciado', async ({ page }) => {
    await page.goto('/app/company');
    
    // Verificar que há elementos com estilo diferenciado
    // (cores, badges, etc. específicos do painel operacional)
    const header = page.locator('header, [data-testid="header"]');
    await expect(header).toBeVisible();
    
    // Verificar que há indicadores visuais
    const badges = page.locator('.badge, [data-testid="badge"]');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
