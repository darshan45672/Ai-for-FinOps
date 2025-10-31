# Agentic AI Implementation Plan

## 📋 Overview

This document provides a **step-by-step implementation plan** for building the Agentic AI FinOps Chatbot with:
- Google Gemini 2.0 Flash
- Context Engineering
- Azure MCP Integration
- Context7 RAG
- Hybrid Data Strategy

---

## 🎯 Implementation Phases

### **Phase 1: Database Schema & Foundation** (2-3 hours)
**Goal:** Set up database structure for hybrid data storage

#### Tasks:
1. ✅ Update Prisma schema with new models
2. ✅ Generate and run migrations
3. ✅ Create seed data for testing
4. ✅ Set up Redis caching layer

#### Deliverables:
- Updated `database/prisma/schema.prisma`
- Migration files
- Database seeded with test data
- Redis configured in AI service

---

### **Phase 2: Context Service Implementation** (3-4 hours)
**Goal:** Build rich context engine

#### Tasks:
1. ✅ Create `ContextService` class
2. ✅ Implement context building pipeline
3. ✅ Integrate Database queries
4. ✅ Integrate Redis caching
5. ✅ Add conversation history management
6. ✅ Implement user preference tracking

#### Deliverables:
- `ai/src/context/context.service.ts`
- `ai/src/context/context.module.ts`
- `ai/src/context/interfaces/rich-context.interface.ts`
- Unit tests for context building

---

### **Phase 3: Context7 Integration** (2-3 hours)
**Goal:** Add RAG capabilities with Azure documentation

#### Tasks:
1. ✅ Install Context7 MCP tools
2. ✅ Create `Context7Service` wrapper
3. ✅ Implement doc search functionality
4. ✅ Add memory caching for docs
5. ✅ Integrate with ContextService

#### Deliverables:
- `ai/src/context7/context7.service.ts`
- `ai/src/context7/context7.module.ts`
- Documentation search working
- Cache implemented

---

### **Phase 4: Azure MCP Gateway** (4-5 hours)
**Goal:** Dynamic tool discovery and execution

#### Tasks:
1. ✅ Create `AzureMcpGatewayService`
2. ✅ Implement tool discovery mechanism
3. ✅ Add MCP tool registration
4. ✅ Convert MCP schemas to Gemini format
5. ✅ Implement tool execution router
6. ✅ Add error handling and retries
7. ✅ Support all Azure MCP tools

#### Deliverables:
- `ai/src/mcp/azure-mcp-gateway.service.ts`
- Dynamic tool discovery working
- 20+ Azure MCP tools available
- Gemini function declaration conversion

---

### **Phase 5: Smart Caching Layer** (2 hours)
**Goal:** Optimize performance and reduce API costs

#### Tasks:
1. ✅ Create `CacheService` wrapper
2. ✅ Implement TTL-based caching
3. ✅ Add cache invalidation logic
4. ✅ Implement get-or-fetch pattern
5. ✅ Configure Redis connection

#### Deliverables:
- `ai/src/cache/cache.service.ts`
- `ai/src/cache/cache.module.ts`
- Redis integration
- Cache metrics tracking

---

### **Phase 6: Enhanced ChatGeminiService** (4-5 hours)
**Goal:** Integrate all components for full autonomy

#### Tasks:
1. ✅ Refactor `ChatGeminiService`
2. ✅ Integrate `ContextService`
3. ✅ Integrate `AzureMcpGatewayService`
4. ✅ Integrate `Context7Service`
5. ✅ Update system instruction generation
6. ✅ Enhance function calling loop
7. ✅ Add streaming support
8. ✅ Improve error handling

#### Deliverables:
- Updated `ai/src/chat/chat-gemini.service.ts`
- Full context engineering
- Dynamic tool discovery
- RAG-enhanced responses

---

### **Phase 7: Conversation Persistence** (2 hours)
**Goal:** Store and retrieve conversation history

#### Tasks:
1. ✅ Create database repository methods
2. ✅ Implement conversation CRUD
3. ✅ Add message persistence
4. ✅ Store AI recommendations
5. ✅ Track AI actions for audit

