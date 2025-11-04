# Task 6: Scheduler Update for Granular Cost Collection

## Implementation Summary

**Date:** 2025  
**Status:** ✅ COMPLETED  
**Files Modified:** 1  
**Lines Changed:** ~500 lines added

---

## Overview

Task 6 completes the cost tracking enhancement pipeline by updating the Azure scheduler to parse detailed CSV cost data from the modern Cost Details API and save granular records to the new database tables (ServiceCostRecord and ResourceCostBreakdown). This enables real-time, service-level cost tracking with meter-level detail.

---

## Changes Made

### 1. Enhanced `collectDailyCostSnapshots()` Method

**Location:** `/backend/src/azure/azure-scheduler.service.ts` (lines 388-580)

**Purpose:** Parse CSV cost details and save granular service/resource tracking data

**Key Enhancements:**

#### CSV Column Mapping
```typescript
private mapCsvColumns(columns: any[]): Record<string, number> {
  // Maps column names to indexes:
  // - date/usagedate
  // - resourceid, resourcename, resourcetype, resourcegroup
  // - metercategory, metersubcategory, metername
  // - quantity, unitofmeasure, unitprice, cost, currency
}
```

#### Service Cost Aggregation
```typescript
// Aggregates costs by service from CSV rows
const serviceCosts = new Map<string, {
  cost: number;
  resourceGroup: string;
  region: string;
}>();

// Maps Azure resource types to service names:
// Microsoft.App/containerApps → ca-frontend, ca-ai-service, ca-authentication, ca-backend, ca-database
// Microsoft.DBforPostgreSQL/flexibleServers → psql-finops-prod
// Microsoft.Cache/Redis → redis-finops-prod
// Microsoft.Network/applicationGateways → app-gateway
```

#### Resource Breakdown Tracking
```typescript
// Stores meter-level cost details (top 50 by cost)
const resourceBreakdowns = new Map<string, {
  resourceName: string;
  resourceGroup: string;
  resourceType: string;
  meterCategory: string;
  meterSubCategory: string;
  meterName: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  cost: number;
  currency: string;
}>();
```

#### Data Persistence
```typescript
// Save service costs via POST /cost-tracking/service-costs
for (const [serviceKey, data] of serviceCosts.entries()) {
  await this.saveServiceCost({
    serviceName,
    serviceType,
    date: yesterday,
    cost: data.cost,
    currency: 'USD',
    subscriptionId: subscription.subscriptionId,
    resourceGroup: data.resourceGroup,
    region: data.region,
    billingPeriod: 'YYYY-MM',
  });
}

// Save top 50 resource breakdowns via POST /cost-tracking/resource-cost-breakdowns
for (const breakdown of topBreakdowns) {
  await this.saveResourceCostBreakdown({
    date: yesterday,
    subscriptionId: subscription.subscriptionId,
    ...breakdown,
  });
}

// Keep legacy CostSnapshot for backward compatibility
await this.saveCostSnapshot({
  userId: user.id,
  subscriptionId: subscription.subscriptionId,
  date: yesterday,
  totalCost,
  serviceBreakdown,
  topResources,
});
```

**Enhanced Logging:**
```
Starting daily cost snapshot collection with granular tracking...
Processing 247 cost detail records
Saved service cost for ca-frontend (CONTAINER_APP): $12.4567
Saved resource breakdown for ca-ai-service: Compute Hours = $5.2341
Saved cost snapshot for user admin, subscription Prod: $127.89 (7 services, 50 resource breakdowns)
Daily cost snapshot collection completed
```

---

### 2. New `collectHourlyCostMetrics()` Method

**Location:** `/backend/src/azure/azure-scheduler.service.ts` (lines 582-700)

**Purpose:** Collect hourly cost metrics for near real-time monitoring

**Cron Schedule:** Every hour at minute 0 (00:00, 01:00, 02:00, etc.)

