// Tipos compartilhados para o módulo de billing e assinaturas

export interface Agent {
  id: string;
  name: string;
  segment: string;
  description: string;
  tags: string[];
  priceMonthly: number;
  isActive: boolean;
}

export interface Subnucleo {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
}

export interface CommercialRequest {
  id?: string;
  tenantId?: string;
  companyName: string;
  cnpj?: string;
  contactName: string;
  email: string;
  whatsapp: string;
  selectedAgents: string[];
  selectedSubnucleos: string[];
  message: string;
  status?: 'pending' | 'contacted' | 'closed';
  createdAt?: Date;
}

export interface Trial {
  id?: string;
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  startedAt?: Date;
  expiresAt?: Date;
  usageCount?: number;
  maxUsage?: number;
  status?: 'active' | 'expired' | 'completed';
}

export interface TrialInvokeRequest {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  message: string;
}

export interface TrialInvokeResponse {
  response: string;
  remainingTokens: number;
  expiresAt: string;
}

export interface CheckoutSessionRequest {
  tenantId: string;
  selectedAgents: string[];
  totalAmount: number;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface Subscription {
  id?: string;
  tenantId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  selectedAgents: string[];
  totalMonthly: number;
  currency?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface PaymentEvent {
  id?: string;
  tenantId: string;
  eventType: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  providerSessionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}
