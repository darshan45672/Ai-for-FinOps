# Azure AI Foundry Quota Issue

## Current Problem
You've hit the subscription-level quota limits for GPT models:
- **gpt-4o GlobalStandard**: 450/450 TPM used
- **gpt-4o-mini GlobalStandard**: 2000/2000 TPM used

## What This Means
Your Azure subscription has other GPT model deployments consuming all available quota. The Azure AI Foundry Agents SDK requires a model deployed in the **finopsMvp** resource (linked to your **finops-ai** project), but you can't deploy there due to quota limits.

## Solutions

### Option 1: Find and Delete Unused Deployments (Recommended)
1. Go to https://ai.azure.com/
2. Check ALL your projects (not just finops-ai)
3. Go to each project → **Model deployments**
4. Delete any gpt-4o or gpt-4o-mini deployments you're not using
5. Wait 5-10 minutes for quota to be released
6. Deploy gpt-4o to finopsMvp resource

### Option 2: Use Azure Portal to Manage Quota
1. Go to https://portal.azure.com/
2. Search for **Azure AI Services**
3. Select **Quota**
4. Find **gpt-4o** and **gpt-4o-mini** 
5. See which regions/resources are consuming quota
6. Delete unused deployments
7. Deploy to finopsMvp

### Option 3: Request Quota Increase
1. Go to https://portal.azure.com/
2. Search for "quotas"
3. Select **Azure AI Services**
4. Find **Tokens Per Minute (thousands) - gpt-4o - GlobalStandard**
5. Click **Request quota increase**
6. Request increase from 450 to (at least) 500 TPM
7. Wait for approval (can take 1-2 business days)

### Option 4: Deploy via Azure Portal
Instead of CLI, try deploying via portal (sometimes helps with quota issues):
1. Go to https://ai.azure.com/
2. Select project: **finops-ai**
3. Go to **Model catalog**
4. Search **gpt-4o**
5. Click **Deploy**
6. Choose:
   - Deployment name: `gpt-4o`
   - Capacity: 1 TPM (minimum)
7. If it fails, try **Provisioned** deployment type instead of **GlobalStandard**

## After Deployment Success
Once you have gpt-4o deployed to finopsMvp:

1. Verify deployment:
```bash
az cognitiveservices account deployment list \
  --name finopsMvp \
  --resource-group rg-cp-darshan-dinesh-bhandary \
  --output table
```

2. Restart AI service:
```bash
cd ai && npm run start:dev
```

3. Test in frontend: "How many resource groups do I have?"

## Current Configuration
Your `.env` is correctly configured:
```
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=https://finopsmvp.services.ai.azure.com/api/projects/finops-ai
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT=gpt-4o
```

The service will work once gpt-4o is deployed to the finopsMvp resource.
