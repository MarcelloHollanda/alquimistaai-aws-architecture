# Fluxo de Trabalho ChatGPT ⇄ Kiro - AlquimistaAI

## Introdução

Este documento define o fluxo oficial de trabalho entre o ChatGPT e o Kiro no contexto do projeto AlquimistaAI. Estabelece as regras de continuidade entre chats, comportamentos esperados e protocolos de comunicação entre as duas ferramentas.

**Conceito fundamental**: ChatGPT atua como **cérebro/orquestrador** que gera blueprints, enquanto Kiro atua como **mãos/executor** que implementa blueprints dentro do repositório.

---

## Visão Geral do Ciclo ChatGPT ⇄ Kiro

### Papéis Definidos

- **ChatGPT**: Assistente externo sem acesso direto ao repositório
  - Gera blueprints e planos de ação
  - Analisa contexto e propõe soluções
  - Depende de informações fornecidas pelo usuário

- **Kiro**: Executor dentro do repositório
  - Acessa e modifica arquivos diretamente
  - Executa comandos no ambiente
  - Gera relatórios de estado para o ChatGPT

### Diagrama do Fluxo

```
[Quando @@Ativar é usado no ChatGPT]
Usuário → @@Ativar + RESUMO-PARA-CHATGPT → ChatGPT
                                              ↓
                                    Gera blueprint
                                              ↓
                        Usuário → Kiro → Repositório

[Quando @@Ativar é usado no Kiro]
Usuário → @@Ativar + blueprint → Kiro
                                   ↓
                          Executa ações
                                   ↓
              Gera/Atualiza RESUMO-PARA-CHATGPT + Relatórios
                                   ↓
                  Usuário → ChatGPT (novo @@Ativar)
```

**Princípio**: O fluxo é um **ciclo contínuo**, não ações isoladas. Cada sessão continua exatamente de onde a anterior parou.

---

## Comando Oficial @@Ativar e Apelidos

### Comando Canônico

**`@@Ativar`** → Comando oficial documentado para continuidade de contexto

### Apelidos Aceitos

Para conveniência do usuário, os seguintes apelidos são tratados como `@@Ativar`:

- **`#Ativar`** → Quando digitado no ChatGPT
- **`##Ativar`** → Quando digitado no Kiro

### Significado

Todos significam: **"Continuar exatamente de onde paramos no último ciclo desse projeto/contexto"**

---

## Como o ChatGPT Lê o Estado do Projeto na Prática

### Limitação Fundamental

**ChatGPT não acessa arquivos diretamente** no repositório nem no computador local.

Ele só enxerga:
- Texto colado pelo usuário na conversa
- Arquivos anexados manualmente pelo usuário
- O que já está registrado na memória histórica da conversa

### Padrão RESUMO-PARA-CHATGPT

Para resolver essa limitação, existe o padrão **RESUMO-PARA-CHATGPT**:

#### O que é

Arquivo(s) de resumo focado em fornecer contexto ao ChatGPT, contendo:
- Estado atual (o que já está pronto)
- Arquivos importantes alterados
- Erros ou pendências principais
- Próximos passos sugeridos
- Qual foi o último blueprint executado

#### Onde fica

Exemplos de localização:
- `.kiro/specs/<nome-do-componente>/RESUMO-PARA-CHATGPT.md`
- `docs/RESUMO-PARA-CHATGPT-<TEMA>.md`
- `frontend/docs/RESUMO-PARA-CHATGPT.md`

#### Quando é criado/atualizado

Após cada sessão relevante no Kiro, o Kiro deve:
1. Gerar ou atualizar o arquivo RESUMO-PARA-CHATGPT
2. Incluir informações essenciais para continuidade
3. Manter formato conciso e objetivo

### Passo a Passo para Atualizar o ChatGPT

Quando o usuário quiser continuar no ChatGPT com `@@Ativar`:

1. **Abrir** o arquivo RESUMO-PARA-CHATGPT correspondente ao componente/tema
2. **Copiar** os trechos relevantes (ou arquivo completo)
3. **Colar** junto com o comando `@@Ativar` na conversa com o ChatGPT
4. **Opcionalmente** anexar o arquivo completo se disponível

**Só então** o ChatGPT "lê" essas informações e gera o próximo blueprint com base no estado real.

---

## Fluxo Quando @@Ativar é Usado no ChatGPT

### Comportamento Esperado do ChatGPT

