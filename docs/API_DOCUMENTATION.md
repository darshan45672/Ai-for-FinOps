# API Documentation - AI for FinOps

## Overview

Complete REST API reference for all microservices in the AI for FinOps platform. This document covers endpoints, request/response formats, authentication, and error codes.

---

## Table of Contents

1. [Authentication Service (Port 3001)](#authentication-service-port-3001)
2. [Database Service (Port 3002)](#database-service-port-3002)
3. [Backend Service (Port 3003)](#backend-service-port-3003)
4. [AI Service (Port 3004)](#ai-service-port-3004)
5. [Common Error Codes](#common-error-codes)
6. [Authentication](#authentication)

---

## Authentication Service (Port 3001)

Base URL: `http://localhost:3001`

### Authentication Endpoints

#### POST /auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "cm123abc456",
  "email": "user@example.com",
  "fullName": "John Doe",
  "createdAt": "2025-11-01T10:30:00.000Z"
}
```

**Errors:**
- `400` - Invalid email format
- `409` - Email already exists

---

#### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm123abc456",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

#### GET /auth/github

Initiate GitHub OAuth flow.

**Response:**
Redirects to GitHub OAuth consent page.

---

#### GET /auth/github/callback

GitHub OAuth callback endpoint.

**Query Parameters:**
- `code` - Authorization code from GitHub

**Response:**
Redirects to frontend with JWT token in URL.

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

#### POST /auth/logout

Logout user (invalidate tokens).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Database Service (Port 3002)

Base URL: `http://localhost:3002`

### User Endpoints

#### GET /users

Get all users.

**Response (200):**
```json
[
  {
    "id": "cm123abc456",
    "email": "user@example.com",
    "fullName": "John Doe",
    "createdAt": "2025-11-01T10:30:00.000Z"
  }
]
```

---

#### GET /users/:id

Get user by ID.

**Response (200):**
```json
{
  "id": "cm123abc456",
  "email": "user@example.com",
  "fullName": "John Doe",
  "azureSubscriptionId": "sub-123",
  "azureTenantId": "tenant-456",
  "createdAt": "2025-11-01T10:30:00.000Z"
}
```

**Errors:**
- `404` - User not found

---

#### PUT /users/:id

Update user profile.

**Request:**
```json
{
  "fullName": "John Smith",
  "azureSubscriptionId": "new-sub-id"
}
```

**Response (200):**
```json
{
  "id": "cm123abc456",
  "email": "user@example.com",
  "fullName": "John Smith",
  "azureSubscriptionId": "new-sub-id"
}
```

---

### Chat Endpoints

#### POST /chat/conversations

Create a new conversation.

**Request:**
```json
{
  "userId": "cm123abc456",
  "title": "Azure Cost Analysis"
}
```

**Response (201):**
```json
{
  "id": "conv-789xyz",
  "userId": "cm123abc456",
  "title": "Azure Cost Analysis",
  "contextSnapshot": {},
  "createdAt": "2025-11-01T11:00:00.000Z"
}
```

---

#### GET /chat/conversations/:id

Get conversation by ID.

**Response (200):**
```json
{
  "id": "conv-789xyz",
  "userId": "cm123abc456",
  "title": "Azure Cost Analysis",
  "contextSnapshot": {
    "userContext": { /* ... */ },
    "azureContext": { /* ... */ }
  },
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "What are my Azure costs?",
      "timestamp": "2025-11-01T11:01:00.000Z"
    }
  ],
  "createdAt": "2025-11-01T11:00:00.000Z"
}
```

**Errors:**
- `404` - Conversation not found

---

#### POST /chat/messages

Save a message to conversation.

**Request:**
```json
{
  "conversationId": "conv-789xyz",
  "role": "user",
  "content": "List all resource groups"
}
```

**Response (201):**
```json
{
  "id": "msg-002",
  "conversationId": "conv-789xyz",
  "role": "user",
  "content": "List all resource groups",
  "timestamp": "2025-11-01T11:02:00.000Z"
}
```

---

#### GET /chat/conversations/user/:userId

Get all conversations for a user.

**Query Parameters:**
- `limit` (optional) - Number of conversations to return (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response (200):**
```json
[
  {
    "id": "conv-789xyz",
    "title": "Azure Cost Analysis",
    "createdAt": "2025-11-01T11:00:00.000Z",
    "messageCount": 12
  }
]
```

---

### Azure Resource Endpoints

#### GET /azure/resources

Get all Azure resources.

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `subscriptionId` (optional) - Filter by subscription

**Response (200):**
```json
[
  {
    "id": "res-001",
    "name": "myvm-prod-01",
    "type": "Microsoft.Compute/virtualMachines",
    "location": "eastus",
    "subscriptionId": "sub-123",
    "resourceGroupName": "rg-production",
    "tags": {
      "environment": "production",
      "cost-center": "engineering"
    }
  }
]
```

---

#### POST /azure/resources

Save Azure resource to database.

**Request:**
```json
{
  "userId": "cm123abc456",
  "name": "myvm-prod-01",
  "type": "Microsoft.Compute/virtualMachines",
  "location": "eastus",
  "subscriptionId": "sub-123",
  "resourceGroupName": "rg-production",
  "properties": {
    "vmSize": "Standard_D2s_v3",
    "osType": "Linux"
  }
}
```

**Response (201):**
```json
{
  "id": "res-001",
  "name": "myvm-prod-01",
  "type": "Microsoft.Compute/virtualMachines",
  "createdAt": "2025-11-01T11:05:00.000Z"
}
```

---

### Cost Snapshot Endpoints

#### POST /cost-snapshots

Create or update cost snapshot.

**Request:**
```json
{
  "userId": "cm123abc456",
  "subscriptionId": "sub-123",
  "date": "2025-11-01",
  "totalCost": 456.78,
  "serviceBreakdown": {
    "Microsoft.Compute": 200.50,
    "Microsoft.Storage": 50.25,
    "Microsoft.Network": 206.03
  },
  "topResources": [
    {
      "resourceId": "/subscriptions/sub-123/resourceGroups/rg-prod/providers/Microsoft.Compute/virtualMachines/vm-prod-01",
      "cost": 150.00
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "snap-001",
  "userId": "cm123abc456",
  "subscriptionId": "sub-123",
  "date": "2025-11-01T00:00:00.000Z",
  "totalCost": 456.78,
  "createdAt": "2025-11-01T12:00:00.000Z"
}
```

---

#### GET /cost-snapshots/:userId/trends

Get cost trends over time.

**Query Parameters:**
- `days` (optional) - Number of days to retrieve (default: 30, max: 365)

**Response (200):**
```json
[
  {
    "date": "2025-10-01T00:00:00.000Z",
    "totalCost": 420.50
  },
  {
    "date": "2025-10-02T00:00:00.000Z",
    "totalCost": 435.25
  },
  {
    "date": "2025-11-01T00:00:00.000Z",
    "totalCost": 456.78
  }
]
```

---

#### GET /cost-snapshots/:userId

Get all cost snapshots for a user.

**Response (200):**
```json
[
  {
    "id": "snap-001",
    "subscriptionId": "sub-123",
    "date": "2025-11-01T00:00:00.000Z",
    "totalCost": 456.78,
    "serviceBreakdown": { /* ... */ },
    "topResources": [ /* ... */ ]
  }
]
```

---

### Recommendation Endpoints

#### POST /recommendations

Create a new recommendation.

**Request:**
```json
{
  "userId": "cm123abc456",
  "conversationId": "conv-789xyz",
  "type": "COST_OPTIMIZATION",
  "resourceId": "/subscriptions/sub-123/.../vm-prod-01",
  "recommendation": "Downgrade VM from Standard_D8s_v3 to Standard_D4s_v3",
  "potentialSavings": 250.00
}
```

**Response (201):**
```json
{
  "id": "rec-001",
  "userId": "cm123abc456",
  "type": "COST_OPTIMIZATION",
  "recommendation": "Downgrade VM from Standard_D8s_v3 to Standard_D4s_v3",
  "potentialSavings": 250.00,
  "status": "PENDING",
  "createdAt": "2025-11-01T12:30:00.000Z"
}
```

**Recommendation Types:**
- `COST_OPTIMIZATION`
- `SECURITY`
- `PERFORMANCE`
- `RELIABILITY`
- `OPERATIONAL_EXCELLENCE`

---

#### GET /recommendations/:userId

Get recommendations for a user.

**Query Parameters:**
- `limit` (optional) - Number of recommendations (default: 10, max: 100)
- `type` (optional) - Filter by recommendation type
- `status` (optional) - Filter by status

**Response (200):**
```json
[
  {
    "id": "rec-001",
    "type": "COST_OPTIMIZATION",
    "resourceId": "/subscriptions/.../vm-prod-01",
    "recommendation": "Downgrade VM from Standard_D8s_v3 to Standard_D4s_v3",
    "potentialSavings": 250.00,
    "status": "PENDING",
    "createdAt": "2025-11-01T12:30:00.000Z"
  }
]
```

---

#### PUT /recommendations/:id/status

Update recommendation status.

**Request:**
```json
{
  "status": "ACCEPTED"
}
```

**Response (200):**
```json
{
  "id": "rec-001",
  "status": "ACCEPTED",
  "updatedAt": "2025-11-01T13:00:00.000Z"
}
```

**Valid Statuses:**
- `PENDING` - Recommendation created, awaiting review
- `ACCEPTED` - User accepted the recommendation
- `REJECTED` - User rejected the recommendation
- `COMPLETED` - Recommendation implemented
- `IGNORED` - User chose to ignore

---

## Backend Service (Port 3003)

Base URL: `http://localhost:3003`

### Azure Endpoints

#### GET /azure/subscriptions

Get all Azure subscriptions for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "subscriptionId": "12345678-1234-1234-1234-123456789abc",
    "displayName": "Production Subscription",
    "state": "Enabled",
    "tenantId": "87654321-4321-4321-4321-cba987654321"
  }
]
```

**Errors:**
- `401` - Azure credentials not configured
- `403` - Insufficient permissions

---

#### GET /azure/resource-groups

Get all resource groups across subscriptions.

**Query Parameters:**
- `subscriptionId` (optional) - Filter by subscription

**Response (200):**
```json
[
  {
    "id": "/subscriptions/.../resourceGroups/rg-production",
    "name": "rg-production",
    "location": "eastus",
    "subscriptionId": "sub-123",
    "tags": {
      "environment": "production"
    }
  }
]
```

---

#### POST /azure/query

Execute Azure Resource Graph query.

**Request:**
```json
{
  "query": "Resources | where type == 'microsoft.compute/virtualmachines' | project name, location, properties.hardwareProfile.vmSize",
  "subscriptions": ["sub-123", "sub-456"]
}
```

**Response (200):**
```json
{
  "totalRecords": 15,
  "count": 15,
  "data": [
    {
      "name": "vm-prod-01",
      "location": "eastus",
      "vmSize": "Standard_D4s_v3"
    }
  ]
}
```

---

#### GET /azure/cost-data

Get cost data from Azure Cost Management API.

**Query Parameters:**
- `subscriptionId` (required) - Subscription to query
- `startDate` (required) - Start date (YYYY-MM-DD)
- `endDate` (required) - End date (YYYY-MM-DD)
- `granularity` (optional) - Daily, Monthly (default: Daily)

**Response (200):**
```json
{
  "timeframe": "Custom",
  "granularity": "Daily",
  "rows": [
    [125.50, "2025-11-01", "Microsoft.Compute"],
    [45.25, "2025-11-01", "Microsoft.Storage"]
  ],
  "columns": [
    {"name": "Cost", "type": "Number"},
    {"name": "Date", "type": "String"},
    {"name": "ServiceName", "type": "String"}
  ]
}
```

---

## AI Service (Port 3004)

Base URL: `http://localhost:3004`

### Chat Endpoints

#### POST /chat/message

Send a message to the AI agent.

**Request:**
```json
{
  "userId": "cm123abc456",
  "message": "What are my Azure costs this month?",
  "conversationId": "conv-789xyz"
}
```

**Response (200):**
```json
{
  "response": "Based on the data from Azure Cost Management, your total costs for November 2025 are $456.78. Here's the breakdown by service:\n\n- Compute: $200.50 (44%)\n- Network: $206.03 (45%)\n- Storage: $50.25 (11%)\n\nYour top resource is vm-prod-01 at $150.00.",
  "conversationId": "conv-789xyz",
  "toolsUsed": [
    "azure_cost_management-get_cost_data"
  ],
  "contextSources": [
    "userContext",
    "azureContext",
    "conversationHistory"
  ]
}
```

**Errors:**
- `400` - Invalid request format
- `429` - Rate limit exceeded (Gemini API)
- `500` - Internal server error

---

#### POST /chat/stream

Send a message with streaming response (SSE).

**Request:**
```json
{
  "userId": "cm123abc456",
  "message": "Analyze all my resources and provide recommendations",
  "conversationId": "conv-789xyz"
}
```

**Response (SSE Stream):**
```
data: {"type":"thinking","content":"Analyzing your Azure resources..."}

data: {"type":"tool_call","tool":"azure_resources-query","status":"executing"}

data: {"type":"tool_result","tool":"azure_resources-query","resultCount":47}

data: {"type":"content","content":"I found 47 resources across 5 resource groups..."}

data: {"type":"complete"}
```

---

### MCP Endpoints

#### GET /mcp/tools

Get all available MCP tools.

**Response (200):**
```json
[
  {
    "name": "azure_resources-query_azure_resource_graph",
    "description": "Query Azure Resource Graph for information about resources",
    "parameters": {
      "type": "object",
      "properties": {
        "arg_intent": {
          "type": "string",
          "description": "Natural language description of the query intent"
        }
      },
      "required": ["arg_intent"]
    }
  }
]
```

---

#### POST /mcp/execute

Execute an MCP tool directly (for testing).

**Request:**
```json
{
  "toolName": "azure_resources-query_azure_resource_graph",
  "parameters": {
    "arg_intent": "List all virtual machines",
    "useDefaultSubscriptionFilter": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "resources": [ /* ... */ ]
  }
}
```

---

### Context Endpoints

#### POST /context/build

Build context for a user query (internal use).

**Request:**
```json
{
  "userId": "cm123abc456",
  "message": "What are my VM costs?",
  "conversationId": "conv-789xyz"
}
```

**Response (200):**
```json
{
  "userContext": {
    "userId": "cm123abc456",
    "email": "user@example.com",
    "azureSubscriptionId": "sub-123"
  },
  "azureContext": {
    "subscriptions": [ /* ... */ ],
    "resourceGroups": [ /* ... */ ]
  },
  "conversationHistory": [ /* ... */ ],
  "historicalContext": {
    "costSnapshots": [ /* ... */ ],
    "recommendations": [ /* ... */ ]
  },
  "documentationContext": "Azure Virtual Machines documentation...",
  "toolContext": [ /* ... */ ]
}
```

---

### Ollama Endpoints (Optional)

#### GET /ollama/models

List available Ollama models.

**Response (200):**
```json
[
  {
    "name": "llama3.2",
    "size": "7B",
    "modified": "2025-11-01T10:00:00.000Z"
  }
]
```

---

#### POST /ollama/chat

Chat with Ollama model (alternative to Gemini).

**Request:**
```json
{
  "model": "llama3.2",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

**Response (200):**
```json
{
  "response": "Hello! How can I help you today?"
}
```

---

## Common Error Codes

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request format, missing required fields |
| 401 | Unauthorized | Invalid or missing authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error, check logs |
| 502 | Bad Gateway | Downstream service unavailable |
| 503 | Service Unavailable | Service temporarily down |

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Email is required",
    "details": {
      "field": "email",
      "issue": "missing"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request format is invalid |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `RESOURCE_ALREADY_EXISTS` | Duplicate resource |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AZURE_API_ERROR` | Error from Azure API |
| `GEMINI_API_ERROR` | Error from Gemini API |
| `DATABASE_ERROR` | Database operation failed |
| `CACHE_ERROR` | Redis cache operation failed |

---

## Authentication

### JWT Token Format

Access tokens are JWT (JSON Web Tokens) with the following payload:

```json
{
  "sub": "cm123abc456",
  "email": "user@example.com",
  "iat": 1698845400,
  "exp": 1698849000
}
```

- `sub` - User ID
- `email` - User email
- `iat` - Issued at (Unix timestamp)
- `exp` - Expires at (Unix timestamp, 1 hour from issued)

### Using Authentication

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

Access tokens expire after 1 hour. Use the refresh token to obtain a new access token:

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGci..."}'
```

Refresh tokens expire after 7 days.

---

## Rate Limiting

### Limits

| Service | Endpoint | Limit | Window |
|---------|----------|-------|--------|
| AI Service | `/chat/message` | 60 requests | 1 minute |
| AI Service | `/chat/stream` | 30 requests | 1 minute |
| Backend | `/azure/*` | 100 requests | 1 minute |
| Database | All endpoints | 200 requests | 1 minute |
| Authentication | `/auth/login` | 5 requests | 5 minutes |
| Authentication | `/auth/register` | 3 requests | 15 minutes |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698845460
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

**Example:**
```
GET /chat/conversations/user/cm123abc456?limit=20&offset=40
```

**Response Headers:**
```
X-Total-Count: 127
X-Limit: 20
X-Offset: 40
```

---

## Webhooks (Future Enhancement)

Planned webhook support for:
- Cost anomaly detection
- Budget threshold exceeded
- Recommendation status updates
- Resource creation/deletion

Webhook payload format:
```json
{
  "event": "cost.anomaly.detected",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "data": {
    "userId": "cm123abc456",
    "subscriptionId": "sub-123",
    "anomalyType": "SPIKE",
    "expectedCost": 450.00,
    "actualCost": 875.50,
    "difference": 425.50
  }
}
```

---

## Conclusion

This API documentation provides a complete reference for all endpoints in the AI for FinOps platform. For additional support or questions, refer to the [End-to-End Testing Guide](./END_TO_END_TESTING_GUIDE.md) or contact the development team.

**Last Updated:** November 1, 2025  
**API Version:** 1.0.0  
**Status:** Production Ready
