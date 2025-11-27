# CHECKPOINT 11 — Testes Manuais Cognito + Dashboards (DEV)

## 1. Metadados

- **Data da execução**: <!19/11/2025>
- **Responsável**: <Marcello Hollanda>
- **Ambiente**: DEV (`us-east-1`)
- **User Pool**: `fibonacci-users-dev`
- **Frontend**: `http://localhost:3000` (ou URL CloudFront DEV, se aplicável)

---

## 2. Usuários de Teste (Cognito DEV)

| E-mail                          | Grupo Cognito       | Tipo de Usuário     | Dashboard Esperado        |
|---------------------------------|---------------------|---------------------|---------------------------|
| jmrhollanda@gmail.com          | INTERNAL_ADMIN      | Equipe interna      | Dashboard interno empresa |
| alquimistafibonacci@gmail.com  | INTERNAL_SUPPORT    | Equipe interna      | Dashboard interno empresa |
| marcello@c3comercial.com.br    | TENANT_ADMIN        | Cliente (admin)     | Dashboard do cliente      |
| leylany@c3comercial.com.br     | TENANT_USER         | Cliente (usuário)   | Dashboard do cliente      |

---

## 3. Cenários Testados

### 3.1. INTERNAL_ADMIN — jmrhollanda@gmail.com

**URL inicial de login**: `/login`

**Fluxo esperado**:
1. Usuário clica em "Entrar"
2. Redireciona para Hosted UI do Cognito
3. Login com e-mail/senha do Cognito
4. Redireciona para **dashboard interno da empresa** (ex.: `/app/company`)
5. Acesso permitido a visão multi-tenant
6. Tentativa manual de acessar `/app/dashboard` deve ser bloqueada ou redirecionada

**Resultado real**:
- **Status**: <!-- OK / NOK -->
- **URL final após login**: <!-- ex.: /app/company -->
- **Observações**: 
  <!-- 
  Exemplos de observações:
  - Print da tela de login anexado
  - Erros encontrados (se houver)
  - Comportamento diferente do esperado
  - Tempo de resposta
  - Mensagens exibidas
  -->

---

### 3.2. INTERNAL_SUPPORT — alquimistafibonacci@gmail.com

**Fluxo esperado**:
- Igual ao INTERNAL_ADMIN quanto ao redirecionamento para `/app/company`
- Com permissões compatíveis com suporte (sem poderes de admin, se aplicável)

**Resultado real**:
- **Status**: <!-- OK / NOK -->
- **URL final após login**: <!-- ex.: /app/company -->
- **Observações**: 
  <!--
  - Verificar se permissões de suporte estão corretas
  - Confirmar que não tem acesso a funcionalidades de admin
  - Documentar qualquer diferença em relação ao INTERNAL_ADMIN
  -->

---

### 3.3. TENANT_ADMIN — marcello@c3comercial.com.br

**Fluxo esperado**:
1. Login via `/login`
2. Redirecionamento para **dashboard do cliente** (ex.: `/app/dashboard`)
3. Visualização de dados **apenas** do tenant associado (C3)
4. Tentativa de acesso a `/app/company` deve ser bloqueada ou redirecionada

**Resultado real**:
- **Status**: <!-- OK / NOK -->
- **URL final após login**: <!-- ex.: /app/dashboard -->
- **Observações**: 
  <!--
  - Confirmar isolamento de dados do tenant
  - Verificar se consegue ver apenas dados da C3
  - Testar acesso negado a rotas internas
  -->
- **Indícios de isolamento correto de dados entre tenants?**: <!-- Sim/Não + comentários -->

---

### 3.4. TENANT_USER — leylany@c3comercial.com.br

**Fluxo esperado**:
- Redirecionamento para `/app/dashboard`
- Permissões mais restritas que o TENANT_ADMIN (somente o que o backend permitir)
- Nenhum acesso ao dashboard interno

**Resultado real**:
- **Status**: <!-- OK / NOK -->
- **URL final após login**: <!-- ex.: /app/dashboard -->
- **Observações**: 
  <!--
  - Verificar restrições em relação ao TENANT_ADMIN
  - Confirmar que não tem acesso a funcionalidades administrativas
  - Documentar limitações de permissões
  -->

---

## 4. Verificações Gerais

- [ ] Hosted UI do Cognito está funcionando sem erros
- [ ] Callback `/auth/callback` está processando corretamente o token
- [ ] Logout (se testado) redireciona para a tela de login esperada
- [ ] Erros de autenticação retornam mensagens claras (sem vazar detalhes sensíveis)
- [ ] Redirecionamentos condizem com o grupo do usuário (INTERNAL_* vs TENANT_*)

**Observações gerais**:
<!--
Espaço para comentários livres sobre:
- Performance geral do sistema
- UX do fluxo de login
- Problemas encontrados
- Sugestões de melhoria
- Comportamentos inesperados
-->

---

## 5. Conclusão do Checkpoint 11

**Resultado geral dos testes manuais**:
<!-- APROVADO / APROVADO COM RESSALVAS / REPROVADO -->

**Pendências identificadas**:
<!--
Listar pendências, se houver:
- Exemplo: Ajustar mensagem de erro na tela de login
- Exemplo: Melhorar tempo de resposta do callback
- Exemplo: Corrigir redirecionamento para usuários TENANT_USER
-->

**Ações recomendadas**:
<!--
Listar ações recomendadas:
- Exemplo: Ajustar texto de erro para ser mais claro
- Exemplo: Melhorar UX do fluxo de login
- Exemplo: Adicionar loading spinner durante autenticação
- Exemplo: Implementar mensagem de boas-vindas após login
-->

---

## 6. Anexos

**Prints de tela** (se aplicável):
<!-- 
Adicionar referências a prints salvos:
- Screenshot 1: Tela de login Hosted UI
- Screenshot 2: Dashboard interno (INTERNAL_ADMIN)
- Screenshot 3: Dashboard do cliente (TENANT_ADMIN)
- Screenshot 4: Mensagem de erro (se houver)
-->

**Logs relevantes** (se aplicável):
<!--
Colar logs importantes do console do navegador ou do backend:
- Erros de autenticação
- Warnings relevantes
- Informações de debug úteis
-->

---

## 7. Assinaturas

**Testador**: _________________________ Data: ___/___/______

**Revisor**: _________________________ Data: ___/___/______

**Aprovador**: _________________________ Data: ___/___/______

---

## 8. Histórico de Revisões

| Versão | Data       | Autor | Descrição                          |
|--------|------------|-------|------------------------------------|
| 1.0    | ___/___/___|       | Criação do documento               |
|        |            |       |                                    |
|        |            |       |                                    |

---

**Nota**: Este documento deve ser preenchido durante a execução dos testes manuais e pode ser reutilizado em futuras validações, auditorias ou testes de regressão.
