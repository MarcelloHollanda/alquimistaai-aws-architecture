# Fase 1: Diagramas de Fluxo e Arquitetura

## 🔄 Fluxo de Observabilidade

### Fluxo Completo de uma Requisição

```mermaid
sequenceDiagram
    participant Client
    participant APIGateway
    participant Lambda
    participant EnhancedMiddleware
    participant EnhancedLogger
    participant EnhancedTracer
    participant CloudWatch
    participant XRay
    participant Dashboard

    Client->>APIGateway: HTTP Request + Headers
    Note over Client,APIGateway: X-Trace-Id, X-Correlation-Id
    
    APIGateway->>Lambda: Invoke Function
    Lambda->>EnhancedMiddleware: withEnhancedObservability()
    
    EnhancedMiddleware->>EnhancedMiddleware: Extract Context from Headers
    EnhancedMiddleware->>EnhancedLogger: Create Logger with Context
    EnhancedMiddleware->>EnhancedTracer: Create Tracer with Context
    
    EnhancedLogger->>CloudWatch: Log: Request Received
    EnhancedTracer->>XRay: Create Subsegment
    
    EnhancedMiddleware->>Lambda: Execute Handler
    
    Lambda->>EnhancedLogger: logger.info("Processing")
    EnhancedLogger->>CloudWatch: Structured Log + trace_id
    
    Lambda->>EnhancedTracer: tracer.traceOperation()
    EnhancedTracer->>XRay: Create Subsegment
    
    Lambda->>Lambda: Business Logic
    
    Lambda->>EnhancedLogger: logger.logCustomMetric()
    EnhancedLogger->>CloudWatch: Custom Metric
    
    Lambda->>EnhancedTracer: Close Subsegment
    EnhancedTracer->>XRay: Subsegment with Annotations
    
    Lambda->>EnhancedMiddleware: Return Response
    
    EnhancedLogger->>CloudWatch: Log: Request Completed
    EnhancedMiddleware->>EnhancedMiddleware: Add Trace Headers
    
    EnhancedMiddleware->>APIGateway: Response + Trace Headers
    APIGateway->>Client: HTTP Response
    
    CloudWatch->>Dashboard: Update Metrics
    XRay->>Dashboard: Update Traces
```

---

## 🏗️ Arquitetura de Componentes

### Estrutura de Componentes

```mermaid
graph TB
    subgraph "Lambda Function"
        Handler[Handler Function]
        Middleware[Enhanced Middleware]
        Logger[Enhanced Logger]
        Tracer[Enhanced X-Ray Tracer]
        
        Handler --> Middleware
        Middleware --> Logger
        Middleware --> Tracer
    end
    
    subgraph "AWS Services"
        CloudWatch[CloudWatch Logs]
        CloudWatchMetrics[CloudWatch Metrics]
        XRay[AWS X-Ray]
        Dashboard[CloudWatch Dashboard]
        
        Logger --> CloudWatch
        Logger --> CloudWatchMetrics
        Tracer --> XRay
        
        CloudWatch --> Dashboard
        CloudWatchMetrics --> Dashboard
        XRay --> Dashboard
    end
    
    subgraph "Observability Features"
        TraceID[Trace ID]
        CorrelationID[Correlation ID]
        Context[Context Data]
        Annotations[X-Ray Annotations]
        Metadata[X-Ray Metadata]
        
        Logger --> TraceID
        Logger --> CorrelationID
        Logger --> Context
        Tracer --> Annotations
        Tracer --> Metadata
    end
    
    style Handler fill:#4CAF50
    style Middleware fill:#2196F3
    style Logger fill:#FF9800
    style Tracer fill:#9C27B0
    style Dashboard fill:#F44336
```

---

## 📊 Fluxo de Dados

### Como os Dados Fluem pelo Sistema

```mermaid
flowchart LR
    A[HTTP Request] --> B{Enhanced Middleware}
    B --> C[Extract Context]
    C --> D[Create Logger]
    C --> E[Create Tracer]
    
    D --> F[Structured Logs]
    E --> G[X-Ray Traces]
    
    F --> H[CloudWatch Logs]
    G --> I[AWS X-Ray]
    
    D --> J[Custom Metrics]
    J --> K[CloudWatch Metrics]
    
    H --> L[Logs Insights]
    I --> M[Service Map]
    K --> N[Dashboards]
    
    L --> O[Analysis]
    M --> O
    N --> O
    
    O --> P[Actionable Insights]
    
    style B fill:#2196F3
    style D fill:#FF9800
    style E fill:#9C27B0
    style P fill:#4CAF50
```

---

## 🔍 Fluxo de Trace ID

### Propagação de Trace ID

