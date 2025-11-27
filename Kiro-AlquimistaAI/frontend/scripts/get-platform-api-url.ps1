# Script para obter a URL da API da Plataforma AlquimistaAI
# Data: 23 de novembro de 2025

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Obter URL da API da Plataforma" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$stackName = "AlquimistaStack-$Environment"

Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
Write-Host "Stack: $stackName" -ForegroundColor Yellow
Write-Host ""

# Verificar se a stack existe
Write-Host "Verificando se a stack esta deployada..." -ForegroundColor Cyan

try {
    $stackInfo = aws cloudformation describe-stacks `
        --stack-name $stackName `
        --region us-east-1 `
        --query "Stacks[0]" `
        --output json 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Stack nao encontrada!" -ForegroundColor Red
        Write-Host ""
        Write-Host "A stack '$stackName' nao esta deployada." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para deployar a stack, execute:" -ForegroundColor Cyan
        Write-Host "  cdk deploy $stackName --context env=$Environment" -ForegroundColor White
        Write-Host ""
        exit 1
    }

    $stack = $stackInfo | ConvertFrom-Json

    Write-Host "Stack encontrada!" -ForegroundColor Green
    Write-Host ""

    # Procurar pelo output da API
    $apiOutput = $stack.Outputs | Where-Object { $_.OutputKey -like "*ApiUrl*" -or $_.OutputKey -like "*PlatformApi*" }

    if ($apiOutput) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  URL DA API DA PLATAFORMA" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host $apiOutput.OutputValue -ForegroundColor White
        Write-Host ""

        # Testar a API
        Write-Host "Testando a API..." -ForegroundColor Cyan
        Write-Host ""

        try {
            $apiUrl = $apiOutput.OutputValue
            $response = Invoke-WebRequest -Uri "$apiUrl/api/agents" -Method GET -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Host "API respondendo corretamente!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Resposta (primeiros 200 caracteres):" -ForegroundColor Cyan
                $content = $response.Content
                $preview = $content.Substring(0, [Math]::Min(200, $content.Length))
                Write-Host $preview -ForegroundColor White
                Write-Host ""
            }
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "Erro ao testar a API: $errorMsg" -ForegroundColor Yellow
            Write-Host ""
        }

        # Instruções para atualizar o .env
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  PROXIMOS PASSOS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Atualizar o arquivo .env.$Environment com:" -ForegroundColor Yellow
        Write-Host ""
        $apiUrlValue = $apiOutput.OutputValue
        Write-Host "   NEXT_PUBLIC_API_URL=$apiUrlValue" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Remover fallbacks para localhost:3001 em:" -ForegroundColor Yellow
        Write-Host "   - frontend/src/lib/nigredo-api.ts" -ForegroundColor White
        Write-Host "   - frontend/src/lib/fibonacci-api.ts" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Testar o frontend:" -ForegroundColor Yellow
        Write-Host "   cd frontend" -ForegroundColor White
        Write-Host "   npm run dev" -ForegroundColor White
        Write-Host ""

    } else {
        Write-Host "Output da API nao encontrado nos outputs da stack" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Outputs disponiveis:" -ForegroundColor Cyan
        $stack.Outputs | ForEach-Object {
            $key = $_.OutputKey
            $value = $_.OutputValue
            Write-Host "  - $key : $value" -ForegroundColor White
        }
        Write-Host ""
    }

} catch {
    Write-Host ""
    $errorMsg = $_.Exception.Message
    Write-Host "Erro ao consultar a stack: $errorMsg" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
