import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E do Frontend
 * 
 * Para instalar: npm install -D @playwright/test
 * Para executar: npx playwright test
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  // Executar testes em paralelo
  fullyParallel: true,
  
  // Falhar se houver only() em CI
  forbidOnly: !!process.env.CI,
  
  // Retry em CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['list'],
  ],
  
  // Configurações compartilhadas
  use: {
    // URL base - IMPORTANTE: permite usar page.goto('/rota') em vez de URL completa
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Timeout para ações
    actionTimeout: 10000,
  },

  // Configurar projetos para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Testes mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Servidor web local - IMPORTANTE: sobe o Next.js antes dos testes
  webServer: {
    // Usa script dev:e2e que seta E2E_BYPASS_AUTH=true
    command: 'npm run dev:e2e',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
