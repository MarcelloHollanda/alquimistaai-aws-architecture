# Requisitos - Pipeline CI/CD + Guardrails AWS

## Introdução

Este documento define os requisitos para implementação de um pipeline CI/CD completo e guardrails de segurança, custo e observabilidade para o projeto AlquimistaAI na AWS, garantindo compatibilidade total com Windows (PowerShell/cmd) e o estado atual do repositório.

## Glossário

- **Sistema CI/CD**: Sistema de integração e entrega contínua baseado em GitHub Actions
- **OIDC**: OpenID Connect - protocolo de autenticação federada entre GitHub e AWS
- **Guardrails**: Controles automatizados de segurança, custo e observabilidade
- **Pipeline**: Sequência automatizada de etapas de validação e deploy
- **CDK**: AWS Cloud Development Kit - ferramenta de infraestrutura como código
- **Aurora**: Amazon Aurora Serverless v2 PostgreSQL - banco de dados do projeto
- **Stack**: Conjunto de recursos AWS gerenciados pelo CDK (Fibonacci, Nigredo, Alquimista)

---

## Requisitos

### Requisito 1: Pipeline CI/CD com GitHub Actions + OIDC

**User Story:** Como desenvolvedor, quero um pipeline automatizado que valide e faça deploy do código de forma segura, para garantir qualidade e consistência nas entregas.

#### Critérios de Aceite

1. WHEN um pull request é criado para a branch `main`, THE Sistema CI/CD SHALL executar validações sem realizar deploy
2. WHEN código é enviado para a branch `main`, THE Sistema CI/CD SHALL executar validações completas e permitir deploy controlado
3. WHEN uma tag de versão é criada, THE Sistema CI/CD SHALL permitir deploy em ambiente de produção com aprovação manual
4. THE Sistema CI/CD SHALL autenticar na AWS usando OIDC GitHub sem armazenar credenciais de longo prazo
5. WHILE o pipeline está em execução, THE Sistema CI/CD SHALL executar as seguintes etapas em ordem:
   - Instalação de dependências (`npm install`)
   - Build do backend TypeScript (`npm run build`)
   - Validação do sistema (`scripts/validate-system-complete.ps1`)
   - Síntese CDK (`cdk synth`)
   - Diff CDK (opcional, para visualização de mudanças)
   - Deploy CDK (com aprovação manual quando aplicável)

### Requisito 2: Padronização de Ambientes

**User Story:** Como engenheiro de infraestrutura, quero ambientes dev e prod claramente separados, para evitar impactos acidentais em produção.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL manter separação completa entre recursos AWS de dev e prod
2. THE Sistema CI/CD SHALL usar contextos CDK ou variáveis de ambiente para diferenciar ambientes
3. WHEN o pipeline executa em dev, THE Sistema CI/CD SHALL usar sufixo `-dev` em nomes de recursos
4. WHEN o pipeline executa em prod, THE Sistema CI/CD SHALL usar sufixo `-prod` em nomes de recursos
5. THE Sistema CI/CD SHALL validar que migrations do Aurora sejam aplicadas primeiro em dev antes de prod

### Requisito 3: Guardrails de Segurança

**User Story:** Como responsável por segurança, quero controles automatizados que detectem e alertem sobre atividades suspeitas, para proteger os dados e recursos do sistema.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL habilitar AWS CloudTrail na região us-east-1 com retenção mínima de 90 dias
2. THE Sistema CI/CD SHALL habilitar Amazon GuardDuty na região us-east-1 para detecção de ameaças
3. WHEN GuardDuty detecta um achado de severidade HIGH ou CRITICAL, THE Sistema CI/CD SHALL enviar notificação via SNS
4. THE Sistema CI/CD SHALL configurar tópico SNS dedicado para alertas de segurança
5. THE Sistema CI/CD SHALL registrar logs de CloudTrail em bucket S3 com criptografia habilitada
6. THE Sistema CI/CD SHALL configurar notificações de e-mail para o tópico SNS de segurança

### Requisito 4: Guardrails de Custo

