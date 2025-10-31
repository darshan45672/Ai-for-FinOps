# MCP Tools Integration Fix Guide

## Problem
The AI assistant was not using MCP tools to fetch real Azure data. It was providing generic responses without calling the available tools (`get_azure_resources`, `get_resource_costs`).

## Root Causes

### 1. **Wrong Model**
- The default model `gpt-oss` doesn't support function/tool calling
- Tool calling requires specific models with function calling capabilities

### 2. **Insufficient System Prompt**
- System prompt didn't emphasize the importance of using tools
- Lacked clear examples and instructions for tool usage

### 3. **Missing Debug Logging**
- No visibility into whether tools were being offered or called
- Difficult to diagnose tool calling issues

## Solutions Implemented

### 1. **Updated System Prompt** ✅

Enhanced the system prompt with:

```typescript
IMPORTANT - TOOL USAGE:
You have access to powerful Azure tools that can fetch real-time data. 
When users ask about Azure resources, costs, or utilization, you MUST use these tools:

Available Tools:
1. get_azure_resources - Query Azure resources with filters
2. get_resource_costs - Get cost data for Azure resources

Tool Usage Guidelines:
- ALWAYS use tools when users ask for data about Azure resources or costs
- DO NOT make up or estimate data - always fetch real data using tools
- If you need subscription ID or other details, ask the user to provide them

Examples of when to use tools:
- "show me my Azure costs" → use get_resource_costs
- "what are my Azure resources" → use get_azure_resources
```

### 2. **Enhanced Logging** ✅

Added comprehensive debug logging:

```typescript
this.logger.debug(`Calling Ollama with ${tools.length} tools available`);
this.logger.debug(`Using model: ${model}`);
this.logger.debug(`Formatted ${formattedTools.length} tools for Ollama`);
this.logger.debug(`Ollama response: ${JSON.stringify({
  hasMessage: !!response.message,
  hasToolCalls: !!response.message?.tool_calls,
  toolCallsCount: response.message?.tool_calls?.length || 0,
  contentPreview: response.message?.content?.substring(0, 100)
})}`);
this.logger.log(`AI requested ${response.message.tool_calls.length} tool calls`);
```

### 3. **Improved Error Handling** ✅

```typescript
try {
  // Primary: Try with tools
  const response = await this.ollamaService.chat({...});
  // Handle tool calls
} catch (error) {
  this.logger.error('Error calling Ollama with tools:', error.message);
  
  // Fallback: Simple chat without tools
  try {
    const response = await this.ollamaService.chat({...});
  } catch (fallbackError) {
    this.logger.error('Fallback chat also failed:', fallbackError.message);
    throw fallbackError;
  }
}
```

### 4. **Increased Context Window** ✅

```typescript
options: {
  temperature: 0.7,
  num_predict: 2000,
  num_ctx: 4096, // Increase context window for tool calls
}
```

### 5. **Recommended Tool-Capable Models** ✅

Updated `.env.example` with models that support function calling:

```bash
# Recommended models that support function/tool calling:
# - mistral (recommended for tool calling)
# - llama3.1 (excellent tool calling support)
# - qwen2.5 (good tool calling support)
# - hermes3 (specialized for function calling)
# Pull with: ollama pull mistral
OLLAMA_DEFAULT_MODEL=mistral
```

## Setup Instructions

### Step 1: Install a Tool-Capable Model

Choose one of these models:

```bash
# Recommended: Mistral (best balance)
ollama pull mistral

# Alternative: Llama 3.1 (excellent tool calling)
ollama pull llama3.1

# Alternative: Qwen 2.5 (good performance)
ollama pull qwen2.5

# Alternative: Hermes 3 (specialized for functions)
ollama pull hermes3
```

### Step 2: Update Environment Variables

Update your `/ai/.env` file:

```bash
# Change from:
OLLAMA_DEFAULT_MODEL=gpt-oss

# To:
OLLAMA_DEFAULT_MODEL=mistral
```

### Step 3: Restart the AI Service

```bash
cd /Users/darshandineshbhandary/GitHub/Ai-for-FinOps/ai
npm run start:dev
```

### Step 4: Test Tool Calling

Try these test queries:

1. **"Show me my Azure resources"**
   - Should call `get_azure_resources` tool

2. **"What are my Azure costs?"**
   - Should ask for subscription ID and date range
   - Then call `get_resource_costs` tool

3. **"I want to see my cost utilization of cloud resources"**
   - Should call `get_resource_costs` with appropriate parameters

### Step 5: Verify Logs

Check the AI service logs for:

```
[ChatService] Calling Ollama with 2 tools available
[ChatService] Using model: mistral
[ChatService] AI requested 1 tool calls
[ChatService] Executing tool: get_azure_resources
[McpToolsService] Executing tool: get_azure_resources
```

## Tool Definitions

### Available Tools

#### 1. get_azure_resources

