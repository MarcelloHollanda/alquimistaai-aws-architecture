-- Seed 002: Default Role-Based Permissions
-- Purpose: Create default permissions for each role (admin, manager, operator, viewer)
-- Requirements: 14.3

-- ============================================================================
-- Admin Role Permissions (Full Access)
-- ============================================================================

-- Admin can manage all agents
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'admin', 'agent', 'manage'),
    (gen_random_uuid(), 'role', 'admin', 'agent', 'execute'),
    (gen_random_uuid(), 'role', 'admin', 'agent', 'read'),
    (gen_random_uuid(), 'role', 'admin', 'agent', 'write'),
    (gen_random_uuid(), 'role', 'admin', 'agent', 'delete')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Admin can manage all users
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'admin', 'user', 'manage'),
    (gen_random_uuid(), 'role', 'admin', 'user', 'read'),
    (gen_random_uuid(), 'role', 'admin', 'user', 'write'),
    (gen_random_uuid(), 'role', 'admin', 'user', 'delete')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Admin can manage tenant settings
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'admin', 'tenant', 'manage'),
    (gen_random_uuid(), 'role', 'admin', 'tenant', 'read'),
    (gen_random_uuid(), 'role', 'admin', 'tenant', 'write')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Admin can manage all data
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'admin', 'data', 'manage'),
    (gen_random_uuid(), 'role', 'admin', 'data', 'read'),
    (gen_random_uuid(), 'role', 'admin', 'data', 'write'),
    (gen_random_uuid(), 'role', 'admin', 'data', 'delete')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- ============================================================================
-- Manager Role Permissions (Agent Management + Reports)
-- ============================================================================

-- Manager can manage agents (activate/deactivate)
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'manager', 'agent', 'manage'),
    (gen_random_uuid(), 'role', 'manager', 'agent', 'execute'),
    (gen_random_uuid(), 'role', 'manager', 'agent', 'read'),
    (gen_random_uuid(), 'role', 'manager', 'agent', 'write')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Manager can read users (but not modify)
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'manager', 'user', 'read')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Manager can read tenant settings (but not modify)
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'manager', 'tenant', 'read')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Manager can read and write data
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'manager', 'data', 'read'),
    (gen_random_uuid(), 'role', 'manager', 'data', 'write')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- ============================================================================
-- Operator Role Permissions (Execute Agents + View Dashboards)
-- ============================================================================

-- Operator can execute and read agents (but not manage)
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'operator', 'agent', 'execute'),
    (gen_random_uuid(), 'role', 'operator', 'agent', 'read')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Operator can read data
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'operator', 'data', 'read'),
    (gen_random_uuid(), 'role', 'operator', 'data', 'write')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- ============================================================================
-- Viewer Role Permissions (Read-Only Access)
-- ============================================================================

-- Viewer can only read agents
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'viewer', 'agent', 'read')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Viewer can only read data
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'viewer', 'data', 'read')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Viewer can read tenant settings
INSERT INTO alquimista_platform.permissions (
    id, subject_type, subject_id, resource_type, action
) VALUES
    (gen_random_uuid(), 'role', 'viewer', 'tenant', 'read')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- ============================================================================
-- Business Hours Constraint for Operators
-- ============================================================================

-- Update operator agent execution permission to only allow during business hours
UPDATE alquimista_platform.permissions
SET constraints = jsonb_build_object(
    'timeWindow', jsonb_build_object(
        'start', '08:00',
        'end', '18:00'
    ),
    'allowedDays', jsonb_build_array(1, 2, 3, 4, 5)
)
WHERE subject_type = 'role'
  AND subject_id = 'operator'
  AND resource_type = 'agent'
  AND action = 'execute';

-- ============================================================================
-- Summary
-- ============================================================================

-- Count permissions by role
DO $$
DECLARE
    admin_count INTEGER;
    manager_count INTEGER;
    operator_count INTEGER;
    viewer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM alquimista_platform.permissions WHERE subject_id = 'admin';
    SELECT COUNT(*) INTO manager_count FROM alquimista_platform.permissions WHERE subject_id = 'manager';
    SELECT COUNT(*) INTO operator_count FROM alquimista_platform.permissions WHERE subject_id = 'operator';
    SELECT COUNT(*) INTO viewer_count FROM alquimista_platform.permissions WHERE subject_id = 'viewer';
    
    RAISE NOTICE 'Default permissions created:';
    RAISE NOTICE '  Admin: % permissions', admin_count;
    RAISE NOTICE '  Manager: % permissions', manager_count;
    RAISE NOTICE '  Operator: % permissions', operator_count;
    RAISE NOTICE '  Viewer: % permissions', viewer_count;
END $$;
