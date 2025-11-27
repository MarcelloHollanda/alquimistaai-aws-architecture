# Fluxo Oficial · Organizador de Leads → Micro Agente de Disparos & Agendamentos

## 1. Objetivo

Padronizar o formato de entrada de leads (telefones + emails) para o **Micro Agente de Disparos & Agendamentos**, garantindo:

- Preservação total dos dados de origem
- Nenhuma fusão de leads
- Padronização mínima para disparo (telefone +55, emails corrigidos de forma conservadora)
- Rastreabilidade por arquivo + linha

---

## 2. Planilha de Entrada Oficial

**Arquivo de entrada**: `Leads_Organizados.xlsx`  
**Aba de trabalho**: `Leads`

### 2.1. Colunas obrigatórias (ordem fixa)

1. `Nome`
2. `Contato`
3. `CNPJ/CPF`
4. `Email`
5. `Telefone`

### 2.2. Regras específicas

#### Nome

- Prioridade: campos `EMPRESA`/`empresa` das planilhas originais
- Remover prefixos numéricos de controle no início, no padrão:
  - `^\d{3,}-` → removido
  - Exemplos:
    - `000011-JUNIA MARIA ROCHA DE ARAUJO 89` → `JUNIA MARIA ROCHA DE ARAUJO 89`
    - `001511-ALINE SILVA LIMA 01425481388` → `ALINE SILVA LIMA 01425481388`
- Se `Nome` vazio e houver `Email`, usar o domínio privado:
  - `algo@c3comercial.com.br` → `Nome = C3comercial`

#### Contato

- Prefixo do email (parte antes do `@`) do primeiro email válido
- Sem email válido → `Contato` vazio

#### CNPJ/CPF

- Origem: coluna `CPF/CNPJ`
- Remover tudo que não for dígito
- **Não usar esse valor como telefone em hipótese alguma**

#### Email

- Coluna pode conter um ou mais emails, separados por `" | "`
- Correções permitidas **apenas se** houver um único email isolado na célula:
  - TLDs: `.con`, `.cpm`, `.vom` → `.com`
  - Domínios:
    - `gmial.com`, `gamil.com`, `gmai.com` → `gmail.com`
    - `hotamil.com`, `hotmal.com` → `hotmail.com`
    - `outlok.com`, `outllook.com` → `outlook.com`
  - Sem TLD:
    - `@gmail`, `@hotmail`, `@outlook`, `@yahoo` → adicionar `.com`
- Células com email corrigido recebem destaque (fundo amarelo claro)

#### Telefone

- Coluna oficial de telefone vem da aba `Telefones` do arquivo de origem:
  - `Planilha Telefones.xlsx` → aba `Telefones` → coluna **`telefone`**
- A coluna `telefone` é tratada como **coluna explícita de telefone**
- Padronização:
  - Números com 10 ou 11 dígitos → `+55 DDD NÚMERO`
    - `7132424215` → `+55 71 32424215`
  - Números com `+` ou >11 dígitos → tratados como internacionais, sem forçar +55
  - Números muito curtos ou formatos estranhos → mantidos como estão
- Vários telefones por linha (se existirem) são unidos em `Telefone` com `" | "`
- Células com telefone reformatado são marcadas com fundo verde claro

---

## 3. Garantias de Integridade

### Nada é apagado

- Todas as linhas de `Emails` e `Telefones` originam linhas em `Leads`
- Nenhum email ou telefone reconhecido é descartado

### Nada é inventado

- Não são criados nomes, documentos, emails ou telefones inexistentes
- Correções são aplicadas somente quando a intenção é única e óbvia

### Sem fusão de leads

- Mesmo que duas linhas tenham `CNPJ/CPF`, `Nome`, `Email` e `Telefone` iguais, elas permanecem como linhas separadas
- Deduplicação é apenas estatística, registrada na aba `Resumo`

---

## 4. Mapeamento para o Micro Agente

### 4.1. Tabela `leads` (modelo interno)

| Campo interno | Origem na planilha | Regra / Observação |
|---------------|-------------------|-------------------|
| `lead_id` | (gerado pelo sistema) | UUID interno ou ID autoincrement, não vem da planilha |
| `lead_id_externo` | linha da planilha | Recomendo: `"{nome_arquivo}:{linha_planilha}"` p/ rastreabilidade |
| `origem_arquivo` | contexto da ingestão | Nome físico: ex. `Leads_Organizados.xlsx` |
| `origem_aba` | contexto da ingestão | Sempre `"Leads"` nesse fluxo |
| `nome` | Nome | Já vem com prefixos numéricos tipo `000011-` removidos |
| `contato_nome` | Contato | Prefixo do Email (parte antes do @), quando existir |
| `documento` | CNPJ/CPF | Apenas dígitos. Pode ser CPF (11) ou CNPJ (14) |
| `email_raw` | Email | String completa, possivelmente com `\|` |
| `telefone_raw` | Telefone | String completa, possivelmente com `\|` |
| `status` | default interno | Sugestão: iniciar como `"novo"` ou `"pendente_disparo"` |
| `tags` | (opcional, interno) | Pode começar vazio `[]` e ser preenchido depois (ex.: `["origem:c3"]`) |
| `data_ingestao` | sistema | Timestamp do momento da ingestão |

