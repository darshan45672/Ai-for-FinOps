# Azure Service Principal Setup Guide

## What You Need to Fetch Azure Details

To fetch resource and cost data from Azure, you need to create a **Service Principal** with the appropriate permissions.

## 🔑 Required Environment Variables

Add these to `/backend/.env`:

```env
# Azure Service Principal Credentials
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<your-application-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_SUBSCRIPTION_ID=<your-subscription-id>  # Optional: fetches all accessible if not specified
```

## 📝 Step-by-Step Setup

### Option 1: Using Azure Portal (Recommended for Beginners)

#### 1. Create App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **+ New registration**
4. Enter details:
   - **Name**: `ai-finops-service-principal` (or any name you prefer)
   - **Supported account types**: Select "Accounts in this organizational directory only"
   - **Redirect URI**: Leave blank
5. Click **Register**

#### 2. Get Tenant ID and Client ID
After registration, you'll see:
- **Application (client) ID** → This is your `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → This is your `AZURE_TENANT_ID`

Copy these values to your `.env` file.

#### 3. Create Client Secret
1. In your app registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Add description: `FinOps Backend Secret`
4. Set expiration: **180 days** (or as per your policy)
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately (you can't see it again!)
   - This is your `AZURE_CLIENT_SECRET`

#### 4. Get Subscription ID
1. Go to **Subscriptions** in Azure Portal
2. Copy the **Subscription ID** of the subscription you want to monitor
   - This is your `AZURE_SUBSCRIPTION_ID`

#### 5. Assign Permissions to Service Principal
You need to give the Service Principal access to read resources and costs:

##### A. Reader Role (for resources)
1. Go to your **Subscription**
2. Click **Access control (IAM)**
3. Click **+ Add** → **Add role assignment**
4. Select **Reader** role
5. Click **Next**
6. Click **+ Select members**
7. Search for your app name (`ai-finops-service-principal`)
8. Click **Select** → **Review + assign**

##### B. Cost Management Reader Role (for cost data)
1. Still in **Access control (IAM)**
2. Click **+ Add** → **Add role assignment**
3. Select **Cost Management Reader** role
4. Click **Next**
5. Click **+ Select members**
6. Search for your app name
7. Click **Select** → **Review + assign**

### Option 2: Using Azure CLI (Faster)

```bash
# 1. Login to Azure
az login

# 2. Get your subscription ID
az account show --query id --output tsv
# Copy this as AZURE_SUBSCRIPTION_ID

# 3. Create Service Principal with Reader role
az ad sp create-for-rbac \
  --name "ai-finops-service-principal" \
  --role "Reader" \
  --scopes "/subscriptions/<YOUR_SUBSCRIPTION_ID>"

# Output will show:
# {
#   "appId": "xxx",           ← AZURE_CLIENT_ID
#   "displayName": "...",
#   "password": "xxx",        ← AZURE_CLIENT_SECRET
#   "tenant": "xxx"           ← AZURE_TENANT_ID
# }

# 4. Add Cost Management Reader role
az role assignment create \
  --assignee <YOUR_CLIENT_ID> \
  --role "Cost Management Reader" \
  --scope "/subscriptions/<YOUR_SUBSCRIPTION_ID>"

# 5. (Optional) Add Resource Graph Reader role for advanced queries
az role assignment create \
  --assignee <YOUR_CLIENT_ID> \
  --role "Resource Graph Reader" \
  --scope "/subscriptions/<YOUR_SUBSCRIPTION_ID>"
```

## 🔐 Required Azure Permissions

Your Service Principal needs these roles:

| Role | Purpose | Required |
|------|---------|----------|
| **Reader** | Read resource information | ✅ Yes |
| **Cost Management Reader** | Read cost data | ✅ Yes |
| **Resource Graph Reader** | Advanced resource queries | ⚠️ Recommended |

## ✅ Verify Your Setup

### 1. Update `.env` file

```env
# backend/.env
AZURE_TENANT_ID=12345678-1234-1234-1234-123456789abc
AZURE_CLIENT_ID=87654321-4321-4321-4321-cba987654321
AZURE_CLIENT_SECRET=abC1~xYz2~3dEf4gHi5jKl6mNo7pQr8sT9uVw0xY
AZURE_SUBSCRIPTION_ID=abcdef12-3456-7890-abcd-ef1234567890

# Database Service URL
DATABASE_SERVICE_URL=http://localhost:3002