**Implementation:**
```typescript
@Cron('0 * * * *', {
  name: 'hourly-cost-metrics',
  timeZone: 'UTC',
})
async collectHourlyCostMetrics() {
  // 1. Fetch cost data for past hour
  const costResult = await this.azureService.getCostData(
    subscription.subscriptionId,
    oneHourAgo,
    now,
  );
  
  // 2. Parse and aggregate by service
  rows.forEach((row: any[]) => {
    const serviceName = this.mapResourceTypeToService(resourceType, resourceName);
    const serviceType = this.mapResourceTypeToServiceType(resourceType);
    // Accumulate costs per service
  });
  
  // 3. Save hourly service costs (accumulate to daily total)
  for (const [serviceKey, data] of serviceCosts.entries()) {
    await this.saveServiceCost({
      serviceName,
      serviceType,
      date: new Date(now.toISOString().split('T')[0]), // Current date
      cost: data.cost, // Hourly increment
      // ... other fields
    });
  }
}
```

**Note:** Azure Cost Management API may have a delay (up to several hours) before recent usage data is available. The hourly collection will log warnings if no data is returned.

**Logging:**
```
Starting hourly cost metrics collection...
Processing 42 hourly cost records for subscription Prod
Saved hourly service cost for ca-ai-service: $0.8234
No cost data available for the past hour. Azure may not have processed recent usage yet.
Hourly cost metrics collection completed
```

---

### 3. Helper Methods

#### `mapCsvColumns()`
**Purpose:** Map CSV column names to indexes for efficient parsing

**Mapped Columns:**
- `date` / `usagedate`
- `resourceid`, `resourcename`, `resourcetype`, `resourcegroup`
- `metercategory`, `metersubcategory`, `metername`
- `quantity`, `unitofmeasure`, `unitprice`
- `cost` / `pretaxcost`, `currency`

---

#### `mapResourceTypeToService()`
**Purpose:** Map Azure resource types to service names

**Mappings:**
```typescript
// Container Apps (parse resource name for specific service)
Microsoft.App/containerApps:
  - ca-frontend (contains 'frontend')
  - ca-ai-service (contains 'ai-service')
  - ca-authentication (contains 'authentication')
  - ca-backend (contains 'backend')
  - ca-database (contains 'database')
  - container-apps (default)

// Databases
Microsoft.DBforPostgreSQL/flexibleServers → psql-finops-prod

// Cache
Microsoft.Cache/Redis → redis-finops-prod

// Networking
Microsoft.Network/applicationGateways → app-gateway
Microsoft.Network/virtualNetworks → vnet

// Storage
Microsoft.Storage/storageAccounts → storage

// Monitoring
Microsoft.OperationalInsights/workspaces → log-analytics
```

---

#### `mapResourceTypeToServiceType()`
**Purpose:** Map Azure resource types to ServiceType enum

**Enum Mappings:**
```typescript
containerapp → CONTAINER_APP
postgres → DATABASE
redis → CACHE
applicationgateway → LOAD_BALANCER
virtualnetwork → NETWORK
storage → STORAGE
loganalytics/monitor → MONITORING
(fallback) → OTHER
```

---

#### `saveServiceCost()`
**Purpose:** POST service cost data to database via cost tracking API

**Endpoint:** `POST http://localhost:3002/cost-tracking/service-costs`

**Payload:**
```json
{
  "serviceName": "ca-ai-service",
  "serviceType": "CONTAINER_APP",
  "date": "2025-11-02T00:00:00.000Z",
  "cost": 12.4567,
  "currency": "USD",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "resourceGroup": "rg-finops-prod",
  "region": "eastus",
  "billingPeriod": "2025-11"
}
```

---

#### `saveResourceCostBreakdown()`
**Purpose:** POST resource breakdown data to database via cost tracking API

**Endpoint:** `POST http://localhost:3002/cost-tracking/resource-cost-breakdowns`

