#!/usr/bin/env node

/**
 * Script para alternar entre ambientes de backend
 * Uso: node scripts/switch-env.js [local|prod|custom]
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const args = process.argv.slice(2);
const environment = args[0] || 'local';
const customUrl = args[1];

const environments = {
  local: 'http://localhost:3001',
  prod: 'https://api.alquimista.ai',
  staging: 'https://staging-api.alquimista.ai',
  custom: customUrl || 'http://localhost:3001'
};

const url = environments[environment];

if (!url) {
  console.error('❌ Ambiente inválido. Use: local, prod, staging ou custom <URL>');
  process.exit(1);
}

const envContent = `# API Configuration - Backend AWS
# Ambiente: ${environment.toUpperCase()}
NEXT_PUBLIC_API_URL=${url}

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_WEBSOCKET=false

# Environment
NODE_ENV=development
`;

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Configuração atualizada!');
  console.log(`📡 Backend URL: ${url}`);
  console.log('🔄 Reinicie o servidor: npm run dev');
} catch (error) {
  console.error('❌ Erro ao atualizar .env.local:', error.message);
  process.exit(1);
}
