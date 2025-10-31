# Azure AI Foundry Setup Guide

## Overview

This guide will help you set up Azure AI Foundry for the AI FinOps Assistant. Azure AI Foundry provides production-grade agentic AI with proper function calling support, replacing the previous Ollama integration.

## Why Azure AI Foundry?

The migration from Ollama to Azure AI Foundry was necessary because:

1. **Function Calling Issues**: Ollama's mistral model doesn't properly execute function calls - it responds with text explanations instead of calling tools
2. **Enterprise Grade**: Azure AI Foundry provides production-ready infrastructure with proper authentication and RBAC
3. **Better Models**: Access to GPT-4, GPT-4o with excellent tool calling support
4. **Managed Service**: No local model management, automatic scaling
5. **Consistent API**: Works across different model providers

## Prerequisites

- Azure subscription (with appropriate permissions)
- Azure CLI installed (`az` command)
- Node.js 18+ installed
- Existing Azure AI Foundry project (or ability to create one)

## Step 1: Azure CLI Authentication

First, authenticate with Azure CLI:

```bash
az login
```

This will open a browser window for authentication. After successful login, the Azure SDK will use these credentials automatically via `DefaultAzureCredential`.

## Step 2: Create Azure AI Foundry Project

### Option A: Using Azure Portal

