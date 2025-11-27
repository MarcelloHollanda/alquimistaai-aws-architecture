# Script para validar variáveis do Terraform antes do apply
# Verifica se os recursos necessários existem na AWS

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação de Variáveis - Terraform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$env = "dev"  # Alterar para "prod" quando necessário

$allValid = $true

# ============================================
# 1. Verificar SNS Topic de Alertas
# ============================================
Write-Host "1. Verificando SNS Topic de alertas..." -ForegroundColor Yellow

$expectedTopicName = "alquimista-alerts-$env"

try {
    $topics = aws sns list-topics --region $region --output json | ConvertFrom-Json
    $alertsTopic = $topics.Topics | Where-Object { $_.TopicArn -like "*$expectedTopicName*" }
    
    if ($alertsTopic) {
        Write-Host "  ✓ SNS Topic encontrado: $($alertsTopic.TopicArn)" -ForegroundColor Green
        $snsTopicArn = $alertsTopic.TopicArn
    } else {
        Write-Host "  ✗ SNS Topic '$expectedTopicName' não encontrado!" -ForegroundColor Red
        Write-Host "    Procure por tópicos existentes com: aws sns list-topics --region $region" -ForegroundColor Yellow
        $allValid = $false
        $snsTopicArn = "ARN_NAO_ENCONTRADO"
    }
} catch {
    Write-Host "  ✗ Erro ao verificar SNS Topics: $_" -ForegroundColor Red
    $allValid = $false
    $snsTopicArn = "ERRO_AO_VERIFICAR"
}

Write-Host ""

# ============================================
# 2. Verificar Bucket de Artefatos Lambda
# ============================================
Write-Host "2. Verificando bucket de artefatos Lambda..." -ForegroundColor Yellow

$expectedBucketName = "alquimista-lambda-artifacts-$env"

try {
    $buckets = aws s3 ls --region $region 2>&1
    
    if ($buckets -match $expectedBucketName) {
        Write-Host "  ✓ Bucket encontrado: $expectedBucketName" -ForegroundColor Green
        $lambdaBucket = $expectedBucketName
    } else {
        Write-Host "  ✗ Bucket '$expectedBucketName' não encontrado!" -ForegroundColor Red
        Write-Host "    Liste buckets existentes com: aws s3 ls" -ForegroundColor Yellow
        Write-Host "    Ou crie o bucket com: aws s3 mb s3://$expectedBucketName --region $region" -ForegroundColor Yellow
        $allValid = $false
        $lambdaBucket = "BUCKET_NAO_ENCONTRADO"
    }
} catch {
    Write-Host "  ✗ Erro ao verificar buckets S3: $_" -ForegroundColor Red
    $allValid = $false
    $lambdaBucket = "ERRO_AO_VERIFICAR"
}

Write-Host ""

# ============================================
# 3. Verificar VPC e Subnets
# ============================================
Write-Host "3. Verificando VPC e Subnets..." -ForegroundColor Yellow

try {
    $vpcs = aws ec2 describe-vpcs --region $region --filters "Name=tag:Project,Values=Alquimista" --output json | ConvertFrom-Json
    
    if ($vpcs.Vpcs.Count -gt 0) {
        $vpcId = $vpcs.Vpcs[0].VpcId
        Write-Host "  ✓ VPC encontrada: $vpcId" -ForegroundColor Green
        
        # Verificar subnets privadas
        $subnets = aws ec2 describe-subnets --region $region --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Type,Values=Private" --output json | ConvertFrom-Json
        
        if ($subnets.Subnets.Count -ge 2) {
            Write-Host "  ✓ Subnets privadas encontradas: $($subnets.Subnets.Count)" -ForegroundColor Green
            $subnetIds = $subnets.Subnets | ForEach-Object { $_.SubnetId }
        } else {
            Write-Host "  ⚠ Apenas $($subnets.Subnets.Count) subnet(s) privada(s) encontrada(s)" -ForegroundColor Yellow
            Write-Host "    Recomendado: pelo menos 2 subnets para alta disponibilidade" -ForegroundColor Yellow
            $subnetIds = @()
        }
    } else {
        Write-Host "  ✗ VPC do projeto Alquimista não encontrada!" -ForegroundColor Red
        $allValid = $false
        $vpcId = "VPC_NAO_ENCONTRADA"
        $subnetIds = @()
    }
} catch {
    Write-Host "  ✗ Erro ao verificar VPC/Subnets: $_" -ForegroundColor Red
    $allValid = $false
    $vpcId = "ERRO_AO_VERIFICAR"
    $subnetIds = @()
}

Write-Host ""

# ============================================
# 4. Verificar Aurora Cluster
# ============================================
Write-Host "4. Verificando Aurora Cluster..." -ForegroundColor Yellow

