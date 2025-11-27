sem Kiro, usando **GitHub \+ ChatGPT \+ Terraform** como caminho padrão.

Vou assumir que você está no **Windows**. Se algo for diferente aí, você me avisa depois.

---

## **VISÃO GERAL DO ROTEIRO**

Nós vamos fazer só **Fase 1 agora**:

1. Preparar o ambiente no seu notebook

2. Achar a pasta raiz do projeto

3. Abrir o terminal **dentro** dessa pasta

4. Criar o repositório Git local

5. Criar o repositório no GitHub

6. Conectar os dois e enviar os arquivos

Depois que isso estiver pronto, no próximo passo eu entro com o **Terraform \+ AWS**.

Vou marcar **PONTOS DE CONFIRMAÇÃO** pra você parar e voltar aqui me dizendo o que aconteceu.

---

## **FASE 1 — Preparar o ambiente no notebook**

### **Passo 1.1 – Ver se o Git já está instalado**

1. Clique no menu **Iniciar** (ícone do Windows).

2. Digite: `cmd`

3. Clique em **Prompt de Comando**.

4. Na tela preta que abrir, digite:

`git --version`

* Se aparecer algo como: `git version 2.xx.x` → perfeito, você já tem Git.

* Se der erro tipo “git não é reconhecido” → você precisa instalar.

#### **Se precisar instalar o Git**

1. Abra o navegador (Chrome).

2. Acesse: **git-scm.com**

3. Clique em **Download for Windows**.

4. Baixe e execute o instalador.

5. Vá clicando em **Next** em tudo (configuração padrão já serve).

6. No final, clique em **Finish**.

👉 **PONTO DE CONFIRMAÇÃO \#1**  
 Volte aqui e me diga:

* Se o comando `git --version` funcionou

* Qual versão apareceu (por ex.: `2.45.0`)

---

## **FASE 2 — Encontrar a pasta raiz do seu projeto**

A “pasta raiz” é aquela que contém tudo do sistema: `src/`, `docs/`, `.kiro/`, etc. (ou nomes parecidos).

1. Abra o **Explorador de Arquivos** (atalho: `Win + E`).

2. Vá navegando até achar a pasta onde está o arquivo parecido com:  
    `O arquivo que descreve completamente o seu sistema é_.md`  
    e as pastas do projeto (por exemplo: `src`, `docs`, `.kiro`, etc.)

3. Quando você achar a pasta CERTA, **pare e não entre dentro de subpastas** (o que queremos é essa pasta principal).

Exemplo de como pode estar:

