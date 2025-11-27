/**
 * Testes E2E - Fluxo de login e redirecionamento
 * Requisitos: 1.1, 1.2, 1.3
 * 
 * Para executar: npx playwright test tests/e2e/operational-dashboard/login-redirect.spec.ts
 */

import { test, expect } from '@playwright/test';

// Dados de teste
const internalUser = {
  email: process.env.TEST_INTERNAL_EMAIL || 'admin@alquimista.ai',
  password: process.env.TEST_INTERNAL_PASSWORD || 'TestPassword123!',
};

const tenantUser = {
  email: process.env.TEST_TENANT_EMAIL || 'user@tenant.com',
  password: process.env.TEST_TENANT_PASSWORD || 'TestPassword123!',
};

test.describe('Fluxo de Login e Redirecionamento', () => {
  test('deve redirecionar usuário interno para /app/company', async ({ page }) => {
    // Navegar para página de login
    await page.goto('/auth/login');
    
    // Fazer login como usuário interno
    await page.fill('input[type="email"]', internalUser.email);
    await page.fill('input[type="password"]', internalUser.password);
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/app\/company/, { timeout: 10000 });
    
    // Verificar que está na página correta
    await expect(page).toHaveURL(/\/app\/company/);
    await expect(page.getByText(/Painel Operacional|Visão Geral/i)).toBeVisible();
  });

  test('deve redirecionar usuário cliente para /app/dashboard', async ({ page }) => {
    // Navegar para página de login
    await page.goto('/auth/login');
    
    // Fazer login como usuário cliente
    await page.fill('input[type="email"]', tenantUser.email);
    await page.fill('input[type="password"]', tenantUser.password);
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
    
    // Verificar que está na página correta
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByText(/Dashboard|Visão Geral/i)).toBeVisible();
  });

  test('deve bloquear acesso de usuário cliente ao painel operacional', async ({ page }) => {
    // Fazer login como usuário cliente
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', tenantUser.email);
    await page.fill('input[type="password"]', tenantUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/app\/dashboard/);
    
    // Tentar acessar painel operacional
    await page.goto('/app/company');
    
    // Deve ser bloqueado ou redirecionado
    await page.waitForTimeout(2000);
    
    // Verificar que não está no painel operacional
    const url = page.url();
    expect(url).not.toContain('/app/company');
    
    // Pode estar em /app/dashboard ou página de erro 403
    expect(url).toMatch(/\/app\/dashboard|403|forbidden/i);
  });

  test('deve permitir usuário interno acessar dashboard de cliente', async ({ page }) => {
    // Fazer login como usuário interno
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', internalUser.email);
    await page.fill('input[type="password"]', internalUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/app\/company/);
    
    // Navegar para dashboard de cliente
    await page.goto('/app/dashboard');
    
    // Deve ter acesso
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page }) => {
    // Tentar acessar painel operacional sem login
    await page.goto('/app/company');
    
    // Deve redirecionar para login
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve manter redirecionamento após login bem-sucedido', async ({ page }) => {
    // Tentar acessar rota específica sem login
    await page.goto('/app/company/tenants');
    
    // Deve redirecionar para login
    await page.waitForURL(/\/auth\/login/);
    
    // Fazer login
    await page.fill('input[type="email"]', internalUser.email);
    await page.fill('input[type="password"]', internalUser.password);
    await page.click('button[type="submit"]');
    
    // Deve redirecionar para a rota original
    await page.waitForURL(/\/app\/company/, { timeout: 10000 });
  });

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tentar login com credenciais inválidas
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Deve exibir mensagem de erro
    await expect(page.getByText(/incorreto|inválido|erro/i)).toBeVisible({ timeout: 5000 });
    
    // Não deve redirecionar
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve fazer logout e redirecionar para login', async ({ page }) => {
    // Fazer login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', tenantUser.email);
    await page.fill('input[type="password"]', tenantUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/app\/dashboard/);
    
    // Fazer logout
    await page.click('button:has-text("Sair"), a:has-text("Sair")');
    
    // Deve redirecionar para login
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Tentar acessar dashboard novamente
    await page.goto('/app/dashboard');
    
    // Deve redirecionar para login
    await page.waitForURL(/\/auth\/login/);
  });
});

test.describe('Validação de Grupos e Permissões', () => {
  test('deve exibir menu apropriado para usuário interno', async ({ page }) => {
    // Login como interno
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', internalUser.email);
    await page.fill('input[type="password"]', internalUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/app\/company/);
    
    // Verificar itens de menu do painel operacional
    await expect(page.getByText(/Tenants|Clientes/i)).toBeVisible();
    await expect(page.getByText(/Operações|Console/i)).toBeVisible();
    await expect(page.getByText(/Financeiro|Billing/i)).toBeVisible();
  });

  test('deve exibir menu apropriado para usuário cliente', async ({ page }) => {
    // Login como cliente
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', tenantUser.email);
    await page.fill('input[type="password"]', tenantUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/app\/dashboard/);
    
    // Verificar itens de menu do dashboard cliente
    await expect(page.getByText(/Agentes/i)).toBeVisible();
    await expect(page.getByText(/Integrações/i)).toBeVisible();
    await expect(page.getByText(/Uso|Métricas/i)).toBeVisible();
    
    // Não deve exibir itens do painel operacional
    await expect(page.getByText(/Tenants|Clientes/i)).not.toBeVisible();
  });

  test('deve exibir informações do usuário no header', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', tenantUser.email);
    await page.fill('input[type="password"]', tenantUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/app\/dashboard/);
    
    // Verificar que o e-mail ou nome do usuário está visível
    await expect(page.getByText(tenantUser.email)).toBeVisible();
  });
});
