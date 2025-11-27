# Documento de Requisitos

## Introdução

Correção de erros de validação no deploy da WAFStack-dev relacionados a:
1. Descrição da WebACL Dev contendo caracteres inválidos
2. ARN de destino de logs do WAF com formato incorreto

## Glossário

- **WAFStack**: Stack CDK que implementa AWS WAF (Web Application Firewall)
- **WebACL**: Web Access Control List - recurso principal do WAF que define regras de segurança
- **Log Group**: Recurso do CloudWatch Logs para armazenar logs
- **ARN**: Amazon Resource Name - identificador único de recursos AWS
- **LOG_DESTINATION**: Parâmetro do WAF que especifica onde os logs devem ser enviados

## Requisitos

### Requisito 1: Corrigir Descrição da WebACL Dev

**User Story:** Como desenvolvedor DevOps, eu quero que a descrição da WebACL Dev seja compatível com o regex da AWS, para que o deploy não falhe com erro de validação.

#### Acceptance Criteria

1. WHEN o CDK sintetiza a WAFStack-dev, THE WebACL Dev SHALL ter uma descrição que corresponda ao regex `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`
2. THE descrição da WebACL Dev SHALL conter apenas caracteres ASCII sem acentos
3. THE descrição da WebACL Dev SHALL manter o sentido semântico de "modo observação"
4. THE descrição da WebACL Dev SHALL não conter caracteres especiais como parênteses ou acentos
5. WHEN o deploy é executado, THE validação de descrição SHALL passar sem erros

### Requisito 2: Corrigir Descrição da WebACL Prod

**User Story:** Como desenvolvedor DevOps, eu quero que a descrição da WebACL Prod seja compatível com o regex da AWS, para que futuros deploys não falhem.

#### Acceptance Criteria

1. THE descrição da WebACL Prod SHALL conter apenas caracteres ASCII sem acentos
2. THE descrição da WebACL Prod SHALL corresponder ao regex `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`
3. THE descrição da WebACL Prod SHALL manter o sentido semântico de "modo bloqueio"
4. THE descrição da WebACL Prod SHALL não conter caracteres especiais inválidos

### Requisito 3: Corrigir ARN de Logging do WAF

**User Story:** Como desenvolvedor DevOps, eu quero que o ARN de destino de logs do WAF seja aceito pela AWS, para que a configuração de logging funcione corretamente.

#### Acceptance Criteria

1. THE configuração de logging do WAF Dev SHALL usar o ARN do Log Group sem sufixo `:*`
2. THE configuração de logging do WAF Prod SHALL usar o ARN do Log Group sem sufixo `:*`
3. WHEN o CDK cria a LoggingConfiguration, THE logDestinationConfigs SHALL usar `logGroupArn` diretamente
4. THE ARN de destino SHALL ser aceito pelo WAF como LOG_DESTINATION válido
5. WHEN o deploy é executado, THE validação de ARN SHALL passar sem erros

### Requisito 4: Validar Deploy Completo

**User Story:** Como desenvolvedor DevOps, eu quero validar que todas as correções funcionam em conjunto, para garantir que o deploy seja bem-sucedido.

#### Acceptance Criteria

1. WHEN executamos `npm run build`, THE compilação TypeScript SHALL completar sem erros
2. WHEN executamos `npx cdk synth WAFStack-dev --context env=dev`, THE síntese SHALL completar sem erros de validação
3. WHEN executamos `npx cdk deploy WAFStack-dev --context env=dev --require-approval never`, THE deploy SHALL completar com sucesso
4. THE erro de regex em description SHALL não aparecer mais
5. THE erro de ARN inválido em LOG_DESTINATION SHALL não aparecer mais
