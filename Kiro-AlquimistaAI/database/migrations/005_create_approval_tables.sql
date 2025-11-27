-- Migration: Create approval flow tables
-- Requirements: 14.4

-- Approval requests table
CREATE TABLE IF NOT EXISTS alquimista_platform.approval_requests (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES alquimista_platform.tenants(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES alquimista_platform.users(id),
    action_type VARCHAR(100) NOT NULL, -- e.g., 'agent.delete', 'user.role_change', 'data.export'
    resource_type VARCHAR(50) NOT NULL, -- e.g., 'agent', 'user', 'data'
    resource_id VARCHAR(255), -- Optional: specific resource ID
    action_details JSONB NOT NULL, -- Details about the action to be performed
    approvers TEXT NOT NULL, -- JSON array of user IDs who can approve
    required_approvals INTEGER NOT NULL DEFAULT 1, -- 1 or 2 step approval
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired, cancelled
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Approval decisions table
CREATE TABLE IF NOT EXISTS alquimista_platform.approval_decisions (
    id SERIAL PRIMARY KEY,
    approval_id VARCHAR(255) NOT NULL REFERENCES alquimista_platform.approval_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES alquimista_platform.users(id),
    decision VARCHAR(10) NOT NULL, -- 'approve' or 'reject'
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(approval_id, approver_id) -- Each approver can only decide once
);

-- Notifications table (for notifying users about pending approvals)
CREATE TABLE IF NOT EXISTS alquimista_platform.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES alquimista_platform.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'approval_required', 'approval_approved', 'approval_rejected'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_approval_requests_tenant ON alquimista_platform.approval_requests(tenant_id);
CREATE INDEX idx_approval_requests_status ON alquimista_platform.approval_requests(status);
CREATE INDEX idx_approval_requests_requested_by ON alquimista_platform.approval_requests(requested_by);
CREATE INDEX idx_approval_requests_expires_at ON alquimista_platform.approval_requests(expires_at);
CREATE INDEX idx_approval_decisions_approval ON alquimista_platform.approval_decisions(approval_id);
CREATE INDEX idx_notifications_user ON alquimista_platform.notifications(user_id);
CREATE INDEX idx_notifications_read ON alquimista_platform.notifications(read);

-- Comments
COMMENT ON TABLE alquimista_platform.approval_requests IS 'Stores approval requests for critical actions requiring 1-2 step approval';
COMMENT ON TABLE alquimista_platform.approval_decisions IS 'Stores individual approval decisions from authorized approvers';
COMMENT ON TABLE alquimista_platform.notifications IS 'Stores notifications for users about pending actions';

COMMENT ON COLUMN alquimista_platform.approval_requests.approvers IS 'JSON array of user IDs who are authorized to approve this request';
COMMENT ON COLUMN alquimista_platform.approval_requests.required_approvals IS 'Number of approvals required (1 or 2)';
COMMENT ON COLUMN alquimista_platform.approval_requests.action_details IS 'JSON object containing details about the action to be performed';
