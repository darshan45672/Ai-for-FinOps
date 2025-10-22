# Azure Integration - Data Flow Diagram

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                                 │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐           │
│  │Subscriptions│  │   Resources  │  │   Cost Data    │           │
│  │             │  │   (VMs, DBs, │  │  (Last 30 days)│           │
│  │  - Prod     │  │   Storage...)│  │                │           │
│  │  - Dev      │  │              │  │  - By service  │           │
│  │  - Test     │  │  - Location  │  │  - By RG       │           │
│  └─────────────┘  │  - Tags      │  └────────────────┘           │
│                   │  - SKU       │                                 │
│                   └──────────────┘                                 │
└────────────────┬───────────────────────────────────────────────────┘
                 │
                 │ Service Principal Auth
                 │ ClientSecretCredential
                 │
┌────────────────▼───────────────────────────────────────────────────┐
│                    BACKEND SERVICE (Port 3000)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AzureService                                                 │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  • getSubscriptions()          → List all subscriptions      │ │
│  │  • getResources(subId)         → List all resources         │ │
│  │  • getCostData(subId, dates)   → Fetch cost data            │ │
│  │  • queryResourceGraph(query)   → Advanced queries           │ │
│  │  • getVirtualMachines()        → Get all VMs                │ │
│  │  • getStorageAccounts()        → Get all storage            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AzureSchedulerService (Cron Jobs)                           │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │                                                               │ │
│  │  📅 @Cron(EVERY_HOUR)                                        │ │
│  │  syncAzureResources()                                        │ │
│  │  1. Create sync log (in_progress)                           │ │
│  │  2. Fetch all subscriptions                                 │ │
│  │  3. For each subscription:                                  │ │
│  │     - Save subscription to DB                               │ │
│  │     - Fetch all resources                                   │ │
│  │     - Save each resource to DB                              │ │
│  │  4. Update sync log (success/failed)                        │ │
│  │                                                               │ │
│  │  📅 @Cron(EVERY_DAY_AT_MIDNIGHT)                            │ │
│  │  syncAzureCosts()                                            │ │
│  │  1. Create sync log (in_progress)                           │ │
│  │  2. Fetch all subscriptions                                 │ │
│  │  3. For each subscription:                                  │ │
│  │     - Fetch cost data (last 30 days)                        │ │
│  │     - Save cost records to DB                               │ │
│  │  4. Update sync log (success/failed)                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AzureController (REST API)                                  │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  • POST /azure/sync/resources    → Trigger manual sync      │ │
│  │  • POST /azure/sync/costs        → Trigger cost sync        │ │
│  │  • GET  /azure/status            → Check config             │ │
│  │  • GET  /azure/test-connection   → Test Azure connection    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────┬───────────────────────────────────────────────────┘
                 │
                 │ HTTP POST/PATCH
                 │ @nestjs/axios
                 │
┌────────────────▼───────────────────────────────────────────────────┐
│                  DATABASE SERVICE (Port 3002)                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AzureController (REST API)                                  │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │                                                               │ │
│  │  SUBSCRIPTIONS:                                              │ │
│  │  • POST /azure/subscriptions     → Create/update subs       │ │
│  │  • GET  /azure/subscriptions     → List all subs            │ │
│  │  • GET  /azure/subscriptions/:id → Get one sub              │ │
│  │                                                               │ │
│  │  RESOURCES:                                                  │ │
│  │  • POST /azure/resources         → Create/update resources  │ │
│  │  • GET  /azure/resources         → List with filters        │ │
│  │  • GET  /azure/resources/:id     → Get one resource         │ │
│  │                                                               │ │
│  │  COSTS:                                                      │ │
│  │  • POST /azure/costs             → Create cost records      │ │
│  │  • GET  /azure/costs             → List with filters        │ │
│  │  • GET  /azure/costs/summary     → Aggregated costs         │ │
│  │                                                               │ │
│  │  SYNC LOGS:                                                  │ │
│  │  • POST  /azure/sync-logs        → Create log               │ │
│  │  • PATCH /azure/sync-logs/:id    → Update log               │ │
│  │  • GET   /azure/sync-logs        → List logs                │ │
│  │                                                               │ │
│  │  STATISTICS:                                                 │ │
│  │  • GET  /azure/statistics        → Overview stats           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AzureService + Prisma                                       │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  • createOrUpdateSubscription()                              │ │
│  │  • createOrUpdateResource()                                  │ │
│  │  • createCostRecord()                                        │ │
│  │  • createSyncLog() / updateSyncLog()                         │ │
│  │  • getCostSummary()                                          │ │
│  │  • getStatistics()                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────┬───────────────────────────────────────────────────┘
                 │
                 │ Prisma ORM
                 │ TypeScript → SQL
                 │
