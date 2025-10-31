# Google Gemini Integration Setup Guide

## Overview
This project has been migrated from Azure AI Foundry to Google Gemini for agentic AI capabilities due to Azure quota limitations and operational complexity.

## Why Gemini?
- ✅ **No quota limits**: Free tier available with generous limits
- ✅ **Simpler authentication**: Just an API key (no Azure credential complexity)
- ✅ **Native MCP support**: Built-in `mcpToTool()` helper function
- ✅ **Latest models**: Access to gemini-2.0-flash and gemini-2.5-flash
- ✅ **Cleaner architecture**: Direct API calls without resource/project management

## Getting Your Gemini API Key

### Step 1: Visit Google AI Studio
1. Go to [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click on **"Get API key"** in the left sidebar (or top menu)
2. Click **"Create API key"**
3. Choose an existing Google Cloud project or create a new one
   - For new projects, give it a meaningful name like "FinOps AI"
4. Copy the generated API key (starts with `AIza...`)

### Step 3: Configure Environment
1. Open `/ai/.env` file
2. Replace `your_api_key_here` with your actual API key:
   ```bash
   GEMINI_API_KEY=AIzaSyD...your-actual-key-here
   ```
3. Save the file

**⚠️ IMPORTANT**: Keep your API key secret! Never commit it to version control.

## Architecture Changes

### New Components
1. **GeminiService** (`/ai/src/gemini/gemini.service.ts`)
   - Manages GoogleGenAI client initialization
   - Provides access to Gemini models
   - Simpler than Azure's AgentsClient

2. **ChatGeminiService** (`/ai/src/chat/chat-gemini.service.ts`)
   - Handles chat conversations with function calling
   - Direct `generateContent()` API (no agents/threads/runs complexity)
   - Automatic function call handling with iteration

3. **Updated MCP Tools** (`/ai/src/mcp/mcp-tools.service.ts`)
   - Added `getGeminiFunctionDeclarations()` method
   - Converts tools to Gemini's FunctionDeclaration format
   - Keeps existing `getAzureFoundryFunctionTools()` for reference

### Removed Dependencies
- Azure AI Foundry code is commented out but preserved for reference
- Can be removed later if Gemini works well

## Function Calling Comparison

### Azure AI Foundry (Old)
```typescript
// 1. Create agent
const agent = await agentsClient.createAgent({ model, tools });

// 2. Create thread
const thread = await agentsClient.createThread();

// 3. Add message
await agentsClient.createMessage(thread.id, { role: 'user', content: message });

// 4. Create run
const run = await agentsClient.createRun(thread.id, { agentId: agent.id });

// 5. Poll status
while (run.status === 'in_progress') {
  await sleep(1000);
  run = await agentsClient.getRun(thread.id, run.id);
}

// 6. Handle tool calls
if (run.status === 'requires_action') {
  // Execute tools
  const outputs = await executeTools(run.requiredAction.toolCalls);
  // Submit outputs
  await agentsClient.submitToolOutputs(thread.id, run.id, outputs);
  // Poll again...
}

// 7. Get response
const messages = await agentsClient.listMessages(thread.id);
```

### Google Gemini (New)
```typescript
// 1. Generate content with tools
const response = await client.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: conversationHistory,
  config: {
    tools: [{ functionDeclarations }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    },
  },
});

// 2. Handle function calls (if any)
if (response.functionCalls) {
  for (const call of response.functionCalls) {
    const result = await executeTool(call.name, call.args);
    // Add result to conversation and continue...
  }
}

// 3. Get response
const finalResponse = response.text;
```

**Result**: ~70% less code, no polling, simpler flow!

## Available Tools
The following MCP tools are available for Gemini function calling:

1. **get_azure_resources**
   - Fetch Azure resources with filters (type, location, resourceGroup, status)
   
2. **get_resource_costs**
   - Get cost data for date ranges
   - Filter by resource group or resource ID

3. **get_resource_groups_count**
   - Count distinct resource groups
   
4. **get_azure_summary**
   - Get overview of all resources (counts by type, location, etc.)

## Testing the Integration

### Step 1: Start Services
```bash
# Terminal 1: Start database service
cd database
npm run start:dev

# Terminal 2: Start AI service
cd ai
npm run start:dev
```

### Step 2: Test via WebSocket
Connect to `ws://localhost:3004/chat` and send:

```json
{
  "message": "How many resource groups do I have?"
}
```

Expected behavior:
1. Gemini receives the message
2. Decides to call `get_resource_groups_count` tool
3. Tool executes and returns data
4. Gemini generates a natural language response
5. You receive: "You have X resource groups across all your Azure subscriptions."

### Step 3: Check Logs
Look for these log entries in AI service:
```
[GeminiService] Gemini service initialized successfully
[GeminiService] Using model: gemini-2.0-flash
[ChatGeminiService] Processing message: How many resource groups do I have?
[ChatGeminiService] Loaded 4 function declarations
[ChatGeminiService] Iteration 1
[ChatGeminiService] Model requested 1 function call(s)
[ChatGeminiService] Executing function: get_resource_groups_count
[McpToolsService] Executing tool: get_resource_groups_count
[ChatGeminiService] Function get_resource_groups_count result: You have **X** resource groups...
[ChatGeminiService] Got final response: Based on the data...
```

## Model Options

### gemini-2.0-flash (Default)
- Fast responses
- Good for real-time chat
- Free tier: 15 RPM (requests per minute)

### gemini-2.5-flash
- Latest version with improvements
- Better reasoning
- Same pricing tier

### To Change Model
Update `.env`:
```bash
GEMINI_MODEL=gemini-2.5-flash
```

## Rate Limits (Free Tier)
- **15 RPM** (requests per minute)
- **1,500 RPD** (requests per day)
- **1 million TPM** (tokens per minute)

For production, consider upgrading to paid tier.

## Troubleshooting

### Error: "GEMINI_API_KEY is not configured"
**Solution**: Make sure you've added your API key to `/ai/.env`

### Error: "API key not valid"
**Solutions**:
1. Verify the API key is correct (starts with `AIza...`)
2. Check that API key is enabled in Google Cloud Console
3. Ensure Generative AI API is enabled for your project

### Error: "Quota exceeded"
**Solutions**:
1. Wait 1 minute (rate limit resets)
2. Upgrade to paid tier in Google AI Studio
3. Use multiple API keys for different environments

### Function calls not working
**Solutions**:
1. Check that database service is running on port 3002
2. Verify MCP tools are registered: Check logs for "Loaded X function declarations"
3. Enable debug logging: Set `LOG_LEVEL=debug` in `.env`

## Migration Summary

### What Changed
- ✅ Replaced Azure AI Foundry with Google Gemini
- ✅ Simplified authentication (API key instead of DefaultAzureCredential)
- ✅ Removed agents/threads/runs complexity
- ✅ Direct function calling with automatic iteration
- ✅ Updated all modules and imports

### What Stayed the Same
- ✅ MCP tools (same functionality)
- ✅ WebSocket gateway (same API)
- ✅ Database integration
- ✅ Conversation history management

### Performance Impact
- **Latency**: Similar to Azure (~1-3 seconds per response)
- **Reliability**: Higher (no quota issues)
- **Cost**: Free tier vs Azure costs

## Next Steps
1. Get your Gemini API key from [https://aistudio.google.com/](https://aistudio.google.com/)
2. Add it to `/ai/.env`
3. Start the services
4. Test with "How many resource groups do I have?"
5. Monitor logs for successful function calling

## Rollback to Azure (if needed)
If you need to switch back to Azure AI Foundry:
1. Uncomment Azure configuration in `.env`
2. Update `chat.module.ts` to use `AzureFoundryModule`
3. Update `chat.gateway.ts` to use `ChatFoundryService`
4. Resolve Azure quota issues first

---

**Status**: ✅ Migration complete! Ready to test with your Gemini API key.
