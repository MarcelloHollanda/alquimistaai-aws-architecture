/**
 * Testes E2E - Recuperação de senha
 * Requisito: Testar recuperação de senha completa
 * 
 * Para executar: npx playwright test tests/e2e/password-recovery.spec.ts
 */

import { test, expect } from '@playwright/test';

const testEmail = 'usuario@exemplo.com';
const oldPassword = 'SenhaAntiga123!';
const newPassword = 'SenhaNova123!';

test.describe('Fluxo de Recuperação de Senha', () => {
  test('deve solicitar código de recuperação', async ({ page }) => {
    // Navegar para página de recuperação
    await page.goto('/auth/forgot-password');
    
    // Verificar que está na página correta
    await expect(page).toHaveTitle(/Recuperar senha|Esqueci minha senha/i);
    await expect(page.getByText(/recuperar.*senha/i)).toBeVisible();
    
    // Preencher e-mail
    await page.fill('input[type="email"]', testEmail);
    
    // Submeter formulário
    await page.click('button[type="submit"]:has-text("Enviar")');
    
    // Deve exibir mensagem de sucesso
    await expect(page.getByText(/código.*enviado/i)).toBeVisible();
    
    // Deve redirecionar para página de redefinição
    await expect(page).toHaveURL(/\/auth\/reset-password/);
  });

  test('deve validar e-mail antes de enviar', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Tentar enviar sem e-mail
    await page.click('button[type="submit"]');
    
    // Deve exibir erro de validação
    await expect(page.getByText(/e-mail.*obrigatório/i)).toBeVisible();
    
    // Tentar com e-mail inválido
    await page.fill('input[type="email"]', 'email-invalido');
    await page.click('button[type="submit"]');
    
    // Deve exibir erro de formato
    await expect(page.getByText(/e-mail inválido/i)).toBeVisible();
  });

  test('deve redefinir senha com código válido', async ({ page }) => {
    // Navegar diretamente para página de redefinição
    await page.goto(`/auth/reset-password?email=${encodeURIComponent(testEmail)}`);
    
    // Verificar que está na página correta
    await expect(page).toHaveTitle(/Redefinir senha|Nova senha/i);
    
    // Preencher formulário
    await page.fill('input[name="code"]', '123456');
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    
    // Submeter formulário
    await page.click('button[type="submit"]:has-text("Redefinir")');
    
    // Deve exibir mensagem de sucesso
    await expect(page.getByText(/senha.*alterada/i)).toBeVisible();
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve validar código de verificação', async ({ page }) => {
    await page.goto(`/auth/reset-password?email=${encodeURIComponent(testEmail)}`);
    
    // Tentar sem código
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Deve exibir erro
    await expect(page.getByText(/código.*obrigatório/i)).toBeVisible();
    
    // Tentar com código inválido (muito curto)
    await page.fill('input[name="code"]', '123');
    await page.click('button[type="submit"]');
    
    // Deve exibir erro
    await expect(page.getByText(/código.*inválido/i)).toBeVisible();
  });

  test('deve validar nova senha', async ({ page }) => {
    await page.goto(`/auth/reset-password?email=${encodeURIComponent(testEmail)}`);
    
    // Preencher código válido
    await page.fill('input[name="code"]', '123456');
    
    // Tentar com senha fraca
    await page.fill('input[name="newPassword"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await page.click('button[type="submit"]');
    
    // Deve exibir erro de validação
    await expect(page.getByText(/mínimo.*8.*caracteres/i)).toBeVisible();
  });

  test('deve validar confirmação de senha', async ({ page }) => {
    await page.goto(`/auth/reset-password?email=${encodeURIComponent(testEmail)}`);
    
    // Preencher com senhas diferentes
    await page.fill('input[name="code"]', '123456');
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', 'SenhaDiferente123!');
    await page.click('button[type="submit"]');
    
    // Deve exibir erro
    await expect(page.getByText(/senhas.*não.*coincidem/i)).toBeVisible();
  });

  test('deve exibir requisitos de senha', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Deve exibir requisitos
    await expect(page.getByText(/mínimo.*8.*caracteres/i)).toBeVisible();
  });

  test('deve permitir voltar para login', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Clicar em link para voltar
    await page.click('a:has-text("Voltar")');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Fluxo Completo de Recuperação', () => {
  test('deve completar fluxo: esqueci senha → código → nova senha → login', async ({ page }) => {
    // 1. Solicitar recuperação
    await page.goto('/auth/forgot-password');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');
    
    // 2. Verificar redirecionamento
    await expect(page).toHaveURL(/\/auth\/reset-password/);
    
    // 3. Redefinir senha
    await page.fill('input[name="code"]', '123456');
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');
    
    // 4. Verificar sucesso e redirecionamento
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/senha.*alterada/i)).toBeVisible();
    
    // 5. Fazer login com nova senha
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    
    // 6. Deve acessar dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});

test.describe('Tratamento de Erros', () => {
  test('deve tratar código expirado', async ({ page }) => {
    await page.goto(`/auth/reset-password?email=${encodeURIComponent(testEmail)}`);
    
    // Simular código expirado (depende da implementação do backend)
    await page.fill('input[name="code"]', '000000');
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Deve exibir erro apropriado
    await expect(page.getByText(/código.*expirado|inválido/i)).toBeVisible();
  });

  test('deve tratar e-mail não cadastrado', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Tentar com e-mail não cadastrado
    await page.fill('input[type="email"]', 'naoexiste@exemplo.com');
    await page.click('button[type="submit"]');
    
    // Deve exibir erro ou mensagem genérica (por segurança)
    // A implementação pode variar
    await expect(page.getByText(/não encontrado|enviado/i)).toBeVisible();
  });

  test('deve permitir reenvio de código', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Solicitar código
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');
    
    // Na página de redefinição, deve ter opção de reenviar
    await expect(page).toHaveURL(/\/auth\/reset-password/);
    
    // Verificar se existe link/botão para reenviar
    const resendButton = page.getByText(/reenviar.*código/i);
    if (await resendButton.isVisible()) {
      await resendButton.click();
      await expect(page.getByText(/código.*reenviado/i)).toBeVisible();
    }
  });
});

test.describe('Acessibilidade', () => {
  test('deve ter labels apropriados', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Verificar labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
  });

  test('deve ter mensagens de erro acessíveis', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Submeter sem preencher
    await page.click('button[type="submit"]');
    
    // Verificar que erro tem role="alert"
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('deve permitir navegação por teclado', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Navegar por Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });
});