Quando o usuário envia para o ChatGPT:
- `@@Ativar` (ou `#Ativar`)
- + conteúdo do RESUMO-PARA-CHATGPT (copiado do repositório)

O ChatGPT deve:

1. **Ler o resumo colado** pelo usuário
2. **Cruzar com memória histórica** (se houver contexto anterior)
3. **Identificar**:
   - Em qual componente/tema estamos (micro agente, observabilidade, CI/CD, frontend, etc.)
   - Qual foi o último blueprint que ele mesmo gerou para o Kiro
   - O que o Kiro já executou (segundo o resumo)
4. **Fazer perguntas essenciais** apenas se houver ambiguidade crítica
5. **Gerar um único blueprint** em Markdown contendo:
   - Contexto atual (resumido)
   - Objetivo da sessão
   - Arquivos que o Kiro deve ler
   - Arquivos a criar/editar
   - Comandos para o usuário rodar (normalmente via Kiro ou na máquina)
   - Critérios de aceitação da sessão

### Fluxo Simplificado

```
Usuário envia:
  @@Ativar + RESUMO-PARA-CHATGPT
         ↓
ChatGPT analisa:
  - Lê resumo
  - Identifica contexto
  - Verifica último blueprint
         ↓
ChatGPT gera:
  Blueprint em Markdown
         ↓
Usuário copia blueprint
         ↓
Usuário cola no Kiro
```

### O que o ChatGPT NÃO deve fazer

- ❌ Assumir que tem acesso direto ao repositório
- ❌ Tentar "ler" arquivos sem que sejam colados
- ❌ Criar resumos automáticos não solicitados
- ❌ Iniciar tarefas sem blueprint claro

---

## Fluxo Quando @@Ativar é Usado no Kiro

### Comportamento Esperado do Kiro

Quando o usuário cola no Kiro:
- `@@Ativar` (ou `##Ativar`)
- + blueprint gerado pelo ChatGPT

O Kiro deve:

1. **Ler este fluxo de steering** (este documento)
2. **Ler o blueprint colado** pelo usuário
3. **Ler arquivos extras** especificados no blueprint:
   - tasks.md, design.md, requirements.md
   - IMPLEMENTATION-STATUS.md
   - Outros arquivos relevantes
4. **Fazer perguntas pontuais** ao usuário se necessário:
   - Path do repositório
   - Branch a usar
   - Valores de variáveis
5. **Executar o que o blueprint manda**:
   - Criar/editar arquivos
   - Rodar comandos (apenas os listados no blueprint)
   - **NUNCA** rodar `terraform apply` ou ações destrutivas sem aprovação explícita
6. **Ao finalizar, atualizar**:
   - Relatórios da spec/componente (ex.: `RELATORIO-SESSAO-ATUAL.md`, `IMPLEMENTATION-STATUS.md`)
   - **Sempre** gerar ou atualizar o `RESUMO-PARA-CHATGPT` do componente em foco

### Fluxo Simplificado

```
Usuário cola:
  @@Ativar + Blueprint do ChatGPT
         ↓
Kiro lê:
  - Steering
  - Blueprint
  - Arquivos especificados
         ↓
Kiro pergunta:
  - Confirmações necessárias
         ↓
Kiro executa:
  - Cria/edita arquivos
  - Roda comandos
         ↓
Kiro atualiza:
  - Relatórios
  - RESUMO-PARA-CHATGPT
         ↓
Usuário volta ao ChatGPT
  com novo @@Ativar + RESUMO atualizado
```

### O que o Kiro NÃO deve fazer

- ❌ Assumir conhecimento de sessões anteriores sem ler arquivos
- ❌ Criar resumos automáticos não solicitados
- ❌ Executar comandos destrutivos sem aprovação
- ❌ Ignorar o blueprint fornecido

---

## Regra de Continuidade entre Sessões

### Objetivo do Fluxo

**"Garantir que, ao usar @@Ativar, tanto ChatGPT quanto Kiro continuem exatamente da última ação documentada, em vez de recomeçar o raciocínio do zero."**

### Como Garantir Continuidade

Toda sessão relevante deve deixar rastro:

1. **Kiro** → atualiza relatórios e RESUMO-PARA-CHATGPT
2. **ChatGPT** → gera blueprints que podem ser mencionados/resumidos nesses relatórios

### Se Não Houver Resumo ou Relatório Claro

O padrão recomendado é:

