# Documento de Requisitos - WAF + Edge Security

## Introdução

Este documento define os requisitos para implementação de proteção de borda (edge security) nas APIs públicas do sistema AlquimistaAI utilizando AWS WAF v2. A solução visa proteger as APIs do Fibonacci e Nigredo contra ataques comuns, abuso de taxa e outras ameaças de segurança, integrando-se aos guardrails de segurança já existentes (CloudTrail, GuardDuty, SNS).

## Glossário

- **Sistema WAF**: AWS WAF v2 (Web Application Firewall) responsável por filtrar e monitorar requisições HTTP/HTTPS
- **Web ACL**: Access Control List do WAF que contém regras de segurança aplicadas a recursos específicos
- **HTTP API**: API Gateway HTTP APIs que expõem os backends Fibonacci e Nigredo
- **Managed Rules**: Conjuntos de regras gerenciadas pela AWS para proteção contra ameaças comuns
- **Rate-based Rule**: Regra que limita número de requisições por IP em um período de tempo
- **Ambiente Dev**: Ambiente de desenvolvimento com configurações mais permissivas
- **Ambiente Prod**: Ambiente de produção com configurações mais restritivas
- **False Positive**: Bloqueio incorreto de tráfego legítimo pelo WAF
- **Guardrails de Segurança**: Conjunto de controles de segurança já implementados (CloudTrail, GuardDuty, SNS)

## Requisitos

### Requisito 1: Proteção de APIs em Desenvolvimento

**User Story:** Como desenvolvedor do sistema, quero que as APIs HTTP de desenvolvimento (Fibonacci/Nigredo) sejam protegidas por WAF, para que possamos identificar padrões de ataque sem impactar o desenvolvimento.

#### Acceptance Criteria

1. WHEN requisições forem feitas às HTTP APIs de desenvolvimento, THE Sistema WAF SHALL aplicar uma Web ACL Dev com regras gerenciadas AWS
2. WHEN requisições forem feitas às HTTP APIs de desenvolvimento, THE Sistema WAF SHALL aplicar rate limiting básico por endereço IP
3. WHILE o ambiente estiver em modo desenvolvimento, THE Sistema WAF SHALL registrar todas as violações de regras em CloudWatch Logs
4. WHERE configuração inicial for necessária, THE Sistema WAF SHALL operar em modo "count" permitindo observação antes de bloqueios

### Requisito 2: Proteção de APIs em Produção

**User Story:** Como responsável pela segurança do sistema, quero que as APIs HTTP de produção sejam protegidas com regras mais restritivas, para que o sistema esteja protegido contra ataques reais.

#### Acceptance Criteria

1. WHEN requisições forem feitas às HTTP APIs de produção, THE Sistema WAF SHALL aplicar uma Web ACL Prod com regras gerenciadas AWS
2. WHEN requisições forem feitas às HTTP APIs de produção, THE Sistema WAF SHALL aplicar rate limiting mais restritivo que o ambiente dev
3. WHILE o ambiente estiver em produção, THE Sistema WAF SHALL bloquear requisições que violem as regras configuradas
4. IF uma requisição violar múltiplas regras, THEN THE Sistema WAF SHALL registrar todas as violações no log

### Requisito 3: Utilização de Regras Gerenciadas AWS

**User Story:** Como arquiteto de segurança, quero utilizar conjuntos de regras gerenciadas pela AWS, para que o sistema esteja protegido contra ameaças conhecidas seguindo boas práticas.

#### Acceptance Criteria

1. THE Sistema WAF SHALL incluir o conjunto AWSManagedRulesCommonRuleSet em ambos os ambientes
2. THE Sistema WAF SHALL incluir o conjunto AWSManagedRulesKnownBadInputsRuleSet em ambos os ambientes
3. THE Sistema WAF SHALL incluir o conjunto AWSManagedRulesSQLiRuleSet para proteção contra SQL injection
4. WHERE necessário para otimização, THE Sistema WAF SHALL permitir configuração de prioridade entre conjuntos de regras
5. THE Sistema WAF SHALL documentar todos os conjuntos de regras gerenciadas utilizados

### Requisito 4: Limitação de Taxa de Requisições

**User Story:** Como operador do sistema, quero que requisições suspeitas sejam limitadas por taxa, para que ataques de força bruta e DDoS sejam mitigados.

#### Acceptance Criteria

