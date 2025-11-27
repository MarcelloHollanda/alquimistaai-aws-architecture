# Script de Setup Automático - Cognito Auth
# Executa os passos automatizáveis da configuração

Write-Host "🔐 Setup de Autenticação com Cognito" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Passo 1: Copiar .env.example
Write-Host "[1/5] Copiando arquivo de ambiente..." -ForegroundColor Yellow
if (Test-Path "frontend/.env.local") {
    Write-Host "   ⚠️  .env.local já existe, pulando..." -ForegroundColor Yellow
} else {
    Copy-Item "frontend/.env.example" "frontend/.env.local"
    Write-Host "   ✅ .env.local criado!" -ForegroundColor Green
    Write-Host "   📝 AÇÃO NECESSÁRIA: Edite frontend/.env.local com suas credenciais" -ForegroundColor Magenta
}

# Passo 2: Instalar dependências do frontend
Write-Host "`n[2/5] Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install amazon-cognito-identity-js zustand react-icons @radix-ui/react-label @radix-ui/react-select lucide-react --save
Write-Host "   ✅ Dependências instaladas!" -ForegroundColor Green
Set-Location ..

# Passo 3: Verificar estrutura de arquivos
Write-Host "`n[3/5] Verificando arquivos criados..." -ForegroundColor Yellow
$files = @(
    "frontend/src/lib/cognito-client.ts",
    "frontend/src/hooks/use-auth.ts",
    "frontend/src/app/auth/login/page.tsx",
    "frontend/src/app/auth/register/page.tsx",
    "frontend/src/app/auth/forgot-password/page.tsx",
    "frontend/src/app/auth/reset-password/page.tsx",
    "frontend/src/app/auth/callback/page.tsx",
    "frontend/src/app/app/settings/page.tsx",
    "frontend/src/components/auth/register-wizard.tsx",
    "frontend/src/components/settings/profile-tab.tsx",
    "frontend/src/components/settings/company-tab.tsx",
    "frontend/src/components/settings/integrations-tab.tsx",
    "frontend/src/components/ui/label.tsx",
    "frontend/src/components/ui/select.tsx",
    "frontend/src/components/ui/card.tsx"
)

$missing = @()
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file" -ForegroundColor Red
        $missing += $file
    }
}

if ($missing.Count -eq 0) {
    Write-Host "`n   ✅ Todos os arquivos estão presentes!" -ForegroundColor Green
} else {
    Write-Host "`n   ⚠️  $($missing.Count) arquivo(s) faltando" -ForegroundColor Yellow
}

# Passo 4: Mostrar próximos passos manuais
Write-Host "`n[4/5] Próximos passos MANUAIS:" -ForegroundColor Yellow
Write-Host "   📋 Estes passos precisam ser feitos manualmente:`n" -ForegroundColor White

Write-Host "   1️⃣  CRIAR COGNITO USER POOL" -ForegroundColor Cyan
Write-Host "      - Acesse: https://console.aws.amazon.com/cognito" -ForegroundColor Gray
Write-Host "      - Clique em 'Create user pool'" -ForegroundColor Gray
Write-Host "      - Siga o guia em: frontend/AUTH-SETUP-README.md`n" -ForegroundColor Gray

Write-Host "   2️⃣  CONFIGURAR GOOGLE OAUTH" -ForegroundColor Cyan
Write-Host "      - Acesse: https://console.cloud.google.com/" -ForegroundColor Gray
Write-Host "      - Crie OAuth 2.0 Client ID" -ForegroundColor Gray
Write-Host "      - Configure redirect URI no Cognito`n" -ForegroundColor Gray

Write-Host "   3️⃣  CONFIGURAR FACEBOOK OAUTH" -ForegroundColor Cyan
Write-Host "      - Acesse: https://developers.facebook.com/" -ForegroundColor Gray
Write-Host "      - Crie app e configure Facebook Login" -ForegroundColor Gray
Write-Host "      - Configure redirect URI no Cognito`n" -ForegroundColor Gray

