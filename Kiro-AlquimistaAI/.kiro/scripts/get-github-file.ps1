param(
    [Parameter(Mandatory = $false)]
    [string]$Owner = "MarcelloHollanda",
    
    [Parameter(Mandatory = $false)]
    [string]$Repo = "alquimistaai-aws-arquitetura",
    
    [Parameter(Mandatory = $true)]
    [string]$Path,
    
    [string]$Ref = "main"  # branch (main, dev, etc.)
)

# 1. Descobrir caminho da pasta .kiro/secrets relativo a este script
$scriptDir = Split-Path -Parent $PSCommandPath
$secretsDir = Join-Path $scriptDir "..\secrets"
$tokenFile = Join-Path $secretsDir "github-pat-alquimistaai.txt"

# 2. Ler token do arquivo de segredos, se existir
$token = $null
if (Test-Path $tokenFile) {
    $token = Get-Content $tokenFile -Raw
    $token = $token.Trim()
}

# 3. Fallback: usar variável de ambiente ou pedir interativo (backup)
if (-not $token) {
    if ($env:GITHUB_TOKEN) {
        $token = $env:GITHUB_TOKEN
    } else {
        $secureToken = Read-Host "Informe seu GitHub PAT (não será exibido)" -AsSecureString
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
        $token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    }
}

if (-not $token) {
    Write-Error "Token não fornecido. Verifique .kiro\secrets\github-pat-alquimistaai.txt ou GITHUB_TOKEN."
    exit 1
}

# 4. Montar URL da API do GitHub
Add-Type -AssemblyName System.Web
$encodedPath = [System.Web.HttpUtility]::UrlEncode($Path)
$url = "https://api.github.com/repos/$Owner/$Repo/contents/$encodedPath?ref=$Ref"

# 5. Chamar GitHub API
$headers = @{
    Authorization = "Bearer $token"
    "User-Agent"  = "AlquimistaAI-DevOps"
    Accept        = "application/vnd.github.v3+json"
}

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
} catch {
    Write-Error "Erro ao chamar GitHub API: $_"
    exit 1
}

if (-not $response.content) {
    Write-Error "Resposta não contém campo 'content'. Verifique path/branch."
    exit 1
}

# 6. Decodificar Base64
$contentBytes = [System.Convert]::FromBase64String($response.content)
$content = [System.Text.Encoding]::UTF8.GetString($contentBytes)

# 7. Exibir conteúdo em texto puro
Write-Output $content
