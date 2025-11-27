# 🛠️ Scripts do Kiro

Scripts utilitários para automação e integração com serviços externos.

## Scripts Disponíveis

### `get-github-file.ps1`

Busca arquivos do GitHub usando o Personal Access Token armazenado localmente.

**Uso básico:**

```powershell
# Exibir conteúdo no console
.\get-github-file.ps1 -Owner "MarcelloHollanda" -Repo "alquimistaai-aws-architecture" -Path "README.md"

# Salvar em arquivo local
.\get-github-file.ps1 -Owner "MarcelloHollanda" -Repo "alquimistaai-aws-architecture" -Path "docs/DEPLOY.md" -OutputPath ".\local-copy.md"

# Especificar branch diferente
.\get-github-file.ps1 -Owner "MarcelloHollanda" -Repo "alquimistaai-aws-architecture" -Path "package.json" -Branch "develop"
```

**Parâmetros:**

- `-Owner` (obrigatório): Dono do repositório (usuário ou organização)
- `-Repo` (obrigatório): Nome do repositório
- `-Path` (obrigatório): Caminho do arquivo no repositório
- `-Branch` (opcional): Branch a buscar (padrão: "main")
- `-OutputPath` (opcional): Caminho local para salvar o arquivo

**Requisitos:**

- Token do GitHub configurado em `.kiro/secrets/github-pat-alquimistaai.txt`
- PowerShell 5.1 ou superior

**Exemplos práticos:**

```powershell
# Buscar configuração do frontend
.\get-github-file.ps1 -Owner "MarcelloHollanda" -Repo "alquimistaai-aws-architecture" -Path "frontend/package.json" -OutputPath ".\temp\frontend-package.json"

# Buscar documentação
.\get-github-file.ps1 -Owner "MarcelloHollanda" -Repo "alquimistaai-aws-architecture" -Path "docs/ARCHITECTURE.md"

# Buscar de branch específica
.\get-github-file.ps1 -Owner "MarcelloHollanda" -Repo "alquimistaai-aws-architecture" -Path ".env.example" -Branch "feature/new-config"
```

## Segurança

- ✅ Todos os scripts leem tokens de `.kiro/secrets/`
- ✅ Nunca exponha tokens em logs ou output
- ✅ Use sempre HTTPS para comunicação com APIs
- ✅ Valide inputs antes de fazer requisições

## Contribuindo

Ao adicionar novos scripts:

1. Documente o uso neste README
2. Adicione tratamento de erros adequado
3. Use funções de output colorido (Write-Success, Write-Info, etc.)
4. Valide todos os parâmetros obrigatórios
5. Adicione exemplos de uso
