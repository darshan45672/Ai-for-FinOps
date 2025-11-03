# Architecture Diagrams - Agentic AI System

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js Frontend<br/>Port 3000]
        WS[WebSocket Client<br/>/chat namespace]
    end

    subgraph "AI Service - Port 3004"
        Gateway[ChatGateway<br/>WebSocket Handler]
        ChatService[ChatGeminiService<br/>Orchestrator]
        
        subgraph "Core Services"
            GeminiSvc[GeminiService<br/>AI Client]
            ContextSvc[ContextService<br/>Context Builder]
            McpGateway[AzureMcpGateway<br/>Dynamic Tools]
            Context7Svc[Context7Service<br/>RAG Docs]
            CacheSvc[CacheService<br/>Smart Caching]
        end
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database Service<br/>Port 3002)]
        Redis[(Redis Cache<br/>10min TTL)]
    end

    subgraph "External Services"
        subgraph "Azure MCP Tools"
            MCP1[azure_mcp_sql]
            MCP2[azure_mcp_redis]
            MCP3[azure_mcp_storage]
            MCP4[azure_mcp_appconfig]
            MCP5[azure_mcp_grafana]
            MCP6[azure_resources]
        end
        
        Context7[Context7 API<br/>Azure Docs]
        
        subgraph "Azure Cloud"
            ARM[Azure Resource<br/>Manager]
            ARG[Azure Resource<br/>Graph]
            CostAPI[Cost Management<br/>API]
            Monitor[Azure Monitor]
        end
    end

    UI <-->|WebSocket| WS
    WS <-->|Socket.IO| Gateway
    Gateway --> ChatService
    
    ChatService --> GeminiSvc
    ChatService --> ContextSvc
    ChatService --> McpGateway
    ChatService --> Context7Svc
    
    ContextSvc --> DB
    ContextSvc --> Redis
    ContextSvc --> CacheSvc
    
    McpGateway --> MCP1
    McpGateway --> MCP2
    McpGateway --> MCP3
    McpGateway --> MCP4
    McpGateway --> MCP5
    McpGateway --> MCP6
    
    MCP1 & MCP2 & MCP3 & MCP4 & MCP5 & MCP6 --> ARM
    MCP6 --> ARG
    
    Context7Svc --> Context7
    
    CacheSvc --> Redis
    
    GeminiSvc -.->|Function Calls| McpGateway

    style UI fill:#e1f5ff
    style ChatService fill:#fff4e1
    style DB fill:#f0f0f0
    style Redis fill:#ffe1e1
    style Context7 fill:#e1ffe1
```

## 2. Data Flow - User Message to AI Response

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Gateway as ChatGateway
    participant Chat as ChatGeminiService
    participant Context as ContextService
    participant DB as Database
    participant Cache as Redis Cache
    participant Azure as Azure APIs
    participant C7 as Context7
    participant MCP as Azure MCP Gateway
    participant Gemini as Gemini AI

    User->>Frontend: "Show my storage costs"
    Frontend->>Gateway: WebSocket message
    Gateway->>Chat: handleMessage(userId, message)
    
    Note over Chat: Start Context Building
    
    par Parallel Context Fetch
        Chat->>Context: buildContext()
        Context->>DB: getUserPreferences()
        DB-->>Context: user prefs
        Context->>DB: getConversationHistory()
        DB-->>Context: last 20 messages
        Context->>DB: getCostTrends()
        DB-->>Context: 30 days data
        
        Context->>Cache: get('resources')
        alt Cache Hit
            Cache-->>Context: cached resources
        else Cache Miss
            Context->>Azure: listAllResources()
            Azure-->>Context: resources
            Context->>Cache: set('resources', 600s)
        end
        
        Context->>Azure: getCurrentSpend()
        Azure-->>Context: current costs
        
        Context->>C7: searchDocs("storage costs")
        C7-->>Context: Azure docs
    end
    
    Context-->>Chat: RichContext object
    
    Chat->>Chat: generateSystemInstructions(context)
    Chat->>Gemini: sendMessage(with context)
    
    Note over Gemini: AI analyzes query with context
    
    Gemini-->>Chat: FunctionCall: get_storage_accounts
    Chat->>MCP: executeTool(get_storage_accounts)
    MCP->>Azure: Query Resource Graph
    Azure-->>MCP: storage accounts list
    MCP-->>Chat: tool result
    
    Chat->>Gemini: Tool result + context
    Gemini-->>Chat: FunctionCall: get_storage_costs
    Chat->>MCP: executeTool(get_storage_costs)
    MCP->>Azure: Cost Management API
    Azure-->>MCP: cost data
    MCP-->>Chat: tool result
    
    Chat->>Gemini: Tool result + context
    Gemini-->>Chat: Final response text
    
    Chat->>DB: saveConversation()
    Chat->>DB: saveRecommendation()
    
    Chat-->>Gateway: Stream response
    Gateway-->>Frontend: WebSocket message
    Frontend-->>User: Display formatted answer
```

