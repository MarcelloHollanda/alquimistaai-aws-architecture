\# TAREFA KIRO · FRONTEND FIBONACCI (AWS · Next.js · Visual AlquimistaAI · Integrado ao Nigredo)

\#\# 0\. Contexto fixo

Repositório: \`github.com/MarcelloHollanda/alquimistaai-aws-architecture\`

Objetivo desta tarefa:    
Criar (ou organizar) o \*\*frontend do Fibonacci Orquestrador B2B\*\* dentro deste repositório, de forma que:

\- Siga a \*\*mesma identidade visual da página AlquimistaAI\*\*.  
\- Seja acessado a partir da \*\*page AlquimistaAI\*\* (como núcleo principal).  
\- Tenha navegação fluida com o \*\*frontend do Nigredo — Núcleo de Prospecção\*\*.  
\- Consuma a API do Fibonacci já implantada na AWS us-east-1:  
  \- API Gateway HTTP \+ Lambda (\`fibonacci-api-\*-http\`)  
  \- Aurora Serverless v2 (Postgres)  
\- Use variáveis de ambiente:  
  \- \`NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL\` (dev/prod, configurado por ambiente).

\*\*Importante:\*\*

\- Este frontend é do \*\*Fibonacci Orquestrador B2B\*\* (núcleo que orquestra subnúcleos como o Nigredo).  
\- O visual deve parecer parte do mesmo “portal” AlquimistaAI, onde:  
  \- AlquimistaAI \= casca/portal comercial  
  \- Fibonacci \= núcleo orquestrador  
  \- Nigredo \= subnúcleo de prospecção

Se já existir qualquer frontend Fibonacci ou AlquimistaAI neste repo, tratar como \*\*brownfield\*\* (refatorar sem quebrar o que já funciona).

\---

\#\# 1\. Estrutura do frontend

Trabalhar na pasta:

\`\`\`txt  
/frontend  
  package.json  
  tsconfig.json  
  next.config.mjs  
  app/  
    (alquimista)/  
      \# página AlquimistaAI principal (NÃO quebrar)  
    (fibonacci)/  
      layout.tsx  
      page.tsx                 \# Painel principal do Fibonacci  
      agentes/page.tsx         \# visão dos agentes/núcleos  
      integracoes/page.tsx     \# integrações (Nigredo, outros)  
      fluxos/page.tsx          \# visão de fluxos/rotas principais  
      health/page.tsx          \# status técnico  
    (nigredo)/  
      \# já definido em outra tarefa (NÃO quebrar)  
  public/  
    \# logo AlquimistaAI  
    \# logo Fibonacci (se existir/for adicionada)  
    \# logo Nigredo  
Requisitos:

Usar Next.js 14 \+ TypeScript \+ App Router.

Reutilizar ao máximo a estrutura existente do frontend AlquimistaAI:

se já houver layouts, componentes, temas, deve-se herdar e não recriar do zero.

O frontend deve ser compilável com npm run build e pronto para deploy estático em S3 \+ CloudFront.

2\. Stack e dependências  
No /frontend/package.json:

Garantir dependências principais (se ainda não existirem):

next, react, react-dom

typescript

@tanstack/react-query

axios

Estilização:

Reutilizar o mesmo stack de estilos da página AlquimistaAI (Tailwind, CSS Modules, shadcn, etc.).

NÃO introduzir uma nova abordagem de estilo.

Scripts esperados:

json  
Copiar código  
"scripts": {  
  "dev": "next dev",  
  "build": "next build",  
  "start": "next start",  
  "lint": "next lint"  
}  
3\. Identidade visual (tema AlquimistaAI, marca Fibonacci)  
Tema global \= AlquimistaAI  
Usar as mesmas fontes configuradas pela página AlquimistaAI.

Usar o mesmo esquema de cores (primárias, secundárias, fundo, borda, texto).

Usar os mesmos padrões para:

header,

footer,

cards,

botões,

containers (max-w, px, py etc.).

Marca Fibonacci  
Dentro desse tema AlquimistaAI, o núcleo Fibonacci deve ter:

Títulos/coletâneas com o nome “Fibonacci — Núcleo Orquestrador B2B” (ou variação adequada já usada no projeto).

Logo do Fibonacci (se existir) em região de destaque do painel.

Textos que reforçam o papel do Fibonacci como orquestrador e “cérebro” entre subnúcleos (Nigredo e outros).

Visualmente, deve parecer:

“Estou no portal AlquimistaAI e entrei na área interna do Fibonacci.”

4\. Cliente HTTP e hooks do Fibonacci  
Criar (ou adaptar) um cliente de API em frontend/lib/fibonacciApi.ts:

ts  
Copiar código  
import axios from "axios";

const FIBONACCI\_API\_BASE\_URL \= process.env.NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL;

export const fibonacciApi \= axios.create({  
  baseURL: FIBONACCI\_API\_BASE\_URL,  
  headers: {  
    "Content-Type": "application/json"  
  }  
});  
Criar hooks em frontend/hooks/useFibonacci.ts usando React Query, por exemplo:

useFibonacciHealth

Chama a rota raiz ou ///health da API Fibonacci e retorna:

ok, service, environment, db\_status.

useFibonacciMetrics

(Quando existir rota na API) retorna métricas gerais do orquestrador (quantidade de eventos, integrações ativas etc.).

useFibonacciIntegrations

(Pode começar como mock/estático) lista integrações conhecidas:

Nigredo, WhatsApp, e-mail, etc.

Cada hook deve:

Tratar loading, error, success.

Não decidir visual; apenas retornar dados \+ flags.

5\. Páginas do Fibonacci  
5.1 /(fibonacci)/layout.tsx  
Reaproveitar o mesmo layout base do AlquimistaAI (por ex. app/(alquimista)/layout.tsx):

Importar o mesmo Header/Navbar.

Manter o mesmo main container, cores de fundo, tipografia.

Dentro desse layout:

Exibir em algum lugar (por ex. topo da área de conteúdo):

Logo do Fibonacci (se existir),

Título: “Fibonacci — Núcleo Orquestrador”,

Subtítulo curto explicando o papel (ex.: “Orquestra os subnúcleos e integrações da AlquimistaAI.”).

5.2 /(fibonacci)/page.tsx — Painel principal  
Usar useFibonacciHealth e, se disponível, useFibonacciMetrics.

Mostrar cards com:

Status da API (ok / down, ambiente dev/prod),

Status do banco (connected/disconnected),

Visão geral de integrações (ex.: “Nigredo conectado”, “Outros serviços”).

Incluir CTAs de navegação:

Botão/card “Ir para Nigredo — Núcleo de Prospecção”

Navega para /(nigredo)/page.tsx (rota que você criou para o Nigredo).

Botão/card “Voltar para AlquimistaAI”

Navega para a principal /(alquimista).

5.3 /(fibonacci)/agentes/page.tsx  
Página textual/visual que descreve:

O papel do Fibonacci como orquestrador.

Os núcleos/subnúcleos atualmente integrados, incluindo:

Nigredo — Núcleo de Prospecção,

(Outros, se já existirem).

Usar o visual de cards padrão AlquimistaAI:

Cada card com título do núcleo, descrição, status (ex.: “ativo / em desenvolvimento”).

Link para abrir a UI do núcleo:

Card do Nigredo → link para /(nigredo).

5.4 /(fibonacci)/integracoes/page.tsx  
Listar as integrações técnicas do Fibonacci (foco mais “infra”):

Nigredo (eventos /public/nigredo-event),

Outros webhooks, e-mails, WhatsApp etc. (mesmo que alguns estejam apenas planejados, podem estar marcados como “em preparação”).

Layout com tabela/lista no padrão AlquimistaAI:

Colunas: Nome da integração, Tipo (webhook/API), Status (ativo, planejado), Observações.

5.5 /(fibonacci)/fluxos/page.tsx  
Página que descreve, de forma amigável, os principais fluxos do orquestrador, por exemplo:

Entrada de leads pelo Nigredo → envio de evento → processamento no Fibonacci.

Futuras automações.

Visual de “diagramas simples”/cards de passo a passo, utilizando os mesmos componentes da AlquimistaAI (cards, steps, etc.).

5.6 /(fibonacci)/health/page.tsx  
Tela focada no status técnico:

Resultado detalhado de useFibonacciHealth:

service, environment, db\_status.

Campos extras (podem começar estáticos ou simulados):

última vez que a API respondeu,

status de integrações (Nigredo ok/erro, etc. — mesmo que inicialmente sejam apenas campos de dummy).

Utilizar o mesmo estilo de cards/status que a AlquimistaAI usaria para “status do sistema”.

6\. Integração com a page AlquimistaAI e com Nigredo  
6.1 Navegação a partir da page AlquimistaAI  
Na página principal AlquimistaAI (por ex. app/(alquimista)/page.tsx):

Garantir a existência de cards/botões de acesso:

“Acessar Fibonacci — Núcleo Orquestrador”

link para a rota /(fibonacci) (painel principal).

“Acessar Nigredo — Núcleo de Prospecção”

link para /(nigredo).

O visual desses cards deve ser coerente com o resto da página (mesmo componente de card usado para outros produtos/serviços).

6.2 Navegação entre Fibonacci e Nigredo  
Em /(fibonacci)/page.tsx (painel):

Ter um card/CTA claro “Abrir Nigredo — Núcleo de Prospecção” que navega para /(nigredo).

Em /(nigredo)/page.tsx:

Ter um atalho “Voltar para Fibonacci Orquestrador” que navega para /(fibonacci).

Visualmente, a navegação entre pages deve ser:

suave,

coerente com os links/botões usados em outras partes do portal AlquimistaAI.

7\. Brownfield (se já existir frontend)  
Caso já exista:

alguma estrutura /frontend,

páginas React/Next do Fibonacci,

ou qualquer UI ligada a esses conceitos:

Não apagar nada sem entender o uso.

Identificar:

qual layout hoje representa a “page AlquimistaAI”,

se já há alguma tela relacionada ao Fibonacci.

Refatorar:

mover/adaptar o que for Fibonacci para app/(fibonacci)/...,

garantir que os estilos sejam alinhados com o tema global,

ajustar rotas para que:

AlquimistaAI → Fibonacci → Nigredo funcionem via navegação interna.

Rodar npm run build para garantir que nada foi quebrado.

8\. Integração e configuração  
Criar ou atualizar .env.example em /frontend com:

env  
Copiar código  
NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL=https://FIBONACCI\_API\_URL\_AQUI  
NEXT\_PUBLIC\_NIGREDO\_API\_BASE\_URL=https://NIGREDO\_API\_URL\_AQUI  
Incluir no README do frontend:

Como rodar:

bash  
Copiar código  
cd frontend  
npm install  
npm run dev  
Como apontar para os backends na AWS:

NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL \= URL da API HTTP do Fibonacci (dev/prod).

NEXT\_PUBLIC\_NIGREDO\_API\_BASE\_URL \= URL da API HTTP do Nigredo (dev/prod).

9\. Restrições finais  
NÃO criar um segundo tema visual diferente do AlquimistaAI.

NÃO quebrar nem simplificar demais a estrutura de frontend já existente.

Nenhuma credencial da AWS deve aparecer em código; apenas variáveis de ambiente.

Manter o código organizado, comentado quando necessário, e pronto para ser versionado e evoluído em conjunto com o Nigredo.

10\. Resultado esperado  
Ao finalizar esta tarefa, espero:

Um conjunto de páginas app/(fibonacci)/... que:

utilizem o mesmo visual da página AlquimistaAI,

sirvam como painel do Fibonacci Orquestrador,

façam ponte de navegação com o Nigredo.

Hooks useFibonacci\* centralizando o consumo da API Fibonacci via NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL.

A página AlquimistaAI funcionando como porta de entrada para:

Fibonacci Orquestrador (núcleo principal),

Nigredo (subnúcleo de prospecção).

Build (npm run build) funcionando sem erros, pronto para deploy em S3 \+ CloudFront.

Copiar código

