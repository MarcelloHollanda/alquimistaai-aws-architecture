# Script de Verificação dos Guardrails de Segurança
# Verifica se CloudTrail, GuardDuty e SNS estão configurados corretamente

param(
    [string]$Environment = "dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificação de Guardrails de Segurança" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allChecks = @()

# ========================================
# 1. Verificar CloudTrail
# ========================================
Write-Host "1. Verificando CloudTrail..." -ForegroundColor Yellow

try {
    $trailName = "alquimista-audit-trail-$Environment"
    $trailStatus = aws cloudtrail get-trail-status --name $trailName 2>&1 | ConvertFrom-Json
    
    if ($trailStatus.IsLogging) {
        Write-Host "   ✅ CloudTrail está ativo e logando" -ForegroundColor Green
        Write-Host "      Trail: $trailName" -ForegroundColor Gray
        $allChecks += @{ Name = "CloudTrail"; Status = "OK" }
    } else {
        Write-Host "   ❌ CloudTrail NÃO está logando" -ForegroundColor Red
        $allChecks += @{ Name = "CloudTrail"; Status = "FAIL" }
    }
} catch {
    Write-Host "   ❌ Erro ao verificar CloudTrail: $_" -ForegroundColor Red
    $allChecks += @{ Name = "CloudTrail"; Status = "ERROR" }
}

Write-Host ""

# ========================================
# 2. Verificar GuardDuty
# ========================================
Write-Host "2. Verificando GuardDuty..." -ForegroundColor Yellow

try {
    $detectors = aws guardduty list-detectors 2>&1 | ConvertFrom-Json
    
    if ($detectors.DetectorIds.Count -gt 0) {
        $detectorId = $detectors.DetectorIds[0]
        $detector = aws guardduty get-detector --detector-id $detectorId 2>&1 | ConvertFrom-Json
        
        if ($detector.Status -eq "ENABLED") {
            Write-Host "   ✅ GuardDuty está habilitado" -ForegroundColor Green
            Write-Host "      Detector ID: $detectorId" -ForegroundColor Gray
            Write-Host "      Frequência: $($detector.FindingPublishingFrequency)" -ForegroundColor Gray
            $allChecks += @{ Name = "GuardDuty"; Status = "OK" }
        } else {
            Write-Host "   ❌ GuardDuty está desabilitado" -ForegroundColor Red
            $allChecks += @{ Name = "GuardDuty"; Status = "FAIL" }
        }
    } else {
        Write-Host "   ❌ Nenhum detector GuardDuty encontrado" -ForegroundColor Red
        $allChecks += @{ Name = "GuardDuty"; Status = "FAIL" }
    }
} catch {
    Write-Host "   ❌ Erro ao verificar GuardDuty: $_" -ForegroundColor Red
    $allChecks += @{ Name = "GuardDuty"; Status = "ERROR" }
}

Write-Host ""

# ========================================
# 3. Verificar SNS Topic
# ========================================
Write-Host "3. Verificando SNS Topic..." -ForegroundColor Yellow

try {
    $stackName = "SecurityStack-$Environment"
    $topicArn = aws cloudformation describe-stacks `
        --stack-name $stackName `
        --query "Stacks[0].Outputs[?OutputKey=='SecurityAlertTopicArn'].OutputValue" `
        --output text 2>&1
    
    if ($topicArn -and $topicArn -ne "") {
        Write-Host "   ✅ SNS Topic encontrado" -ForegroundColor Green
        Write-Host "      ARN: $topicArn" -ForegroundColor Gray
        
        # Verificar assinaturas
        $subscriptions = aws sns list-subscriptions-by-topic --topic-arn $topicArn 2>&1 | ConvertFrom-Json
        $confirmedSubs = ($subscriptions.Subscriptions | Where-Object { $_.SubscriptionArn -ne "PendingConfirmation" }).Count
        $pendingSubs = ($subscriptions.Subscriptions | Where-Object { $_.SubscriptionArn -eq "PendingConfirmation" }).Count
        
        Write-Host "      Assinaturas confirmadas: $confirmedSubs" -ForegroundColor Gray
        if ($pendingSubs -gt 0) {
            Write-Host "      ⚠️  Assinaturas pendentes: $pendingSubs" -ForegroundColor Yellow
        }
        
        $allChecks += @{ Name = "SNS Topic"; Status = "OK" }
    } else {
        Write-Host "   ❌ SNS Topic não encontrado" -ForegroundColor Red
        $allChecks += @{ Name = "SNS Topic"; Status = "FAIL" }
    }
} catch {
    Write-Host "   ❌ Erro ao verificar SNS Topic: $_" -ForegroundColor Red
    $allChecks += @{ Name = "SNS Topic"; Status = "ERROR" }
}

Write-Host ""

# ========================================
# 4. Verificar EventBridge Rule
# ========================================
Write-Host "4. Verificando EventBridge Rule..." -ForegroundColor Yellow

try {
    $ruleName = "alquimista-guardduty-high-severity-$Environment"
    $rule = aws events describe-rule --name $ruleName 2>&1 | ConvertFrom-Json
    
    if ($rule.State -eq "ENABLED") {
        Write-Host "   ✅ EventBridge Rule está ativa" -ForegroundColor Green
        Write-Host "      Rule: $ruleName" -ForegroundColor Gray
        $allChecks += @{ Name = "EventBridge Rule"; Status = "OK" }
    } else {
        Write-Host "   ❌ EventBridge Rule está desabilitada" -ForegroundColor Red
        $allChecks += @{ Name = "EventBridge Rule"; Status = "FAIL" }
    }
} catch {
    Write-Host "   ❌ Erro ao verificar EventBridge Rule: $_" -ForegroundColor Red
    $allChecks += @{ Name = "EventBridge Rule"; Status = "ERROR" }
}

Write-Host ""

# ========================================
# 5. Verificar S3 Bucket do CloudTrail
# ========================================
Write-Host "5. Verificando S3 Bucket do CloudTrail..." -ForegroundColor Yellow

try {
    $accountId = aws sts get-caller-identity --query Account --output text 2>&1
    $bucketName = "alquimista-cloudtrail-logs-$accountId-$Environment"
    
    $bucketExists = aws s3 ls "s3://$bucketName" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Bucket S3 existe e está acessível" -ForegroundColor Green
        Write-Host "      Bucket: $bucketName" -ForegroundColor Gray
        
        # Verificar criptografia
        $encryption = aws s3api get-bucket-encryption --bucket $bucketName 2>&1 | ConvertFrom-Json
        if ($encryption) {
            Write-Host "      ✅ Criptografia habilitada" -ForegroundColor Green
        }
        
        $allChecks += @{ Name = "S3 Bucket"; Status = "OK" }
    } else {
        Write-Host "   ❌ Bucket S3 não encontrado ou inacessível" -ForegroundColor Red
        $allChecks += @{ Name = "S3 Bucket"; Status = "FAIL" }
    }
} catch {
    Write-Host "   ❌ Erro ao verificar S3 Bucket: $_" -ForegroundColor Red
    $allChecks += @{ Name = "S3 Bucket"; Status = "ERROR" }
}

Write-Host ""

# ========================================
# Resumo Final
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo da Verificação" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$okCount = ($allChecks | Where-Object { $_.Status -eq "OK" }).Count
$failCount = ($allChecks | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($allChecks | Where-Object { $_.Status -eq "ERROR" }).Count
$totalCount = $allChecks.Count

foreach ($check in $allChecks) {
    $icon = switch ($check.Status) {
        "OK" { "✅" }
        "FAIL" { "❌" }
        "ERROR" { "⚠️ " }
    }
    $color = switch ($check.Status) {
        "OK" { "Green" }
        "FAIL" { "Red" }
        "ERROR" { "Yellow" }
    }
    Write-Host "$icon $($check.Name): $($check.Status)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Total: $okCount/$totalCount verificações OK" -ForegroundColor $(if ($okCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($failCount -gt 0 -or $errorCount -gt 0) {
    Write-Host "`n⚠️  Alguns guardrails não estão configurados corretamente." -ForegroundColor Yellow
    Write-Host "   Execute: cdk deploy SecurityStack-$Environment" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n✅ Todos os guardrails de segurança estão configurados corretamente!" -ForegroundColor Green
    exit 0
}
