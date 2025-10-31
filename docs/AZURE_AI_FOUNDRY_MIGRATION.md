# Azure AI Foundry Migration Summary

## Migration Overview

Successfully migrated from Ollama to Azure AI Foundry Agents SDK for production-grade agentic AI with proper function calling support.

**Date**: January 2025  
**Status**: ✅ COMPLETED  
**Migration Type**: AI Infrastructure - Ollama → Azure AI Foundry

---

## Why We Migrated

### Problems with Ollama

1. **Function Calling Failure**: Ollama's mistral model doesn't execute function calls
   - Instead of calling tools, it responds with text explanations:
   ```json
   {
     "message": {
       "role": "assistant",
       "content": "To get the total count... you can use the `get_resource_groups_count` function..."
     }
   }
   ```

2. **Limited Model Support**: Tested models (mistral:latest, gpt-oss:20b) all had poor/no function calling

3. **Production Concerns**: Local model management, no RBAC, no enterprise features

### Azure AI Foundry Benefits

1. ✅ **Proper Function Calling**: GPT-4o has excellent tool calling support
2. ✅ **Enterprise Grade**: Production-ready with authentication, RBAC, managed service
3. ✅ **Better Models**: Access to latest GPT-4, GPT-4o models
4. ✅ **Consistent API**: Works across different model providers
5. ✅ **No Local Management**: Automatic scaling, no model downloads

---

## What Changed

### Files Created

1. **`/ai/src/azure-foundry/azure-foundry.service.ts`** (115 lines)
   - Service wrapper for Azure AI Foundry Agents SDK
   - Handles AgentsClient initialization with DefaultAzureCredential
   - Methods: `getOrCreateAgent()`, `deleteAgent()`, `getClient()`, `getModelDeploymentName()`

2. **`/ai/src/azure-foundry/azure-foundry.module.ts`**
   - NestJS module for dependency injection
   - Exports AzureFoundryService

3. **`/ai/src/azure-foundry/index.ts`**
   - Barrel export for clean imports

4. **`/ai/src/chat/chat-foundry.service.ts`** (210 lines)
   - New chat service using Azure AI Foundry agents API
   - Implements: threads, messages, runs pattern
   - Handles function tool calling with polling and tool output submission
   - Max 10 iterations for tool calls

5. **`/docs/AZURE_AI_FOUNDRY_SETUP.md`** (comprehensive setup guide)
   - Step-by-step Azure setup instructions
   - Authentication, project creation, model deployment
   - Environment variables, RBAC permissions
   - Troubleshooting and best practices

### Files Modified

1. **`/ai/src/mcp/mcp-tools.service.ts`**
   - Added `getAzureFoundryFunctionTools()` method
   - Converts MCPTool format to FunctionToolDefinition using ToolUtility
   - Maintains backward compatibility with existing tools

2. **`/ai/src/chat/chat.module.ts`**
   - Replaced `OllamaModule` with `AzureFoundryModule`
   - Added `ChatFoundryService` to providers
   - Updated imports and exports

3. **`/ai/src/chat/chat.gateway.ts`**
   - Updated to use `ChatFoundryService` instead of `ChatService`
   - Simplified response handling (direct string return instead of object)
   - Updated conversation history management

4. **`/ai/package.json`**
   - Added `@azure/ai-agents` (v1.0.1)
   - Added `@azure/identity` for authentication
   - Total: 43 new packages added (839 total packages)

### Database Enhancements (Already Complete)

1. **`/database/src/azure/azure.service.ts`**
   - Added `getResourceGroupsCount()`: Returns count and list
   - Added `getResourcesSummary()`: Comprehensive statistics

2. **`/database/src/azure/azure.controller.ts`**
   - Added endpoint: `GET /azure/resources/groups/count`
   - Added endpoint: `GET /azure/resources/summary`
   - Fixed route ordering (specific routes before parameterized routes)

---

## Technical Architecture

### Before (Ollama)

```
User Message → ChatGateway → ChatService → OllamaService
                                              ↓
                                    Call Ollama API
                                              ↓
                                    ❌ Get text response (no function calls)
```

### After (Azure AI Foundry)

