# Requirements Document - Nigredo Prospecting Core

## Introduction

O Nigredo é o Núcleo de Prospecção do ecossistema AlquimistaAI, responsável por capturar e qualificar leads através de formulários públicos e landing pages. O sistema deve integrar-se perfeitamente com o Fibonacci (dashboard principal) e seguir os padrões arquiteturais AWS estabelecidos no projeto (Lambda Node.js 20, API Gateway HTTP, Aurora PostgreSQL, Next.js, S3/CloudFront).

## Glossary

- **Nigredo System**: O núcleo de prospecção que gerencia formulários públicos e captura de leads
- **Fibonacci System**: O dashboard principal do AlquimistaAI que recebe eventos do Nigredo
- **Lead**: Um potencial cliente que preencheu um formulário de prospecção
- **Prospecting Form**: Formulário público para captura de informações de leads
- **Event Webhook**: Endpoint no Fibonacci que recebe notificações de novos leads do Nigredo
- **Aurora Database**: Banco de dados PostgreSQL compartilhado com schema dedicado `nigredo`
- **API Gateway**: AWS API Gateway HTTP para exposição das APIs Lambda
- **CloudFront Distribution**: CDN da AWS para servir o frontend estático
- **S3 Bucket**: Armazenamento de objetos da AWS para hospedar build do Next.js

## Requirements

### Requirement 1

**User Story:** Como visitante anônimo, quero preencher um formulário de prospecção em uma landing page pública, para que eu possa demonstrar interesse nos serviços do AlquimistaAI

#### Acceptance Criteria

1. WHEN a visitor accesses the public prospecting form, THE Nigredo System SHALL render a responsive form with fields for name, email, phone, company, and message
2. WHEN a visitor submits the form with valid data, THE Nigredo System SHALL store the lead information in the Aurora Database schema `nigredo`
3. WHEN a visitor submits the form with invalid data, THE Nigredo System SHALL display clear validation error messages without losing entered data
4. THE Nigredo System SHALL validate email format using RFC 5322 standard before accepting submission
5. THE Nigredo System SHALL limit message field to 1000 characters maximum

### Requirement 2

**User Story:** Como administrador do Fibonacci, quero receber notificações automáticas quando novos leads são capturados, para que eu possa acompanhar a prospecção em tempo real

#### Acceptance Criteria

1. WHEN a new lead is successfully stored in the database, THE Nigredo System SHALL send an HTTP POST request to the Fibonacci System webhook endpoint `/public/nigredo-event`
2. THE Nigredo System SHALL include lead data in JSON format with fields: id, name, email, phone, company, message, and timestamp
3. IF the webhook request fails with status code 5xx, THEN THE Nigredo System SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
4. WHEN the webhook request fails after all retries, THE Nigredo System SHALL log the failure with structured logging for monitoring
5. THE Nigredo System SHALL set a timeout of 5 seconds for webhook HTTP requests

### Requirement 3

**User Story:** Como desenvolvedor, quero que o Nigredo siga os padrões arquiteturais do AlquimistaAI, para que o sistema seja consistente e manutenível

#### Acceptance Criteria

1. THE Nigredo System SHALL implement backend APIs using AWS Lambda with Node.js 20 runtime
2. THE Nigredo System SHALL expose APIs through AWS API Gateway HTTP API
3. THE Nigredo System SHALL store data in a dedicated schema `nigredo` within the existing Aurora PostgreSQL cluster
4. THE Nigredo System SHALL implement infrastructure as code using AWS CDK TypeScript
5. THE Nigredo System SHALL deploy frontend as static Next.js build to S3 with CloudFront distribution

### Requirement 4

**User Story:** Como visitante, quero que a landing page do Nigredo carregue rapidamente e seja acessível, para que eu tenha uma boa experiência ao preencher o formulário

#### Acceptance Criteria

1. THE Nigredo System SHALL serve frontend assets through CloudFront CDN with edge caching
2. THE Nigredo System SHALL achieve Lighthouse performance score above 90 for the landing page
3. THE Nigredo System SHALL implement lazy loading for non-critical assets
4. THE Nigredo System SHALL compress all static assets using gzip or brotli
5. THE Nigredo System SHALL implement proper semantic HTML and ARIA labels for accessibility compliance

### Requirement 5

**User Story:** Como administrador de segurança, quero que o Nigredo proteja dados sensíveis e previna abusos, para que o sistema seja seguro e confiável

#### Acceptance Criteria

1. THE Nigredo System SHALL encrypt all data at rest in Aurora Database using AWS KMS
2. THE Nigredo System SHALL encrypt all data in transit using TLS 1.2 or higher
3. THE Nigredo System SHALL implement rate limiting of 10 submissions per IP address per hour
4. THE Nigredo System SHALL sanitize all user inputs to prevent XSS and SQL injection attacks
5. THE Nigredo System SHALL implement CORS policies allowing only authorized domains

### Requirement 6

**User Story:** Como desenvolvedor, quero APIs RESTful bem documentadas para gerenciar leads, para que eu possa integrar o Nigredo com outros sistemas

#### Acceptance Criteria

1. THE Nigredo System SHALL expose a POST endpoint `/api/leads` for creating new leads
2. THE Nigredo System SHALL expose a GET endpoint `/api/leads` for listing leads with pagination support
3. THE Nigredo System SHALL expose a GET endpoint `/api/leads/{id}` for retrieving individual lead details
4. THE Nigredo System SHALL require authentication using JWT tokens for all non-public endpoints
5. THE Nigredo System SHALL return standardized error responses with HTTP status codes and error messages in JSON format

### Requirement 7

**User Story:** Como operador de sistemas, quero observabilidade completa do Nigredo, para que eu possa monitorar e diagnosticar problemas rapidamente

#### Acceptance Criteria

1. THE Nigredo System SHALL implement structured logging using the shared logger utility with correlation IDs
2. THE Nigredo System SHALL emit CloudWatch metrics for lead submission count, webhook success rate, and API latency
3. THE Nigredo System SHALL integrate with AWS X-Ray for distributed tracing across Lambda functions
4. THE Nigredo System SHALL create CloudWatch alarms for error rates above 5% and latency above 1000ms
5. THE Nigredo System SHALL provide a CloudWatch dashboard showing key metrics and system health

### Requirement 8

**User Story:** Como designer, quero que a landing page do Nigredo mantenha a identidade visual do AlquimistaAI, para que haja consistência de marca

#### Acceptance Criteria

1. THE Nigredo System SHALL use the same color palette and typography as the Fibonacci frontend
2. THE Nigredo System SHALL reuse UI components from the shared component library (buttons, inputs, cards)
3. THE Nigredo System SHALL implement responsive design supporting mobile, tablet, and desktop viewports
4. THE Nigredo System SHALL display the AlquimistaAI logo and branding elements consistently
5. THE Nigredo System SHALL follow the established design system spacing and layout grid
