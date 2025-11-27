# Guia Rápido - Responsividade

## 🎯 Breakpoints

```
320px  → Mobile mínimo
640px  → sm: (Small)
768px  → md: (Medium - Tablets)
1024px → lg: (Large - Desktop)
1280px → xl: (Extra Large)
```

## 📱 Menu Mobile

### Hook
```typescript
import { useMobileMenu } from '@/hooks/use-mobile-menu';

const { isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();
```

### Botão Hambúrguer
```tsx
{isMobile && (
  <Button
    id="mobile-menu-button"
    onClick={toggleMobileMenu}
    className="md:hidden"
  >
    <Menu className="h-5 w-5" />
  </Button>
)}
```

### Sidebar Mobile
```tsx
<aside className={cn(
  'fixed left-0 top-16 z-40',
  isMobile && !isMobileMenuOpen && '-translate-x-full',
  isMobile && isMobileMenuOpen && 'translate-x-0',
  !isMobile && 'w-64'
)}>
```

## 🎨 Classes Úteis

### Visibilidade
```css
hidden sm:flex          /* Oculta mobile, mostra desktop */
md:hidden               /* Oculta desktop, mostra mobile */
hidden sm:inline        /* Texto oculto em mobile */
```

### Layout
```css
flex-col sm:flex-row    /* Coluna mobile, linha desktop */
p-4 sm:p-6 lg:p-8      /* Padding progressivo */
md:ml-64                /* Margem apenas desktop */
w-full max-w-7xl mx-auto /* Container responsivo */
```

### Texto
```css
text-xs sm:text-sm      /* Fonte menor mobile */
text-xl sm:text-2xl     /* Título responsivo */
line-clamp-2            /* Limita a 2 linhas */
whitespace-nowrap       /* Sem quebra de linha */
```

### Touch
```css
touch-manipulation      /* Melhor resposta ao toque */
min-h-[44px]           /* Área mínima clicável */
active:bg-muted        /* Feedback visual */
```

### Overflow
```css
overflow-x-auto        /* Scroll horizontal */
overflow-hidden        /* Sem scroll */
```

## 📊 Componentes

### MetricsCard
```tsx
<MetricsCard
  title="Total"
  value={1234}
  className="w-full"  // Full width em mobile
/>
```

### DataTable
```tsx
<DataTable
  data={data}
  columns={columns}
  // Automaticamente responsiva
/>
```

### LineChart
```tsx
<LineChart
  data={data}
  dataKeys={['value']}
  height={300}  // Ajusta automaticamente
/>
```

## 🔧 Padrões Comuns

### Grid Responsivo
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### Flex Responsivo
```tsx
<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
  {/* Conteúdo */}
</div>
```

### Container
```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Conteúdo */}
</div>
```

### Card Responsivo
```tsx
<Card className="w-full">
  <CardHeader className="p-4 sm:p-6">
    <CardTitle className="text-lg sm:text-xl">
      Título
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4 sm:p-6">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

## ✅ Checklist Rápido

### Ao Criar Novo Componente

- [ ] Testado em 320px (mobile mínimo)
- [ ] Testado em 768px (tablet)
- [ ] Testado em 1280px+ (desktop)
- [ ] Botões com min-h-[44px]
- [ ] Texto legível em mobile
- [ ] Sem scroll horizontal indesejado
- [ ] Touch-friendly (classe `touch-manipulation`)
- [ ] Feedback visual ao tocar (`:active`)

### Ao Criar Tabela

- [ ] `overflow-x-auto` no container
- [ ] `whitespace-nowrap` nas células
- [ ] Texto menor em mobile (`text-xs sm:text-sm`)
- [ ] Paginação responsiva

### Ao Criar Formulário

- [ ] Labels acima dos inputs em mobile
- [ ] Inputs com largura total
- [ ] Botões com largura adequada
- [ ] Espaçamento adequado entre campos

## 🚀 Comandos Úteis

### Testar Responsividade
```bash
# Chrome DevTools
Ctrl+Shift+M (Windows/Linux)
Cmd+Shift+M (Mac)

# Firefox
Ctrl+Shift+M (Windows/Linux)
Cmd+Option+M (Mac)
```

### Inspecionar Breakpoints
```javascript
// No console do navegador
window.innerWidth  // Largura atual
```

## 📚 Referências Rápidas

- [Tailwind Responsive](https://tailwindcss.com/docs/responsive-design)
- [Touch Guidelines](https://web.dev/mobile-touch/)
- [Mobile UX](https://web.dev/mobile-ux/)
