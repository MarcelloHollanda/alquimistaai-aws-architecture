-- Migration 001: Create Database Schemas
-- Purpose: Create the three main schemas for the Fibonacci ecosystem
-- Requirements: 7.7

-- ============================================================================
-- Schema: fibonacci_core
-- Purpose: Core orchestration data (events, traces, metrics)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS fibonacci_core;

COMMENT ON SCHEMA fibonacci_core IS 'Core orchestration schema for Fibonacci system - stores events, traces, and metrics';

-- ============================================================================
-- Schema: nigredo_leads
-- Purpose: Lead prospecting and management data
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS nigredo_leads;

COMMENT ON SCHEMA nigredo_leads IS 'Nigredo prospecting schema - stores leads, campaigns, interactions, and scheduling data';

-- ============================================================================
-- Schema: alquimista_platform
-- Purpose: SaaS platform data (tenants, users, agents, permissions)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS alquimista_platform;

COMMENT ON SCHEMA alquimista_platform IS 'Alquimista platform schema - stores multi-tenant data, users, agents catalog, and permissions';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant usage on schemas to the database user
GRANT USAGE ON SCHEMA fibonacci_core TO CURRENT_USER;
GRANT USAGE ON SCHEMA nigredo_leads TO CURRENT_USER;
GRANT USAGE ON SCHEMA alquimista_platform TO CURRENT_USER;

-- Grant all privileges on all tables in schemas (for future tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT ALL ON TABLES TO CURRENT_USER;

-- Grant all privileges on all sequences in schemas (for auto-increment columns)
ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT ALL ON SEQUENCES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT ALL ON SEQUENCES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT ALL ON SEQUENCES TO CURRENT_USER;

-- ============================================================================
-- Migration Tracking Table
-- ============================================================================

-- Create migrations table in public schema to track applied migrations
CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

COMMENT ON TABLE public.migrations IS 'Tracks applied database migrations';

-- Record this migration
INSERT INTO public.migrations (migration_name, description)
VALUES ('001_create_schemas', 'Create fibonacci_core, nigredo_leads, and alquimista_platform schemas')
ON CONFLICT (migration_name) DO NOTHING;
