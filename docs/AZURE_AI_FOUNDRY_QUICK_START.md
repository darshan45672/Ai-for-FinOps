# Azure AI Foundry Quick Start

## 🚀 Quick Setup (5 Minutes)

### 1. Azure CLI Login
```bash
az login
```

### 2. Create Project at https://ai.azure.com/
- Click "Create Project"
- Name: `ai-finops-assistant`
- Region: Choose closest
- Wait for creation (~2 minutes)

### 3. Deploy Model
- Go to "Model deployments" in your project
- Click "Deploy model"
- Select "gpt-4o"
- Deployment name: `gpt-4o`
- TPM limit: 10K
- Click "Deploy"

### 4. Get Project Endpoint
- Go to "Settings" → "Project details"
- Copy the "Project endpoint" URL
  ```
  https://<your-project>.services.ai.azure.com/api/projects/<project-name>
  ```

### 5. Set Environment Variables
Edit `/ai/.env`:
```bash
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=<paste-your-endpoint-here>
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT=gpt-4o
DATABASE_SERVICE_URL=http://localhost:3002
```

### 6. Start Services
```bash
# Terminal 1: Database
cd database && npm run start:dev

# Terminal 2: AI Service
cd ai && npm run start:dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 7. Test Chat
Open http://localhost:3001 and ask:
```
How many resource groups do I have?
```

Expected: AI calls `get_resource_groups_count()` and responds with "216 resource groups"

---

## ✅ Migration Status

### Completed
- ✅ Installed @azure/ai-agents SDK (43 packages)
- ✅ Created AzureFoundryService wrapper (115 lines)
- ✅ Created ChatFoundryService with agents API (210 lines)
- ✅ Added function tool conversion to MCP tools
- ✅ Updated chat module and gateway
- ✅ Fixed all TypeScript compilation errors
- ✅ Enhanced database endpoints (resource groups count, summary)
- ✅ Fixed route ordering conflicts
- ✅ Created comprehensive documentation

### Pending (Your Action)
- ⏳ Create Azure AI Foundry project
- ⏳ Deploy gpt-4o model
- ⏳ Configure environment variables
- ⏳ Test chat functionality with function calling

---

## 📊 What Changed

### Files Created
```
/ai/src/azure-foundry/
  ├── azure-foundry.service.ts      (115 lines) - Service wrapper
  ├── azure-foundry.module.ts       - NestJS module
  └── index.ts                      - Exports

/ai/src/chat/
  └── chat-foundry.service.ts       (210 lines) - New chat service with agents

/docs/
  ├── AZURE_AI_FOUNDRY_SETUP.md     - Full setup guide
  └── AZURE_AI_FOUNDRY_MIGRATION.md - Migration summary
```

### Files Modified
```
/ai/src/mcp/mcp-tools.service.ts    - Added getAzureFoundryFunctionTools()
/ai/src/chat/chat.module.ts         - Replaced OllamaModule with AzureFoundryModule
/ai/src/chat/chat.gateway.ts        - Use ChatFoundryService instead of ChatService
/ai/package.json                    - Added @azure/ai-agents, @azure/identity
/database/src/azure/azure.service.ts    - Added resource groups & summary methods
/database/src/azure/azure.controller.ts - Added new endpoints, fixed routes
```

---

## 🧪 Testing Checklist

After setup, test these scenarios:

### 1. Basic Query (No Function Call)
```
Q: "What is Azure?"
A: Should respond about Azure cloud without calling tools
```

### 2. Resource Groups Count
```
Q: "How many resource groups do I have?"
A: Should call get_resource_groups_count() and return "216 resource groups"
```

### 3. Resource Filter
```
Q: "Show me all resources in East US"
A: Should call get_azure_resources({location: "East US"}) and list resources
```

### 4. Cost Query
```
Q: "What are my costs for the last month?"
A: Should call get_resource_costs() with date range and return cost summary
```

### 5. Summary
```
Q: "Give me an overview of my Azure resources"
A: Should call get_azure_summary() and provide statistics
```

### 6. Non-Azure Question (Should Refuse)
```
Q: "What is the weather today?"
A: Should politely decline and redirect to Azure topics
```

---

## 🔍 Troubleshooting

### Authentication Failed
```bash
# Re-login to Azure
az login

# Verify account
az account show
```

### Model Not Found
- Check deployment name matches: `gpt-4o`
- Verify deployment status: "Succeeded" in portal
- Ensure model is in same project

### No Response from AI
1. Check AI service logs for errors
2. Verify database service is running (port 3002)
3. Test database endpoint:
   ```bash
   curl http://localhost:3002/azure/resources/groups/count
   ```
4. Check Azure Portal for service health

### Function Tools Not Called
- Verify you're using gpt-4o (not gpt-3.5)
- Check agent instructions include tool descriptions
- Review AI service logs for `requires_action` status
- Ensure database has Azure data (schedulers running)

---

## 💰 Cost Estimate

**Moderate Usage** (1000 chat messages/month):
- Model usage (GPT-4o): ~$10-20
- Deployment: ~$0-50
- **Total: $10-70/month**

**To Monitor Costs**:
- Azure Portal → Cost Management
- Set budget alerts
- Review token usage weekly

---

## 📚 Documentation

- **Full Setup**: `/docs/AZURE_AI_FOUNDRY_SETUP.md`
- **Migration Details**: `/docs/AZURE_AI_FOUNDRY_MIGRATION.md`
- **Azure Portal**: https://ai.azure.com/
- **SDK Docs**: https://learn.microsoft.com/en-us/javascript/api/overview/azure/ai-agents-readme

---

## 🎯 Success Criteria

Your migration is successful when:

1. ✅ AI service starts without errors
2. ✅ Chat UI loads at http://localhost:3001
3. ✅ AI responds to "How many resource groups?" with actual count (216)
4. ✅ AI calls function tools (check logs for "Executing tool: get_resource_groups_count")
5. ✅ Responses are data-driven (not generic explanations)
6. ✅ Non-Azure questions are politely declined

---

## 🆘 Need Help?

1. Check logs: `cd ai && npm run start:dev`
2. Review setup guide: `/docs/AZURE_AI_FOUNDRY_SETUP.md`
3. Verify environment variables in `/ai/.env`
4. Test database endpoint: `curl http://localhost:3002/azure/resources/groups/count`
5. Check Azure Portal for project/model status

---

## 🎉 You're Ready!

Follow the 7 quick steps above to complete your Azure AI Foundry setup. The code is ready - just needs Azure configuration!

**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy (mostly portal clicking)  
**Cost**: $10-70/month