**Payload:**
```json
{
  "date": "2025-11-02T00:00:00.000Z",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "resourceName": "ca-ai-service",
  "resourceGroup": "rg-finops-prod",
  "resourceType": "Microsoft.App/containerApps",
  "meterCategory": "Container Apps",
  "meterSubCategory": "Standard Plan",
  "meterName": "Compute Hours",
  "quantity": 24.0,
  "unitOfMeasure": "Hours",
  "unitPrice": 0.234,
  "cost": 5.616,
  "currency": "USD"
}
```

---

## Architecture Flow

### Daily Cost Collection (Midnight UTC)
```
┌─────────────────────────────────────────────────────────────────┐
│ @Cron('0 0 * * *') collectDailyCostSnapshots()                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ getCostData(subscriptionId, yesterday, today)                   │
│ → POST generateCostDetailsReport                                │
│ → Poll operation status (5s intervals, 60 max attempts)         │
│ → Download CSV from blob URL                                    │
│ → Parse CSV: {columns: [...], rows: [[...]]}                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ mapCsvColumns(columns)                                           │
│ → Find indexes: date, resourceId, resourceType, cost, etc.      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Process Each CSV Row (247 records)                              │
│ ├─ Extract: resourceType, resourceName, meterCategory, cost     │
│ ├─ mapResourceTypeToService() → "ca-ai-service"                 │
│ ├─ mapResourceTypeToServiceType() → "CONTAINER_APP"             │
│ ├─ Aggregate: serviceCosts Map                                  │
│ └─ Store: resourceBreakdowns Map (meter details)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Save Granular Data                                               │
│ ├─ POST /cost-tracking/service-costs (7 services)               │
│ ├─ POST /cost-tracking/resource-cost-breakdowns (top 50)        │
│ └─ POST /cost-snapshots (legacy, backward compatibility)        │
└─────────────────────────────────────────────────────────────────┘
```