**User Story:** Como gestor financeiro, quero alertas automáticos sobre gastos anormais ou acima do orçamento, para controlar custos da infraestrutura AWS.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL configurar AWS Budget com limite mensal definido para o projeto AlquimistaAI
2. WHEN o gasto atinge 80% do orçamento mensal, THE Sistema CI/CD SHALL enviar alerta via SNS
3. WHEN o gasto atinge 100% do orçamento mensal, THE Sistema CI/CD SHALL enviar alerta crítico via SNS
4. THE Sistema CI/CD SHALL habilitar AWS Cost Anomaly Detection para os seguintes serviços:
   - AWS Lambda
   - Amazon API Gateway
   - Amazon Aurora
   - Amazon S3
   - Amazon CloudFront
5. WHEN Cost Anomaly Detection identifica anomalia com impacto > $50, THE Sistema CI/CD SHALL enviar notificação via SNS
6. THE Sistema CI/CD SHALL configurar tópico SNS dedicado para alertas de custo

### Requisito 5: Observabilidade Mínima

**User Story:** Como engenheiro de operações, quero alarmes automáticos para problemas críticos nos serviços, para responder rapidamente a incidentes.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL criar alarme CloudWatch para erros 5XX no API Gateway do Fibonacci com threshold de 5 erros em 5 minutos
2. THE Sistema CI/CD SHALL criar alarme CloudWatch para falhas em Lambda do Fibonacci com threshold de 3 falhas em 5 minutos
3. THE Sistema CI/CD SHALL criar alarme CloudWatch para erros 5XX no API Gateway do Nigredo com threshold de 5 erros em 5 minutos
4. THE Sistema CI/CD SHALL criar alarme CloudWatch para falhas em Lambda do Nigredo com threshold de 3 falhas em 5 minutos
5. THE Sistema CI/CD SHALL criar alarme CloudWatch para conexões Aurora acima de 80% da capacidade
6. WHEN qualquer alarme CloudWatch entra em estado ALARM, THE Sistema CI/CD SHALL enviar notificação via SNS
7. THE Sistema CI/CD SHALL configurar tópico SNS dedicado para alertas operacionais
8. THE Sistema CI/CD SHALL configurar retenção de logs CloudWatch de 30 dias para todas as Lambdas
9. THE Sistema CI/CD SHALL configurar retenção de logs CloudWatch de 30 dias para API Gateway

### Requisito 6: Compatibilidade com Windows

**User Story:** Como desenvolvedor Windows, quero executar todos os comandos localmente usando PowerShell, para manter consistência com meu ambiente de desenvolvimento.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL documentar todos os comandos CLI em formato PowerShell (.ps1)
2. THE Sistema CI/CD SHALL evitar uso de comandos bash-específicos em scripts locais
3. WHEN scripts auxiliares precisam ser executados localmente, THE Sistema CI/CD SHALL fornecer versão PowerShell
4. THE Sistema CI/CD SHALL validar que `scripts/validate-system-complete.ps1` funciona corretamente no pipeline
5. THE Sistema CI/CD SHALL usar separadores de comando PowerShell (`;`) ao invés de bash (`&&`)

### Requisito 7: Integração com Estado Atual do Repositório

**User Story:** Como mantenedor do projeto, quero que o pipeline respeite o estado atual do repositório, para evitar conflitos com migrations e configurações existentes.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL validar que migrations 001-010 do Aurora estão no estado correto (008 aplicada, 009 pulada, 010 aplicada)
2. THE Sistema CI/CD SHALL executar `scripts/apply-migrations-aurora-dev.ps1` apenas quando necessário
3. THE Sistema CI/CD SHALL validar que os 3 stacks CDK oficiais (Fibonacci, Nigredo, Alquimista) compilam sem erros
4. THE Sistema CI/CD SHALL validar que Cognito User Pool está configurado dentro do FibonacciStack
5. THE Sistema CI/CD SHALL validar que dependência Stripe (v14.21.0) está instalada corretamente
6. THE Sistema CI/CD SHALL validar que variáveis de ambiente STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET estão configuradas
7. THE Sistema CI/CD SHALL NÃO alterar estrutura de banco de dados ou migrations existentes

### Requisito 8: Rollback e Recuperação

**User Story:** Como engenheiro de confiabilidade, quero procedimentos claros de rollback, para recuperar rapidamente de deploys problemáticos.

#### Critérios de Aceite

