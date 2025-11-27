# 📋 Arquivos Envolvidos com Input no Sistema AlquimistaAI

## 🎯 Resumo Executivo

Este documento lista **TODOS** os arquivos envolvidos com componentes de input no sistema, organizados por categoria para facilitar a identificação e correção de problemas persistentes.

---

## 📦 1. COMPONENTE BASE DE INPUT

### `frontend/src/components/ui/input.tsx`
**Função:** Componente base reutilizável de input
**Status:** ✅ Implementado
**Características:**
- Usa React.forwardRef para refs
- Aceita todas as props de HTMLInputElement
- Aplica estilos via Tailwind com função `cn()`
- Suporta estados: focus, disabled, placeholder

**Dependências:**
- `@/lib/utils` (função `cn`)
- Tailwind CSS

---

## 🔐 2. COMPONENTES DE AUTENTICAÇÃO

### 2.1 Login

#### `frontend/src/app/(auth)/login/page.tsx`
**Função:** Página de login OAuth com Cognito
**Inputs:** Nenhum (usa OAuth flow)
**Status:** ✅ Implementado

#### `frontend/src/components/auth/login-form.tsx`
**Função:** Formulário de login com email/senha
**Inputs:**
- Email (type="email")
- Password (type="password")
**Validações:**
- Email obrigatório e formato válido
- Senha obrigatória (mínimo 8 caracteres)
**Dependências:**
- `@/hooks/use-auth`
- `@/lib/validators`
- `@/lib/cognito-errors`

### 2.2 Cadastro

#### `frontend/src/app/(auth)/signup/page.tsx`
**Função:** Página de cadastro
**Componentes:** RegisterWizard, SocialLoginButtons

#### `frontend/src/components/auth/register-wizard.tsx`
**Função:** Wizard de cadastro em 3 etapas
**Inputs (Etapa 1 - Dados Pessoais):**
- Nome completo (text)
- Email (email)
- Telefone (tel)
- Senha (password)
- Confirmar senha (password)

**Inputs (Etapa 2 - Dados da Empresa):**
- Nome fantasia (text)
- Razão social (text)
- CNPJ (text com máscara)
- Segmento (select)
- Logo (file upload)

**Validações:**
- Email: formato válido
- Senha: mínimo 8 caracteres, confirmação deve coincidir
- CNPJ: 14 dígitos
- Todos os campos obrigatórios marcados com *

### 2.3 Recuperação de Senha

#### `frontend/src/components/auth/forgot-password-form.tsx`
**Função:** Solicitar código de recuperação
**Inputs:**
- Email (email)
**Validações:**
- Email obrigatório e formato válido

#### `frontend/src/components/auth/reset-password-form.tsx`
**Função:** Redefinir senha com código
**Inputs:**
- Código de verificação (text, 6 dígitos)
- Nova senha (password)
- Confirmar nova senha (password)
**Validações:**
- Código: 6 dígitos
- Senha: validação completa (maiúsculas, minúsculas, números, especiais)
- Confirmação deve coincidir

---

## ⚙️ 3. COMPONENTES DE CONFIGURAÇÕES

### `frontend/src/components/settings/profile-tab.tsx`
**Função:** Edição de perfil do usuário
**Inputs:**
- Email (disabled)
- Role (disabled)
- Nome completo (text)
- Telefone (tel)
- Idioma (select)
- Fuso horário (select)

**Inputs (Alteração de Senha):**
- Senha atual (password)
- Nova senha (password)
- Confirmar nova senha (password)

**Validações:**
- Senhas devem coincidir
- Nova senha deve atender requisitos

### `frontend/src/components/settings/company-tab.tsx`
**Função:** Edição de dados da empresa
**Inputs:** (não listados no arquivo lido, mas provavelmente similares ao cadastro)

---

## 💳 4. COMPONENTES DE BILLING

### `frontend/src/components/billing/trial-modal.tsx`
**Função:** Modal de teste de IA
**Inputs:**
- Mensagem de chat (text)
**Características:**
- Suporta Enter para enviar
- Validação de limite de tokens

---

## 🛠️ 5. ARQUIVOS DE SUPORTE

### 5.1 Utilitários

#### `frontend/src/lib/utils.ts`
**Função:** Funções utilitárias
**Exports:**
- `cn()` - Combina classes CSS (clsx + tailwind-merge)
- `formatCurrency()` - Formata valores monetários
- `formatNumber()` - Formata números
- `formatDate()` - Formata datas
- `formatRelativeTime()` - Tempo relativo
- `sleep()` - Delay assíncrono

#### `frontend/src/lib/validators.ts`
**Função:** Validações de formulário
**Exports:**
- `validateEmail()` - Valida formato de email
- `validatePassword()` - Valida requisitos de senha
- Outras validações específicas