Write-Host "   4️⃣  PREENCHER .env.local" -ForegroundColor Cyan
Write-Host "      - Edite: frontend/.env.local" -ForegroundColor Gray
Write-Host "      - Adicione User Pool ID, Client ID, Domain`n" -ForegroundColor Gray

Write-Host "   5️⃣  IMPLEMENTAR APIS DO BACKEND" -ForegroundColor Cyan
Write-Host "      - POST /api/companies" -ForegroundColor Gray
Write-Host "      - GET/PUT /api/companies/current" -ForegroundColor Gray
Write-Host "      - POST /api/users" -ForegroundColor Gray
Write-Host "      - GET/PUT /api/users/profile" -ForegroundColor Gray
Write-Host "      - POST /api/upload/logo" -ForegroundColor Gray
Write-Host "      - GET /api/integrations" -ForegroundColor Gray
Write-Host "      - POST /api/integrations/{id}/connect" -ForegroundColor Gray
Write-Host "      - POST /api/integrations/{id}/disconnect`n" -ForegroundColor Gray

# Passo 5: Criar checklist
Write-Host "[5/5] Criando checklist..." -ForegroundColor Yellow

# Criar arquivo de checklist separadamente
$checklistContent = "# Checklist de Setup - Cognito Auth`n`n"
$checklistContent += "## Passos Automaticos (Concluidos)`n"
$checklistContent += "- [x] Copiar .env.example para .env.local`n"
$checklistContent += "- [x] Instalar dependencias do frontend`n"
$checklistContent += "- [x] Verificar arquivos criados`n`n"
$checklistContent += "## Passos Manuais (Pendentes)`n`n"
$checklistContent += "### AWS Cognito`n"
$checklistContent += "- [ ] Criar Cognito User Pool`n"
$checklistContent += "- [ ] Configurar App Client`n"
$checklistContent += "- [ ] Configurar Hosted UI Domain`n"
$checklistContent += "- [ ] Adicionar custom attributes (tenantId, role)`n"
$checklistContent += "- [ ] Configurar callback URLs`n`n"
$checklistContent += "### OAuth Providers`n"
$checklistContent += "- [ ] Configurar Google OAuth`n"
$checklistContent += "- [ ] Configurar Facebook OAuth`n`n"
$checklistContent += "### Configuracao`n"
$checklistContent += "- [ ] Preencher frontend/.env.local`n`n"
$checklistContent += "### Backend APIs`n"
$checklistContent += "- [ ] Implementar APIs de empresas`n"
$checklistContent += "- [ ] Implementar APIs de usuarios`n"
$checklistContent += "- [ ] Implementar API de upload`n"
$checklistContent += "- [ ] Implementar APIs de integracoes`n`n"
$checklistContent += "### Testes`n"
$checklistContent += "- [ ] Testar todos os fluxos de autenticacao`n`n"
$checklistContent += "## Documentacao`n"
$checklistContent += "Guia completo: frontend/AUTH-SETUP-README.md`n"

Set-Content -Path "COGNITO-AUTH-CHECKLIST.md" -Value $checklistContent
Write-Host "   ✅ Checklist criado: COGNITO-AUTH-CHECKLIST.md" -ForegroundColor Green

# Resumo final
Write-Host "`n✅ Setup automático concluído!" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green

Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Leia: frontend/AUTH-SETUP-README.md" -ForegroundColor White
Write-Host "   2. Siga: COGNITO-AUTH-CHECKLIST.md" -ForegroundColor White
Write-Host "   3. Configure Cognito no AWS Console" -ForegroundColor White
Write-Host "   4. Preencha frontend/.env.local" -ForegroundColor White
Write-Host "   5. Implemente as APIs do backend" -ForegroundColor White
Write-Host "   6. Teste: cd frontend && npm run dev`n" -ForegroundColor White

Write-Host "🎉 Boa sorte!" -ForegroundColor Green
