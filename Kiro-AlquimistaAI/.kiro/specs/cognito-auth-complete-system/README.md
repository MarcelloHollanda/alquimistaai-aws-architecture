# Spec: Sistema de Autenticação Cognito Completo

## Visão Geral

Esta spec define a implementação completa de um sistema de autenticação utilizando Amazon Cognito User Pools para a plataforma AlquimistaAI, incluindo:

- ✅ Login tradicional (e-mail/senha)
- ✅ Login social (Google e Facebook via OAuth)
- ✅ Recuperação de senha (forgot/reset)
- ✅ Cadastro de novos usuários com criação de empresa (multi-tenant)
- ✅ Sistema de papéis (Master, Admin, Operacional, Leitura)
- ✅ Configurações de perfil do usuário
- ✅ Configurações da empresa
- ✅ Gerenciamento de integrações externas

## Status

🟡 **Em Planejamento** - Spec aprovada, pronta para execução

## Documentos

- **[requirements.md](./requirements.md)** - Requisitos funcionais com user stories e acceptance criteria (padrão EARS)
- **[design.md](./design.md)** - Design técnico detalhado com arquitetura, componentes e fluxos
- **[tasks.md](./tasks.md)** - Lista de tarefas de implementação em ordem de execução

## Arquitetura

```
Frontend (Next.js 14)
    ↓
Amazon Cognito User Pool
    ↓
API Gateway + Lambda
    ↓
Aurora PostgreSQL (Multi-tenant)
    ↓
AWS Secrets Manager (Integrações)
```

## Stack Tecnológico

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- amazon-cognito-identity-js

### Backend
- AWS Lambda (Node.js 20)
- API Gateway HTTP
- Aurora PostgreSQL Serverless v2
- S3 (armazenamento de logomarcas)
- Secrets Manager (credenciais de integrações)

### Autenticação
- Amazon Cognito User Pools
- OAuth 2.0 (Google, Facebook)
- Cognito Hosted UI

## Principais Funcionalidades

### 1. Autenticação
- Login com e-mail/senha
- Login social (Google/Facebook)
- Logout seguro
- Refresh token rotation

### 2. Recuperação de Senha
- Solicitação de código por e-mail
- Redefinição de senha com código
- Validação de força de senha

### 3. Cadastro
- Wizard de 3 passos
- Dados pessoais (nome, e-mail, senha, telefone)
- Dados da empresa (nome, CNPJ, segmento, logo)
- Atribuição automática de papel Master para primeiro usuário

### 4. Multi-tenancy
- Isolamento de dados por tenant
- TenantId único por empresa
- Validação de tenant em todas as operações

### 5. Sistema de Papéis
- **Master**: Permissões totais (primeiro usuário)
- **Admin**: Gerenciamento de empresa e integrações
- **Operacional**: Uso da plataforma
- **Leitura**: Visualização apenas

### 6. Configurações
- Perfil: edição de dados pessoais, alteração de senha
- Empresa: edição de dados corporativos, upload de logo
- Integrações: conexão com Google, Meta, telefonia, etc.

## Segurança

- ✅ Tokens armazenados em cookies HttpOnly
- ✅ Cookies com flags Secure e SameSite
- ✅ Proteção de rotas com middleware
- ✅ Validação de permissões por papel
- ✅ Rate limiting no Cognito e API Gateway
- ✅ Credenciais de integrações no Secrets Manager
- ✅ Nunca armazenar dados sensíveis no frontend

## Como Executar

### 1. Revisar Documentos
Leia os documentos na seguinte ordem:
1. `requirements.md` - Entenda os requisitos
2. `design.md` - Entenda a arquitetura
3. `tasks.md` - Veja as tarefas de implementação

### 2. Iniciar Implementação
Abra o arquivo `tasks.md` e clique em "Start task" na primeira tarefa para começar a implementação.

### 3. Ordem de Execução
As tarefas devem ser executadas sequencialmente:
1. Infraestrutura (Cognito, S3)
2. Biblioteca cliente
3. Banco de dados
4. Backend (Lambda handlers)
5. Frontend (componentes e páginas)
6. Segurança e validações
7. Testes
8. Documentação

## Estimativa

- **Tempo total**: 28-38 horas
- **Complexidade**: Média-Alta
- **Dependências**: Cognito, S3, Secrets Manager, Aurora

## Requisitos Prévios

- [ ] Cognito User Pool criado ou configurado
- [ ] Bucket S3 para logomarcas
- [ ] Aurora PostgreSQL configurado
- [ ] API Gateway e Lambda configurados
- [ ] Variáveis de ambiente definidas

## Próximos Passos

Após completar esta spec:
1. Sistema de autenticação estará completo
2. Usuários poderão se cadastrar e fazer login
3. Multi-tenancy estará funcionando
4. Integrações poderão ser configuradas
5. Pronto para implementar funcionalidades de negócio

## Referências

- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Blueprint Comercial](../../.kiro/steering/blueprint-comercial-assinaturas.md)
- [Contexto do Projeto](../../.kiro/steering/contexto-projeto-alquimista.md)

## Contato

Para dúvidas sobre esta spec, consulte a documentação ou entre em contato com a equipe de desenvolvimento.
