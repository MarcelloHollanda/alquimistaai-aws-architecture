# LGPD Compliance - Quick Reference

## Overview

LGPD (Lei Geral de Proteção de Dados) compliance implementation for the Fibonacci ecosystem.

## Key Components

### 1. Database Migration
- **File**: `database/migrations/006_add_lgpd_consent.sql`
- **Purpose**: Adds consent tracking fields to leads table

### 2. Compliance Module
- **File**: `lambda/shared/lgpd-compliance.ts`
- **Purpose**: Centralized LGPD compliance functions

### 3. API Endpoints
- **Descadastro**: `lambda/platform/handle-descadastro.ts`
- **Esquecimento**: `lambda/platform/handle-esquecimento.ts`

## Quick Commands

### Run Migration

```bash
# Execute LGPD migration
npm run db:migrate
```

### Test Consent Validation

```typescript
import { validateConsent } from '../shared/lgpd-compliance';
import { getPool } from '../shared/database';

const db = await getPool();
const hasConsent = await validateConsent(db, leadId);
```

### Process Descadastro

```typescript
import { handleDescadastro } from '../shared/lgpd-compliance';

const result = await handleDescadastro(db, leadId, 'Solicitação do lead');
console.log(result.actionsPerformed);
```

### Process Esquecimento

```typescript
import { handleDireitoEsquecimento } from '../shared/lgpd-compliance';

const result = await handleDireitoEsquecimento(db, leadId);
console.log(result.recordsAnonymized);
```

## API Endpoints

### POST /api/lgpd/descadastro

```bash
curl -X POST https://api.alquimista.ai/api/lgpd/descadastro \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "uuid",
    "reason": "Solicitação do lead"
  }'
```

### POST /api/lgpd/esquecimento

```bash
curl -X POST https://api.alquimista.ai/api/lgpd/esquecimento \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "uuid",
    "confirmacao": true
  }'
```

## Descadastro Keywords

Automatically detected in messages:
- pare, parar, stop
- descadastre, descadastrar, remover
- não quero, nao quero
- lgpd, dados pessoais
- cancelar, sair da lista

## Consent Flow

1. **New Lead**: `consent_given = false` by default
2. **Request Consent**: Send message asking for authorization
3. **Record Consent**: Update `consent_given = true` with timestamp
4. **Validate**: Check consent before processing

## Descadastro Flow

1. **Detect**: Keyword detection or API request
2. **Mark**: Update lead status to 'descadastrado'
3. **Cancel**: Cancel future appointments
4. **Block**: Add to blocklist
5. **Confirm**: Send confirmation message
6. **Audit**: Register in audit logs

## Esquecimento Flow

1. **Request**: API request with explicit confirmation
2. **Anonymize**: Replace personal data with 'ANONIMIZADO'
3. **Preserve**: Keep aggregated metrics
4. **Audit**: Register in audit logs

## Database Schema

### Consent Fields

```sql
consent_given BOOLEAN DEFAULT FALSE NOT NULL
consent_date TIMESTAMP
consent_source VARCHAR(100)
consent_ip_address VARCHAR(45)
```

### Blocklist Table

```sql
CREATE TABLE nigredo_leads.blocklist (
    id UUID PRIMARY KEY,
    lead_id UUID,
    telefone VARCHAR(20),
    email VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP
);
```

## Integration Points

### Agente de Recebimento
- Check blocklist before accepting leads
- Set `consent_given = false` by default

### Agente de Atendimento
- Validate consent before processing
- Detect descadastro keywords
- Request consent if not given

### Agente de Disparo
- Validate consent before sending messages
- Skip leads without consent

## Compliance Checklist

- [x] Consent field in database
- [x] Consent validation function
- [x] Blocklist table and validation
- [x] Descadastro function
- [x] Esquecimento function
- [x] Keyword detection
- [x] API endpoints
- [x] Audit trail
- [x] Integration with agents

## Troubleshooting

### Lead not processing

**Issue**: Lead is not being processed
**Solution**: Check if consent is given

```sql
SELECT id, empresa, consent_given 
FROM nigredo_leads.leads 
WHERE id = 'uuid';
```

### Contact blocked

**Issue**: New lead rejected
**Solution**: Check blocklist

```sql
SELECT * FROM nigredo_leads.blocklist 
WHERE telefone = '+5511999999999' 
   OR email = 'test@example.com';
```

### Descadastro not working

**Issue**: Descadastro process failed
**Solution**: Check audit logs

```sql
SELECT * FROM alquimista_platform.audit_logs 
WHERE action_type = 'descadastro' 
  AND lead_id = 'uuid'
ORDER BY created_at DESC;
```

## Monitoring

### CloudWatch Metrics

- `lgpd.consent.validated` - Consent validations
- `lgpd.descadastro.processed` - Descadastro requests
- `lgpd.esquecimento.processed` - Esquecimento requests
- `lgpd.blocklist.hits` - Blocklist hits

### CloudWatch Logs

Search for LGPD operations:

```
fields @timestamp, leadId, action_type, result
| filter action_type in ["descadastro", "direito_esquecimento", "consent_validation"]
| sort @timestamp desc
```

## Requirements

- **17.7**: Explicit consent ✓
- **17.8**: Descadastro and esquecimento ✓
- **11.12**: LGPD compliance in agents ✓

## Documentation

- Full documentation: `lambda/shared/LGPD-COMPLIANCE-README.md`
- Migration: `database/migrations/006_add_lgpd_consent.sql`
- Module: `lambda/shared/lgpd-compliance.ts`