## 3. Context Building Pipeline

```mermaid
flowchart LR
    subgraph Input
        UserId[User ID]
        ConvId[Conversation ID]
        Query[User Query]
    end
    
    subgraph "Context Service"
        direction TB
        Builder[Context Builder]
        
        subgraph "Data Sources"
            direction LR
            DBFetch[Database Fetch]
            CacheFetch[Cache Fetch]
            AzureFetch[Azure APIs]
            DocFetch[Context7 RAG]
        end
        
        Builder --> DBFetch
        Builder --> CacheFetch
        Builder --> AzureFetch
        Builder --> DocFetch
    end
    
    subgraph "Database Queries"
        UserPrefs[User Preferences]
        History[Conversation<br/>History]
        Trends[Cost Trends<br/>30 days]
        Recs[AI<br/>Recommendations]
    end
    
    subgraph "Cache Queries"
        Resources[All Resources<br/>TTL: 10min]
        RGs[Resource Groups<br/>TTL: 10min]
        Schemas[API Schemas<br/>TTL: 24hr]
    end
    
    subgraph "Azure Real-time"
        CurrentCost[Current Spend]
        Alerts[Active Alerts]
        Health[Resource Health]
    end
    
    subgraph "Context7"
        Docs[Azure<br/>Documentation]
        Examples[Code Examples]
        Best[Best Practices]
    end
    
    subgraph Output
        RichContext[Rich Context Object]
        SysInstructions[System Instructions]
    end
    
    Input --> Builder
    
    DBFetch --> UserPrefs & History & Trends & Recs
    CacheFetch --> Resources & RGs & Schemas
    AzureFetch --> CurrentCost & Alerts & Health
    DocFetch --> Docs & Examples & Best
    
    UserPrefs & History & Trends & Recs --> RichContext
    Resources & RGs & Schemas --> RichContext
    CurrentCost & Alerts & Health --> RichContext
    Docs & Examples & Best --> RichContext
    
    RichContext --> SysInstructions
    
    style Builder fill:#fff4e1
    style RichContext fill:#e1ffe1
    style SysInstructions fill:#e1f5ff
```

## 4. Azure MCP Tool Discovery Flow