### Hourly Cost Collection (Every Hour)
```
┌─────────────────────────────────────────────────────────────────┐
│ @Cron('0 * * * *') collectHourlyCostMetrics()                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ getCostData(subscriptionId, oneHourAgo, now)                    │
│ → Returns CSV with recent usage (may be empty due to Azure lag) │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Parse & Aggregate by Service                                     │
│ → Filter by resourceType                                         │
│ → Map to service names                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /cost-tracking/service-costs                               │
│ → Upsert with unique constraint (serviceName, date)             │
│ → Accumulates hourly costs throughout the day                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Integration

### ServiceCostRecord Table
```prisma
model ServiceCostRecord {
  id              String   @id @default(cuid())
  serviceName     String   // "ca-ai-service"
  serviceType     ServiceType // CONTAINER_APP
  date            DateTime @db.Date
  cost            Decimal  @db.Decimal(10, 4)
  currency        String   @default("USD")
  subscriptionId  String
  resourceGroup   String
  region          String
  billingPeriod   String   // "2025-11"
  
  @@unique([serviceName, date, subscriptionId])
  @@index([date])
  @@index([serviceName, billingPeriod])
}
```

**Daily Snapshot:**
- Overwrites existing record for (serviceName, date, subscriptionId)
- Stores complete day's cost after midnight processing

**Hourly Updates:**
- Upserts to same date record
- Accumulates costs throughout the day
- Final daily snapshot at midnight replaces with accurate total

---

### ResourceCostBreakdown Table
```prisma
model ResourceCostBreakdown {
  id                String   @id @default(cuid())
  date              DateTime @db.Date
  subscriptionId    String
  resourceName      String   // "ca-ai-service"
  resourceGroup     String
  resourceType      String   // "Microsoft.App/containerApps"
  meterCategory     String   // "Container Apps"
  meterSubCategory  String   // "Standard Plan"
  meterName         String   // "Compute Hours"
  quantity          Decimal  @db.Decimal(18, 6)
  unitOfMeasure     String   // "Hours"
  unitPrice         Decimal  @db.Decimal(18, 9)
  cost              Decimal  @db.Decimal(10, 4)
  currency          String   @default("USD")
  
  @@unique([date, subscriptionId, resourceName, meterName])
  @@index([date])
  @@index([resourceName, date])
}
```

**Storage Strategy:**
- Top 50 resources by cost per day (to prevent database bloat)
- Meter-level detail (e.g., "Compute Hours", "Memory GB-Hours", "Storage GB")
- Unique constraint on (date, subscriptionId, resourceName, meterName)

---

## Service Name Mapping Logic

### Container Apps (5 Services)
```typescript
// Resource name pattern matching:
if (resourceName.includes('frontend') || resourceName.includes('ca-frontend')) {
  return 'ca-frontend';
}
if (resourceName.includes('ai-service') || resourceName.includes('ca-ai')) {
  return 'ca-ai-service';
}
if (resourceName.includes('authentication') || resourceName.includes('ca-auth')) {
  return 'ca-authentication';
}
if (resourceName.includes('backend') || resourceName.includes('ca-backend')) {
  return 'ca-backend';
}
if (resourceName.includes('database') || resourceName.includes('ca-database')) {
  return 'ca-database';
}
```

**Expected Azure Resource Names:**
- `ca-frontend-xxxxx`
- `ca-ai-service-xxxxx`
- `ca-authentication-xxxxx`
- `ca-backend-xxxxx`
- `ca-database-xxxxx`

### Other Resources (Named Services)
```typescript
// Direct resource type mapping:
Microsoft.DBforPostgreSQL/flexibleServers → 'psql-finops-prod'
Microsoft.Cache/Redis → 'redis-finops-prod'
Microsoft.Network/applicationGateways → 'app-gateway'
Microsoft.Network/virtualNetworks → 'vnet'
Microsoft.Storage/storageAccounts → 'storage'
Microsoft.OperationalInsights/workspaces → 'log-analytics'
```

---

## Testing

### Manual Test: Daily Collection
```bash
# Trigger daily cost snapshot (requires Azure credentials)
curl -X POST http://localhost:3003/azure/test-daily-snapshot

# Check logs
tail -f logs/backend.log | grep "daily cost snapshot"

# Verify database records
curl http://localhost:3002/cost-tracking/service-costs?date=2025-11-02
curl http://localhost:3002/cost-tracking/resource-cost-breakdowns?date=2025-11-02
```

**Expected Output:**
```
Starting daily cost snapshot collection with granular tracking...
Collecting cost snapshots for 1 users
Generating cost details report for subscription xxx-xxx-xxx...
Cost report generation started. Operation ID: abc123
Poll attempt 1: Status = InProgress
Poll attempt 2: Status = InProgress
Poll attempt 3: Status = Completed
Cost report ready. Download URL obtained.
Downloading cost details CSV from https://...
Parsed 247 cost records from CSV
Processing 247 cost detail records
Saved service cost for ca-frontend (CONTAINER_APP): $8.2341
Saved service cost for ca-ai-service (CONTAINER_APP): $12.4567
Saved service cost for psql-finops-prod (DATABASE): $45.6789
Saved resource breakdown for ca-ai-service: Compute Hours = $5.2341
Saved resource breakdown for ca-ai-service: Memory GB-Hours = $3.1234
...
Saved cost snapshot for user admin, subscription Prod: $127.89 (7 services, 50 resource breakdowns)
Daily cost snapshot collection completed
```

---

### Manual Test: Hourly Collection
```bash
# Trigger hourly cost metrics (requires Azure credentials)
curl -X POST http://localhost:3003/azure/test-hourly-metrics

# Check logs
tail -f logs/backend.log | grep "hourly cost metrics"

