// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  groups?: string[];
  tenantId?: string;
}

// JWT Token type
export interface JWT {
  sub: string;
  email: string;
  'cognito:groups'?: string[];
  'custom:tenant_id'?: string;
  [key: string]: any;
}