Fetches Azure resources with optional filtering.

**Parameters:**
```typescript
{
  subscriptionId?: string;  // Azure subscription ID
  type?: string;            // Resource type (e.g., "Microsoft.Compute/virtualMachines")
  location?: string;        // Azure region (e.g., "eastus")
  resourceGroup?: string;   // Resource group name
  status?: string;          // Resource status
}
```

**Example:**
```json
{
  "subscriptionId": "12345-abcde",
  "type": "Microsoft.Compute/virtualMachines"
}
```

#### 2. get_resource_costs

Fetches cost data for Azure resources.

**Parameters:**
```typescript
{
  startDate: string;        // Required: Start date (YYYY-MM-DD)
  endDate: string;          // Required: End date (YYYY-MM-DD)
  resourceGroup?: string;   // Optional: Filter by resource group
  resourceId?: string;      // Optional: Filter by specific resource
}
```

**Example:**
```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-30",
  "resourceGroup": "production-rg"
}
```

## Debugging Tool Issues

### Check if Tools Are Being Offered

Look for this log:
```
[ChatService] Calling Ollama with 2 tools available
[ChatService] Formatted 2 tools for Ollama
```

### Check if AI Wants to Use Tools

Look for this log:
```
[ChatService] AI requested 1 tool calls
```

### Check Tool Execution

Look for these logs:
```
[ChatService] Executing tool: get_azure_resources
[McpToolsService] Executing tool: get_azure_resources
```

### Common Issues

#### Issue 1: No Tool Calls Made

**Symptoms:**
- AI responds without using tools
- Logs show `toolCallsCount: 0`

**Solution:**
- Ensure you're using a tool-capable model (mistral, llama3.1, etc.)
- Check that tools are being formatted correctly
- Review system prompt emphasizes tool usage

#### Issue 2: Tool Call Errors

**Symptoms:**
- Logs show "Error executing tool"
- Database service not responding

**Solution:**
```bash
# Ensure database service is running
cd /Users/darshandineshbhandary/GitHub/Ai-for-FinOps/database
npm run start:dev

# Check DATABASE_SERVICE_URL in ai/.env
DATABASE_SERVICE_URL=http://localhost:3002
```

#### Issue 3: Model Not Found

**Symptoms:**
- Error: "model not found"
- Ollama can't find the specified model

**Solution:**
```bash
# Pull the model
ollama pull mistral

# Verify it's installed
ollama list
```

## Model Comparison

| Model | Tool Calling | Speed | Context | Recommended |
|-------|-------------|-------|---------|-------------|
| **mistral** | ✅ Excellent | Fast | 8K | **Yes** |
| **llama3.1** | ✅ Excellent | Medium | 128K | Yes |
| **qwen2.5** | ✅ Good | Fast | 32K | Yes |
| **hermes3** | ✅ Specialized | Medium | 8K | For complex tools |
| gpt-oss | ❌ No | Fast | 4K | No |

## Testing Checklist

- [ ] Install tool-capable model (mistral recommended)
- [ ] Update OLLAMA_DEFAULT_MODEL in .env
- [ ] Restart AI service
- [ ] Test query: "Show me my Azure resources"
- [ ] Verify logs show tool calling
- [ ] Confirm tool execution completes
- [ ] Check response includes real data

## Expected Behavior

### Before Fix
```
User: "Show me my Azure costs"
AI: "I can pull up your Azure cost utilization details. Could you please provide:
1. Subscription ID
2. Resource Group
3. Date range..."
```
❌ No tool call, just asking questions

### After Fix
```
User: "Show me my Azure costs"
[ChatService] AI requested 1 tool calls
[ChatService] Executing tool: get_resource_costs
[McpToolsService] Executing tool: get_resource_costs

AI: "Based on your Azure cost data for October 2025:
• Total costs: $1,234.56
• Top resources:
  - Virtual Machines: $567.89
  - Storage: $234.56
  - Networking: $123.45
..."
```
✅ Tool called, real data returned

## Additional Resources

- [Ollama Function Calling](https://ollama.com/blog/tool-support)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [NestJS HTTP Module](https://docs.nestjs.com/techniques/http-module)

## Troubleshooting Commands

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List available models
ollama list

# Check AI service logs
cd /Users/darshandineshbhandary/GitHub/Ai-for-FinOps/ai
npm run start:dev | grep "tool"

# Test database service
curl http://localhost:3002/azure/resources

# Check backend service
curl http://localhost:3001/health
```

## Summary

The fix involves:
1. ✅ Using a tool-capable model (mistral, llama3.1, qwen2.5, hermes3)
2. ✅ Enhanced system prompt with explicit tool usage instructions
3. ✅ Comprehensive logging for debugging
4. ✅ Improved error handling with fallbacks
5. ✅ Increased context window (4096 tokens)

After implementing these changes, the AI will actively use MCP tools to fetch real Azure data instead of providing generic responses.
