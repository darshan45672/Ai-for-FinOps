# Next Steps: Phase 5 - Azure MCP Gateway Service

## 📋 Current Status

✅ **Completed Phases:**
- Phase 3: Database schema with context engineering ✅
- Phase 4: Context Service with Context7 RAG ✅
- Phase 6: Smart caching layer with Redis ✅

🔄 **Current Phase:** Ready to start Phase 5

📊 **Progress:** 30% complete (3 of 10 phases)

---

## 🎯 Phase 5 Overview: Azure MCP Gateway Service

**Goal:** Create a gateway that dynamically discovers and executes Azure MCP tools without hardcoding

**Why:** 
- AI should discover tools at runtime, not be limited to hardcoded tools
- Support 50+ Azure MCP tools (SQL, Redis, Storage, App Config, etc.)
- Enable fully agentic behavior

**Time Estimate:** 4-5 hours

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│         Azure MCP Gateway Service                    │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ Tool Discovery                             │   │
│  │  • Scan available MCP servers              │   │
│  │  • Query each server's capabilities        │   │
│  │  • Cache tool definitions (1 hour)         │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ Schema Conversion                          │   │
│  │  • Convert MCP schemas → Gemini format     │   │
│  │  • Handle parameters, enums, descriptions  │   │
│  │  • Preserve type information               │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ Tool Execution Router                      │   │
│  │  • Route tool calls to correct MCP server  │   │
│  │  • Handle authentication (Azure CLI)       │   │
│  │  • Log all tool calls to AiAction table    │   │
│  │  • Handle errors gracefully                │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  Returns: ToolDefinition[] for Gemini               │
└──────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create

### 1. `ai/src/mcp/interfaces/mcp-gateway.interface.ts`
```typescript
export interface McpTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  serverName: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: FunctionDeclarationSchema;
  metadata?: {
    serverName: string;
    category: string;
    estimatedLatency?: number;
  };
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  durationMs: number;
  toolName: string;
}

export interface ToolDiscoveryOptions {
  refreshCache?: boolean;
  categories?: string[];
  serverNames?: string[];
}
```

### 2. `ai/src/mcp/azure-mcp-gateway.service.ts` (Main service)
```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { McpTool, ToolDefinition, ToolExecutionResult } from './interfaces/mcp-gateway.interface';

@Injectable()
export class AzureMcpGatewayService {
  private readonly logger = new Logger(AzureMcpGatewayService.name);
  private readonly TOOL_CACHE_TTL = 3600; // 1 hour
  private readonly TOOL_CACHE_KEY = 'azure_mcp_tools_all';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Discover all available tools from Azure MCP servers
   */
  async discoverAllTools(options?: ToolDiscoveryOptions): Promise<ToolDefinition[]> {
    // TODO: Implement tool discovery
  }

  /**
   * Learn about a specific MCP server's capabilities
   */
  async learnMcpServer(serverName: string): Promise<McpTool[]> {
    // TODO: Query MCP server for tools
  }

  /**
   * Execute a tool on the appropriate MCP server
   */
  async executeTool(
    toolName: string, 
    parameters: any,
    userId: string,
    conversationId: string,
  ): Promise<ToolExecutionResult> {
    // TODO: Route and execute tool
  }

  /**
   * Convert MCP tool schema to Gemini FunctionDeclaration
   */
  async convertToGeminiFunctionDeclaration(mcpTool: McpTool): Promise<ToolDefinition> {
    // TODO: Convert schemas
  }

  /**
   * Log tool execution to database for audit
   */
  private async logToolExecution(
    conversationId: string,
    toolName: string,
    parameters: any,
    result: ToolExecutionResult,
  ): Promise<void> {
    // TODO: Call database service to log AiAction
  }
}
```

### 3. `ai/src/mcp/azure-mcp-gateway.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AzureMcpGatewayService } from './azure-mcp-gateway.service';

@Module({
  imports: [HttpModule],
  providers: [AzureMcpGatewayService],
  exports: [AzureMcpGatewayService],
})
export class AzureMcpGatewayModule {}
```

---

## 🔧 Implementation Steps

### Step 1: Create Interfaces (30 min)
```bash
# Create the interface file
touch ai/src/mcp/interfaces/mcp-gateway.interface.ts

