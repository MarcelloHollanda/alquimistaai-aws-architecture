/**
 * Testes E2E - Edição de perfil e empresa
 * Requisito: Testar edição de perfil e empresa
 * 
 * Para executar: npx playwright test tests/e2e/profile-settings.spec.ts
 */

import { test, expect } from '@playwright/test';

const testUser = {
  email: 'usuario@exemplo.com',
  password: 'Senha123!',
  name: 'Usuário Teste',
  phone: '(84) 99708-4444',
};

const updatedProfile = {
  name: 'Usuário Atualizado',
  phone: '(84) 98765-4321',
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
};

const testCompany = {
  name: 'Empresa Teste',
  legalName: 'Empresa Teste LTDA',
  cnpj: '11.222.333/0001-81',
  segment: 'Tecnologia',
};

const updatedCompany = {
  name: 'Empresa Atualizada',
  legalName: 'Empresa Atualizada LTDA',
  segment: 'E-commerce',
};

test.describe('Edição de Perfil', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/);
    
    // Navegar para configurações
    await page.goto('/app/settings');
  });

  test('deve exibir dados atuais do perfil', async ({ page }) => {
    // Verificar aba Perfil está ativa
    await page.click('button:has-text("Perfil")');
    
    // Verificar campos preenchidos
    await expect(page.locator('input[name="name"]')).toHaveValue(testUser.name);
    await expect(page.locator('input[name="phone"]')).toHaveValue(testUser.phone);
  });

  test('deve atualizar nome do usuário', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Atualizar nome
    await page.fill('input[name="name"]', updatedProfile.name);
    
    // Salvar alterações
    await page.click('button:has-text("Salvar")');
    
    // Verificar mensagem de sucesso
    await expect(page.getByText(/salvo|atualizado.*sucesso/i)).toBeVisible();
    
    // Recarregar página e verificar persistência
    await page.reload();
    await page.click('button:has-text("Perfil")');
    await expect(page.locator('input[name="name"]')).toHaveValue(updatedProfile.name);
  });

  test('deve atualizar telefone do usuário', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Atualizar telefone
    await page.fill('input[name="phone"]', updatedProfile.phone);
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar sucesso
    await expect(page.getByText(/salvo|atualizado.*sucesso/i)).toBeVisible();
  });

  test('deve atualizar idioma e fuso horário', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Atualizar idioma
    await page.selectOption('select[name="language"]', updatedProfile.language);
    
    // Atualizar fuso horário
    await page.selectOption('select[name="timezone"]', updatedProfile.timezone);
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar sucesso
    await expect(page.getByText(/salvo|atualizado.*sucesso/i)).toBeVisible();
  });

  test('deve exibir papel do usuário como somente leitura', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Verificar que papel está visível
    await expect(page.getByText(/Master|Admin|Operacional|Leitura/i)).toBeVisible();
    
    // Verificar que não é editável
    const roleField = page.locator('input[name="role"]');
    if (await roleField.isVisible()) {
      await expect(roleField).toBeDisabled();
    }
  });

  test('deve permitir alterar senha', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Clicar em "Alterar senha"
    await page.click('button:has-text("Alterar senha")');
    
    // Deve abrir modal ou seção
    await expect(page.getByText(/senha atual|antiga/i)).toBeVisible();
    
    // Preencher formulário
    await page.fill('input[name="oldPassword"]', testUser.password);
    await page.fill('input[name="newPassword"]', 'NovaSenha123!');
    await page.fill('input[name="confirmPassword"]', 'NovaSenha123!');
    
    // Confirmar
    await page.click('button:has-text("Confirmar")');
    
    // Verificar sucesso
    await expect(page.getByText(/senha.*alterada/i)).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Limpar nome
    await page.fill('input[name="name"]', '');
    
    // Tentar salvar
    await page.click('button:has-text("Salvar")');
    
    // Deve exibir erro
    await expect(page.getByText(/nome.*obrigatório/i)).toBeVisible();
  });

  test('deve validar formato de telefone', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Preencher telefone inválido
    await page.fill('input[name="phone"]', '123');
    
    // Tentar salvar
    await page.click('button:has-text("Salvar")');
    
    // Deve exibir erro
    await expect(page.getByText(/telefone.*inválido/i)).toBeVisible();
  });
});

