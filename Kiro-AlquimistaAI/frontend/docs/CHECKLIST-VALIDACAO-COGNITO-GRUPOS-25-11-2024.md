# ✅ Checklist de Validação - Grupos Cognito

**Data**: 25/11/2024

---

## 📋 Pré-requisitos

- [ ] AWS CLI instalado e configurado
- [ ] Credenciais AWS válidas
- [ ] Acesso ao User Pool do Cognito
- [ ] Servidor Next.js rodando em `localhost:3000`

---

## 🔧 Etapa 1: Configuração de Grupos

### Via Script Automatizado

- [ ] Navegou para `frontend/scripts`
- [ ] Executou `.\setup-cognito-groups.ps1`
- [ ] Script encontrou o User Pool
- [ ] Grupos criados com sucesso
- [ ] Usuário selecionado
- [ ] Grupo selecionado (Admins ou Users)
- [ ] Usuário adicionado ao grupo
- [ ] Validação final passou

### Via AWS CLI Manual

- [ ] Obteve User Pool ID
- [ ] Criou grupo `Admins`
- [ ] Criou grupo `Users`
- [ ] Listou usuários disponíveis
- [ ] Adicionou usuário ao grupo
- [ ] Verificou grupos do usuário

---

## 🧪 Etapa 2: Validação no AWS Console

- [ ] Acessou AWS Console Cognito
- [ ] Navegou para User Pool
- [ ] Verificou seção "Groups"
- [ ] Confirmou que grupos existem
- [ ] Verificou seção "Users"
- [ ] Confirmou que usuário pertence a um grupo

---

## 🔄 Etapa 3: Preparação para Teste

- [ ] Abriu console do navegador (F12)
- [ ] Executou `localStorage.clear()`
- [ ] Executou `sessionStorage.clear()`
- [ ] Fechou todas as abas do navegador
- [ ] Reabriu navegador
- [ ] Reiniciou servidor Next.js (opcional mas recomendado)

---

## 🎯 Etapa 4: Teste de Login

### Acesso

- [ ] Acessou `http://localhost:3000/auth/login`
- [ ] Página de login carregou corretamente
- [ ] Botão "Login com Cognito" visível

### Login

- [ ] Clicou em "Login com Cognito"
- [ ] Redirecionado para página do Cognito
- [ ] Inseriu credenciais
- [ ] Clicou em "Sign in"

### Callback

- [ ] Redirecionado para `/auth/callback`
- [ ] Viu mensagem "Processando autenticação..."
- [ ] Não viu erro `invalid_grant`
- [ ] Não viu logs duplicados

---

## 📊 Etapa 5: Validação de Logs

### Logs Esperados no Console

- [ ] `[Callback] Processando callback OAuth` (aparece 1x)
- [ ] `[Callback] Código recebido: ...`
- [ ] `[Cognito] Trocando código por tokens`
- [ ] `[Cognito] Tokens obtidos`
- [ ] `[Callback] Tokens obtidos`
- [ ] `[Callback] Tokens armazenados em cookies`
- [ ] `[Auth Store] Processando autenticação`
- [ ] `[Auth Store] Claims extraídos: { "cognito:groups": [...] }`
- [ ] Grupos aparecem no array (não vazio)
- [ ] `[Auth Store] Autenticação configurada`
- [ ] `[Auth Store] Rota determinada: { route: "..." }`
- [ ] `[Callback] Redirecionando para: ...`

### Validação de Grupos

- [ ] Array `cognito:groups` não está vazio
- [ ] Contém `"Admins"` OU `"Users"`
- [ ] Rota determinada corretamente:
  - `Admins` → `/app/company`
  - `Users` → `/app/dashboard`

---

## 🎨 Etapa 6: Validação de Redirecionamento

### Se Grupo = Admins

- [ ] Redirecionado para `/app/company`
- [ ] Página do painel da empresa carregou
- [ ] Sidebar mostra opções de admin
- [ ] Sem erros no console

### Se Grupo = Users

- [ ] Redirecionado para `/app/dashboard`
- [ ] Página do dashboard do tenant carregou
- [ ] Sidebar mostra opções de usuário
- [ ] Sem erros no console

---

## 🔍 Etapa 7: Validação de Token

### No Console do Navegador

```javascript
// Executar no console
const cookies = document.cookie.split(';');
const idTokenCookie = cookies.find(c => c.includes('idToken'));
if (idTokenCookie) {
  const token = idTokenCookie.split('=')[1];
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Grupos:', payload['cognito:groups']);
}
```

- [ ] Comando executado sem erro
- [ ] Grupos exibidos corretamente
- [ ] Grupos correspondem ao esperado

---

## ❌ Troubleshooting

### Se Grupos Ainda Não Aparecem

- [ ] Verificou que grupos foram criados no Cognito
- [ ] Verificou que usuário foi adicionado ao grupo
- [ ] Fez logout completo
- [ ] Limpou localStorage e sessionStorage
- [ ] Fechou e reabriu navegador
- [ ] Fez novo login

### Se Erro `invalid_grant` Persiste

- [ ] Verificou que arquivo callback foi atualizado
- [ ] Reiniciou servidor Next.js
- [ ] Limpou cache do navegador
- [ ] Tentou em janela anônima
- [ ] Verificou que não há múltiplas abas processando callback

### Se Redirecionamento Não Funciona

- [ ] Verificou logs no console
- [ ] Confirmou que grupos aparecem no token
- [ ] Verificou que rota foi determinada corretamente
- [ ] Verificou que não há erros de middleware
- [ ] Verificou que rotas existem no Next.js

---

## ✅ Validação Final

### Checklist de Sucesso

- [ ] ✅ Login completo sem erros
- [ ] ✅ Grupos detectados no token
- [ ] ✅ Redirecionamento correto
- [ ] ✅ Dashboard carregado
- [ ] ✅ Sidebar apropriada exibida
- [ ] ✅ Sem erros no console
- [ ] ✅ Navegação funciona corretamente

---

## 📝 Notas Adicionais

### Informações Importantes

- Grupos são **obrigatórios** para o sistema funcionar
- Cada usuário deve ter **pelo menos um grupo**
- Grupos determinam **acesso e permissões**
- Após adicionar ao grupo, **logout/login é necessário**

### Próximos Passos Após Validação

1. Testar navegação entre páginas
2. Testar funcionalidades específicas do dashboard
3. Validar permissões baseadas em grupos
4. Testar logout e novo login

---

## 🎯 Status Final

**Data de Validação**: ___/___/______

**Resultado**:
- [ ] ✅ Todos os testes passaram
- [ ] ⚠️ Alguns testes falharam (especificar abaixo)
- [ ] ❌ Validação não concluída

**Observações**:
```
[Espaço para anotações]
```

---

**Última Atualização**: 25/11/2024
