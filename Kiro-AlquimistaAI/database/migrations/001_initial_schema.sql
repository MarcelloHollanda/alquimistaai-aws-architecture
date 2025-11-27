-- ============================================================================
-- MIGRATION 001: CREATE SCHEMAS & BASE STRUCTURE
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS fibonacci_core;
COMMENT ON SCHEMA fibonacci_core IS 'Core orchestration schema for Fibonacci system - stores events, traces, and metrics';

CREATE SCHEMA IF NOT EXISTS nigredo_leads;
COMMENT ON SCHEMA nigredo_leads IS 'Nigredo prospecting schema - stores leads, campaigns, interactions, and scheduling data';

CREATE SCHEMA IF NOT EXISTS alquimista_platform;
COMMENT ON SCHEMA alquimista_platform IS 'Alquimista platform schema - stores multi-tenant data, users, agents catalog, and permissions';

GRANT USAGE ON SCHEMA fibonacci_core TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA nigredo_leads TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA alquimista_platform TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT SELECT ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT ALL ON SEQUENCES TO postgres, service_role;

CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

COMMENT ON TABLE public.migrations IS 'Tracks applied database migrations';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

INSERT INTO public.migrations (migration_name, description) VALUES
('001_create_schemas', 'Create fibonacci_core, nigredo_leads, and alquimista_platform schemas and base structures')
ON CONFLICT (migration_name) DO NOTHING;
