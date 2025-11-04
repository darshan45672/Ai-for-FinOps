# Cost Tracking Fix & Enhancement Summary

## Issue Identified
No cost records or cost snapshots were being stored in the Neon database despite scheduled jobs running. The issue was identified in the Azure Cost Management API integration.

## Root Causes

### 1. Incorrect Data Structure Access
- **Problem**: Code was accessing `costData.properties.rows` but Azure SDK returns `costData.rows` directly
- **Impact**: All cost data parsing failed silently
- **Fixed in**: `backend/src/azure/azure-scheduler.service.ts`

### 2. Limited Logging
- **Problem**: No visibility into HTTP call failures, API responses, or data validation
- **Impact**: Unable to diagnose issues in production
- **Fixed in**: `backend/src/azure/azure-scheduler.service.ts` (saveCostRecord, saveCostSnapshot methods)

### 3. Deprecated API Usage
- **Problem**: Using `CostManagementClient.query.usage()` which is less detailed and potentially deprecated
- **Solution**: Implemented modern Cost Details API workflow
- **Fixed in**: `backend/src/azure/azure.service.ts`

### 4. No Granular Cost Tracking
- **Problem**: Only subscription-level costs tracked, no service-specific or AI token tracking
- **Solution**: Added 4 new schema models for detailed tracking
- **Fixed in**: `database/prisma/schema.prisma`

## Changes Implemented

### 1. Enhanced Logging ✅

#### File: `backend/src/azure/azure-scheduler.service.ts`

**saveCostRecord() Method**:
- Added debug logging for request payloads
- Capture HTTP response status codes
- Log full error responses with status and data
- Show request data in error scenarios

**saveCostSnapshot() Method**:
- Added debug logging for snapshot data structure
- Capture HTTP response status
- Log full error details with response data
- Improved error visibility

**syncAzureCosts() Method**:
- Added logging for cost data structure validation
- Show row count from API responses
- Warn when no cost data available
- Debug cost data structure for troubleshooting

### 2. Modern Cost Details API Implementation ✅

#### File: `backend/src/azure/azure.service.ts`

**New `getCostData()` Method** - Uses Azure Cost Management Cost Details API:

**Workflow**:
1. **Generate Report**: POST to `generateCostDetailsReport` API
   - Uses `ActualCost` metric for accurate billing data
   - Accepts custom date ranges
   - Returns operation ID for polling

2. **Poll Status**: GET `costDetailsOperationStatus` endpoint
   - Polls every 5 seconds (max 60 attempts = 5 minutes)
   - Monitors status: InProgress → Completed/Failed
   - Extracts download URL when ready

3. **Download & Parse CSV**: 
   - Downloads CSV from blob storage URL
   - Parses CSV with proper quote handling
   - Returns structured data matching SDK format

**Features**:
- Detailed meter-level cost data
- Resource-specific tracking
- Proper error handling
- Fallback to legacy API if new API fails

**Helper Methods Added**:
- `extractOperationId()` - Parse operation ID from Location header
- `parseCostDetailsCsv()` - Convert CSV to structured format
- `parseCsvLine()` - Handle quoted CSV values
- `getCostDataLegacy()` - Fallback to old query.usage API

### 3. Enhanced Database Schema ✅

#### File: `database/prisma/schema.prisma`

**New Models Added**:

#### ServiceCostRecord
Tracks individual Azure service costs:
- Container Apps (ca-frontend, ca-ai-service, ca-authentication, ca-backend, ca-database)
- PostgreSQL Flexible Server (psql-finops-prod)
- Azure Cache for Redis (redis-finops-prod)
- Application Gateway
- Virtual Network

**Fields**:
- `subscriptionId`, `serviceName`, `serviceType`, `resourceId`
- `date`, `cost`, `currency`
- `meterCategory`, `meterName`, `quantity`, `unitOfMeasure`, `unitPrice`
- `tags`, `region`, `resourceGroup`
- Unique constraint: `[subscriptionId, serviceName, date]`

#### AiUsageCost
Tracks AI API token usage and costs:
- Google Gemini API
- Future: Azure OpenAI, Anthropic, etc.

