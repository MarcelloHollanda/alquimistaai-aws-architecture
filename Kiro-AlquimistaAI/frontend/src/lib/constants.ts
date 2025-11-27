export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.alquimista.ai';

export const SUBNUCLEOS = {
  NIGREDO: 'nigredo',
  HERMES: 'hermes',
  SOPHIA: 'sophia',
  ATLAS: 'atlas',
  ORACLE: 'oracle',
} as const;

export const SUBNUCLEO_LABELS = {
  [SUBNUCLEOS.NIGREDO]: 'Vendas e Conversão',
  [SUBNUCLEOS.HERMES]: 'Marketing Digital',
  [SUBNUCLEOS.SOPHIA]: 'Atendimento ao Cliente',
  [SUBNUCLEOS.ATLAS]: 'Operações e Gestão',
  [SUBNUCLEOS.ORACLE]: 'Inteligência e Analytics',
} as const;

export const SUBNUCLEO_COLORS = {
  [SUBNUCLEOS.NIGREDO]: 'bg-purple-500',
  [SUBNUCLEOS.HERMES]: 'bg-blue-500',
  [SUBNUCLEOS.SOPHIA]: 'bg-green-500',
  [SUBNUCLEOS.ATLAS]: 'bg-orange-500',
  [SUBNUCLEOS.ORACLE]: 'bg-pink-500',
} as const;

export const PLANS = {
  FREE: 'free',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;

export const PLAN_LABELS = {
  [PLANS.FREE]: 'Gratuito',
  [PLANS.PROFESSIONAL]: 'Professional',
  [PLANS.BUSINESS]: 'Business',
  [PLANS.ENTERPRISE]: 'Enterprise',
} as const;

export const PLAN_PRICES = {
  [PLANS.FREE]: 0,
  [PLANS.PROFESSIONAL]: 497,
  [PLANS.BUSINESS]: 1497,
  [PLANS.ENTERPRISE]: 4997,
} as const;

export const ROUTES = {
  // Rotas Públicas
  ROOT: '/',                          // Porta de entrada do app (login/redirecionamento)
  INSTITUTIONAL: '/institucional',    // Página institucional pública (grupo (institutional))
  PUBLIC_BILLING: '/billing',         // Página de planos/assinaturas públicas (grupo (public-billing))
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // Autenticação (Cognito OAuth) - Rotas físicas em /login e /auth/*
  LOGIN: '/login',                    // Rota oficial de login com Cognito OAuth (física: (auth)/login)
  SIGNUP: '/signup',                  // Rota de cadastro
  AUTH_CALLBACK: '/auth/callback',    // Callback OAuth do Cognito
  AUTH_LOGOUT: '/auth/logout',        // Logout do Cognito
  
  // Dashboard do Cliente (Tenant) - Rotas físicas em (dashboard)/*
  DASHBOARD: '/dashboard',
  DASHBOARD_OVERVIEW: '/dashboard',
  DASHBOARD_AGENTS: '/dashboard/agents',
  DASHBOARD_FIBONACCI: '/dashboard/fibonacci',
  DASHBOARD_DISPARO_AGENDA: '/dashboard/disparo-agenda',
  DASHBOARD_INTEGRATIONS: '/dashboard/integrations',
  DASHBOARD_USAGE: '/dashboard/usage',
  DASHBOARD_SUPPORT: '/dashboard/support',
  
  // Rotas de Configuração (Tenant) - Rotas físicas em (dashboard)/*
  AGENTS: '/agents',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  ONBOARDING: '/onboarding',
  
  // Painel Operacional Interno (Company) - Rotas físicas em (company)/*
  COMPANY: '/company',
  COMPANY_OVERVIEW: '/company',
  COMPANY_TENANTS: '/company/tenants',
  COMPANY_AGENTS: '/company/agents',
  COMPANY_INTEGRATIONS: '/company/integrations',
  COMPANY_OPERATIONS: '/company/operations',
  COMPANY_BILLING: '/company/billing',
} as const;
