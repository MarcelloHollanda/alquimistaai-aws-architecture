\# Kiro · Fix 404 Local → Base URL Definitiva (Frontend AlquimistaAI)

\#\# 1\. Contexto

Repositório: \`C:\\Users\\Usuário\\Downloads\\Marcello\\AlquimistaAI\\Kiro-AlquimistaAI\`    
Frontend: pasta \`frontend\` (Next.js 14, App Router)

Situação atual:

\- Frontend em dev roda em \`http://localhost:3000/\`.  
\- Backend oficial \*\*DEV\*\* está na AWS API Gateway:  
  \- \`https://c5loeivg0k.execute-api.us-east-1.amazonaws.com\` (Fibonacci Orquestrador, env dev).  
\- Em alguns pontos a base da API é configurada com \`NEXT\_PUBLIC\_API\_URL\`, mas o \`next.config.js\` ainda tem fallback para \`http://localhost:3001\`, o que já gerou:  
  \- URLs quebradas e testes de \`/health\` indo para host errado.  
  \- Confusão sobre o 404 em \`http://localhost:3001/\`.

Objetivo deste prompt:    
\*\*Eliminar definitivamente dependência de \`http://localhost:3001\` no frontend\*\*, padronizar a forma como a base URL da API é configurada e documentar isso, incluindo um mini “health-check visual” no frontend.

\---

\#\# 2\. Objetivo Técnico

Implementar um fluxo \*\*oficial\*\* para a base da API do frontend AlquimistaAI:

1\. \*\*Desenvolvimento local (dev)\*\*:    
   \- Sempre usar \`NEXT\_PUBLIC\_API\_URL\` vindo do \`.env.local\`.    
   \- Valor padrão recomendado:    
     \`https://c5loeivg0k.execute-api.us-east-1.amazonaws.com\`

2\. \*\*Produção (prod)\*\*:    
   \- Usar \`NEXT\_PUBLIC\_API\_URL\` do ambiente de deploy (CloudFront/S3).    
   \- Se não estiver setado, cair em fallback \*\*seguro\*\* para:  
     \`https://ogsd1547nd.execute-api.us-east-1.amazonaws.com\`.

3\. \*\*Remover qualquer fallback para \`http://localhost:3001\` em \`next.config.js\`.\*\*

4\. \*\*Adicionar verificação explícita no \`api-client.ts\`\*\* para falhar cedo se a base URL estiver ausente ou inválida.

5\. \*\*Criar documentação SOLUCAO-DEFINITIVA-API-BASE-URL.md\*\* consolidando:  
   \- Como configurar \`.env.local\` e \`.env.production\`.  
   \- Como o \`api-client.ts\` resolve a base URL.  
   \- Como testar rapidamente (\`/health\`).

6\. \*\*Adicionar um pequeno status de saúde da API no frontend\*\*, chamando \`/health\` e exibindo:  
   \- \`OK\` / \`Erro\`;  
   \- base URL usada;  
   \- resposta crua da API (simplificada).

\---

\#\# 3\. Escopo de Arquivos

Trabalhar \*\*apenas\*\* nos arquivos abaixo:

1\. \`frontend/.env.local\`    
2\. \`frontend/.env.production\` (apenas se já existir; caso não exista, criar um exemplo comentado)    
3\. \`frontend/next.config.js\`    
4\. \`frontend/src/lib/api-client.ts\`    
5\. Novo componente e/ou seção de health check, por exemplo:  
   \- \`frontend/src/components/system/ApiHealthBadge.tsx\` (ou nome similar)  
   \- E, opcionalmente, uso deste componente em:  
     \- \`frontend/src/app/page.tsx\` \*\*ou\*\*  
     \- \`frontend/src/app/(dashboard)/layout.tsx\` (ou equivalente atual do projeto)  
6\. Novo documento de docs:  
   \- \`frontend/docs/SOLUCAO-DEFINITIVA-API-BASE-URL.md\`    
     (ou, se padrão do repo for outra pasta, alinhar com \`docs/frontend/\`)

\---

\#\# 4\. Tarefas Detalhadas

\#\#\# Tarefa 1 — Padronizar \`.env.local\` (Dev)

1\. Abrir/editar \`frontend/.env.local\`.  
2\. Garantir que contenha, no mínimo:

   \`\`\`env  
   \# Ambiente de Desenvolvimento Local \- AlquimistaAI

   NEXT\_PUBLIC\_API\_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

   NEXT\_PUBLIC\_ENVIRONMENT=development  
   NEXT\_PUBLIC\_APP\_NAME=Alquimista.AI  
   NEXT\_PUBLIC\_APP\_VERSION=1.0.0  
   NEXT\_PUBLIC\_AWS\_REGION=us-east-1

   \# Cognito DEV (valores já usados atualmente)  
   NEXT\_PUBLIC\_COGNITO\_USER\_POOL\_ID=us-east-1\_Y8p2TeMbv  
   NEXT\_PUBLIC\_COGNITO\_CLIENT\_ID=59fs99tv0sbrmelkqef83itenu  
   NEXT\_PUBLIC\_COGNITO\_DOMAIN\_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com  
   NEXT\_PUBLIC\_COGNITO\_REDIRECT\_URI=http://localhost:3000/auth/callback  
   NEXT\_PUBLIC\_COGNITO\_LOGOUT\_URI=http://localhost:3000/auth/logout-callback  
   NEXT\_PUBLIC\_COGNITO\_REGION=us-east-1  
Não incluir nenhum http://localhost:3001 aqui.

Tarefa 2 — Remover fallback localhost:3001 do next.config.js  
Abrir frontend/next.config.js.

Localizar o bloco env atual e remover qualquer fallback explícito para http://localhost:3001.

Ajustar para algo equivalente a:

js  
Copiar código  
/\*\* @type {import('next').NextConfig} \*/

const requiredEnvVars \= \['NEXT\_PUBLIC\_API\_URL'\];

requiredEnvVars.forEach((name) \=\> {  
  if (\!process.env\[name\]) {  
    console.warn(\`\[next.config.js\] Variável de ambiente ausente: ${name}\`);  
  }  
});

const nextConfig \= {  
  reactStrictMode: true,  
  swcMinify: true,

  images: {  
    unoptimized: true,  
  },

  trailingSlash: true,

  eslint: {  
    ignoreDuringBuilds: true,  
  },  
  typescript: {  
    ignoreBuildErrors: true,  
  },

  env: {  
    NEXT\_PUBLIC\_API\_URL: process.env.NEXT\_PUBLIC\_API\_URL,  
    NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL: process.env.NEXT\_PUBLIC\_FIBONACCI\_API\_BASE\_URL,  
    NEXT\_PUBLIC\_NIGREDO\_API\_BASE\_URL: process.env.NEXT\_PUBLIC\_NIGREDO\_API\_BASE\_URL,  
  },

  webpack: (config) \=\> {  
    config.resolve.alias \= {  
      ...config.resolve.alias,  
    };  
    return config;  
  },  
};

module.exports \= nextConfig;  
Garantir que não existe mais string literal http://localhost:3001 no arquivo.

Tarefa 3 — Fortalecer api-client.ts  
Abrir frontend/src/lib/api-client.ts.

Garantir que a base URL seja resolvida assim:

ts  
Copiar código  
const API\_BASE\_URL \=  
  process.env.NEXT\_PUBLIC\_API\_URL ||  
  (process.env.NODE\_ENV \=== 'production'  
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'  
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

if (\!API\_BASE\_URL) {  
  throw new Error(  
    '\[ApiClient\] NEXT\_PUBLIC\_API\_URL não definido e fallback não pôde ser aplicado. Verifique o .env.local / .env.production.'  
  );  
}  
Confirmar que todas as funções que chamam a API usam API\_BASE\_URL de forma consistente, por exemplo:

ts  
Copiar código  
const url \= \`${API\_BASE\_URL}/alguma-rota\`;  
Não concatenar URLs completas duas vezes (nada como API\_BASE\_URL \+ http://...).

Tarefa 4 — Componente de Health Check da API  
Criar um componente simples, por exemplo em  
frontend/src/components/system/ApiHealthBadge.tsx:

tsx  
Copiar código  
'use client';

import { useEffect, useState } from 'react';

type HealthStatus \= 'checking' | 'ok' | 'error';

interface HealthResponse {  
  ok?: boolean;  
  service?: string;  
  environment?: string;  
  db\_status?: string;  
  \[key: string\]: any;  
}

export function ApiHealthBadge() {  
  const \[status, setStatus\] \= useState\<HealthStatus\>('checking');  
  const \[details, setDetails\] \= useState\<HealthResponse | null\>(null);  
  const \[error, setError\] \= useState\<string | null\>(null);

  const baseUrl \=  
    process.env.NEXT\_PUBLIC\_API\_URL ||  
    (process.env.NODE\_ENV \=== 'production'  
      ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'  
      : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

  useEffect(() \=\> {  
    async function checkHealth() {  
      try {  
        setStatus('checking');  
        const res \= await fetch(\`${baseUrl}/health\`, { method: 'GET' });  
        const text \= await res.text();

        let json: HealthResponse | null \= null;  
        try {  
          json \= JSON.parse(text);  
        } catch {  
          json \= { raw: text };  
        }

        if (res.ok) {  
          setStatus('ok');  
        } else {  
          setStatus('error');  
        }

        setDetails(json);  
        setError(null);  
      } catch (e: any) {  
        setStatus('error');  
        setError(e?.message || 'Erro desconhecido');  
      }  
    }

    checkHealth();  
  }, \[baseUrl\]);

  const color \=  
    status \=== 'ok' ? 'bg-green-600' : status \=== 'error' ? 'bg-red-600' : 'bg-yellow-500';

  return (  
    \<div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"\>  
      \<span className={\`h-2 w-2 rounded-full ${color}\`} /\>  
      \<span className="font-semibold"\>API Health:\</span\>  
      \<span\>  
        {status \=== 'checking' && 'verificando...'}  
        {status \=== 'ok' && 'OK'}  
        {status \=== 'error' && 'erro'}  
      \</span\>  
      \<span className="ml-2 text-\[10px\] text-muted-foreground"\>  
        base: {baseUrl}  
      \</span\>  
    \</div\>  
  );  
}  
Incluir esse componente em um ponto visível do app, por exemplo em frontend/src/app/page.tsx ou no layout principal do dashboard:

tsx  
Copiar código  
// Exemplo em page.tsx ou layout:  
import { ApiHealthBadge } from '@/components/system/ApiHealthBadge';

export default function HomePage() {  
  return (  
    \<main className="p-4"\>  
      \<div className="flex items-center justify-between mb-4"\>  
        \<h1 className="text-xl font-semibold"\>Alquimista.AI\</h1\>  
        \<ApiHealthBadge /\>  
      \</div\>  
      {/\* resto do conteúdo \*/}  
    \</main\>  
  );  
}  
Não mudar identidade visual global; apenas usar classes Tailwind básicas, coerentes com o layout atual.

Tarefa 5 — Documentação: SOLUCAO-DEFINITIVA-API-BASE-URL.md  
Criar arquivo:

frontend/docs/SOLUCAO-DEFINITIVA-API-BASE-URL.md  
(ou, se já existir docs/frontend/, seguir o padrão desse diretório).

Conteúdo mínimo sugerido:

Resumo do problema anterior (URL duplicada, localhost:3001, 404).

Padrão oficial de configuração:

.env.local (dev)

.env.production (prod)

Como o next.config.js injeta a variável.

Como o api-client.ts resolve a base URL e falha se estiver mal configurado.

Como usar o ApiHealthBadge para validar rapidamente se a API está online.

Passos rápidos:

bash  
Copiar código  
cd frontend  
npm run dev  
\# Abrir http://localhost:3000  
\# Verificar ApiHealthBadge no topo da tela  
Referenciar brevemente o documento anterior SOLUCAO-URL-DUPLICADA-404.md como histórico do problema, deixando claro que este novo é a solução definitiva.

5\. Validação e Comandos  
No diretório frontend:

Instalar dependências (se necessário):

bash  
Copiar código  
npm install  
Rodar o frontend em dev:

bash  
Copiar código  
npm run dev  
Validar manualmente:

Abrir http://localhost:3000/.

Ver se o ApiHealthBadge aparece.

Confirmar que a base mostrada é https://c5loeivg0k.execute-api.us-east-1.amazonaws.com.

Confirmar que o status vai para OK e, se houver console/network, a chamada /health responde com o JSON esperado.

Confirmar que não há nenhuma dependência de http://localhost:3001 no código.

6\. Critérios de Aceite  
 Nenhuma ocorrência de http://localhost:3001 no projeto frontend (principalmente em next.config.js).

 .env.local configurado com NEXT\_PUBLIC\_API\_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com.

 api-client.ts usando NEXT\_PUBLIC\_API\_URL e fallback seguro para dev/prod, com erro claro se nada estiver definido.

 ApiHealthBadge (ou componente equivalente) disponível e funcional na interface, mostrando base da API e status.

 Documento SOLUCAO-DEFINITIVA-API-BASE-URL.md criado e alinhado com a arquitetura atual.

 npm run dev funciona sem erros e a navegação em http://localhost:3000/ não depende de nenhum serviço em localhost:3001.

7\. Entrega Esperada do Kiro  
Lista dos arquivos modificados/criados.

Trechos finais de:

next.config.js

src/lib/api-client.ts

src/components/system/ApiHealthBadge.tsx (ou caminho equivalente)

Print ou log textual de:

Execução do npm run dev sem erros críticos.

Confirmação de acesso a http://localhost:3000/ com o health badge em OK.

Confirmação de que SOLUCAO-DEFINITIVA-API-BASE-URL.md foi criado com o conteúdo solicitado.

perl  
Copiar código

Quer que eu salve este blueprint como documentação oficial da Alquimista.AI antes de você rodar no Kiro?  
::contentReference\[oaicite:0\]{index=0}

Pensando