# Note: May return no data if Azure hasn't processed recent usage yet
```

**Expected Output (with data):**
```
Starting hourly cost metrics collection...
Generating cost details report for subscription xxx-xxx-xxx...
Parsed 42 cost records from CSV
Processing 42 hourly cost records for subscription Prod
Saved hourly service cost for ca-ai-service: $0.8234
Saved hourly service cost for ca-frontend: $0.5123
Hourly cost metrics collection completed
```

**Expected Output (no data - Azure delay):**
```
Starting hourly cost metrics collection...
Generating cost details report for subscription xxx-xxx-xxx...
Parsed 0 cost records from CSV
No cost data available for the past hour. Azure may not have processed recent usage yet.
Hourly cost metrics collection completed
```

---

### Automated Cron Schedule
```typescript
// Daily at midnight UTC
@Cron('0 0 * * *', { name: 'daily-cost-snapshot', timeZone: 'UTC' })

// Every hour
@Cron('0 * * * *', { name: 'hourly-cost-metrics', timeZone: 'UTC' })
```

---

## API Integration

### Cost Tracking Endpoints Used

#### 1. Service Costs
```bash
# Save service cost
POST http://localhost:3002/cost-tracking/service-costs
Content-Type: application/json

{
  "serviceName": "ca-ai-service",
  "serviceType": "CONTAINER_APP",
  "date": "2025-11-02T00:00:00.000Z",
  "cost": 12.4567,
  "currency": "USD",
  "subscriptionId": "xxx-xxx-xxx",
  "resourceGroup": "rg-finops-prod",
  "region": "eastus",
  "billingPeriod": "2025-11"
}

# Query service costs
GET http://localhost:3002/cost-tracking/service-costs?date=2025-11-02&serviceName=ca-ai-service

# Get service cost trends
GET http://localhost:3002/cost-tracking/service-costs/trends?serviceName=ca-ai-service&startDate=2025-11-01&endDate=2025-11-07

# Get service cost summary
GET http://localhost:3002/cost-tracking/service-costs/summary?billingPeriod=2025-11
```

---

#### 2. Resource Cost Breakdowns
```bash
# Save resource breakdown
POST http://localhost:3002/cost-tracking/resource-cost-breakdowns
Content-Type: application/json

{
  "date": "2025-11-02T00:00:00.000Z",
  "subscriptionId": "xxx-xxx-xxx",
  "resourceName": "ca-ai-service",
  "resourceGroup": "rg-finops-prod",
  "resourceType": "Microsoft.App/containerApps",
  "meterCategory": "Container Apps",
  "meterSubCategory": "Standard Plan",
  "meterName": "Compute Hours",
  "quantity": 24.0,
  "unitOfMeasure": "Hours",
  "unitPrice": 0.234,
  "cost": 5.616,
  "currency": "USD"
}

# Query resource breakdowns
GET http://localhost:3002/cost-tracking/resource-cost-breakdowns?date=2025-11-02&resourceName=ca-ai-service

