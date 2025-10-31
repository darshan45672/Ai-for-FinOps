# Agentic AI Architecture - Complete System Design

## 📋 Executive Summary

This document describes the architecture for a **fully autonomous Agentic AI FinOps Chatbot** that:
- Uses **Google Gemini 2.0 Flash** for intelligent conversation
- Implements **Context Engineering** for rich, personalized responses
- Leverages **Azure MCP (Model Context Protocol)** for dynamic tool discovery
- Uses **Context7** for RAG (Retrieval-Augmented Generation) from Azure documentation
- Employs a **Hybrid Data Strategy** (DB + Real-time Azure APIs + Smart Caching)
- Provides **full autonomy** - AI can discover and call any Azure API without hardcoded tools

---

## 🎯 Core Principles

### 1. **Autonomous Operation**
- AI discovers available tools dynamically (no hardcoded function definitions)
- Self-learns Azure API capabilities from documentation
- Chains multiple operations to accomplish complex tasks

### 2. **Context Engineering**
- Rich context injection before every AI response
- Multi-turn conversation memory
- User preference tracking
- Historical trend analysis

### 3. **Hybrid Data Strategy**
```
Real-Time Data (Azure APIs) + Cached Data (Redis) + Historical Data (PostgreSQL)
```

### 4. **RAG-Enhanced Intelligence**
- Context7 fetches latest Azure documentation
- AI learns from official Microsoft docs
- Always up-to-date with Azure changes

---

## 🏗️ System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                    Port 3000 - WebSocket Client                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ WebSocket
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                      AI Service (NestJS)                         │
│                         Port 3004                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ChatGateway (WebSocket)                      │  │
│  │          /chat namespace - handles messages               │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │           ChatGeminiService (Enhanced)                    │  │
│  │  • Manages conversation flow                             │  │
│  │  • Orchestrates context building                         │  │
│  │  • Handles function calling loop (max 10 iterations)     │  │
│  └───┬────────────┬────────────┬────────────┬───────────────┘  │
│      │            │            │            │                    │
│  ┌───▼────┐  ┌───▼────┐  ┌───▼────┐  ┌───▼────────────────┐  │
│  │Gemini  │  │Context │  │Azure   │  │Context7            │  │
│  │Service │  │Service │  │MCP     │  │RAG Service         │  │
│  │        │  │        │  │Gateway │  │                    │  │
│  └────────┘  └───┬────┘  └───┬────┘  └────────────────────┘  │
│                  │            │                                  │
└──────────────────┼────────────┼──────────────────────────────┘
                   │            │
         ┌─────────▼───┐  ┌────▼──────────────────────────────┐
         │  Database   │  │     Azure MCP Tools                │
         │  Service    │  │  • mcp_azure_mcp_sql               │
         │ (Postgres)  │  │  • mcp_azure_mcp_redis             │
         │  Port 3002  │  │  • mcp_azure_mcp_appconfig         │
         └─────────────┘  │  • mcp_azure_mcp_storage           │
                          │  • mcp_azure_mcp_grafana           │
                          │  • mcp_azure_mcp_workbooks         │
                          │  • azure_resources (ARG)           │
                          │  • azure_monitoring                │
                          └─────────────┬──────────────────────┘
                                        │
                          ┌─────────────▼──────────────────────┐
                          │      Azure Cloud Services          │
                          │  • Azure Resource Manager (ARM)    │
                          │  • Azure Resource Graph (ARG)      │
                          │  • Cost Management API             │
                          │  • Monitor / Application Insights  │
                          │  • Storage / SQL / Redis / etc.    │
                          └────────────────────────────────────┘