```
User Message → ChatGateway → ChatFoundryService
                                    ↓
                        Create Agent with Function Tools
                                    ↓
                        Create Thread & Message
                                    ↓
                        Create Run & Poll Status
                                    ↓
                        requires_action?
                                    ↓
                        ✅ Execute Function Tools
                                    ↓
                        McpToolsService → Database Service
                                    ↓
                        Submit Tool Outputs
                                    ↓
                        Get Final Response → User
```

### Function Tools Available

All 4 MCP tools are available to the AI agent:

1. **`get_azure_resources`**
   - Parameters: type, location, resourceGroup, status (all optional)
   - Returns: Filtered list of Azure resources in markdown

2. **`get_resource_costs`**
   - Parameters: startDate, endDate (required), resourceGroup, resourceId (optional)
   - Returns: Cost data with totals in markdown

3. **`get_resource_groups_count`**
   - Parameters: none
   - Returns: Count (216) and list of resource groups

4. **`get_azure_summary`**
   - Parameters: none
   - Returns: Overview by type, location, status, resource group

---

## Environment Configuration

### Required Environment Variables

Add to `/ai/.env`:

```bash
# Azure AI Foundry Configuration
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=https://<your-project>.services.ai.azure.com/api/projects/<project-name>
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT=gpt-4o

# Database Service URL (existing)
DATABASE_SERVICE_URL=http://localhost:3002
```

### Example:

```env
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=https://my-finops-project.services.ai.azure.com/api/projects/ai-finops-assistant
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT=gpt-4o
DATABASE_SERVICE_URL=http://localhost:3002
```

---

## Setup Steps

### 1. Azure CLI Authentication

```bash
az login
```

### 2. Create AI Foundry Project

Via Azure Portal: https://ai.azure.com/

1. Create new project
2. Name: `ai-finops-assistant`
3. Region: Choose closest location
4. Wait for creation

### 3. Deploy Model

1. Go to "Model deployments"
2. Deploy "gpt-4o" model
3. Name: `gpt-4o`
4. Set TPM limit (10K recommended)

### 4. Configure RBAC

Assign "Azure AI User" role to your user at project scope

### 5. Get Project Endpoint

Copy from Azure Portal → Settings → Project details

### 6. Update .env File

Add the two environment variables shown above

### 7. Install Dependencies (Already Done)

```bash
cd ai
npm install @azure/ai-agents @azure/identity
```

### 8. Test

```bash
# Start database service
cd database && npm run start:dev

# Start AI service
cd ai && npm run start:dev

# Start frontend
cd frontend && npm run dev
```

Test chat at http://localhost:3001:
- "How many resource groups do I have?"
- "Show me resources in East US"

---

## Testing Results

### ✅ Compilation

- All TypeScript files compile without errors
- No type errors in azure-foundry, chat-foundry services
- Module imports working correctly

### ⏳ Runtime Testing Required

Need to test after Azure setup:

1. Agent creation with function tools
2. Thread and message creation
3. Run execution and polling
4. Function calling (requires_action status)
5. Tool execution (get_resource_groups_count, etc.)
6. Tool outputs submission
7. Final response retrieval
8. WebSocket integration
9. Database persistence

---

## Migration Checklist

- [x] Install Azure AI Agents SDK packages
- [x] Create AzureFoundryService wrapper
- [x] Create ChatFoundryService with agents API
- [x] Add getAzureFoundryFunctionTools() to MCP tools
- [x] Update chat.module.ts imports
- [x] Update chat.gateway.ts to use ChatFoundryService
- [x] Fix TypeScript compilation errors
- [x] Create comprehensive setup guide
- [ ] **Configure Azure AI Foundry project** (USER ACTION REQUIRED)
- [ ] **Deploy gpt-4o model** (USER ACTION REQUIRED)
- [ ] **Set environment variables** (USER ACTION REQUIRED)
- [ ] **Test complete integration** (USER ACTION REQUIRED)

---

## Cost Considerations

### Estimated Monthly Cost

- **Model Usage** (GPT-4o): ~$0.01/1K tokens
  - 1M tokens/month: $10-20
