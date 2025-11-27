/**
 * Testes E2E - Fluxo completo de autenticação
 * Requisito: Testar cadastro → login → dashboard
 * 
 * Para executar: npx playwright test tests/e2e/auth-complete-flow.spec.ts
 */

import { test, expect } from '@playwright/test';

// Dados de teste
const testUser = {
  name: 'Usuário Teste E2E',
  email: `teste-${Date.now()}@exemplo.com`,
  password: 'Senha123!@#',
  phone: '(84) 99708-4444',
};

const testCompany = {
  name: 'Empresa Teste E2E',
  legalName: 'Empresa Teste E2E LTDA',
  cnpj: '11.222.333/0001-81',
  segment: 'Tecnologia',
};

test.describe('Fluxo Completo: Cadastro → Login → Dashboard', () => {
  test('deve completar cadastro de novo usuário', async ({ page }) => {
    // Navegar para página de cadastro
    await page.goto('/auth/register');
    
    // Verificar que está na página correta
    await expect(page).toHaveTitle(/Cadastro|Criar conta/i);
    
    // Passo 1: Dados Pessoais
    await expect(page.getByText(/Passo 1 de 3/i)).toBeVisible();
    
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    
    await page.click('button:has-text("Próximo")');
    
    // Passo 2: Dados da Empresa
    await expect(page.getByText(/Passo 2 de 3/i)).toBeVisible();
    
    await page.fill('input[name="companyName"]', testCompany.name);
    await page.fill('input[name="companyLegalName"]', testCompany.legalName);
    await page.fill('input[name="cnpj"]', testCompany.cnpj);
    await page.selectOption('select[name="segment"]', testCompany.segment);
    
    await page.click('button:has-text("Próximo")');
    
    // Passo 3: Confirmação
    await expect(page.getByText(/Passo 3 de 3/i)).toBeVisible();
    await expect(page.getByText(testUser.name)).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
    await expect(page.getByText(testCompany.name)).toBeVisible();
    
    await page.click('button:has-text("Criar conta")');
    
    // Deve redirecionar para página de confirmação
    await expect(page).toHaveURL(/\/auth\/confirm/);
    await expect(page.getByText(/confirme seu e-mail/i)).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Navegar para página de login
    await page.goto('/auth/login');
    
    // Verificar que está na página correta
    await expect(page).toHaveTitle(/Login|Entrar/i);
    
    // Preencher formulário
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submeter formulário
    await page.click('button[type="submit"]:has-text("Entrar")');
    
    // Deve redirecionar para dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
    
    // Verificar elementos do dashboard
    await expect(page.getByText(/Dashboard|Painel/i)).toBeVisible();
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tentar login com senha incorreta
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'SenhaErrada123!');
    
    await page.click('button[type="submit"]:has-text("Entrar")');
    
    // Deve exibir mensagem de erro
    await expect(page.getByText(/incorreto|inválido/i)).toBeVisible();
    
    // Não deve redirecionar
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve validar campos obrigatórios no cadastro', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Tentar avançar sem preencher campos
    await page.click('button:has-text("Próximo")');
    
    // Deve exibir mensagens de validação
    await expect(page.getByText(/obrigatório/i)).toBeVisible();
    
    // Não deve avançar para próximo passo
    await expect(page.getByText(/Passo 1 de 3/i)).toBeVisible();
  });

  test('deve validar formato de e-mail', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Preencher com e-mail inválido
    await page.fill('input[type="email"]', 'email-invalido');
    await page.fill('input[type="password"]', testUser.password);
    
    await page.click('button[type="submit"]');
    
    // Deve exibir erro de validação
    await expect(page.getByText(/e-mail inválido/i)).toBeVisible();
  });

  test('deve validar força da senha', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Preencher com senha fraca
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    
    await page.click('button:has-text("Próximo")');
    
    // Deve exibir erro de validação
    await expect(page.getByText(/mínimo.*8.*caracteres/i)).toBeVisible();
  });

  test('deve navegar entre páginas de autenticação', async ({ page }) => {
    // Começar no login
    await page.goto('/auth/login');
    
    // Clicar em "Criar nova conta"
    await page.click('a:has-text("Criar nova conta")');
    await expect(page).toHaveURL(/\/auth\/register/);
    
    // Voltar para login
    await page.goto('/auth/login');
    
    // Clicar em "Esqueci minha senha"
    await page.click('a:has-text("Esqueci minha senha")');
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});

test.describe('Dashboard após Login', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('deve exibir informações do usuário', async ({ page }) => {
    // Verificar nome do usuário
    await expect(page.getByText(testUser.name)).toBeVisible();
    
    // Verificar nome da empresa
    await expect(page.getByText(testCompany.name)).toBeVisible();
  });

  test('deve permitir navegação no menu', async ({ page }) => {
    // Navegar para configurações
    await page.click('a:has-text("Configurações")');
    await expect(page).toHaveURL(/\/app\/settings/);
    
    // Voltar para dashboard
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('deve permitir logout', async ({ page }) => {
    // Clicar em logout
    await page.click('button:has-text("Sair")');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Tentar acessar dashboard sem autenticação
    await page.goto('/app/dashboard');
    
    // Deve redirecionar de volta para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Proteção de Rotas', () => {
  test('deve redirecionar para login ao acessar rota protegida', async ({ page }) => {
    // Tentar acessar dashboard sem autenticação
    await page.goto('/app/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve permitir acesso a rotas públicas', async ({ page }) => {
    // Rotas públicas devem ser acessíveis
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/\/auth\/register/);
    
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});