```mermaid
flowchart TD
    Start([System Startup]) --> Init[AzureMcpGateway<br/>Initialize]
    
    Init --> Discover[Discover All<br/>MCP Tools]
    
    Discover --> SQL[Learn: azure_mcp_sql]
    Discover --> Redis[Learn: azure_mcp_redis]
    Discover --> Storage[Learn: azure_mcp_storage]
    Discover --> Config[Learn: azure_mcp_appconfig]
    Discover --> Grafana[Learn: azure_mcp_grafana]
    Discover --> More[... more tools]
    
    SQL --> SQLSchema[Get SQL Tool Schema]
    Redis --> RedisSchema[Get Redis Tool Schema]
    Storage --> StorageSchema[Get Storage Tool Schema]
    Config --> ConfigSchema[Get Config Tool Schema]
    Grafana --> GrafanaSchema[Get Grafana Tool Schema]
    More --> MoreSchemas[Get More Schemas]
    
    SQLSchema --> Convert1[Convert to Gemini<br/>FunctionDeclaration]
    RedisSchema --> Convert2[Convert to Gemini<br/>FunctionDeclaration]
    StorageSchema --> Convert3[Convert to Gemini<br/>FunctionDeclaration]
    ConfigSchema --> Convert4[Convert to Gemini<br/>FunctionDeclaration]
    GrafanaSchema --> Convert5[Convert to Gemini<br/>FunctionDeclaration]
    MoreSchemas --> Convert6[Convert to Gemini<br/>FunctionDeclaration]
    
    Convert1 & Convert2 & Convert3 & Convert4 & Convert5 & Convert6 --> Registry[Tool Registry<br/>Map<string, ToolDef>]
    
    Registry --> Ready([Ready for AI Use])
    
    Ready --> AICall[AI Makes<br/>Function Call]
    AICall --> Lookup[Lookup Tool<br/>in Registry]
    Lookup --> Route[Route to Correct<br/>MCP Server]
    Route --> Execute[Execute Tool]
    Execute --> Result[Return Result<br/>to AI]
    
    style Init fill:#e1f5ff
    style Registry fill:#fff4e1
    style Ready fill:#e1ffe1
```

## 5. Hybrid Data Strategy

```mermaid
graph TB
    subgraph "Context Request"
        Request[Context Builder<br/>Requests Data]
    end
    
    subgraph "Storage Decision Matrix"
        Decision{Data Type?}
    end
    
    subgraph "PostgreSQL - Permanent Storage"
        DB[(Database)]
        DBData["• User Preferences<br/>• Conversation History (90 days)<br/>• Cost Snapshots (2 years)<br/>• AI Recommendations<br/>• Budgets & Alerts"]
    end
    
    subgraph "Redis - Temporary Cache"
        Cache[(Redis Cache)]
        CacheData["• All Resources (10min)<br/>• Resource Groups (10min)<br/>• Cost Data (5min)<br/>• API Schemas (24hr)<br/>• Context7 Docs (1hr)"]
    end
    
    subgraph "Azure APIs - Real-time Only"
        Azure[Azure Cloud]
        AzureData["• Current VM Status<br/>• Active Alerts<br/>• Resource Properties<br/>• Live Metrics<br/>• Resource Health"]
    end
    
    Request --> Decision
    
    Decision -->|"Permanent<br/>Historical"| DB
    Decision -->|"Temporary<br/>Cacheable"| Cache
    Decision -->|"Must Be Fresh<br/>Real-time"| Azure
    
    DB --> DBData
    Cache --> CacheData
    Azure --> AzureData
    
    DBData --> Merge[Merge All Data]
    CacheData --> Merge
    AzureData --> Merge
    
    Merge --> Output[Rich Context<br/>for AI]
    
    style DB fill:#f0f0f0
    style Cache fill:#ffe1e1
    style Azure fill:#e1f5ff
    style Output fill:#e1ffe1
```

## 6. Function Calling Loop with Context

