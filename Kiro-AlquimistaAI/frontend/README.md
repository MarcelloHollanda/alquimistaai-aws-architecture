# 🎨 AlquimistaAI Frontend

Frontend moderno da plataforma AlquimistaAI construído com Next.js 14, TypeScript e Tailwind CSS.

## 🚀 Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Deploy**: Vercel / AWS Amplify

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/            # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/       # Rotas do dashboard
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── (marketing)/       # Rotas públicas
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── pricing/
│   │   │   └── about/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── dashboard/         # Componentes do dashboard
│   │   ├── agents/            # Componentes de agentes
│   │   └── marketing/         # Componentes de marketing
│   ├── lib/
│   │   ├── api.ts            # Cliente API
│   │   ├── utils.ts          # Utilitários
│   │   └── constants.ts      # Constantes
│   ├── hooks/                # Custom hooks
│   ├── stores/               # Zustand stores
│   └── types/                # TypeScript types
├── public/
│   ├── images/
│   └── icons/
└── package.json
```

## 🎯 Funcionalidades

### Homepage (Marketing)
- Hero section com CTA
- Demonstração de agentes
- Pricing plans
- Testimonials
- FAQ

### Dashboard
- Overview com métricas principais
- Gestão de agentes (ativar/desativar)
- Analytics e relatórios
- Configurações de conta

### Agentes
- Visualização de todos os 32 agentes
- Configuração individual
- Métricas de performance
- Logs de execução

## 🛠️ Setup Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=https://api.alquimista.ai
NEXT_PUBLIC_API_KEY=your_api_key

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 📦 Build e Deploy

### Build de Produção

```bash
npm run build
npm start
```

### Deploy na Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy na AWS Amplify

```bash
# Instalar Amplify CLI
npm i -g @aws-amplify/cli

# Configurar
amplify init
amplify add hosting
amplify publish
```

## 🎨 Temas e Cores

### Paleta de Cores

```css
/* Primary (Laranja) */
--primary: 15 85% 55%;        /* #FF6B35 */

/* Secondary (Azul) */
--secondary: 205 100% 27%;    /* #004E89 */

/* Accent (Verde) */
--accent: 142 76% 36%;        /* #28A745 */

/* Neutral */
--background: 0 0% 100%;      /* #FFFFFF */
--foreground: 222 47% 11%;    /* #1A202C */
```

## 📱 Responsividade

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Todos os componentes são mobile-first e totalmente responsivos.

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📚 Documentação de Componentes

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">
  Click me
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## 🔐 Autenticação

Usando NextAuth.js para autenticação:

```tsx
import { signIn, signOut, useSession } from 'next-auth/react'

const { data: session } = useSession()

if (session) {
  // User is logged in
}
```

## 📊 State Management

Usando Zustand para gerenciamento de estado:

```tsx
import { useStore } from '@/stores/useStore'

const { agents, fetchAgents } = useStore()
```

## 🚀 Performance

- **Lazy Loading**: Componentes carregados sob demanda
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automático pelo Next.js
- **Caching**: SWR para cache de dados

## 🎯 Roadmap

- [ ] Dashboard completo
- [ ] Gestão de agentes
- [ ] Analytics avançado
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Internacionalização (i18n)
- [ ] PWA support

---

*Frontend v1.0 - Janeiro 2024*


## 🔌 Configuração do Backend

### Trocar Ambiente

Use o script helper para alternar entre ambientes:

```bash
# Desenvolvimento Local (padrão)
node scripts/switch-env.js local

# Produção AWS
node scripts/switch-env.js prod

# URL Customizada
node scripts/switch-env.js custom https://sua-api.com
```

### Configuração Manual

Edite `frontend/.env.local`:

```bash
# Para desenvolvimento local
NEXT_PUBLIC_API_URL=http://localhost:3001

# Para produção AWS
NEXT_PUBLIC_API_URL=https://api.alquimista.ai
```

Após alterar, reinicie o servidor:
```bash
npm run dev
```

## 📡 Status da Conexão

- **URL Atual**: Configurada em `.env.local`
- **Verificar**: Console do navegador (F12) → Network tab
- **Documentação**: Ver `BACKEND-CONNECTION.md`
