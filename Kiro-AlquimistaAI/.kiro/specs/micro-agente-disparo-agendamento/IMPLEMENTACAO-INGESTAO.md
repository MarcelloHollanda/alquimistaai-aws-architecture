# Implementação · Ingestão de Leads para Micro Agente

## Visão Geral

Este documento complementa o `FLUXO-INGESTAO-LEADS.md` com exemplos práticos de implementação.

---

## 1. Lambda Handler de Ingestão

### 1.1. Estrutura do Handler

**Arquivo**: `lambda-src/agente-disparo-agenda/handlers/ingestao-leads.ts`

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import * as XLSX from 'xlsx';

interface LeadRow {
  Nome: string;
  Contato: string;
  'CNPJ/CPF': string;
  Email: string;
  Telefone: string;
}

export async function handler(event: any) {
  const { bucket, key } = event; // S3 bucket e key do arquivo
  
  // 1. Baixar arquivo do S3
  const fileBuffer = await downloadFromS3(bucket, key);
  
  // 2. Parsear Excel
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['Leads'];
  const rows: LeadRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  // 3. Processar cada linha
  const results = {
    total: rows.length,
    success: 0,
    errors: [] as string[]
  };
  
  for (let i = 0; i < rows.length; i++) {
    try {
      await processLead(rows[i], key, i + 2); // +2 porque linha 1 é header
      results.success++;
    } catch (error) {
      results.errors.push(`Linha ${i + 2}: ${error.message}`);
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
}

async function downloadFromS3(bucket: string, key: string): Promise<Buffer> {
  const s3 = new S3Client({ region: 'us-east-1' });
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}
```

---

## 2. Processamento de Lead Individual

### 2.1. Função Principal

```typescript
async function processLead(row: LeadRow, arquivo: string, linha: number) {
  const leadIdExterno = `${arquivo}:${linha}`;
  
  // 1. Verificar se já existe (upsert)
  const existingLead = await findLeadByExternalId(leadIdExterno);
  
  if (existingLead) {
    console.log(`Lead ${leadIdExterno} já existe, pulando...`);
    return;
  }
  
  // 2. Criar lead principal
  const leadId = await createLead({
    leadIdExterno,
    origemArquivo: arquivo,
    origemAba: 'Leads',
    nome: row.Nome,
    contatoNome: row.Contato,
    documento: sanitizeDocumento(row['CNPJ/CPF']),
    emailRaw: row.Email,
    telefoneRaw: row.Telefone,
    status: 'novo',
    tags: []
  });
  
  // 3. Explodir emails
  const emails = explodeField(row.Email);
  for (let i = 0; i < emails.length; i++) {
    await createLeadEmail({
      leadId,
      email: emails[i],
      emailPrincipal: i === 0,
      validoParaDisparo: validateEmail(emails[i])
    });
  }
  
  // 4. Explodir telefones
  const telefones = explodeField(row.Telefone);
  for (let i = 0; i < telefones.length; i++) {
    await createLeadTelefone({
      leadId,
      telefone: telefones[i],
      telefonePrincipal: i === 0,
      validoParaDisparo: validateTelefone(telefones[i])
    });
  }
}
```

### 2.2. Funções Auxiliares

```typescript
function explodeField(value: string): string[] {
  if (!value) return [];
  
  return value
    .split('|')
    .map(v => v.trim())
    .filter(v => v.length > 0);
}

function sanitizeDocumento(doc: string): string {
  if (!doc) return '';
  return doc.replace(/\D/g, '');
}

function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateTelefone(telefone: string): boolean {
  // Validar formato +55 DDD NÚMERO
  const regex = /^\+55\s?\d{2}\s?\d{8,9}$/;
  return regex.test(telefone);
}
```

---

## 3. Queries de Banco de Dados

### 3.1. Criar Lead

```typescript
async function createLead(data: any): Promise<string> {
  const rds = new RDSDataClient({ region: 'us-east-1' });
  
  const sql = `
    INSERT INTO leads (
      lead_id_externo,
      origem_arquivo,
      origem_aba,
      nome,
      contato_nome,
      documento,
      email_raw,
      telefone_raw,
      status,
      tags
    ) VALUES (
      :leadIdExterno,
      :origemArquivo,
      :origemAba,
      :nome,
      :contatoNome,
      :documento,
      :emailRaw,
      :telefoneRaw,
      :status,
      :tags::jsonb
    )
    RETURNING lead_id
  `;
  
  const command = new ExecuteStatementCommand({
    resourceArn: process.env.DB_CLUSTER_ARN,
    secretArn: process.env.DB_SECRET_ARN,
    database: 'alquimista',
    sql,
    parameters: [
      { name: 'leadIdExterno', value: { stringValue: data.leadIdExterno } },
      { name: 'origemArquivo', value: { stringValue: data.origemArquivo } },
      { name: 'origemAba', value: { stringValue: data.origemAba } },
      { name: 'nome', value: { stringValue: data.nome } },
      { name: 'contatoNome', value: { stringValue: data.contatoNome } },
      { name: 'documento', value: { stringValue: data.documento } },
      { name: 'emailRaw', value: { stringValue: data.emailRaw } },
      { name: 'telefoneRaw', value: { stringValue: data.telefoneRaw } },
      { name: 'status', value: { stringValue: data.status } },
      { name: 'tags', value: { stringValue: JSON.stringify(data.tags) } }
    ]
  });
  
  const response = await rds.send(command);
  return response.records[0][0].stringValue;
}
```

### 3.2. Criar Email

```typescript
async function createLeadEmail(data: any): Promise<void> {
  const rds = new RDSDataClient({ region: 'us-east-1' });
  
  const sql = `
    INSERT INTO lead_emails (
      lead_id,
      email,
      email_principal,
      valido_para_disparo
    ) VALUES (
      :leadId::uuid,
      :email,
      :emailPrincipal,
      :validoParaDisparo
    )
  `;
  
  const command = new ExecuteStatementCommand({
    resourceArn: process.env.DB_CLUSTER_ARN,
    secretArn: process.env.DB_SECRET_ARN,
    database: 'alquimista',
    sql,
    parameters: [
      { name: 'leadId', value: { stringValue: data.leadId } },
      { name: 'email', value: { stringValue: data.email } },
      { name: 'emailPrincipal', value: { booleanValue: data.emailPrincipal } },
      { name: 'validoParaDisparo', value: { booleanValue: data.validoParaDisparo } }
    ]
  });
  
  await rds.send(command);
}
```

### 3.3. Criar Telefone

```typescript
async function createLeadTelefone(data: any): Promise<void> {
  const rds = new RDSDataClient({ region: 'us-east-1' });
  
  const sql = `
    INSERT INTO lead_telefones (
      lead_id,
      telefone,
      telefone_principal,
      valido_para_disparo
    ) VALUES (
      :leadId::uuid,
      :telefone,
      :telefonePrincipal,
      :validoParaDisparo
    )
  `;
  
  const command = new ExecuteStatementCommand({
    resourceArn: process.env.DB_CLUSTER_ARN,
    secretArn: process.env.DB_SECRET_ARN,
    database: 'alquimista',
    sql,
    parameters: [
      { name: 'leadId', value: { stringValue: data.leadId } },
      { name: 'telefone', value: { stringValue: data.telefone } },
      { name: 'telefonePrincipal', value: { booleanValue: data.telefonePrincipal } },
      { name: 'validoParaDisparo', value: { booleanValue: data.validoParaDisparo } }
    ]
  });
  
  await rds.send(command);
}
```

---

## 4. Validações Avançadas

### 4.1. Validação de DDD

```typescript
const DDDs_VALIDOS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24, // RJ
  27, 28, // ES
  31, 32, 33, 34, 35, 37, 38, // MG
  41, 42, 43, 44, 45, 46, // PR
  47, 48, 49, // SC
  51, 53, 54, 55, // RS
  61, // DF
  62, 64, // GO
  63, // TO
  65, 66, // MT
  67, // MS
  68, // AC
  69, // RO
  71, 73, 74, 75, 77, // BA
  79, // SE
  81, 87, // PE
  82, // AL
  83, // PB
  84, // RN
  85, 88, // CE
  86, 89, // PI
  91, 93, 94, // PA
  92, 97, // AM
  95, // RR
  96, // AP
  98, 99  // MA
];

function validateDDD(telefone: string): boolean {
  const match = telefone.match(/\+55\s?(\d{2})/);
  if (!match) return false;
  
  const ddd = parseInt(match[1], 10);
  return DDDs_VALIDOS.includes(ddd);
}
```

### 4.2. Validação de Email com MX

```typescript
import { Resolver } from 'dns/promises';

async function validateEmailMX(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    const resolver = new Resolver();
    const mxRecords = await resolver.resolveMx(domain);
    return mxRecords.length > 0;
  } catch {
    return false;
  }
}
```

---

## 5. Testes Unitários

### 5.1. Teste de Explosão de Campos

```typescript
import { describe, it, expect } from 'vitest';

