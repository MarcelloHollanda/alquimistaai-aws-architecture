#!/usr/bin/env node

/**
 * Deploy Frontend para AWS S3 + CloudFront
 * 
 * Este script faz upload dos arquivos estáticos para S3 e invalida o cache do CloudFront
 * 
 * Uso:
 *   node scripts/deploy-to-s3.js [dev|prod]
 * 
 * Variáveis de Ambiente Necessárias:
 *   AWS_REGION - Região AWS (padrão: us-east-1)
 *   S3_BUCKET_NAME - Nome do bucket S3
 *   CLOUDFRONT_DISTRIBUTION_ID - ID da distribuição CloudFront
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuração
const env = process.argv[2] || 'dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || `alquimista-frontend-${env}`;
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const OUT_DIR = path.join(__dirname, '..', 'out');

console.log('========================================');
console.log('Deploy Frontend para AWS S3 + CloudFront');
console.log('========================================');
console.log('');
console.log(`Ambiente: ${env}`);
console.log(`Região: ${AWS_REGION}`);
console.log(`Bucket: ${S3_BUCKET_NAME}`);
console.log(`CloudFront: ${CLOUDFRONT_DISTRIBUTION_ID || 'Não configurado'}`);
console.log('');

// Verificar se o diretório out existe
if (!fs.existsSync(OUT_DIR)) {
  console.error('❌ Erro: Diretório "out" não encontrado!');
  console.error('Execute "npm run build:static" primeiro.');
  process.exit(1);
}

// Verificar se AWS CLI está instalado
try {
  execSync('aws --version', { stdio: 'ignore' });
  console.log('✓ AWS CLI encontrado');
} catch (error) {
  console.error('❌ Erro: AWS CLI não encontrado!');
  console.error('Instale: https://aws.amazon.com/cli/');
  process.exit(1);
}

// Verificar credenciais AWS
try {
  execSync('aws sts get-caller-identity', { stdio: 'ignore' });
  console.log('✓ Credenciais AWS válidas');
} catch (error) {
  console.error('❌ Erro: Credenciais AWS inválidas!');
  console.error('Configure: aws configure');
  process.exit(1);
}

console.log('');
console.log('Iniciando deploy...');
console.log('');

try {
  // 1. Sync arquivos para S3
  console.log('1. Sincronizando arquivos com S3...');
  
  const syncCommand = `aws s3 sync "${OUT_DIR}" s3://${S3_BUCKET_NAME} --region ${AWS_REGION} --delete --cache-control "public,max-age=31536000,immutable"`;
  
  execSync(syncCommand, { stdio: 'inherit' });
  
  console.log('✓ Arquivos sincronizados com sucesso!');
  console.log('');

  // 2. Configurar cache-control para HTML (mais curto)
  console.log('2. Configurando cache para arquivos HTML...');
  
  const htmlCacheCommand = `aws s3 cp s3://${S3_BUCKET_NAME} s3://${S3_BUCKET_NAME} --region ${AWS_REGION} --recursive --exclude "*" --include "*.html" --cache-control "public,max-age=0,must-revalidate" --metadata-directive REPLACE`;
  
  execSync(htmlCacheCommand, { stdio: 'inherit' });
  
  console.log('✓ Cache configurado!');
  console.log('');

  // 3. Invalidar cache do CloudFront (se configurado)
  if (CLOUDFRONT_DISTRIBUTION_ID) {
    console.log('3. Invalidando cache do CloudFront...');
    
    const invalidateCommand = `aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*" --region ${AWS_REGION}`;
    
    execSync(invalidateCommand, { stdio: 'inherit' });
    
    console.log('✓ Cache invalidado!');
    console.log('');
  } else {
    console.log('⚠ CloudFront Distribution ID não configurado, pulando invalidação.');
    console.log('');
  }

  // 4. Sucesso
  console.log('========================================');
  console.log('✓ Deploy concluído com sucesso!');
  console.log('========================================');
  console.log('');
  console.log(`URL do S3: http://${S3_BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com`);
  
  if (CLOUDFRONT_DISTRIBUTION_ID) {
    console.log(`URL do CloudFront: Verifique no console AWS`);
  }
  
  console.log('');

} catch (error) {
  console.error('');
  console.error('========================================');
  console.error('❌ Erro durante o deploy!');
  console.error('========================================');
  console.error('');
  console.error(error.message);
  process.exit(1);
}
