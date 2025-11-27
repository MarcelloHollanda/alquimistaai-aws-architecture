# Script para configurar o repositório GitHub
# Execute este script para conectar o projeto ao GitHub

Write-Host "🚀 Configurando repositório GitHub AlquimistaAI..." -ForegroundColor Green

# Verificar se Git está instalado
try {
    git --version | Out-Null
    Write-Host "✅ Git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado. Instale o Git primeiro: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Verificar se GitHub CLI está instalado
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ GitHub CLI não encontrado. Instale para facilitar a configuração: https://cli.github.com/" -ForegroundColor Yellow
}

Write-Host "`n📋 Informações do repositório:" -ForegroundColor Cyan
Write-Host "   Usuário: MarcelloHollanda" -ForegroundColor White
Write-Host "   Repositório: AlquimistaAI" -ForegroundColor White
Write-Host "   URL: https://github.com/MarcelloHollanda/AlquimistaAI" -ForegroundColor White

Write-Host "`n🔧 Passo 1: Inicializando Git..." -ForegroundColor Yellow
git init

Write-Host "`n📝 Passo 2: Configurando usuário Git..." -ForegroundColor Yellow
$gitUser = git config --global user.name
$gitEmail = git config --global user.email

if (-not $gitUser) {
    $userName = Read-Host "Digite seu nome para o Git"
    git config --global user.name "$userName"
}

if (-not $gitEmail) {
    $userEmail = Read-Host "Digite seu email para o Git"
    git config --global user.email "$userEmail"
}

Write-Host "✅ Usuário Git configurado: $(git config --global user.name) <$(git config --global user.email)>" -ForegroundColor Green

Write-Host "`n📦 Passo 3: Adicionando arquivos..." -ForegroundColor Yellow
git add .

Write-Host "`n💾 Passo 4: Fazendo commit inicial..." -ForegroundColor Yellow
git commit -m "feat: initial commit with complete AWS infrastructure and CI/CD

- Complete AWS CDK infrastructure (Fibonacci, Alquimista, Nigredo stacks)
- 7 specialized Nigredo agents for marketing automation
- GitHub Actions CI/CD with dev/staging/prod environments
- Slack notifications for deployments and approvals
- Comprehensive security (WAF, CloudTrail, KMS encryption)
- LGPD compliance implementation
- Monitoring and alerting with CloudWatch
- MCP integrations for WhatsApp and Google Calendar
- Complete documentation and deployment guides"

Write-Host "`n🔗 Passo 5: Conectando ao repositório remoto..." -ForegroundColor Yellow
git remote add origin https://github.com/MarcelloHollanda/AlquimistaAI.git
git branch -M main

Write-Host "`n🌐 Agora você precisa:" -ForegroundColor Cyan
Write-Host "1. Criar o repositório no GitHub:" -ForegroundColor White
Write-Host "   - Vá para: https://github.com/new" -ForegroundColor Gray
Write-Host "   - Nome: AlquimistaAI" -ForegroundColor Gray
Write-Host "   - Visibilidade: Privado (recomendado)" -ForegroundColor Gray
Write-Host "   - NÃO adicione README, .gitignore ou LICENSE" -ForegroundColor Gray

Write-Host "`n2. Depois de criar o repositório, execute:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Gray

Write-Host "`n3. Configurar GitHub Secrets:" -ForegroundColor White
Write-Host "   - AWS_ACCESS_KEY_ID" -ForegroundColor Gray
Write-Host "   - AWS_SECRET_ACCESS_KEY" -ForegroundColor Gray
Write-Host "   - SLACK_WEBHOOK_URL" -ForegroundColor Gray

Write-Host "`n📚 Documentação completa em:" -ForegroundColor Cyan
Write-Host "   - README.md (visão geral)" -ForegroundColor Gray
Write-Host "   - SETUP.md (guia de instalação)" -ForegroundColor Gray
Write-Host "   - Docs/Deploy/ (documentação de deploy)" -ForegroundColor Gray

Write-Host "`n✨ Repositório configurado com sucesso!" -ForegroundColor Green
Write-Host "🚀 Pronto para transformar leads em oportunidades!" -ForegroundColor Magenta