1. **Primeiro**: Usuário pede ao Kiro um relatório/RESUMO-PARA-CHATGPT
2. **Depois**: Usuário cola esse resumo no ChatGPT com @@Ativar

### Princípios Fundamentais

- Cada nova sessão começa com `@@Ativar`
- O contexto é reconstruído através dos documentos de steering e RESUMO-PARA-CHATGPT
- O histórico está nos arquivos, não na memória do chat
- O objetivo é sempre dar continuidade ao estado mais recente, não recomeçar

---

## Política de Não-Sumarização

### Regra Fundamental

**O Kiro NÃO deve criar resumos automáticos** ao final de cada sessão, a menos que explicitamente solicitado pelo usuário.

### Justificativa

- Os resumos criam ruído documental
- O contexto real está nos arquivos do projeto
- Resumos podem conter informações desatualizadas
- O usuário sabe o que foi feito e não precisa de recapitulação

### Exceções

Resumos são permitidos apenas quando:

1. **Explicitamente solicitados** pelo usuário
2. **Parte de uma documentação formal** (specs, design docs, etc.)
3. **Necessários para handoff** entre diferentes contextos de trabalho

---

## Política Anti-Loop de Resumos (Global)

### Objetivo

Evitar o comportamento de "loop de sumarização" onde cada sessão gera múltiplos documentos redundantes de resumo, índice e quick-start para a mesma fase do projeto.

### Regras Fundamentais

1. **Não transformar toda sessão em "sessão de resumo"**
   - Se já existem documentos de resumo e índice suficientes para uma fase (ex.: deploy do micro agente), priorize SEMPRE a próxima ação concreta (scripts, terraform, código, testes)
   - Execução > Documentação

2. **Criar no máximo 1 arquivo de resumo por macro-etapa**
   - Exemplo de macro-etapas:
     - Preparação de deploy DEV
     - Ajustes de configuração
     - Deploy DEV executado
     - Deploy PROD executado
   - Se já houver `RESUMO-PREPARACAO-DEPLOY-COMPLETO.md` ou `PRONTO-PARA-DEPLOY.md`, **NÃO** crie novos resumos equivalentes
   - Atualize os existentes com pequenos trechos, se necessário

3. **Evitar criar vários arquivos com o mesmo propósito**
   - Se já existem:
     - `RESUMO-PREPARACAO-DEPLOY-COMPLETO.md`
     - `PRONTO-PARA-DEPLOY.md`
     - `QUICK-START-DEPLOY.md`
     - `INDEX-DEPLOY.md`
   - **NÃO** criar novos arquivos do tipo `RESUMO-*`, `SESSAO-*`, `INDEX-*`, `QUICK-START-*` para a mesma fase

4. **Comportamento quando o fundador pedir DEPLOY ou EXECUÇÃO**
   - Se o usuário pedir explicitamente:
     - "deploy", "terraform apply", "executar scripts", "rodar testes", "fazer o próximo passo"
   - ENTÃO:
     - **PRIORIDADE 1**: Guiar a execução dos comandos (scripts PowerShell, terraform, testes)
     - **PRIORIDADE 2**: Opcionalmente, criar UM pequeno registro de log, como `LOG-DEPLOY-DEV-YYYY-MM-DD.md`, com:
       - 5–10 linhas: o que foi feito, comandos usados, resultado
       - Não criar árvores novas de docs nem múltiplos resumos para essa mesma execução

5. **Log em vez de super-resumo**
   - Para ações operacionais (deploy, apply, testes), prefira:
     - Arquivos de log curtos (`LOG-DEPLOY-DEV-YYYY-MM-DD.md`) em vez de resumos longos
   - Os grandes resumos conceituais (design, preparação, alinhamento) já existem e não devem ser recriados

6. **Respeitar a Política de Não-Sumarização**
   - Se a Política de Não-Sumarização disser para evitar resumos automáticos, siga isso literalmente:
     - Não gerar "resumos da sessão" a cada interação
     - Só criar ou atualizar um resumo quando:
       - Fecharmos uma macro-etapa importante; **E**
       - O usuário pedir explicitamente ou o blueprint mandar de forma clara

7. **Proibição explícita de "Summarize and continue in a new session"**
   - A frase "Summarize and continue in a new session" é considerada **LEGADO** e **NÃO deve ser usada**
   - Quando o fundador terminar uma sessão, não gere prompts ou instruções dizendo para "continuar em uma nova sessão"
   - Apenas faça o que o blueprint ou o fundador pedem:
     - Editar arquivos
     - Criar scripts
     - Ajustar Terraform
     - Ou, se solicitado, gerar um único resumo curto ou log da ação