```mermaid
graph TD
    A[Client Request] -->|X-Trace-Id Header| B[API Gateway]
    B --> C{Trace ID Exists?}
    
    C -->|Yes| D[Use Existing]
    C -->|No| E[Generate New]
    
    D --> F[Enhanced Middleware]
    E --> F
    
    F --> G[Enhanced Logger]
    F --> H[Enhanced Tracer]
    
    G --> I[All Logs]
    H --> J[All Traces]
    
    I --> K[CloudWatch Logs]
    J --> L[AWS X-Ray]
    
    F --> M[Response Headers]
    M -->|X-Trace-Id Header| N[Client Response]
    
    K --> O[Query by Trace ID]
    L --> O
    
    O --> P[Complete Request Flow]
    
    style C fill:#FFC107
    style F fill:#2196F3
    style P fill:#4CAF50
```

---

## 🎯 Fluxo de Child Logger/Tracer

### Operações Aninhadas

```mermaid
graph TB
    A[Parent Handler] --> B[Parent Logger]
    A --> C[Parent Tracer]
    
    B --> D[Parent Logs]
    C --> E[Parent Trace]
    
    A --> F[Child Operation]
    
    F --> G[Child Logger]
    F --> H[Child Tracer]
    
    B -.Inherit Context.-> G
    C -.Inherit Context.-> H
    
    G --> I[Child Logs]
    H --> J[Child Trace]
    
    D --> K[Same Trace ID]
    I --> K
    
    E --> L[Nested Subsegments]
    J --> L
    
    K --> M[CloudWatch Logs]
    L --> N[AWS X-Ray]
    
    M --> O[Complete Context]
    N --> O
    
    style A fill:#4CAF50
    style F fill:#2196F3
    style O fill:#FF9800
```

---

## 📈 Fluxo de Métricas

### Métricas Customizadas

```mermaid
flowchart TD
    A[Business Logic] --> B[logger.logCustomMetric]
    A --> C[logger.logBusinessEvent]
    A --> D[logger.logApiRequest]
    
    B --> E[CloudWatch PutMetricData]
    C --> E
    D --> E
    
    E --> F[Namespace: Fibonacci/Custom]
    
    F --> G[Metric: BusinessOperationLatency]
    F --> H[Metric: DatabaseQueryLatency]
    F --> I[Metric: ExternalApiLatency]
    
    G --> J[Latency Dashboard]
    H --> J
    I --> J
    
    J --> K[P50/P90/P99 Widgets]
    J --> L[SLA Tracking]
    J --> M[Trend Analysis]
    
    K --> N[Actionable Insights]
    L --> N
    M --> N
    
    style A fill:#4CAF50
    style E fill:#2196F3
    style J fill:#FF9800
    style N fill:#9C27B0
```

---

## 🔄 Fluxo de Erro

### Tratamento de Erros com Observabilidade

```mermaid
sequenceDiagram
    participant Handler
    participant Middleware
    participant Logger
    participant Tracer
    participant CloudWatch
    participant XRay
    
    Handler->>Middleware: Execute
    Middleware->>Logger: Create with Context
    Middleware->>Tracer: Create with Context
    
    Middleware->>Handler: Call Business Logic
    
    Handler->>Handler: Error Occurs
    
    Handler->>Logger: logger.error(message, error)
    Logger->>CloudWatch: Structured Error Log
    Note over Logger,CloudWatch: Includes: trace_id, stack trace, context
    
    Handler->>Tracer: Subsegment.addError(error)
    Tracer->>XRay: Error Annotation
    Note over Tracer,XRay: Includes: error type, message, stack
    
    Handler->>Middleware: Throw Error
    
    Middleware->>Logger: Log Request Failed
    Logger->>CloudWatch: Final Error Log
    
    Middleware->>Tracer: Close Subsegment with Error
    Tracer->>XRay: Mark Trace as Failed
    
    Middleware->>Handler: Return Error Response
    Note over Middleware,Handler: Includes: trace_id, correlation_id
    
    CloudWatch->>CloudWatch: Trigger Alarm
    XRay->>XRay: Mark Service as Degraded
```

---

## 🎨 Dashboard de Latência

### Estrutura do Dashboard

