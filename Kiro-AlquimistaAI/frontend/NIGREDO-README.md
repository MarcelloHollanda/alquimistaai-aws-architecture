# Nigredo Frontend - Guia de Implementação

## 📋 Visão Geral

Frontend do **Nigredo - Núcleo de Prospecção B2B** integrado ao ecossistema AlquimistaAI.

### Características
- ✅ Next.js 14 + TypeScript + App Router
- ✅ Herda identidade visual do AlquimistaAI
- ✅ React Query para data fetching
- ✅ Tailwind CSS para estilos
- ✅ Framer Motion para animações
- ✅ Totalmente acessível (WCAG 2.1)

## 🚀 Quick Start

### 1. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` e configure:

```env
NEXT_PUBLIC_NIGREDO_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000/nigredo`

### 4. Build para Produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Código

```
frontend/
├── src/
│   ├── app/
│   │   ├── (nigredo)/              # Páginas do Nigredo
│   │   │   ├── layout.tsx          # Layout com tema AlquimistaAI
│   │   │   ├── page.tsx            # Painel principal
│   │   │   ├── agentes/            # Página de agentes
│   │   │   ├── pipeline/           # Pipeline de leads
│   │   │   ├── conversas/          # Conversas ativas
│   │   │   ├── agendamentos/       # Reuniões agendadas
│   │   │   ├── relatorios/         # Relatórios
│   │   │   └── governanca/         # LGPD e governança
│   │   └── (institutional)/        # Páginas institucionais
│   ├── components/
│   │   ├── nigredo/                # Componentes específicos (futuro)
│   │   └── ui/                     # Componentes compartilhados
│   ├── hooks/
│   │   └── use-nigredo.ts          # React Query hooks
│   └── lib/
│       └── nigredo-api.ts          # Cliente API
```

## 🎨 Identidade Visual

### Tema Herdado do AlquimistaAI

O Nigredo **não possui um tema visual próprio**. Ele herda completamente o tema do AlquimistaAI:

- **Tipografia**: Inter (mesma fonte)
- **Cores base**: Sistema de cores do AlquimistaAI
- **Componentes**: Reutiliza todos os componentes UI
- **Layout**: Mesma estrutura de navegação e footer

### Marca Nigredo

O que diferencia o Nigredo:

- **Cor de destaque**: Rosa/Vermelho (`from-pink-500 to-red-500`)
- **Ícone**: Chama (Flame)
- **Nome**: "Nigredo - Núcleo de Prospecção B2B"

### Exemplo de Uso

```tsx
// ✅ CORRETO - Herda tema AlquimistaAI
<div className="bg-white rounded-xl p-6 shadow-lg">
  <h3 className="text-xl font-bold text-slate-800">Título</h3>
</div>

// ✅ CORRETO - Adiciona cor de destaque Nigredo
<div className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
  Nigredo
</div>

// ❌ ERRADO - Não criar novo tema
<div className="bg-nigredo-primary text-nigredo-text">
  // Não fazer isso!
</div>
```

## 🔌 Integração com API

### Cliente API

O cliente está em `src/lib/nigredo-api.ts`:

```typescript
import { nigredoApiMethods } from '@/lib/nigredo-api';

// Criar lead
const response = await nigredoApiMethods.createLead({
  name: 'João Silva',
  email: 'joao@example.com',
  message: 'Gostaria de saber mais'
});

// Listar leads
const leads = await nigredoApiMethods.listLeads({
  page: 1,
  limit: 20,
  status: 'novo'
});

// Obter lead
const lead = await nigredoApiMethods.getLead('lead-id');
```

### React Query Hooks

Os hooks estão em `src/hooks/use-nigredo.ts`:

```typescript
import { useLeads, useLead, useCreateLead } from '@/hooks/use-nigredo';

function MyComponent() {
  // Listar leads
  const { data, isLoading, error } = useLeads({ page: 1, limit: 20 });

  // Obter lead específico
  const { data: lead } = useLead('lead-id');

  // Criar lead (mutation)
  const createLead = useCreateLead();
  
  const handleSubmit = async (formData) => {
    await createLead.mutateAsync(formData);
  };

  return (
    // ...
  );
}
```

## 📄 Páginas Implementadas

### 1. Painel Principal (`/nigredo`)

**Status**: ✅ Implementado

