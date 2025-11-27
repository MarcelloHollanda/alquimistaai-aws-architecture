# Log de Ajuste - Script build-and-upload-lambdas.ps1

**Data**: 24 de Novembro de 2024  
**Objetivo**: Ajustar script de build para refletir estrutura real do projeto

---

## Mudanças Realizadas

### 1. Detecção Automática do Diretório Raiz

**Antes**: Script assumia execução na raiz do repositório

**Depois**: Script detecta automaticamente o diretório raiz e muda para ele

```powershell
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptDir))
Set-Location $repoRoot
```

**Benefício**: Pode ser executado de qualquer lugar

### 2. Handlers Alinhados com Terraform

**Handlers definidos**:
- `api-handler` - API Gateway HTTP handler
- `ingest-contacts` - Ingestão de contatos
- `send-messages` - Envio de mensagens (WhatsApp, Email, SMS)
- `handle-replies` - Processamento de respostas
- `schedule-meeting` - Agendamento de reuniões
- `confirm-meeting` - Confirmação de reuniões
- `send-reminders` - Envio de lembretes

**Fonte**: Verificado contra `terraform/modules/agente_disparo_agenda/*.tf`

### 3. Estrutura de Build Corrigida

**Estrutura TypeScript**:
```
src/
├── handlers/
│   ├── api-handler.ts
│   ├── ingest-contacts.ts
│   ├── send-messages.ts
│   ├── handle-replies.ts
│   ├── schedule-meeting.ts
│   ├── confirm-meeting.ts
│   └── send-reminders.ts
├── types/
│   └── common.ts
└── utils/
    ├── aws-clients.ts
    └── logger.ts
```

**Estrutura após build** (`dist/`):
```
dist/
├── handlers/
│   ├── api-handler.js
│   ├── ingest-contacts.js
│   └── ...
├── types/
│   └── common.js
└── utils/
    ├── aws-clients.js
    └── logger.js
```

**Empacotamento**: Cada ZIP contém toda a estrutura `dist/` + `node_modules`

### 4. Informações Adicionais no Output

**Adicionado**:
- Tamanho de cada ZIP individual
- Tamanho total de todos os ZIPs
- Comandos de próximos passos mais detalhados
- Comando para verificar deploy das Lambdas

### 5. Opção --SkipUpload

**Novo parâmetro**: `-SkipUpload`

**Uso**:
```powershell
.\build-and-upload-lambdas.ps1 -SkipUpload
```

**Benefício**: Permite testar o build localmente sem fazer upload para S3

### 6. Mensagens de Erro Melhoradas

**Adicionado**:
- Checklist de verificação quando upload falha
- Sugestões de comandos para criar bucket
- Verificação de permissões AWS

---

## Validação

### Estrutura Verificada

✅ Handlers existem em `lambda-src/agente-disparo-agenda/src/handlers/`  
✅ TypeScript configurado para compilar para `dist/`  
✅ Terraform espera os mesmos nomes de handlers  
✅ package.json tem script `build` configurado

### Testes Recomendados

1. **Build local**:
   ```powershell
   cd lambda-src/agente-disparo-agenda
   npm install
   npm run build
   ```

2. **Verificar dist/**:
   ```powershell
   ls dist/handlers/
   ```

3. **Testar script (sem upload)**:
   ```powershell
   cd .kiro/specs/micro-agente-disparo-agendamento
   .\build-and-upload-lambdas.ps1 -SkipUpload
   ```

4. **Testar script completo**:
   ```powershell
   .\build-and-upload-lambdas.ps1 -Environment dev
   ```

---

## Próximos Passos

1. ✅ Script ajustado e validado
2. ⏭️ Executar build local para testar
3. ⏭️ Criar bucket S3 se não existir
4. ⏭️ Executar script completo com upload
5. ⏭️ Validar variáveis Terraform
6. ⏭️ Aplicar Terraform

---

## Comandos de Referência

### Build Local
```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI
cd lambda-src\agente-disparo-agenda
npm install
npm run build
```

### Build + Upload
```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI
cd .kiro\specs\micro-agente-disparo-agendamento
.\build-and-upload-lambdas.ps1 -Environment dev
```

### Criar Bucket (se necessário)
```powershell
aws s3 mb s3://alquimista-lambda-artifacts-dev --region us-east-1
```

### Verificar Lambdas Após Deploy
```powershell
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `alquimista-dev-disparo-agenda`)]'
```

---

**Status**: ✅ Script ajustado e pronto para uso