1. WHEN `validate-system-complete.ps1` falha, THE Sistema CI/CD SHALL interromper o pipeline e reportar erro detalhado
2. WHEN `cdk synth` falha, THE Sistema CI/CD SHALL interromper o pipeline e reportar erro de compilação
3. WHEN `cdk deploy` falha parcialmente, THE Sistema CI/CD SHALL manter estado anterior dos recursos não afetados
4. THE Sistema CI/CD SHALL documentar procedimento de rollback manual usando `cdk deploy` com versão anterior
5. THE Sistema CI/CD SHALL manter histórico de deploys em CloudWatch Logs por 90 dias
6. THE Sistema CI/CD SHALL permitir re-execução manual do pipeline em caso de falha temporária

### Requisito 9: Notificações e Alertas

**User Story:** Como membro da equipe, quero receber notificações consolidadas sobre o status do sistema, para estar ciente de problemas e mudanças.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL criar 3 tópicos SNS distintos:
   - `alquimista-security-alerts` para alertas de segurança
   - `alquimista-cost-alerts` para alertas de custo
   - `alquimista-ops-alerts` para alertas operacionais
2. THE Sistema CI/CD SHALL permitir configuração de múltiplos e-mails por tópico SNS
3. THE Sistema CI/CD SHALL incluir contexto relevante em cada notificação (serviço, métrica, threshold)
4. THE Sistema CI/CD SHALL formatar notificações de forma legível para humanos
5. WHEN pipeline completa com sucesso, THE Sistema CI/CD SHALL enviar notificação de sucesso (opcional)
6. WHEN pipeline falha, THE Sistema CI/CD SHALL enviar notificação de falha com logs relevantes

### Requisito 10: Documentação e Manutenibilidade

**User Story:** Como novo membro da equipe, quero documentação clara sobre o pipeline e guardrails, para entender e manter o sistema facilmente.

#### Critérios de Aceite

1. THE Sistema CI/CD SHALL fornecer documento README.md explicando arquitetura do pipeline
2. THE Sistema CI/CD SHALL fornecer documento com comandos rápidos para operações comuns
3. THE Sistema CI/CD SHALL documentar processo de configuração inicial do OIDC GitHub-AWS
4. THE Sistema CI/CD SHALL documentar processo de configuração de secrets no GitHub
5. THE Sistema CI/CD SHALL documentar processo de configuração de tópicos SNS e assinaturas
6. THE Sistema CI/CD SHALL incluir diagramas textuais/ASCII da arquitetura
7. THE Sistema CI/CD SHALL documentar troubleshooting de problemas comuns

---

## Requisitos Não-Funcionais

### Performance

- Pipeline deve completar validações em menos de 10 minutos
- Deploy completo (3 stacks) deve completar em menos de 30 minutos
- Alarmes CloudWatch devem disparar em menos de 5 minutos após detecção

### Segurança

- Nenhuma credencial AWS de longo prazo deve ser armazenada no GitHub
- Todas as comunicações com AWS devem usar TLS 1.2+
- Logs de CloudTrail devem ser imutáveis após criação
- Tópicos SNS devem usar criptografia em repouso

### Confiabilidade

- Pipeline deve ter taxa de sucesso > 95% para builds válidos
- Alarmes devem ter taxa de falsos positivos < 5%
- Notificações SNS devem ser entregues em 99.9% dos casos

### Manutenibilidade

- Código de infraestrutura deve seguir padrões TypeScript do projeto
- Configurações devem ser parametrizáveis via variáveis de ambiente
- Mudanças no pipeline devem ser versionadas no Git

---

## Dependências

- GitHub Actions habilitado no repositório
- Conta AWS com permissões administrativas para configuração inicial
- Região AWS us-east-1 disponível
- Node.js 20.x instalado no ambiente de CI
- AWS CDK CLI instalado no ambiente de CI
- PowerShell 7+ para execução local de scripts

---

## Restrições

- Pipeline deve funcionar exclusivamente em Windows (GitHub Actions runners)
- Não deve alterar migrations de banco de dados existentes (001-010)
- Não deve modificar estrutura de stacks CDK existentes (Fibonacci, Nigredo, Alquimista)
- Deve respeitar limites de free tier AWS quando possível
- Deve usar apenas serviços AWS disponíveis em us-east-1

---

## Critérios de Aceite Globais

1. Todos os requisitos funcionais implementados e testados
2. Pipeline executa com sucesso em ambiente de teste
3. Guardrails de segurança, custo e observabilidade ativos e funcionais
4. Documentação completa e revisada
5. Aprovação do responsável técnico do projeto
