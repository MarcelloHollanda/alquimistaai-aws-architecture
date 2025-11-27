# Requirements Document - Correção de Validação CDK e TypeScript

## Introdução

Este documento define os requisitos para corrigir os avisos de validação do sistema AlquimistaAI relacionados à infraestrutura CDK e compilação TypeScript, **sem alterar migrations ou fluxo de banco de dados Aurora**.

## Glossário

- **CDK (Cloud Development Kit)**: Framework da AWS para definir infraestrutura como código usando TypeScript
- **Stack**: Unidade de deployment do CDK que agrupa recursos AWS relacionados
- **FibonacciStack**: Stack principal que contém o Cognito User Pool e outros recursos core
- **Cognito User Pool**: Serviço AWS de autenticação e gerenciamento de usuários
- **Aurora**: Banco de dados PostgreSQL serverless já configurado e funcional
- **Lambda Handler**: Função serverless que processa requisições da API
- **Validador**: Script PowerShell que verifica integridade do sistema

## Requirements

### Requirement 1: Corrigir Validação de CDK Stack

**User Story:** Como desenvolvedor, quero que o validador reconheça corretamente a arquitetura CDK existente, para que não apareçam falsos positivos sobre stacks faltando.

#### Acceptance Criteria

1. WHEN o validador executa a verificação de CDK Stacks, THE Sistema SHALL reconhecer que o Cognito User Pool está implementado dentro do FibonacciStack
2. WHEN o validador verifica `lib/cognito-stack.ts`, THE Sistema SHALL marcar como opcional ou remover da lista de verificação obrigatória
3. WHEN o validador completa a verificação de CDK, THE Sistema SHALL reportar "CDK Stacks: 3/3 OK" (alquimista, fibonacci, nigredo)
4. WHERE a arquitetura usa Cognito integrado ao FibonacciStack, THE Sistema SHALL documentar esta decisão arquitetural

### Requirement 2: Corrigir Erros de Compilação TypeScript

**User Story:** Como desenvolvedor, quero que o código TypeScript compile sem erros, para que o sistema possa ser deployado com sucesso.

#### Acceptance Criteria

1. WHEN o comando `npm run build` é executado, THE Sistema SHALL compilar sem erros TypeScript
2. WHEN imports de módulos compartilhados são usados, THE Sistema SHALL resolver corretamente as exportações de `lambda/shared/database.ts` e `lambda/shared/error-handler.ts`
3. WHEN o código usa a biblioteca Stripe, THE Sistema SHALL ter as dependências corretas instaladas
4. WHEN o logger registra erros, THE Sistema SHALL usar a sintaxe correta do logger estruturado
5. IF tipos implícitos 'any' são detectados, THEN THE Sistema SHALL adicionar tipagem explícita

### Requirement 3: Atualizar Documentação de Status

**User Story:** Como desenvolvedor, quero documentação atualizada sobre o estado do sistema, para entender rapidamente o que está funcional e o que precisa atenção.

#### Acceptance Criteria

1. THE Sistema SHALL criar ou atualizar arquivo `STATUS-SISTEMA-ALQUIMISTA-AI.md` com status atual de todos os componentes
2. THE Sistema SHALL documentar que Cognito está integrado ao FibonacciStack (não em stack separada)
3. THE Sistema SHALL manter documentação existente de Aurora sem alterações
4. THE Sistema SHALL listar quais correções foram aplicadas em arquivos CDK e TypeScript
5. THE Sistema SHALL incluir resultado final do script `validate-system-complete.ps1`

### Requirement 4: Preservar Integridade do Banco de Dados

**User Story:** Como desenvolvedor, quero garantir que nenhuma alteração seja feita no fluxo de banco de dados, para manter a estabilidade do sistema Aurora já configurado.

#### Acceptance Criteria

1. THE Sistema SHALL NOT modificar arquivos em `database/migrations/`
2. THE Sistema SHALL NOT alterar scripts de aplicação de migrations (`apply-migrations-aurora-dev.ps1`)
3. THE Sistema SHALL NOT modificar documentação de Aurora (`RESUMO-AURORA-OFICIAL.md`, `COMANDOS-RAPIDOS-AURORA.md`)
4. THE Sistema SHALL NOT introduzir dependências de Supabase em fluxos obrigatórios
5. THE Sistema SHALL manter todas as 10 migrations validadas como estão

### Requirement 5: Compatibilidade com Windows

**User Story:** Como desenvolvedor usando Windows, quero que todas as correções e comandos funcionem nativamente no meu ambiente, para não precisar de ferramentas adicionais.

#### Acceptance Criteria

1. WHEN comandos são sugeridos ou documentados, THE Sistema SHALL usar sintaxe PowerShell/CMD
2. THE Sistema SHALL NOT usar operadores bash como `&&`, `;` em comandos de uma linha
3. THE Sistema SHALL NOT usar comandos Unix como `mkdir -p`, brace expansion
4. WHEN paths são referenciados, THE Sistema SHALL usar formato Windows compatível
5. THE Sistema SHALL testar que `npm run build` funciona em ambiente Windows
