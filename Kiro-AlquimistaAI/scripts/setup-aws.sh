#!/bin/bash

# Script de setup inicial para AWS
# Este script configura o ambiente e faz o bootstrap da conta AWS

set -e

echo "🚀 Fibonacci AWS Setup"
echo "====================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI não encontrado${NC}"
    echo "Instale o AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS CLI encontrado"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    echo "Instale o Node.js 18+: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node --version) encontrado"

# Verificar credenciais AWS
echo ""
echo "Verificando credenciais AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Credenciais AWS inválidas ou não configuradas${NC}"
    echo "Execute: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)

echo -e "${GREEN}✓${NC} Credenciais válidas"
echo "  Account ID: $ACCOUNT_ID"
echo "  User: $USER_ARN"

# Verificar se é a conta correta
if [ "$ACCOUNT_ID" != "207933152643" ]; then
    echo -e "${YELLOW}⚠️  Aviso: Account ID diferente do esperado${NC}"
    echo "  Esperado: 207933152643"
    echo "  Atual: $ACCOUNT_ID"
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Instalar dependências
echo ""
echo "Instalando dependências do projeto..."
npm install

echo -e "${GREEN}✓${NC} Dependências instaladas"

# Bootstrap CDK
echo ""
echo "Fazendo bootstrap da conta AWS para CDK..."
echo "Isso pode levar alguns minutos..."

if npm run bootstrap; then
    echo -e "${GREEN}✓${NC} Bootstrap concluído"
else
    echo -e "${RED}❌ Erro no bootstrap${NC}"
    exit 1
fi

# Verificar se secrets existem
echo ""
echo "Verificando secrets no Secrets Manager..."

check_secret() {
    local secret_name=$1
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region us-east-1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $secret_name existe"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $secret_name não encontrado"
        return 1
    fi
}

SECRETS_MISSING=0

if ! check_secret "fibonacci/mcp/whatsapp"; then
    SECRETS_MISSING=1
fi

if ! check_secret "fibonacci/mcp/enrichment"; then
    SECRETS_MISSING=1
fi

if ! check_secret "fibonacci/mcp/calendar"; then
    SECRETS_MISSING=1
fi

if [ $SECRETS_MISSING -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Alguns secrets não foram encontrados${NC}"
    echo "Você pode criá-los agora ou depois. Veja SETUP.md para instruções."
    echo ""
    read -p "Deseja criar secrets vazios agora? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Criando secrets vazios..."
        
        aws secretsmanager create-secret \
            --name fibonacci/mcp/whatsapp \
            --secret-string '{"apiKey":""}' \
            --region us-east-1 2>/dev/null || echo "Secret whatsapp já existe"
        
        aws secretsmanager create-secret \
            --name fibonacci/mcp/enrichment \
            --secret-string '{"googlePlacesApiKey":"","linkedInClientId":"","linkedInClientSecret":"","linkedInAccessToken":""}' \
            --region us-east-1 2>/dev/null || echo "Secret enrichment já existe"
        
        aws secretsmanager create-secret \
            --name fibonacci/mcp/calendar \
            --secret-string '{"clientId":"","clientSecret":"","refreshToken":""}' \
            --region us-east-1 2>/dev/null || echo "Secret calendar já existe"
        
        echo -e "${GREEN}✓${NC} Secrets criados (vazios)"
        echo "Atualize-os depois com suas API keys reais"
    fi
fi

# Synth para verificar configuração
echo ""
echo "Verificando configuração do CDK..."
if npm run synth > /dev/null; then
    echo -e "${GREEN}✓${NC} Configuração válida"
else
    echo -e "${RED}❌ Erro na configuração${NC}"
    exit 1
fi

# Resumo
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo ""
echo "1. Configure as API keys nos secrets (veja SETUP.md)"
echo "2. Execute o deploy:"
echo "   npm run deploy:dev"
echo ""
echo "3. Após o deploy, execute as migrações:"
echo "   npm run db:migrate"
echo "   npm run db:seed"
echo ""
echo "Para mais informações, consulte SETUP.md"
echo ""
