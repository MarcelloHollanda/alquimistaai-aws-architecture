-- ============================================================================
-- MIGRATION 004: FIBONACCI CORE TABLES
-- ============================================================================

CREATE TABLE fibonacci_core.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    event_id VARCHAR(255) NOT NULL UNIQUE,
    trace_id UUID NOT NULL,
    source VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    detail JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'published',
    
    processed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fibonacci_core.events IS 'Complete history of all events in the fractal ecosystem for audit and replay';

CREATE TABLE fibonacci_core.traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    trace_id UUID NOT NULL UNIQUE,
    parent_trace_id UUID,
    tenant_id UUID,
    lead_id UUID,
    
    span_name VARCHAR(255) NOT NULL,
    span_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_ms INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    
    annotations JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    error_stack TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fibonacci_core.traces IS 'Distributed tracing across all agents for performance monitoring and debugging';

CREATE TABLE fibonacci_core.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    metric_name VARCHAR(255) NOT NULL,
    dimensions JSONB NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    aggregation_type VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_metric_period UNIQUE (metric_name, dimensions, period_start, aggregation_type)
);

COMMENT ON TABLE fibonacci_core.metrics IS 'Aggregated metrics for system monitoring, alerting, and dashboards';

CREATE INDEX idx_events_trace_id ON fibonacci_core.events(trace_id);
CREATE INDEX idx_events_source ON fibonacci_core.events(source);
CREATE INDEX idx_events_event_type ON fibonacci_core.events(event_type);
CREATE INDEX idx_events_status ON fibonacci_core.events(status);
CREATE INDEX idx_events_created_at ON fibonacci_core.events(created_at DESC);
CREATE INDEX idx_events_source_type ON fibonacci_core.events(source, event_type);
CREATE INDEX idx_events_metadata_tenant ON fibonacci_core.events((metadata->>'tenantId'));
CREATE INDEX idx_events_metadata_lead ON fibonacci_core.events((metadata->>'leadId'));

CREATE INDEX idx_traces_trace_id ON fibonacci_core.traces(trace_id);
CREATE INDEX idx_traces_parent_trace_id ON fibonacci_core.traces(parent_trace_id) WHERE parent_trace_id IS NOT NULL;
CREATE INDEX idx_traces_tenant_id ON fibonacci_core.traces(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_traces_lead_id ON fibonacci_core.traces(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_traces_service_name ON fibonacci_core.traces(service_name);
CREATE INDEX idx_traces_status ON fibonacci_core.traces(status);
CREATE INDEX idx_traces_start_time ON fibonacci_core.traces(start_time DESC);
CREATE INDEX idx_traces_duration ON fibonacci_core.traces(duration_ms) WHERE duration_ms IS NOT NULL;
CREATE INDEX idx_traces_service_status ON fibonacci_core.traces(service_name, status);

CREATE INDEX idx_metrics_metric_name ON fibonacci_core.metrics(metric_name);
CREATE INDEX idx_metrics_period_start ON fibonacci_core.metrics(period_start DESC);
CREATE INDEX idx_metrics_metric_period ON fibonacci_core.metrics(metric_name, period_start DESC);
CREATE INDEX idx_metrics_dimensions_tenant ON fibonacci_core.metrics((dimensions->>'tenantId'));
CREATE INDEX idx_metrics_dimensions_agent ON fibonacci_core.metrics((dimensions->>'agentName'));

CREATE OR REPLACE FUNCTION fibonacci_core.calculate_trace_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_trace_duration_trigger
    BEFORE INSERT OR UPDATE ON fibonacci_core.traces
    FOR EACH ROW
    EXECUTE FUNCTION fibonacci_core.calculate_trace_duration();

INSERT INTO public.migrations (migration_name, description) VALUES
('004_create_core_tables', 'Create fibonacci_core tables for event history, distributed tracing, and aggregated metrics')
ON CONFLICT (migration_name) DO NOTHING;