# Define all TypeScript interfaces
# - McpTool
# - ToolDefinition
# - ToolExecutionResult
# - ToolDiscoveryOptions
```

### Step 2: Implement Tool Discovery (1.5 hours)
```typescript
async discoverAllTools(options?: ToolDiscoveryOptions): Promise<ToolDefinition[]> {
  const cacheKey = this.TOOL_CACHE_KEY;
  
  // Check cache first
  if (!options?.refreshCache) {
    const cached = await this.cacheManager.get<ToolDefinition[]>(cacheKey);
    if (cached) {
      this.logger.log(`Loaded ${cached.length} tools from cache`);
      return cached;
    }
  }

  // List of MCP servers to query
  const mcpServers = [
    'mcp_azure_mcp_sql',
    'mcp_azure_mcp_redis',
    'mcp_azure_mcp_storage',
    'mcp_azure_mcp_appconfig',
    'mcp_azure_mcp_grafana',
    'mcp_azure_mcp_workbooks',
    'mcp_azure_mcp_confidentialledger',
    'mcp_azure_mcp_managedlustre',
    // ... more servers
  ];

  // Query each server for tools
  const allTools: ToolDefinition[] = [];
  
  for (const serverName of mcpServers) {
    try {
      const mcpTools = await this.learnMcpServer(serverName);
      
      // Convert to Gemini format
      for (const mcpTool of mcpTools) {
        const toolDef = await this.convertToGeminiFunctionDeclaration(mcpTool);
        allTools.push(toolDef);
      }
      
      this.logger.log(`Discovered ${mcpTools.length} tools from ${serverName}`);
    } catch (error) {
      this.logger.warn(`Failed to query ${serverName}: ${error.message}`);
    }
  }

  // Cache the results
  await this.cacheManager.set(cacheKey, allTools, this.TOOL_CACHE_TTL);
  
  this.logger.log(`Total tools discovered: ${allTools.length}`);
  return allTools;
}
```

### Step 3: Implement MCP Server Querying (1 hour)
```typescript
async learnMcpServer(serverName: string): Promise<McpTool[]> {
  this.logger.log(`Learning capabilities of ${serverName}...`);
  
  try {
    // Call the MCP tool with learn=true
    const response = await this.callMcpTool(serverName, {
      learn: true,
      intent: 'list all available commands and tools',
    });

    // Parse the response to extract tool definitions
    const tools: McpTool[] = [];
    
    if (response.tools) {
      for (const tool of response.tools) {
        tools.push({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
          serverName: serverName,
        });
      }
    }

    return tools;
  } catch (error) {
    this.logger.error(`Failed to learn ${serverName}: ${error.message}`);
    return [];
  }
}

private async callMcpTool(toolName: string, parameters: any): Promise<any> {
  // TODO: This will call the actual MCP tool
  // For now, return placeholder
  throw new Error('MCP tool calling not yet implemented');
}
```

### Step 4: Implement Schema Conversion (1 hour)
```typescript
async convertToGeminiFunctionDeclaration(mcpTool: McpTool): Promise<ToolDefinition> {
  return {
    name: mcpTool.name,
    description: mcpTool.description,
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: this.convertProperties(mcpTool.parameters.properties),
      required: mcpTool.parameters.required || [],
    },
    metadata: {
      serverName: mcpTool.serverName,
      category: this.categorizeToolcpTool.serverName),
    },
  };
}

private convertProperties(properties: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    converted[key] = {
      type: this.mapTypeToGemini(value.type),
      description: value.description || '',
      ...(value.enum && { enum: value.enum }),
    };
  }
  
  return converted;
}

private mapTypeToGemini(type: string): FunctionDeclarationSchemaType {
  const typeMap = {
    'string': FunctionDeclarationSchemaType.STRING,
    'number': FunctionDeclarationSchemaType.NUMBER,
    'integer': FunctionDeclarationSchemaType.INTEGER,
    'boolean': FunctionDeclarationSchemaType.BOOLEAN,
    'array': FunctionDeclarationSchemaType.ARRAY,
    'object': FunctionDeclarationSchemaType.OBJECT,
  };
  
  return typeMap[type] || FunctionDeclarationSchemaType.STRING;
}

private categorizeTools(serverName: string): string {
  if (serverName.includes('sql')) return 'database';
  if (serverName.includes('storage')) return 'storage';
  if (serverName.includes('redis')) return 'cache';
  if (serverName.includes('appconfig')) return 'configuration';
  return 'general';
}
```

### Step 5: Implement Tool Execution (1 hour)
```typescript
async executeTool(
  toolName: string,
  parameters: any,
  userId: string,
  conversationId: string,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  
  this.logger.log(`Executing tool: ${toolName}`);
  
  try {
    // Call the MCP tool
    const result = await this.callMcpTool(toolName, parameters);
    
    const durationMs = Date.now() - startTime;
    
    const executionResult: ToolExecutionResult = {
      success: true,
      data: result,
      durationMs,
      toolName,
    };
    
    // Log to database
    await this.logToolExecution(conversationId, toolName, parameters, executionResult);
    
    return executionResult;
    
  } catch (error) {
    const durationMs = Date.now() - startTime;
    
    const executionResult: ToolExecutionResult = {
      success: false,
      error: error.message,
      durationMs,
      toolName,
    };
    
    // Log failure to database
    await this.logToolExecution(conversationId, toolName, parameters, executionResult);
    
    return executionResult;
  }
}