**Fields**:
- `conversationId`, `messageId`, `userId`
- `aiProvider`, `modelName`
- `promptTokens`, `completionTokens`, `totalTokens`
- `estimatedCost`, `currency`
- `promptTokenPrice`, `completionTokenPrice`
- `toolsUsed`, `responseTime`, `wasSuccessful`
- `timestamp`, `date`

#### UserCostAllocation
Enables multi-tenant cost tracking:
- Per-user Azure service costs
- Per-user AI API costs
- Total cost with breakdown

**Fields**:
- `userId`, `subscriptionId`, `date`
- `azureServiceCosts`, `aiApiCosts`, `totalCost`, `currency`
- `costBreakdown` JSON (service-level breakdown)
- `resourceUsage` JSON (usage metrics for allocation)
- Unique constraint: `[userId, date]`

#### ResourceCostBreakdown
Meter-level cost details for each resource:
- Detailed meter information
- Quantity, unit price, total cost
- Pricing model (OnDemand, Reserved, Spot)
- Charge type (Usage, Purchase, Refund)

**Fields**:
- `subscriptionId`, `resourceId`, `resourceName`, `resourceType`, `resourceGroup`
- `date`, `meterCategory`, `meterSubCategory`, `meterName`, `meterId`
- `quantity`, `unitOfMeasure`, `unitPrice`, `cost`, `currency`
- `pricingModel`, `chargeType`
- `tags`, `region`, `availabilityZone`
- Unique constraint: `[subscriptionId, resourceId, meterName, date]`

### 4. Database Migration ✅

**Migration Created**: `20251103061550_add_granular_cost_tracking`

All 4 new tables created with:
- Proper indexes for query performance
- Unique constraints to prevent duplicates
- Decimal types with appropriate precision (10,4 for costs, 10,6 for small AI costs, 10,9 for token prices)
- Foreign key relationships where applicable
- JSON fields for flexible metadata storage

## Next Steps

### Task 4: Create Enhanced Cost Tracking Service (Not Started)

**File to Create**: `database/src/cost-tracking/cost-tracking.service.ts`

**Methods Needed**:
```typescript
- saveServiceCost(data: CreateServiceCostDto): Promise<ServiceCostRecord>
- getServiceCosts(filters: ServiceCostFilters): Promise<ServiceCostRecord[]>
- getServiceCostTrends(serviceName: string, days: number): Promise<CostTrend[]>

- saveAiUsageCost(data: CreateAiUsageCostDto): Promise<AiUsageCost>
- getAiUsageCosts(filters: AiUsageCostFilters): Promise<AiUsageCost[]>
- getUserAiCostSummary(userId: string, startDate: Date, endDate: Date): Promise<Summary>

- saveUserCostAllocation(data: CreateUserCostAllocationDto): Promise<UserCostAllocation>
- getUserCostAllocations(userId: string, startDate?: Date, endDate?: Date): Promise<UserCostAllocation[]>
- calculateUserDailyCosts(userId: string, date: Date): Promise<UserCostAllocation>

- saveResourceCostBreakdown(data: CreateResourceCostBreakdownDto): Promise<ResourceCostBreakdown>
- getResourceCostBreakdowns(filters: ResourceCostFilters): Promise<ResourceCostBreakdown[]>
- getTopCostResources(subscriptionId: string, limit: number): Promise<ResourceSummary[]>
```

**Controller Endpoints**:
```typescript
POST   /service-costs
GET    /service-costs?subscriptionId&serviceName&startDate&endDate
GET    /service-costs/:serviceName/trends?days=30

POST   /ai-usage-costs
GET    /ai-usage-costs?userId&conversationId&startDate&endDate
GET    /ai-usage-costs/summary/:userId?startDate&endDate

POST   /user-cost-allocations
GET    /user-cost-allocations/:userId?startDate&endDate
POST   /user-cost-allocations/:userId/calculate?date

POST   /resource-cost-breakdowns
GET    /resource-cost-breakdowns?subscriptionId&resourceId&date
GET    /resource-cost-breakdowns/top?subscriptionId&limit=10
```

### Task 5: Implement AI Token Cost Tracking (Not Started)

**File to Create**: `ai/src/ai-cost-tracker/ai-cost-tracker.service.ts`

**Features**:
1. Intercept Gemini API calls in AI service
2. Extract token usage from responses
3. Calculate estimated costs using pricing:
   - Gemini 1.5 Pro: $0.00125/1K prompt tokens, $0.005/1K completion tokens
   - Gemini 1.5 Flash: $0.00001875/1K prompt tokens, $0.000075/1K completion tokens
