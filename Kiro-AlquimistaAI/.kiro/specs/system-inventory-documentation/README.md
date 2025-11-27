# Spec: Inventário e Documentação do Sistema AlquimistaAI

## Visão Geral

Esta spec define a criação de um sistema automatizado para gerar inventário completo e consolidado do Sistema AlquimistaAI, produzindo documentação técnica abrangente que serve como:

- **Referência operacional** para a equipe de desenvolvimento
- **Base de memória permanente** para ferramentas de IA que acompanham o projeto

## Objetivos

1. Gerar documento principal autossuficiente (`STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md`)
2. Gerar índice compacto otimizado para IA (`STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md`)
3. Garantir máxima fidelidade ao estado atual do sistema
4. Assegurar que nenhum segredo ou valor sensível seja exposto
5. Facilitar onboarding de novos desenvolvedores

## Documentos da Spec

- **[requirements.md](./requirements.md)** - 10 requisitos principais com critérios de aceitação EARS
- **[design.md](./design.md)** - Arquitetura técnica, componentes, propriedades de correção
- **[tasks.md](./tasks.md)** - 17 tarefas de implementação com testes obrigatórios

## Escopo

### Incluído

- Infraestrutura AWS (stacks CDK, recursos, identificadores)
- Bancos de dados (Aurora, migrations, decisões)
- APIs backend (Fibonacci, Nigredo, Painel Operacional)
- Frontend (Next.js, integração Cognito, clients)
- Autenticação (Cognito, grupos, usuários)
- CI/CD (workflows, scripts, guardrails)
- Segurança, custo e observabilidade
- Variáveis de ambiente (sem valores)
- Gaps, riscos e próximos passos

### Excluído

- Valores de segredos, senhas, tokens
- Detalhes de implementação de código
- Histórico de mudanças (git history)
- Dados de produção ou clientes

## Abordagem Técnica

### Estratégia de Coleta

1. **Análise estática** de código CDK, Lambda, Frontend
2. **Parsing de documentação** existente
3. **Extração de configurações** de workflows e scripts
4. **Validação de consistência** entre componentes
5. **Sanitização obrigatória** de valores sensíveis

### Componentes Principais

- **7 Analisadores especializados** (CDK, Database, APIs, Frontend, Auth, CI/CD, Guardrails)
- **Sanitizador de segredos** (detecção e mascaramento)
- **Validador de consistência** (completude, unicidade, referências)
- **Gerador de documentos** (markdown formatado)

### Garantias de Qualidade

- **10 Propriedades de correção** verificadas por testes
- **Testes obrigatórios** (unitários, integração, property-based)
- **Validação pré-geração** (falha se segredos detectados)
- **Mínimo 100 iterações** em testes de propriedade

## Arquivos Gerados

### Documento Principal

**Localização:** `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md`

**Conteúdo:**
- Cabeçalho com metadata e resumo executivo
- 9 seções detalhadas cobrindo todo o sistema
- Referências cruzadas a documentos existentes
- Formato otimizado para leitura humana

### Índice Compacto

**Localização:** `docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md`

**Conteúdo:**
- Bloco de identificadores-chave (IDs, URLs, ARNs)
- Seções resumidas (2-3 linhas cada)
- Lista de variáveis sem valores
- Formato otimizado para parsing por IA

## Como Usar

### Gerar Inventário Completo

```powershell
npm run generate:inventory
```

### Gerar Apenas Documento Principal

```powershell
npm run generate:inventory:main
```

### Gerar Apenas Índice Compacto

```powershell
npm run generate:inventory:index
```

### Validar Sem Gerar

```powershell
npm run validate:inventory
```

## Propriedades de Correção

1. **Completude de Stacks** - Todas as informações obrigatórias presentes
2. **Sanitização de Segredos** - Nenhum valor sensível exposto
3. **Consistência de Referências** - Todas as referências válidas
4. **Unicidade de Identificadores** - IDs únicos por tipo/ambiente
5. **Completude de Migrations** - Correspondência SQL ↔ documentação
6. **Diferenciação de Ambientes** - Dev vs Prod claramente separados
7. **Formato de Comandos Windows** - Sintaxe PowerShell/cmd
8. **Completude de Variáveis** - Todas as informações obrigatórias
9. **Índice Sincronizado** - Correspondência com documento principal
10. **Ausência de Valores Sensíveis** - Nenhum padrão sensível detectado

## Segurança

### Padrões Detectados e Mascarados

- Chaves AWS (`AKIA...` → `AKIA************`)
- Chaves Stripe (`sk_live_...` → `sk_live_********`)
- Tokens genéricos (`token=...` → `token=********`)
- Senhas (`password=...` → `password=********`)

### Validação Crítica

Se qualquer valor sensível for detectado após sanitização:
- ❌ Geração FALHA imediatamente
- ❌ Documentos NÃO são criados
- ⚠️ Usuário é alertado

## Status

- ✅ Requirements aprovados
- ✅ Design aprovado
- ✅ Tasks aprovadas (testes obrigatórios)
- ⏳ Implementação pendente

## Próximos Passos

1. Executar tarefas 1-3 (setup e sanitizador)
2. Implementar analisadores (tarefas 4-10)
3. Implementar validador e geradores (tarefas 11-13)
4. Criar script de orquestração (tarefa 14)
5. Adicionar scripts NPM e docs (tarefas 15-16)
6. Executar e validar (tarefa 17)

## Referências

- [Contexto do Projeto](../../.kiro/steering/contexto-projeto-alquimista.md)
- [RESUMO-TECNICO-SISTEMA.md](../../RESUMO-TECNICO-SISTEMA.md)
- [docs/INDEX-OPERATIONS-AWS.md](../../docs/INDEX-OPERATIONS-AWS.md)
- [database/README.md](../../database/README.md)

---

**Última atualização:** 2025-01-19  
**Versão da Spec:** 1.0.0