# Get top cost resources
GET http://localhost:3002/cost-tracking/resource-cost-breakdowns/top?startDate=2025-11-01&endDate=2025-11-07&limit=20
```

---

## Edge Cases & Error Handling

### 1. CSV Column Mapping Failure
```typescript
// If column not found in CSV, uses default index or skips field
const colIndexes = this.mapCsvColumns(columns);
const cost = parseFloat(row[colIndexes.cost]) || 0; // Defaults to 0 if missing
```

### 2. Resource Name Parsing Ambiguity
```typescript
// Falls back to generic names if pattern doesn't match
if (type.includes('containerapp')) {
  if (name.includes('frontend')) return 'ca-frontend';
  // ...
  return 'container-apps'; // Fallback for unmatched Container Apps
}
```

### 3. API Request Failures
```typescript
try {
  await this.saveServiceCost({ ... });
} catch (error: any) {
  this.logger.error(`Failed to save service cost for ${serviceName}: ${error.message}`);
  // Continues processing other services (doesn't throw)
}
```

### 4. Empty CSV Response
```typescript
const rows = costResult.rows || [];
if (rows.length === 0) {
  this.logger.warn(`No cost data available for the past hour. Azure may not have processed recent usage yet.`);
  continue; // Skip to next subscription
}
```

### 5. Azure API Latency (Hourly Collection)
- Azure Cost Management API has 4-8 hour data delay
- Hourly collection will often return empty results
- Daily midnight collection is more reliable (processes previous day's complete data)

---

## Performance Considerations

### 1. Database Writes
**Daily Collection:**
- 7 service cost writes per subscription
- 50 resource breakdown writes per subscription
- 1 legacy cost snapshot write per user per subscription

**Optimization:**
- Uses upsert with unique constraints (prevents duplicates)
- Batch processing with error isolation (one failure doesn't stop others)
- Limits resource breakdowns to top 50 by cost

### 2. CSV Parsing
**Typical Payload:**
- 247 rows × 16 columns = ~4,000 data points per day
- Column mapping runs once (O(n) where n = columns)
- Row parsing is O(m) where m = rows

**Memory Usage:**
- CSV stored in string variable (~50-100 KB)
- Parsed into arrays (~200-300 KB)
- Maps for aggregation (~50 KB)
- Total: < 1 MB per subscription

### 3. HTTP Requests
**Daily Collection (1 user, 1 subscription):**
- 1 GET /users
- 1 Azure SDK getSubscriptions()
- 1 Azure Cost Details API (POST + polls + CSV download)
- ~7 POST /service-costs
- ~50 POST /resource-cost-breakdowns
- 1 POST /cost-snapshots
- **Total: ~60 HTTP requests**

**Timeout:** 5 seconds per POST request (prevents hanging)

---

## Monitoring & Observability

### Log Levels

#### Debug
```
Saved service cost for ca-frontend (CONTAINER_APP): $8.2341
Saved resource breakdown for ca-ai-service: Compute Hours = $5.2341
```

#### Info
```
Starting daily cost snapshot collection with granular tracking...
Processing 247 cost detail records
Saved cost snapshot for user admin, subscription Prod: $127.89 (7 services, 50 resource breakdowns)
Daily cost snapshot collection completed
```

#### Warning
```
Failed to parse cost row: Invalid cost value
No cost data available for the past hour. Azure may not have processed recent usage yet.
```

#### Error
```
Failed to save service cost for ca-ai-service: Request timeout
Failed to collect cost snapshot for user admin, subscription xxx: API rate limit exceeded
```

---

### Metrics to Monitor

1. **Execution Time**
   - Daily collection: Expected 2-5 minutes (depends on poll time)
   - Hourly collection: Expected 30-60 seconds

2. **Record Counts**
   - CSV rows parsed: 100-500 per day
   - Service costs saved: 5-10 per subscription
   - Resource breakdowns saved: 50 per subscription

3. **Error Rates**
   - CSV parsing errors: < 1%
   - Database write failures: < 0.1%
   - Azure API failures: < 5%

4. **Data Freshness**
   - Daily snapshots: T-1 day (yesterday's data)
   - Hourly metrics: T-4 to T-8 hours (due to Azure delay)

---

## Backward Compatibility

### Legacy CostSnapshot Preserved
```typescript
// Still saves to CostSnapshot table for existing dashboards
await this.saveCostSnapshot({
  userId: user.id,
  subscriptionId: subscription.subscriptionId,
  date: yesterday,
  totalCost,
  serviceBreakdown,
  topResources,
});
```

**Reason:** Existing AI chat context and dashboards may rely on CostSnapshot table

---

### Migration Path
1. **Phase 1 (Current):** Both old and new tables populated
2. **Phase 2:** Update AI chat prompts to query ServiceCostRecord instead
3. **Phase 3:** Update frontend dashboards to use new tables
4. **Phase 4:** Remove CostSnapshot collection (optional)

---

## Future Enhancements

### 1. Tag-Based Service Identification
```typescript
// Instead of parsing resource names, use Azure resource tags
const tags = await this.azureService.getResourceTags(resourceId);
const serviceName = tags['service'] || 'unknown';
```

**Benefit:** More reliable than name pattern matching

---

### 2. Budget Alerts
```typescript
// Check if service cost exceeds threshold
if (data.cost > serviceBudget.limit) {
  await this.notificationService.sendBudgetAlert({
    serviceName: data.serviceName,
    cost: data.cost,
    limit: serviceBudget.limit,
  });
}
```

---

### 3. Cost Forecasting
```typescript
// Use historical trends to predict next month
const forecast = await this.costTrackingService.forecastServiceCost(
  'ca-ai-service',
  '2025-12'
);
```

---

### 4. Multi-Subscription Aggregation
```typescript
// Sum costs across all subscriptions
const totalCost = await this.costTrackingService.getMultiSubscriptionCost([
  'sub-1',
  'sub-2',
  'sub-3',
]);
```

---

## Complete Implementation Checklist

- [x] Parse CSV columns and map to indexes
- [x] Extract resource details from CSV rows
- [x] Map Azure resource types to service names
- [x] Map Azure resource types to ServiceType enum
- [x] Aggregate costs by service
- [x] Store meter-level resource breakdowns
- [x] Save to ServiceCostRecord table via POST API
- [x] Save to ResourceCostBreakdown table via POST API
- [x] Maintain backward compatibility with CostSnapshot
- [x] Add hourly cost collection method
- [x] Implement error handling and logging
- [x] Handle Azure API data delay gracefully
- [x] Optimize database writes (top 50 resources only)
- [x] Add debug logging for troubleshooting
- [x] Document CSV structure and mappings

---

## Testing Commands

### Start All Services
```bash
# From root directory
./start-services.sh
```

### Manually Trigger Collection (requires adding test endpoints to backend controller)
```typescript
// backend/src/azure/azure.controller.ts
@Post('test-daily-snapshot')
async testDailySnapshot() {
  await this.azureSchedulerService.collectDailyCostSnapshots();
  return { message: 'Daily snapshot triggered' };
}

