#!/bin/bash

# Script para configurar o repositório GitHub
# Execute este script para conectar o projeto ao GitHub

echo "🚀 Configurando repositório GitHub AlquimistaAI..."

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado. Instale o Git primeiro: https://git-scm.com/"
    exit 1
fi
echo "✅ Git encontrado"

# Verificar se GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "⚠️ GitHub CLI não encontrado. Instale para facilitar a configuração: https://cli.github.com/"
else
    echo "✅ GitHub CLI encontrado"
fi

echo ""
echo "📋 Informações do repositório:"
echo "   Usuário: MarcelloHollanda"
echo "   Repositório: AlquimistaAI"
echo "   URL: https://github.com/MarcelloHollanda/AlquimistaAI"

echo ""
echo "🔧 Passo 1: Inicializando Git..."
git init

echo ""
echo "📝 Passo 2: Configurando usuário Git..."
GIT_USER=$(git config --global user.name)
GIT_EMAIL=$(git config --global user.email)

if [ -z "$GIT_USER" ]; then
    read -p "Digite seu nome para o Git: " USER_NAME
    git config --global user.name "$USER_NAME"
fi

if [ -z "$GIT_EMAIL" ]; then
    read -p "Digite seu email para o Git: " USER_EMAIL
    git config --global user.email "$USER_EMAIL"
fi

echo "✅ Usuário Git configurado: $(git config --global user.name) <$(git config --global user.email)>"

echo ""
echo "📦 Passo 3: Adicionando arquivos..."
git add .

echo ""
echo "💾 Passo 4: Fazendo commit inicial..."
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

echo ""
echo "🔗 Passo 5: Conectando ao repositório remoto..."
git remote add origin https://github.com/MarcelloHollanda/AlquimistaAI.git
git branch -M main

echo ""
echo "🌐 Agora você precisa:"
echo "1. Criar o repositório no GitHub:"
echo "   - Vá para: https://github.com/new"
echo "   - Nome: AlquimistaAI"
echo "   - Visibilidade: Privado (recomendado)"
echo "   - NÃO adicione README, .gitignore ou LICENSE"

echo ""
echo "2. Depois de criar o repositório, execute:"
echo "   git push -u origin main"

echo ""
echo "3. Configurar GitHub Secrets:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - SLACK_WEBHOOK_URL"

echo ""
echo "📚 Documentação completa em:"
echo "   - README.md (visão geral)"
echo "   - SETUP.md (guia de instalação)"
echo "   - Docs/Deploy/ (documentação de deploy)"

echo ""
echo "✨ Repositório configurado com sucesso!"
echo "🚀 Pronto para transformar leads em oportunidades!"