#### Deliverables:
- `ai/src/database-client/conversation.repository.ts`
- `ai/src/database-client/recommendation.repository.ts`
- Conversation storage working
- Audit trail implemented

---

### **Phase 8: Cost Snapshot Background Job** (2-3 hours)
**Goal:** Historical cost tracking and anomaly detection

#### Tasks:
1. ✅ Create `CostSnapshotService`
2. ✅ Implement daily aggregation logic
3. ✅ Add anomaly detection algorithm
4. ✅ Set up cron scheduler
5. ✅ Store snapshots in database
6. ✅ Generate cost alerts

#### Deliverables:
- `ai/src/jobs/cost-snapshot.service.ts`
- `ai/src/jobs/jobs.module.ts`
- Daily cost snapshots
- Anomaly alerts

---

### **Phase 9: Testing & Documentation** (3-4 hours)
**Goal:** Ensure quality and usability

#### Tasks:
1. ✅ Write unit tests for all services
2. ✅ Write integration tests
3. ✅ Test end-to-end scenarios
4. ✅ Create usage documentation
5. ✅ Update README files
6. ✅ Create API documentation

#### Deliverables:
- Test coverage > 80%
- All scenarios tested
- User documentation
- Developer documentation

---

### **Phase 10: Deployment & Monitoring** (2 hours)
**Goal:** Production-ready deployment

#### Tasks:
1. ✅ Configure environment variables
2. ✅ Set up Application Insights
3. ✅ Create Grafana dashboards
4. ✅ Configure alerts
5. ✅ Deploy to production

#### Deliverables:
- Production environment configured
- Monitoring dashboards live
- Alerts configured
- System deployed

---

## 📅 Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1: Database | 2-3 hours | None |
| Phase 2: Context Service | 3-4 hours | Phase 1 |
| Phase 3: Context7 | 2-3 hours | None |
| Phase 4: MCP Gateway | 4-5 hours | None |
| Phase 5: Caching | 2 hours | Phase 1 |
| Phase 6: Enhanced Chat | 4-5 hours | Phases 2, 3, 4, 5 |
| Phase 7: Persistence | 2 hours | Phase 1 |
| Phase 8: Background Jobs | 2-3 hours | Phase 1 |
| Phase 9: Testing | 3-4 hours | All phases |
| Phase 10: Deployment | 2 hours | All phases |

**Total Estimated Time:** 26-33 hours (~3-4 days of focused work)

---

## 🔧 Detailed Implementation Steps

### Phase 1: Database Schema

#### Step 1.1: Update Prisma Schema

**File:** `database/prisma/schema.prisma`

