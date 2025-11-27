\# **Fluxo de Trabalho ChatGPT ⇄ Kiro \- AlquimistaAI**

\#\# **Introdução**

Este documento define o fluxo oficial de trabalho entre o ChatGPT e o Kiro no contexto do projeto AlquimistaAI. Estabelece as regras de continuidade entre chats, comportamentos esperados e protocolos de comunicação entre as duas ferramentas.

**\*\*Conceito fundamental\*\***: ChatGPT atua como **\*\*cérebro/orquestrador\*\*** que gera blueprints, enquanto Kiro atua como **\*\*mãos/executor\*\*** que implementa blueprints dentro do repositório.

\---

\#\# **Visão Geral do Ciclo ChatGPT ⇄ Kiro**

\#\#\# **Papéis Definidos**

\- **\*\*ChatGPT\*\***: Assistente externo sem acesso direto ao repositório  
  \- Gera blueprints e planos de ação  
  \- Analisa contexto e propõe soluções  
  \- Depende de informações fornecidas pelo usuário

\- **\*\*Kiro\*\***: Executor dentro do repositório  
  \- Acessa e modifica arquivos diretamente  
  \- Executa comandos no ambiente  
  \- Gera relatórios de estado para o ChatGPT

\#\#\# **Diagrama do Fluxo**

