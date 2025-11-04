#!/bin/bash

# Simplified End-to-End Cost Tracking Test Suite
# Tests the complete cost tracking implementation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URLs
DATABASE_URL="http://localhost:3002"
AI_URL="http://localhost:3004"

# Counters
PASS=0
FAIL=0

test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_code=$5
    
    echo -e "${YELLOW}Testing:${NC} $name"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        echo "$body" | head -c 150
        echo ""
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
        FAIL=$((FAIL + 1))
        echo "$body"
    fi
    echo ""
}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Cost Tracking End-to-End Test Suite                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

# Test 1: Service Costs
echo -e "${BLUE}=== Test 1: Service Cost Tracking ===${NC}\n"

test_api "Create Service Cost" "POST" "$DATABASE_URL/cost-tracking/service-costs" \
'{
  "serviceName": "ca-ai-service",
  "serviceType": "CONTAINER_APP",
  "date": "2025-11-03T00:00:00.000Z",
  "cost": 12.4567,
  "currency": "USD",
  "subscriptionId": "test-sub-123",
  "resourceGroup": "rg-finops-test",
  "region": "eastus",
  "billingPeriod": "2025-11"
}' "201"

test_api "Get Service Costs" "GET" "$DATABASE_URL/cost-tracking/service-costs?serviceName=ca-ai-service" "" "200"

test_api "Get Service Cost Summary" "GET" "$DATABASE_URL/cost-tracking/service-costs/summary?billingPeriod=2025-11" "" "200"

# Test 2: AI Usage Costs
echo -e "${BLUE}=== Test 2: AI Usage Cost Tracking ===${NC}\n"

test_api "Create AI Usage Cost" "POST" "$DATABASE_URL/cost-tracking/ai-usage-costs" \
'{
  "conversationId": "test-conv-456",
  "userId": "test-user-789",
  "modelName": "gemini-2.0-flash-exp",
  "promptTokens": 1500,
  "completionTokens": 800,
  "totalTokens": 2300,
  "cost": 0.088125,
  "timestamp": "2025-11-03T12:00:00.000Z",
  "toolsUsed": ["azure_cost_analysis"]
}' "201"

test_api "Get AI Usage Costs" "GET" "$DATABASE_URL/cost-tracking/ai-usage-costs?userId=test-user-789" "" "200"

test_api "Get User AI Cost Summary" "GET" "$DATABASE_URL/cost-tracking/ai-usage-costs/test-user-789/summary" "" "200"

# Test 3: Resource Breakdowns
echo -e "${BLUE}=== Test 3: Resource Cost Breakdowns ===${NC}\n"

test_api "Create Resource Breakdown" "POST" "$DATABASE_URL/cost-tracking/resource-cost-breakdowns" \
'{
  "date": "2025-11-03T00:00:00.000Z",
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
}' "201"

test_api "Get Resource Breakdowns" "GET" "$DATABASE_URL/cost-tracking/resource-cost-breakdowns?resourceName=ca-ai-service" "" "200"

test_api "Get Top Cost Resources" "GET" "$DATABASE_URL/cost-tracking/resource-cost-breakdowns/top?startDate=2025-11-01&endDate=2025-11-07&limit=10" "" "200"

# Test 4: User Cost Allocations
echo -e "${BLUE}=== Test 4: User Cost Allocation ===${NC}\n"

test_api "Create User Cost Allocation" "POST" "$DATABASE_URL/cost-tracking/user-cost-allocations" \
'{
  "userId": "test-user-999",
  "date": "2025-11-03T00:00:00.000Z",
  "allocatedCost": 25.50,
  "currency": "USD",
  "allocationMethod": "AI_USAGE"
}' "201"

test_api "Get User Cost Allocations" "GET" "$DATABASE_URL/cost-tracking/user-cost-allocations/test-user-999" "" "200"

test_api "Calculate User Daily Costs" "POST" "$DATABASE_URL/cost-tracking/user-cost-allocations/test-user-999/calculate" \
'{
  "date": "2025-11-03T00:00:00.000Z"
}' "201"

# Test 5: AI Chat Integration (triggers automatic cost tracking)
echo -e "${BLUE}=== Test 5: AI Chat with Automatic Cost Tracking ===${NC}\n"

test_api "Send AI Chat Message" "POST" "$AI_URL/chat/message" \
'{
  "conversationId": "e2e-test-conv",
  "userId": "e2e-test-user",
  "message": "What are the top 3 Azure services by cost?",
  "useTools": false
}' "201"

echo "Waiting 3 seconds for async cost tracking..."
sleep 3

test_api "Verify AI Cost was Tracked" "GET" "$DATABASE_URL/cost-tracking/ai-usage-costs?conversationId=e2e-test-conv" "" "200"

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "Total Tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}\n"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED! 🎉${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Check output above.${NC}\n"
    exit 1
fi
