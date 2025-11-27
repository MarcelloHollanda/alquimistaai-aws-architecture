# Script de Rollback Manual Guiado - AlquimistaAI
# Sistema: AlquimistaAI / Fibonacci Orquestrador B2B
# Região: us-east-1
#
# PROPÓSITO: Guiar operador através de processo seguro de rollback
# IMPORTANTE: Este script NÃO executa rollback automático - apenas guia

param(
    [string]$Environment = "dev",
    [string]$TargetCommit = $null,
    [string]$StackName = $null,
    [switch]$ShowCommitHistory = $false,
    [switch]$CheckOnly = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ROLLBACK MANUAL GUIADO - ALQUIMISTA.AI" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  ATENÇÃO: Este script é um GUIA interativo" -ForegroundColor Yellow
Write-Host "   Ele NÃO executa rollback automático." -ForegroundColor Yellow
Write-Host "   Você será guiado através dos passos necessários." -ForegroundColor Yellow
Write-Host ""

# Mostrar histórico de commits se solicitado
if ($ShowCommitHistory) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "HISTÓRICO DE COMMITS RECENTES" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        git log --oneline --graph --decorate -20
        Write-Host ""
    } catch {
        Write-Host "❌ Erro ao buscar histórico de commits" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
    if (-not $TargetCommit) {
        Write-Host "Execute novamente com -TargetCommit <hash> para continuar" -ForegroundColor Yellow
        exit 0
    }
}

# Verificar estado atual
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PASSO 1: VERIFICAR ESTADO ATUAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1.1 Verificando branch atual..." -ForegroundColor Yellow
try {
    $currentBranch = git branch --show-current
    Write-Host "   Branch atual: $currentBranch" -ForegroundColor White
    
    $currentCommit = git rev-parse HEAD
    Write-Host "   Commit atual: $currentCommit" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "   ❌ Erro ao verificar branch" -ForegroundColor Red
    exit 1
}

Write-Host "1.2 Verificando stacks CDK no ambiente $Environment..." -ForegroundColor Yellow
try {
    $stacks = @("FibonacciStack-$Environment", "NigredoStack-$Environment", "AlquimistaStack-$Environment")
    
    foreach ($stack in $stacks) {
        $stackInfo = aws cloudformation describe-stacks --stack-name $stack --query "Stacks[0].StackStatus" --output text --region us-east-1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $stack : $stackInfo" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $stack : Não encontrado ou erro" -ForegroundColor Yellow
        }
    }
    Write-Host ""
} catch {
    Write-Host "   ⚠️  Erro ao verificar stacks" -ForegroundColor Yellow
}

if ($CheckOnly) {
    Write-Host "Modo -CheckOnly ativado. Parando aqui." -ForegroundColor Yellow
    exit 0
}

# Cenários de rollback
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PASSO 2: IDENTIFICAR CENÁRIO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Qual é o problema que você está enfrentando?" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Deploy falhou durante execução do CDK" -ForegroundColor White
Write-Host "2. Deploy passou, mas API está retornando erros" -ForegroundColor White
Write-Host "3. Deploy passou, mas funcionalidade quebrada" -ForegroundColor White
Write-Host "4. Problema com migrations de banco de dados" -ForegroundColor White
Write-Host "5. Outro problema" -ForegroundColor White
Write-Host ""

$scenario = Read-Host "Digite o número do cenário (1-5)"

Write-Host ""

