# Documento de Requisitos

## Introdução

Este documento especifica os requisitos para corrigir as descrições dos IP Sets do AWS WAF que estão causando falhas no deploy da `WAFStack-dev` devido a violações do padrão regex exigido pelo serviço AWS WAFv2.

## Glossário

- **WAF (Web Application Firewall)**: Serviço AWS que protege aplicações web contra ataques comuns
- **IP Set**: Coleção de endereços IP ou blocos CIDR usados em regras do WAF
- **Regex Pattern**: Expressão regular que define o formato válido para descrições: `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`
- **WAFStack**: Stack CDK que provisiona recursos do AWS WAF
- **Allowlist**: Lista de IPs permitidos (escritórios, CI/CD, health checks)
- **Blocklist**: Lista de IPs bloqueados (IPs maliciosos identificados)

## Requisitos

### Requisito 1: Correção das Descrições dos IP Sets

**User Story:** Como desenvolvedor DevOps, eu quero que as descrições dos IP Sets do WAF respeitem o padrão regex da AWS, para que o deploy da WAFStack seja bem-sucedido.

#### Acceptance Criteria

1. WHEN o sistema valida a descrição do IP Set de allowlist, THE WAFStack SHALL usar apenas caracteres permitidos pelo regex `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`

2. WHEN o sistema valida a descrição do IP Set de blocklist, THE WAFStack SHALL usar apenas caracteres permitidos pelo regex `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`

3. THE WAFStack SHALL remover caracteres acentuados (ó, í, ú, etc.) das descrições dos IP Sets

4. THE WAFStack SHALL remover parênteses das descrições dos IP Sets

5. THE WAFStack SHALL manter o significado semântico das descrições após a correção

### Requisito 2: Validação do Deploy

**User Story:** Como desenvolvedor DevOps, eu quero validar que o deploy da WAFStack funciona após as correções, para que o sistema possa ser implantado sem erros.

#### Acceptance Criteria

1. WHEN o comando `cdk synth WAFStack-dev` é executado, THE sistema SHALL completar sem erros de validação

2. WHEN o comando `cdk deploy WAFStack-dev` é executado, THE sistema SHALL provisionar os recursos do WAF com sucesso

3. THE sistema SHALL retornar código de status 0 após deploy bem-sucedido

4. THE sistema SHALL criar os IP Sets com as descrições corrigidas no console AWS WAF

### Requisito 3: Documentação das Mudanças

**User Story:** Como membro da equipe, eu quero documentação clara sobre as mudanças realizadas, para que futuras modificações sigam o padrão correto.

#### Acceptance Criteria

1. THE sistema SHALL documentar o padrão regex aceito pela AWS WAFv2

2. THE sistema SHALL documentar exemplos de descrições válidas e inválidas

3. THE sistema SHALL incluir comentários no código explicando as restrições de caracteres

4. THE sistema SHALL atualizar documentação existente sobre o WAF com as novas diretrizes

### Requisito 4: Prevenção de Regressão

**User Story:** Como desenvolvedor, eu quero garantir que erros similares não ocorram no futuro, para que o sistema mantenha conformidade com os requisitos da AWS.

#### Acceptance Criteria

1. THE sistema SHALL validar descrições de IP Sets antes do deploy

2. WHEN uma descrição contém caracteres inválidos, THE sistema SHALL exibir mensagem de erro clara

3. THE sistema SHALL fornecer sugestões de correção quando detectar caracteres inválidos

4. THE sistema SHALL incluir validação em testes automatizados

## Restrições Técnicas

- Região AWS: `us-east-1`
- Arquivo alvo: `lib/waf-stack.ts`
- Padrão regex obrigatório: `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`
- Caracteres permitidos: letras (a-z, A-Z), números (0-9), underscore (_), espaços, e símbolos: `+ = : # @ / - , .`
- Caracteres proibidos: acentos, parênteses, caracteres especiais não listados acima

## Critérios de Sucesso

1. Deploy da WAFStack-dev completa sem erros
2. IP Sets criados com descrições válidas
3. Documentação atualizada
4. Testes de validação implementados