```

---

## 🔄 Data Flow Architecture

### Request Flow (User Message to AI Response)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                    │
│    User: "Show me my storage accounts and their costs"          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 2. WEBSOCKET GATEWAY                                             │
│    • Receives message via WebSocket                              │
│    • Extracts userId, conversationId                             │
│    • Passes to ChatGeminiService                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 3. CONTEXT BUILDING (ContextService)                             │
│                                                                   │
│    A. Fetch from DATABASE (PostgreSQL):                          │
│       ✓ User preferences (default subscription, region)          │
│       ✓ Conversation history (last 20 messages)                  │
│       ✓ Historical cost trends (last 30 days)                    │
│       ✓ Pending AI recommendations                               │
│                                                                   │
│    B. Fetch from CACHE (Redis - 10min TTL):                      │
│       ✓ All Azure resources (if cached)                          │
│       ✓ Resource group list                                      │
│       ✓ API schemas                                              │
│                                                                   │
│    C. Fetch from AZURE APIs (Real-time):                         │
│       ✓ Current month spend (Cost Management)                    │
│       ✓ Resource health status                                   │
│       ✓ Active alerts                                            │
│                                                                   │
│    D. Fetch from CONTEXT7 (RAG):                                 │
│       ✓ Search Azure docs: "storage account costs"               │
│       ✓ Get latest best practices                                │
│       ✓ API documentation                                        │
│                                                                   │
│    OUTPUT: Rich context object with all above data               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 4. SYSTEM INSTRUCTION GENERATION                                 │
│    • Inject user context into system prompt                      │
│    • Add conversation history                                    │
│    • Include relevant Azure docs from Context7                   │
│    • List available tools dynamically                            │
│                                                                   │
│    EXAMPLE SYSTEM INSTRUCTION:                                   │
│    "You are an Azure FinOps AI assistant for John Doe.           │
│     Current subscription: sub-123 (Production)                   │
│     Current spend (Oct 2025): $1,234.56 / $5,000 budget          │
│     Top costly resources: [VM-prod-1: $450, SQL-db-main: $320]   │
│                                                                   │
│     Recent conversation context:                                 │
│     - User asked about storage optimization 5 min ago            │
│     - Discussed moving to Cool tier for archival data            │
│                                                                   │
│     Available tools: [get_storage_accounts, get_costs, ...]      │
│                                                                   │
│     Azure documentation context:                                 │
│     - Storage account pricing tiers...                           │
│     - Cost optimization best practices..."                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 5. GEMINI AI PROCESSING                                          │
│    • Analyzes user message with rich context                     │
│    • Decides which tools to call                                 │
│    • Returns function call requests                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 6. FUNCTION CALLING LOOP (Max 10 iterations)                     │
│                                                                   │
│    Iteration 1:                                                  │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ AI calls: get_storage_accounts()                         │ │
│    │ ├─> Azure MCP Gateway discovers tool                     │ │
│    │ ├─> Routes to azure_resources query                      │ │
│    │ ├─> Queries Azure Resource Graph                         │ │
│    │ └─> Returns: [storage-account-1, storage-account-2]      │ │
│    └──────────────────────────────────────────────────────────┘ │
│                                                                   │
│    Iteration 2:                                                  │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ AI calls: get_storage_costs(account: storage-account-1)  │ │
│    │ ├─> Azure MCP Gateway routes to Cost Management          │ │
│    │ ├─> Queries cost data for specific resource              │ │
│    │ └─> Returns: $45.20/month (Hot tier)                     │ │
│    └──────────────────────────────────────────────────────────┘ │
│                                                                   │
│    Iteration 3:                                                  │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ AI decides: Enough data collected                        │ │
│    │ Returns final response to user                           │ │
│    └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 7. RESPONSE GENERATION                                           │
│    • AI synthesizes all tool results                             │
│    • Formats response with context                               │
│    • Includes recommendations from Context7 docs                 │
│                                                                   │
│    EXAMPLE RESPONSE:                                             │
│    "You have 2 storage accounts in your Production subscription: │
│                                                                   │
│     1. storage-account-1                                         │
│        - Region: East US                                         │
│        - Tier: Hot                                               │
│        - Monthly cost: $45.20                                    │
│        - Recommendation: Consider Cool tier for archival data    │
│          (potential savings: $22/month)                          │
│                                                                   │
│     2. storage-account-2                                         │
│        - Region: West US                                         │
│        - Tier: Cool                                              │
│        - Monthly cost: $12.50                                    │
│        - Status: Optimized ✓                                     │
│                                                                   │
│     Based on Azure best practices, I recommend reviewing         │
│     storage-account-1's access patterns to determine if Cool     │
│     tier is appropriate. Would you like me to analyze access     │
│     logs?"                                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 8. PERSISTENCE                                                   │
│    • Save conversation to database                               │
│    • Store AI recommendation                                     │
│    • Update conversation context                                 │
│    • Cache frequently accessed data                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 9. WEBSOCKET RESPONSE                                            │
│    • Stream response back to frontend                            │
│    • User sees formatted answer                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Hybrid Data Strategy

### Data Storage Decision Matrix

| Data Type | Storage | TTL | Why |
|-----------|---------|-----|-----|
| **User Preferences** | PostgreSQL | Permanent | Personalization, critical context |
| **Conversation History** | PostgreSQL | 90 days | Multi-turn context, learning patterns |
| **Cost Snapshots (Daily)** | PostgreSQL | 2 years | Historical trends, anomaly detection |
| **AI Recommendations** | PostgreSQL | 90 days | Track impact, measure success |
| **Cached API Schemas** | PostgreSQL | 30 days | Faster tool discovery |
| **All Azure Resources** | Redis Cache | 10 min | Expensive query, changes infrequently |
| **Resource Groups** | Redis Cache | 10 min | Frequently accessed, stable |
| **Cost Management Data** | Redis Cache | 5 min | Balance freshness vs API costs |
| **Azure Docs (Context7)** | Memory Cache | 1 hour | Reduce external API calls |
| **Current Resource Status** | None (Real-time) | N/A | Must be fresh (VM status, etc.) |
| **Resource Properties** | None (Real-time) | N/A | Dynamic, query as needed |
| **Active Alerts** | None (Real-time) | N/A | Critical, cannot be stale |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Context Building Layer                       │
└───┬─────────────────────┬─────────────────────┬─────────────────┘
    │                     │                     │
    │ Permanent           │ Temporary           │ Real-time
    │ (PostgreSQL)        │ (Redis)             │ (Azure APIs)
    │                     │                     │
┌───▼──────────────┐  ┌──▼─────────────┐  ┌───▼─────────────────┐
│ User Context     │  │ Query Cache    │  │ Live Azure Data     │
│ ================ │  │ ============== │  │ =================== │
│ • Preferences    │  │ • Resources    │  │ • VM status         │
│ • Settings       │  │ • RG list      │  │ • Current costs     │
│ • History        │  │ • Schemas      │  │ • Alerts            │
│ • Recommendations│  │ • Docs         │  │ • Resource health   │
└──────────────────┘  └────────────────┘  └─────────────────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Rich Context       │
                    │  Injected into AI   │
                    └─────────────────────┘
```