`C:\Users\SeuNome\Documentos\Fibonacci-Orquestrador\`  
  `├─ src\`  
  `├─ docs\`  
  `├─ .kiro\`  
  `├─ package.json`  
  `└─ O arquivo que descreve completamente o seu sistema é_.md`

👉 **PONTO DE CONFIRMAÇÃO \#2**  
 Guarde o caminho dessa pasta (algo como `C:\Users\SeuNome\Documentos\Fibonacci-Orquestrador`).  
 Se quiser, já pode me mandar esse caminho aqui na próxima mensagem.

---

## **FASE 3 — Abrir o terminal dentro da pasta do projeto**

Com a pasta aberta no Explorador:

### **Opção A — PowerShell pelo menu de contexto**

1. Com a pasta aberta (vendo os arquivos), **clique em um espaço vazio** dentro da janela.

2. Segure a tecla **Shift** do teclado.

3. Enquanto segura o Shift, clique com o botão **direito** do mouse.

4. Aparecendo o menu, procure algo como:

   * **“Abrir janela do PowerShell aqui”**  
      ou

   * **“Abrir no Terminal”**

Clique nessa opção.

### **Opção B — Pelo campo de endereço**

1. Na parte de cima da janela (onde aparece o caminho, ex.: `C:\Users\...`), clique uma vez.

2. O texto do caminho vai ficar selecionado.

3. Digite assim:

`cmd`

4. Aperte **Enter**.

Isso deve abrir um terminal **já dentro** da pasta do projeto.

### **Conferir se está no lugar certo**

No terminal que abriu, digite:

`dir`

Você deve ver os arquivos e pastas do seu projeto (`src`, `docs`, `.kiro`, etc.).

👉 **PONTO DE CONFIRMAÇÃO \#3**  
 Volte aqui e me diga se conseguiu abrir o terminal na pasta certa  
 (e o que apareceu quando você digitou `dir` – pode tirar print se quiser).

---

## **FASE 4 — Criar o repositório Git local**

Com o terminal dentro da pasta do projeto:

### **Passo 4.1 – Inicializar o Git**

`git init`

Isso cria um repositório Git aí dentro.

### **Passo 4.2 – (Opcional, mas recomendado) Configurar seu nome e email**

Só precisa fazer uma vez por computador:

`git config --global user.name "Seu Nome"`  
`git config --global user.email "seu-email@exemplo.com"`

Use o mesmo email da sua conta do GitHub, se já tiver.

### **Passo 4.3 – Criar um `.gitignore` básico (para não subir lixo)**

No terminal:

`notepad .gitignore`

Vai abrir o bloco de notas. Cole algo assim (podemos ajustar depois):

`node_modules/`  
`dist/`  
`.env`  
`.vscode/`  
`.DS_Store`  
`Thumbs.db`

Salve e feche.

### **Passo 4.4 – Ver o status**

`git status`

Você deve ver algo como: “untracked files” listando vários arquivos.

### **Passo 4.5 – Marcar todos os arquivos para o primeiro commit**

`git add .`

### **Passo 4.6 – Criar o primeiro commit**

`git commit -m "chore: versão inicial local do Fibonacci Orquestrador"`

Se o Git reclamar de nome/email, configure (passo 4.2) e tente de novo.

👉 **PONTO DE CONFIRMAÇÃO \#4**  
 Volte aqui e me diga se o `git commit` deu certo  
 (frase que apareceu, por ex.: “1 file changed, 100 insertions…”).

---

## **FASE 5 — Criar o repositório no GitHub**

1. Abra o navegador e acesse: [**https://github.com**](https://github.com)

2. Faça login (ou crie uma conta, se ainda não tiver).

3. No canto superior direito, clique no ícone **\+** → **New repository**.

4. Preencha:

   * **Repository name**:  
      por exemplo: `fibonacci-orquestrador-b2b`

   * **Description** (opcional):  
      “Backend Fibonacci Orquestrador B2B – arquitetura AWS”

   * **Public** ou **Private** → escolha o que preferir (Private é mais seguro).

   * **IMPORTANTE:**  
      **Não marque** as opções de criar README, .gitignore ou license automaticamente.  
      (deixe tudo desmarcado, porque o repo já existe na sua máquina.)

5. Clique em **Create repository**.

A próxima tela vai mostrar instruções para conectar um repositório existente. Vai aparecer uma URL assim:

`https://github.com/SEU-USUARIO/fibonacci-orquestrador-b2b.git`

👉 **Guarde essa URL**, vamos usar já já.

👉 **PONTO DE CONFIRMAÇÃO \#5**  
 Volte aqui e me diga o **nome do repositório** que você criou  
 (e se ele está público ou privado).

---

## **FASE 6 — Conectar o Git local ao GitHub e enviar os arquivos**

De volta ao terminal que está dentro da pasta do projeto:

### **Passo 6.1 – Adicionar o “origin” (o link do GitHub)**

Troque pela sua URL:

`git remote add origin https://github.com/SEU-USUARIO/fibonacci-orquestrador-b2b.git`

### **Passo 6.2 – Garantir que o nome do branch é `main`**

`git branch -M main`

### **Passo 6.3 – Enviar o código para o GitHub (primeiro push)**

`git push -u origin main`

* Na primeira vez, o Git pode abrir uma janela pedindo para você logar no GitHub pelo navegador.

* Siga o fluxo (“Sign in with browser”) e autorize.

* Se pedir usuário/senha, hoje o GitHub usa **token de acesso pessoal**, mas geralmente o fluxo pelo navegador já resolve.

Quando terminar, a saída vai mostrar algo como “Writing objects”, “To https://github.com…”.

### **Passo 6.4 – Conferir no site**

1. Volte para a página do repositório no GitHub.

2. Atualize (F5).

3. Você deve ver todas as pastas e arquivos do seu projeto lá.

👉 **PONTO DE CONFIRMAÇÃO \#6 (IMPORTANTE)**  
 Volte aqui e me diga:

* Se o `git push` funcionou

* Se você consegue ver os arquivos no GitHub

* O **link do repositório** (para eu usar nas próximas instruções de Terraform e CI/CD)

---

## **O que vem depois**

Quando você confirmar o **PONTO \#6**, na próxima resposta eu:

1. Vou criar o **esqueleto Terraform** (`terraform/modules` \+ `terraform/envs/dev`) para essa sua arquitetura de AWS.

2. Depois montamos o **GitHub Actions** para fazer deploy automático a cada `git push`.

---

Se em qualquer um dos passos acima der erro, printa a tela / copia a mensagem e me manda que eu corrijo o roteiro com você.

---

Quando terminarmos esse fluxo (Local → GitHub → AWS), isso já vai ser a **nova base oficial** da Alquimista.AI (como você pediu).

