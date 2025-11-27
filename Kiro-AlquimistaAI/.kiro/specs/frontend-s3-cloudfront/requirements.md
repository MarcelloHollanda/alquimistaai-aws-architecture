# Requirements Document

## Introdução

Este documento define os requisitos para a infraestrutura de frontend estático do AlquimistaAI na AWS. O sistema deve fornecer hospedagem segura, escalável e de alta disponibilidade para as páginas comerciais do AlquimistaAI (landing pages de agentes, catálogo de produtos e página do Fibonacci), com separação clara entre ambientes de desenvolvimento e produção.

## Glossário

- **Frontend System**: Sistema de hospedagem de arquivos estáticos HTML/CSS/JS do AlquimistaAI
- **S3 Bucket**: Serviço de armazenamento de objetos da AWS usado para hospedar arquivos estáticos
- **CloudFront Distribution**: CDN da AWS que distribui conteúdo com baixa latência globalmente
- **WAF (Web Application Firewall)**: Firewall de aplicação web que protege contra ataques comuns
- **OAC (Origin Access Control)**: Mecanismo de controle de acesso que permite CloudFront acessar buckets S3 privados
- **Dev Environment**: Ambiente de desenvolvimento para testes e validações
- **Prod Environment**: Ambiente de produção acessível aos usuários finais
- **Backend APIs**: APIs do Fibonacci e Nigredo hospedadas em API Gateway + Lambda
- **CDK Stack**: Unidade de infraestrutura como código usando AWS CDK TypeScript

## Requisitos

### Requisito 1: Hospedagem Frontend Dev

**User Story:** Como desenvolvedor, eu quero um ambiente de desenvolvimento isolado para o frontend, para que eu possa testar mudanças sem afetar produção.

#### Acceptance Criteria

1. WHEN o ambiente for desenvolvimento, THE Frontend System SHALL provisionar um S3 Bucket dedicado para arquivos estáticos dev
2. WHEN o ambiente for desenvolvimento, THE Frontend System SHALL criar uma CloudFront Distribution que sirva conteúdo do bucket dev
3. WHEN um arquivo for solicitado via CloudFront dev, THE Frontend System SHALL retornar o conteúdo com cache apropriado
4. WHEN a infraestrutura dev for provisionada, THE Frontend System SHALL expor a URL pública da distribution como output do CDK

### Requisito 2: Hospedagem Frontend Prod com WAF

**User Story:** Como administrador de sistemas, eu quero um ambiente de produção protegido por WAF, para que o frontend esteja seguro contra ataques web comuns.

#### Acceptance Criteria

1. WHEN o ambiente for produção, THE Frontend System SHALL provisionar um S3 Bucket dedicado para arquivos estáticos prod
2. WHEN o ambiente for produção, THE Frontend System SHALL criar uma CloudFront Distribution protegida pelo WebAclProd existente
3. WHEN uma requisição atingir a distribution prod, THE Frontend System SHALL aplicar as regras do WAF antes de servir conteúdo
4. WHEN a infraestrutura prod for provisionada, THE Frontend System SHALL expor a URL pública da distribution como output do CDK
5. WHEN tráfego HTTP for recebido, THE Frontend System SHALL redirecionar automaticamente para HTTPS

### Requisito 3: Isolamento entre Ambientes

**User Story:** Como engenheiro de DevOps, eu quero separação completa entre dev e prod, para que mudanças em um ambiente não afetem o outro.

#### Acceptance Criteria

1. THE Frontend System SHALL manter buckets S3 separados para dev e prod com nomes distintos
2. THE Frontend System SHALL manter CloudFront Distributions separadas para dev e prod
3. THE Frontend System SHALL aplicar tags de ambiente (dev/prod) em todos os recursos provisionados
4. WHEN recursos forem criados, THE Frontend System SHALL garantir que não haja dependências cruzadas entre ambientes

### Requisito 4: Descoberta de URLs Públicas

**User Story:** Como operador, eu quero encontrar facilmente as URLs do frontend, para que eu possa acessar e validar os ambientes.

#### Acceptance Criteria

1. WHEN o deploy do CDK for concluído, THE Frontend System SHALL exibir a URL da distribution dev como output
2. WHEN o deploy do CDK for concluído, THE Frontend System SHALL exibir a URL da distribution prod como output
3. THE Frontend System SHALL documentar como obter as URLs via AWS CLI
4. THE Frontend System SHALL incluir as URLs em documentação operacional acessível

### Requisito 5: Configuração de APIs Backend

**User Story:** Como desenvolvedor frontend, eu quero que o frontend saiba qual URL de API usar, para que as chamadas sejam direcionadas ao ambiente correto.

#### Acceptance Criteria

1. THE Frontend System SHALL suportar configuração de base URL da API Fibonacci por ambiente
2. THE Frontend System SHALL suportar configuração de base URL da API Nigredo por ambiente
3. WHEN arquivos forem deployados, THE Frontend System SHALL incluir arquivo de configuração com URLs das APIs
4. THE Frontend System SHALL documentar o formato e localização do arquivo de configuração

### Requisito 6: Processo de Deploy Simplificado

**User Story:** Como operador em Windows, eu quero um processo simples para fazer deploy do frontend, para que eu possa atualizar o conteúdo rapidamente.

#### Acceptance Criteria

1. THE Frontend System SHALL fornecer comando AWS CLI documentado para upload de arquivos ao S3 dev
2. THE Frontend System SHALL fornecer comando AWS CLI documentado para upload de arquivos ao S3 prod
3. THE Frontend System SHALL documentar como invalidar cache do CloudFront após deploy
4. WHEN arquivos forem atualizados no S3, THE Frontend System SHALL servir o novo conteúdo após invalidação de cache

### Requisito 7: Provisionamento via CDK TypeScript

**User Story:** Como engenheiro de infraestrutura, eu quero toda a infra definida em CDK, para que seja versionada e reproduzível.

#### Acceptance Criteria

1. THE Frontend System SHALL definir toda infraestrutura em uma FrontendStack TypeScript
2. WHEN a stack for sintetizada, THE Frontend System SHALL gerar templates CloudFormation válidos
3. THE Frontend System SHALL integrar com a WAFStack existente via referências de stack
4. THE Frontend System SHALL seguir padrões de nomenclatura e tagging do projeto AlquimistaAI

### Requisito 8: Documentação Operacional Completa

**User Story:** Como novo membro da equipe, eu quero documentação clara, para que eu possa operar o frontend sem assistência.

#### Acceptance Criteria

1. THE Frontend System SHALL fornecer documento explicando como descobrir URLs de dev e prod
2. THE Frontend System SHALL fornecer documento com comandos de deploy para Windows PowerShell
3. THE Frontend System SHALL fornecer documento explicando como validar que CloudFront está servindo corretamente
4. THE Frontend System SHALL incluir troubleshooting de problemas comuns na documentação