### Aplicação Prática

**Quando o usuário pede "deploy" ou "próximo passo":**
- ✅ Executar comandos (scripts, terraform)
- ✅ Criar 1 log curto opcional (5-10 linhas)
- ❌ Criar novos resumos/índices/quick-starts
- ❌ Recriar documentação já existente

**Quando o usuário pede "resumo" ou "documentar":**
- ✅ Verificar se já existe documentação adequada
- ✅ Atualizar documentação existente se necessário
- ✅ Criar novo documento apenas se não houver equivalente
- ❌ Criar múltiplos documentos redundantes

---

---

## Estrutura do RESUMO-PARA-CHATGPT

### Formato Recomendado

```markdown
# 📋 RESUMO PARA ENVIAR AO CHATGPT

## Contexto
- Repositório: [caminho]
- Componente/Tema: [nome]
- Última sessão: [data]

## Estado Atual

### O que está pronto
- [x] Item 1 completo
- [x] Item 2 completo
- [ ] Item 3 em andamento

### Arquivos importantes alterados
- `path/to/file1.ts` - [descrição da mudança]
- `path/to/file2.md` - [descrição da mudança]

## Erros ou Pendências

### Erros conhecidos
1. [Descrição do erro 1]
2. [Descrição do erro 2]

### Pendências principais
- [ ] Tarefa pendente 1
- [ ] Tarefa pendente 2

## Último Blueprint Executado

[Resumo do último blueprint que o ChatGPT gerou e o Kiro executou]

## Próximos Passos Sugeridos

1. [Sugestão 1]
2. [Sugestão 2]

## Informações Técnicas Relevantes

[Configurações, variáveis de ambiente, endpoints, etc.]
```

### Princípios do RESUMO-PARA-CHATGPT

- **Conciso**: Apenas informações essenciais
- **Objetivo**: Fatos, não opiniões
- **Atualizado**: Reflete o estado mais recente
- **Acionável**: Permite ao ChatGPT gerar próximo blueprint

---

## Comandos e Gatilhos

### @@Ativar (e apelidos)

**Uso**: Iniciar ou retomar contexto de trabalho

**No ChatGPT**:
1. Usuário envia: `@@Ativar` + RESUMO-PARA-CHATGPT
2. ChatGPT analisa contexto
3. ChatGPT gera blueprint
4. Usuário copia blueprint para o Kiro

**No Kiro**:
1. Usuário cola: `@@Ativar` + blueprint
2. Kiro lê steering e blueprint
3. Kiro executa ações
4. Kiro atualiza RESUMO-PARA-CHATGPT
5. Usuário volta ao ChatGPT com novo ciclo

### Modo Execução DevOps (Agente Executor)

**Quando usar**: Para rodar scripts, Terraform ou comandos de deploy/validação.

**Como invocar**:
```
"Usar o Agente Executor DevOps para [ação desejada]"
```

**Exemplos**:
- "Usar o Agente Executor DevOps para depurar erro do build"
- "Usar o Agente Executor DevOps para executar terraform apply"
- "Usar o Agente Executor DevOps para validar secrets"

**Comportamento do Agente Executor**:

Nesse modo, o agente deve:

1. **Trabalhar em sessões curtas** focadas em execução
2. **Focar em gerar comandos + ler outputs** do usuário
3. **Não acessar inventários ou relatórios longos**
4. **Não criar nova documentação**, apenas corrigir o mínimo necessário
5. **Seguir o ciclo**: comando → output → correção

**Fluxo típico**:
```
Usuário invoca Agente Executor
         ↓
Agente pergunta: "Em qual etapa você está?"
         ↓
Agente gera comando exato
         ↓
Usuário executa e cola output
         ↓
Agente diagnostica (se erro) ou confirma (se sucesso)
         ↓
Agente fornece próximo comando
```

**O que o Agente Executor NÃO faz**:
- ❌ Criar resumos/overviews/quick-starts
- ❌ Ler múltiplos arquivos de contexto
- ❌ Tentar "entender o sistema inteiro"
- ❌ Executar comandos destrutivos sem aprovação

**Referência completa**: Ver `.kiro/steering/AGENTE-EXECUTOR-DEVOPS-ALQUIMISTAAI.md`

### Modo Execução Frontend (Agente Executor Frontend)