1. Go to [Azure AI Foundry Portal](https://ai.azure.com/)
2. Click **"+ Create Project"**
3. Fill in the project details:
   - **Project name**: `ai-finops-assistant` (or your preferred name)
   - **Resource group**: Select existing or create new
   - **Region**: Choose a region close to you (e.g., `East US`, `West Europe`)
4. Click **"Create"**
5. Wait for the project to be created

### Option B: Using Azure CLI

```bash
# Set variables
RESOURCE_GROUP="ai-finops-rg"
LOCATION="eastus"
PROJECT_NAME="ai-finops-assistant"

# Create resource group if it doesn't exist
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create AI Foundry project (hub)
az ml workspace create \
  --name $PROJECT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind project
```

## Step 3: Deploy a Model

You need to deploy a model that supports function calling. We recommend **GPT-4o** for best results.

### Using Azure Portal:

1. In your AI Foundry project, go to **"Model deployments"**
2. Click **"+ Deploy model"**
3. Select **"gpt-4o"** from the model catalog
4. Configure deployment:
   - **Deployment name**: `gpt-4o` (or your preferred name)
   - **Deployment type**: Standard
   - **Tokens per minute rate limit**: 10K (or higher based on your needs)
5. Click **"Deploy"**

### Using Azure CLI:

```bash
# Deploy GPT-4o model
az ml online-deployment create \
  --name gpt-4o \
  --model gpt-4o \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $PROJECT_NAME \
  --instance-type Standard_DS3_v2 \
  --instance-count 1
```

## Step 4: Get Project Endpoint

### Using Azure Portal:

1. In your AI Foundry project, go to **"Settings"** > **"Project details"**
2. Copy the **"Project endpoint"** URL
   - Format: `https://<your-project>.services.ai.azure.com/api/projects/<project-name>`

### Using Azure CLI:

```bash
# Get project endpoint
az ml workspace show \
  --name $PROJECT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "discovery_url" \
  --output tsv
```

## Step 5: Configure RBAC Permissions

You need the **"Azure AI User"** role at the project scope to interact with agents.

### Using Azure Portal:

1. Go to your AI Foundry project
2. Click **"Access control (IAM)"**
3. Click **"+ Add"** > **"Add role assignment"**
4. Select **"Azure AI User"** role
5. Click **"Next"**
6. Select **"User, group, or service principal"**
7. Click **"+ Select members"**
8. Search for and select your user account
9. Click **"Review + assign"**

### Using Azure CLI:

```bash
# Get your user object ID
USER_OBJECT_ID=$(az ad signed-in-user show --query id --output tsv)

# Assign Azure AI User role
az role assignment create \
  --role "Azure AI User" \
  --assignee $USER_OBJECT_ID \
  --scope "/subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.MachineLearningServices/workspaces/$PROJECT_NAME"
```

## Step 6: Configure Environment Variables

Update your `.env` file in the `/ai` directory:

```bash
# Azure AI Foundry Configuration
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=https://<your-project>.services.ai.azure.com/api/projects/<project-name>
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT=gpt-4o

# Database Service URL (existing)
DATABASE_SERVICE_URL=http://localhost:3002

# Other existing environment variables...
```

### Example:

```env
# Azure AI Foundry Configuration
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=https://my-finops-project.services.ai.azure.com/api/projects/ai-finops-assistant
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT=gpt-4o

# Database Service URL
DATABASE_SERVICE_URL=http://localhost:3002
```

## Step 7: Install Dependencies

If you haven't already installed the Azure AI Agents SDK:

```bash
cd ai
npm install @azure/ai-agents @azure/identity
```

## Step 8: Test the Integration

### 1. Start the Database Service

```bash
cd database
npm run start:dev
```

### 2. Start the AI Service

```bash
cd ai
npm run start:dev
```

### 3. Monitor Logs

Watch the logs for successful initialization:

```
[AzureFoundryService] Initializing Azure AI Foundry client...
[AzureFoundryService] Azure AI Foundry client initialized successfully
[AzureFoundryService] Project endpoint: https://...
[AzureFoundryService] Model deployment: gpt-4o
```

### 4. Test with Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3001 and test chat:

**Example questions:**
- "How many resource groups do I have?"
- "Show me all resources in East US"
- "What are my top 5 most expensive resources?"
- "Get me the costs for the last month"

## Architecture

### Azure AI Foundry Components

1. **AgentsClient**: Main client for interacting with Azure AI Foundry
2. **Agent**: AI agent with instructions and function tools
3. **Thread**: Conversation thread for message history
4. **Message**: User or assistant messages in a thread
5. **Run**: Execution of an agent on a thread
6. **Function Tools**: Custom functions the agent can call

### Integration Flow

```
User Message
    ↓
ChatGateway (WebSocket)
    ↓
ChatFoundryService
    ↓
AzureFoundryService (Agent Creation)
    ↓
Create Thread & Message
    ↓
Create Run
    ↓
Poll Run Status
    ↓
Handle requires_action Status
    ↓
McpToolsService (Execute Function)
    ↓
Database Service (Fetch Azure Data)
    ↓
Submit Tool Outputs
    ↓
Get Final Response
    ↓
Return to User
```

### Available Function Tools

1. **get_azure_resources**: Query resources with filters (type, location, resourceGroup, status)
2. **get_resource_costs**: Get cost data with date ranges
3. **get_resource_groups_count**: Count distinct resource groups
4. **get_azure_summary**: Overview of all resources

## Troubleshooting

### Authentication Errors

**Error**: `DefaultAzureCredential failed to retrieve a token`

**Solutions**:
1. Run `az login` to authenticate
2. Verify you have the correct Azure subscription selected:
   ```bash
   az account show
   az account set --subscription <subscription-id>
   ```
3. Check RBAC permissions (Azure AI User role required)

### Model Not Found

**Error**: `Model deployment not found`

**Solutions**:
1. Verify the model deployment name in Azure Portal
2. Ensure the deployment is in "Succeeded" state
3. Update `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT` in `.env`

### Project Endpoint Issues

**Error**: `Project endpoint is invalid`

**Solutions**:
1. Verify the endpoint URL format: `https://<project>.services.ai.azure.com/api/projects/<project-name>`
2. Check if the project exists in Azure Portal
3. Ensure you're using the correct region

### Function Calling Not Working

**Error**: Agent doesn't call functions or gives text responses

**Solutions**:
1. Verify you're using GPT-4o or GPT-4 (not GPT-3.5)
2. Check that function tools are properly defined with `ToolUtility.createFunctionTool()`
3. Ensure database service is running (port 3002)
4. Check database service logs for errors

### Rate Limiting

**Error**: `Rate limit exceeded`

**Solutions**:
1. Increase the tokens per minute (TPM) limit in your model deployment
2. Add retry logic with exponential backoff
3. Consider upgrading to a higher tier

## Best Practices

1. **Model Selection**: Use GPT-4o for best function calling performance
2. **Error Handling**: Always handle errors gracefully and log them
3. **Resource Management**: Clean up threads and agents after use (currently disabled to maintain conversation history)
4. **Cost Monitoring**: Monitor token usage and set appropriate rate limits
5. **Security**: Never commit `.env` files or expose API keys
6. **Testing**: Test with various queries to ensure proper function calling

## Cost Considerations

Azure AI Foundry pricing is based on:

1. **Model Usage**: Pay per token (input + output)
   - GPT-4o: ~$0.01/1K tokens (varies by region)
2. **Storage**: Minimal cost for threads and messages
3. **Deployment**: Standard deployment has base cost + per-hour charges

**Estimated Monthly Cost** (based on moderate usage):
- 1M tokens/month: ~$10-20
- Model deployment: ~$0-50 (depends on instance type)
- Total: ~$10-70/month

**Tips to Reduce Costs**:
- Use shorter system prompts
- Limit conversation history (keep last 5-10 messages)
- Clean up unused threads and agents
- Set appropriate rate limits

## Next Steps

1. ✅ Complete Azure AI Foundry setup
2. ✅ Test basic chat functionality
3. ✅ Verify function calling works
4. 🔄 Monitor costs and usage
5. 🔄 Optimize system prompts
6. 🔄 Add more function tools as needed
7. 🔄 Implement conversation thread management

## Additional Resources

- [Azure AI Foundry Documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/)
- [Azure AI Agents SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/overview/azure/ai-agents-readme)
- [Function Calling Guide](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/function-calling)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)

## Support

If you encounter issues:

1. Check the logs in the AI service
2. Verify all environment variables are set correctly
3. Ensure Azure CLI is authenticated
4. Review the troubleshooting section above
5. Check Azure Portal for service health

## Conclusion

You now have Azure AI Foundry integrated with your AI FinOps Assistant! The system provides production-grade agentic AI with proper function calling support, allowing the AI to query your Azure resources and costs directly from the database.