```prisma
// Add new models for context engineering

model User {
  id                      String   @id @default(uuid())
  email                   String   @unique
  name                    String?
  defaultSubscriptionId   String?  @map("default_subscription_id")
  defaultRegion           String?  @map("default_region")
  costAlertThreshold      Decimal? @map("cost_alert_threshold") @db.Decimal(10, 2)
  notificationPreferences Json?    @map("notification_preferences")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  conversations      Conversation[]
  costSnapshots      CostSnapshot[]
  recommendations    Recommendation[]
  budgets            Budget[]

  @@map("users")
}

model Conversation {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  title     String?
  metadata  Json?    // current_topic, entities_discussed, pending_actions
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user            User             @relation(fields: [userId], references: [id])
  messages        Message[]
  recommendations Recommendation[]
  actions         AiAction[]

  @@map("conversations")
}

model Message {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  role           String   // 'user' | 'assistant' | 'system'
  content        String   @db.Text
  tokensUsed     Int?     @map("tokens_used")
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@map("messages")
}

model CostSnapshot {
  id               String   @id @default(uuid())
  userId           String   @map("user_id")
  subscriptionId   String   @map("subscription_id")
  date             DateTime @db.Date
  totalCost        Decimal  @map("total_cost") @db.Decimal(10, 2)
  serviceBreakdown Json?    @map("service_breakdown")
  topResources     Json?    @map("top_resources")
  createdAt        DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([subscriptionId, date])
  @@map("cost_snapshots")
}

model Recommendation {
  id               String   @id @default(uuid())
  userId           String   @map("user_id")
  conversationId   String?  @map("conversation_id")
  type             String   // 'cost_optimization' | 'security' | 'performance'
  resourceId       String?  @map("resource_id")
  recommendation   String   @db.Text
  potentialSavings Decimal? @map("potential_savings") @db.Decimal(10, 2)
  status           String   @default("pending") // 'pending' | 'accepted' | 'rejected' | 'completed'
  metadata         Json?
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user         User          @relation(fields: [userId], references: [id])
  conversation Conversation? @relation(fields: [conversationId], references: [id])

  @@map("ai_recommendations")
}

model ApiSchemaCache {
  id        String   @id @default(uuid())
  service   String
  operation String
  schema    Json
  source    String? // 'context7' | 'azure_docs' | 'mcp'
  cachedAt  DateTime @default(now()) @map("cached_at")
  expiresAt DateTime @map("expires_at")

  @@unique([service, operation])
  @@map("api_schema_cache")
}

model Budget {
  id                   String   @id @default(uuid())
  userId               String   @map("user_id")
  subscriptionId       String   @map("subscription_id")
  name                 String
  monthlyLimit         Decimal  @map("monthly_limit") @db.Decimal(10, 2)
  alertThresholds      Int[]    @map("alert_thresholds")
  notificationChannels String[] @map("notification_channels")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("budgets")
}

model AiAction {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  actionType     String   @map("action_type")
  toolName       String?  @map("tool_name")
  parameters     Json?
  result         Json?
  success        Boolean
  errorMessage   String?  @map("error_message") @db.Text
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@map("ai_actions")
}
```

#### Step 1.2: Install Redis Dependencies

```bash
cd ai
npm install ioredis @nestjs/cache-manager cache-manager cache-manager-ioredis-yet
```

#### Step 1.3: Generate Migration

```bash
cd ../database
npx prisma migrate dev --name add_context_engineering_tables
```

#### Step 1.4: Configure Redis in AI Service

**File:** `ai/src/app.module.ts`

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          ttl: 600, // 10 minutes default
        }),
      }),
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

---

### Phase 2: Context Service

#### Step 2.1: Create Context Interfaces

**File:** `ai/src/context/interfaces/rich-context.interface.ts`

```typescript
export interface UserContext {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultSubscriptionId?: string;
  defaultRegion?: string;
  costAlertThreshold?: number;
  notificationPreferences?: Record<string, any>;
}

export interface AzureContext {
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
  activeAlerts: any[];
  resourceHealth: any[];
}

export interface ConversationContext {
  id: string;
  history: Array<{
    role: string;
    content: string;
  }>;
  currentTopic?: string;
  entitiesDiscussed: string[];
  pendingActions: string[];
}

export interface HistoricalContext {
  costTrends: Array<{
    date: string;
    cost: number;
  }>;
  recommendations: any[];
  pastDecisions: any[];
}

export interface DocumentationContext {
  relevantDocs: string;
  apiSchemas: any[];
  bestPractices: string[];
}

export interface ToolContext {
  available: any[];
  recentlyUsed: string[];
}

export interface RichContext {
  user: UserContext;
  azure: AzureContext;
  conversation: ConversationContext;
  history: HistoricalContext;
  documentation: DocumentationContext;
  tools: ToolContext;
}
```

#### Step 2.2: Create Context Service

