-- Migration 004: Create Fibonacci Core Tables
-- Purpose: Create tables for event history, distributed tracing, and aggregated metrics
-- Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8

-- ============================================================================
-- Table: fibonacci_core.events
-- Purpose: Store complete history of all events in the fractal ecosystem
-- ============================================================================
CREATE TABLE fibonacci_core.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Identification
    event_id VARCHAR(255) NOT NULL UNIQUE,
    trace_id UUID NOT NULL,
    
    -- Event Source
    source VARCHAR(255) NOT NULL,
    -- Sources: 'nigredo.*' | 'alquimista.*' | 'fibonacci.*'
    
    -- Event Type
    event_type VARCHAR(255) NOT NULL,
    -- Types: 'recebimento.completed' | 'estrategia.completed' | 'disparo.sent' | 'atendimento.responded' | etc.
    
    -- Event Payload
    detail JSONB NOT NULL,
    -- Complete event payload following the fractal protocol
    
    -- Event Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "tenantId": "uuid",
    --   "leadId": "uuid",
    --   "agentId": "uuid",
    --   "version": "1.0"
    -- }
    
    -- Event Status
    status VARCHAR(50) NOT NULL DEFAULT 'published',
    -- Status: 'published' | 'processed' | 'failed' | 'retrying'
    
    -- Processing Information
    processed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fibonacci_core.events IS 'Complete history of all events in the fractal ecosystem for audit and replay';

-- ============================================================================
-- Table: fibonacci_core.traces
-- Purpose: Store distributed tracing information across agents
-- ============================================================================
CREATE TABLE fibonacci_core.traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trace Identification
    trace_id UUID NOT NULL UNIQUE,
    parent_trace_id UUID,
    
    -- Trace Context
    tenant_id UUID,
    lead_id UUID,
    
    -- Trace Span Information
    span_name VARCHAR(255) NOT NULL,
    -- Span names: 'lead.processing' | 'campaign.creation' | 'message.sending' | 'sentiment.analysis'
    
    span_type VARCHAR(100) NOT NULL,
    -- Types: 'agent' | 'mcp' | 'database' | 'external_api'
    
    -- Agent/Service Information
    service_name VARCHAR(255) NOT NULL,
    -- Services: 'recebimento' | 'estrategia' | 'disparo' | 'atendimento' | 'whatsapp-mcp' | etc.
    
    -- Timing Information
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_ms INTEGER,
    
    -- Trace Status
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    -- Status: 'in_progress' | 'completed' | 'failed' | 'timeout'
    
    -- Trace Annotations (for filtering)
    annotations JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "agentName": "string",
    --   "actionType": "string",
    --   "priority": "high|medium|low"
    -- }
    
    -- Trace Metadata (for debugging)
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "inputSize": 1024,
    --   "outputSize": 512,
    --   "memoryUsed": 256,
    --   "errorDetails": {}
    -- }
    
    -- Error Information
    error_message TEXT,
    error_stack TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fibonacci_core.traces IS 'Distributed tracing across all agents for performance monitoring and debugging';

-- ============================================================================
-- Table: fibonacci_core.metrics
-- Purpose: Store aggregated metrics for system monitoring
-- ============================================================================
CREATE TABLE fibonacci_core.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Identification
    metric_name VARCHAR(255) NOT NULL,
    -- Metrics: 'agent.invocations' | 'agent.errors' | 'agent.duration' | 'mcp.calls' | 'api.requests'
    
    -- Metric Dimensions
    dimensions JSONB NOT NULL,
    -- Structure: {
    --   "tenantId": "uuid",
    --   "agentName": "string",
    --   "environment": "dev|staging|prod",
    --   "region": "us-east-1"
    -- }
    
    -- Metric Value
    value NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    -- Units: 'count' | 'milliseconds' | 'bytes' | 'percentage' | 'currency'
    
    -- Aggregation Period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    aggregation_type VARCHAR(50) NOT NULL,
    -- Types: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99'
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate metrics for same period
    CONSTRAINT unique_metric_period UNIQUE (metric_name, dimensions, period_start, aggregation_type)
);

