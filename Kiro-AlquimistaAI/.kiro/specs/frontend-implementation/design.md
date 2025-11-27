# Design Document - Frontend AlquimistaAI

## Overview

Frontend moderno e responsivo para a plataforma AlquimistaAI, construído com Next.js 14 (App Router), TypeScript, Tailwind CSS e shadcn/ui. O design foca em performance, acessibilidade e experiência do usuário excepcional.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│                     Next.js 14 App                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Marketing  │  │     Auth     │  │   Dashboard  │     │
│  │    Routes    │  │    Routes    │  │    Routes    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Component Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  UI Components│  │   Business   │  │   Layout     │     │
│  │  (shadcn/ui) │  │  Components  │  │  Components  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                     State Management                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Zustand    │  │  React Query │  │    Context   │     │
│  │    Stores    │  │    Cache     │  │   Providers  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Client  │  │  WebSocket   │  │    Auth      │     │
│  │   (Axios)    │  │   Client     │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (AWS)                          │
│              https://api.alquimista.ai                       │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (marketing)/             # Public routes
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── pricing/
│   │   │   ├── about/
│   │   │   └── contact/
│   │   ├── (auth)/                  # Auth routes
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/             # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/                     # API routes
│   │   │   └── auth/
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── metrics-card.tsx
│   │   │   ├── agent-list.tsx
│   │   │   └── chart-widget.tsx
│   │   ├── agents/                  # Agent components
│   │   │   ├── agent-card.tsx
│   │   │   ├── agent-config.tsx
│   │   │   └── agent-metrics.tsx
│   │   ├── marketing/               # Marketing components
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   └── pricing-table.tsx
│   │   └── layout/                  # Layout components
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── api.ts                   # API client
│   │   ├── utils.ts                 # Utility functions
│   │   ├── constants.ts             # Constants
│   │   └── validators.ts            # Form validators
│   ├── hooks/
│   │   ├── use-agents.ts            # Agent hooks
│   │   ├── use-auth.ts              # Auth hooks
│   │   └── use-metrics.ts           # Metrics hooks
│   ├── stores/
│   │   ├── auth-store.ts            # Auth state
│   │   ├── agent-store.ts           # Agent state
│   │   └── ui-store.ts              # UI state
│   └── types/
│       ├── agent.ts                 # Agent types
│       ├── user.ts                  # User types
│       └── api.ts                   # API types
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── package.json
```

## Components and Interfaces

### Core Components

#### 1. Layout Components

**Header Component**
```typescript
interface HeaderProps {
  user?: User;
  onLogout: () => void;
}

// Features:
// - Logo and navigation
// - User menu dropdown
// - Mobile hamburger menu
// - Notifications bell
```

**Sidebar Component**
```typescript
interface SidebarProps {
  activeRoute: string;
  collapsed?: boolean;
  onToggle: () => void;
}

// Features:
// - Navigation menu
// - Subnúcleo grouping
// - Active state indication
// - Collapse/expand
```

#### 2. Dashboard Components

**MetricsCard Component**
```typescript
interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

// Features:
// - Animated counter
// - Trend indicator
// - Icon display
// - Responsive sizing
```

**AgentList Component**
```typescript
interface AgentListProps {
  agents: Agent[];
  onToggle: (agentId: string) => void;
  onConfigure: (agentId: string) => void;
  groupBy?: 'subnucleo' | 'status';
}

// Features:
// - Grid/list view toggle
// - Filter by subnúcleo
// - Search functionality
// - Bulk actions
```

**ChartWidget Component**
```typescript
interface ChartWidgetProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  title: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

// Features:
// - Multiple chart types
// - Interactive tooltips
// - Period selector
// - Export functionality
```

#### 3. Agent Components

**AgentCard Component**
```typescript
interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  metrics: AgentMetrics;
  onToggle: () => void;
  onConfigure: () => void;
}

// Features:
// - Status indicator
// - Quick metrics
// - Toggle switch
// - Configure button
```

**AgentConfig Component**
```typescript
interface AgentConfigProps {
  agent: Agent;
  config: AgentConfiguration;
  onSave: (config: AgentConfiguration) => void;
  onCancel: () => void;
}

// Features:
// - Dynamic form fields
// - Validation
// - Preview mode
// - Save/cancel actions
```

#### 4. Marketing Components

**Hero Component**
```typescript
interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

// Features:
// - Animated text
// - CTA button
// - Background video/image
// - Responsive layout
```

**PricingTable Component**
```typescript
interface PricingTableProps {
  plans: PricingPlan[];
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
}

// Features:
// - Plan comparison
// - Feature list
// - Highlight popular plan
// - Annual/monthly toggle
```

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  avatar?: string;
  plan: 'free' | 'professional' | 'business' | 'enterprise';
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
  lastLogin: Date;
}
```

### Agent Model

```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  subnucleo: 'nigredo' | 'hermes' | 'sophia' | 'atlas' | 'oracle';
  icon: string;
  isActive: boolean;
  configuration: AgentConfiguration;
  metrics: AgentMetrics;
  tier: 'starter' | 'professional' | 'enterprise';
}

interface AgentConfiguration {
  [key: string]: any; // Dynamic based on agent type
}

interface AgentMetrics {
  executionCount: number;
  successRate: number;
  lastExecution: Date;
  avgResponseTime: number;
}
```

