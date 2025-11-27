# Protocolo Oficial GPT–GitHub–Kiro

## Visão Geral

Este documento descreve o fluxo operacional para obter contexto real de código do repositório GitHub durante conversas com o assistente GPT (ChatGPT), permitindo análises precisas e geração de blueprints baseados no estado atual do código.

## Problema Resolvido

O assistente GPT não tem acesso direto ao repositório GitHub ou ao sistema de arquivos local. Para tomar decisões técnicas precisas, ele precisa visualizar o conteúdo real de arquivos como:

- Configurações Terraform (`terraform/envs/dev/main.tf`)
- Workflows CI/CD (`.github/workflows/ci-cd-dev.yml`)
- Documentação técnica (`docs/*.md`)
- Código-fonte (`lambda/**/*.ts`, `frontend/**/*.tsx`)
- Configurações de infraestrutura (`lib/**/*.ts`)

## Fluxo Operacional

### 1. GPT Solicita Arquivo

Quando o assistente GPT precisar de contexto real de código, ele irá:

**Indicar explicitamente o(s) arquivo(s) necessário(s):**

```
📄 Arquivos necessários para análise:
- terraform/envs/dev/main.tf
- .github/workflows/ci-cd-dev.yml
- lib/security-stack.ts
```

**Fornecer comando(s) pronto(s) para execução:**

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI

powershell -File ".\.kiro\scripts\get-github-file.ps1" `
  -Path "terraform/envs/dev/main.tf"

powershell -File ".\.kiro\scripts\get-github-file.ps1" `
  -Path ".github/workflows/ci-cd-dev.yml"
```

### 2. Fundador Executa Comando

O fundador roda o comando localmente em seu terminal (PowerShell ou CMD).

**Exemplo de execução:**

```powershell
PS C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI> powershell -File ".\.kiro\scripts\get-github-file.ps1" -Path "README.md"
```

### 3. Script Busca Arquivo

O script `.kiro/scripts/get-github-file.ps1` automaticamente:

1. **Lê o token** de autenticação (em ordem de prioridade):
   - Arquivo local: `.kiro/secrets/github-pat-alquimistaai.txt`
   - Variável de ambiente: `$env:GITHUB_TOKEN`
   - Input interativo seguro (fallback)

2. **Autentica na API GitHub** usando o token

3. **Baixa o arquivo** do repositório `MarcelloHollanda/alquimistaai-aws-arquitetura`

4. **Decodifica o conteúdo** (Base64 → UTF-8)

5. **Imprime o conteúdo** em texto puro no terminal

### 4. Fundador Cola Conteúdo

O fundador:

1. **Copia** o conteúdo exibido no terminal
2. **Cola** na conversa com o GPT
3. **Identifica** o arquivo (ex: "Conteúdo de `terraform/envs/dev/main.tf`:")

### 5. GPT Analisa e Responde

O assistente GPT então:

1. **Analisa** o arquivo fornecido
2. **Cruza** com o contexto da conversa
3. **Toma decisões técnicas** baseadas no código real
4. **Retorna** um único blueprint/prompt em Markdown para o Kiro aplicar mudanças

**Exemplo de resposta:**

```markdown
# Blueprint: Ajuste de Configuração Terraform

## Contexto
Analisando o arquivo `terraform/envs/dev/main.tf`, identifiquei que...

## Mudanças Necessárias

### Arquivo: terraform/envs/dev/main.tf
```hcl
# Adicionar configuração de backend
terraform {
  backend "s3" {
    bucket = "alquimista-terraform-state-dev"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
  }
}
```

## Comandos para Kiro Executar
1. Aplicar mudanças no arquivo
2. Validar sintaxe: `terraform validate`
3. Executar plan: `terraform plan`
```

## Arquitetura Técnica

### Componentes

```
┌─────────────────┐
│   ChatGPT/GPT   │
│  (Assistente)   │
└────────┬────────┘
         │ 1. Solicita arquivo
         │    + fornece comando
         ▼
┌─────────────────┐
│    Fundador     │
│  (Desenvolvedor)│
└────────┬────────┘
         │ 2. Executa comando
         ▼