describe('explodeField', () => {
  it('deve separar múltiplos valores por pipe', () => {
    const result = explodeField('email1@test.com | email2@test.com');
    expect(result).toEqual(['email1@test.com', 'email2@test.com']);
  });
  
  it('deve retornar array vazio para string vazia', () => {
    const result = explodeField('');
    expect(result).toEqual([]);
  });
  
  it('deve remover espaços em branco', () => {
    const result = explodeField('  email@test.com  ');
    expect(result).toEqual(['email@test.com']);
  });
});
```

### 5.2. Teste de Validação de Telefone

```typescript
describe('validateTelefone', () => {
  it('deve validar telefone brasileiro correto', () => {
    expect(validateTelefone('+55 84 997084444')).toBe(true);
    expect(validateTelefone('+55 11 987654321')).toBe(true);
  });
  
  it('deve rejeitar telefone sem +55', () => {
    expect(validateTelefone('84 997084444')).toBe(false);
  });
  
  it('deve rejeitar telefone com DDD inválido', () => {
    expect(validateTelefone('+55 00 997084444')).toBe(false);
  });
});
```

---

## 6. Monitoramento e Logs

### 6.1. Logs Estruturados

```typescript
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: 'ingestao-leads';
  action: string;
  leadIdExterno?: string;
  arquivo?: string;
  linha?: number;
  message: string;
  metadata?: any;
}

