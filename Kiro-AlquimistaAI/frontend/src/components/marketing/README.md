# Componentes de Marketing

Componentes React para páginas de marketing e landing pages do Alquimista.AI.

## Componentes Disponíveis

### Hero
Seção hero principal com CTA, imagem/visual e trust indicators.

```tsx
import { Hero } from '@/components/marketing/hero';

<Hero />
```

**Features:**
- Animações com Framer Motion
- Responsive design
- CTAs primário e secundário
- Trust indicators
- Visual com stats cards animados

---

### Features
Grid de features/recursos com ícones e descrições.

```tsx
import { Features } from '@/components/marketing/features';

<Features />
```

**Features:**
- 9 features pré-configuradas
- Ícones Lucide React
- Animações on scroll
- Hover effects
- Gradientes customizáveis

---

### PricingTable
Tabela de preços com toggle mensal/anual.

```tsx
import { PricingTable } from '@/components/marketing/pricing-table';

<PricingTable />
```

**Features:**
- 3 planos (Starter, Pro, Enterprise)
- Toggle mensal/anual com desconto
- Plano destacado (Pro)
- Lista de features por plano
- CTAs customizados
- Cálculo automático de economia

---

### Testimonials
Carrossel de depoimentos de clientes.

```tsx
import { Testimonials } from '@/components/marketing/testimonials';

<Testimonials />
```

**Features:**
- 6 depoimentos pré-configurados
- Auto-play com controles manuais
- Navegação por setas e dots
- Ratings com estrelas
- Badges de resultados
- Stats section

---

### FAQ
Seção de perguntas frequentes com busca.

```tsx
import { FAQ } from '@/components/marketing/faq';

<FAQ />
```

**Features:**
- 4 categorias de perguntas
- Busca em tempo real
- Accordion animado
- Acessibilidade (ARIA)
- CTA para suporte

---

## Animações

Todas as animações estão centralizadas em `@/utils/animations.ts`.

### Uso Básico

```tsx
import { motion } from 'framer-motion';
import { fadeInUp, transitions, viewport } from '@/utils/animations';

<motion.div
  variants={fadeInUp}
  initial="initial"
  whileInView="animate"
  viewport={viewport}
  transition={transitions.smooth}
>
  Conteúdo animado
</motion.div>
```

### Animações Disponíveis

- `fadeInUp` - Fade in de baixo para cima
- `fadeInDown` - Fade in de cima para baixo
- `fadeInLeft` - Fade in da esquerda
- `fadeInRight` - Fade in da direita
- `scaleIn` - Scale in com fade
- `staggerContainer` - Container para stagger children
- `staggerItem` - Item com stagger
- `slideInBottom` - Slide in de baixo (modals)
- `slideInRight` - Slide in da direita (sidebars)
- `rotateIn` - Rotate in com fade
- `bounceIn` - Bounce in com spring

### Hover Effects

```tsx
import { hoverScale, hoverLift, cardHover } from '@/utils/animations';

<motion.div whileHover={hoverScale}>
  Hover para escalar
</motion.div>

<motion.div whileHover={cardHover}>
  Card com hover effect
</motion.div>
```

### Transitions

```tsx
import { transitions } from '@/utils/animations';

// Opções disponíveis:
transitions.default  // 0.3s ease-in-out
transitions.smooth   // 0.5s cubic-bezier
transitions.spring   // Spring animation
transitions.bounce   // Bounce spring
```

---

## Layout de Marketing

O layout específico para páginas de marketing está em `app/(marketing)/layout.tsx`.

**Inclui:**
- Header com navegação
- Logo e menu
- CTAs (Login/Signup)
- Footer
- Sticky header com backdrop blur

---

## Página Completa

Exemplo de página completa integrando todos os componentes:

```tsx
import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { PricingTable } from '@/components/marketing/pricing-table';
import { Testimonials } from '@/components/marketing/testimonials';
import { FAQ } from '@/components/marketing/faq';

export default function MarketingPage() {
  return (
    <div>
      <Hero />
      <Features />
      <Testimonials />
      <PricingTable />
      <FAQ />
    </div>
  );
}
```

---

## Customização

### Cores

Todos os componentes usam o sistema de cores do Tailwind configurado em `tailwind.config.ts`.

Gradientes principais:
- `from-purple-600 to-pink-600` - Primário
- `from-blue-500 to-cyan-500` - Secundário
- `from-green-500 to-emerald-500` - Sucesso

### Tipografia

- Headings: `font-bold` com tamanhos responsivos
- Body: `text-slate-600` para texto secundário
- Links: `text-purple-600 hover:text-purple-700`

### Espaçamento

- Sections: `py-20` (80px vertical)
- Containers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Grids: `gap-8` (32px)

---

## Acessibilidade

Todos os componentes seguem as melhores práticas de acessibilidade:

- Semantic HTML
- ARIA labels e roles
- Navegação por teclado
- Focus indicators
- Alt text em imagens
- Contraste adequado (WCAG AA)

---

## Performance

Otimizações implementadas:

- Lazy loading de componentes
- Animações otimizadas com Framer Motion
- Images otimizadas com Next.js Image
- Code splitting automático
- Viewport detection para animações

---

## Próximos Passos

- [ ] Adicionar mais variações de hero
- [ ] Criar componente de comparação de planos
- [ ] Implementar seção de integrações
- [ ] Adicionar mais templates de testimonials
- [ ] Criar variações de CTA sections