```mermaid
graph TB
    subgraph "Latency Dashboard"
        A[Latency Overview]
        B[Current Latency]
        C[API Handler Details]
        D[Agent Latency]
        E[Distribution]
        F[Trends]
        G[Custom Metrics]
        H[Correlation]
        I[SLA Tracking]
        J[Alerts]
    end
    
    subgraph "Data Sources"
        K[Lambda Metrics]
        L[Custom Metrics]
        M[CloudWatch Alarms]
    end
    
    K --> A
    K --> B
    K --> C
    K --> D
    K --> E
    K --> F
    
    L --> G
    
    K --> H
    K --> I
    
    M --> J
    
    subgraph "Insights"
        N[Performance Bottlenecks]
        O[SLA Violations]
        P[Trend Analysis]
        Q[Error Correlation]
    end
    
    A --> N
    C --> N
    D --> N
    
    I --> O
    
    F --> P
    
    H --> Q
    
    style A fill:#4CAF50
    style I fill:#F44336
    style N fill:#FF9800
    style O fill:#F44336
```

---

## 🔍 Query Flow no CloudWatch Insights

### Como Buscar Logs

```mermaid
flowchart TD
    A[Need to Debug] --> B{What do I have?}
    
    B -->|Trace ID| C[Query by Trace ID]
    B -->|Correlation ID| D[Query by Correlation ID]
    B -->|Time Range| E[Query by Time + Filters]
    B -->|Operation| F[Query by Operation]
    
    C --> G[Get All Related Logs]
    D --> G
    E --> G
    F --> G
    
    G --> H[Analyze Logs]
    
    H --> I{Found Issue?}
    
    I -->|Yes| J[Check X-Ray Trace]
    I -->|No| K[Expand Search]
    
    J --> L[Identify Bottleneck]
    K --> E
    
    L --> M[Fix Issue]
    
    style A fill:#F44336
    style G fill:#4CAF50
    style L fill:#FF9800
    style M fill:#2196F3
```

---

## 🚀 Deployment Flow

### Como Deploy Afeta Observabilidade

```mermaid
flowchart LR
    A[Code Change] --> B[Build]
    B --> C[Deploy Stack]
    
    C --> D[Update Lambda Functions]
    C --> E[Update Dashboards]
    C --> F[Update Alarms]
    
    D --> G[Enhanced Middleware Active]
    
    G --> H[Logs with Trace ID]
    G --> I[X-Ray Traces]
    G --> J[Custom Metrics]
    
    H --> K[CloudWatch Logs]
    I --> L[AWS X-Ray]
    J --> M[CloudWatch Metrics]
    
    E --> N[Latency Dashboard]
    
    K --> N
    L --> N
    M --> N
    
    F --> O[Latency Alarms]
    
    M --> O
    
    O --> P[SNS Notifications]
    
    N --> Q[Monitor Performance]
    P --> Q
    
    Q --> R{Issues Detected?}
    
    R -->|Yes| S[Investigate with Trace ID]
    R -->|No| T[Continue Monitoring]
    
    S --> U[Fix and Redeploy]
    U --> A
    
    style C fill:#2196F3
    style G fill:#4CAF50
    style Q fill:#FF9800
    style R fill:#FFC107
```

---

## 📊 Métricas de Sucesso

### KPIs e Monitoramento

```mermaid
graph TB
    subgraph "Input Metrics"
        A[Lambda Duration]
        B[Lambda Errors]
        C[Lambda Throttles]
        D[Custom Metrics]
    end
    
    subgraph "Calculated KPIs"
        E[P50 Latency]
        F[P90 Latency]
        G[P99 Latency]
        H[Error Rate]
        I[Success Rate]
        J[SLA Compliance]
    end
    
    A --> E
    A --> F
    A --> G
    
    B --> H
    B --> I
    
    A --> J
    B --> J
    
    D --> K[Business Metrics]
    
    subgraph "Dashboards"
        L[Latency Dashboard]
        M[Business Dashboard]
    end
    
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    
    K --> M
    
    subgraph "Actions"
        N[Optimize Performance]
        O[Fix Errors]
        P[Scale Resources]
        Q[Business Decisions]
    end
    
    L --> N
    L --> O
    L --> P
    
    M --> Q
    
    style E fill:#4CAF50
    style F fill:#FF9800
    style G fill:#F44336
    style J fill:#2196F3
```

---

## 🎯 Conclusão

Estes diagramas ilustram como a Fase 1 de Observabilidade Avançada funciona em diferentes cenários:

1. **Fluxo de Requisição**: Como uma requisição é rastreada do início ao fim
2. **Arquitetura**: Como os componentes se relacionam
3. **Trace ID**: Como o trace_id é propagado
4. **Child Operations**: Como operações aninhadas mantêm contexto
5. **Métricas**: Como métricas customizadas fluem para dashboards
6. **Erros**: Como erros são capturados e rastreados
7. **Dashboard**: Estrutura do dashboard de latência
8. **Queries**: Como buscar logs eficientemente
9. **Deploy**: Como deploy afeta observabilidade
10. **KPIs**: Como métricas se transformam em insights

**Use estes diagramas como referência visual durante implementação e troubleshooting.**
