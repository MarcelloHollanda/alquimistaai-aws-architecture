/**
 * Script de Teste - API Health Check
 * Testa as URLs da API para diagnóstico de 404
 */

// Simular variáveis de ambiente do Next.js
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com';

console.log('='.repeat(60));
console.log('🔍 TESTE DE API HEALTH CHECK');
console.log('='.repeat(60));
console.log('');

console.log('📋 Configuração:');
console.log(`   NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('');

async function testUrl(url: string, description: string) {
  console.log(`\n🌐 Testando: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const endTime = Date.now();
    
    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    console.log(`   ⏱️  Tempo: ${endTime - startTime}ms`);
    console.log(`   📦 Content-Type: ${response.headers.get('content-type')}`);
    
    const bodyText = await response.text();
    const bodyPreview = bodyText.substring(0, 200);
    
    console.log(`   📄 Body (primeiros 200 chars):`);
    console.log(`      ${bodyPreview}${bodyText.length > 200 ? '...' : ''}`);
    
    return {
      success: response.ok,
      status: response.status,
      body: bodyText,
    };
  } catch (error: any) {
    console.log(`   ❌ Erro: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 INICIANDO TESTES');
  console.log('='.repeat(60));
  
  // Teste 1: Raiz da API
  await testUrl(NEXT_PUBLIC_API_URL, 'Raiz da API (/)');
  
  // Teste 2: Health endpoint
  await testUrl(`${NEXT_PUBLIC_API_URL}/health`, 'Health Check (/health)');
  
  // Teste 3: API prefix
  await testUrl(`${NEXT_PUBLIC_API_URL}/api/health`, 'API Health (/api/health)');
  
  // Teste 4: Agents endpoint
  await testUrl(`${NEXT_PUBLIC_API_URL}/api/agents`, 'Agents List (/api/agents)');
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ TESTES CONCLUÍDOS');
  console.log('='.repeat(60));
}

// Executar testes
runTests().catch(console.error);