**🔒 Importante**: Nada disso altera a planilha. `lead_id`, `lead_id_externo`, `status`, `tags`, `data_ingestao` são metadata internas do micro agente.

### 4.2. Tabela `lead_telefones`

Como `Telefone` pode ter vários valores separados por `" | "`, o ideal é o micro agente "explodir" isso.

| Campo interno | Origem | Regra / Observação |
|---------------|--------|-------------------|
| `telefone_id` | (gerado pelo sistema) | ID interno (UUID/autoincrement) |
| `lead_id` | `leads.lead_id` | FK para a tabela leads |
| `telefone` | cada item de Telefone | Separar a célula por `\|` |
| `telefone_principal` | derivado | `true` para o primeiro telefone, `false` para os demais |
| `tipo_origem` | derivado/heurística | Opcional: pode começar tudo como `"desconhecido"` ou `"nao_classificado"` |
| `valido_para_disparo` | derivado por validação | `true`/`false` com base em validação (tamanho, DDD, blacklist, etc.) |

### 4.3. Tabela `lead_emails`

Mesmo raciocínio para Email.

| Campo interno | Origem | Regra / Observação |
|---------------|--------|-------------------|
| `email_id` | (gerado pelo sistema) | ID interno |
| `lead_id` | `leads.lead_id` | FK para a tabela leads |
| `email` | cada item de Email | Separar por `\|` |
| `email_principal` | derivado | `true` para o primeiro, `false` para os demais |
| `valido_para_disparo` | derivado por validação | `true`/`false` dependendo da validação de sintaxe ou bounce-list |

---

## 5. Recomendações de Processamento

### 5.1. Identificador externo estável

Use `lead_id_externo = "{nome_arquivo}:{linha_planilha}"`.

Permite reprocessar a mesma planilha sem duplicar registros se você quiser implementar upsert.

### 5.2. Validação antes do disparo

**Para telefone:**
- Checar se segue padrão `+55 DDD NÚMERO` e se o DDD é válido
- Validar contra blacklist de números bloqueados

**Para email:**
- Checar MX ou usar lista de bounces/hard-bounces do histórico
- Validar sintaxe RFC 5322

### 5.3. Status de ciclo

Sugerido:

```
novo → em_disparo → agendado / contato_efetuado / sem_sucesso / descartado
```

Isso não impacta a planilha, é só a máquina de estados do agente.

---

## 6. Uso pelo Micro Agente

A ingestão lê a aba `Leads`, cria registros em:
- `leads`
- `lead_telefones`
- `lead_emails`

Todo disparo (WhatsApp/email) sempre referencia:
- `lead_id`
- E opcionalmente `lead_id_externo` para rastreabilidade com a planilha

---

## 7. Exemplo de Fluxo Completo

```
1. Upload de Leads_Organizados.xlsx
   ↓
2. Parser lê aba "Leads"
   ↓
3. Para cada linha:
   - Cria registro em `leads`
   - Explode `Email` → cria N registros em `lead_emails`
   - Explode `Telefone` → cria N registros em `lead_telefones`
   ↓
4. Validação de contatos:
   - Marca `valido_para_disparo` em cada email/telefone
   ↓
5. Leads ficam com status "novo"
   ↓
6. Micro agente de disparo consulta leads com status "novo"
   ↓
7. Executa campanha respeitando rate limits
   ↓
8. Atualiza status para "em_disparo" → "contato_efetuado"
```

---

## 8. Schema SQL Sugerido

```sql
-- Tabela principal de leads
CREATE TABLE leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id_externo VARCHAR(255) UNIQUE NOT NULL,
  origem_arquivo VARCHAR(255) NOT NULL,
  origem_aba VARCHAR(100) NOT NULL,
  nome VARCHAR(255),
  contato_nome VARCHAR(255),
  documento VARCHAR(20),
  email_raw TEXT,
  telefone_raw TEXT,
  status VARCHAR(50) DEFAULT 'novo',
  tags JSONB DEFAULT '[]',
  data_ingestao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de telefones explodidos
CREATE TABLE lead_telefones (
  telefone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  telefone VARCHAR(50) NOT NULL,
  telefone_principal BOOLEAN DEFAULT FALSE,
  tipo_origem VARCHAR(50) DEFAULT 'nao_classificado',
  valido_para_disparo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de emails explodidos
CREATE TABLE lead_emails (
  email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_principal BOOLEAN DEFAULT FALSE,
  valido_para_disparo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_externo ON leads(lead_id_externo);
CREATE INDEX idx_lead_telefones_lead ON lead_telefones(lead_id);
CREATE INDEX idx_lead_telefones_valido ON lead_telefones(valido_para_disparo);
CREATE INDEX idx_lead_emails_lead ON lead_emails(lead_id);
CREATE INDEX idx_lead_emails_valido ON lead_emails(valido_para_disparo);
```

---

Este fluxo é a **versão oficial** do Organizador de Leads para uso pelo Micro Agente de Disparos & Agendamentos da Alquimista.AI.

**Última atualização**: 2024-11-26  
**Versão**: 1.0.0  
**Mantido por**: Equipe AlquimistaAI