**Quando usar**: Para depurar erros de frontend (Next.js 14, rotas, build, lint, E2E).

**Como invocar**:
```
"Usar o Agente Executor Frontend para [ação desejada]"
```

**Exemplos**:
- "Usar o Agente Executor Frontend para corrigir o erro 404 em `/`"
- "Usar o Agente Executor Frontend para depurar erro de build"
- "Usar o Agente Executor Frontend para testar login/dashboard"
- "Usar o Agente Executor Frontend para configurar variáveis de ambiente"

**Comportamento do Agente Executor Frontend**:

Nesse modo, o agente deve:

1. **Focar apenas em comandos e arquivos do diretório `frontend/`**
2. **Trabalhar em sessões curtas** (comando → output → correção)
3. **Evitar ler inventários e docs gerais**
4. **Preservar a identidade visual** (não redesenhar sem pedido)
5. **Não modificar infraestrutura AWS/Terraform/CDK**

**Fluxo típico**:
```
Usuário invoca Agente Executor Frontend
         ↓
Agente pergunta: "Em qual etapa você está?"
  - npm install?
  - npm run dev?
  - npm run lint?
  - npm run build?
  - npm run test:e2e?
         ↓
Agente gera comando exato
         ↓
Usuário executa e cola output
         ↓
Agente diagnostica (se erro) ou confirma (se sucesso)
         ↓
Agente fornece próximo comando
```

**O que o Agente Executor Frontend NÃO faz**:
- ❌ Criar resumos/overviews/quick-starts
- ❌ Ler arquivos fora de `frontend/`
- ❌ Modificar infraestrutura AWS
- ❌ Alterar identidade visual sem pedido explícito
- ❌ Executar comandos destrutivos sem aprovação

**Referência completa**: Ver `.kiro/steering/AGENTE-EXECUTOR-FRONTEND-ALQUIMISTAAI.md`

### Outros Comandos

Esta seção pode ser expandida com outros comandos específicos do fluxo de trabalho AlquimistaAI conforme necessário.

---

---

## Boas Práticas

### Para o Usuário

**Ao trabalhar com ChatGPT**:
- Sempre envie `@@Ativar` + RESUMO-PARA-CHATGPT atualizado
- Seja específico sobre o que deseja trabalhar
- Anexe arquivos relevantes quando possível
- Solicite resumos apenas quando necessário

**Ao trabalhar com Kiro**:
- Sempre cole `@@Ativar` + blueprint do ChatGPT
- Confirme o contexto se algo parecer errado
- Revise as mudanças antes de aprovar
- Mantenha os RESUMO-PARA-CHATGPT atualizados

### Para o ChatGPT (Conceitual)

- Sempre ler o RESUMO-PARA-CHATGPT fornecido
- Confirmar contexto antes de gerar blueprint
- Não assumir acesso direto ao repositório
- Gerar blueprints claros e acionáveis
- Incluir critérios de aceitação

### Para o Kiro

- Sempre ler este fluxo de steering ao receber `@@Ativar`
- Ler o blueprint completo antes de executar
- Fazer perguntas pontuais quando necessário
- Atualizar RESUMO-PARA-CHATGPT ao finalizar (apenas quando solicitado ou ao fechar macro-etapa)
- Nunca executar comandos destrutivos sem aprovação
- **NUNCA usar a frase "Summarize and continue in a new session"**
- Focar em execução quando o usuário pedir deploy/terraform/scripts

---

## Troubleshooting

### Problema: ChatGPT não reconhece o contexto

**Sintomas**:
- ChatGPT faz perguntas sobre informações já fornecidas
- Gera blueprints desconectados do estado atual
- Não menciona trabalho anterior

**Solução**:
1. Verificar se o RESUMO-PARA-CHATGPT foi colado na mensagem
2. Anexar o arquivo RESUMO-PARA-CHATGPT completo
3. Especificar manualmente o contexto desejado
4. Usar `@@Ativar` novamente com mais detalhes

### Problema: Kiro não responde adequadamente

**Sintomas**:
- Kiro não encontra arquivos mencionados no blueprint
- Kiro executa ações incorretas
- Kiro não atualiza RESUMO-PARA-CHATGPT

**Solução**:
1. Verificar conexão com o repositório
2. Confirmar que os arquivos existem nos paths especificados
3. Verificar se o blueprint foi colado completamente
4. Reiniciar a sessão com `@@Ativar` se necessário

### Problema: Ciclo quebrado (perda de continuidade)