```mermaid
stateDiagram-v2
    [*] --> BuildContext: User message
    
    BuildContext --> GenerateInstructions: Rich context ready
    note right of BuildContext
        Fetch from:
        - Database
        - Redis Cache
        - Azure APIs
        - Context7
    end note
    
    GenerateInstructions --> SendToGemini: System instructions + user message
    note right of GenerateInstructions
        Inject:
        - User preferences
        - Conversation history
        - Azure context
        - Documentation
        - Available tools
    end note
    
    SendToGemini --> CheckResponse: AI response
    
    CheckResponse --> FunctionCall: Has function calls
    CheckResponse --> FinalResponse: Text response
    
    FunctionCall --> ExecuteTools: Route to MCP Gateway
    note right of ExecuteTools
        For each function call:
        1. Lookup tool in registry
        2. Validate parameters
        3. Execute via MCP
        4. Return result
    end note
    
    ExecuteTools --> UpdateContext: Add tool results
    UpdateContext --> CheckIterations: Iteration count
    
    CheckIterations --> SendToGemini: < 10 iterations
    CheckIterations --> ForceResponse: >= 10 iterations (safety)
    
    ForceResponse --> FinalResponse
    
    FinalResponse --> SaveToDatabase: Persist conversation
    note right of SaveToDatabase
        Save:
        - Messages
        - Tool calls
        - Recommendations
        - Context updates
    end note
    
    SaveToDatabase --> StreamToUser: WebSocket
    StreamToUser --> [*]
```

## 7. Cost Snapshot Background Job

```mermaid
flowchart LR
    subgraph "Scheduler"
        Cron[Cron Job<br/>Daily at Midnight]
    end
    
    subgraph "Cost Snapshot Service"
        Start([Start Job])
        GetUsers[Get All Users<br/>with Azure Subscriptions]
        
        ForEach{For Each<br/>User}
        
        FetchCosts[Fetch Current Day Costs<br/>from Azure Cost API]
        Aggregate[Aggregate by Service<br/>and Resource]
        Calculate[Calculate:<br/>• Total cost<br/>• Top resources<br/>• Service breakdown]
        
        CheckAnomaly{Cost Anomaly<br/>Detected?}
        
        SaveSnapshot[Save to<br/>cost_snapshots table]
        CreateAlert[Create Alert<br/>Recommendation]
        
        Next{More Users?}
        End([Job Complete])
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
        Snapshots[cost_snapshots]
        Alerts[ai_recommendations]
    end
    
    Cron --> Start
    Start --> GetUsers
    GetUsers --> ForEach
    
    ForEach -->|Yes| FetchCosts
    FetchCosts --> Aggregate
    Aggregate --> Calculate
    Calculate --> CheckAnomaly
    
    CheckAnomaly -->|Yes| CreateAlert
    CheckAnomaly -->|No| SaveSnapshot
    CreateAlert --> SaveSnapshot
    
    SaveSnapshot --> Snapshots
    CreateAlert --> Alerts
    
    SaveSnapshot --> Next
    Next -->|Yes| ForEach
    Next -->|No| End
    
    style Cron fill:#e1f5ff
    style CheckAnomaly fill:#ffe1e1
    style End fill:#e1ffe1
```

