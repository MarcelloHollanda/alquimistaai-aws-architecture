# LGPD Compliance Module

## Overview

This module provides comprehensive LGPD (Lei Geral de Proteção de Dados Pessoais) compliance functionality for the Fibonacci ecosystem, ensuring that all personal data processing follows Brazilian data protection regulations.

## Features

### 1. Consent Management
- **Explicit Consent Validation**: Validates that leads have given explicit consent before processing their data
- **Consent Recording**: Records consent with timestamp, source, and IP address for audit trail
- **Consent Enforcement**: Blocks processing of leads without consent

### 2. Descadastro (Unsubscribe)
- **Automatic Detection**: Detects unsubscribe keywords in messages
- **Complete Removal**: Marks lead as unsubscribed, cancels appointments, adds to blocklist
- **Confirmation**: Sends confirmation message to the lead
- **Audit Trail**: Registers all actions in audit logs

### 3. Direito ao Esquecimento (Right to be Forgotten)
- **Data Anonymization**: Anonymizes all personal data in leads, interactions, and appointments
- **Aggregated Data Preservation**: Maintains aggregated metrics without personal identification
- **Audit Trail**: Records anonymization actions

### 4. Blocklist Management
- **Contact Blocking**: Prevents processing of contacts in the blocklist
- **Automatic Validation**: Checks blocklist before accepting new leads

## Database Schema

### Consent Fields (leads table)

```sql
ALTER TABLE nigredo_leads.leads
ADD COLUMN consent_given BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN consent_date TIMESTAMP,
ADD COLUMN consent_source VARCHAR(100),
ADD COLUMN consent_ip_address VARCHAR(45);
```

### Blocklist Table

```sql
CREATE TABLE nigredo_leads.blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES nigredo_leads.leads(id),
    telefone VARCHAR(20),
    email VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Functions

### Consent Management

#### `validateConsent(db: Pool, leadId: string): Promise<boolean>`

Validates if a lead has given explicit consent.

```typescript
import { getPool } from '../shared/database';
import { validateConsent } from '../shared/lgpd-compliance';

const db = await getPool();
const hasConsent = await validateConsent(db, leadId);

if (!hasConsent) {
  // Block processing
}
```

#### `recordConsent(db: Pool, consentData: ConsentData): Promise<boolean>`

Records explicit consent from a lead.

```typescript
import { recordConsent } from '../shared/lgpd-compliance';

await recordConsent(db, {
  leadId: 'uuid',
  consentGiven: true,
  consentDate: new Date(),
  consentSource: 'web_form',
  consentIpAddress: '192.168.1.1'
});
```

#### `enforceConsent(db: Pool, leadId: string): Promise<void>`

Enforces consent validation, throwing an error if consent is not given.

```typescript
import { enforceConsent } from '../shared/lgpd-compliance';

try {
  await enforceConsent(db, leadId);
  // Proceed with processing
} catch (error) {
  // Consent not given, block processing
}
```

### Descadastro (Unsubscribe)

#### `handleDescadastro(db: Pool, leadId: string, reason?: string): Promise<DescadastroResult>`

Handles complete unsubscribe process.

```typescript
import { handleDescadastro } from '../shared/lgpd-compliance';

const result = await handleDescadastro(db, leadId, 'Solicitação do lead');

if (result.success) {
  console.log('Actions performed:', result.actionsPerformed);
  // ['Lead marked as descadastrado', '2 future appointment(s) cancelled', 'Added to blocklist', 'Audit log registered']
}
```

#### `detectDescadastroKeywords(message: string): boolean`

Detects unsubscribe keywords in a message.

```typescript
import { detectDescadastroKeywords } from '../shared/lgpd-compliance';

const message = 'Por favor, pare de me enviar mensagens';
const shouldUnsubscribe = detectDescadastroKeywords(message);

if (shouldUnsubscribe) {
  await handleDescadastro(db, leadId, 'Keyword detected in message');
}
```

**Detected Keywords:**
- pare, parar, stop
- descadastre, descadastrar, remover, remova
- não quero, nao quero
- não tenho interesse, nao tenho interesse
- lgpd, dados pessoais, privacidade
- cancelar, sair da lista

### Direito ao Esquecimento (Right to be Forgotten)

#### `handleDireitoEsquecimento(db: Pool, leadId: string): Promise<EsquecimentoResult>`

Handles right to be forgotten request, anonymizing all personal data.

```typescript
import { handleDireitoEsquecimento } from '../shared/lgpd-compliance';

const result = await handleDireitoEsquecimento(db, leadId);

if (result.success) {
  console.log('Records anonymized:', result.recordsAnonymized);
  // { lead: true, interactions: 15, appointments: 2 }
}
```

### Blocklist Management

#### `isBlocked(db: Pool, telefone?: string, email?: string): Promise<boolean>`

Checks if a contact is in the blocklist.

```typescript
import { isBlocked } from '../shared/lgpd-compliance';

const blocked = await isBlocked(db, '+5511999999999', 'test@example.com');

if (blocked) {
  // Reject lead
}
```

## Integration Examples

### Agente de Recebimento

```typescript
import { isBlocked } from '../shared/lgpd-compliance';

// Check blocklist before processing lead
const db = await getPool();
const blocked = await isBlocked(db, telefone, email);

if (blocked) {
  logger.warn('Lead bloqueado por LGPD');
  continue; // Skip this lead
}

