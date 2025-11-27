#!/usr/bin/env node

/**
 * Script de validação pré-deploy
 * Verifica se o frontend está pronto para deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validando frontend para deploy...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar arquivos essenciais
function checkEssentialFiles() {
  console.log('📁 Verificando arquivos essenciais...');
  
  const essentialFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.ts',
    'tsconfig.json',
    'src/app/layout.tsx',
    'src/app/page.tsx',
  ];
  
  essentialFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} não encontrado`);
      errors++;
    }
  });
}

// 2. Verificar variáveis de ambiente
function checkEnvVariables() {
  console.log('\n📋 Verificando variáveis de ambiente...');
  
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    console.log('  ⚠️  .env.example não encontrado');
    warnings++;
    return;
  }
  
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  const requiredVars = ['NEXT_PUBLIC_API_URL'];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName} documentada`);
    } else {
      console.log(`  ❌ ${varName} não documentada`);
      errors++;
    }
  });
}

// 3. Verificar TypeScript
function checkTypeScript() {
  console.log('\n📝 Verificando TypeScript...');
  
  try {
    execSync('npx tsc --noEmit', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('  ✅ TypeScript sem erros');
  } catch (error) {
    console.log('  ❌ Erros de TypeScript encontrados');
    console.log(error.stdout?.toString() || error.message);
    errors++;
  }
}

// 4. Verificar build
function checkBuild() {
  console.log('\n🏗️  Testando build...');
  
  try {
    execSync('npm run build', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('  ✅ Build executado com sucesso');
  } catch (error) {
    console.log('  ❌ Erro no build');
    const output = error.stdout?.toString() || error.message;
    console.log(output.substring(0, 500));
    errors++;
  }
}

// 5. Verificar dependências
function checkDependencies() {
  console.log('\n📦 Verificando dependências...');
  
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    
    const requiredDeps = ['next', 'react', 'typescript', 'tailwindcss'];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`  ✅ ${dep} instalado`);
      } else {
        console.log(`  ❌ ${dep} não encontrado`);
        errors++;
      }
    });
  } catch (error) {
    console.log('  ❌ Erro ao ler package.json');
    errors++;
  }
}

// 6. Verificar configuração de deploy
function checkDeployConfig() {
  console.log('\n🚀 Verificando configurações de deploy...');
  
  const deployFiles = [
    { file: 'vercel.json', platform: 'Vercel' },
    { file: 'amplify.yml', platform: 'AWS Amplify' },
    { file: 'DEPLOY.md', platform: 'Documentação' },
  ];
  
  deployFiles.forEach(({ file, platform }) => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${platform}: ${file}`);
    } else {
      console.log(`  ⚠️  ${platform}: ${file} não encontrado`);
      warnings++;
    }
  });
}

// Executar todas as verificações
try {
  checkEssentialFiles();
  checkEnvVariables();
  checkDependencies();
  checkDeployConfig();
  checkTypeScript();
  checkBuild();
} catch (error) {
  console.error('\n❌ Erro durante validação:', error.message);
  process.exit(1);
}

// Resultado final
console.log('\n' + '='.repeat(50));
console.log('📊 RESULTADO DA VALIDAÇÃO');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('🎉 Tudo OK! Frontend pronto para deploy!');
  console.log('\n📝 Próximos passos:');
  console.log('  1. Escolha uma plataforma (Vercel, Amplify, etc.)');
  console.log('  2. Configure variáveis de ambiente');
  console.log('  3. Execute o deploy');
  console.log('\n📚 Consulte QUICK-DEPLOY.md para instruções');
  process.exit(0);
} else {
  console.log(`❌ Erros: ${errors}`);
  console.log(`⚠️  Avisos: ${warnings}`);
  
  if (errors > 0) {
    console.log('\n🚨 Corrija os erros antes do deploy!');
    process.exit(1);
  } else {
    console.log('\n⚠️  Avisos encontrados, mas deploy pode prosseguir');
    process.exit(0);
  }
}
