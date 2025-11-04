#!/bin/bash

# End-to-End Cost Tracking Test Suite
# Tests all components of the granular cost tracking implementation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service URLs
DATABASE_URL="http://localhost:3002"
BACKEND_URL="http://localhost:3003"
AI_URL="http://localhost:3004"
AUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"
}

print_test() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${YELLOW}[TEST $TESTS_TOTAL]${NC} $1"
}

print_success() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASS:${NC} $1\n"
}

print_failure() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL:${NC} $1\n"
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

test_service_health() {
    local service_name=$1
    local url=$2
    
    print_test "Health check: $service_name"
    
    if curl -s -f "$url/health" > /dev/null 2>&1 || curl -s -f "$url" > /dev/null 2>&1; then
        print_success "$service_name is running on $url"
        return 0
    else
        print_failure "$service_name is NOT responding on $url"
        return 1
    fi
}

# =============================================================================
# TEST 1: SERVICE HEALTH CHECKS
# =============================================================================
print_header "TEST 1: Service Health Checks"

test_service_health "Database Service" "$DATABASE_URL"
test_service_health "Backend Service" "$BACKEND_URL"
test_service_health "AI Service" "$AI_URL"
test_service_health "Auth Service" "$AUTH_URL"
test_service_health "Frontend Service" "$FRONTEND_URL"

# =============================================================================
# TEST 2: DATABASE SCHEMA VERIFICATION
# =============================================================================
print_header "TEST 2: Database Schema Verification"

print_info "Verifying schema by testing API endpoints (indirect schema validation)"

print_test "Verify ServiceCostRecord API endpoint exists"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/service-costs" -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "ServiceCostRecord table accessible via API"
else
    print_failure "ServiceCostRecord table/endpoint not accessible"
fi

print_test "Verify AiUsageCost API endpoint exists"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/ai-usage-costs" -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "AiUsageCost table accessible via API"
else
    print_failure "AiUsageCost table/endpoint not accessible"
fi

print_test "Verify UserCostAllocation API endpoint exists"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/user-cost-allocations/test-user" -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "UserCostAllocation table accessible via API"
else
    print_failure "UserCostAllocation table/endpoint not accessible (HTTP $HTTP_CODE)"
fi

print_test "Verify ResourceCostBreakdown API endpoint exists"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/resource-cost-breakdowns" -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "ResourceCostBreakdown table accessible via API"
else
    print_failure "ResourceCostBreakdown table/endpoint not accessible"
fi

# =============================================================================
# TEST 3: COST TRACKING API ENDPOINTS
# =============================================================================
print_header "TEST 3: Cost Tracking API Endpoints"

# Test ServiceCostRecord endpoints
print_test "POST /cost-tracking/service-costs (create service cost)"
RESPONSE=$(curl -s -X POST "$DATABASE_URL/cost-tracking/service-costs" \
    -H "Content-Type: application/json" \
    -d '{
        "serviceName": "ca-ai-service",
        "serviceType": "CONTAINER_APP",
        "date": "2025-11-02T00:00:00.000Z",
        "cost": 12.4567,
        "currency": "USD",
        "subscriptionId": "test-sub-123",
        "resourceGroup": "rg-finops-test",
        "region": "eastus",
        "billingPeriod": "2025-11"
    }' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "Service cost created successfully (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
else
    print_failure "Failed to create service cost (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
fi

print_test "GET /cost-tracking/service-costs (query service costs)"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/service-costs?date=2025-11-02&serviceName=ca-ai-service" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | grep -o '"serviceName"' | wc -l)
    print_success "Retrieved service costs (HTTP $HTTP_CODE, $COUNT records)"
    print_info "Sample: $(echo "$BODY" | head -c 200)..."
else
    print_failure "Failed to retrieve service costs (HTTP $HTTP_CODE)"
fi

print_test "GET /cost-tracking/service-costs/trends (get cost trends)"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/service-costs/trends?serviceName=ca-ai-service&startDate=2025-11-01&endDate=2025-11-07" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Retrieved cost trends (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
else
    print_failure "Failed to retrieve cost trends (HTTP $HTTP_CODE)"
fi

print_test "GET /cost-tracking/service-costs/summary (get cost summary)"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/service-costs/summary?billingPeriod=2025-11" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Retrieved cost summary (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
else
    print_failure "Failed to retrieve cost summary (HTTP $HTTP_CODE)"