### Dashboard Metrics Model

```typescript
interface DashboardMetrics {
  leadsProcessed: number;
  conversionRate: number;
  activeAgents: number;
  timeSaved: number; // in hours
  trends: {
    leadsProcessed: number; // percentage change
    conversionRate: number;
    activeAgents: number;
    timeSaved: number;
  };
}
```

## API Integration

### API Client Setup

```typescript
// lib/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Endpoints

```typescript
// lib/api/agents.ts
export const agentsAPI = {
  list: () => apiClient.get<Agent[]>('/agents'),
  get: (id: string) => apiClient.get<Agent>(`/agents/${id}`),
  toggle: (id: string, active: boolean) => 
    apiClient.patch(`/agents/${id}/toggle`, { active }),
  configure: (id: string, config: AgentConfiguration) =>
    apiClient.put(`/agents/${id}/config`, config),
  metrics: (id: string) => 
    apiClient.get<AgentMetrics>(`/agents/${id}/metrics`),
};

// lib/api/dashboard.ts
export const dashboardAPI = {
  metrics: () => apiClient.get<DashboardMetrics>('/dashboard/metrics'),
  charts: (period: string) => 
    apiClient.get<ChartData[]>(`/dashboard/charts?period=${period}`),
};

// lib/api/auth.ts
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  signup: (data: SignupData) =>
    apiClient.post('/auth/signup', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get<User>('/auth/me'),
};
```

## State Management

### Zustand Stores

```typescript
// stores/auth-store.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    const { data } = await authAPI.login(email, password);
    localStorage.setItem('auth_token', data.token);
    set({ user: data.user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false });
  },
  fetchUser: async () => {
    const { data } = await authAPI.me();
    set({ user: data, isAuthenticated: true });
  },
}));

// stores/agent-store.ts
interface AgentState {
  agents: Agent[];
  loading: boolean;
  fetchAgents: () => Promise<void>;
  toggleAgent: (id: string) => Promise<void>;
  updateConfig: (id: string, config: AgentConfiguration) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  fetchAgents: async () => {
    set({ loading: true });
    const { data } = await agentsAPI.list();
    set({ agents: data, loading: false });
  },
  toggleAgent: async (id) => {
    const agent = get().agents.find(a => a.id === id);
    if (!agent) return;
    
    await agentsAPI.toggle(id, !agent.isActive);
    set({
      agents: get().agents.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ),
    });
  },
  updateConfig: async (id, config) => {
    await agentsAPI.configure(id, config);
    set({
      agents: get().agents.map(a =>
        a.id === id ? { ...a, configuration: config } : a
      ),
    });
  },
}));
```

## Styling and Theming

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5f0',
          100: '#ffe8db',
          500: '#FF6B35', // Main brand color
          600: '#e65a2a',
          700: '#cc4d1f',
        },
        secondary: {
          500: '#004E89', // Secondary brand color
          600: '#003d6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'counter': 'counter 2s ease-out',
      },
    },
  },
};
```

### CSS Variables

```css
/* app/globals.css */
:root {
  --primary: 15 85% 55%;
  --secondary: 205 100% 27%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --radius: 0.5rem;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 0 0% 100%;
}
```

## Error Handling

### Error Boundary

```typescript
// components/error-boundary.tsx
'use client';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// lib/error-handler.ts
export const handleAPIError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'Erro no servidor';
    toast.error(message);
  } else if (error.request) {
    // Request made but no response
    toast.error('Sem resposta do servidor');
  } else {
    // Something else happened
    toast.error('Erro inesperado');
  }
};
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

```typescript
// components/__tests__/agent-card.test.tsx
describe('AgentCard', () => {
  it('renders agent information correctly', () => {
    const agent = mockAgent();
    render(<AgentCard agent={agent} />);
    expect(screen.getByText(agent.name)).toBeInTheDocument();
  });

  it('toggles agent status on switch click', async () => {
    const onToggle = jest.fn();
    render(<AgentCard agent={mockAgent()} onToggle={onToggle} />);
    
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    
    expect(onToggle).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/dashboard.spec.ts
test('user can view dashboard metrics', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="metrics-card"]')).toHaveCount(4);
  await expect(page.locator('text=Leads Processados')).toBeVisible();
});
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
const AgentConfig = dynamic(() => import('@/components/agents/agent-config'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/hero-image.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
/>
```

### Caching Strategy

```typescript
// React Query for data caching
const { data: agents } = useQuery({
  queryKey: ['agents'],
  queryFn: agentsAPI.list,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

## Security Considerations

1. **XSS Protection**: Sanitize all user inputs
2. **CSRF Protection**: Use CSRF tokens in forms
3. **Content Security Policy**: Strict CSP headers
4. **Authentication**: JWT tokens with refresh mechanism
5. **Rate Limiting**: Client-side throttling for API calls

## Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Readers**: Proper ARIA labels and roles
3. **Color Contrast**: WCAG 2.1 AA compliant
4. **Focus Management**: Visible focus indicators
5. **Semantic HTML**: Proper heading hierarchy

---

*Design Document v1.0 - Janeiro 2024*