\`\`\`  
\[Quando @@Ativar é usado no ChatGPT\]  
Usuário → @@Ativar \+ RESUMO-PARA-CHATGPT → ChatGPT  
                                              ↓  
                                    Gera blueprint  
                                              ↓  
                        Usuário → Kiro → Repositório

\[Quando @@Ativar é usado no Kiro\]  
Usuário → @@Ativar \+ blueprint → Kiro  
                                   ↓  
                          Executa ações  
                                   ↓  
              Gera/Atualiza RESUMO-PARA-CHATGPT \+ Relatórios  
                                   ↓  
                  Usuário → ChatGPT (novo @@Ativar)  
\`\`\`

**\*\*Princípio\*\***: O fluxo é um **\*\*ciclo contínuo\*\***, não ações isoladas. Cada sessão continua exatamente de onde a anterior parou.

\---

\#\# **Comando Oficial @@Ativar e Apelidos**

\#\#\# **Comando Canônico**

**\*\***\`@@Ativar\`**\*\*** → Comando oficial documentado para continuidade de contexto

\#\#\# **Apelidos Aceitos**

Para conveniência do usuário, os seguintes apelidos são tratados como \`@@Ativar\`:

\- **\*\***\`\#Ativar\`**\*\*** → Quando digitado no ChatGPT  
\- **\*\***\`\#\#Ativar\`**\*\*** → Quando digitado no Kiro

\#\#\# **Significado**

Todos significam: **\*\*"Continuar exatamente de onde paramos no último ciclo desse projeto/contexto"\*\***

\---

\#\# **Como o ChatGPT Lê o Estado do Projeto na Prática**

\#\#\# **Limitação Fundamental**

**\*\*ChatGPT não acessa arquivos diretamente\*\*** no repositório nem no computador local.

Ele só enxerga:  
\- Texto colado pelo usuário na conversa  
\- Arquivos anexados manualmente pelo usuário  
\- O que já está registrado na memória histórica da conversa

\#\#\# **Padrão RESUMO-PARA-CHATGPT**

Para resolver essa limitação, existe o padrão **\*\*RESUMO-PARA-CHATGPT\*\***:

\#\#\#\# **O que é**

Arquivo(s) de resumo focado em fornecer contexto ao ChatGPT, contendo:  
\- Estado atual (o que já está pronto)  
\- Arquivos importantes alterados  
\- Erros ou pendências principais  
\- Próximos passos sugeridos  
\- Qual foi o último blueprint executado

\#\#\#\# **Onde fica**

Exemplos de localização:  
\- \`.kiro/specs/\<nome-do-componente\>/RESUMO-PARA-CHATGPT.md\`  
\- \`docs/RESUMO-PARA-CHATGPT-\<TEMA\>.md\`  
\- \`frontend/docs/RESUMO-PARA-CHATGPT.md\`

\#\#\#\# **Quando é criado/atualizado**

Após cada sessão relevante no Kiro, o Kiro deve:  
1\. Gerar ou atualizar o arquivo RESUMO-PARA-CHATGPT  
2\. Incluir informações essenciais para continuidade  
3\. Manter formato conciso e objetivo

\#\#\# **Passo a Passo para Atualizar o ChatGPT**

Quando o usuário quiser continuar no ChatGPT com \`@@Ativar\`:

1\. **\*\*Abrir\*\*** o arquivo RESUMO-PARA-CHATGPT correspondente ao componente/tema  
2\. **\*\*Copiar\*\*** os trechos relevantes (ou arquivo completo)  
3\. **\*\*Colar\*\*** junto com o comando \`@@Ativar\` na conversa com o ChatGPT  
4\. **\*\*Opcionalmente\*\*** anexar o arquivo completo se disponível

**\*\*Só então\*\*** o ChatGPT "lê" essas informações e gera o próximo blueprint com base no estado real.

\---

\#\# **Fluxo Quando @@Ativar é Usado no ChatGPT**

\#\#\# **Comportamento Esperado do ChatGPT**

Quando o usuário envia para o ChatGPT:  
\- \`@@Ativar\` (ou \`\#Ativar\`)  
\- \+ conteúdo do RESUMO-PARA-CHATGPT (copiado do repositório)

O ChatGPT deve:

1\. **\*\*Ler o resumo colado\*\*** pelo usuário  
2\. **\*\*Cruzar com memória histórica\*\*** (se houver contexto anterior)  
3\. **\*\*Identificar\*\***:  
   \- Em qual componente/tema estamos (micro agente, observabilidade, CI/CD, frontend, etc.)  
   \- Qual foi o último blueprint que ele mesmo gerou para o Kiro  
   \- O que o Kiro já executou (segundo o resumo)  
4\. **\*\*Fazer perguntas essenciais\*\*** apenas se houver ambiguidade crítica  
5\. **\*\*Gerar um único blueprint\*\*** em Markdown contendo:  
   \- Contexto atual (resumido)  
   \- Objetivo da sessão  
   \- Arquivos que o Kiro deve ler  
   \- Arquivos a criar/editar  
   \- Comandos para o usuário rodar (normalmente via Kiro ou na máquina)  
   \- Critérios de aceitação da sessão

\#\#\# **Fluxo Simplificado**

\`\`\`  
Usuário envia:  
  @@Ativar \+ RESUMO-PARA-CHATGPT  
         ↓  
ChatGPT analisa:  
  \- Lê resumo  
  \- Identifica contexto  
  \- Verifica último blueprint  
         ↓  
ChatGPT gera:  
  Blueprint em Markdown  
         ↓  
Usuário copia blueprint  
         ↓  
Usuário cola no Kiro  
\`\`\`

\#\#\# **O que o ChatGPT NÃO deve fazer**

\- ❌ Assumir que tem acesso direto ao repositório  
\- ❌ Tentar "ler" arquivos sem que sejam colados  
\- ❌ Criar resumos automáticos não solicitados  
\- ❌ Iniciar tarefas sem blueprint claro

\---

\#\# **Fluxo Quando @@Ativar é Usado no Kiro**

\#\#\# **Comportamento Esperado do Kiro**

Quando o usuário cola no Kiro:  
\- \`@@Ativar\` (ou \`\#\#Ativar\`)  
\- \+ blueprint gerado pelo ChatGPT

O Kiro deve:

1\. **\*\*Ler este fluxo de steering\*\*** (este documento)  
2\. **\*\*Ler o blueprint colado\*\*** pelo usuário  
3\. **\*\*Ler arquivos extras\*\*** especificados no blueprint:  
   \- tasks.md, design.md, requirements.md  
   \- IMPLEMENTATION-STATUS.md  
   \- Outros arquivos relevantes  
4\. **\*\*Fazer perguntas pontuais\*\*** ao usuário se necessário:  
   \- Path do repositório  
   \- Branch a usar  
   \- Valores de variáveis  
5\. **\*\*Executar o que o blueprint manda\*\***:  
   \- Criar/editar arquivos  
   \- Rodar comandos (apenas os listados no blueprint)  
   \- **\*\*NUNCA\*\*** rodar \`terraform apply\` ou ações destrutivas sem aprovação explícita  
6\. **\*\*Ao finalizar, atualizar\*\***:  
   \- Relatórios da spec/componente (ex.: \`RELATORIO-SESSAO-ATUAL.md\`, \`IMPLEMENTATION-STATUS.md\`)  
   \- **\*\*Sempre\*\*** gerar ou atualizar o \`RESUMO-PARA-CHATGPT\` do componente em foco

\#\#\# **Fluxo Simplificado**

\`\`\`  
Usuário cola:  
  @@Ativar \+ Blueprint do ChatGPT  
         ↓  
Kiro lê:  
  \- Steering  
  \- Blueprint  
  \- Arquivos especificados  
         ↓  
Kiro pergunta:  
  \- Confirmações necessárias  
         ↓  
Kiro executa:  
  \- Cria/edita arquivos  
  \- Roda comandos  
         ↓  
Kiro atualiza:  
  \- Relatórios  
  \- RESUMO-PARA-CHATGPT  
         ↓  
Usuário volta ao ChatGPT  
  com novo @@Ativar \+ RESUMO atualizado  
\`\`\`

\#\#\# **O que o Kiro NÃO deve fazer**

\- ❌ Assumir conhecimento de sessões anteriores sem ler arquivos  
\- ❌ Criar resumos automáticos não solicitados  
\- ❌ Executar comandos destrutivos sem aprovação  
\- ❌ Ignorar o blueprint fornecido

\---

\#\# **Regra de Continuidade entre Sessões**

\#\#\# **Objetivo do Fluxo**

**\*\*"Garantir que, ao usar @@Ativar, tanto ChatGPT quanto Kiro continuem exatamente da última ação documentada, em vez de recomeçar o raciocínio do zero."\*\***

\#\#\# **Como Garantir Continuidade**

Toda sessão relevante deve deixar rastro:

1\. **\*\*Kiro\*\*** → atualiza relatórios e RESUMO-PARA-CHATGPT  
2\. **\*\*ChatGPT\*\*** → gera blueprints que podem ser mencionados/resumidos nesses relatórios

\#\#\# **Se Não Houver Resumo ou Relatório Claro**

O padrão recomendado é:

1\. **\*\*Primeiro\*\***: Usuário pede ao Kiro um relatório/RESUMO-PARA-CHATGPT  
2\. **\*\*Depois\*\***: Usuário cola esse resumo no ChatGPT com @@Ativar

\#\#\# **Princípios Fundamentais**

\- Cada nova sessão começa com \`@@Ativar\`  
\- O contexto é reconstruído através dos documentos de steering e RESUMO-PARA-CHATGPT  
\- O histórico está nos arquivos, não na memória do chat  
\- O objetivo é sempre dar continuidade ao estado mais recente, não recomeçar

\---

\#\# **Política de Não-Sumarização**

\#\#\# **Regra Fundamental**

**\*\*O Kiro NÃO deve criar resumos automáticos\*\*** ao final de cada sessão, a menos que explicitamente solicitado pelo usuário.

\#\#\# **Justificativa**

\- Os resumos criam ruído documental  
\- O contexto real está nos arquivos do projeto  
\- Resumos podem conter informações desatualizadas  
\- O usuário sabe o que foi feito e não precisa de recapitulação

\#\#\# **Exceções**

Resumos são permitidos apenas quando:

1\. **\*\*Explicitamente solicitados\*\*** pelo usuário  
2\. **\*\*Parte de uma documentação formal\*\*** (specs, design docs, etc.)  
3\. **\*\*Necessários para handoff\*\*** entre diferentes contextos de trabalho

\---

\---

\#\# **Estrutura do RESUMO-PARA-CHATGPT**

\#\#\# **Formato Recomendado**

\`\`\`markdown  
\# **📋 RESUMO PARA ENVIAR AO CHATGPT**

\#\# **Contexto**  
\- Repositório: \[caminho\]  
\- Componente/Tema: \[nome\]  
\- Última sessão: \[data\]

\#\# **Estado Atual**

\#\#\# **O que está pronto**  
\- \[x\] Item 1 completo  
\- \[x\] Item 2 completo  
\- \[ \] Item 3 em andamento

\#\#\# **Arquivos importantes alterados**  
\- \`path/to/file1.ts\` \- \[descrição da mudança\]  
\- \`path/to/file2.md\` \- \[descrição da mudança\]

\#\# **Erros ou Pendências**

\#\#\# **Erros conhecidos**  
1\. \[Descrição do erro 1\]  
2\. \[Descrição do erro 2\]

\#\#\# **Pendências principais**  
\- \[ \] Tarefa pendente 1  
\- \[ \] Tarefa pendente 2

\#\# **Último Blueprint Executado**

\[Resumo do último blueprint que o ChatGPT gerou e o Kiro executou\]

\#\# **Próximos Passos Sugeridos**

1\. \[Sugestão 1\]  
2\. \[Sugestão 2\]

\#\# **Informações Técnicas Relevantes**

\[Configurações, variáveis de ambiente, endpoints, etc.\]  
\`\`\`

\#\#\# **Princípios do RESUMO-PARA-CHATGPT**

\- **\*\*Conciso\*\***: Apenas informações essenciais  
\- **\*\*Objetivo\*\***: Fatos, não opiniões  
\- **\*\*Atualizado\*\***: Reflete o estado mais recente  
\- **\*\*Acionável\*\***: Permite ao ChatGPT gerar próximo blueprint

\---

\#\# **Comandos e Gatilhos**

\#\#\# **@@Ativar (e apelidos)**

**\*\*Uso\*\***: Iniciar ou retomar contexto de trabalho

**\*\*No ChatGPT\*\***:  
1\. Usuário envia: \`@@Ativar\` \+ RESUMO-PARA-CHATGPT  
2\. ChatGPT analisa contexto  
3\. ChatGPT gera blueprint  
4\. Usuário copia blueprint para o Kiro

**\*\*No Kiro\*\***:  
1\. Usuário cola: \`@@Ativar\` \+ blueprint  
2\. Kiro lê steering e blueprint  
3\. Kiro executa ações  
4\. Kiro atualiza RESUMO-PARA-CHATGPT  
5\. Usuário volta ao ChatGPT com novo ciclo

\#\#\# **Outros Comandos**

Esta seção pode ser expandida com outros comandos específicos do fluxo de trabalho AlquimistaAI conforme necessário.

\---

\---

\#\# **Boas Práticas**

\#\#\# **Para o Usuário**

**\*\*Ao trabalhar com ChatGPT\*\***:  
\- Sempre envie \`@@Ativar\` \+ RESUMO-PARA-CHATGPT atualizado  
\- Seja específico sobre o que deseja trabalhar  
\- Anexe arquivos relevantes quando possível  
\- Solicite resumos apenas quando necessário

**\*\*Ao trabalhar com Kiro\*\***:  
\- Sempre cole \`@@Ativar\` \+ blueprint do ChatGPT  
\- Confirme o contexto se algo parecer errado  
\- Revise as mudanças antes de aprovar  
\- Mantenha os RESUMO-PARA-CHATGPT atualizados

\#\#\# **Para o ChatGPT (Conceitual)**

\- Sempre ler o RESUMO-PARA-CHATGPT fornecido  
\- Confirmar contexto antes de gerar blueprint  
\- Não assumir acesso direto ao repositório  
\- Gerar blueprints claros e acionáveis  
\- Incluir critérios de aceitação

\#\#\# **Para o Kiro**

\- Sempre ler este fluxo de steering ao receber \`@@Ativar\`  
\- Ler o blueprint completo antes de executar  
\- Fazer perguntas pontuais quando necessário  
\- Atualizar RESUMO-PARA-CHATGPT ao finalizar  
\- Nunca executar comandos destrutivos sem aprovação

\---

\#\# **Troubleshooting**

\#\#\# **Problema: ChatGPT não reconhece o contexto**

**\*\*Sintomas\*\***:  
\- ChatGPT faz perguntas sobre informações já fornecidas  
\- Gera blueprints desconectados do estado atual  
\- Não menciona trabalho anterior

**\*\*Solução\*\***:  
1\. Verificar se o RESUMO-PARA-CHATGPT foi colado na mensagem  
2\. Anexar o arquivo RESUMO-PARA-CHATGPT completo  
3\. Especificar manualmente o contexto desejado  
4\. Usar \`@@Ativar\` novamente com mais detalhes

\#\#\# **Problema: Kiro não responde adequadamente**

**\*\*Sintomas\*\***:  
\- Kiro não encontra arquivos mencionados no blueprint  
\- Kiro executa ações incorretas  
\- Kiro não atualiza RESUMO-PARA-CHATGPT

**\*\*Solução\*\***:  
1\. Verificar conexão com o repositório  
2\. Confirmar que os arquivos existem nos paths especificados  
3\. Verificar se o blueprint foi colado completamente  
4\. Reiniciar a sessão com \`@@Ativar\` se necessário

\#\#\# **Problema: Ciclo quebrado (perda de continuidade)**

**\*\*Sintomas\*\***:  
\- ChatGPT e Kiro parecem desconectados  
\- Trabalho anterior não é reconhecido  
\- Retrabalho constante

**\*\*Solução\*\***:  
1\. **\*\*Primeiro\*\***: Pedir ao Kiro para gerar RESUMO-PARA-CHATGPT atualizado  
2\. **\*\*Depois\*\***: Enviar esse resumo ao ChatGPT com \`@@Ativar\`  
3\. Verificar se os relatórios estão sendo atualizados após cada sessão  
4\. Manter um único RESUMO-PARA-CHATGPT por componente/tema

\---

\#\# **Atualizações e Manutenção**

Este documento deve ser atualizado sempre que:

\- Novos comandos forem adicionados  
\- O fluxo de trabalho mudar  
\- Problemas recorrentes forem identificados  
\- Melhorias forem implementadas

\---

\#\# **Histórico de Alterações**

\#\#\# **Versão 2.0.0 \- 2024-11-23**

**\*\*Atualização Major: Ciclo ChatGPT ⇄ Kiro\*\***

Ajustes realizados para refletir o funcionamento real do ciclo de trabalho:

1\. **\*\*Comando oficial\*\***: Padronizado \`@@Ativar\` como comando canônico  
   \- Apelidos: \`\#Ativar\` (ChatGPT) e \`\#\#Ativar\` (Kiro)

2\. **\*\*Padrão RESUMO-PARA-CHATGPT\*\***: Documentado como ponte de contexto  
   \- ChatGPT depende de resumos/relatórios fornecidos pelo usuário  
   \- Kiro é responsável por gerar/atualizar esses resumos  
   \- Formato e estrutura recomendados definidos

3\. **\*\*Separação clara de papéis\*\***:  
   \- ChatGPT \= Planejamento (gera blueprints)  
   \- Kiro \= Execução (implementa blueprints)

4\. **\*\*Fluxos detalhados\*\***:  
   \- Seção "Fluxo Quando @@Ativar é Usado no ChatGPT"  
   \- Seção "Fluxo Quando @@Ativar é Usado no Kiro"  
   \- Diagramas simplificados para cada fluxo

5\. **\*\*Regra de Continuidade\*\***: Objetivo explícito de continuar do estado mais recente

6\. **\*\*Troubleshooting expandido\*\***: Problemas comuns e soluções práticas

**\*\*Motivação\*\***: Alinhar documentação com a realidade de que ChatGPT não tem acesso direto ao repositório e depende de informações fornecidas via RESUMO-PARA-CHATGPT.

\#\#\# **Versão 1.0.0 \- 2024-11-22**

**\*\*Versão inicial\*\*** do documento de fluxo de trabalho ChatGPT \+ Kiro.

\---

**\*\*Última atualização:\*\*** 2024-11-23    
**\*\*Versão:\*\*** 2.0.0    
**\*\*Mantido por:\*\*** Equipe AlquimistaAI

