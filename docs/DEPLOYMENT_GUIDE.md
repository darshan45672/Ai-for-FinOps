# Production Deployment Guide - AI for FinOps

## Overview

This guide provides step-by-step instructions for deploying the AI for FinOps platform to production on Azure. It covers containerization, Azure service setup, environment configuration, monitoring, and security best practices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Options](#deployment-options)
4. [Option A: Azure Container Instances](#option-a-azure-container-instances)
5. [Option B: Azure App Service](#option-b-azure-app-service)
6. [Option C: Azure Kubernetes Service (AKS)](#option-c-azure-kubernetes-service-aks)
7. [Database Setup](#database-setup)
8. [Redis Cache Setup](#redis-cache-setup)
9. [Environment Configuration](#environment-configuration)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Security Hardening](#security-hardening)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Azure CLI (`az` command)
- Docker Desktop
- Node.js 20+ and npm
- Git
- (Optional) Kubernetes CLI (`kubectl`) for AKS

### Azure Resources Required

- Azure Subscription with appropriate permissions
- Resource Group for the application
- Azure Container Registry (ACR)
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Monitor and Application Insights
- Azure Key Vault (for secrets)
- (Optional) Azure Container Instances / App Service / AKS

### Install Azure CLI

```bash
# macOS
brew install azure-cli

# Windows (via PowerShell)
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Login to Azure

```bash
az login
az account set --subscription "Your-Subscription-Name"
```

---

## Architecture Overview

### Production Architecture

```
                         ┌─────────────────┐
                         │   Azure CDN     │
                         │  (Static Assets)│
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Frontend (Next) │
                         │   Port 3000      │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
           ┌────────▼────────┐   │   ┌────────▼────────┐
           │  Authentication  │   │   │   AI Service    │
           │   Service 3001   │   │   │   Port 3004     │
           └────────┬────────┘   │   └────────┬────────┘
                    │             │             │
                    │   ┌─────────▼─────────┐  │
                    └──►│  Backend Service   │◄─┘
                        │    Port 3003       │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │  Database Service  │
                        │    Port 3002       │
                        └─────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
           ┌────────▼────────┐   │   ┌────────▼────────┐
           │  PostgreSQL DB   │   │   │   Redis Cache   │
           │  (Azure DB)      │   │   │  (Azure Cache)  │
           └──────────────────┘   │   └─────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │  Azure Monitor    │
                        │  App Insights     │
                        └───────────────────┘
```

### Services to Deploy

1. **Frontend** - Next.js application (Static + SSR)
2. **Authentication Service** - NestJS (Port 3001)
3. **Database Service** - NestJS with Prisma (Port 3002)
4. **Backend Service** - NestJS with Azure integration (Port 3003)
5. **AI Service** - NestJS with Gemini and MCP (Port 3004)

---

## Deployment Options

### Comparison

| Feature | Container Instances | App Service | AKS |
|---------|---------------------|-------------|-----|
| Setup Complexity | Low | Low | High |
| Cost | $$ | $$$ | $$$$ |
| Scalability | Manual | Auto | Auto |
| Networking | Simple | Simple | Complex |
| Best For | MVP, Low Traffic | Production Apps | Enterprise, High Scale |
| Recommended | ✅ Start Here | ⭐ Production | 🚀 Scale-up |

**Recommendation:** Start with **Azure Container Instances** for MVP, migrate to **App Service** for production scale.

---

## Option A: Azure Container Instances

### Step 1: Create Resource Group

```bash
# Create resource group
az group create \
  --name rg-ai-finops-prod \
  --location eastus

# Set as default
az configure --defaults group=rg-ai-finops-prod location=eastus
```

### Step 2: Create Azure Container Registry

```bash
# Create ACR
az acr create \
  --name aifinopsacr \
  --sku Basic

# Login to ACR
az acr login --name aifinopsacr

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name aifinopsacr --query loginServer -o tsv)
echo $ACR_LOGIN_SERVER
# Output: aifinopsacr.azurecr.io
```

### Step 3: Build and Push Docker Images

```bash
# Navigate to project root
cd /path/to/Ai-for-FinOps

# Build and push each service
services=("frontend" "authentication" "database" "backend" "ai")

for service in "${services[@]}"; do
  echo "Building $service..."
  
  # Build Docker image
  docker build -t $ACR_LOGIN_SERVER/ai-finops-$service:latest ./$service
  
  # Push to ACR
  docker push $ACR_LOGIN_SERVER/ai-finops-$service:latest
done
```

**Note:** Ensure each service has a `Dockerfile`. Frontend may require special Next.js build configuration.

### Step 4: Create PostgreSQL Database

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name ai-finops-db-prod \
  --admin-user adminuser \
  --admin-password 'SecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --server-name ai-finops-db-prod \
  --database-name finops

# Get connection string
DB_HOST=$(az postgres flexible-server show --name ai-finops-db-prod --query fullyQualifiedDomainName -o tsv)
echo "DATABASE_URL=postgresql://adminuser:SecurePassword123!@$DB_HOST:5432/finops"
```

### Step 5: Create Redis Cache

```bash
# Create Redis cache
az redis create \
  --name ai-finops-redis-prod \
  --sku Basic \
  --vm-size c0

# Get Redis connection details
REDIS_HOST=$(az redis show --name ai-finops-redis-prod --query hostName -o tsv)
REDIS_KEY=$(az redis list-keys --name ai-finops-redis-prod --query primaryKey -o tsv)

echo "REDIS_URL=redis://:$REDIS_KEY@$REDIS_HOST:6380?ssl=true"
```

### Step 6: Create Key Vault for Secrets

```bash
# Create Key Vault
az keyvault create \
  --name ai-finops-kv-prod \
  --enabled-for-deployment true

# Store secrets
az keyvault secret set --vault-name ai-finops-kv-prod --name DatabaseUrl --value "postgresql://..."
az keyvault secret set --vault-name ai-finops-kv-prod --name RedisUrl --value "redis://..."
az keyvault secret set --vault-name ai-finops-kv-prod --name GeminiApiKey --value "your-key"
az keyvault secret set --vault-name ai-finops-kv-prod --name AzureClientSecret --value "your-secret"
```

### Step 7: Deploy Container Instances

```bash
# Deploy Database Service
az container create \
  --name ai-finops-database \
  --image $ACR_LOGIN_SERVER/ai-finops-database:latest \
  --cpu 1 --memory 1.5 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name aifinopsacr --query username -o tsv) \
  --registry-password $(az acr credential show --name aifinopsacr --query passwords[0].value -o tsv) \
  --environment-variables \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://ai-finops-kv-prod.vault.azure.net/secrets/DatabaseUrl/)" \
    REDIS_URL="@Microsoft.KeyVault(SecretUri=https://ai-finops-kv-prod.vault.azure.net/secrets/RedisUrl/)" \
  --ports 3002 \
  --dns-name-label ai-finops-database-prod

# Deploy Backend Service
az container create \
  --name ai-finops-backend \
  --image $ACR_LOGIN_SERVER/ai-finops-backend:latest \
  --cpu 1 --memory 1.5 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name aifinopsacr --query username -o tsv) \
  --registry-password $(az acr credential show --name aifinopsacr --query passwords[0].value -o tsv) \
  --environment-variables \
    DATABASE_SERVICE_URL="http://ai-finops-database-prod.eastus.azurecontainer.io:3002" \
    AZURE_CLIENT_ID="your-client-id" \
    AZURE_CLIENT_SECRET="@Microsoft.KeyVault(...)" \
    AZURE_TENANT_ID="your-tenant-id" \
    AZURE_SUBSCRIPTION_ID="your-subscription-id" \
  --ports 3003 \
  --dns-name-label ai-finops-backend-prod

# Deploy AI Service
az container create \
  --name ai-finops-ai \
  --image $ACR_LOGIN_SERVER/ai-finops-ai:latest \
  --cpu 2 --memory 3 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name aifinopsacr --query username -o tsv) \
  --registry-password $(az acr credential show --name aifinopsacr --query passwords[0].value -o tsv) \
  --environment-variables \
    DATABASE_SERVICE_URL="http://ai-finops-database-prod.eastus.azurecontainer.io:3002" \
    GEMINI_API_KEY="@Microsoft.KeyVault(...)" \
    REDIS_URL="@Microsoft.KeyVault(...)" \
  --ports 3004 \
  --dns-name-label ai-finops-ai-prod

# Deploy Authentication Service
az container create \
  --name ai-finops-auth \
  --image $ACR_LOGIN_SERVER/ai-finops-authentication:latest \
  --cpu 1 --memory 1.5 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name aifinopsacr --query username -o tsv) \
  --registry-password $(az acr credential show --name aifinopsacr --query passwords[0].value -o tsv) \
  --environment-variables \
    DATABASE_SERVICE_URL="http://ai-finops-database-prod.eastus.azurecontainer.io:3002" \
    JWT_SECRET="your-jwt-secret" \
    GITHUB_CLIENT_ID="your-github-id" \
    GITHUB_CLIENT_SECRET="@Microsoft.KeyVault(...)" \
  --ports 3001 \
  --dns-name-label ai-finops-auth-prod

# Deploy Frontend
az container create \
  --name ai-finops-frontend \
  --image $ACR_LOGIN_SERVER/ai-finops-frontend:latest \
  --cpu 1 --memory 2 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $(az acr credential show --name aifinopsacr --query username -o tsv) \
  --registry-password $(az acr credential show --name aifinopsacr --query passwords[0].value -o tsv) \
  --environment-variables \
    NEXT_PUBLIC_API_URL="http://ai-finops-backend-prod.eastus.azurecontainer.io:3003" \
    NEXT_PUBLIC_AUTH_URL="http://ai-finops-auth-prod.eastus.azurecontainer.io:3001" \
    NEXT_PUBLIC_AI_URL="http://ai-finops-ai-prod.eastus.azurecontainer.io:3004" \
  --ports 3000 \
  --dns-name-label ai-finops-frontend-prod
```

### Step 8: Verify Deployment

```bash
# Check container status
az container list --output table

# Get frontend URL
echo "Frontend: http://ai-finops-frontend-prod.eastus.azurecontainer.io:3000"

# Check logs
az container logs --name ai-finops-database
az container logs --name ai-finops-ai
```

### Step 9: Setup Application Gateway (Optional)

For production, use Azure Application Gateway for:
- HTTPS/TLS termination
- Single public endpoint
- Load balancing
- WAF (Web Application Firewall)

```bash
# Create Application Gateway
az network application-gateway create \
  --name ai-finops-appgw \
  --sku Standard_v2 \
  --capacity 2 \
  --vnet-name ai-finops-vnet \
  --subnet appgw-subnet \
  --public-ip-address ai-finops-appgw-pip \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-port 80 \
  --http-settings-port 3000 \
  --http-settings-protocol Http

# Configure backend pools, rules, etc.
# (See Azure Application Gateway documentation)
```

---

## Option B: Azure App Service

### Step 1: Create App Service Plans

```bash
# Create App Service Plan for backend services
az appservice plan create \
  --name asp-ai-finops-backend \
  --sku P1V2 \
  --is-linux

# Create App Service Plan for frontend
az appservice plan create \
  --name asp-ai-finops-frontend \
  --sku P1V2 \
  --is-linux
```

### Step 2: Create Web Apps

```bash
# Database Service
az webapp create \
  --name ai-finops-database-app \
  --plan asp-ai-finops-backend \
  --deployment-container-image-name $ACR_LOGIN_SERVER/ai-finops-database:latest

# Backend Service
az webapp create \
  --name ai-finops-backend-app \
  --plan asp-ai-finops-backend \
  --deployment-container-image-name $ACR_LOGIN_SERVER/ai-finops-backend:latest

# AI Service
az webapp create \
  --name ai-finops-ai-app \
  --plan asp-ai-finops-backend \
  --deployment-container-image-name $ACR_LOGIN_SERVER/ai-finops-ai:latest

# Authentication Service
az webapp create \
  --name ai-finops-auth-app \
  --plan asp-ai-finops-backend \
  --deployment-container-image-name $ACR_LOGIN_SERVER/ai-finops-authentication:latest

# Frontend
az webapp create \
  --name ai-finops-frontend-app \
  --plan asp-ai-finops-frontend \
  --deployment-container-image-name $ACR_LOGIN_SERVER/ai-finops-frontend:latest
```

### Step 3: Configure App Settings

```bash
# Database Service settings
az webapp config appsettings set \
  --name ai-finops-database-app \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(...)" \
    REDIS_URL="@Microsoft.KeyVault(...)" \
    PORT="3002"

# Backend Service settings
az webapp config appsettings set \
  --name ai-finops-backend-app \
  --settings \
    DATABASE_SERVICE_URL="https://ai-finops-database-app.azurewebsites.net" \
    AZURE_CLIENT_ID="your-client-id" \
    AZURE_CLIENT_SECRET="@Microsoft.KeyVault(...)" \
    PORT="3003"

# AI Service settings
az webapp config appsettings set \
  --name ai-finops-ai-app \
  --settings \
    DATABASE_SERVICE_URL="https://ai-finops-database-app.azurewebsites.net" \
    GEMINI_API_KEY="@Microsoft.KeyVault(...)" \
    PORT="3004"

# Frontend settings
az webapp config appsettings set \
  --name ai-finops-frontend-app \
  --settings \
    NEXT_PUBLIC_API_URL="https://ai-finops-backend-app.azurewebsites.net" \
    NEXT_PUBLIC_AI_URL="https://ai-finops-ai-app.azurewebsites.net" \
    PORT="3000"
```

### Step 4: Enable Continuous Deployment

```bash
# Configure ACR webhook for auto-deployment
az webapp deployment container config \
  --name ai-finops-database-app \
  --enable-cd true

# Get webhook URL
az webapp deployment container show-cd-url \
  --name ai-finops-database-app

# Configure ACR webhook
az acr webhook create \
  --name databaseAppWebhook \
  --registry aifinopsacr \
  --uri <webhook-url> \
  --actions push \
  --scope ai-finops-database:latest
```

### Step 5: Scale Out

```bash
# Manual scale
az appservice plan update \
  --name asp-ai-finops-backend \
  --number-of-workers 3

# Auto-scale rules
az monitor autoscale create \
  --resource asp-ai-finops-backend \
  --resource-type Microsoft.Web/serverfarms \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Scale based on CPU
az monitor autoscale rule create \
  --resource asp-ai-finops-backend \
  --resource-type Microsoft.Web/serverfarms \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 2
```

---

## Option C: Azure Kubernetes Service (AKS)

### Step 1: Create AKS Cluster

```bash
# Create AKS cluster
az aks create \
  --name ai-finops-aks \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-managed-identity \
  --attach-acr aifinopsacr \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --name ai-finops-aks
```

### Step 2: Create Kubernetes Manifests

Create `k8s/` directory with deployment files:

**database-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: database-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: database-service
  template:
    metadata:
      labels:
        app: database-service
    spec:
      containers:
      - name: database
        image: aifinopsacr.azurecr.io/ai-finops-database:latest
        ports:
        - containerPort: 3002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
---
apiVersion: v1
kind: Service
metadata:
  name: database-service
spec:
  selector:
    app: database-service
  ports:
  - protocol: TCP
    port: 3002
    targetPort: 3002
  type: ClusterIP
```

**Similar files for:** `backend-deployment.yaml`, `ai-deployment.yaml`, `auth-deployment.yaml`, `frontend-deployment.yaml`

### Step 3: Create Secrets

```bash
# Create Kubernetes secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=gemini-api-key="your-key" \
  --from-literal=azure-client-secret="your-secret" \
  --from-literal=jwt-secret="your-jwt-secret"
```

### Step 4: Deploy to AKS

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployments
kubectl get deployments
kubectl get pods
kubectl get services

# Get frontend URL (LoadBalancer)
kubectl get service frontend-service
```

### Step 5: Setup Ingress Controller

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Create Ingress resource
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-finops-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: ai-finops.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
      - path: /api/chat
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 3004
EOF
```

---

## Database Setup

### Run Migrations

```bash
# Connect to database container
# For Container Instances:
az container exec --name ai-finops-database --exec-command "/bin/sh"

# Inside container:
cd /app
npx prisma migrate deploy
npx prisma generate
```

### Seed Initial Data (Optional)

```bash
# Create seed script: database/prisma/seed.ts
npx prisma db seed
```

### Backup Strategy

```bash
# Enable automated backups for PostgreSQL
az postgres flexible-server update \
  --name ai-finops-db-prod \
  --backup-retention 30 \
  --geo-redundant-backup Enabled
```

---

## Redis Cache Setup

### Configure Redis

```bash
# Enable Redis persistence (AOF)
az redis update \
  --name ai-finops-redis-prod \
  --set "redisConfiguration.aof-backup-enabled=true"

# Set maxmemory policy
az redis update \
  --name ai-finops-redis-prod \
  --set "redisConfiguration.maxmemory-policy=allkeys-lru"
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production` files for each service:

**database/.env.production:**
```env
DATABASE_URL=postgresql://adminuser:password@ai-finops-db-prod.postgres.database.azure.com:5432/finops
REDIS_URL=redis://:key@ai-finops-redis-prod.redis.cache.windows.net:6380?ssl=true
NODE_ENV=production
PORT=3002
```

**backend/.env.production:**
```env
DATABASE_SERVICE_URL=https://ai-finops-database-app.azurewebsites.net
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_SUBSCRIPTION_ID=your-subscription-id
NODE_ENV=production
PORT=3003
```

**ai/.env.production:**
```env
DATABASE_SERVICE_URL=https://ai-finops-database-app.azurewebsites.net
GEMINI_API_KEY=your-gemini-key
REDIS_URL=redis://:key@ai-finops-redis-prod.redis.cache.windows.net:6380?ssl=true
NODE_ENV=production
PORT=3004
```

**authentication/.env.production:**
```env
DATABASE_SERVICE_URL=https://ai-finops-database-app.azurewebsites.net
JWT_SECRET=your-jwt-secret-at-least-32-chars
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback
NODE_ENV=production
PORT=3001
```

**frontend/.env.production:**
```env
NEXT_PUBLIC_API_URL=https://ai-finops-backend-app.azurewebsites.net
NEXT_PUBLIC_AUTH_URL=https://ai-finops-auth-app.azurewebsites.net
NEXT_PUBLIC_AI_URL=https://ai-finops-ai-app.azurewebsites.net
NODE_ENV=production
```

---

## Monitoring and Logging

### Setup Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app ai-finops-insights \
  --kind web \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app ai-finops-insights \
  --query instrumentationKey -o tsv)

# Add to environment variables
echo "APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=$INSTRUMENTATION_KEY"
```

### Configure Logging

Add to each service's main.ts:

```typescript
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

// Enable Application Insights
const appInsights = new ApplicationInsights({
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
});
appInsights.start();
```

### Setup Alerts

```bash
# Alert for high CPU usage
az monitor metrics alert create \
  --name HighCPUAlert \
  --resource ai-finops-backend-app \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email your@email.com

# Alert for HTTP 5xx errors
az monitor metrics alert create \
  --name Http5xxAlert \
  --resource ai-finops-backend-app \
  --condition "total Http5xx > 10" \
  --window-size 5m \
  --action email your@email.com
```

---

## Security Hardening

### 1. Enable HTTPS/TLS

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name ai-finops-frontend-app \
  --hostname ai-finops.yourdomain.com

# Enable HTTPS only
az webapp update \
  --name ai-finops-frontend-app \
  --https-only true

# Add managed certificate
az webapp config ssl bind \
  --name ai-finops-frontend-app \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### 2. Configure CORS

In each backend service (main.ts):

```typescript
app.enableCors({
  origin: ['https://ai-finops.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});
```

### 3. Enable Rate Limiting

Install and configure:

```bash
npm install @nestjs/throttler
```

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
```

### 4. Network Security

```bash
# Restrict database access to Azure services only
az postgres flexible-server firewall-rule create \
  --name ai-finops-db-prod \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Configure Virtual Network (VNet) integration
az webapp vnet-integration add \
  --name ai-finops-backend-app \
  --vnet ai-finops-vnet \
  --subnet backend-subnet
```

### 5. Secrets Management

Use Azure Key Vault references in App Settings:

```bash
# Reference format
@Microsoft.KeyVault(SecretUri=https://ai-finops-kv-prod.vault.azure.net/secrets/DatabaseUrl/)
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Build and push images
      run: |
        az acr login --name aifinopsacr
        
        # Build all services
        docker build -t aifinopsacr.azurecr.io/ai-finops-database:${{ github.sha }} ./database
        docker build -t aifinopsacr.azurecr.io/ai-finops-backend:${{ github.sha }} ./backend
        docker build -t aifinopsacr.azurecr.io/ai-finops-ai:${{ github.sha }} ./ai
        docker build -t aifinopsacr.azurecr.io/ai-finops-authentication:${{ github.sha }} ./authentication
        docker build -t aifinopsacr.azurecr.io/ai-finops-frontend:${{ github.sha }} ./frontend
        
        # Push all images
        docker push aifinopsacr.azurecr.io/ai-finops-database:${{ github.sha }}
        docker push aifinopsacr.azurecr.io/ai-finops-backend:${{ github.sha }}
        docker push aifinopsacr.azurecr.io/ai-finops-ai:${{ github.sha }}
        docker push aifinopsacr.azurecr.io/ai-finops-authentication:${{ github.sha }}
        docker push aifinopsacr.azurecr.io/ai-finops-frontend:${{ github.sha }}
    
    - name: Update Container Instances
      run: |
        # Update each container with new image
        az container create --name ai-finops-database --image aifinopsacr.azurecr.io/ai-finops-database:${{ github.sha }} --force
        az container create --name ai-finops-backend --image aifinopsacr.azurecr.io/ai-finops-backend:${{ github.sha }} --force
        # ... repeat for all services
```

### Setup Azure Credentials

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-ai-finops" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-ai-finops-prod \
  --sdk-auth

# Copy output and add as GitHub secret: AZURE_CREDENTIALS
```

---

## Backup and Disaster Recovery

### Database Backups

```bash
# Manual backup
az postgres flexible-server backup create \
  --name ai-finops-db-prod \
  --backup-name manual-backup-$(date +%Y%m%d)

# Restore from backup
az postgres flexible-server restore \
  --source-server ai-finops-db-prod \
  --restore-point-in-time "2025-11-01T12:00:00Z" \
  --name ai-finops-db-restored
```

### Redis Backup

```bash
# Export Redis data
az redis export \
  --name ai-finops-redis-prod \
  --prefix backup-$(date +%Y%m%d) \
  --container <storage-container-url>

# Import Redis data
az redis import \
  --name ai-finops-redis-prod \
  --files <blob-url>
```

### Disaster Recovery Plan

1. **Regular Backups:** Daily automated backups (30-day retention)
2. **Geo-Redundancy:** Enable for database and storage
3. **Documentation:** Keep deployment scripts in version control
4. **Testing:** Quarterly disaster recovery drills
5. **Monitoring:** Alerts for service health

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
az container logs --name ai-finops-database

# Check events
az container show --name ai-finops-database --query "instanceView.events"

# Common issues:
# - Environment variables incorrect
# - Database connection failed
# - Port conflicts
```

### Database Connection Issues

```bash
# Test connection from container
az container exec --name ai-finops-database --exec-command "/bin/sh"
nc -zv ai-finops-db-prod.postgres.database.azure.com 5432

# Check firewall rules
az postgres flexible-server firewall-rule list --name ai-finops-db-prod
```

### High Response Times

```bash
# Check Application Insights
az monitor app-insights metrics show \
  --app ai-finops-insights \
  --metric requests/duration

# Scale up/out if needed
az appservice plan update --name asp-ai-finops-backend --sku P2V2
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | SKU | Quantity | Est. Cost |
|---------|-----|----------|-----------|
| App Service Plan (Backend) | P1V2 | 1 | $146 |
| App Service Plan (Frontend) | P1V2 | 1 | $146 |
| PostgreSQL | Standard_B1ms | 1 | $25 |
| Redis Cache | Basic C0 | 1 | $16 |
| Container Registry | Basic | 1 | $5 |
| Application Insights | Standard | 1 | $10 |
| **Total** | | | **~$350/month** |

### Cost Saving Tips

1. **Use B-series VMs** for non-production environments
2. **Enable auto-scaling** to scale down during low traffic
3. **Use Reserved Instances** for 1-3 year commitments (save 30-50%)
4. **Monitor and optimize** Gemini API usage
5. **Set up budgets and alerts** in Azure Cost Management

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the AI for FinOps platform to Azure production. Choose the deployment option that best fits your needs:

- **Container Instances:** Quick MVP deployment
- **App Service:** Production-ready with auto-scaling
- **AKS:** Enterprise scale with Kubernetes

Follow security best practices, set up monitoring, and implement CI/CD for a robust production system.

**Next Steps:**
1. Complete deployment checklist
2. Run end-to-end tests in production
3. Configure monitoring and alerts
4. Train users on the platform
5. Gather feedback and iterate

**Support:** For issues or questions, refer to the [API Documentation](./API_DOCUMENTATION.md) and [Troubleshooting Guide](./END_TO_END_TESTING_GUIDE.md#troubleshooting).

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0  
**Status:** Production Ready 🚀
