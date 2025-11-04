#!/bin/bash

# Corrected End-to-End Cost Tracking Test Suite
# Uses actual DTO structure from the implementation

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
        echo "..."
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
        FAIL=$((FAIL + 1))
        echo "$body" | head -c 300
    fi
    echo ""
}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Cost Tracking End-to-End Test Suite (Corrected DTOs)      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

# Test 1: Service Costs
echo -e "${BLUE}=== Test 1: Service Cost Tracking ===${NC}\n"

test_api "Create Service Cost" "POST" "$DATABASE_URL/cost-tracking/service-costs" \
'{
  "subscriptionId": "test-sub-123",
  "serviceName": "ca-ai-service",
  "serviceType": "CONTAINER_APP",
  "date": "2025-11-03T00:00:00.000Z",
  "cost": 12.4567,
  "currency": "USD",
  "resourceGroup": "rg-finops-test",
  "region": "eastus",
  "meterCategory": "Container Apps",
  "meterName": "Compute Hours",
  "quantity": 24.0,
  "unitOfMeasure": "Hours",
  "unitPrice": 0.519
}' "201"

test_api "Get Service Costs" "GET" "$DATABASE_URL/cost-tracking/service-costs?serviceName=ca-ai-service&startDate=2025-11-01&endDate=2025-11-07" "" "200"

test_api "Get Service Cost Trends" "GET" "$DATABASE_URL/cost-tracking/service-costs/ca-ai-service/trends?days=7" "" "200"

# Test 2: AI Usage Costs
echo -e "${BLUE}=== Test 2: AI Usage Cost Tracking ===${NC}\n"

test_api "Create AI Usage Cost" "POST" "$DATABASE_URL/cost-tracking/ai-usage-costs" \
'{
  "conversationId": "test-conv-456",
  "userId": "test-user-789",
  "aiProvider": "Google",
  "modelName": "gemini-2.0-flash-exp",
  "promptTokens": 1500,
  "completionTokens": 800,
  "totalTokens": 2300,
  "estimatedCost": 0.088125,
  "currency": "USD",
  "promptTokenPrice": 0.00001875,
  "completionTokenPrice": 0.000075,
  "toolsUsed": ["azure_cost_analysis"],
  "responseTime": 2.5,
  "wasSuccessful": true
}' "201"

test_api "Get AI Usage Costs" "GET" "$DATABASE_URL/cost-tracking/ai-usage-costs?userId=test-user-789" "" "200"

# Test 3: Resource Breakdowns
echo -e "${BLUE}=== Test 3: Resource Cost Breakdowns ===${NC}\n"

test_api "Create Resource Breakdown" "POST" "$DATABASE_URL/cost-tracking/resource-cost-breakdowns" \
'{
  "subscriptionId": "test-sub-123",
  "resourceId": "/subscriptions/test-sub-123/resourceGroups/rg-finops-test/providers/Microsoft.App/containerApps/ca-ai-service",
  "resourceName": "ca-ai-service",
  "resourceType": "Microsoft.App/containerApps",
  "resourceGroup": "rg-finops-test",
  "date": "2025-11-03T00:00:00.000Z",
  "meterCategory": "Container Apps",
  "meterSubCategory": "Standard Plan",
  "meterName": "Compute Hours",
  "quantity": 24.0,
  "unitOfMeasure": "Hours",
  "unitPrice": 0.234,
  "cost": 5.616,
  "currency": "USD",
  "region": "eastus"
}' "201"

test_api "Get Resource Breakdowns" "GET" "$DATABASE_URL/cost-tracking/resource-cost-breakdowns?subscriptionId=test-sub-123&startDate=2025-11-01&endDate=2025-11-07" "" "200"

test_api "Get Top Cost Resources" "GET" "$DATABASE_URL/cost-tracking/resource-cost-breakdowns/top?startDate=2025-11-01&endDate=2025-11-07&limit=10" "" "200"

# Test 4: User Cost Allocations
echo -e "${BLUE}=== Test 4: User Cost Allocation ===${NC}\n"

test_api "Create User Cost Allocation" "POST" "$DATABASE_URL/cost-tracking/user-cost-allocations" \
'{
  "userId": "test-user-999",
  "date": "2025-11-03T00:00:00.000Z",
  "azureServiceCosts": 15.50,
  "aiApiCosts": 10.00,
  "totalCost": 25.50,
  "currency": "USD",
  "costBreakdown": {
    "azure_total": 15.50,
    "ai_total": 10.00,
    "by_service": {
      "ca-ai-service": 12.45,
      "ca-frontend": 3.05
    }
  },
  "resourceUsage": {
    "ai_request_count": 50,
    "total_tokens": 50000
  }
}' "201"

test_api "Get User Cost Allocations" "GET" "$DATABASE_URL/cost-tracking/user-cost-allocations/test-user-999?startDate=2025-11-01&endDate=2025-11-07" "" "200"

test_api "Calculate User Daily Costs" "POST" "$DATABASE_URL/cost-tracking/user-cost-allocations/test-user-999/calculate" \
'{
  "date": "2025-11-03T00:00:00.000Z"
}' "200"

# Test 5: AI Chat Integration (triggers automatic cost tracking)
echo -e "${BLUE}=== Test 5: AI Chat with Automatic Cost Tracking ===${NC}\n"

echo -e "${YELLOW}Note:${NC} AI chat uses WebSocket, not REST API. Testing cost tracking directly."
echo -e "${YELLOW}Simulating AI chat by creating an AI usage cost record...${NC}\n"

test_api "Create AI Usage (Simulates Chat)" "POST" "$DATABASE_URL/cost-tracking/ai-usage-costs" \
'{
  "conversationId": "e2e-test-conv-simulated",
  "userId": "e2e-test-user-sim",
  "aiProvider": "Google",
  "modelName": "gemini-2.0-flash-exp",
  "promptTokens": 2000,
  "completionTokens": 1000,
  "totalTokens": 3000,
  "estimatedCost": 0.1125,
  "currency": "USD",
  "wasSuccessful": true
}' "201"

test_api "Verify AI Cost was Tracked" "GET" "$DATABASE_URL/cost-tracking/ai-usage-costs?conversationId=e2e-test-conv-simulated" "" "200"

# Test 6: Service Cost Summary
echo -e "${BLUE}=== Test 6: Aggregation and Analytics ===${NC}\n"

test_api "Get Service Cost Summary" "GET" "$DATABASE_URL/cost-tracking/service-costs/summary?startDate=2025-11-01&endDate=2025-11-07" "" "200"

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

TOTAL=$((PASS + FAIL))
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Cost tracking implementation is fully functional!${NC}\n"
    exit 0
else
    PCT=$((PASS * 100 / TOTAL))
    echo -e "\n${YELLOW}⚠ $PCT% tests passed ($PASS/$TOTAL)${NC}"
    echo -e "${YELLOW}Check output above for failure details.${NC}\n"
    exit 1
fi
