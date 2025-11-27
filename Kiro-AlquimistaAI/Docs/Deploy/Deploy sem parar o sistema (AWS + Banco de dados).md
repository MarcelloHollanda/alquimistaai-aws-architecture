\# Blueprint · Deploy sem parar o sistema

\#\# 1\. Conceito-base  
\- \*\*Produção\*\* \= URL que seus clientes usam.  
\- \*\*Staging/Lab\*\* \= outro branch do mesmo projeto para testar.  
\- Você \*\*só mexe no staging\*\*. Quando estiver ok, você \*\*promove para produção\*\*.

\---

\#\# 2\. Estrutura mínima  
1\. \*\*AWS\*\*  
   \- \`aws-prod\` → rodando para os clientes.  
   \- \`aws-staging\` → cópia para testes.  
2\. \*\*Banco de dados\*\*  
   \- 1 banco principal (prod).  
   \- Opcional: 1 banco de testes (dev) para brincar sem medo.  
3\. \*\*.env separado\*\*  
   \- Prod: chaves reais.  
   \- Staging: chaves de teste.

\---

\#\# 3\. Fluxo do dia a dia  
1\. Detectou erro em produção.  
2\. Abre o \*\*aws-staging\*\*.  
3\. Reproduz o erro lá.  
4\. Corrige o código e testa.  
5\. Só depois que funcionar, você \*\*copia o código corrigido para o repl-prod\*\* (ou dá o deploy via GitHub).  
6\. Produção volta a rodar \*\*sem ter ficado quebrando na frente do cliente\*\*.

\---

\#\# 4\. Como não derrubar a API no AWS  
\- Ative o servidor HTTP com \*\*healthcheck\*\* (ex.: \`/health\`).  
\- Faça o servidor subir rápido (sem scripts demorados no \`index.js\`).  
\- Suba o código novo e \*\*só troque o AWS que está público quando o novo já estiver de pé\*\*.  
\- Se usar domínio próprio, você pode:  
  \- deixar \`api.meudominio.com\` apontando para o \*\*AWS-prod\*\*,  
  \- e testar no endereço do \*\*AWS-staging\*\*.  
  \- Quando aprovar, você substitui o código do prod pelo do staging.

\---

\#\# 5\. Integração com GitHub (recomendado)  
1\. Código fica no GitHub.  
2\. Branch \`main\` \= produção.  
3\. Branch \`dev\` \= staging.  
4\. AWS fica conectado ao GitHub.  
5\. Você testa no AWSt usando o código do \`dev\`.  
6\. Deu certo? Faz merge para \`main\` → AWS puxa → produção atualiza.

Isso te dá exatamente o que você chamou de “só depois de testada a nova versão eu libero”.

\---

\#\# 6\. Banco de dados: atenção às migrações  
\- Erros de sistema muitas vezes são \*\*de código\*\*, não de banco. Esses você corrige no AWS e pronto.  
\- Mas se for mudar tabela, faça assim:  
  1\. Crie a migração primeiro no banco de \*\*dev\*\*.  
  2\. Teste se o app continua respondendo.  
  3\. Só então rode a mesma migração no banco de \*\*prod\*\*.  
\- Evite comandos que derrubem tabela em produção.  
\- Use colunas novas em vez de apagar colunas antigas.

\---

\#\# 7\. Feature flags (opcional, mas poderoso)  
\- No banco de dados crie uma tabela \`feature\_flags\`.  
\- Seu backend lê essa tabela e decide se uma função nova fica ativa ou não.  
\- Assim você pode \*\*subir o código\*\* mas \*\*não mostrar a função\*\* até ter certeza.

\---

\#\# 8\. Plano de emergência  
\- Sempre tenha a versão anterior salva (tag no GitHub ou cópia do Repl).  
\- Se a nova quebrar, você volta para a anterior.  
\- Isso é o seu “rollback”.

\---

\#\# 9\. Checklist rápido de deploy sem parar  
\- \[ \] Corrigi no \`AWS-staging\`  
\- \[ \] Testei chamadas reais de API  
\- \[ \] Testei com banco de teste  
\- \[ \] Copiei para \`AWS-prod\` \*\*ou\*\* fiz merge para \`main\`  
\- \[ \] Conferi \`/health\`  
\- \[ \] Anotei versão (log no banco de dados)