COMMENT ON TABLE fibonacci_core.metrics IS 'Aggregated metrics for system monitoring, alerting, and dashboards';

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Events table indexes
CREATE INDEX idx_events_trace_id ON fibonacci_core.events(trace_id);
CREATE INDEX idx_events_source ON fibonacci_core.events(source);
CREATE INDEX idx_events_event_type ON fibonacci_core.events(event_type);
CREATE INDEX idx_events_status ON fibonacci_core.events(status);
CREATE INDEX idx_events_created_at ON fibonacci_core.events(created_at DESC);
CREATE INDEX idx_events_source_type ON fibonacci_core.events(source, event_type);
CREATE INDEX idx_events_metadata_tenant ON fibonacci_core.events((metadata->>'tenantId'));
CREATE INDEX idx_events_metadata_lead ON fibonacci_core.events((metadata->>'leadId'));

-- Traces table indexes
CREATE INDEX idx_traces_trace_id ON fibonacci_core.traces(trace_id);
CREATE INDEX idx_traces_parent_trace_id ON fibonacci_core.traces(parent_trace_id) WHERE parent_trace_id IS NOT NULL;
CREATE INDEX idx_traces_tenant_id ON fibonacci_core.traces(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_traces_lead_id ON fibonacci_core.traces(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_traces_service_name ON fibonacci_core.traces(service_name);
CREATE INDEX idx_traces_status ON fibonacci_core.traces(status);
CREATE INDEX idx_traces_start_time ON fibonacci_core.traces(start_time DESC);
CREATE INDEX idx_traces_duration ON fibonacci_core.traces(duration_ms) WHERE duration_ms IS NOT NULL;
CREATE INDEX idx_traces_service_status ON fibonacci_core.traces(service_name, status);

-- Metrics table indexes
CREATE INDEX idx_metrics_metric_name ON fibonacci_core.metrics(metric_name);
CREATE INDEX idx_metrics_period_start ON fibonacci_core.metrics(period_start DESC);
CREATE INDEX idx_metrics_metric_period ON fibonacci_core.metrics(metric_name, period_start DESC);
CREATE INDEX idx_metrics_dimensions_tenant ON fibonacci_core.metrics((dimensions->>'tenantId'));
CREATE INDEX idx_metrics_dimensions_agent ON fibonacci_core.metrics((dimensions->>'agentName'));

-- ============================================================================
-- Partitioning Strategy (for high-volume tables)
-- ============================================================================

-- Note: For production, consider partitioning events and traces tables by date
-- Example (to be applied manually when needed):
-- 
-- CREATE TABLE fibonacci_core.events_2024_01 PARTITION OF fibonacci_core.events
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- 
-- This improves query performance and allows for easier data archival

-- ============================================================================
-- Data Retention Policy
-- ============================================================================

-- Create function to archive old events (older than 90 days)
CREATE OR REPLACE FUNCTION fibonacci_core.archive_old_events()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- In production, move to archive table instead of deleting
    DELETE FROM fibonacci_core.events
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status = 'processed';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fibonacci_core.archive_old_events() IS 'Archives events older than 90 days to maintain performance';

-- Create function to archive old traces (older than 30 days)
CREATE OR REPLACE FUNCTION fibonacci_core.archive_old_traces()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- In production, move to archive table instead of deleting
    DELETE FROM fibonacci_core.traces
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status = 'completed';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fibonacci_core.archive_old_traces() IS 'Archives traces older than 30 days to maintain performance';

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate trace duration when end_time is set
CREATE OR REPLACE FUNCTION fibonacci_core.calculate_trace_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to automatically calculate duration
CREATE TRIGGER calculate_trace_duration_trigger
    BEFORE INSERT OR UPDATE ON fibonacci_core.traces
    FOR EACH ROW
    EXECUTE FUNCTION fibonacci_core.calculate_trace_duration();

-- ============================================================================
-- Record Migration
-- ============================================================================

INSERT INTO public.migrations (migration_name, description)
VALUES ('004_create_core_tables', 'Create fibonacci_core tables for event history, distributed tracing, and aggregated metrics')
ON CONFLICT (migration_name) DO NOTHING;