## 8. Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ CONVERSATIONS : has
    USERS ||--o{ COST_SNAPSHOTS : has
    USERS ||--o{ AI_RECOMMENDATIONS : receives
    USERS ||--o{ BUDGETS : defines
    
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ AI_RECOMMENDATIONS : generates
    CONVERSATIONS ||--o{ AI_ACTIONS : tracks
    
    USERS {
        uuid id PK
        string email UK
        string name
        string default_subscription_id
        string default_region
        decimal cost_alert_threshold
        jsonb notification_preferences
        timestamp created_at
        timestamp updated_at
    }
    
    CONVERSATIONS {
        uuid id PK
        uuid user_id FK
        string title
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        int tokens_used
        timestamp created_at
    }
    
    COST_SNAPSHOTS {
        uuid id PK
        uuid user_id FK
        string subscription_id
        date date UK
        decimal total_cost
        jsonb service_breakdown
        jsonb top_resources
        timestamp created_at
    }
    
    AI_RECOMMENDATIONS {
        uuid id PK
        uuid user_id FK
        uuid conversation_id FK
        string type
        string resource_id
        text recommendation
        decimal potential_savings
        string status
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    BUDGETS {
        uuid id PK
        uuid user_id FK
        string subscription_id
        string name
        decimal monthly_limit
        array alert_thresholds
        array notification_channels
        timestamp created_at
        timestamp updated_at
    }
    
    AI_ACTIONS {
        uuid id PK
        uuid conversation_id FK
        string action_type
        string tool_name
        jsonb parameters
        jsonb result
        boolean success
        text error_message
        timestamp created_at
    }
    
    API_SCHEMA_CACHE {
        uuid id PK
        string service UK
        string operation UK
        jsonb schema
        string source
        timestamp cached_at
        timestamp expires_at
    }
```

## 9. Context7 RAG Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant AI as ChatGeminiService
    participant C7 as Context7Service
    participant Cache as Memory Cache
    participant API as Context7 API
    participant Gemini as Gemini AI

    User->>AI: "How to optimize storage?"
    
    AI->>C7: searchAzureDocs(query)
    
    C7->>Cache: get('storage-optimization-docs')
    
    alt Cache Hit
        Cache-->>C7: Cached documentation
    else Cache Miss
        C7->>API: resolve-library-id("Azure Storage")
        API-->>C7: /microsoft/azure-docs
        
        C7->>API: get-library-docs({<br/>  libraryId: /microsoft/azure-docs,<br/>  topic: "storage optimization",<br/>  tokens: 5000<br/>})
        API-->>C7: Azure documentation
        
        C7->>Cache: set('storage-optimization-docs', docs, 3600s)
    end
    
    C7-->>AI: Documentation text
    
    AI->>AI: Build system instructions<br/>with documentation
    
    AI->>Gemini: Send message with:<br/>• User query<br/>• Azure context<br/>• Official docs<br/>• Available tools
    
    Note over Gemini: AI uses official docs<br/>to provide accurate answer
    
    Gemini-->>AI: Informed response
    AI-->>User: "Based on Azure docs,<br/>use Cool tier for..."
```

## 10. Monitoring and Observability

```mermaid
graph TB
    subgraph "Application"
        AI[AI Service]
        DB[Database Service]
        Frontend[Frontend]
    end
    
    subgraph "Metrics Collection"
        AppInsights[Application Insights]
        Prometheus[Prometheus]
        Logs[Log Aggregation]
    end
    
    subgraph "Dashboards"
        Grafana[Grafana Dashboard]
        AzureMonitor[Azure Monitor]
    end
    
    subgraph "Key Metrics"
        Performance["Performance Metrics<br/>• Response time<br/>• Cache hit rate<br/>• Tool success rate"]
        
        Business["Business Metrics<br/>• Recommendations accepted<br/>• Cost savings<br/>• Active users"]
        
        Costs["Cost Metrics<br/>• Azure API calls<br/>• Token usage<br/>• Storage costs"]
    end
    
    subgraph "Alerts"
        Slack[Slack Notifications]
        Email[Email Alerts]
    end
    
    AI --> AppInsights
    AI --> Prometheus
    AI --> Logs
    
    DB --> AppInsights
    Frontend --> AppInsights
    
    AppInsights --> Grafana
    Prometheus --> Grafana
    Logs --> Grafana
    
    AppInsights --> AzureMonitor
    
    Grafana --> Performance
    Grafana --> Business
    Grafana --> Costs
    
    Performance --> Slack
    Business --> Email
    Costs --> Slack
    
    style AI fill:#fff4e1
    style Grafana fill:#e1f5ff
    style Performance fill:#e1ffe1
    style Business fill:#e1ffe1
    style Costs fill:#ffe1e1
```

---

## How to View These Diagrams

These diagrams use **Mermaid** syntax, which is supported by:

1. **GitHub** - View directly in the repository
2. **VS Code** - Install "Markdown Preview Mermaid Support" extension
3. **Mermaid Live Editor** - https://mermaid.live/
4. **Obsidian** - Built-in Mermaid support
5. **Notion** - Embed as code blocks

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025

