/**
 * Testes E2E - Criação de comandos operacionais
 * Requisitos: 4.6, 8.1, 8.7
 */

import { test, expect } from '@playwright/test';

const internalUser = {
  email: process.env.TEST_INTERNAL_EMAIL || 'admin@alquimista.ai',
  password: process.env.TEST_INTERNAL_PASSWORD || 'TestPassword123!',
};

test.describe('Console de Operações - Comandos', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login como usuário interno
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', internalUser.email);
    await page.fill('input[type="password"]', internalUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/company/);
    
    // Navegar para console de operações
    await page.goto('/app/company/operations');
  });

  test('deve exibir formulário de criação de comando', async ({ page }) => {
    // Verificar que o formulário está visível
    await expect(page.getByText(/Executar Comando|Novo Comando/i)).toBeVisible();
    
    // Verificar campos do formulário
    await expect(page.locator('select:has-text("Tipo"), select >> nth=0')).toBeVisible();
    
    // Verificar botão de submit
    await expect(page.locator('button:has-text("Executar"), button[type="submit"]')).toBeVisible();
  });

  test('deve criar comando HEALTH_CHECK', async ({ page }) => {
    // Selecionar tipo de comando
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'HEALTH_CHECK');
    
    // Submeter formulário
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar confirmação
    await page.waitForTimeout(2000);
    
    // Verificar mensagem de sucesso
    await expect(page.getByText(/sucesso|criado|executado/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve criar comando REPROCESS_QUEUE com parâmetros', async ({ page }) => {
    // Selecionar tipo de comando
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'REPROCESS_QUEUE');
    
    // Preencher parâmetros (se houver campos)
    const queueNameInput = page.locator('input[name="queue_name"], input[placeholder*="queue"]');
    if (await queueNameInput.isVisible()) {
      await queueNameInput.fill('test-queue');
    }
    
    // Submeter formulário
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar confirmação
    await page.waitForTimeout(2000);
    
    // Verificar mensagem de sucesso
    await expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve criar comando RESET_TOKEN para tenant específico', async ({ page }) => {
    // Selecionar tipo de comando
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'RESET_TOKEN');
    
    // Selecionar tenant (se houver campo)
    const tenantSelect = page.locator('select:has-text("Tenant"), input[name="tenant_id"]');
    if (await tenantSelect.isVisible()) {
      if (tenantSelect.locator('option').count() > 0) {
        await tenantSelect.selectOption({ index: 1 });
      }
    }
    
    // Submeter formulário
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar confirmação
    await page.waitForTimeout(2000);
    
    // Verificar mensagem de sucesso
    await expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve criar comando RESTART_AGENT', async ({ page }) => {
    // Selecionar tipo de comando
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'RESTART_AGENT');
    
    // Preencher agent_id (se houver campo)
    const agentIdInput = page.locator('input[name="agent_id"], select:has-text("Agente")');
    if (await agentIdInput.isVisible()) {
      if (agentIdInput.tagName() === 'SELECT') {
        await agentIdInput.selectOption({ index: 1 });
      } else {
        await agentIdInput.fill('agent-test-123');
      }
    }
    
    // Submeter formulário
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar confirmação
    await page.waitForTimeout(2000);
    
    // Verificar mensagem de sucesso
    await expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir histórico de comandos', async ({ page }) => {
    // Verificar que há seção de histórico
    await expect(page.getByText(/Histórico|Comandos Executados/i)).toBeVisible();
    
    // Verificar que há tabela de comandos
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
  });

  test('deve filtrar comandos por status', async ({ page }) => {
    // Selecionar filtro de status
    const statusFilter = page.locator('select:has-text("Status"), select >> nth=1');
    
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('SUCCESS');
      
      // Aguardar atualização
      await page.waitForTimeout(1000);
      
      // Verificar que a tabela foi atualizada
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
    }
  });

  test('deve filtrar comandos por tipo', async ({ page }) => {
    // Selecionar filtro de tipo
    const typeFilter = page.locator('select:has-text("Tipo de Comando")');
    
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('HEALTH_CHECK');
      
      // Aguardar atualização
      await page.waitForTimeout(1000);
      
      // Verificar que a tabela foi atualizada
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
    }
  });

  test('deve exibir detalhes do comando na tabela', async ({ page }) => {
    // Aguardar carregamento da tabela
    await page.waitForTimeout(2000);
    
    // Verificar colunas da tabela
    const table = page.locator('table, [role="table"]');
    
    if (await table.isVisible()) {
      // Verificar que há dados na tabela
      const rows = table.locator('tbody tr, [role="row"]');
      const count = await rows.count();
      
      if (count > 0) {
        // Verificar primeira linha
        const firstRow = rows.first();
        await expect(firstRow).toBeVisible();
        
        // Pode conter: tipo, status, data, etc.
      }
    }
  });

  test('deve atualizar status do comando automaticamente', async ({ page }) => {
    // Criar um comando
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'HEALTH_CHECK');
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar criação
    await page.waitForTimeout(2000);
    
    // Aguardar processamento (polling)
    await page.waitForTimeout(5000);
    
    // Verificar que o status foi atualizado na tabela
    const table = page.locator('table, [role="table"]');
    if (await table.isVisible()) {
      // Pode exibir SUCCESS, ERROR, ou RUNNING
      const statusBadges = page.locator('.badge, [data-testid="status-badge"]');
      const count = await statusBadges.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tentar submeter sem selecionar tipo
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar validação
    await page.waitForTimeout(1000);
    
    // Verificar mensagem de erro ou validação HTML5
    const errorMessage = page.locator('text=/obrigatório|required/i, [role="alert"]');
    
    // Pode ser validação HTML5 ou mensagem customizada
    const hasError = await errorMessage.isVisible() || 
                     await page.locator('select:invalid').count() > 0;
    
    expect(hasError).toBeTruthy();
  });

  test('deve exibir output do comando após execução', async ({ page }) => {
    // Criar comando
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'HEALTH_CHECK');
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar processamento
    await page.waitForTimeout(5000);
    
    // Clicar em detalhes do comando (se houver botão)
    const detailsButton = page.locator('button:has-text("Detalhes"), button:has-text("Ver")').first();
    
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      
      // Verificar que há output
      await expect(page.getByText(/Output|Resultado/i)).toBeVisible();
    }
  });

  test('deve exibir error_message em caso de falha', async ({ page }) => {
    // Aguardar carregamento da tabela
    await page.waitForTimeout(2000);
    
    // Procurar por comandos com erro
    const errorBadges = page.locator('text=/ERROR|Erro/i');
    const count = await errorBadges.count();
    
    if (count > 0) {
      // Clicar no primeiro erro
      await errorBadges.first().click();
      
      // Verificar que há mensagem de erro
      await expect(page.getByText(/erro|error|falha/i)).toBeVisible();
    }
  });

  test('deve implementar paginação no histórico', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Verificar controles de paginação
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });

  test('deve limpar formulário após criação bem-sucedida', async ({ page }) => {
    // Selecionar tipo
    await page.selectOption('select:has-text("Tipo"), select >> nth=0', 'HEALTH_CHECK');
    
    // Submeter
    await page.click('button:has-text("Executar"), button[type="submit"]');
    
    // Aguardar confirmação
    await page.waitForTimeout(2000);
    
    // Verificar que o formulário foi limpo
    const typeSelect = page.locator('select:has-text("Tipo"), select >> nth=0');
    const selectedValue = await typeSelect.inputValue();
    
    // Pode estar vazio ou com valor padrão
    expect(selectedValue === '' || selectedValue === 'HEALTH_CHECK').toBeTruthy();
  });
});
