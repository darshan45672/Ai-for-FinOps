# Azure Integration - Database Service API

This document describes the database service API endpoints for storing and retrieving Azure cloud resource data.

## Base URL
```
http://localhost:3002
```

## API Endpoints

### Subscriptions

#### POST /azure/subscriptions
Create or update Azure subscriptions

**Request Body:**
```json
{
  "subscriptions": [
    {
      "subscriptionId": "azure-subscription-id",
      "displayName": "Subscription Name",
      "tenantId": "tenant-id",
      "state": "Enabled"
    }
  ]
}
```

**Response:**
```json
{
  "count": 1,
  "subscriptions": [
    {
      "id": "cuid",
      "subscriptionId": "azure-subscription-id",
      "displayName": "Subscription Name",
      "tenantId": "tenant-id",
      "state": "Enabled",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /azure/subscriptions
Get all subscriptions

#### GET /azure/subscriptions/:subscriptionId
Get subscription by ID with related resources and costs

---

### Resources

#### POST /azure/resources
Create or update Azure resources

**Request Body:**
```json
{
  "resources": [
    {
      "resourceId": "/subscriptions/.../resourceGroups/.../providers/.../...",
      "name": "my-vm",
      "type": "VIRTUAL_MACHINE",
      "resourceType": "Microsoft.Compute/virtualMachines",
      "location": "eastus",
      "resourceGroup": "my-rg",
      "subscriptionId": "subscription-id",
      "status": "RUNNING",
      "sku": "Standard_B2s",
      "tags": {
        "environment": "production",
        "owner": "team-name"
      },
      "properties": {
        "vmSize": "Standard_B2s",
        "osType": "Linux"
      }
    }
  ]
}
```

**Resource Types (enum):**
- `VIRTUAL_MACHINE`
- `STORAGE_ACCOUNT`
- `SQL_DATABASE`
- `APP_SERVICE`
- `FUNCTION_APP`
- `KUBERNETES_SERVICE`
- `COSMOS_DB`
- `KEY_VAULT`
- `OTHER`

**Resource Status (enum):**
- `RUNNING`
- `STOPPED`
- `DEALLOCATED`
- `FAILED`
- `UNKNOWN`

#### GET /azure/resources
Get all resources with optional filters

**Query Parameters:**
- `subscriptionId` - Filter by subscription
- `resourceGroup` - Filter by resource group
- `type` - Filter by resource type (enum)
- `location` - Filter by location
- `status` - Filter by status (enum)

#### GET /azure/resources/:resourceId
Get resource by ID with subscription details

---

### Cost Records

#### POST /azure/costs
Create cost records

**Request Body:**
```json
{
  "costRecords": [
    {
      "subscriptionId": "subscription-id",
      "resourceGroup": "my-rg",
      "resourceId": "resource-id-optional",
      "serviceName": "Virtual Machines",
      "cost": 125.50,
      "currency": "USD",
      "usageStart": "2024-01-01T00:00:00.000Z",
      "usageEnd": "2024-01-02T00:00:00.000Z",
      "meterCategory": "Compute",
      "quantity": 24,
      "unitOfMeasure": "Hours"
    }
  ]
}
```

#### GET /azure/costs
Get cost records with optional filters

**Query Parameters:**
- `subscriptionId` - Filter by subscription
- `resourceGroup` - Filter by resource group
- `startDate` - Filter by usage start date (ISO 8601)
- `endDate` - Filter by usage end date (ISO 8601)

#### GET /azure/costs/summary
Get cost summary with top services and resource groups

**Query Parameters:**
- `subscriptionId` - Optional: Filter by subscription

**Response:**
```json
{
  "totalCost": 5432.10,
  "costByService": [
    {
      "serviceName": "Virtual Machines",
      "_sum": {
        "cost": 2500.00
      }
    }
  ],
  "costByResourceGroup": [
    {
      "resourceGroup": "production-rg",
      "_sum": {
        "cost": 3000.00
      }
    }
  ]
}
```

---

### Sync Logs

#### POST /azure/sync-logs
Create a sync log entry

**Request Body:**
```json
{
  "syncType": "resources",
  "status": "in_progress"
}
```

**Sync Types:**
- `resources` - Resource synchronization
- `costs` - Cost data synchronization

**Sync Status:**
- `in_progress` - Sync is running
- `success` - Sync completed successfully
- `failed` - Sync failed

**Response:**
```json
{
  "id": "cuid",
  "syncType": "resources",
  "status": "in_progress",
  "startedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": null,
  "recordsSync": null,
  "errorMessage": null
}
```

#### PATCH /azure/sync-logs/:id
Update a sync log entry

**Request Body:**
```json
{
  "status": "success",
  "recordsSync": 150,
  "completedAt": "2024-01-01T00:05:00.000Z"
}
```

#### GET /azure/sync-logs
Get sync logs with optional filters

**Query Parameters:**
- `syncType` - Filter by sync type
- `status` - Filter by status
- `limit` - Limit number of results (default: 50)

#### GET /azure/sync-logs/latest/:syncType
Get the latest sync log for a specific type

---

### Statistics

#### GET /azure/statistics
Get comprehensive Azure statistics

**Response:**
```json
{
  "subscriptionCount": 3,
  "resourceCount": 450,
  "totalCost": 12500.00,
  "latestResourceSync": {
    "id": "cuid",
    "syncType": "resources",
    "status": "success",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:05:00.000Z",
    "recordsSync": 450
  },
  "latestCostSync": {
    "id": "cuid",
    "syncType": "costs",
    "status": "success",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:02:00.000Z",
    "recordsSync": 1200
  },
  "resourcesByType": [
    {
      "type": "VIRTUAL_MACHINE",
      "_count": {
        "type": 120
      }
    }
  ],
  "resourcesByLocation": [
    {
      "location": "eastus",
      "_count": {
        "location": 200
      }
    }
  ]
}
```

## Data Models

### AzureSubscription
```typescript
{
  id: string;              // Internal ID
  subscriptionId: string;  // Azure subscription ID (unique)
  displayName: string;     // Subscription name
  tenantId: string;        // Azure AD tenant ID
  state: string;           // Subscription state (e.g., "Enabled")
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### AzureResource
```typescript
{
  id: string;              // Internal ID
  resourceId: string;      // Azure resource ID (unique)
  name: string;            // Resource name
  type: AzureResourceType; // Enum type
  resourceType: string;    // Full Azure resource type
  location: string;        // Azure region
  resourceGroup: string;   // Resource group name
  subscriptionId: string;  // Parent subscription
  status: AzureResourceStatus; // Resource status
  sku: string | null;      // SKU/pricing tier
  tags: JSON | null;       // Resource tags
  properties: JSON | null; // Additional properties
  createdAt: DateTime;
  updatedAt: DateTime;
  lastSyncedAt: DateTime;
}
```

### AzureCostRecord
```typescript
{
  id: string;              // Internal ID
  subscriptionId: string;  // Parent subscription
  resourceGroup: string | null;
  resourceId: string | null;
  serviceName: string;     // Azure service name
  meterCategory: string | null;
  usageStart: DateTime;    // Usage period start
  usageEnd: DateTime;      // Usage period end
  cost: number;            // Cost amount
  currency: string;        // Currency code (default: "USD")
  quantity: number | null; // Usage quantity
  unitOfMeasure: string | null;
  createdAt: DateTime;
}
```

### AzureSyncLog
```typescript
{
  id: string;              // Internal ID
  syncType: string;        // "resources" or "costs"
  status: string;          // Sync status
  startedAt: DateTime;
  completedAt: DateTime | null;
  recordsSync: number | null;  // Number of records synced
  errorMessage: string | null;
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Usage Example

### Syncing Resources (called by backend scheduler)

```typescript
// 1. Create sync log
const syncLog = await fetch('http://localhost:3002/azure/sync-logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    syncType: 'resources',
    status: 'in_progress'
  })
});
const { id: syncLogId } = await syncLog.json();

// 2. Save subscriptions
await fetch('http://localhost:3002/azure/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptions: [...]
  })
});

// 3. Save resources
await fetch('http://localhost:3002/azure/resources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resources: [...]
  })
});

// 4. Update sync log
await fetch(`http://localhost:3002/azure/sync-logs/${syncLogId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'success',
    recordsSync: 150,
    completedAt: new Date()
  })
});
```

## Development

### Start the Database Service
```bash
cd database
npm run start:dev
```

The service will be available at `http://localhost:3002`

### Environment Variables
```env
DATABASE_URL="postgresql://..."
PORT=3002
```
