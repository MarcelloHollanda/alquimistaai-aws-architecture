\# Kiro · Atualizar Ciclo ChatGPT ⇄ Kiro (Comando @@Ativar \+ Relatórios para ChatGPT)

\#\# 0\. Protocolo Anti-Alucinação (obrigatório)

Antes de qualquer alteração:

1\. Leia o arquivo de steering atual:

   \- \`.kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md\`

2\. Verifique se existem arquivos de resumo/estado geral que já foram criados, por exemplo:

   \- \`docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md\`  
   \- \`docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md\`

3\. Verifique se existem arquivos de \*\*RESUMO-PARA-CHATGPT\*\* por componente (se já tiverem sido criados em sessões anteriores), por exemplo:

   \- \`.kiro/specs/micro-agente-disparo-agendamento/RESUMO-PARA-CHATGPT.md\`  
   \- \`frontend/docs/RESUMO-PARA-CHATGPT-FRONTEND.md\`  
   \- \`docs/RESUMO-PARA-CHATGPT-OBSERVABILIDADE.md\`

4\. Se houver divergência entre este prompt e o conteúdo já estabelecido no steering ou nos documentos oficiais de status:  
   \- Não apague decisões antigas;  
   \- Atualize o texto para ficar coerente com:  
     \- A existência do ChatGPT como \*\*assistente externo\*\* (sem acesso direto ao repositório);  
     \- O papel do Kiro como \*\*executor dentro do repositório\*\*;  
     \- O uso de \*\*relatórios/RESUMO-PARA-CHATGPT\*\* como ponte de informação.

Registre qualquer decisão relevante em um pequeno bloco de “Histórico de alterações” ao final do arquivo de steering.

\---

\#\# 1\. Objetivo desta Tarefa

Ajustar e aprimorar o arquivo:

\- \`.kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md\`

para que:

1\. Descreva claramente o \*\*ciclo de trabalho ChatGPT ⇄ Kiro\*\* usando o comando oficial \`@@Ativar\` (e seus apelidos).  
2\. Explique, de forma prática e realista, \*\*como o ChatGPT “lê” o estado do projeto\*\*:  
   \- Ele não acessa o repositório diretamente;  
   \- Ele depende de \*\*relatórios/RESUMO-PARA-CHATGPT\*\* gerados pelo Kiro e colados pelo usuário na conversa.  
3\. Defina os fluxos separados:  
   \- Fluxo quando o usuário usa \`@@Ativar\` no \*\*ChatGPT\*\*;  
   \- Fluxo quando o usuário usa \`@@Ativar\` no \*\*Kiro\*\*.  
4\. Documente que o objetivo do ciclo é \*\*sempre continuar a partir da última ação do último chat/sessão\*\*, sem recomeçar do zero.

\---

\#\# 2\. Estrutura que o Steering Deve Ter

\#\#\# 2.1. Seção: “Visão Geral do Ciclo ChatGPT ⇄ Kiro”

Crie ou atualize uma seção no início do arquivo com:

\- Uma explicação curta de que:  
  \- ChatGPT \= cérebro/orquestrador que gera blueprints.  
  \- Kiro \= mãos que executam blueprints dentro do repositório.  
\- Um diagrama ASCII simples, por exemplo:

\`\`\`text  
\[Quando @@Ativar é usado no ChatGPT\]

Usuário → @@Ativar \+ RESUMO-PARA-CHATGPT → ChatGPT  
                               ↓  
                        Gera blueprint  
                               ↓  
                      Usuário → Kiro → Repositório  
text  
Copiar código  
\[Quando @@Ativar é usado no Kiro\]

Usuário → @@Ativar \+ blueprint → Kiro  
                          ↓  
                     Executa ações  
                          ↓  
          Gera/Atualiza RESUMO-PARA-CHATGPT \+ Relatórios  
                          ↓  
                  Usuário → ChatGPT (novo @@Ativar)  
Essa seção deve deixar claro que o fluxo é um ciclo contínuo, não ações isoladas.

2.2. Seção: “Comando Oficial @@Ativar e Apelidos”  
Crie/atualize uma seção com:

Comando canônico:

@@Ativar → comando oficial documentado.

Apelidos para conveniência (se o usuário usar):

\#Ativar → tratado como @@Ativar quando digitado no ChatGPT.

\#\#Ativar → tratado como @@Ativar quando digitado no Kiro.

Explique em 2–3 linhas:

Todos significam: “continuar exatamente de onde paramos no último ciclo desse projeto/contexto”.

2.3. Seção: “Como o ChatGPT Lê o Estado do Projeto na Prática”  
Esta é a parte mais importante da atualização.

Crie uma seção explicando, em linguagem clara, que:

ChatGPT não acessa arquivos diretamente no repositório nem no computador.

Ele só enxerga:

Texto colado pelo usuário;

Arquivos anexados na conversa (quando o usuário envia);

O que já está registrado na memória histórica.

Por isso, existe o padrão RESUMO-PARA-CHATGPT:

Após cada sessão relevante no Kiro, o Kiro deve:

Gerar ou atualizar um arquivo de resumo focado em ChatGPT, por exemplo:

.kiro/specs/\<nome-do-componente\>/RESUMO-PARA-CHATGPT.md

ou docs/RESUMO-PARA-CHATGPT-\<TEMA\>.md

Esse arquivo deve conter:

Estado atual (o que já está pronto);

Arquivos importantes alterados;

Erros ou pendências principais;

Próximos passos sugeridos;

Qual foi o último blueprint executado.

Quando o usuário quiser continuar no ChatGPT com @@Ativar, ele deve:

Abrir o arquivo RESUMO-PARA-CHATGPT correspondente;

Copiar os trechos relevantes;

Colar junto com o comando @@Ativar na conversa com o ChatGPT;

Opcionalmente anexar o arquivo completo.

Só então o ChatGPT “lê” essas informações e gera o próximo blueprint com base no estado real.

Deixe isso em forma de lista numerada, com um subtítulo tipo:  
“Passo a Passo para Atualizar o ChatGPT”.

2.4. Seção: “Fluxo Quando @@Ativar é Usado no ChatGPT”  
Crie/ajuste uma seção descrevendo o comportamento esperado do ChatGPT (conceitualmente, para o usuário entender o fluxo). Algo como:

Usuário envia para o ChatGPT:

@@Ativar

o conteúdo do RESUMO-PARA-CHATGPT (copiado do repositório ou do Kiro).

ChatGPT deve:

Ler o resumo colado;

Cruzar com o que já está salvo na memória histórica;

Identificar:

Em qual componente/tema estamos (micro agente, observabilidade, CI/CD, frontend, etc.);

Qual foi o último blueprint que ele mesmo gerou para o Kiro;

O que o Kiro já executou (segundo o resumo).

ChatGPT faz no máximo perguntas essenciais (se houver ambiguidade) e então gera:

Um único blueprint em Markdown, com:

Contexto atual (resumido);

Objetivo da sessão;

Arquivos que o Kiro deve ler;

Arquivos a criar/editar;

Comandos para o usuário rodar (normalmente via Kiro ou na máquina);

Critérios de aceitação da sessão.

O usuário copia esse blueprint e cola no Kiro, iniciando a próxima etapa do ciclo.

Inclua um pequeno diagrama ASCII simplificado, se achar útil.

2.5. Seção: “Fluxo Quando @@Ativar é Usado no Kiro”  
Crie/ajuste uma seção explicando o comportamento esperado do Kiro:

Usuário cola no Kiro:

@@Ativar (ou \#\#Ativar)

um blueprint gerado pelo ChatGPT.

Kiro deve:

Ler este fluxo de steering;

Ler o blueprint colado;

Ler qualquer arquivo extra especificado no blueprint (ex.: tasks, design, requirements, IMPLEMENTATION-STATUS etc.).

Kiro faz perguntas pontuais ao usuário, se necessário (ex.: path do repositório, branch, valores de variáveis).

Kiro executa o que o blueprint manda:

Cria/edita arquivos;

Roda comandos (apenas os listados no blueprint);

Nunca roda terraform apply ou ações destrutivas se isso não estiver claramente especificado e conscientemente aprovado.

Ao finalizar, Kiro atualiza:

Relatórios da spec/componente (ex.: RELATORIO-SESSAO-ATUAL.md, IMPLEMENTATION-STATUS.md);

E sempre gera ou atualiza o RESUMO-PARA-CHATGPT do componente em foco.

O usuário então volta ao ChatGPT com um novo @@Ativar, trazendo o último RESUMO-PARA-CHATGPT.

2.6. Seção: “Regra de Continuidade entre Sessões”  
Finalize com uma seção declarando explicitamente que:

O objetivo do fluxo é:

“Garantir que, ao usar @@Ativar, tanto ChatGPT quanto Kiro continuem exatamente da última ação documentada, em vez de recomeçar o raciocínio do zero.”

Toda sessão relevante deve deixar rastro:

Kiro → atualiza relatórios e RESUMO-PARA-CHATGPT.

ChatGPT → gera blueprints que podem ser mencionados/resumidos nesses relatórios.

Se não houver resumo ou relatório claro:

O padrão recomendado é:

Primeiro, o usuário pedir ao Kiro um relatório/RESUMO-PARA-CHATGPT;

Depois, colar esse resumo no ChatGPT com @@Ativar.

3\. O que Não Fazer  
Ao editar o arquivo .kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md:

Não apague seções úteis já existentes (Introdução, Boas Práticas, Troubleshooting etc.).

Não invente novas capacidades (como “ChatGPT ler repositório sozinho”).

Não remover referências ao uso de Terraform, CI/CD ou outras decisões fundamentais já consolidadas (apenas complemente quando necessário).

4\. Critérios de Aceitação  
Considere a tarefa concluída somente se:

O arquivo .kiro/steering/FLUXO-CHATGPT-KIRO-ALQUIMISTAAI.md contiver:

Uma seção clara de Visão Geral do Ciclo ChatGPT ⇄ Kiro;

Uma seção de Comando Oficial @@Ativar e Apelidos;

Uma seção explicando Como o ChatGPT lê o estado do projeto na prática (via RESUMO-PARA-CHATGPT);

Seções separadas para:

Fluxo quando @@Ativar é usado no ChatGPT;

Fluxo quando @@Ativar é usado no Kiro;

Uma seção de Regra de Continuidade entre Sessões.

O texto deixar explícito que:

ChatGPT depende de resumos/relatórios que o usuário traz (especialmente RESUMO-PARA-CHATGPT);

Kiro é responsável por gerar/atualizar esses resumos ao final das sessões;

O objetivo é sempre dar continuidade ao estado mais recente, não recomeçar.

Um pequeno bloco de “Histórico de alterações” (no final do arquivo) registrar:

A data da atualização;

Que o ciclo ChatGPT ⇄ Kiro foi ajustado para refletir:

O uso de @@Ativar como comando oficial;

O uso de RESUMO-PARA-CHATGPT como ponte de contexto;

A separação clara entre o papel de planejamento (ChatGPT) e de execução (Kiro).