---

## 🔌 Azure MCP Integration

### Dynamic Tool Discovery Architecture

Instead of hardcoding tools, we discover them dynamically:

```typescript
// OLD APPROACH (Hardcoded) ❌
const tools = [
  { name: 'get_azure_resources', description: '...' },
  { name: 'get_resource_groups', description: '...' },
  { name: 'get_costs', description: '...' }
];

// NEW APPROACH (Dynamic) ✅
const tools = await azureMcpGateway.discoverAllTools();
// Automatically discovers:
// - SQL tools (list databases, execute query)
// - Redis tools (list caches, get data)
// - Storage tools (list accounts, manage blobs)
// - App Config tools (list configs, get settings)
// - Grafana tools (list workspaces, dashboards)
// - Monitoring tools (query logs, get metrics)
// ... and many more!
```

### Azure MCP Tools Available

| MCP Tool | Capabilities | Use Cases |
|----------|-------------|-----------|
| **mcp_azure_mcp_sql** | List DBs, execute queries, manage servers | DB operations, query data |
| **mcp_azure_mcp_redis** | List caches, get/set data, manage policies | Cache operations, data access |
| **mcp_azure_mcp_appconfig** | List configs, get/set key-values, manage labels | App settings, feature flags |
| **mcp_azure_mcp_storage** | Manage storage accounts, blobs, containers | File operations, data storage |
| **mcp_azure_mcp_grafana** | List workspaces, manage dashboards | Monitoring, visualization |
| **mcp_azure_mcp_workbooks** | List/create workbooks, manage content | Analytics, reporting |
| **mcp_azure_mcp_managedlustre** | Manage Lustre file systems | HPC workloads |
| **mcp_azure_mcp_confidentialledger** | Append/query immutable records | Audit logs, compliance |
| **azure_resources** (ARG) | Query any Azure resource | Resource discovery |
| **azure_monitoring** | Query logs, metrics, diagnostics | Observability, troubleshooting |

### MCP Gateway Implementation Pattern

```typescript
// Azure MCP Gateway Service
class AzureMcpGatewayService {
  private mcpTools: Map<string, McpToolDefinition> = new Map();
  
  async discoverTools() {
    // Dynamically discover all available MCP tools
    const tools = [
      { tool: 'mcp_azure_mcp_sql', learn: true },
      { tool: 'mcp_azure_mcp_redis', learn: true },
      { tool: 'mcp_azure_mcp_appconfig', learn: true },
      // ... etc
    ];
    
    for (const { tool, learn } of tools) {
      if (learn) {
        const schema = await this.learnTool(tool);
        this.registerTool(tool, schema);
      }
    }
  }
  
  async executeTool(toolName: string, parameters: any) {
    const tool = this.mcpTools.get(toolName);
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);
    
    // Route to appropriate MCP server
    return await this.callMcpServer(tool, parameters);
  }
}
```