1. WHEN um endereço IP exceder 2000 requisições em 5 minutos no ambiente dev, THE Sistema WAF SHALL registrar o evento em modo count
2. WHEN um endereço IP exceder 1000 requisições em 5 minutos no ambiente prod, THE Sistema WAF SHALL bloquear requisições subsequentes por 10 minutos
3. THE Sistema WAF SHALL aplicar rate limiting baseado em endereço IP de origem
4. WHERE IPs legítimos precisarem de exceção, THE Sistema WAF SHALL permitir configuração de lista de permissões (allowlist)
5. THE Sistema WAF SHALL registrar todos os eventos de rate limiting em CloudWatch Logs

### Requisito 5: Registro e Auditoria de Eventos WAF

**User Story:** Como analista de segurança, quero que todos os eventos do WAF sejam registrados centralmente, para que eu possa investigar incidentes e ajustar regras.

#### Acceptance Criteria

1. THE Sistema WAF SHALL registrar logs de dev em CloudWatch Log Group `/aws/waf/alquimista-dev`
2. THE Sistema WAF SHALL registrar logs de prod em CloudWatch Log Group `/aws/waf/alquimista-prod`
3. WHEN uma requisição for bloqueada, THE Sistema WAF SHALL registrar IP de origem, regra violada, timestamp e detalhes da requisição
4. THE Sistema WAF SHALL reter logs por no mínimo 30 dias em dev e 90 dias em prod
5. WHERE necessário para análise de longo prazo, THE Sistema WAF SHALL permitir exportação de logs para S3

### Requisito 6: Integração com Guardrails de Segurança Existentes

**User Story:** Como engenheiro de segurança, quero que eventos do WAF sejam correlacionados com GuardDuty e CloudTrail, para que eu tenha visão unificada de segurança.

#### Acceptance Criteria

1. THE Sistema WAF SHALL documentar como correlacionar eventos WAF com findings do GuardDuty
2. THE Sistema WAF SHALL documentar como correlacionar eventos WAF com eventos do CloudTrail
3. WHERE bloqueios críticos ocorrerem (múltiplas regras violadas), THE Sistema WAF SHALL permitir integração com SNS de segurança existente
4. THE Sistema WAF SHALL fornecer queries CloudWatch Insights para análise de eventos
5. THE Sistema WAF SHALL documentar procedimentos operacionais para investigação de incidentes

### Requisito 7: Provisionamento via Infraestrutura como Código

**User Story:** Como engenheiro DevOps, quero que toda infraestrutura WAF seja provisionada via CDK TypeScript, para que mudanças sejam versionadas e auditáveis.

#### Acceptance Criteria

1. THE Sistema WAF SHALL ser provisionado através de CDK TypeScript integrado às stacks existentes
2. THE Sistema WAF SHALL evitar configuração manual no console AWS
3. WHEN mudanças forem necessárias, THE Sistema WAF SHALL permitir atualização via `cdk deploy`
4. THE Sistema WAF SHALL seguir padrões de nomenclatura e tagging do projeto AlquimistaAI
5. THE Sistema WAF SHALL ser incluído no fluxo CI/CD existente com validação automática

### Requisito 8: Documentação Operacional e Troubleshooting

**User Story:** Como operador do sistema, quero documentação clara sobre operação do WAF, para que eu possa responder rapidamente a incidentes e ajustar configurações.

#### Acceptance Criteria

1. THE Sistema WAF SHALL fornecer documentação explicando como verificar se tráfego está sendo bloqueado
2. THE Sistema WAF SHALL fornecer documentação explicando como adicionar IPs à lista de permissões (allowlist)
3. THE Sistema WAF SHALL fornecer documentação explicando como adicionar IPs à lista de bloqueio (blocklist)
4. THE Sistema WAF SHALL fornecer documentação explicando como identificar e corrigir false positives
5. THE Sistema WAF SHALL fornecer runbook para resposta a incidentes de segurança detectados pelo WAF
6. THE Sistema WAF SHALL integrar documentação ao índice operacional existente em `docs/INDEX-OPERATIONS-AWS.md`

---

## Requisitos Não Funcionais

### Performance
- O WAF não deve adicionar mais de 10ms de latência às requisições
- Regras devem ser otimizadas para minimizar impacto em throughput

### Custo
- Configuração deve considerar custos de WAF (por Web ACL, por regra, por requisição)
- Documentar estimativa de custos mensais para dev e prod

### Disponibilidade
- WAF deve ter SLA compatível com as APIs protegidas (99.9%+)
- Falhas no WAF não devem derrubar as APIs (fail-open configurável)

### Segurança
- Logs do WAF não devem conter dados sensíveis (PII, tokens, senhas)
- Acesso aos logs deve ser restrito via IAM

---

## Rastreabilidade

Todos os requisitos acima serão rastreados nas tarefas de implementação do arquivo `tasks.md`, garantindo que cada acceptance criteria seja atendido durante a execução do projeto.