- **Model Deployment**: Standard instance
  - $0-50/month (depends on instance type)
- **Total**: **$10-70/month** (moderate usage)

### Tips to Reduce Costs

1. Use shorter system prompts
2. Limit conversation history (5-10 messages)
3. Clean up unused threads/agents
4. Set appropriate rate limits
5. Monitor usage in Azure Portal

---

## Differences from Ollama

| Feature | Ollama | Azure AI Foundry |
|---------|--------|------------------|
| **Function Calling** | ❌ Broken (text responses) | ✅ Proper execution |
| **Model Quality** | Limited (mistral, gpt-oss) | Excellent (GPT-4o) |
| **Authentication** | None | ✅ RBAC, Azure AD |
| **Management** | Local models (GB downloads) | ✅ Managed service |
| **Scaling** | Manual | ✅ Automatic |
| **Enterprise** | Basic | ✅ Production-ready |
| **Cost** | Free (self-hosted) | Pay-per-use ($10-70/mo) |
| **Setup** | Simple (docker) | Requires Azure setup |

---

## Backward Compatibility

### What Still Works

- All MCP tools (function definitions unchanged)
- Database service endpoints
- WebSocket chat gateway
- Conversation persistence
- Frontend UI

### What Changed

- **Internal AI Service**: Now uses Azure AI Foundry instead of Ollama
- **Response Format**: Simplified (direct string instead of object with toolsUsed)
- **Authentication**: Now requires Azure CLI login

### Migration Path for Users

1. No changes required for users
2. Same frontend UI and chat experience
3. Better AI responses (proper function calling)
4. Admin needs to set up Azure AI Foundry once

---

## Rollback Plan (If Needed)

If Azure AI Foundry doesn't work, you can rollback:

1. **Revert chat.module.ts**:
   ```typescript
   import { OllamaModule } from '../ollama/ollama.module';
   
   @Module({
     imports: [OllamaModule],
     providers: [ChatService, ChatGateway],
   })
   ```

2. **Revert chat.gateway.ts**:
   ```typescript
   import { ChatService } from './chat.service';
   
   constructor(private readonly chatService: ChatService)
   ```

3. **Remove Azure packages** (optional):
   ```bash
   npm uninstall @azure/ai-agents @azure/identity
   ```

4. **Note**: Ollama still has function calling issues, so this is not recommended

---

## Next Steps

### Immediate (Required for Testing)

1. ✅ Read `/docs/AZURE_AI_FOUNDRY_SETUP.md`
2. ⏳ Create Azure AI Foundry project
3. ⏳ Deploy gpt-4o model
4. ⏳ Configure RBAC permissions
5. ⏳ Set environment variables
6. ⏳ Test chat functionality

### Short-term (Optimization)

1. Monitor costs and usage
2. Optimize system prompts for token efficiency
3. Implement conversation thread cleanup
4. Add retry logic with exponential backoff
5. Track which tools are used most frequently

### Long-term (Enhancements)

1. Add more function tools as needed:
   - Cost optimization recommendations
   - Resource tagging suggestions
   - Anomaly detection
2. Implement conversation analytics
3. Add user feedback mechanism
4. Create admin dashboard for monitoring
5. Set up alerts for high costs

---

## Resources

- **Setup Guide**: `/docs/AZURE_AI_FOUNDRY_SETUP.md`
- **Azure AI Foundry Portal**: https://ai.azure.com/
- **SDK Documentation**: https://learn.microsoft.com/en-us/javascript/api/overview/azure/ai-agents-readme
- **Function Calling Guide**: https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/function-calling

---

## Summary

✅ **Migration Complete** (Code-wise)  
⏳ **Testing Pending** (Azure setup required)

The AI FinOps Assistant now uses Azure AI Foundry Agents SDK for production-grade agentic AI with proper function calling support. All code changes are complete and compiling successfully. The next step is for you to set up your Azure AI Foundry project, deploy the gpt-4o model, and configure the environment variables as described in `/docs/AZURE_AI_FOUNDRY_SETUP.md`.

Once Azure is configured, the AI will be able to properly call function tools to query your Azure resources and costs directly from the database, providing accurate and data-driven responses!