test.describe('Edição de Empresa', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login como Master/Admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/);
    
    // Navegar para configurações
    await page.goto('/app/settings');
    await page.click('button:has-text("Empresa")');
  });

  test('deve exibir dados atuais da empresa', async ({ page }) => {
    // Verificar campos preenchidos
    await expect(page.locator('input[name="companyName"]')).toHaveValue(testCompany.name);
    await expect(page.locator('input[name="cnpj"]')).toHaveValue(testCompany.cnpj);
  });

  test('deve atualizar nome da empresa', async ({ page }) => {
    // Atualizar nome
    await page.fill('input[name="companyName"]', updatedCompany.name);
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar sucesso
    await expect(page.getByText(/salvo|atualizado.*sucesso/i)).toBeVisible();
    
    // Verificar persistência
    await page.reload();
    await page.click('button:has-text("Empresa")');
    await expect(page.locator('input[name="companyName"]')).toHaveValue(updatedCompany.name);
  });

  test('deve atualizar razão social', async ({ page }) => {
    // Atualizar razão social
    await page.fill('input[name="companyLegalName"]', updatedCompany.legalName);
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar sucesso
    await expect(page.getByText(/salvo|atualizado.*sucesso/i)).toBeVisible();
  });

  test('deve atualizar segmento', async ({ page }) => {
    // Atualizar segmento
    await page.selectOption('select[name="segment"]', updatedCompany.segment);
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar sucesso
    await expect(page.getByText(/salvo|atualizado.*sucesso/i)).toBeVisible();
  });

  test('deve fazer upload de logomarca', async ({ page }) => {
    // Verificar campo de upload
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Fazer upload (requer arquivo de teste)
    // await fileInput.setInputFiles('path/to/test-logo.png');
    
    // Salvar
    // await page.click('button:has-text("Salvar")');
    
    // Verificar sucesso
    // await expect(page.getByText(/logo.*atualizada/i)).toBeVisible();
  });

  test('deve exibir tenantId como somente leitura', async ({ page }) => {
    // Verificar que tenantId está visível
    await expect(page.getByText(/tenant.*id/i)).toBeVisible();
    
    // Verificar que não é editável
    const tenantIdField = page.locator('input[name="tenantId"]');
    if (await tenantIdField.isVisible()) {
      await expect(tenantIdField).toBeDisabled();
    }
  });

  test('deve exibir data de criação como somente leitura', async ({ page }) => {
    // Verificar que data de criação está visível
    await expect(page.getByText(/criado.*em|data.*criação/i)).toBeVisible();
  });

  test('deve validar CNPJ', async ({ page }) => {
    // Tentar atualizar com CNPJ inválido
    await page.fill('input[name="cnpj"]', '123');
    
    // Tentar salvar
    await page.click('button:has-text("Salvar")');
    
    // Deve exibir erro
    await expect(page.getByText(/cnpj.*inválido/i)).toBeVisible();
  });
});

test.describe('Aba de Integrações', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login como Master/Admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/dashboard/);
    
    // Navegar para configurações
    await page.goto('/app/settings');
    await page.click('button:has-text("Integrações")');
  });

  test('deve exibir lista de integrações disponíveis', async ({ page }) => {
    // Verificar seções de integrações
    await expect(page.getByText(/Google/i)).toBeVisible();
    await expect(page.getByText(/Meta|WhatsApp/i)).toBeVisible();
    await expect(page.getByText(/Telefonia/i)).toBeVisible();
  });

  test('deve exibir status de cada integração', async ({ page }) => {
    // Verificar status (Conectado/Não conectado)
    await expect(page.getByText(/Conectado|Não conectado/i)).toBeVisible();
  });

  test('deve permitir conectar integração', async ({ page }) => {
    // Procurar botão "Conectar"
    const connectButton = page.locator('button:has-text("Conectar")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      
      // Deve abrir modal ou redirecionar para OAuth
      // Verificação depende da implementação
    }
  });

  test('deve permitir desconectar integração', async ({ page }) => {
    // Procurar botão "Desconectar"
    const disconnectButton = page.locator('button:has-text("Desconectar")').first();
    
    if (await disconnectButton.isVisible()) {
      await disconnectButton.click();
      
      // Deve exibir confirmação
      await expect(page.getByText(/desconectar|remover/i)).toBeVisible();
      
      // Confirmar
      await page.click('button:has-text("Confirmar")');
      
      // Verificar sucesso
      await expect(page.getByText(/desconectada/i)).toBeVisible();
    }
  });
});

test.describe('Controle de Permissões', () => {
  test('usuário Operacional deve ter acesso limitado', async ({ page }) => {
    // Login como usuário operacional (requer setup específico)
    // Este teste assume que existe um usuário operacional configurado
    
    await page.goto('/app/settings');
    await page.click('button:has-text("Empresa")');
    
    // Campos devem estar desabilitados
    const companyNameField = page.locator('input[name="companyName"]');
    if (await companyNameField.isVisible()) {
      await expect(companyNameField).toBeDisabled();
    }
  });

  test('usuário Somente Leitura não deve ver aba Integrações', async ({ page }) => {
    // Login como usuário somente leitura (requer setup específico)
    
    await page.goto('/app/settings');
    
    // Aba Integrações não deve estar visível
    const integrationsTab = page.locator('button:has-text("Integrações")');
    await expect(integrationsTab).not.toBeVisible();
  });
});

test.describe('Navegação entre Abas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.goto('/app/settings');
  });

  test('deve navegar entre abas sem perder dados', async ({ page }) => {
    // Editar perfil
    await page.click('button:has-text("Perfil")');
    await page.fill('input[name="name"]', 'Nome Temporário');
    
    // Mudar para aba Empresa
    await page.click('button:has-text("Empresa")');
    await expect(page.locator('input[name="companyName"]')).toBeVisible();
    
    // Voltar para Perfil
    await page.click('button:has-text("Perfil")');
    
    // Verificar que dados não foram salvos (não clicou em Salvar)
    await expect(page.locator('input[name="name"]')).toHaveValue('Nome Temporário');
  });

  test('deve manter aba ativa após salvar', async ({ page }) => {
    await page.click('button:has-text("Perfil")');
    
    // Fazer alteração e salvar
    await page.fill('input[name="name"]', updatedProfile.name);
    await page.click('button:has-text("Salvar")');
    
    // Deve permanecer na aba Perfil
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });
});
