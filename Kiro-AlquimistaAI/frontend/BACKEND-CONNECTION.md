# 🔌 Guia de Conexão Frontend → Backend

## 📋 Pré-requisitos

1. Backend AWS deployado e funcionando
2. URL da API disponível
3. Credenciais de autenticação configuradas

## 🔧 Configuração

### 1. Variáveis de Ambiente

Edite o arquivo `.env.local`:

```bash
# URL do backend AWS
NEXT_PUBLIC_API_URL=https://api.alquimista.ai

# Para desenvolvimento local com backend local:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Endpoints Disponíveis

O frontend já está configurado para consumir os seguintes endpoints:

#### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/signup` - Cadastro de usuário
- `POST /auth/logout` - Logout
- `GET /auth/me` - Dados do usuário atual
- `POST /auth/forgot-password` - Recuperação de senha
- `POST /auth/reset-password` - Reset de senha

#### Agentes
- `GET /agents` - Listar todos os agentes
- `GET /agents/:id` - Detalhes de um agente
- `PATCH /agents/:id/toggle` - Ativar/desativar agente
- `PUT /agents/:id/config` - Atualizar configuração
- `GET /agents/:id/metrics` - Métricas do agente

#### Dashboard
- `GET /dashboard/metrics` - Métricas principais
- `GET /dashboard/charts?period=30d` - Dados para gráficos

## 🚀 Como Conectar

### Opção 1: Backend AWS (Produção)

1. Certifique-se que o backend está deployado na AWS
2. Configure a URL da API no `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.alquimista.ai
   ```
3. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Opção 2: Backend Local (Desenvolvimento)

1. Clone e rode o backend localmente na porta 3001
2. Configure a URL local no `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
3. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔍 Verificação

### Teste de Conexão

1. Abra o console do navegador (F12)
2. Tente fazer login em `/login`
3. Verifique as requisições na aba Network
4. Procure por chamadas para a API configurada

### Logs de Debug

O API client já está configurado com interceptors que logam:
- ✅ Requisições enviadas
- ✅ Respostas recebidas
- ❌ Erros de conexão

## 🛠️ Troubleshooting

### Erro: "Network Error"
- Verifique se o backend está rodando
- Confirme a URL da API no `.env.local`
- Verifique CORS no backend

### Erro: "401 Unauthorized"
- Token expirado ou inválido
- Faça login novamente
- Verifique se o backend está validando tokens corretamente

### Erro: "404 Not Found"
- Endpoint não existe no backend
- Verifique a documentação da API
- Confirme que o backend tem todas as rotas implementadas

## 📝 Estrutura de Dados

### Login Request
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "name": "João Silva",
    "email": "user@example.com",
    "plan": "professional"
  }
}
```

### Agent Response
```json
{
  "id": "agent-1",
  "name": "Qualificação de Leads",
  "description": "Qualifica leads automaticamente",
  "subnucleo": "nigredo",
  "isActive": true,
  "tier": "professional"
}
```

## 🔐 Autenticação

O frontend usa JWT tokens armazenados no Zustand com persistência:

1. Login → Recebe token
2. Token salvo no localStorage via Zustand persist
3. Todas as requisições incluem: `Authorization: Bearer {token}`
4. Middleware protege rotas que precisam de autenticação

## 📊 Estado da Aplicação

### AuthStore (Zustand)
- `user`: Dados do usuário logado
- `token`: JWT token
- `isAuthenticated`: Boolean
- `login()`: Função de login
- `logout()`: Função de logout

### AgentStore (Zustand)
- `agents`: Lista de agentes
- `loading`: Estado de carregamento
- `fetchAgents()`: Buscar agentes
- `toggleAgent()`: Ativar/desativar
- `updateConfig()`: Atualizar configuração

## 🎯 Próximos Passos

1. ✅ Configure `.env.local` com a URL correta
2. ✅ Teste o login
3. ✅ Verifique se os agentes carregam
4. ✅ Teste o dashboard
5. ✅ Valide as métricas

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Confirme que o backend está respondendo
3. Teste os endpoints diretamente (Postman/Insomnia)
4. Verifique a documentação da API

---

**Status**: Frontend pronto para conexão ✅
**Última atualização**: Janeiro 2024