switch ($scenario) {
    "1" {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "CENÁRIO 1: DEPLOY FALHOU DURANTE CDK" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "✅ BOA NOTÍCIA: CloudFormation faz rollback automático!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Passos recomendados:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Verificar logs do CloudFormation:" -ForegroundColor White
        Write-Host "   aws cloudformation describe-stack-events --stack-name <stack-name> --region us-east-1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Identificar recurso que falhou:" -ForegroundColor White
        Write-Host "   Procure por eventos com Status: CREATE_FAILED ou UPDATE_FAILED" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Corrigir o problema no código:" -ForegroundColor White
        Write-Host "   - Edite o arquivo CDK correspondente" -ForegroundColor Gray
        Write-Host "   - Execute: npm run build" -ForegroundColor Gray
        Write-Host "   - Execute: cdk synth <stack-name> --context env=$Environment" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. Fazer novo deploy com correção:" -ForegroundColor White
        Write-Host "   cdk deploy <stack-name> --context env=$Environment" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️  NÃO é necessário fazer rollback manual neste caso!" -ForegroundColor Yellow
    }
    
    "2" {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "CENÁRIO 2: API RETORNANDO ERROS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Passos de diagnóstico:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Verificar logs do CloudWatch:" -ForegroundColor White
        Write-Host "   aws logs tail /aws/lambda/<function-name> --follow --region us-east-1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Executar smoke tests:" -ForegroundColor White
        Write-Host "   .\scripts\smoke-tests-api-dev.ps1 -Environment $Environment -Verbose" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Verificar migrations do banco:" -ForegroundColor White
        Write-Host "   .\scripts\validate-migrations-aurora.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. Se problema for crítico, fazer rollback:" -ForegroundColor White
        Write-Host ""
        
        if ($TargetCommit) {
            Write-Host "   a) Checkout do commit anterior:" -ForegroundColor Gray
            Write-Host "      git checkout $TargetCommit" -ForegroundColor Gray
        } else {
            Write-Host "   a) Identificar commit anterior estável:" -ForegroundColor Gray
            Write-Host "      git log --oneline -10" -ForegroundColor Gray
            Write-Host ""
            Write-Host "   b) Checkout do commit:" -ForegroundColor Gray
            Write-Host "      git checkout <commit-hash>" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "   c) Rebuild e deploy:" -ForegroundColor Gray
        Write-Host "      npm run build" -ForegroundColor Gray
        Write-Host "      cdk deploy --all --context env=$Environment" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   d) Validar:" -ForegroundColor Gray
        Write-Host "      .\scripts\smoke-tests-api-dev.ps1 -Environment $Environment" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   e) Voltar para branch principal:" -ForegroundColor Gray
        Write-Host "      git checkout main" -ForegroundColor Gray
    }
    
    "3" {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "CENÁRIO 3: FUNCIONALIDADE QUEBRADA" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Passos recomendados:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Avaliar severidade:" -ForegroundColor White
        Write-Host "   - Crítico (afeta produção): Rollback imediato" -ForegroundColor Gray
        Write-Host "   - Não crítico (dev/staging): Hotfix e novo deploy" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Para rollback imediato:" -ForegroundColor White
        Write-Host ""
        
        if ($TargetCommit) {
            Write-Host "   a) Checkout do commit anterior:" -ForegroundColor Gray
            Write-Host "      git checkout $TargetCommit" -ForegroundColor Gray
        } else {
            Write-Host "   a) Identificar último commit estável:" -ForegroundColor Gray
            Write-Host "      git log --oneline --graph -20" -ForegroundColor Gray
            Write-Host ""
            Write-Host "   b) Checkout do commit:" -ForegroundColor Gray
            Write-Host "      git checkout <commit-hash>" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "   c) Deploy da versão anterior:" -ForegroundColor Gray
        Write-Host "      npm install" -ForegroundColor Gray
        Write-Host "      npm run build" -ForegroundColor Gray
        Write-Host "      cdk deploy --all --context env=$Environment --require-approval never" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   d) Validar rollback:" -ForegroundColor Gray
        Write-Host "      .\scripts\smoke-tests-api-dev.ps1 -Environment $Environment" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Para hotfix (não crítico):" -ForegroundColor White
        Write-Host "   - Corrigir problema no código" -ForegroundColor Gray
        Write-Host "   - Testar localmente" -ForegroundColor Gray
        Write-Host "   - Fazer novo deploy com correção" -ForegroundColor Gray
    }
    
    "4" {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "CENÁRIO 4: PROBLEMA COM MIGRATIONS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "⚠️  ATENÇÃO: Rollback de migrations é DELICADO!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Passos recomendados:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Verificar estado atual das migrations:" -ForegroundColor White
        Write-Host "   .\scripts\validate-migrations-aurora.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Identificar migration problemática:" -ForegroundColor White
        Write-Host "   psql -c `"SELECT * FROM public.migrations ORDER BY applied_at DESC LIMIT 5;`"" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Avaliar impacto:" -ForegroundColor White
        Write-Host "   - Migration adicionou tabelas/colunas: Pode ser revertida" -ForegroundColor Gray
        Write-Host "   - Migration modificou dados: CUIDADO! Pode causar perda de dados" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. Criar migration de rollback (se seguro):" -ForegroundColor White
        Write-Host "   - Criar arquivo: database/migrations/0XX_rollback_YYY.sql" -ForegroundColor Gray
        Write-Host "   - Incluir comandos DROP/ALTER para reverter mudanças" -ForegroundColor Gray
        Write-Host "   - Testar em ambiente de dev primeiro!" -ForegroundColor Gray
        Write-Host ""
        Write-Host "5. Aplicar rollback:" -ForegroundColor White
        Write-Host "   psql -f database/migrations/0XX_rollback_YYY.sql" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️  RECOMENDAÇÃO: Consulte DBA antes de reverter migrations em produção!" -ForegroundColor Yellow
    }
    
    "5" {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "CENÁRIO 5: OUTRO PROBLEMA" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Recursos de troubleshooting:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Documentação:" -ForegroundColor White
        Write-Host "   - docs/ROLLBACK-OPERACIONAL-AWS.md" -ForegroundColor Gray
        Write-Host "   - docs/VALIDACAO-E-SUPORTE-AWS.md" -ForegroundColor Gray
        Write-Host "   - database/COMANDOS-RAPIDOS-AURORA.md" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Scripts de diagnóstico:" -ForegroundColor White
        Write-Host "   - .\scripts\validate-system-complete.ps1" -ForegroundColor Gray
        Write-Host "   - .\scripts\validate-migrations-aurora.ps1" -ForegroundColor Gray
        Write-Host "   - .\scripts\smoke-tests-api-dev.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Logs AWS:" -ForegroundColor White
        Write-Host "   - CloudWatch Logs: /aws/lambda/<function-name>" -ForegroundColor Gray
        Write-Host "   - CloudFormation Events" -ForegroundColor Gray
        Write-Host "   - X-Ray Traces (se habilitado)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. Contato:" -ForegroundColor White
        Write-Host "   - Consulte equipe de infraestrutura" -ForegroundColor Gray
        Write-Host "   - Abra issue no repositório" -ForegroundColor Gray
    }
    
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CHECKLIST DE SEGURANÇA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Antes de executar qualquer rollback, verifique:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[ ] Backup do banco de dados foi feito?" -ForegroundColor White
Write-Host "[ ] Ambiente correto ($Environment)?" -ForegroundColor White
Write-Host "[ ] Stakeholders foram notificados?" -ForegroundColor White
Write-Host "[ ] Janela de manutenção foi agendada (se prod)?" -ForegroundColor White
Write-Host "[ ] Plano de rollback foi revisado?" -ForegroundColor White
Write-Host "[ ] Testes de validação estão prontos?" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMANDOS ÚTEIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verificar estado dos stacks:" -ForegroundColor Yellow
Write-Host "  aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --region us-east-1" -ForegroundColor Gray
Write-Host ""

Write-Host "Ver diff antes de deploy:" -ForegroundColor Yellow
Write-Host "  cdk diff <stack-name> --context env=$Environment" -ForegroundColor Gray
Write-Host ""

Write-Host "Deploy com aprovação manual:" -ForegroundColor Yellow
Write-Host "  cdk deploy <stack-name> --context env=$Environment" -ForegroundColor Gray
Write-Host ""

Write-Host "Deploy sem aprovação (use com cuidado!):" -ForegroundColor Yellow
Write-Host "  cdk deploy <stack-name> --context env=$Environment --require-approval never" -ForegroundColor Gray
Write-Host ""

Write-Host "Validar após rollback:" -ForegroundColor Yellow
Write-Host "  .\scripts\smoke-tests-api-dev.ps1 -Environment $Environment" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Para mais informações, consulte:" -ForegroundColor Cyan
Write-Host "   - docs/ROLLBACK-OPERACIONAL-AWS.md" -ForegroundColor White
Write-Host "   - docs/VALIDACAO-E-SUPORTE-AWS.md" -ForegroundColor White
Write-Host ""

exit 0
