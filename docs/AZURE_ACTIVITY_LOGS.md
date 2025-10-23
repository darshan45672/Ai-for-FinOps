# Azure Activity Logs Integration

## Overview

This document describes the Azure Activity Logs integration in the FinOps platform. Activity logs provide audit trail and operational monitoring for all Azure resources.

## What Are Azure Activity Logs?

Azure Activity Logs capture all operations performed on resources in your Azure subscription. They answer questions like:
- **Who** performed an action?
- **What** action was performed?
- **When** did it happen?
- **Where** (which resource) was affected?
- **Why** (what was the result)?

## Features Implemented

### 1. Automated Data Collection

**Cron Schedule**: Every 6 hours (`0 */6 * * *`)
- Fetches activity logs from the last 6 hours
- Runs for all accessible subscriptions
- Stores data in PostgreSQL database

### 2. Data Captured

Each activity log entry includes:

| Field | Description |
|-------|-------------|
| `subscriptionId` | Azure subscription identifier |
| `eventTimestamp` | When the event occurred |
| `eventDataId` | Unique event identifier |
| `correlationId` | Groups related operations |
| `operationName` | Azure operation performed |
| `level` | Event severity (Informational, Warning, Error, Critical) |
| `status` | Operation status (Started, Succeeded, Failed) |
| `caller` | User or service principal who triggered the operation |
| `category` | Event category (Administrative, Security, ServiceHealth, etc.) |
| `resourceId` | Affected resource ID |
| `resourceGroupName` | Resource group name |
| `resourceType` | Type of resource affected |
| `description` | Human-readable description |
| `httpRequest` | HTTP request details (if applicable) |
| `authorization` | Authorization information |
| `claims` | Token claims |
| `properties` | Additional event properties |

### 3. API Endpoints

#### Database Service (Port 3002)

##### Create Activity Logs
```bash
POST /azure/activity-logs
Content-Type: application/json

{
  "activityLogs": [
    {
      "subscriptionId": "xxx",
      "eventTimestamp": "2025-10-23T12:00:00Z",
      "eventDataId": "unique-id",
      "operationName": "Microsoft.Compute/virtualMachines/write",
      "level": "Informational",
      "caller": "user@example.com",
      "category": "Administrative",
      ...
    }
  ]
}
```

##### Get Activity Logs (with filters)
```bash
GET /azure/activity-logs?subscriptionId=xxx&category=Administrative&limit=100
```

**Query Parameters:**
- `subscriptionId` - Filter by subscription
- `category` - Filter by category (Administrative, Security, etc.)
- `level` - Filter by severity level
- `caller` - Filter by who performed the action
- `resourceGroupName` - Filter by resource group
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)
- `limit` - Maximum number of results (default: 100)

##### Get Activity Log by ID
```bash
GET /azure/activity-logs/:id
```

##### Search by Operation Name
```bash
GET /azure/activity-logs/operation/:operationName?limit=50
```

Example:
```bash
GET /azure/activity-logs/operation/Microsoft.Compute?limit=50
```

##### Get Statistics
```bash
GET /azure/activity-logs-statistics?subscriptionId=xxx
```

Returns:
```json
{
  "totalLogs": 1250,
  "logsByCategory": [
    { "category": "Administrative", "_count": 800 },
    { "category": "Security", "_count": 300 }
  ],
  "logsByLevel": [
    { "level": "Informational", "_count": 1000 },
    { "level": "Warning", "_count": 200 }
  ],
  "topCallers": [
    { "caller": "user@example.com", "_count": 150 }
  ]
}
```

#### Backend Service (Port 3003)

##### Manual Sync Trigger
```bash
POST /azure/sync/activity-logs
```

Returns:
```json
{
  "message": "Azure activity logs sync triggered"
}
```

## Database Schema

### AzureActivityLog Table

```prisma
model AzureActivityLog {
  id                 String   @id @default(cuid())
  subscriptionId     String
  eventTimestamp     DateTime
  eventDataId        String   @unique
  correlationId      String?
  operationName      String
  operationId        String?
  level              String
  status             String?
  subStatus          String?
  caller             String?
  category           String
  resourceId         String?
  resourceGroupName  String?
  resourceType       String?
  resourceProviderName String?
  eventName          String?
  description        String?
  httpRequest        Json?
  authorization      Json?
  claims             Json?
  properties         Json?
  createdAt          DateTime @default(now())
  
  @@index([subscriptionId])
  @@index([eventTimestamp])
  @@index([operationName])
  @@index([category])
  @@index([level])
  @@index([caller])
  @@index([resourceGroupName])
}
```

## Usage Examples

### Monitor Administrative Changes
```bash
# Get all administrative operations in the last 24 hours
curl "http://localhost:3002/azure/activity-logs?category=Administrative&startDate=2025-10-22T00:00:00Z&limit=100"
```

### Track Security Events
```bash
# Get all security-related logs
curl "http://localhost:3002/azure/activity-logs?category=Security&level=Warning"
```

### Audit User Actions
```bash
# See what a specific user did
curl "http://localhost:3002/azure/activity-logs?caller=user@example.com&limit=50"
```

### Monitor Resource Group Changes
```bash
# Track changes to a specific resource group
curl "http://localhost:3002/azure/activity-logs?resourceGroupName=my-resource-group"
```

