import { test, expect } from '@playwright/test';

/**
 * Testes E2E para o Módulo de Disparo & Agendamento
 * 
 * Cenários cobertos:
 * 1. Acesso à página (usuário autenticado)
 * 2. Navegação via sidebar
 * 3. Visualização de overview cards
 * 4. Navegação entre tabs
 * 5. Formulário de importação de contatos
 */

test.describe('Módulo Disparo & Agendamento', () => {
  test.beforeEach(async ({ page }) => {
    // Com E2E_BYPASS_AUTH=true, não precisamos de cookies mock
    // O middleware permite acesso direto às rotas protegidas
    
    // Navegar para a página
    // Aguardar networkidle para garantir que a página carregou completamente
    await page.goto('/dashboard/disparo-agenda', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Verificar que não fomos redirecionados para login
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('deve carregar a página sem erros 404', async ({ page }) => {
    // A página já foi carregada no beforeEach
    // Verificar que o título está presente
    await expect(page.locator('h1')).toContainText('Disparo & Agendamento');
  });

  test('deve exibir cards de overview', async ({ page }) => {
    // Verificar que os 4 cards de overview estão presentes
    const cards = page.locator('[role="region"]').filter({ hasText: /Contatos na Fila|Mensagens Enviadas|Reuniões Agendadas|Reuniões Confirmadas/ });
    
    // Aguardar pelo menos um card carregar
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('deve navegar entre as tabs', async ({ page }) => {
    // Verificar que as tabs estão presentes
    await expect(page.getByRole('tab', { name: 'Campanhas' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Reuniões' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Importar Contatos' })).toBeVisible();

    // Clicar na tab de Reuniões
    await page.getByRole('tab', { name: 'Reuniões' }).click();
    
    // Verificar que o conteúdo mudou (aguardar mensagem de lista vazia ou tabela)
    await expect(
      page.locator('text=/Nenhuma reunião agendada|Reuniões Agendadas/')
    ).toBeVisible({ timeout: 5000 });

    // Clicar na tab de Importar Contatos
    await page.getByRole('tab', { name: 'Importar Contatos' }).click();
    
    // Verificar que o formulário está presente
    await expect(page.locator('text=Importar Contatos')).toBeVisible();
  });

  test('deve exibir formulário de importação de contatos', async ({ page }) => {
    // Navegar para a tab de importação
    await page.getByRole('tab', { name: 'Importar Contatos' }).click();

    // Verificar campos do formulário
    await expect(page.locator('label:has-text("Empresa")')).toBeVisible();
    await expect(page.locator('label:has-text("Nome do Contato")')).toBeVisible();
    await expect(page.locator('label:has-text("Telefone")')).toBeVisible();
    await expect(page.locator('label:has-text("E-mail")')).toBeVisible();

    // Verificar botões
    await expect(page.getByRole('button', { name: /Adicionar Outro Contato/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar para o Agente/ })).toBeVisible();
  });

  test('deve permitir adicionar múltiplos contatos', async ({ page }) => {
    // Navegar para a tab de importação
    await page.getByRole('tab', { name: 'Importar Contatos' }).click();

    // Contar formulários iniciais (deve ter 1)
    const initialForms = await page.locator('input[id^="company-"]').count();
    expect(initialForms).toBe(1);

    // Clicar em "Adicionar Outro Contato"
    await page.getByRole('button', { name: /Adicionar Outro Contato/ }).click();

    // Verificar que agora tem 2 formulários
    const updatedForms = await page.locator('input[id^="company-"]').count();
    expect(updatedForms).toBe(2);
  });

  test('deve validar campos obrigatórios ao enviar', async ({ page }) => {
    // Navegar para a tab de importação
    await page.getByRole('tab', { name: 'Importar Contatos' }).click();

    // Tentar enviar sem preencher nada
    await page.getByRole('button', { name: /Enviar para o Agente/ }).click();

    // Verificar que aparece mensagem de erro "Campo obrigatório"
    await expect(page.locator('text=Campo obrigatório')).toBeVisible({ timeout: 3000 });
  });

  test('deve adicionar múltiplos contatos e validar campo empresa obrigatório', async ({ page }) => {
    // Navegar para a tab de importação
    await page.getByRole('tab', { name: 'Importar Contatos' }).click();

    // 1. Contar quantos inputs company- existem inicialmente
    const initialCount = await page.locator('input[id^="company-"]').count();
    expect(initialCount).toBe(1);

    // 2. Clicar em "Adicionar outro contato"
    await page.getByRole('button', { name: /Adicionar outro contato/i }).click();

    // 3. Contar novamente e verificar que aumentou
    const afterAddCount = await page.locator('input[id^="company-"]').count();
    expect(afterAddCount).toBe(2);

    // 4. Tentar enviar sem preencher o campo "Empresa"
    await page.getByRole('button', { name: /Enviar para o Agente/i }).click();

    // 5. Verificar que aparece mensagem "Campo obrigatório"
    await expect(page.locator('text=Campo obrigatório')).toBeVisible({ timeout: 3000 });
  });

  test('deve exibir mensagem quando não há campanhas', async ({ page }) => {
    // Tab de campanhas é a padrão, então já deve estar visível
    
    // Verificar mensagem de lista vazia (se não houver dados)
    const emptyMessage = page.locator('text=/Nenhuma campanha encontrada|Campanhas Recentes/');
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });

  test('deve ser acessível via sidebar', async ({ page }) => {
    // A página já foi carregada no beforeEach
    // Verificar que o link está na sidebar
    const sidebarLink = page.locator('nav a:has-text("Disparo & Agendamento")');
    await expect(sidebarLink).toBeVisible();

    // Verificar que estamos na página correta
    await expect(page).toHaveURL('/dashboard/disparo-agenda');
    await expect(page.locator('h1')).toContainText('Disparo & Agendamento');
  });
});