**Sintomas**:
- ChatGPT e Kiro parecem desconectados
- Trabalho anterior não é reconhecido
- Retrabalho constante

**Solução**:
1. **Primeiro**: Pedir ao Kiro para gerar RESUMO-PARA-CHATGPT atualizado
2. **Depois**: Enviar esse resumo ao ChatGPT com `@@Ativar`
3. Verificar se os relatórios estão sendo atualizados após cada sessão
4. Manter um único RESUMO-PARA-CHATGPT por componente/tema

---

## Atualizações e Manutenção

Este documento deve ser atualizado sempre que:

- Novos comandos forem adicionados
- O fluxo de trabalho mudar
- Problemas recorrentes forem identificados
- Melhorias forem implementadas

---

## Histórico de Alterações

### Versão 2.2.0 - 2024-11-25

**Atualização: Agente Executor Frontend**

Adicionado novo agente executor especializado em frontend:

1. **Agente Executor Frontend**: Nova seção completa
   - Irmão gêmeo do Agente Executor DevOps
   - Focado exclusivamente no diretório `frontend/`
   - Modo Execução + Auto-Debug para Next.js 14

2. **Escopo do Agente Frontend**:
   - Comandos npm/pnpm/yarn
   - Build, lint, testes E2E (Playwright)
   - Diagnóstico de erros de rotas, middleware, 404/500
   - Configuração de variáveis de ambiente

3. **Restrições importantes**:
   - Preservar identidade visual
   - Não modificar infraestrutura AWS
   - Restrito ao diretório `frontend/`
   - Anti-loop de documentação

**Referência**: `.kiro/steering/AGENTE-EXECUTOR-FRONTEND-ALQUIMISTAAI.md`

### Versão 2.1.0 - 2024-11-24

**Atualização: Política Anti-Loop de Resumos**

Adicionada política para evitar criação excessiva de documentos redundantes:

1. **Política Anti-Loop de Resumos (Global)**: Nova seção completa
   - Limite de 1 resumo por macro-etapa
   - Prioridade para execução em pedidos de deploy
   - Logs curtos em vez de resumos longos
   - Regras claras sobre quando criar/não criar documentação

2. **Comportamento em pedidos de deploy/execução**:
   - PRIORIDADE 1: Guiar execução de comandos
   - PRIORIDADE 2: Criar 1 log curto opcional (5-10 linhas)
   - Evitar criar múltiplos resumos/índices/quick-starts

3. **Aplicação prática**:
   - Execução > Documentação
   - Atualizar docs existentes em vez de criar novos
   - Verificar existência antes de criar

**Motivação**: Eliminar o "loop de sumarização" onde cada sessão gera múltiplos documentos redundantes para a mesma fase, focando em ações concretas quando o usuário pede deploy ou execução.

### Versão 2.0.0 - 2024-11-23

**Atualização Major: Ciclo ChatGPT ⇄ Kiro**

Ajustes realizados para refletir o funcionamento real do ciclo de trabalho:

1. **Comando oficial**: Padronizado `@@Ativar` como comando canônico
   - Apelidos: `#Ativar` (ChatGPT) e `##Ativar` (Kiro)

2. **Padrão RESUMO-PARA-CHATGPT**: Documentado como ponte de contexto
   - ChatGPT depende de resumos/relatórios fornecidos pelo usuário
   - Kiro é responsável por gerar/atualizar esses resumos
   - Formato e estrutura recomendados definidos

3. **Separação clara de papéis**:
   - ChatGPT = Planejamento (gera blueprints)
   - Kiro = Execução (implementa blueprints)

4. **Fluxos detalhados**:
   - Seção "Fluxo Quando @@Ativar é Usado no ChatGPT"
   - Seção "Fluxo Quando @@Ativar é Usado no Kiro"
   - Diagramas simplificados para cada fluxo

5. **Regra de Continuidade**: Objetivo explícito de continuar do estado mais recente

6. **Troubleshooting expandido**: Problemas comuns e soluções práticas

**Motivação**: Alinhar documentação com a realidade de que ChatGPT não tem acesso direto ao repositório e depende de informações fornecidas via RESUMO-PARA-CHATGPT.

### Versão 1.0.0 - 2024-11-22

**Versão inicial** do documento de fluxo de trabalho ChatGPT + Kiro.

---

**Última atualização:** 2024-11-25  
**Versão:** 2.2.0  
**Mantido por:** Equipe AlquimistaAI