**Funcionalidades**:
- Cards de métricas (total leads, novos, qualificados, etc.)
- Métricas de performance (conversão, resposta, agendamento)
- Status do pipeline por etapa
- Status dos 7 agentes

**Dados**: Mock (aguardando endpoints da API)

### 2. Agentes (`/nigredo/agentes`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Card para cada um dos 7 agentes
- Status (ativo/inativo)
- Métricas individuais
- Descrição e funcionalidades

### 3. Pipeline (`/nigredo/pipeline`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Listagem de leads com filtros
- Paginação
- Busca
- Ordenação
- Link para detalhes

### 4. Detalhes do Lead (`/nigredo/pipeline/[id]`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Informações completas do lead
- Timeline de interações
- Histórico de webhooks
- Ações (editar, qualificar, etc.)

### 5. Conversas (`/nigredo/conversas`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Lista de conversas ativas
- Filtro por canal (WhatsApp, Email)
- Análise de sentimento
- Link para detalhes

### 6. Agendamentos (`/nigredo/agendamentos`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Calendário de reuniões
- Lista de próximas reuniões
- Filtros por data
- Integração com Google Calendar

### 7. Relatórios (`/nigredo/relatorios`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Resumo de métricas
- Gráficos de conversão
- Exportação de dados
- Filtros por período

### 8. Governança (`/nigredo/governanca`)

**Status**: ⏳ Pendente

**Funcionalidades planejadas**:
- Informações sobre LGPD
- Políticas de uso de dados
- SLOs e SLAs
- Conformidade

## 🧪 Testes

### Rodar Testes (quando implementados)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Deploy

### Deploy em S3 + CloudFront

1. **Build estático**:
```bash
npm run build
```

2. **Upload para S3**:
```bash
aws s3 sync out/ s3://your-bucket-name/ --delete
```

3. **Invalidar CloudFront**:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Deploy Automatizado (CDK)

O deploy será gerenciado pelo CDK Stack do Nigredo Frontend (Task 8 do plano).

## 🔧 Troubleshooting

### Erro: "NEXT_PUBLIC_NIGREDO_API_BASE_URL is not defined"

**Solução**: Configure a variável no `.env.local`:
```env
NEXT_PUBLIC_NIGREDO_API_BASE_URL=https://your-api-url
```

### Erro: "Network Error" ao chamar API

**Possíveis causas**:
1. API Gateway não está rodando
2. CORS não configurado
3. URL incorreta

**Solução**: Verifique:
- URL da API no `.env.local`
- CORS no API Gateway
- Logs do CloudWatch

### Dados não aparecem no Painel

**Causa**: Endpoints da API ainda não implementados

**Solução**: O painel usa dados mock. Quando os endpoints estiverem prontos, os hooks React Query buscarão dados reais automaticamente.

## 📚 Recursos

### Documentação
- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Projeto
- **Backend API**: `lambda/nigredo/NIGREDO-API-COMPLETE.md`
- **Design**: `.kiro/specs/nigredo-prospecting-core/design.md`
- **Requirements**: `.kiro/specs/nigredo-prospecting-core/requirements.md`
- **Status**: `frontend/NIGREDO-FRONTEND-STATUS.md`

## 🤝 Contribuindo

### Adicionar Nova Página

1. Criar arquivo em `src/app/(nigredo)/nova-pagina/page.tsx`
2. Seguir padrão visual do AlquimistaAI
3. Usar hooks do `use-nigredo.ts`
4. Adicionar link na navegação do `layout.tsx`

### Adicionar Novo Hook

1. Adicionar método em `src/lib/nigredo-api.ts`
2. Criar hook em `src/hooks/use-nigredo.ts`
3. Usar React Query patterns
4. Adicionar types TypeScript

### Adicionar Novo Componente

1. Criar em `src/components/nigredo/`
2. Reutilizar componentes UI existentes
3. Seguir padrões de acessibilidade
4. Adicionar testes

## 📞 Suporte

Para questões sobre o frontend do Nigredo:
1. Verificar `NIGREDO-FRONTEND-STATUS.md`
2. Consultar documentação do backend
3. Verificar logs do navegador (Console)
4. Verificar Network tab (DevTools)

---

**Status Atual**: Frontend parcialmente implementado (infraestrutura + painel principal)
**Próximo Passo**: Implementar páginas restantes
**Última Atualização**: 2025-01-15
