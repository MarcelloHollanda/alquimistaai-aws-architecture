# Script para testar deploy automático
# Execute este script após configurar o repositório

Write-Host "🚀 Testando Deploy Automático do AlquimistaAI..." -ForegroundColor Green

# Verificar se estamos no repositório correto
if (-not (Test-Path ".git")) {
    Write-Host "❌ Execute este script na raiz do projeto (onde está o .git)" -ForegroundColor Red
    exit 1
}

# Verificar se remote está configurado
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl -or $remoteUrl -notlike "*AlquimistaAI*") {
    Write-Host "❌ Repositório GitHub não configurado corretamente" -ForegroundColor Red
    Write-Host "Execute primeiro: .\scripts\setup-github.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Repositório configurado: $remoteUrl" -ForegroundColor Green

# Criar arquivo de teste
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$testFile = "test-deploy-$timestamp.md"

Write-Host "`n📝 Criando arquivo de teste: $testFile" -ForegroundColor Yellow

@"
# 🧪 Teste de Deploy Automático

**Timestamp**: $timestamp
**Ambiente**: Desenvolvimento
**Status**: Testando deploy via GitHub Actions

## O que vai acontecer:

1. ✅ GitHub Actions detecta este push
2. ✅ Executa workflow deploy-dev.yml
3. ✅ Instala dependências (npm install)
4. ✅ Executa testes (npm test)
5. ✅ Faz build (npm run build)
6. ✅ Executa CDK deploy (npm run deploy:dev)
7. ✅ Cria infraestrutura na AWS:
   - VPC com subnets
   - Aurora Serverless v2
   - Lambda Functions (7 agentes)
   - API Gateway
   - S3 + CloudFront
   - EventBridge + SQS
   - CloudWatch dashboards
   - WAF + Security
8. ✅ Envia notificação Slack (se configurado)

## 🎯 Resultado Esperado:

- Stack criada: `FibonacciStack-dev`
- URL da API: `https://dev-api.alquimista.ai`
- Agentes funcionando
- Dashboards disponíveis

---

**🤖 Gerado automaticamente pelo Kiro AI**
"@ | Out-File -FilePath $testFile -Encoding UTF8

Write-Host "✅ Arquivo criado com sucesso!" -ForegroundColor Green

# Verificar branch atual
$currentBranch = git branch --show-current
Write-Host "`n📋 Branch atual: $currentBranch" -ForegroundColor Cyan

# Se não estiver na develop, criar/trocar
if ($currentBranch -ne "develop") {
    Write-Host "🔄 Trocando para branch develop..." -ForegroundColor Yellow
    
    # Verificar se develop existe
    $developExists = git branch -r | Select-String "origin/develop"
    
    if ($developExists) {
        git checkout develop
    } else {
        git checkout -b develop
        Write-Host "✅ Branch develop criada" -ForegroundColor Green
    }
}

# Adicionar arquivo e fazer commit
Write-Host "`n📦 Adicionando arquivo ao Git..." -ForegroundColor Yellow
git add $testFile

Write-Host "💾 Fazendo commit..." -ForegroundColor Yellow
git commit -m "test: deploy automático para desenvolvimento - $timestamp

- Arquivo de teste criado automaticamente
- Trigger para GitHub Actions
- Deploy CDK para AWS dev environment
- Teste de infraestrutura completa

Kiro AI: Este commit vai disparar o deploy automático! 🚀"

Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
git push origin develop

Write-Host "`n🎉 Push realizado com sucesso!" -ForegroundColor Green
Write-Host "`n📊 Acompanhe o deploy em:" -ForegroundColor Cyan
Write-Host "   https://github.com/MarcelloHollanda/AlquimistaAI/actions" -ForegroundColor Gray

Write-Host "`n⏱️ O deploy deve levar entre 5-15 minutos" -ForegroundColor Yellow
Write-Host "   - Testes: ~2 minutos" -ForegroundColor Gray
Write-Host "   - Build: ~1 minuto" -ForegroundColor Gray
Write-Host "   - CDK Deploy: ~10 minutos" -ForegroundColor Gray

Write-Host "`n🔔 Você receberá notificação quando:" -ForegroundColor Cyan
Write-Host "   ✅ Deploy completar com sucesso" -ForegroundColor Gray
Write-Host "   ❌ Deploy falhar (com logs de erro)" -ForegroundColor Gray
Write-Host "   📱 No Slack (se configurado)" -ForegroundColor Gray

Write-Host "`n🎯 Próximos passos após o deploy:" -ForegroundColor Magenta
Write-Host "   1. Verificar stack criada no AWS Console" -ForegroundColor Gray
Write-Host "   2. Testar API endpoints" -ForegroundColor Gray
Write-Host "   3. Verificar dashboards do CloudWatch" -ForegroundColor Gray
Write-Host "   4. Testar agentes Nigredo" -ForegroundColor Gray

Write-Host "`n🚀 Deploy automático iniciado! Aguarde a mágica acontecer..." -ForegroundColor Green