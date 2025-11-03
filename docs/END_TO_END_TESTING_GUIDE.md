# End-to-End Testing Guide - Phase 10

## Overview

This guide provides comprehensive testing procedures to validate the complete agentic AI FinOps system. Test all phases from user authentication to AI-powered Azure cost optimization with autonomous tool usage.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Service Health Checks](#service-health-checks)
3. [Test Scenarios](#test-scenarios)
4. [Validation Checklists](#validation-checklists)
5. [Performance Testing](#performance-testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Environment Setup

Ensure all required environment variables are configured:

```bash
# Azure Credentials
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finops
REDIS_URL=redis://localhost:6379

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 2. Services Running

Start all services:

```bash
# Terminal 1 - Database Service (Port 3002)
cd database && npm run start:dev

# Terminal 2 - Backend Service (Port 3003)
cd backend && npm run start:dev

# Terminal 3 - AI Service (Port 3004)
cd ai && npm run start:dev

# Terminal 4 - Authentication Service (Port 3001)
cd authentication && npm run start:dev

# Terminal 5 - Frontend (Port 3000)
cd frontend && npm run dev
```

### 3. Database Schema

Ensure Prisma migrations are applied:

```bash
cd database
npx prisma migrate deploy
npx prisma generate
```

### 4. Redis Running

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

---

## Service Health Checks

### 1. Database Service (Port 3002)

```bash
# Health check
curl http://localhost:3002

# Test user endpoint
curl http://localhost:3002/users

# Test Azure resources endpoint
curl http://localhost:3002/azure/resources

# Test cost snapshots endpoint
curl http://localhost:3002/cost-snapshots
```

**Expected:** All endpoints return 200 or valid responses (not 404)

### 2. Backend Service (Port 3003)

```bash
# Health check
curl http://localhost:3003

# Test Azure subscriptions
curl http://localhost:3003/azure/subscriptions

# Test Azure resource groups
curl http://localhost:3003/azure/resource-groups
```

**Expected:** Valid Azure data or authentication prompts

### 3. AI Service (Port 3004)

```bash
# Health check
curl http://localhost:3004

# Test Ollama models (if configured)
curl http://localhost:3004/ollama/models

# Test MCP tools discovery
curl http://localhost:3004/mcp/tools
```

**Expected:** Service responds, tools listed

### 4. Authentication Service (Port 3001)

```bash
# Health check
curl http://localhost:3001

# Test auth routes
curl http://localhost:3001/auth/github
```

**Expected:** Redirects or valid responses

---

## Test Scenarios

### Scenario 1: User Registration and Login

**Objective:** Verify complete authentication flow

**Steps:**

1. **Navigate to Frontend**
   ```
   Open: http://localhost:3000
   ```

2. **Register New User**
   - Click "Sign Up"
   - Enter: Email, Password, Full Name
   - Submit registration
   - **Expected:** User created, redirected to login

3. **Login**
   - Enter credentials
   - Submit login
   - **Expected:** JWT token received, redirected to dashboard

4. **Verify Session**
   - Check browser localStorage for `auth_token`
   - **Expected:** Token present and valid

**Validation:**
```bash
# Check user in database
cd database
npx prisma studio
# Navigate to User table, verify user exists
```

---

### Scenario 2: Basic Chat Interaction

**Objective:** Test simple AI chat without Azure integration

**Steps:**

1. **Navigate to Chat Interface**
   ```
   Open: http://localhost:3000/chat
   ```

2. **Send Simple Query**
   ```
   User: "Hello, what can you help me with?"
   ```

3. **Verify Response**
   - **Expected:** AI responds with capabilities overview
   - **Expected:** No errors in browser console
   - **Expected:** Response time < 5 seconds

4. **Check Logs**
   ```bash
   # Check AI service logs
   tail -f logs/ai.log
   ```
   - **Expected:** Context building logs
   - **Expected:** Gemini API call logged
   - **Expected:** No error traces

**Validation:**
- ✅ Response received
- ✅ Conversation saved to database
- ✅ Context snapshots created
- ✅ No rate limiting errors

---

### Scenario 3: Azure Resource Query with MCP Tools

**Objective:** Test autonomous Azure tool usage

**Steps:**

1. **Send Azure Query**
   ```
   User: "List all my Azure resource groups"
   ```

2. **Observe AI Behavior**
   - AI should discover Azure MCP tools
   - AI should call `azure_resources-query_azure_resource_graph`
   - AI should format results in friendly manner

3. **Verify Response**
   - **Expected:** List of resource groups displayed
   - **Expected:** Resource group names, locations, subscription IDs
   - **Expected:** Formatted table or structured output

4. **Check MCP Gateway Logs**
   ```bash
   # Check AI service logs for MCP calls
   grep "MCP" logs/ai.log
   ```
   - **Expected:** Tool discovery logged
   - **Expected:** Tool execution logged
   - **Expected:** Results parsed

**Validation:**
- ✅ Azure MCP tools discovered
- ✅ Correct tool selected autonomously
- ✅ Tool executed successfully
- ✅ Results formatted properly
- ✅ Tool schema cached (Redis)

---

### Scenario 4: Multi-Turn Conversation with Context

**Objective:** Test conversation persistence and context building

**Steps:**

1. **Turn 1: Initial Query**
   ```
   User: "Show me virtual machines in my subscription"
   ```
   - **Expected:** List of VMs with details

2. **Turn 2: Follow-up Query (Context Test)**
   ```
   User: "What are the costs for these VMs?"
   ```
   - AI should remember "these VMs" from previous turn
   - AI should query cost data for specific VMs
   - **Expected:** Cost breakdown per VM

3. **Turn 3: Deeper Context**
   ```
   User: "Which one is the most expensive?"
   ```
   - AI should analyze cost data from Turn 2
   - **Expected:** Identifies most expensive VM with cost details

4. **Verify Context Persistence**
   ```bash
   # Check database for conversation
   cd database
   npx prisma studio
   # Navigate to Conversation and Message tables
   ```
   - **Expected:** All 3 messages saved
   - **Expected:** Context snapshots include previous messages

**Validation:**
- ✅ Context maintained across turns
- ✅ AI references previous messages correctly
- ✅ No context loss or confusion
- ✅ Conversation ID consistent
- ✅ All messages persisted in database

---

### Scenario 5: Context7 Documentation Integration

**Objective:** Test Context7 MCP for Azure documentation

**Steps:**

1. **Ask Documentation Question**
   ```
   User: "How do I configure auto-scaling for Azure App Service?"
   ```

2. **Observe AI Behavior**
   - AI should recognize this is a "how-to" question
   - AI should query Context7 MCP for Azure App Service docs
   - AI should provide answer grounded in official documentation

3. **Verify Response Quality**
   - **Expected:** Step-by-step instructions
   - **Expected:** References to official Azure documentation
   - **Expected:** Accurate and up-to-date information

4. **Check Context7 Usage**
   ```bash
   # Check AI service logs for Context7 calls
   grep "Context7" logs/ai.log
   grep "resolve-library-id" logs/ai.log
   grep "get-library-docs" logs/ai.log
   ```
   - **Expected:** Library resolution logged
   - **Expected:** Documentation retrieval logged
   - **Expected:** Results cached (Redis, 1 hour TTL)

**Validation:**
- ✅ Context7 MCP tools discovered
- ✅ Correct Azure library resolved
- ✅ Documentation retrieved
- ✅ Response includes official guidance
- ✅ Documentation cached for 1 hour

---

### Scenario 6: Cost Optimization with Historical Context

**Objective:** Test cost snapshot integration and AI recommendations

**Steps:**

1. **Trigger Cost Snapshot Collection (Manual)**
   ```bash
   # If cron hasn't run yet, manually trigger
   curl -X POST http://localhost:3003/azure/test-cost-collection
   ```
   - **Expected:** Cost snapshots saved to database

2. **Query Historical Costs**
   ```
   User: "What were my Azure costs over the last 30 days?"
   ```

3. **Verify AI Behavior**
   - AI should query `/cost-snapshots/:userId/trends?days=30`
   - AI should analyze trend data
   - **Expected:** Cost trend chart or summary
   - **Expected:** Identifies increases/decreases

4. **Request Recommendations**
   ```
   User: "Give me cost optimization recommendations"
   ```

5. **Verify Recommendations**
   - AI should analyze current resources and costs
   - AI should provide specific recommendations
   - Recommendations should be saved to database
   - **Expected:** 3-5 actionable recommendations
   - **Expected:** Each includes potential savings
   - **Expected:** Saved to `/recommendations`

6. **Check Saved Recommendations**
   ```bash
   # Query recommendations endpoint
   curl http://localhost:3002/recommendations/<userId>
   ```
   - **Expected:** Recommendations stored with status PENDING

**Validation:**
- ✅ Cost snapshots retrieved
- ✅ Historical context used in analysis
- ✅ Recommendations generated
- ✅ Recommendations saved to database
- ✅ Potential savings calculated

---

### Scenario 7: Complex Multi-Tool Workflow

**Objective:** Test autonomous agent with multiple tool calls

**Steps:**

1. **Send Complex Query**
   ```
   User: "Find all App Services in my subscription, check their pricing tiers, and recommend cost optimizations"
   ```

2. **Observe AI Agent Workflow**
   - **Expected Iteration 1:** Query Azure resources for App Services
   - **Expected Iteration 2:** Get pricing details for each App Service
   - **Expected Iteration 3:** Analyze configurations and costs
   - **Expected Iteration 4:** Generate recommendations
   - **Expected Final Response:** Formatted summary with recommendations

3. **Monitor Tool Calls**
   ```bash
   # Watch AI service logs in real-time
   tail -f logs/ai.log | grep "Tool"
   ```
   - **Expected:** Multiple tool calls logged
   - **Expected:** Results passed between iterations
   - **Expected:** Max iterations not exceeded (< 10)

4. **Verify Response Quality**
   - **Expected:** Complete analysis of all App Services
   - **Expected:** Specific tier recommendations (e.g., "Downgrade from P1v2 to S1")
   - **Expected:** Quantified savings estimates
   - **Expected:** Actionable next steps

**Validation:**
- ✅ Multiple tools discovered and used
- ✅ Tools called in logical sequence
- ✅ Results aggregated correctly
- ✅ Final response is comprehensive
- ✅ No infinite loops or max iterations hit

---

### Scenario 8: Rate Limiting Handling

**Objective:** Test exponential backoff retry logic

**Steps:**

1. **Generate High API Usage**
   - Send 5-10 queries rapidly to trigger rate limit
   - Use complex queries that require multiple Gemini calls

2. **Trigger Rate Limit (If Possible)**
   ```
   User: "Analyze all my resources and provide detailed cost optimization plans for each"
   ```

3. **Observe Retry Logic**
   - **Expected:** AI service logs show "Rate limit hit. Retrying..."
   - **Expected:** Delays: 2s, 4s, 8s between retries
   - **Expected:** Request eventually succeeds OR user-friendly error

4. **Check Error Handling**
   - If all retries fail:
     - **Expected:** Error message: "The AI service is currently experiencing high demand..."
     - **Expected:** User prompted to try again or upgrade API tier

**Validation:**
- ✅ Rate limit detected (Error 429)
- ✅ Exponential backoff applied
- ✅ Max 3 retries attempted
- ✅ User-friendly error message if all fail
- ✅ No crashes or unhandled exceptions

---

### Scenario 9: Caching Effectiveness

**Objective:** Validate Redis caching layer

**Steps:**

1. **First Query (Cache Miss)**
   ```
   User: "What are the best practices for Azure Functions?"
   ```
   - **Expected:** Context7 MCP call to retrieve docs
   - **Expected:** Response time: 3-5 seconds

2. **Same Query Again (Cache Hit)**
   ```
   User: "What are the best practices for Azure Functions?"
   ```
   - **Expected:** Docs retrieved from Redis cache
   - **Expected:** Response time: < 1 second

3. **Verify Cache Usage**
   ```bash
   # Connect to Redis
   redis-cli
   
   # Check keys
   KEYS *
   
   # Check specific cache
   GET "context7:docs:azure-functions"
   TTL "context7:docs:azure-functions"
   ```
   - **Expected:** Cache key exists
   - **Expected:** TTL shows remaining time (< 3600 seconds)

4. **Test Cache Expiration**
   - Wait for TTL to expire OR manually delete key
   - Send query again
   - **Expected:** Cache miss, new MCP call

**Validation:**
- ✅ First query triggers MCP call
- ✅ Subsequent queries use cache
- ✅ Response time significantly faster with cache
- ✅ Cache expires after TTL
- ✅ Different queries cached separately

---

### Scenario 10: Error Recovery and Resilience

**Objective:** Test system behavior under failure conditions

**Steps:**

1. **Test with Invalid Azure Credentials**
   - Temporarily set invalid `AZURE_CLIENT_SECRET`
   - Restart backend service
   - Send Azure query
   - **Expected:** User-friendly error message
   - **Expected:** No crashes, graceful degradation

2. **Test with Redis Down**
   - Stop Redis: `redis-cli shutdown`
   - Send query requiring cache
   - **Expected:** Query still works (cache bypassed)
   - **Expected:** Warning logged but no crash

3. **Test with Database Down**
   - Stop database service
   - Send chat query
   - **Expected:** Error message about service unavailability
   - **Expected:** Frontend remains responsive

4. **Test Service Recovery**
   - Restart Redis and Database
   - Send queries again
   - **Expected:** Services reconnect automatically
   - **Expected:** System returns to normal operation

**Validation:**
- ✅ Services handle failures gracefully
- ✅ Error messages are user-friendly
- ✅ No unhandled exceptions
- ✅ Services recover automatically
- ✅ Data consistency maintained

---

## Validation Checklists

### ✅ Phase 1-3: Foundation

- [ ] Database schema deployed successfully
- [ ] All tables created (User, Conversation, Message, CostSnapshot, Recommendation, etc.)
- [ ] Prisma Client generated
- [ ] Redis connected and responsive
- [ ] Environment variables configured

### ✅ Phase 4: Context Service

- [ ] Context service aggregates 6 sources:
  - [ ] User profile context
  - [ ] Azure resource context
  - [ ] Conversation history context
  - [ ] Historical cost/recommendation context
  - [ ] Context7 documentation context
  - [ ] Tool/function context
- [ ] Context building completes in < 2 seconds
- [ ] Context snapshots saved to database

### ✅ Phase 5: Azure MCP Gateway

- [ ] 8 Azure MCP servers accessible
- [ ] Tool discovery works (`/mcp/tools`)
- [ ] Tool schemas cached in Redis (1 hour TTL)
- [ ] Tool execution successful
- [ ] Error handling for tool failures

### ✅ Phase 6: Smart Caching

- [ ] Context7 docs cached (1 hour)
- [ ] User context cached (5 minutes)
- [ ] Azure context cached (10 minutes)
- [ ] Tool schemas cached (1 hour)
- [ ] Cache hit rate > 50% after warmup
- [ ] Cache invalidation works correctly

### ✅ Phase 7: ChatGeminiService

- [ ] Dynamic system instructions built from context
- [ ] Multi-turn conversation support
- [ ] Function calling enabled
- [ ] Max iterations enforced (10)
- [ ] Autonomous tool selection works
- [ ] Tool results integrated into responses

### ✅ Phase 8: Conversation Persistence

- [ ] Conversations saved to database
- [ ] Messages saved with correct conversation ID
- [ ] Context snapshots attached to conversations
- [ ] Conversation history retrievable
- [ ] Multi-user support (conversation isolation)

### ✅ Phase 9: Cost Snapshots

- [ ] Cron job scheduled (daily midnight UTC)
- [ ] Cost snapshots saved to database
- [ ] Cost trend API works (`/cost-snapshots/:userId/trends`)
- [ ] Recommendations saved to database
- [ ] Recommendation status updates work

### ✅ Phase 10: Integration

- [ ] All services communicate successfully
- [ ] End-to-end flows complete without errors
- [ ] Rate limiting handled gracefully
- [ ] Error recovery mechanisms work
- [ ] Performance meets targets (< 5s response time)
- [ ] Documentation complete and accurate

---

## Performance Testing

### Response Time Targets

| Scenario | Target | Acceptable | Poor |
|----------|--------|------------|------|
| Simple chat query | < 2s | 2-5s | > 5s |
| Azure resource query | < 3s | 3-7s | > 7s |
| Complex multi-tool query | < 5s | 5-10s | > 10s |
| Context7 doc query (cached) | < 1s | 1-2s | > 2s |
| Context7 doc query (uncached) | < 4s | 4-8s | > 8s |
| Cost trend retrieval | < 1s | 1-3s | > 3s |

### Load Testing

**Tool:** Apache Bench or Artillery

```bash
# Test chat endpoint with 100 concurrent requests
ab -n 100 -c 10 -T 'application/json' -p query.json \
  http://localhost:3004/chat/message

# query.json
{
  "userId": "test-user-id",
  "message": "Hello, what can you help with?",
  "conversationId": "test-conv-id"
}
```

**Targets:**
- Success rate: > 95%
- Average response time: < 5s
- Max response time: < 15s
- No crashes or OOM errors

### Cache Performance

**Metrics to Track:**
```bash
# Redis stats
redis-cli INFO stats

# Key metrics:
# - keyspace_hits
# - keyspace_misses
# - Cache hit rate = hits / (hits + misses)
```

**Target:** Cache hit rate > 50% after 100 requests

### Database Performance

```bash
# Check slow queries
cd database
npx prisma studio

# Monitor query performance
# Look for queries > 100ms
```

**Target:** 95% of queries < 100ms

---

## Troubleshooting

### Issue: AI Service Returns 404 Errors

**Symptoms:**
- "Failed to fetch conversation context: 404"
- "Failed to fetch historical context: 404"

**Solutions:**
1. Check database service is running on port 3002
2. Verify endpoints exist:
   ```bash
   curl http://localhost:3002/chat/conversations
   curl http://localhost:3002/cost-snapshots
   ```
3. Check AI service configuration for correct `databaseServiceUrl`

### Issue: Rate Limiting Errors (429)

**Symptoms:**
- "Resource exhausted" errors
- Rapid failure of queries

**Solutions:**
1. Verify retry logic is enabled in ChatGeminiService
2. Check Gemini API quotas at https://aistudio.google.com
3. Reduce query frequency or complexity
4. Consider upgrading API tier

### Issue: Slow Response Times

**Symptoms:**
- Queries take > 10 seconds
- Timeouts

**Solutions:**
1. Check Redis is running and cache is being used
2. Verify Azure MCP servers are responsive
3. Reduce context size (limit conversation history)
4. Check network latency to Azure APIs
5. Review Gemini API response times

### Issue: Context Not Persisting

**Symptoms:**
- AI forgets previous conversation
- Multi-turn queries fail

**Solutions:**
1. Verify conversation ID is consistent across turns
2. Check database for saved messages:
   ```bash
   cd database && npx prisma studio
   ```
3. Verify ContextService retrieves conversation history
4. Check logs for context building errors

### Issue: Cron Job Not Running

**Symptoms:**
- No cost snapshots in database
- Historical data always empty

**Solutions:**
1. Verify ScheduleModule is enabled in backend app.module.ts
2. Check backend service logs for cron initialization
3. Manually trigger collection:
   ```bash
   # Add test endpoint in azure-scheduler.service.ts
   curl -X POST http://localhost:3003/azure/test-cost-collection
   ```
4. Verify Azure Cost Management API credentials
5. Check time zone configuration (UTC)

### Issue: MCP Tools Not Discovered

**Symptoms:**
- AI doesn't use Azure tools
- "No tools available" errors

**Solutions:**
1. Verify MCP servers are running
2. Check tool discovery endpoint:
   ```bash
   curl http://localhost:3004/mcp/tools
   ```
3. Verify Azure credentials are configured
4. Check MCP gateway service logs
5. Clear Redis cache and retry

---

## Success Criteria

Phase 10 is considered **COMPLETE** when:

✅ **All Services Operational**
- All 5 services running without errors
- Health checks pass for all endpoints
- Database and Redis connected

✅ **All Test Scenarios Pass**
- Scenarios 1-10 complete successfully
- No critical errors or crashes
- Response times meet targets

✅ **All Validation Checklists Complete**
- All checkboxes marked for Phases 1-10
- Features verified in real usage
- Edge cases tested

✅ **Performance Targets Met**
- Response times within acceptable ranges
- Cache hit rate > 50%
- Load testing passes

✅ **Documentation Complete**
- This testing guide
- API documentation
- Deployment guide
- User guide
- README updated

✅ **Production Ready**
- No known critical bugs
- Error handling comprehensive
- Monitoring and logging in place
- Ready for deployment

---

## Next Steps After Phase 10

1. **Production Deployment**
   - Deploy to Azure Container Instances or App Service
   - Configure production environment variables
   - Set up Azure Monitor and Application Insights
   - Configure alerts and notifications

2. **User Acceptance Testing (UAT)**
   - Test with real users
   - Gather feedback
   - Iterate on UX and features

3. **Performance Optimization**
   - Profile and optimize slow queries
   - Fine-tune cache TTLs
   - Optimize context building
   - Consider CDN for frontend

4. **Feature Enhancements**
   - Add more Azure MCP tools
   - Implement advanced cost forecasting
   - Add budget alerts
   - Multi-tenancy support

5. **Security Hardening**
   - Penetration testing
   - Security audit
   - Rate limiting for API endpoints
   - HTTPS enforcement

---

## Conclusion

This comprehensive testing guide ensures the agentic AI FinOps system is thoroughly validated and production-ready. Follow all test scenarios, complete validation checklists, and verify performance targets before proceeding to deployment.

**Project Status After Phase 10:** 100% Complete 🎉

**Total Development Time:** ~40 hours (Phases 1-10)

**Key Achievement:** Fully autonomous agentic AI system with Context7 RAG, Azure MCP integration, and intelligent cost optimization capabilities.