---

## 📚 Context7 RAG Integration

### How Context7 Enhances AI Intelligence

```
User Query: "How do I optimize storage costs?"
         │
         ▼
┌─────────────────────────────────────────┐
│ 1. Context7 Library Resolution          │
│    resolve-library-id("Azure Storage")  │
│    → Returns: /microsoft/azure-docs     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 2. Fetch Relevant Documentation         │
│    get-library-docs(                    │
│      libraryId: /microsoft/azure-docs,  │
│      topic: "storage cost optimization",│
│      tokens: 5000                       │
│    )                                    │
│    → Returns: Latest Azure docs on      │
│      storage tiers, lifecycle policies, │
│      cost optimization strategies       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 3. Inject into System Instructions      │
│    "Based on official Azure docs:       │
│     - Use Cool tier for infrequently    │
│       accessed data (save 50%)          │
│     - Implement lifecycle policies      │
│     - Use blob tiering automation       │
│     - Consider Archive tier for long-   │
│       term retention (save 95%)"        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 4. AI Generates Informed Response       │
│    Uses official docs to provide        │
│    accurate, up-to-date recommendations │
└─────────────────────────────────────────┘
```

### Context7 Integration Points

1. **Query-time RAG**: Fetch docs based on user question
2. **Schema Discovery**: Learn Azure API schemas from docs
3. **Best Practices**: Inject official recommendations
4. **Error Resolution**: Search docs when API calls fail
5. **Code Examples**: Provide official code snippets

---

## 💬 Context Engineering Implementation

### Context Building Pipeline

```typescript
interface RichContext {
  // User Context
  user: {
    id: string;
    name: string;
    email: string;
    preferences: UserPreferences;
  };
  
  // Azure Context
  azure: {
    subscription: {
      id: string;
      name: string;
      currentSpend: number;
      budget: number;
      percentUsed: number;
    };
    topResources: Array<{
      name: string;
      cost: number;
      type: string;
    }>;
    activeAlerts: Alert[];
    resourceHealth: ResourceHealth[];
  };
  
  // Conversation Context
  conversation: {
    id: string;
    history: Message[];
    currentTopic: string;
    entitiesDiscussed: string[];
    pendingActions: string[];
  };
  
  // Historical Context
  history: {
    costTrends: CostTrend[];
    recommendations: Recommendation[];
    pastDecisions: Decision[];
  };
  
  // Documentation Context (from Context7)
  documentation: {
    relevantDocs: string;
    apiSchemas: ApiSchema[];
    bestPractices: string[];
  };
  
  // Tool Context
  tools: {
    available: ToolDefinition[];
    recentlyUsed: string[];
  };
}
```

### System Instruction Template

```typescript
function buildSystemInstructions(context: RichContext): string {
  return `
You are an expert Azure FinOps AI assistant helping ${context.user.name}.

## CURRENT CONTEXT

### User Profile
- Name: ${context.user.name}
- Email: ${context.user.email}
- Default Subscription: ${context.azure.subscription.name}
- Preferred Region: ${context.user.preferences.defaultRegion}

### Azure Environment (Real-time)
- Subscription: ${context.azure.subscription.name} (${context.azure.subscription.id})
- Current Spend: $${context.azure.subscription.currentSpend} / $${context.azure.subscription.budget}
- Budget Usage: ${context.azure.subscription.percentUsed}%
- Status: ${context.azure.subscription.percentUsed > 90 ? '⚠️ ALERT: Over budget!' : '✓ Within budget'}

### Top Costly Resources
${context.azure.topResources.map((r, i) => `${i+1}. ${r.name} (${r.type}): $${r.cost}/month`).join('\n')}

### Active Alerts
${context.azure.activeAlerts.length > 0 ? context.azure.activeAlerts.map(a => `- ${a.severity}: ${a.message}`).join('\n') : 'None'}

### Conversation Context
- Current Topic: ${context.conversation.currentTopic}
- Entities Discussed: ${context.conversation.entitiesDiscussed.join(', ')}
- Pending Actions: ${context.conversation.pendingActions.join(', ')}