// Insert lead with consent_given = false by default
await query(
  `INSERT INTO nigredo_leads.leads (..., consent_given, consent_date, consent_source)
   VALUES (..., false, null, 'api')`
);
```

### Agente de Atendimento

```typescript
import { validateConsent, detectDescadastroKeywords, handleDescadastro } from '../shared/lgpd-compliance';

// Validate consent before processing
const db = await getPool();
const hasConsent = await validateConsent(db, lead.id);

if (!hasConsent) {
  // Request consent
  await sendConsentRequest(lead);
  return;
}

// Detect descadastro keywords
if (detectDescadastroKeywords(message)) {
  await handleDescadastro(db, lead.id, 'Keyword detected');
  await sendConfirmation(lead);
  return;
}

// Process normally
```

## API Endpoints

### POST /api/lgpd/descadastro

Process unsubscribe request.

**Request:**
```json
{
  "leadId": "uuid",
  "reason": "Solicitação do lead",
  "email": "optional@email.com",
  "telefone": "+5511999999999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Descadastro realizado com sucesso. Seus dados foram removidos conforme LGPD.",
  "leadId": "uuid",
  "actionsPerformed": [
    "Lead marked as descadastrado",
    "2 future appointment(s) cancelled",
    "Added to blocklist",
    "Audit log registered"
  ],
  "traceId": "uuid"
}
```

### POST /api/lgpd/esquecimento

Process right to be forgotten request.

**Request:**
```json
{
  "leadId": "uuid",
  "email": "optional@email.com",
  "telefone": "+5511999999999",
  "confirmacao": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dados pessoais anonimizados com sucesso conforme LGPD Art. 18",
  "leadId": "uuid",
  "recordsAnonymized": {
    "lead": true,
    "interactions": 15,
    "appointments": 2
  },
  "traceId": "uuid"
}
```

## Compliance Checklist

- [x] **Consent Management**
  - [x] Explicit consent field in database
  - [x] Consent validation before processing
  - [x] Consent recording with audit trail
  - [x] Consent enforcement mechanism

- [x] **Descadastro (Unsubscribe)**
  - [x] Automatic keyword detection
  - [x] Lead status update
  - [x] Future appointments cancellation
  - [x] Blocklist addition
  - [x] Confirmation message
  - [x] Audit log registration

- [x] **Direito ao Esquecimento**
  - [x] Personal data anonymization
  - [x] Interaction anonymization
  - [x] Appointment anonymization
  - [x] Aggregated data preservation
  - [x] Audit trail

- [x] **Blocklist Management**
  - [x] Blocklist table
  - [x] Contact validation
  - [x] Automatic blocking

## Testing

### Unit Tests

```typescript
describe('LGPD Compliance', () => {
  describe('detectDescadastroKeywords', () => {
    it('should detect stop keywords', () => {
      expect(detectDescadastroKeywords('pare de me enviar mensagens')).toBe(true);
      expect(detectDescadastroKeywords('não quero mais')).toBe(true);
      expect(detectDescadastroKeywords('lgpd')).toBe(true);
    });

    it('should not detect normal messages', () => {
      expect(detectDescadastroKeywords('tenho interesse')).toBe(false);
    });
  });
});
```

### Integration Tests

```typescript
describe('Descadastro Flow', () => {
  it('should complete descadastro process', async () => {
    const result = await handleDescadastro(db, leadId, 'Test');
    
    expect(result.success).toBe(true);
    expect(result.actionsPerformed).toContain('Lead marked as descadastrado');
    expect(result.actionsPerformed).toContain('Added to blocklist');
    
    // Verify lead status
    const lead = await query('SELECT status FROM nigredo_leads.leads WHERE id = $1', [leadId]);
    expect(lead.rows[0].status).toBe('descadastrado');
    
    // Verify blocklist
    const blocked = await isBlocked(db, telefone, email);
    expect(blocked).toBe(true);
  });
});
```

## Audit Trail

All LGPD operations are logged with:
- `trace_id`: Unique identifier for tracking
- `timestamp`: When the action occurred
- `agent_id`: Which agent performed the action
- `action_type`: Type of LGPD action (consent, descadastro, esquecimento)
- `lead_id`: Affected lead
- `result`: Success or failure
- `metadata`: Additional context

Example audit log entry:

```json
{
  "trace_id": "uuid",
  "agent_id": "lgpd-compliance",
  "action_type": "descadastro",
  "lead_id": "uuid",
  "result": "success",
  "metadata": {
    "reason": "Solicitação do lead",
    "empresa": "Empresa Teste",
    "contato": "João Silva",
    "actionsPerformed": [
      "Lead marked as descadastrado",
      "2 future appointment(s) cancelled",
      "Added to blocklist",
      "Audit log registered"
    ]
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

## Best Practices

1. **Always validate consent** before processing personal data
2. **Check blocklist** before accepting new leads
3. **Detect descadastro keywords** in all incoming messages
4. **Log all LGPD operations** for audit trail
5. **Send confirmation messages** after descadastro
6. **Require explicit confirmation** for direito ao esquecimento
7. **Preserve aggregated data** for business metrics
8. **Use transactions** for multi-step LGPD operations

## Requirements Mapping

- **Requirement 17.7**: Explicit consent implementation ✓
- **Requirement 17.8**: Descadastro and direito ao esquecimento ✓
- **Requirement 11.12**: LGPD compliance in Nigredo agents ✓

## References

- [LGPD - Lei Geral de Proteção de Dados](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LGPD Art. 18 - Direitos do Titular](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm#art18)