@Post('test-hourly-metrics')
async testHourlyMetrics() {
  await this.azureSchedulerService.collectHourlyCostMetrics();
  return { message: 'Hourly metrics triggered' };
}
```

### Query Results
```bash
# Get all service costs for a specific date
curl http://localhost:3002/cost-tracking/service-costs?date=2025-11-02

# Get service cost trends
curl "http://localhost:3002/cost-tracking/service-costs/trends?serviceName=ca-ai-service&startDate=2025-11-01&endDate=2025-11-07"

# Get top cost resources
curl "http://localhost:3002/cost-tracking/resource-cost-breakdowns/top?startDate=2025-11-01&endDate=2025-11-07&limit=20"

# Get service cost summary for billing period
curl "http://localhost:3002/cost-tracking/service-costs/summary?billingPeriod=2025-11"
```

---

## Summary

Task 6 successfully implements granular cost tracking by:

1. **Parsing CSV cost details** from Azure Cost Management API with meter-level precision
2. **Identifying services** by mapping Azure resource types and names to 7 core services
3. **Aggregating costs** per service with subscription, resource group, and region context
4. **Storing meter breakdowns** (top 50 by cost) for detailed analysis
5. **Daily collection** at midnight UTC for complete previous day data
6. **Hourly collection** for near real-time monitoring (with Azure data delay handling)
7. **Backward compatibility** with existing CostSnapshot table
8. **Comprehensive logging** for debugging and monitoring

The full cost tracking pipeline is now complete:
```
Azure Cost Management API → Modern CSV API → Parser → Granular Tracking → Database → AI Chat Insights
```

All 6 tasks are now ✅ **COMPLETED**.
