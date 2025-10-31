# AI Service Modular Architecture - Complete Guide

## 📁 Directory Structure

The AI service has been successfully refactored into a modular NestJS architecture:

```
ai/src/
├── app.module.ts          # Root module importing feature modules
├── app.controller.ts      # Root controller
├── app.service.ts         # Root service
├── main.ts               # Application entry point (PORT: 3004)
│
├── ollama/               # Ollama Module - LLM Integration
│   ├── ollama.module.ts
│   ├── ollama.service.ts
│   ├── ollama.controller.ts
│   ├── index.ts
│   └── dto/
│       └── ollama.dto.ts
│
├── mcp/                  # MCP Module - Tool Execution
│   ├── mcp.module.ts
│   ├── mcp-tools.service.ts
│   └── index.ts
│
└── chat/                 # Chat Module - WebSocket & Orchestration
    ├── chat.module.ts
    ├── chat.service.ts
    ├── chat.gateway.ts
    └── index.ts
```

## 🏗️ Module Architecture

### 1. **OllamaModule** (`src/ollama/`)
**Purpose**: Encapsulates all Ollama LLM integration

**Exports**:
- `OllamaService` - For use by ChatModule

**Provides**:
- REST API endpoints for Ollama operations
- Chat, generation, embeddings, model management
- Health checks

**Controller Routes**:
- `POST /ai/chat` - Chat with Ollama
- `POST /ai/generate` - Generate text
- `POST /ai/embeddings` - Generate embeddings
- `GET /ai/models` - List available models
- `POST /ai/models/pull` - Pull a model
- `GET /ai/health` - Health check

**DTOs**:
- `ChatRequestDto`, `ChatResponseDto`
- `GenerateRequestDto`, `GenerateResponseDto`
- `EmbeddingsRequestDto`, `EmbeddingsResponseDto`
- `ListModelsResponseDto`, `PullModelRequestDto`

### 2. **McpModule** (`src/mcp/`)
**Purpose**: Model Context Protocol tools for Azure resource queries

**Exports**:
- `McpToolsService` - For use by ChatModule

**Available Tools**:
1. `get_azure_resources` - Fetch Azure resources with filters
2. `get_resource_costs` - Get cost data for date range
3. `get_cost_summary` - Aggregated costs grouped by service/resourceGroup/date
4. `get_activity_logs` - Azure activity logs for audit
5. `get_resource_utilization` - CPU, memory, disk, network metrics
6. `analyze_cost_trends` - Cost anomaly detection
7. `get_subscription_info` - Azure subscription details

**Interfaces**:
- `MCPTool` - Tool definition with schema
- `MCPToolResult` - Tool execution result

### 3. **ChatModule** (`src/chat/`)
**Purpose**: WebSocket chat orchestration with AI capabilities

**Dependencies**:
- Imports `OllamaModule` (uses `OllamaService`)
- Imports `McpModule` (uses `McpToolsService`)

**Components**:
- `ChatService` - Orchestrates chat flow with tool calling
- `ChatGateway` - WebSocket gateway on `/chat` namespace

**WebSocket Events**:
- `chat_message` - Send a message
- `chat_response` - Receive AI response
- `typing` - Typing indicator
- `error` - Error notification
- `clear_conversation` - Clear history
- `get_history` - Retrieve conversation
- `ping` - Connection test

**Features**:
- Tool calling loop (max 5 iterations)
- Conversation history management
- System prompt for FinOps assistant
- Error handling with fallback

### 4. **AppModule** (`src/app.module.ts`)
**Root Module Configuration**:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OllamaModule,
    McpModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
# Service Configuration
NODE_ENV=development
PORT=3004

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gpt-oss

# Service URLs
DATABASE_SERVICE_URL=http://localhost:3002
BACKEND_SERVICE_URL=http://localhost:3001

# Other
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🚀 Running the Service

### Prerequisites
1. **Install Ollama** (local)
   ```bash
   # Download from https://ollama.com/download
   ollama serve
   ollama pull gpt-oss
   ```

