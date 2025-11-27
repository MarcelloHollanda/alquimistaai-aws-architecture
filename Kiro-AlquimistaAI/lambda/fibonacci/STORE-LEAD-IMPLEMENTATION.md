# Store Lead in Fibonacci Database - Implementation Summary

## Task 9.2 Completion

This document describes the implementation of storing Nigredo leads in the Fibonacci database.

## Overview

The `storeLeadInFibonacci` function in `lambda/fibonacci/handle-nigredo-event.ts` handles the storage of leads received from the Nigredo prospecting system into the Fibonacci database.

## Implementation Details

### Schema Mapping

The function maps Nigredo lead fields to the Fibonacci schema (`nigredo_leads.leads` table):

| Nigredo Field | Fibonacci Field | Notes |
|---------------|-----------------|-------|
| `lead.name` | `name`, `contato` | Stored in both prospecting and core fields |
| `lead.email` | `email` | Used for duplicate detection |
| `lead.phone` | `phone`, `telefone` | Stored in both prospecting and core fields |
| `lead.company` | `company`, `empresa` | Stored in both prospecting and core fields |
| `lead.message` | `message` | Initial message from prospecting form |
| `lead.source` | `metadata.source` | Tracking source (defaults to 'nigredo') |
| `lead.id` | `metadata.nigredo_lead_id` | Original Nigredo lead ID for reference |
| `lead.utm_params.utm_source` | `utm_source` | UTM tracking parameter |
| `lead.utm_params.utm_medium` | `utm_medium` | UTM tracking parameter |
| `lead.utm_params.utm_campaign` | `utm_campaign` | UTM tracking parameter |

### Duplicate Handling

The function implements graceful duplicate handling:

1. **Check for existing lead**: Queries by email address
2. **If exists**: Updates the existing record with new data using `COALESCE` to preserve existing values
3. **If new**: Inserts a new lead record

This approach ensures:
- No duplicate leads by email
- Existing lead data is enriched with new information
- Nigredo lead ID is tracked in metadata for reference

### Default Values

- **tenant_id**: Uses `00000000-0000-0000-0000-000000000000` for public Nigredo leads
- **status**: Set to `'novo'` (new) for all incoming leads
- **empresa**: Defaults to `'Não informado'` if company is not provided (required field)
- **source**: Defaults to `'nigredo'` if not specified

### Error Handling

The function includes:
- X-Ray tracing with subsegments for observability
- Structured logging with correlation IDs
- Proper error propagation to the main handler
- Transaction safety through database query execution

## Database Schema Requirements

The implementation requires the following columns in `nigredo_leads.leads`:

**Core Fields (from migration 002)**:
- `id` (UUID, primary key)
- `tenant_id` (UUID, required)
- `empresa` (VARCHAR, required)
- `contato` (VARCHAR)
- `telefone` (VARCHAR)
- `email` (VARCHAR)
- `status` (VARCHAR)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Prospecting Fields (from migration 007)**:
- `name` (VARCHAR)
- `phone` (VARCHAR)
- `company` (VARCHAR)
- `message` (TEXT)
- `utm_source` (VARCHAR)
- `utm_medium` (VARCHAR)
- `utm_campaign` (VARCHAR)

## Testing Recommendations

To test this implementation:

1. **Duplicate Detection**: Submit the same email twice and verify update behavior
2. **Field Mapping**: Verify all Nigredo fields are correctly mapped
3. **Default Values**: Test with minimal data (only required fields)
4. **UTM Parameters**: Test with and without UTM tracking data
5. **Error Cases**: Test with invalid data to ensure proper error handling

## Integration Points

This function is called by the `handle-nigredo-event` Lambda handler after:
1. Webhook signature validation
2. Payload validation
3. Event type verification

After storing the lead, the handler:
1. Triggers Nigredo agents via EventBridge
2. Returns success response to Nigredo system

## Observability

The function provides:
- **Structured Logs**: Lead creation/update events with IDs
- **X-Ray Traces**: Subsegment for database operations
- **Annotations**: Lead ID for filtering traces
- **Metadata**: Full lead details for debugging

## Requirements Satisfied

This implementation satisfies requirement **2.1** from the Nigredo Prospecting Core spec:

> "WHEN a new lead is successfully stored in the database, THE Nigredo System SHALL send an HTTP POST request to the Fibonacci System webhook endpoint"

The function ensures leads are properly stored in the Fibonacci database with:
- ✅ Duplicate detection by email
- ✅ Field mapping from Nigredo to Fibonacci schema
- ✅ Graceful handling of existing leads
- ✅ Proper error handling and logging
- ✅ X-Ray tracing for observability
