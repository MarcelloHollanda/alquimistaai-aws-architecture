/**
 * Testes E2E - Rotas Principais do Frontend
 * 
 * Objetivo: Prevenir regressões de 404 e validar comportamento de rotas
 * 
 * Cenários cobertos:
 * - Rota raiz (/) não retorna 404
 * - Rotas públicas acessíveis sem autenticação
 * - Rotas protegidas redirecionam para login
 * - Middleware de autenticação funciona corretamente
 * 
 * Para executar:
 * - Todos os testes: npx playwright test tests/e2e/frontend-routes.spec.ts
 * - Modo headed: npx playwright test tests/e2e/frontend-routes.spec.ts --headed
 * - Modo debug: npx playwright test tests/e2e/frontend-routes.spec.ts --debug
 */

import { test, expect } from '@playwright/test';

test.describe('Rotas Públicas - Sem Autenticação', () => {
  test('rota raiz (/) não deve retornar 404', async ({ page }) => {
    // Acessar rota raiz
    const response = await page.goto('/');
    
    // Verificar que não é 404
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).toBeLessThan(400);
    
    // Deve exibir algum conteúdo (loading ou redirecionamento)
    await expect(page.locator('body')).toBeVisible();
    
    // Aguardar redirecionamento (se houver)
    await page.waitForTimeout(1000);
    
    // Deve ter redirecionado para /login (usuário não autenticado)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('rota /login deve carregar sem erro', async ({ page }) => {
    const response = await page.goto('/login');
    
    // Verificar status HTTP
    expect(response?.status()).toBe(200);
    
    // Verificar elementos da página de login
    await expect(page.getByText(/Painel Operacional|Login|Entrar/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar|Login/i })).toBeVisible();
  });

  test('rota /institucional deve carregar sem erro', async ({ page }) => {
    const response = await page.goto('/institucional');
    
    // Verificar status HTTP
    expect(response?.status()).toBe(200);
    
    // Verificar elementos da página institucional
    await expect(page.getByText(/Alquimista|Transformação|IA/i)).toBeVisible();
  });

  test('rota /billing deve carregar sem erro', async ({ page }) => {
    const response = await page.goto('/billing');
    
    // Verificar status HTTP
    expect(response?.status()).toBe(200);
    
    // Verificar elementos da página de planos
    await expect(page.getByText(/Planos|Agentes|Escolha/i)).toBeVisible();
  });

  test('rota /fibonacci deve carregar sem erro', async ({ page }) => {
    const response = await page.goto('/fibonacci');
    
    // Verificar status HTTP (pode ser 200 ou redirect)
    expect(response?.status()).toBeLessThan(400);
    
    // Se a página existe, deve ter algum conteúdo
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('rota /nigredo deve carregar sem erro', async ({ page }) => {
    const response = await page.goto('/nigredo');
    
    // Verificar status HTTP (pode ser 200 ou redirect)
    expect(response?.status()).toBeLessThan(400);
    
    // Se a página existe, deve ter algum conteúdo
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

test.describe('Rotas Protegidas - Sem Autenticação', () => {
  test('/dashboard deve redirecionar para /login', async ({ page }) => {
    // Tentar acessar dashboard sem autenticação
    await page.goto('/dashboard');
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Verificar que foi redirecionado
    expect(page.url()).toContain('/login');
  });

  test('/company deve redirecionar para /login', async ({ page }) => {
    // Tentar acessar company sem autenticação
    await page.goto('/company');
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Verificar que foi redirecionado
    expect(page.url()).toContain('/login');
  });

  test('/app/dashboard deve redirecionar para /login', async ({ page }) => {
    // Tentar acessar rota protegida
    await page.goto('/app/dashboard');
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Verificar que foi redirecionado
    expect(page.url()).toContain('/login');
  });

  test('/app/company deve redirecionar para /login', async ({ page }) => {
    // Tentar acessar rota protegida
    await page.goto('/app/company');
    
    // Aguardar redirecionamento
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Verificar que foi redirecionado
    expect(page.url()).toContain('/login');
  });
});

test.describe('Middleware de Segurança', () => {
  test('deve adicionar headers de segurança', async ({ page }) => {
    const response = await page.goto('/');
    
    // Verificar headers de segurança
    const headers = response?.headers();
    
    // Content-Security-Policy
    expect(headers?.['content-security-policy']).toBeTruthy();
    
    // X-Frame-Options
    expect(headers?.['x-frame-options']).toBe('DENY');
    
    // X-Content-Type-Options
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('rotas públicas devem ser acessíveis sem cookies', async ({ context, page }) => {
    // Limpar todos os cookies
    await context.clearCookies();
    
    // Acessar rota pública
    const response = await page.goto('/login');
    
    // Deve carregar normalmente
    expect(response?.status()).toBe(200);
    await expect(page.getByText(/Login|Entrar/i)).toBeVisible();
  });

  test('rotas protegidas devem bloquear sem cookies', async ({ context, page }) => {
    // Limpar todos os cookies
    await context.clearCookies();
    
    // Tentar acessar rota protegida
    await page.goto('/app/dashboard');
    
    // Deve redirecionar para login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});

test.describe('Navegação e Links', () => {
  test('links de navegação devem funcionar corretamente', async ({ page }) => {
    // Acessar página institucional
    await page.goto('/institucional');
    
    // Clicar em link para billing (se existir)
    const billingLink = page.getByRole('link', { name: /Planos|Preços|Começar/i }).first();
    if (await billingLink.isVisible()) {
      await billingLink.click();
      
      // Aguardar navegação
      await page.waitForURL(/\/billing/, { timeout: 5000 });
      expect(page.url()).toContain('/billing');
    }
  });

  test('botão de login deve redirecionar corretamente', async ({ page }) => {
    await page.goto('/institucional');
    
    // Procurar botão de login
    const loginButton = page.getByRole('link', { name: /Login|Entrar|Acessar/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Aguardar navegação
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    }
  });
});

test.describe('Responsividade e Performance', () => {
  test('página raiz deve carregar em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Deve carregar em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });

  test('página de login deve ser responsiva', async ({ page }) => {
    // Testar em viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Verificar que elementos estão visíveis
    await expect(page.getByRole('button', { name: /Entrar|Login/i })).toBeVisible();
    
    // Testar em viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    
    // Verificar que elementos estão visíveis
    await expect(page.getByRole('button', { name: /Entrar|Login/i })).toBeVisible();
  });
});

test.describe('Tratamento de Erros', () => {
  test('rota inexistente deve retornar 404', async ({ page }) => {
    const response = await page.goto('/rota-que-nao-existe-12345');
    
    // Deve retornar 404
    expect(response?.status()).toBe(404);
  });

  test('deve exibir página de erro amigável para 404', async ({ page }) => {
    await page.goto('/rota-que-nao-existe-12345');
    
    // Deve exibir mensagem de erro ou página 404
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/404|não encontrada|not found/i);
  });
});