2. **Install Dependencies**
   ```bash
   cd ai
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

### Start Development Server
```bash
npm run start:dev
```

Service will start on **http://localhost:3004**

### Verify Service
```bash
# Health check
curl http://localhost:3004/health

# Ollama health
curl http://localhost:3004/ai/health

# List models
curl http://localhost:3004/ai/models
```

## 🧪 Testing WebSocket Chat

### Using Socket.IO Client
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004/chat', {
  transports: ['websocket'],
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('chat_response', (data) => {
  console.log('AI:', data.message);
  console.log('Tools used:', data.toolsUsed);
});

socket.emit('chat_message', {
  message: 'Show me all Azure resources in eastus region'
});
```

## 📦 Module Dependencies

```
AppModule
  ├── ConfigModule (global)
  ├── OllamaModule
  │   ├── HttpModule
  │   └── ConfigModule
  ├── McpModule
  │   ├── HttpModule
  │   └── ConfigModule
  └── ChatModule
      ├── OllamaModule (imports OllamaService)
      └── McpModule (imports McpToolsService)
```

## 🎯 Benefits of Modular Architecture

### 1. **Separation of Concerns**
- Each module has a single, well-defined responsibility
- Ollama: LLM communication
- MCP: Tool execution and data fetching
- Chat: Orchestration and WebSocket handling

### 2. **Reusability**
- `OllamaService` can be used by any module
- `McpToolsService` can be extended with more tools
- Each module exports services for cross-module usage

### 3. **Testability**
- Each module can be tested independently
- Easy to mock dependencies
- Clear boundaries for unit tests

### 4. **Maintainability**
- Related code grouped together
- Easy to locate and update features
- Barrel exports (`index.ts`) simplify imports

### 5. **Scalability**
- Easy to add new tools to McpModule
- Can add more chat gateways (e.g., different namespaces)
- Can extend Ollama with more LLM providers

## 📝 Example: Adding a New MCP Tool

1. **Add tool definition** in `mcp-tools.service.ts`:
```typescript
{
  name: 'get_recommendations',
  description: 'Get cost optimization recommendations',
  inputSchema: {
    type: 'object',
    properties: {
      threshold: { type: 'number' },
    },
  },
}
```

2. **Add execution case**:
```typescript
case 'get_recommendations':
  return await this.getRecommendations(params);
```

3. **Implement method**:
```typescript
private async getRecommendations(params: any): Promise<MCPToolResult> {
  const url = `${this.backendServiceUrl}/recommendations`;
  const response = await firstValueFrom(
    this.httpService.get(url).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(`Error: ${error.message}`);
        throw error;
      }),
    ),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify((response as AxiosResponse).data) }],
  };
}
```

That's it! The ChatService will automatically pick up the new tool.

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3004
lsof -i :3004

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3005
```

### Ollama Not Running
```bash
# Check Ollama status
curl http://localhost:11434/

# Start Ollama
ollama serve

# Pull model
ollama pull gpt-oss
```

### TypeScript Errors
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

## 📚 Next Steps

1. **Add Authentication** to WebSocket
2. **Persist Conversations** to database
3. **Add More MCP Tools** for comprehensive Azure queries
4. **Implement Rate Limiting** for API endpoints
5. **Add Swagger Documentation** for REST APIs
6. **Create Frontend Chat Component** using Socket.IO client
7. **Add Monitoring** and metrics collection
8. **Implement Caching** for frequently accessed data

## 🎉 Summary

The AI service is now fully modular with:
- ✅ Clear separation of concerns
- ✅ Proper module imports/exports
- ✅ No compilation errors
- ✅ Ready for development and testing
- ✅ Running on port **3004**
- ✅ WebSocket support on `/chat` namespace
- ✅ 7 MCP tools for Azure resource queries
- ✅ Integration with local Ollama

Start the service with `npm run start:dev` and begin testing!