try {
    $clusters = aws rds describe-db-clusters --region $region --output json | ConvertFrom-Json
    $alquimistaCluster = $clusters.DBClusters | Where-Object { $_.DBClusterIdentifier -like "*alquimista*$env*" }
    
    if ($alquimistaCluster) {
        Write-Host "  ✓ Aurora Cluster encontrado: $($alquimistaCluster.DBClusterIdentifier)" -ForegroundColor Green
        $dbClusterIdentifier = $alquimistaCluster.DBClusterIdentifier
        $dbEndpoint = $alquimistaCluster.Endpoint
    } else {
        Write-Host "  ✗ Aurora Cluster do Alquimista não encontrado!" -ForegroundColor Red
        $allValid = $false
        $dbClusterIdentifier = "CLUSTER_NAO_ENCONTRADO"
        $dbEndpoint = "ENDPOINT_NAO_ENCONTRADO"
    }
} catch {
    Write-Host "  ✗ Erro ao verificar Aurora Cluster: $_" -ForegroundColor Red
    $allValid = $false
    $dbClusterIdentifier = "ERRO_AO_VERIFICAR"
    $dbEndpoint = "ERRO_AO_VERIFICAR"
}

Write-Host ""

# ============================================
# 5. Verificar EventBridge Bus
# ============================================
Write-Host "5. Verificando EventBridge Bus..." -ForegroundColor Yellow

$expectedBusName = "fibonacci-bus-$env"

try {
    $buses = aws events list-event-buses --region $region --output json | ConvertFrom-Json
    $fibonacciBus = $buses.EventBuses | Where-Object { $_.Name -eq $expectedBusName }
    
    if ($fibonacciBus) {
        Write-Host "  ✓ EventBridge Bus encontrado: $($fibonacciBus.Name)" -ForegroundColor Green
        $eventBusName = $fibonacciBus.Name
        $eventBusArn = $fibonacciBus.Arn
    } else {
        Write-Host "  ✗ EventBridge Bus '$expectedBusName' não encontrado!" -ForegroundColor Red
        Write-Host "    Crie o bus com: aws events create-event-bus --name $expectedBusName --region $region" -ForegroundColor Yellow
        $allValid = $false
        $eventBusName = "BUS_NAO_ENCONTRADO"
        $eventBusArn = "ARN_NAO_ENCONTRADO"
    }
} catch {
    Write-Host "  ✗ Erro ao verificar EventBridge Bus: $_" -ForegroundColor Red
    $allValid = $false
    $eventBusName = "ERRO_AO_VERIFICAR"
    $eventBusArn = "ERRO_AO_VERIFICAR"
}

Write-Host ""

# ============================================
# 6. Verificar Secrets Manager
# ============================================
Write-Host "6. Verificando Secrets no Secrets Manager..." -ForegroundColor Yellow

$secretsToCheck = @(
    "/repo/terraform/micro-agente-disparo-agendamento/whatsapp",
    "/repo/terraform/micro-agente-disparo-agendamento/email",
    "/repo/terraform/micro-agente-disparo-agendamento/calendar"
)

$secretsFound = 0

foreach ($secretName in $secretsToCheck) {
    try {
        aws secretsmanager describe-secret --secret-id $secretName --region $region --output json | Out-Null
        Write-Host "  ✓ Secret encontrado: $secretName" -ForegroundColor Green
        $secretsFound++
    } catch {
        Write-Host "  ✗ Secret não encontrado: $secretName" -ForegroundColor Red
        Write-Host "    Execute o script create-secrets.ps1 para criar" -ForegroundColor Yellow
        $allValid = $false
    }
}

Write-Host ""

# ============================================
# Resumo Final
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo da Validação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allValid) {
    Write-Host "✓ Todas as validações passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Variáveis para usar no Terraform:" -ForegroundColor White
    Write-Host ""
    Write-Host "  alerts_sns_topic_arn    = `"$snsTopicArn`"" -ForegroundColor Gray
    Write-Host "  lambda_artifact_bucket  = `"$lambdaBucket`"" -ForegroundColor Gray
    Write-Host "  vpc_id                  = `"$vpcId`"" -ForegroundColor Gray
    Write-Host "  subnet_ids              = [" -ForegroundColor Gray
    foreach ($subnetId in $subnetIds) {
        Write-Host "    `"$subnetId`"," -ForegroundColor Gray
    }
    Write-Host "  ]" -ForegroundColor Gray
    Write-Host "  db_cluster_identifier   = `"$dbClusterIdentifier`"" -ForegroundColor Gray
    Write-Host "  event_bus_name          = `"$eventBusName`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Você pode prosseguir com 'terraform apply'!" -ForegroundColor Green
} else {
    Write-Host "✗ Algumas validações falharam!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os problemas acima antes de executar 'terraform apply'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