private async logToolExecution(
  conversationId: string,
  toolName: string,
  parameters: any,
  result: ToolExecutionResult,
): Promise<void> {
  try {
    // Call database service to create AiAction record
    await this.httpService.post('http://localhost:3002/ai-actions', {
      conversationId,
      actionType: 'TOOL_CALL',
      toolName,
      parameters,
      result: result.data,
      success: result.success,
      errorMessage: result.error,
      durationMs: result.durationMs,
    }).toPromise();
  } catch (error) {
    this.logger.warn(`Failed to log tool execution: ${error.message}`);
  }
}
```

### Step 6: Create Module (15 min)
```typescript
// ai/src/mcp/azure-mcp-gateway.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AzureMcpGatewayService } from './azure-mcp-gateway.service';

@Module({
  imports: [HttpModule],
  providers: [AzureMcpGatewayService],
  exports: [AzureMcpGatewayService],
})
export class AzureMcpGatewayModule {}
```

### Step 7: Update AppModule (15 min)
```typescript
// ai/src/app.module.ts
import { AzureMcpGatewayModule } from './mcp/azure-mcp-gateway.module';

@Module({
  imports: [
    // ... existing imports
    AzureMcpGatewayModule,
  ],
})
export class AppModule {}
```

---

## 🧪 Testing Plan

### Unit Tests
```typescript
describe('AzureMcpGatewayService', () => {
  it('should discover all tools from MCP servers');
  it('should cache discovered tools for 1 hour');
  it('should convert MCP schemas to Gemini format');
  it('should execute tools and return results');
  it('should log tool executions to database');
  it('should handle MCP server failures gracefully');
});
```

### Integration Test
```typescript
describe('Azure MCP Integration', () => {
  it('should discover SQL tools');
  it('should discover Redis tools');
  it('should execute a simple tool (list databases)');
  it('should handle authentication errors');
  it('should log tool execution to AiAction table');
});
```

### Manual Testing
```bash
# 1. Start services
cd database && npm run start:dev &
cd ai && npm run start:dev &

# 2. Test tool discovery
curl -X POST http://localhost:3004/mcp/discover \
  -H "Content-Type: application/json"

# 3. Test tool execution
curl -X POST http://localhost:3004/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "mcp_azure_mcp_sql",
    "parameters": {"command": "list", "learn": true},
    "userId": "test-user",
    "conversationId": "test-conversation"
  }'
```

---

## 📊 Success Criteria

✅ **Phase 5 Complete When:**
- [ ] AzureMcpGatewayService discovers 50+ Azure MCP tools
- [ ] Tool schemas correctly converted to Gemini format
- [ ] Tools can be executed and results returned
- [ ] Tool executions logged to `AiAction` table
- [ ] Caching works (1-hour TTL)
- [ ] Error handling graceful (no crashes)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing successful

---

## 🔗 Dependencies

**Required Services:**
- Database service (port 3002) - for AiAction logging
- Redis (port 6379) - for tool caching

**Required MCP Servers:**
- mcp_azure_mcp_sql
- mcp_azure_mcp_redis
- mcp_azure_mcp_storage
- mcp_azure_mcp_appconfig
- ... and 15+ more

**Azure Authentication:**
- Azure CLI credentials (`az login`)
- Subscription ID set

---

## 📝 Integration with Context Service

After Phase 5, update ContextService:

```typescript
// In context.service.ts
async getToolContext(): Promise<ToolContext> {
  // Get all available tools
  const azureMcpTools = await this.azureMcpGateway.discoverAllTools();
  const customTools = await this.mcpToolsService.discoverAllTools();
  
  return {
    availableTools: [...customTools, ...azureMcpTools],
    recentlyUsed: await this.getRecentToolUsage(),
    usageStats: await this.getToolUsageStats(),
  };
}
```

---

## 🚀 After Phase 5

**Next Phase:** Phase 7 - Enhance ChatGeminiService

You'll integrate:
1. ContextService (builds rich context) ✅ Ready
2. AzureMcpGatewayService (provides tools) ⏳ Phase 5
3. Gemini API (AI engine) ✅ Ready

**Result:** Fully agentic AI that:
- Builds rich context before responding
- Has access to 50+ Azure MCP tools
- Can chain multiple tool calls
- Learns from documentation (Context7)
- Tracks conversations and decisions

---

## 🎯 Quick Start Commands

```bash
# Create directory structure
mkdir -p ai/src/mcp/interfaces

# Create interface file
touch ai/src/mcp/interfaces/mcp-gateway.interface.ts

# Create service file
touch ai/src/mcp/azure-mcp-gateway.service.ts

# Create module file
touch ai/src/mcp/azure-mcp-gateway.module.ts

# Start implementation
code ai/src/mcp/interfaces/mcp-gateway.interface.ts
```

---

**Estimated Time:** 4-5 hours  
**Complexity:** Medium  
**Priority:** HIGH (critical for agentic behavior)

Ready to implement Phase 5? 🚀