### Search for Specific Operations
```bash
# Find all VM-related operations
curl "http://localhost:3002/azure/activity-logs/operation/Microsoft.Compute/virtualMachines"
```

## Automated Syncing

### Sync Schedule

| Sync Type | Frequency | Cron Expression | Description |
|-----------|-----------|-----------------|-------------|
| Resources | Hourly | `0 * * * *` | Fetches all resources |
| Costs | Daily | `0 0 * * *` | Fetches cost data (last 30 days) |
| Activity Logs | Every 6 hours | `0 */6 * * *` | Fetches activity logs (last 6 hours) |

### Manual Sync

You can manually trigger syncs at any time:

```bash
# Trigger resource sync
curl -X POST http://localhost:3003/azure/sync/resources

# Trigger cost sync
curl -X POST http://localhost:3003/azure/sync/costs

# Trigger activity logs sync
curl -X POST http://localhost:3003/azure/sync/activity-logs
```

### Monitoring Syncs

Check sync status and history:

```bash
# Get all sync logs
curl "http://localhost:3002/azure/sync-logs"

# Get latest activity logs sync
curl "http://localhost:3002/azure/sync-logs/latest/activity_logs"

# Filter by status
curl "http://localhost:3002/azure/sync-logs?syncType=activity_logs&status=success&limit=10"
```

## Common Activity Log Categories

| Category | Description | Use Cases |
|----------|-------------|-----------|
| `Administrative` | Resource management operations | Track VM creation, deletion, updates |
| `Security` | Security-related events | Monitor access changes, policy updates |
| `ServiceHealth` | Azure service health notifications | Track service disruptions |
| `Alert` | Alert fired events | Monitor alert triggers |
| `Recommendation` | Azure Advisor recommendations | Optimization suggestions |
| `Policy` | Azure Policy events | Compliance monitoring |
| `Autoscale` | Autoscale operations | Track scaling events |

## Common Operation Names

```
Microsoft.Compute/virtualMachines/write       - Create/Update VM
Microsoft.Compute/virtualMachines/delete      - Delete VM
Microsoft.Compute/virtualMachines/start/action - Start VM
Microsoft.Compute/virtualMachines/powerOff/action - Stop VM
Microsoft.Storage/storageAccounts/write       - Create/Update Storage
Microsoft.Network/networkSecurityGroups/write - Update NSG rules
Microsoft.Authorization/roleAssignments/write - Change permissions
```

## Event Levels

| Level | Description | When to Monitor |
|-------|-------------|-----------------|
| `Informational` | Normal operations | General tracking |
| `Warning` | Potential issues | Proactive monitoring |
| `Error` | Failed operations | Immediate attention |
| `Critical` | Critical failures | Urgent response required |

## Performance Considerations

### Indexing
The following fields are indexed for fast queries:
- `subscriptionId`
- `eventTimestamp`
- `operationName`
- `category`
- `level`
- `caller`
- `resourceGroupName`

### Data Retention
- Activity logs are stored indefinitely by default
- Consider implementing a data retention policy for large deployments
- Azure keeps activity logs for 90 days; this integration extends that retention

### Query Optimization
- Always use date filters for better performance
- Use `limit` parameter to control result size
- Filter by subscription and category when possible

## Troubleshooting

### No Logs Appearing

1. **Check Azure Credentials**
   ```bash
   curl http://localhost:3003/azure/status
   ```

2. **Verify Sync Status**
   ```bash
   curl "http://localhost:3002/azure/sync-logs?syncType=activity_logs&limit=5"
   ```

3. **Check Permissions**
   - Service Principal needs `Reader` role
   - Verify access to `Microsoft.Insights/eventtypes` API

4. **Manual Trigger**
   ```bash
   curl -X POST http://localhost:3003/azure/sync/activity-logs
   ```

### Common Errors

**Error: "Failed to fetch activity logs"**
- Check network connectivity to Azure
- Verify Service Principal credentials
- Ensure subscription is not expired

**Error: "Duplicate eventDataId"**
- This is normal; the system uses upsert to handle duplicates
- Same events may be fetched in overlapping time windows

## Security Considerations

### Sensitive Data
Activity logs may contain:
- User identities (caller field)
- IP addresses (in httpRequest)
- Token claims

### Access Control
- Implement authentication on API endpoints
- Use role-based access control (RBAC)
- Log access to activity logs for audit

### Data Privacy
- Consider data residency requirements
- Implement data masking for sensitive fields if needed
- Follow your organization's data retention policies

## Integration with Existing Features

### Resources
- Link activity logs to resources via `resourceId`
- Track resource lifecycle events

### Costs
- Correlate cost changes with administrative operations
- Identify who is creating expensive resources

### Subscriptions
- Monitor subscription-level operations
- Track multi-subscription activities via `correlationId`

## Future Enhancements

Potential improvements:
1. **Real-time Alerts** - Webhook integration for critical events
2. **Anomaly Detection** - ML-based unusual activity detection
3. **Compliance Reports** - Pre-built compliance report templates
4. **Resource Timeline** - Visual timeline of resource changes
5. **Cost Attribution** - Link operations to cost impacts

## References

- [Azure Activity Log Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/activity-log)
- [Azure Monitor REST API](https://learn.microsoft.com/en-us/rest/api/monitor/)
- [Activity Log Event Schema](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/activity-log-schema)