┌────────────────▼───────────────────────────────────────────────────┐
│                POSTGRESQL (Neon - Cloud Hosted)                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  azure_subscriptions                                         │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  id, subscriptionId, displayName, tenantId, state            │ │
│  │  createdAt, updatedAt                                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  azure_resources                                             │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  id, resourceId, name, type, resourceType, location          │ │
│  │  resourceGroup, subscriptionId, status, sku                  │ │
│  │  tags (JSON), properties (JSON)                              │ │
│  │  createdAt, updatedAt, lastSyncedAt                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  azure_cost_records                                          │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  id, subscriptionId, resourceGroup, resourceId               │ │
│  │  serviceName, meterCategory, cost, currency                  │ │
│  │  usageStart, usageEnd, quantity, unitOfMeasure               │ │
│  │  createdAt                                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  azure_sync_logs                                             │ │
│  │  ────────────────────────────────────────────────────────────│ │
│  │  id, syncType, status, startedAt, completedAt                │ │
│  │  recordsSync, errorMessage                                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘


                         FUTURE: FRONTEND
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Port 3002)                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Resource Dashboard                                           │ │
│  │  • Resource inventory by type/location                       │ │
│  │  • Resource status overview                                  │ │
│  │  • Tag compliance                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Cost Dashboard                                              │ │
│  │  • Total cost overview                                       │ │
│  │  • Cost by service (charts)                                 │ │
│  │  • Cost by resource group                                   │ │
│  │  • Cost trends over time                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Sync Status                                                 │ │
│  │  • Last sync time                                           │ │
│  │  • Sync history/logs                                        │ │
│  │  • Manual trigger buttons                                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Hourly Resource Sync

```
1. ⏰ Cron Trigger (Every hour)
   └──> AzureSchedulerService.syncAzureResources()

2. 📝 Create Sync Log
   POST http://localhost:3002/azure/sync-logs
   { syncType: "resources", status: "in_progress" }
   └──> Returns syncLogId: "clxyz123"

3. ☁️ Fetch from Azure
   for each subscription:
     ├──> AzureService.getSubscriptions()
     │    └──> Azure SDK: subscriptionClient.subscriptions.list()
     │
     └──> AzureService.getResources(subscriptionId)
          └──> Azure SDK: resourcesClient.resources.list()

4. 💾 Save to Database
   for each subscription:
     POST http://localhost:3002/azure/subscriptions
     { subscriptions: [{ subscriptionId, displayName, ... }] }
   
   for each resource:
     POST http://localhost:3002/azure/resources
     { resources: [{ resourceId, name, type, location, ... }] }

5. ✅ Update Sync Log
   PATCH http://localhost:3002/azure/sync-logs/clxyz123
   { 
     status: "success",
     recordsSync: 150,
     completedAt: "2024-01-01T01:00:00Z"
   }

6. 📊 Data Available
   GET http://localhost:3002/azure/resources
   └──> Returns all synced resources
```

## Resource Types Tracked

- 🖥️ VIRTUAL_MACHINE - Azure VMs
- 💾 STORAGE_ACCOUNT - Blob, Files, Queue, Table storage
- 🗄️ SQL_DATABASE - Azure SQL databases
- 🌐 APP_SERVICE - Web apps
- ⚡ FUNCTION_APP - Serverless functions
- ☸️ KUBERNETES_SERVICE - AKS clusters
- 🌍 COSMOS_DB - NoSQL databases
- 🔐 KEY_VAULT - Secrets management
- ❓ OTHER - Everything else

## Cost Data Breakdown

```
Cost Record Structure:
├── Subscription → Which Azure subscription
├── Resource Group → Organizational grouping
├── Service Name → E.g., "Virtual Machines", "Storage"
├── Meter Category → Billing category
├── Cost → Amount spent
├── Currency → USD, EUR, etc.
├── Usage Period → Start and end dates
└── Quantity + Unit → How much used (hours, GB, etc.)

Aggregations Available:
├── Total Cost (all subscriptions)
├── Cost by Service (top 10)
├── Cost by Resource Group (top 10)
└── Cost trends over time
```

## Sync Logs Tracking

```
Each sync creates a log entry:
├── Sync Type: "resources" or "costs"
├── Status: "in_progress" → "success" or "failed"
├── Start Time
├── Completion Time
├── Records Synced: Count of items processed
└── Error Message: If failed

Used for:
├── Monitoring sync health
├── Debugging failures
├── Tracking sync frequency
└── Auditing data freshness
```