function log(entry: Partial<LogEntry>) {
  const fullEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: entry.level || 'INFO',
    service: 'ingestao-leads',
    action: entry.action || 'unknown',
    message: entry.message || '',
    ...entry
  };
  
  console.log(JSON.stringify(fullEntry));
}

// Uso
log({
  level: 'INFO',
  action: 'process_lead',
  leadIdExterno: 'Leads_Organizados.xlsx:42',
  message: 'Lead processado com sucesso',
  metadata: { emails: 2, telefones: 1 }
});
```

### 6.2. Métricas CloudWatch

```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

async function publishMetric(metricName: string, value: number) {
  const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });
  
  const command = new PutMetricDataCommand({
    Namespace: 'Alquimista/Ingestao',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Timestamp: new Date()
      }
    ]
  });
  
  await cloudwatch.send(command);
}

// Uso
await publishMetric('LeadsProcessados', results.success);
await publishMetric('LeadsComErro', results.errors.length);
```

---

## 7. Tratamento de Erros

### 7.1. Retry com Backoff Exponencial

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      log({
        level: 'WARN',
        action: 'retry',
        message: `Tentativa ${i + 1} falhou, aguardando ${delay}ms`,
        metadata: { error: error.message }
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Uso
await retryWithBackoff(() => createLead(data));
```

---

## 8. Checklist de Implementação

- [ ] Handler de ingestão criado
- [ ] Função de explosão de campos implementada
- [ ] Validações de email e telefone implementadas
- [ ] Queries de banco de dados testadas
- [ ] Testes unitários escritos
- [ ] Logs estruturados configurados
- [ ] Métricas CloudWatch publicadas
- [ ] Tratamento de erros com retry implementado
- [ ] Documentação atualizada

---

**Última atualização**: 2024-11-26  
**Versão**: 1.0.0  
**Mantido por**: Equipe AlquimistaAI