┌─────────────────────────────────────┐
│  .kiro/scripts/get-github-file.ps1  │
│  ┌───────────────────────────────┐  │
│  │ 1. Lê token de:               │  │
│  │    - .kiro/secrets/*.txt      │  │
│  │    - $env:GITHUB_TOKEN        │  │
│  │    - Input interativo         │  │
│  ├───────────────────────────────┤  │
│  │ 2. Autentica na API GitHub    │  │
│  ├───────────────────────────────┤  │
│  │ 3. Baixa arquivo do repo      │  │
│  ├───────────────────────────────┤  │
│  │ 4. Decodifica Base64 → UTF-8  │  │
│  ├───────────────────────────────┤  │
│  │ 5. Imprime conteúdo           │  │
│  └───────────────────────────────┘  │
└────────┬────────────────────────────┘
         │ 3. Retorna conteúdo
         ▼
┌─────────────────┐
│    Terminal     │
│  (Output texto) │
└────────┬────────┘
         │ 4. Copia conteúdo
         ▼
┌─────────────────┐
│   ChatGPT/GPT   │
│  (Recebe texto) │
└────────┬────────┘
         │ 5. Analisa e gera blueprint
         ▼
┌─────────────────┐
│      Kiro       │
│  (Aplica mudanças)│
└─────────────────┘
```

### Segurança

**Token de Autenticação:**
- Armazenado em `.kiro/secrets/github-pat-alquimistaai.txt`
- **NUNCA** commitado no Git (protegido por `.gitignore`)
- Permissões mínimas necessárias: `repo` (leitura)
- Rotação recomendada: a cada 90 dias

**Proteção no .gitignore:**
```gitignore
# Segredos do Kiro
.kiro/secrets/

# Kiro secrets (NUNCA commitar)
.kiro/secrets/*.txt
.kiro/secrets/*.key
.kiro/secrets/*.pem
.kiro/secrets/*.json
!.kiro/secrets/.gitkeep
!.kiro/secrets/README.md
```

## Casos de Uso

### Caso 1: Análise de Configuração Terraform

**Situação:** GPT precisa validar configuração de ambiente dev

**Fluxo:**
1. GPT: "Preciso ver `terraform/envs/dev/main.tf`"
2. GPT: Fornece comando PowerShell
3. Fundador: Executa comando
4. Fundador: Cola conteúdo na conversa
5. GPT: Analisa e sugere ajustes
6. GPT: Gera blueprint para Kiro

### Caso 2: Revisão de Workflow CI/CD

**Situação:** GPT precisa entender pipeline atual

**Fluxo:**
1. GPT: "Preciso ver `.github/workflows/ci-cd-dev.yml`"
2. GPT: Fornece comando PowerShell
3. Fundador: Executa comando
4. Fundador: Cola conteúdo na conversa
5. GPT: Identifica gaps de segurança
6. GPT: Gera blueprint com correções

### Caso 3: Análise de Stack CDK

**Situação:** GPT precisa revisar infraestrutura

**Fluxo:**
1. GPT: "Preciso ver `lib/security-stack.ts` e `lib/waf-stack.ts`"
2. GPT: Fornece 2 comandos PowerShell
3. Fundador: Executa ambos comandos
4. Fundador: Cola ambos conteúdos na conversa
5. GPT: Analisa integração entre stacks
6. GPT: Gera blueprint com melhorias

## Parâmetros do Script

### Obrigatórios

- **`-Path`**: Caminho do arquivo no repositório (ex: `"README.md"`, `"terraform/envs/dev/main.tf"`)

### Opcionais

- **`-Owner`**: Dono do repositório (padrão: `"MarcelloHollanda"`)
- **`-Repo`**: Nome do repositório (padrão: `"alquimistaai-aws-arquitetura"`)
- **`-Ref`**: Branch ou tag (padrão: `"main"`)

### Exemplos de Uso

```powershell
# Arquivo na raiz
.\.kiro\scripts\get-github-file.ps1 -Path "README.md"

# Arquivo em subpasta
.\.kiro\scripts\get-github-file.ps1 -Path "terraform/envs/dev/main.tf"

# Branch específica
.\.kiro\scripts\get-github-file.ps1 -Path "package.json" -Ref "develop"

# Outro repositório
.\.kiro\scripts\get-github-file.ps1 `
  -Owner "outro-usuario" `
  -Repo "outro-repo" `
  -Path "config.yml"
```

## Troubleshooting

### Erro: "Token não fornecido"

**Causa:** Arquivo `.kiro/secrets/github-pat-alquimistaai.txt` não existe ou está vazio

**Solução:**
1. Criar token em: https://github.com/settings/tokens
2. Salvar em: `.kiro/secrets/github-pat-alquimistaai.txt`
3. Verificar que não está com placeholder `ghp_SEU_TOKEN_AQUI`

### Erro: "Erro ao chamar GitHub API: 401"

**Causa:** Token inválido ou expirado

**Solução:**
1. Verificar se token está correto
2. Gerar novo token se necessário
3. Atualizar arquivo `.kiro/secrets/github-pat-alquimistaai.txt`

### Erro: "Erro ao chamar GitHub API: 404"

**Causa:** Arquivo não existe no repositório ou branch incorreta

**Solução:**
1. Verificar path do arquivo no GitHub
2. Verificar se branch está correta (padrão: `main`)
3. Usar parâmetro `-Ref` se necessário

### Erro: "Resposta não contém campo 'content'"

**Causa:** Path aponta para diretório, não arquivo

**Solução:**
1. Verificar que path aponta para arquivo específico
2. Não usar path de diretório (ex: `terraform/envs/dev/`)

## Benefícios

### Para o GPT
- ✅ Acesso ao código real do repositório
- ✅ Análises precisas baseadas no estado atual
- ✅ Decisões técnicas fundamentadas
- ✅ Blueprints contextualizados

### Para o Fundador
- ✅ Processo simples e rápido
- ✅ Comando pronto fornecido pelo GPT
- ✅ Sem necessidade de navegar no GitHub
- ✅ Token seguro e protegido

### Para o Kiro
- ✅ Blueprints mais precisos para executar
- ✅ Menos iterações de correção
- ✅ Mudanças alinhadas com código real
- ✅ Redução de erros de implementação

## Integração com Fluxo ChatGPT–Kiro

Este protocolo complementa o fluxo documentado em `.kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md`:

1. **ChatGPT** (cérebro/orquestrador) → Gera blueprints
2. **GitHub** (fonte de verdade) → Fornece código real via API
3. **Kiro** (mãos/executor) → Implementa blueprints no repositório

O protocolo GPT–GitHub–Kiro adiciona a camada de **contexto real** ao fluxo, permitindo que o ChatGPT tome decisões baseadas no estado atual do código, não em suposições.

## Referências

- **Script**: `.kiro/scripts/get-github-file.ps1`
- **Documentação do script**: `.kiro/scripts/README.md`
- **Setup de segredos**: `.kiro/secrets/README.md`
- **Fluxo ChatGPT–Kiro**: `.kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md`
- **GitHub API Docs**: https://docs.github.com/en/rest/repos/contents

---

**Versão**: 1.0.0  
**Data**: 26/11/2024  
**Mantido por**: Equipe AlquimistaAI