#### `frontend/src/lib/cognito-errors.ts`
**Função:** Tradução de erros do Cognito
**Export:**
- `translateCognitoError()` - Converte erros técnicos em mensagens amigáveis

### 5.2 Hooks

#### `frontend/src/hooks/use-auth.ts`
**Função:** Hook de autenticação
**Exports:**
- `signIn()` - Login
- `signUp()` - Cadastro
- `signOut()` - Logout
- `isLoading` - Estado de carregamento
- `user` - Dados do usuário

### 5.3 Estilos

#### `frontend/src/app/globals.css`
**Função:** Estilos globais e acessibilidade
**Características:**
- Tailwind base, components, utilities
- Estilos de acessibilidade (focus, high contrast, reduced motion)
- Tamanho mínimo de toque (44x44px)
- Variáveis CSS para temas (light/dark)
- **IMPORTANTE:** Define estilos para `input` via variável `--input`

---

## 🔍 6. POSSÍVEIS CAUSAS DE PROBLEMAS

### 6.1 Problemas de Estilo
- **Conflito de classes CSS:** Verificar se há conflitos entre Tailwind e estilos globais
- **Variável --input:** Pode estar sobrescrevendo estilos do componente
- **Focus states:** Múltiplas definições de focus podem causar conflitos

### 6.2 Problemas de Comportamento
- **Event handlers:** Verificar se onChange está sendo chamado corretamente
- **Refs:** Problemas com forwardRef podem causar perda de foco
- **Validações:** Validações síncronas podem bloquear input

### 6.3 Problemas de Acessibilidade
- **Min-height/width:** Regra global de 44px pode afetar layout
- **Focus-visible:** Pode estar interferindo com comportamento padrão
- **Aria attributes:** Verificar se estão corretos

---

## 🎯 7. CHECKLIST DE DIAGNÓSTICO

### Para identificar o problema persistente:

- [ ] **Testar Input isolado:** Criar página de teste com Input básico
- [ ] **Verificar console:** Erros JavaScript relacionados a eventos
- [ ] **Inspecionar DOM:** Verificar classes CSS aplicadas
- [ ] **Testar sem validações:** Remover temporariamente validações
- [ ] **Testar sem estilos globais:** Comentar regras de globals.css
- [ ] **Verificar dependências:** Versões de React, Tailwind, clsx
- [ ] **Testar em diferentes navegadores:** Chrome, Firefox, Safari
- [ ] **Verificar modo de produção:** Build vs desenvolvimento

---

## 📝 8. ARQUIVOS PARA INVESTIGAÇÃO PRIORITÁRIA

### Alta Prioridade:
1. `frontend/src/components/ui/input.tsx` - Componente base
2. `frontend/src/app/globals.css` - Estilos globais que podem interferir
3. `frontend/src/lib/utils.ts` - Função cn() usada no Input

### Média Prioridade:
4. `frontend/src/components/auth/login-form.tsx` - Uso mais comum
5. `frontend/src/components/auth/register-wizard.tsx` - Múltiplos inputs
6. `frontend/src/lib/validators.ts` - Validações que podem bloquear

### Baixa Prioridade:
7. Outros componentes que usam Input
8. Hooks e utilitários relacionados

---

## 🚨 9. AÇÕES RECOMENDADAS

### Imediatas:
1. **Criar página de teste:** `/test/input` com Input isolado
2. **Verificar console do navegador:** Erros em tempo real
3. **Testar com Input nativo:** Substituir temporariamente por `<input>` HTML

### Curto Prazo:
4. **Revisar globals.css:** Comentar regras de acessibilidade temporariamente
5. **Verificar versões:** package.json para conflitos de dependências
6. **Adicionar logs:** Console.log em onChange para debug

### Longo Prazo:
7. **Testes automatizados:** Adicionar testes para Input
8. **Documentação:** Documentar comportamento esperado
9. **Refatoração:** Se necessário, simplificar componente

---

## 📞 10. INFORMAÇÕES ADICIONAIS NECESSÁRIAS

Para diagnosticar melhor, precisamos saber:

1. **Qual é o comportamento exato do problema?**
   - Input não aceita digitação?
   - Input perde foco?
   - Input não atualiza valor?
   - Input tem delay na digitação?

2. **Em quais componentes ocorre?**
   - Todos os inputs?
   - Apenas em formulários específicos?
   - Apenas em páginas específicas?

3. **Quando começou?**
   - Após alguma mudança específica?
   - Sempre existiu?
   - Apenas em produção ou também em dev?

4. **Ambiente:**
   - Navegador e versão
   - Sistema operacional
   - Modo de execução (dev/prod)

---

## 📚 11. DEPENDÊNCIAS RELACIONADAS

```json
{
  "react": "^18.x",
  "next": "^14.x",
  "tailwindcss": "^3.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

---

**Última atualização:** 2025-01-19
**Responsável:** Kiro AI Assistant
**Status:** 🔴 Aguardando mais informações sobre o problema específico