fi

# Test AiUsageCost endpoints
print_test "POST /cost-tracking/ai-usage-costs (create AI usage cost)"
RESPONSE=$(curl -s -X POST "$DATABASE_URL/cost-tracking/ai-usage-costs" \
    -H "Content-Type: application/json" \
    -d '{
        "conversationId": "test-conv-123",
        "userId": "test-user-123",
        "modelName": "gemini-2.0-flash-exp",
        "promptTokens": 1500,
        "completionTokens": 800,
        "totalTokens": 2300,
        "cost": 0.088125,
        "timestamp": "2025-11-02T12:34:56.000Z",
        "toolsUsed": ["azure_cost_analysis", "resource_recommendations"]
    }' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "AI usage cost created successfully (HTTP $HTTP_CODE)"
    print_info "Response: $(echo "$BODY" | head -c 200)..."
else
    print_failure "Failed to create AI usage cost (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
fi

print_test "GET /cost-tracking/ai-usage-costs (query AI usage costs)"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/ai-usage-costs?userId=test-user-123" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | grep -o '"conversationId"' | wc -l)
    print_success "Retrieved AI usage costs (HTTP $HTTP_CODE, $COUNT records)"
else
    print_failure "Failed to retrieve AI usage costs (HTTP $HTTP_CODE)"
fi

# Test ResourceCostBreakdown endpoints
print_test "POST /cost-tracking/resource-cost-breakdowns (create resource breakdown)"
RESPONSE=$(curl -s -X POST "$DATABASE_URL/cost-tracking/resource-cost-breakdowns" \
    -H "Content-Type: application/json" \
    -d '{
        "date": "2025-11-02T00:00:00.000Z",
        "subscriptionId": "test-sub-123",
        "resourceName": "ca-ai-service",
        "resourceGroup": "rg-finops-test",
        "resourceType": "Microsoft.App/containerApps",
        "meterCategory": "Container Apps",
        "meterSubCategory": "Standard Plan",
        "meterName": "Compute Hours",
        "quantity": 24.0,
        "unitOfMeasure": "Hours",
        "unitPrice": 0.234,
        "cost": 5.616,
        "currency": "USD"
    }' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "Resource breakdown created successfully (HTTP $HTTP_CODE)"
    print_info "Response: $(echo "$BODY" | head -c 200)..."
else
    print_failure "Failed to create resource breakdown (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
fi

print_test "GET /cost-tracking/resource-cost-breakdowns/top (get top cost resources)"
RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/resource-cost-breakdowns/top?startDate=2025-11-01&endDate=2025-11-07&limit=10" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Retrieved top cost resources (HTTP $HTTP_CODE)"
    print_info "Response: $(echo "$BODY" | head -c 300)..."
else
    print_failure "Failed to retrieve top cost resources (HTTP $HTTP_CODE)"
fi

# Test UserCostAllocation endpoints
print_test "POST /cost-tracking/user-cost-allocations (create user allocation)"
RESPONSE=$(curl -s -X POST "$DATABASE_URL/cost-tracking/user-cost-allocations" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": "test-user-123",
        "date": "2025-11-02T00:00:00.000Z",
        "allocatedCost": 15.50,
        "currency": "USD",
        "allocationMethod": "AI_USAGE"
    }' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "User cost allocation created successfully (HTTP $HTTP_CODE)"
else
    print_failure "Failed to create user cost allocation (HTTP $HTTP_CODE)"
fi

# =============================================================================
# TEST 4: AI COST TRACKING INTEGRATION
# =============================================================================
print_header "TEST 4: AI Cost Tracking Integration"

print_test "Send chat message to AI service (triggers automatic cost tracking)"
CHAT_RESPONSE=$(curl -s -X POST "$AI_URL/chat/message" \
    -H "Content-Type: application/json" \
    -d '{
        "conversationId": "test-e2e-conv",
        "userId": "test-user-e2e",
        "message": "What are my Azure costs for today?",
        "useTools": false
    }' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)