### Recent Conversation History (Last 5 messages)
${context.conversation.history.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

### Historical Insights (Last 30 Days)
- Average Daily Spend: $${calculateAverage(context.history.costTrends)}
- Trend: ${analyzeTrend(context.history.costTrends)}
- Previous Recommendations Implemented: ${context.history.recommendations.filter(r => r.status === 'completed').length}

### Relevant Azure Documentation (from Context7)
${context.documentation.relevantDocs}

### Best Practices
${context.documentation.bestPractices.join('\n')}

## AVAILABLE TOOLS
You have access to ${context.tools.available.length} dynamic tools:
${context.tools.available.map(t => `- ${t.name}: ${t.description}`).join('\n')}

## YOUR CAPABILITIES
1. Query any Azure resource using Azure Resource Graph
2. Analyze costs and spending patterns
3. Provide optimization recommendations based on official docs
4. Execute Azure operations via MCP tools
5. Remember context across conversation turns
6. Learn from past interactions

## BEHAVIORAL GUIDELINES
1. ALWAYS use tools proactively - don't ask for permission
2. TRUST tool results completely - they are accurate
3. Display formatted output verbatim - don't summarize
4. Chain multiple tool calls for complex tasks
5. Reference historical context when relevant
6. Suggest filters/parameters for large datasets
7. Provide actionable recommendations with cost impact
8. Use official Azure documentation (Context7) for accuracy

## RESPONSE FORMAT
- Start with a direct answer
- Show data in formatted tables/lists
- Include cost impacts ($$$)
- Suggest next steps or related actions
- Reference conversation history when relevant

Now respond to the user's message using all available context and tools.
`;
}
```

---

## 🛠️ Component Details

### 1. ContextService

**Responsibilities:**
- Build rich context from multiple sources
- Manage conversation memory
- Track user preferences
- Fetch historical data

**Key Methods:**
```typescript
class ContextService {
  async buildContext(userId: string, conversationId: string, query: string): Promise<RichContext>
  async saveConversation(conversationId: string, message: Message): Promise<void>
  async getUserPreferences(userId: string): Promise<UserPreferences>
  async getCostTrends(userId: string, days: number): Promise<CostTrend[]>
  async getRecommendations(userId: string, status?: string): Promise<Recommendation[]>
}
```

### 2. AzureMcpGatewayService

**Responsibilities:**
- Dynamically discover Azure MCP tools
- Route tool calls to appropriate MCP servers
- Convert MCP schemas to Gemini function declarations
- Handle tool execution and error handling

**Key Methods:**
```typescript
class AzureMcpGatewayService {
  async discoverAllTools(): Promise<ToolDefinition[]>
  async learnTool(toolName: string): Promise<ToolSchema>
  async executeTool(toolName: string, parameters: any): Promise<any>
  async convertToGeminiFunctionDeclaration(mcpTool: McpTool): Promise<FunctionDeclaration>
}
```

### 3. Context7Service

**Responsibilities:**
- Search Azure documentation
- Resolve library IDs
- Cache frequently accessed docs
- Extract code examples

**Key Methods:**
```typescript
class Context7Service {
  async searchAzureDocs(query: string, tokens?: number): Promise<string>
  async resolveLibrary(libraryName: string): Promise<string>
  async getCodeExamples(topic: string, language?: string): Promise<CodeExample[]>
  async getApiSchema(service: string, operation: string): Promise<ApiSchema>
}
```

### 4. CacheService

**Responsibilities:**
- Implement smart caching strategy
- Manage TTLs for different data types
- Handle cache invalidation
- Provide fallback to source

**Key Methods:**
```typescript
class CacheService {
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  async invalidate(pattern: string): Promise<void>
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T>
}
```

### 5. Enhanced ChatGeminiService

**Responsibilities:**
- Orchestrate entire conversation flow
- Build context using ContextService
- Manage function calling loop
- Stream responses to frontend

**Key Methods:**
```typescript
class ChatGeminiService {
  async sendMessage(userId: string, conversationId: string, message: string): Promise<string>
  private async buildRichContext(userId: string, conversationId: string, query: string): Promise<RichContext>
  private async handleFunctionCalls(functionCalls: FunctionCall[], context: RichContext): Promise<any[]>
  private async generateSystemInstructions(context: RichContext): Promise<string>
}
```

---

## 📊 Database Schema Design

### Core Tables

```sql
-- User preferences and settings
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  default_subscription_id VARCHAR(255),
  default_region VARCHAR(50),
  cost_alert_threshold DECIMAL(10, 2),
  notification_preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation history
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- current_topic, entities_discussed, pending_actions
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cost snapshots (daily aggregates)
CREATE TABLE cost_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subscription_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_cost DECIMAL(10, 2),
  service_breakdown JSONB, -- { "compute": 450, "storage": 200, ... }
  top_resources JSONB, -- [{ name, cost, type }, ...]
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subscription_id, date)
);

-- AI recommendations
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  type VARCHAR(50) NOT NULL, -- 'cost_optimization' | 'security' | 'performance'
  resource_id VARCHAR(500),
  recommendation TEXT NOT NULL,
  potential_savings DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Cached API schemas
CREATE TABLE api_schema_cache (
  id UUID PRIMARY KEY,
  service VARCHAR(100) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  schema JSONB NOT NULL,
  source VARCHAR(50), -- 'context7' | 'azure_docs' | 'mcp'
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(service, operation)
);

-- User budgets and alerts
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subscription_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  monthly_limit DECIMAL(10, 2) NOT NULL,
  alert_thresholds INTEGER[], -- [80, 90, 100]
  notification_channels VARCHAR(50)[], -- ['email', 'slack']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track AI actions for audit
CREATE TABLE ai_actions (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  action_type VARCHAR(100) NOT NULL,
  tool_name VARCHAR(100),
  parameters JSONB,
  result JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Security Considerations

1. **Azure Credentials**
   - Store in environment variables (never in DB)
   - Use Managed Identity when possible
   - Rotate keys regularly

2. **User Data**
   - Encrypt sensitive data at rest
   - Implement row-level security (RLS) in Postgres
   - Audit all AI actions

3. **Rate Limiting**
   - Limit AI requests per user (e.g., 100/day)
   - Cache to reduce Azure API costs
   - Implement exponential backoff

4. **Tool Execution**
   - Validate all tool parameters
   - Require confirmation for destructive operations
   - Log all actions for audit trail

---

## 🚀 Performance Optimizations

1. **Caching Strategy**
   - Redis for hot data (10-min TTL)
   - Memory cache for docs (1-hour TTL)
   - DB for persistent data

2. **Parallel Processing**
   - Fetch context from DB, Azure, Context7 in parallel
   - Execute multiple tool calls concurrently when possible

3. **Streaming Responses**
   - Stream AI responses via WebSocket
   - Show tool execution progress in real-time

4. **Background Jobs**
   - Daily cost snapshot aggregation (runs at midnight)
   - Weekly recommendation generation
   - Monthly cost anomaly detection

---

## 📈 Monitoring & Observability

### Key Metrics to Track

1. **AI Performance**
   - Average response time
   - Tool call success rate
   - Number of iterations per conversation
   - Context7 hit rate

2. **System Performance**
   - Cache hit rate (Redis)
   - Azure API call count (cost tracking)
   - Database query performance
   - WebSocket connection stability

3. **Business Metrics**
   - Recommendations accepted vs rejected
   - Cost savings achieved
   - User satisfaction (feedback)
   - Active users per day

### Monitoring Tools

- **Application Insights**: Track AI service performance
- **Azure Monitor**: Track Azure API usage
- **Grafana**: Custom dashboards for FinOps metrics
- **Prisma Studio**: Database insights

---

## 🎯 Success Criteria

The system is successful when:

1. **AI Autonomy**
   - ✅ AI can discover and use 20+ Azure MCP tools without hardcoding
   - ✅ AI chains 3+ tool calls to accomplish complex tasks
   - ✅ AI provides accurate responses using Context7 docs

2. **Context Quality**
   - ✅ AI remembers conversation context across 10+ turns
   - ✅ AI personalizes responses based on user preferences
   - ✅ AI references historical data to provide insights

3. **Performance**
   - ✅ Average response time < 3 seconds
   - ✅ Cache hit rate > 70%
   - ✅ Azure API costs < $50/month

4. **User Experience**
   - ✅ Users get accurate, actionable recommendations
   - ✅ AI never says "I don't know" for Azure questions
   - ✅ Users can accomplish FinOps tasks without Azure Portal

---

## 📝 Next Steps

See implementation plan in `/docs/AGENTIC_AI_IMPLEMENTATION_PLAN.md`

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025  
**Author:** AI Architecture Team