4. POST to database service `/ai-usage-costs` endpoint
5. Link to conversationId and messageId
6. Track tool usage and response times

**Integration Points**:
- Wrap `generateContent()` calls
- Store token counts from `response.usageMetadata`
- Send async request to database service (don't block AI response)

### Task 6: Update Scheduler for Granular Collection (Not Started)

**File to Modify**: `backend/src/azure/azure-scheduler.service.ts`

**Changes to `collectDailyCostSnapshots()`**:
1. Parse CSV cost details from new API
2. Group by service name/resource ID
3. Identify specific services:
   - Container Apps: Filter by `resourceType === 'Microsoft.App/containerApps'`
   - PostgreSQL: Filter by `resourceType === 'Microsoft.DBforPostgreSQL/flexibleServers'`
   - Redis: Filter by `resourceType === 'Microsoft.Cache/Redis'`
4. Save to `ServiceCostRecord` table
5. Save to `ResourceCostBreakdown` table for meter details
6. Aggregate for `CostSnapshot` (keep existing behavior)

**New Method to Add**: `collectHourlyCostMetrics()`
```typescript
@Cron('0 * * * *') // Every hour
async collectHourlyCostMetrics() {
  // For high-cost services requiring real-time tracking
  // Query last 1 hour of data
  // Save to ServiceCostRecord with hourly granularity
}
```

## Testing & Validation

### Manual Testing Commands

1. **Trigger Cost Sync**:
```bash
curl -X POST http://localhost:3003/azure/trigger-cost-sync
```

2. **Check Logs**:
```bash
# Backend logs
tail -f logs/backend/combined-*.log | grep -i cost

# Database service logs
tail -f logs/database/combined-*.log | grep -i cost
```

3. **Query Cost Data**:
```bash
# Check AzureCostRecord table
curl http://localhost:3002/azure/costs?subscriptionId=<ID>

# Check CostSnapshot table
curl http://localhost:3002/cost-snapshots/<userId>

# Check new ServiceCostRecord table (after Task 4)
curl http://localhost:3002/service-costs?subscriptionId=<ID>
```

4. **Database Queries**:
```sql
-- Check existing cost records
SELECT COUNT(*) FROM azure_cost_records;
SELECT * FROM azure_cost_records ORDER BY "createdAt" DESC LIMIT 10;

-- Check cost snapshots
SELECT COUNT(*) FROM cost_snapshots;
SELECT * FROM cost_snapshots ORDER BY date DESC LIMIT 10;

-- Check new tables (after migration)
SELECT COUNT(*) FROM service_cost_records;
SELECT COUNT(*) FROM ai_usage_costs;
SELECT COUNT(*) FROM user_cost_allocations;
SELECT COUNT(*) FROM resource_cost_breakdowns;
```

### Expected Outcomes

After all tasks complete:

1. **Cost Records Populated**: `azure_cost_records` table has daily cost data
2. **Cost Snapshots Saved**: `cost_snapshots` table has user-specific snapshots
3. **Service Costs Tracked**: `service_cost_records` table has per-service costs
4. **AI Costs Tracked**: `ai_usage_costs` table has per-conversation token costs
5. **User Allocations Calculated**: `user_cost_allocations` table has daily per-user totals
6. **Resource Breakdowns Detailed**: `resource_cost_breakdowns` table has meter-level data

## Configuration

### Environment Variables Required

```env
# Azure Credentials (already configured)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_SUBSCRIPTION_ID=your-subscription-id

# Database Service URL (already configured)
DATABASE_SERVICE_URL=http://localhost:3002

# Gemini API Pricing (add these)
GEMINI_PRO_PROMPT_PRICE=0.00125    # per 1K tokens
GEMINI_PRO_COMPLETION_PRICE=0.005  # per 1K tokens
GEMINI_FLASH_PROMPT_PRICE=0.00001875
GEMINI_FLASH_COMPLETION_PRICE=0.000075
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Cost Management API                 │
│  - generateCostDetailsReport (POST)                          │
│  - costDetailsOperationStatus (GET polling)                  │
│  - Download CSV with detailed meter data                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend Service (azure.service.ts)                 │
│  - getCostData() - New async workflow                        │
│  - parseCostDetailsCsv() - Parse structured data             │
│  - getCostDataLegacy() - Fallback to old API                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│       Backend Scheduler (azure-scheduler.service.ts)         │
│  - syncAzureCosts() - Daily sync (midnight)                  │
│  - collectDailyCostSnapshots() - Per-user snapshots (UTC)    │
│  - collectHourlyCostMetrics() - Hourly tracking (new)        │
└─────────┬────────────────────┬──────────────────────────────┘
          │                    │
          │ HTTP POST          │ HTTP POST
          ▼                    ▼
┌──────────────────┐  ┌───────────────────────────────────────┐
│  Database API    │  │  Cost Tracking Service (new)          │
│  /azure/costs    │  │  /service-costs                       │
│  /cost-snapshots │  │  /ai-usage-costs                      │
└────────┬─────────┘  │  /user-cost-allocations               │
         │            │  /resource-cost-breakdowns            │
         │            └───────────┬───────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL Database                  │
│  Existing Tables:                                            │
│  - azure_cost_records (subscription/service level)           │
│  - cost_snapshots (user daily snapshots)                     │
│                                                              │
│  New Tables:                                                 │
│  - service_cost_records (per-service: CA, PG, Redis)        │
│  - ai_usage_costs (Gemini token usage & costs)              │
│  - user_cost_allocations (multi-tenant daily costs)         │
│  - resource_cost_breakdowns (meter-level detail)            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
         │ Reads for AI Context
         │
┌─────────────────────────────────────────────────────────────┐
│              AI Service - Chat & Context                     │
│  - Enriches conversations with cost insights                 │
│  - Provides recommendations based on cost trends             │
│  - Tracks own AI token usage via cost tracker                │
└─────────────────────────────────────────────────────────────┘
```

## Benefits Achieved

### 1. Visibility
- Comprehensive logging shows exactly where cost tracking fails
- Debug logs for data structures and API responses
- Error logging with full context (status codes, payloads, errors)

### 2. Accuracy
- Modern Cost Details API provides meter-level granularity
- Resource-specific costs instead of aggregated estimates
- Detailed pricing information (unit price, quantity, meter name)

### 3. Granularity
- Track individual Container Apps (frontend, ai, auth, backend, database)
- Separate PostgreSQL and Redis costs
- AI token usage and cost per conversation/message
- User-level cost allocation for multi-tenant scenarios

### 4. Performance
- Indexes on all frequently queried fields
- Unique constraints prevent duplicate data
- Efficient date-based querying with `@db.Date` type

### 5. Scalability
- Service-level tracking scales to any number of services
- AI cost tracking works with multiple providers
- Resource breakdown supports unlimited meters and resources
- User allocation handles multi-tenant growth

## Cost Estimation

### Current Schema Storage
- **ServiceCostRecord**: ~5 services × 30 days = 150 records/month
- **AiUsageCost**: ~100 conversations/day × 10 messages = 1000 records/day = 30K records/month
- **UserCostAllocation**: ~10 users × 30 days = 300 records/month
- **ResourceCostBreakdown**: ~20 resources × 10 meters × 30 days = 6000 records/month

**Total New Records**: ~36K records/month

**Storage**: ~5-10 MB/month (negligible for Neon)

### API Cost Impact
- **Cost Details API**: Free (part of Azure Cost Management)
- **Polling**: 60 attempts × 5 seconds = 5 minutes max wait (acceptable)
- **CSV Download**: One-time daily download (small bandwidth)

**Result**: No additional Azure API costs

## Documentation Links

- [Azure Cost Details API](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/manage-automation)
- [Cost Management REST API](https://learn.microsoft.com/en-us/rest/api/cost-management/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

## Summary

✅ **Fixed**: Cost tracking pipeline now works correctly with proper data structure access  
✅ **Enhanced**: Comprehensive logging for debugging and monitoring  
✅ **Modernized**: Using latest Cost Details API with CSV download  
✅ **Extended**: Schema supports service-level, AI token, user allocation, and resource tracking  

🚀 **Remaining Work**: 
- Task 4: Create cost tracking service and endpoints
- Task 5: Implement AI token tracking in AI service
- Task 6: Update scheduler for granular collection

**Expected Completion Time**: 4-6 hours for remaining tasks