**File:** `ai/src/context/context.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { RichContext } from './interfaces/rich-context.interface';

@Injectable()
export class ContextService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
  ) {}

  async buildContext(
    userId: string,
    conversationId: string,
    query: string,
  ): Promise<RichContext> {
    // Fetch all context in parallel
    const [
      userContext,
      azureContext,
      conversationContext,
      historicalContext,
      documentationContext,
      toolContext,
    ] = await Promise.all([
      this.getUserContext(userId),
      this.getAzureContext(userId),
      this.getConversationContext(conversationId),
      this.getHistoricalContext(userId),
      this.getDocumentationContext(query),
      this.getToolContext(),
    ]);

    return {
      user: userContext,
      azure: azureContext,
      conversation: conversationContext,
      history: historicalContext,
      documentation: documentationContext,
      tools: toolContext,
    };
  }

  private async getUserContext(userId: string) {
    // Fetch from database service
    const response = await this.httpService.axiosRef.get(
      `http://localhost:3002/users/${userId}`,
    );
    return response.data;
  }

  private async getAzureContext(userId: string) {
    // Check cache first
    const cached = await this.cacheManager.get(`azure_context_${userId}`);
    if (cached) return cached;

    // Fetch current Azure data
    // Implementation will use Azure MCP tools
    const context = {
      subscription: {
        id: 'sub-123',
        name: 'Production',
        currentSpend: 1234.56,
        budget: 5000,
        percentUsed: 24.7,
      },
      topResources: [],
      activeAlerts: [],
      resourceHealth: [],
    };

    // Cache for 5 minutes
    await this.cacheManager.set(`azure_context_${userId}`, context, 300);
    return context;
  }

  private async getConversationContext(conversationId: string) {
    // Fetch from database
    const response = await this.httpService.axiosRef.get(
      `http://localhost:3002/conversations/${conversationId}`,
    );
    return response.data;
  }

  private async getHistoricalContext(userId: string) {
    // Fetch cost trends from database
    const response = await this.httpService.axiosRef.get(
      `http://localhost:3002/cost-snapshots/${userId}/trends`,
    );
    return response.data;
  }

  private async getDocumentationContext(query: string) {
    // Will be implemented with Context7Service
    return {
      relevantDocs: '',
      apiSchemas: [],
      bestPractices: [],
    };
  }

  private async getToolContext() {
    // Will be implemented with AzureMcpGatewayService
    return {
      available: [],
      recentlyUsed: [],
    };
  }

  async saveConversation(
    conversationId: string,
    message: { role: string; content: string },
  ): Promise<void> {
    await this.httpService.axiosRef.post(
      `http://localhost:3002/conversations/${conversationId}/messages`,
      message,
    );
  }
}
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Install dependencies
cd database && npm install
cd ../ai && npm install

# Install Redis (macOS)
brew install redis
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### Environment Variables

**File:** `ai/.env`

```bash
# Gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Database Service
DATABASE_SERVICE_URL=http://localhost:3002

# Azure
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_TENANT_ID=your_tenant_id

# Context7 (if using external API)
CONTEXT7_API_KEY=your_context7_key
```

### Run Implementation

```bash
# Phase 1: Database
cd database
npx prisma migrate dev
npx prisma generate
npm run start:dev

# Phase 2-6: AI Service
cd ../ai
npm run start:dev

# Test
# Open frontend and test conversation
```

---

## ✅ Testing Checklist

### Context Engineering
- [ ] User preferences fetched correctly
- [ ] Conversation history includes last 20 messages
- [ ] Cost trends show 30-day history
- [ ] Azure current spend is accurate
- [ ] Context7 docs are relevant to query

### Azure MCP Integration
- [ ] Can discover 20+ tools dynamically
- [ ] Tools execute successfully
- [ ] Error handling works for failed calls
- [ ] Tool results format correctly for Gemini

### Hybrid Data Strategy
- [ ] Cache hit rate > 70% for resources
- [ ] Database queries < 100ms
- [ ] Real-time Azure data is fresh
- [ ] Cost snapshots stored daily

### Full Autonomy
- [ ] AI chains 3+ tool calls without guidance
- [ ] AI never says "I don't have access to..."
- [ ] AI uses Context7 docs for accuracy
- [ ] AI remembers context across 10+ turns

---

## 📚 Next Steps

After completing all phases:

1. **Performance Optimization**
   - Profile slow queries
   - Optimize cache TTLs
   - Reduce Azure API calls

2. **Advanced Features**
   - Multi-user collaboration
   - Cost anomaly ML model
   - Predictive cost forecasting
   - Voice input/output

3. **Production Hardening**
   - Add rate limiting
   - Implement circuit breakers
   - Set up monitoring alerts
   - Create runbooks

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025  
**Status:** Ready for Implementation