# Application Port
PORT=3003
```

### 2. Test Authentication

```bash
# Using Azure CLI
az login --service-principal \
  -u <YOUR_CLIENT_ID> \
  -p <YOUR_CLIENT_SECRET> \
  --tenant <YOUR_TENANT_ID>

# Test access
az account show
az resource list --subscription <YOUR_SUBSCRIPTION_ID>
```

### 3. Test Backend Service

```bash
# Start backend
cd backend
npm run start:dev

# Test Azure status
curl http://localhost:3003/azure/status

# Test Azure connection (fetches subscriptions)
curl http://localhost:3003/azure/test-connection
```

Expected response:
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "your-subscription-id",
      "name": "Your Subscription Name",
      "state": "Enabled"
    }
  ]
}
```

## 🔒 Security Best Practices

### 1. Keep Secrets Secure
- ✅ Never commit `.env` files to git (already in `.gitignore`)
- ✅ Use different secrets for development and production
- ✅ Rotate secrets every 90 days
- ✅ Use Azure Key Vault in production

### 2. Principle of Least Privilege
- Only grant necessary permissions
- Use separate Service Principals for different environments
- Limit scope to specific subscriptions/resource groups

### 3. Monitor Usage
- Enable Azure AD sign-in logs
- Monitor Service Principal activity
- Set up alerts for unusual access patterns

## 📊 What You Can Fetch with These Credentials

Once configured, your backend can automatically fetch:

### Resources (Hourly)
- ☁️ Virtual Machines
- 💾 Storage Accounts
- 🗄️ SQL Databases
- 🌐 App Services
- ⚡ Function Apps
- ☸️ Kubernetes Services (AKS)
- 🌍 Cosmos DB
- 🔐 Key Vaults
- And all other Azure resources

### Cost Data (Daily)
- 💰 Total costs by subscription
- 📊 Cost breakdown by service
- 🏢 Cost breakdown by resource group
- 📅 Historical cost trends (last 30 days)
- 📈 Usage quantities and units

### Metadata
- 🏷️ Resource tags
- 📍 Resource locations
- 🔧 Resource SKUs
- ⚙️ Resource properties
- 🔄 Resource status

## 🛠️ Troubleshooting

### Issue: "Azure credentials not configured"
**Solution**: Check that all 4 variables are set in `/backend/.env`

```bash
# Verify environment variables
cat backend/.env | grep AZURE_
```

### Issue: "Failed to authenticate"
**Possible causes**:
1. **Wrong credentials**: Double-check Tenant ID, Client ID, and Secret
2. **Expired secret**: Create a new client secret
3. **Wrong tenant**: Ensure you're using the correct Azure AD tenant

**Solution**: Test with Azure CLI first:
```bash
az login --service-principal \
  -u $AZURE_CLIENT_ID \
  -p $AZURE_CLIENT_SECRET \
  --tenant $AZURE_TENANT_ID
```

### Issue: "Failed to fetch subscriptions"
**Possible causes**:
1. **No Reader role**: Service Principal needs Reader access
2. **Wrong subscription**: Check subscription ID
3. **Subscription disabled**: Verify subscription is active

**Solution**: Verify role assignments:
```bash
az role assignment list --assignee <YOUR_CLIENT_ID> --output table
```

### Issue: "Failed to fetch cost data"
**Possible causes**:
1. **No Cost Management Reader role**: Required for cost data
2. **No cost data available**: Cost data might not be generated yet

**Solution**: Add Cost Management Reader role:
```bash
az role assignment create \
  --assignee <YOUR_CLIENT_ID> \
  --role "Cost Management Reader" \
  --scope "/subscriptions/<YOUR_SUBSCRIPTION_ID>"
```

## 📚 Additional Resources

- [Azure Service Principal Docs](https://docs.microsoft.com/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure RBAC Docs](https://docs.microsoft.com/azure/role-based-access-control/)
- [Cost Management API](https://docs.microsoft.com/azure/cost-management-billing/costs/)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)

## 🎯 Quick Checklist

Before running the backend, ensure:

- [ ] Azure Service Principal created
- [ ] Tenant ID copied to `.env`
- [ ] Client ID copied to `.env`
- [ ] Client Secret copied to `.env`
- [ ] Subscription ID copied to `.env`
- [ ] Reader role assigned
- [ ] Cost Management Reader role assigned
- [ ] Backend service can start: `npm run start:dev`
- [ ] Status endpoint works: `curl http://localhost:3003/azure/status`
- [ ] Connection test passes: `curl http://localhost:3003/azure/test-connection`

Once all checked, your Azure integration is ready! 🎉