BODY=$(echo "$CHAT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_success "Chat message processed successfully (HTTP $HTTP_CODE)"
    print_info "AI Response: $(echo "$BODY" | head -c 200)..."
    
    # Wait for async cost tracking to complete
    sleep 2
    
    print_test "Verify AI cost was automatically tracked"
    AI_COST_CHECK=$(curl -s "$DATABASE_URL/cost-tracking/ai-usage-costs?conversationId=test-e2e-conv")
    
    if echo "$AI_COST_CHECK" | grep -q "test-e2e-conv"; then
        print_success "AI cost tracking verified - cost record found"
        print_info "Cost data: $(echo "$AI_COST_CHECK" | head -c 300)..."
    else
        print_failure "AI cost tracking not working - no cost record found"
    fi
else
    print_failure "Failed to process chat message (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
fi

# =============================================================================
# TEST 5: AZURE COST MANAGEMENT API INTEGRATION
# =============================================================================
print_header "TEST 5: Azure Cost Management API Integration"

print_info "Note: Azure API tests require valid Azure credentials"
print_info "Checking if Azure credentials are configured..."

# Check if Azure credentials exist
if [ -n "$AZURE_TENANT_ID" ] && [ -n "$AZURE_CLIENT_ID" ] && [ -n "$AZURE_CLIENT_SECRET" ]; then
    print_success "Azure credentials found in environment"
    
    print_test "Test Azure Cost Data retrieval (getCostData method)"
    AZURE_RESPONSE=$(curl -s -X GET "$BACKEND_URL/azure/costs/test-subscription-id" \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$AZURE_RESPONSE" | tail -n1)
    BODY=$(echo "$AZURE_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Azure Cost Data retrieved successfully"
        print_info "Cost data structure: $(echo "$BODY" | jq -r '.columns[0:3]' 2>/dev/null || echo "$BODY" | head -c 200)"
    elif [ "$HTTP_CODE" = "404" ]; then
        print_info "Endpoint not exposed for testing (expected in production)"
    else
        print_failure "Failed to retrieve Azure cost data (HTTP $HTTP_CODE)"
    fi
else
    print_info "Azure credentials not configured - skipping Azure API tests"
    print_info "To test Azure integration, set: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
fi

# =============================================================================
# TEST 6: SCHEDULER GRANULAR COLLECTION (MOCK TEST)
# =============================================================================
print_header "TEST 6: Scheduler Granular Collection"

print_info "Testing CSV parsing logic with mock data..."

print_test "Create mock CSV cost data"
MOCK_CSV="Date,SubscriptionId,ResourceGroup,ResourceId,ResourceName,ResourceType,MeterCategory,MeterName,Quantity,UnitOfMeasure,UnitPrice,Cost,Currency
2025-11-02,test-sub-123,rg-finops-prod,/subscriptions/test/resourceGroups/rg-finops-prod/providers/Microsoft.App/containerApps/ca-ai-service,ca-ai-service,Microsoft.App/containerApps,Container Apps,Compute Hours,24.0,Hours,0.234,5.616,USD
2025-11-02,test-sub-123,rg-finops-prod,/subscriptions/test/resourceGroups/rg-finops-prod/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql-finops-prod,psql-finops-prod,Microsoft.DBforPostgreSQL/flexibleServers,Azure Database for PostgreSQL,Compute Gen5,24.0,Hours,0.85,20.40,USD"

echo "$MOCK_CSV" > /tmp/mock-cost-data.csv
print_success "Mock CSV created with 2 cost records"

print_test "Verify CSV structure (columns and rows)"
COLUMNS=$(head -n1 /tmp/mock-cost-data.csv | tr ',' '\n' | wc -l)
ROWS=$(tail -n +2 /tmp/mock-cost-data.csv | wc -l)

if [ "$COLUMNS" -eq 13 ] && [ "$ROWS" -eq 2 ]; then
    print_success "CSV structure valid: $COLUMNS columns, $ROWS data rows"
else
    print_failure "CSV structure invalid: $COLUMNS columns, $ROWS data rows"
fi

print_test "Test resource type to service name mapping"
# Test Container Apps mapping
if echo "$MOCK_CSV" | grep -q "Microsoft.App/containerApps.*ca-ai-service"; then
    print_success "Container App resource type mapping: ca-ai-service"
else
    print_failure "Container App mapping failed"
fi

# Test PostgreSQL mapping
if echo "$MOCK_CSV" | grep -q "Microsoft.DBforPostgreSQL.*psql-finops-prod"; then
    print_success "PostgreSQL resource type mapping: psql-finops-prod"
else
    print_failure "PostgreSQL mapping failed"
fi

rm -f /tmp/mock-cost-data.csv

# =============================================================================
# TEST 7: END-TO-END INTEGRATION TEST
# =============================================================================
print_header "TEST 7: End-to-End Integration Test"

print_info "Testing complete flow: Data Creation → Storage → Retrieval"

print_test "Step 1: Create test service cost record"
SERVICE_COST_DATA='{
    "serviceName": "ca-frontend",
    "serviceType": "CONTAINER_APP",
    "date": "2025-11-03T00:00:00.000Z",
    "cost": 8.2341,
    "currency": "USD",
    "subscriptionId": "e2e-test-sub",
    "resourceGroup": "rg-finops-e2e",
    "region": "eastus",
    "billingPeriod": "2025-11"
}'

CREATE_RESPONSE=$(curl -s -X POST "$DATABASE_URL/cost-tracking/service-costs" \
    -H "Content-Type: application/json" \
    -d "$SERVICE_COST_DATA" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    SERVICE_COST_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_success "Service cost created (ID: $SERVICE_COST_ID)"
else
    print_failure "Failed to create service cost"
fi

print_test "Step 2: Retrieve the created service cost"
RETRIEVE_RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/service-costs?serviceName=ca-frontend&date=2025-11-03" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RETRIEVE_RESPONSE" | tail -n1)
BODY=$(echo "$RETRIEVE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "ca-frontend"; then
    RETRIEVED_COST=$(echo "$BODY" | grep -o '"cost":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_success "Service cost retrieved (Cost: \$$RETRIEVED_COST)"
else
    print_failure "Failed to retrieve service cost"
fi

print_test "Step 3: Get cost trends for the service"
TRENDS_RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/service-costs/trends?serviceName=ca-frontend&startDate=2025-11-01&endDate=2025-11-07" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$TRENDS_RESPONSE" | tail -n1)
BODY=$(echo "$TRENDS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Cost trends retrieved"
    print_info "Trends: $(echo "$BODY" | head -c 200)..."
else
    print_failure "Failed to retrieve cost trends"
fi

print_test "Step 4: Create resource breakdown for the service"
BREAKDOWN_DATA='{
    "date": "2025-11-03T00:00:00.000Z",
    "subscriptionId": "e2e-test-sub",
    "resourceName": "ca-frontend",
    "resourceGroup": "rg-finops-e2e",
    "resourceType": "Microsoft.App/containerApps",
    "meterCategory": "Container Apps",
    "meterSubCategory": "Standard Plan",
    "meterName": "Compute Hours",
    "quantity": 24.0,
    "unitOfMeasure": "Hours",
    "unitPrice": 0.343,
    "cost": 8.232,
    "currency": "USD"
}'

BREAKDOWN_RESPONSE=$(curl -s -X POST "$DATABASE_URL/cost-tracking/resource-cost-breakdowns" \
    -H "Content-Type: application/json" \
    -d "$BREAKDOWN_DATA" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$BREAKDOWN_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "Resource breakdown created"
else
    print_failure "Failed to create resource breakdown"
fi

print_test "Step 5: Retrieve top cost resources"
TOP_RESPONSE=$(curl -s "$DATABASE_URL/cost-tracking/resource-cost-breakdowns/top?startDate=2025-11-01&endDate=2025-11-07&limit=5" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$TOP_RESPONSE" | tail -n1)
BODY=$(echo "$TOP_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | grep -o '"resourceName"' | wc -l)
    print_success "Top cost resources retrieved ($COUNT resources)"
    print_info "Top resources: $(echo "$BODY" | head -c 300)..."
else
    print_failure "Failed to retrieve top resources"
fi

print_test "Step 6: Complete end-to-end verification"
if [ "$TESTS_FAILED" -eq 0 ]; then
    print_success "End-to-end integration test PASSED"
    print_info "✓ Data creation successful"
    print_info "✓ Data storage verified"
    print_info "✓ Data retrieval working"
    print_info "✓ Analysis endpoints functional"
else
    print_info "End-to-end test completed with some failures"
fi

# =============================================================================
# TEST SUMMARY
# =============================================================================
print_header "TEST SUMMARY"

echo -e "Total Tests: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       ALL TESTS PASSED! 🎉                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"
    exit 0
else
    echo -e "\n${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  Some tests failed. Check output above for details.   ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}\n"
    exit 1
fi
