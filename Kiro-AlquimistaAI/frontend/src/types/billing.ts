// Tipos para o sistema de checkout e pagamento

export type SubscriptionStatus = 'active' | 'pending' | 'cancelled' | 'past_due';
export type Periodicity = 'monthly' | 'annual';

export interface PlanInfo {
  id: string;
  name: string;
  periodicity: Periodicity;
}

export interface AgentInfo {
  id: string;
  name: string;
  priceMonthly: number;
}

export interface SubnucleoInfo {
  id: string;
  name: string;
  priceMonthly: number;
}

export interface PricingInfo {
  subtotal: number;
  taxes: number;
  total: number;
}

export interface SubscriptionSummary {
  tenantId: string;
  companyName: string;
  cnpj: string;
  plan: PlanInfo;
  agents: AgentInfo[];
  subnucleos: SubnucleoInfo[];
  pricing: PricingInfo;
  status: SubscriptionStatus;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}

export interface CreateCheckoutRequest {
  tenantId: string;
  planId: string;
  periodicity: Periodicity;
  selectedAgents: string[];
  selectedSubnucleos: string[];
}

export interface PaymentEvent {
  id: string;
  tenantId: string;
  eventType: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Schemas de validação usando Zod
import { z } from 'zod';

export const CreateCheckoutRequestSchema = z.object({
  tenantId: z.string().uuid('tenantId deve ser um UUID válido'),
  planId: z.string().uuid('planId deve ser um UUID válido'),
  periodicity: z.enum(['monthly', 'annual'], {
    errorMap: () => ({ message: 'periodicity deve ser monthly ou annual' }),
  }),
  selectedAgents: z.array(z.string().uuid()).default([]),
  selectedSubnucleos: z.array(z.string().uuid()).default([]),
});

export const SubscriptionSummarySchema = z.object({
  tenantId: z.string().uuid(),
  companyName: z.string().min(1),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).optional(),
  plan: z.object({
    id: z.string().uuid(),
    name: z.string(),
    periodicity: z.enum(['monthly', 'annual']),
  }),
  agents: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    priceMonthly: z.number().positive(),
  })),
  subnucleos: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    priceMonthly: z.number().positive(),
  })),
  pricing: z.object({
    subtotal: z.number().nonnegative(),
    taxes: z.number().nonnegative(),
    total: z.number().positive(),
  }),
  status: z.enum(['active', 'pending', 'cancelled', 'past_due']),
});

export type CreateCheckoutRequestValidated = z.infer<typeof CreateCheckoutRequestSchema>;
export type SubscriptionSummaryValidated = z.infer<typeof SubscriptionSummarySchema>;
