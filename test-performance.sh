#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     AI for FinOps - Performance Benchmark Tests               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
declare -a results

# Function to test endpoint performance
test_performance() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local target_ms="$5"
    local headers="$6"
    
    echo -e "${BLUE}Testing: $name${NC}"
    echo -e "Target: < ${target_ms}ms"
    
    # Run the test 3 times and get average
    local total=0
    local count=3
    
    for i in {1..3}; do
        if [ "$method" = "POST" ]; then
            local time=$(curl -X POST "$url" \
                -H "Content-Type: application/json" \
                $headers \
                -d "$data" \
                -s -o /dev/null -w '%{time_total}' 2>/dev/null)
        else
            local time=$(curl -X GET "$url" \
                $headers \
                -s -o /dev/null -w '%{time_total}' 2>/dev/null)
        fi
        
        # Convert to milliseconds
        local ms=$(echo "$time * 1000" | bc)
        total=$(echo "$total + $ms" | bc)
        echo "  Attempt $i: ${ms}ms"
    done
    
    # Calculate average
    local avg=$(echo "scale=2; $total / $count" | bc)
    echo -e "Average: ${avg}ms"
    
    # Check if it meets the target
    local passes=$(echo "$avg < $target_ms" | bc)
    if [ "$passes" -eq 1 ]; then
        echo -e "${GREEN}✅ PASS${NC} (${avg}ms < ${target_ms}ms)"
        results+=("PASS")
    else
        echo -e "${YELLOW}⚠️  SLOW${NC} (${avg}ms > ${target_ms}ms)"
        results+=("SLOW")
    fi
    echo ""
}

# Get auth token
echo "Getting authentication token..."
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"testuser@test.com","password":"Test123!@#"}' \
    -s | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token obtained${NC}"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Test 1: Simple Health Check (< 100ms)
test_performance \
    "Health Check (Simple)" \
    "http://localhost:3001/auth/health" \
    "GET" \
    "" \
    "100" \
    ""

# Test 2: Database Query (< 500ms)
test_performance \
    "Database Query (User Conversations)" \
    "http://localhost:3002/chat/conversations?userId=cmhftw7nq0000s84o3eh5mbg8" \
    "GET" \
    "" \
    "500" \
    "-H \"Authorization: Bearer $TOKEN\""

# Test 3: MCP Tool Discovery (< 1000ms)
test_performance \
    "MCP Tool Discovery" \
    "http://localhost:3004/mcp-gateway/discover" \
    "GET" \
    "" \
    "1000" \
    ""

# Test 4: Azure Resource Query (< 2000ms)
test_performance \
    "Azure Resource Query (MCP)" \
    "http://localhost:3004/mcp-gateway/execute" \
    "POST" \
    '{"toolName":"query_resources","parameters":{"query":"Resources | project name, type | limit 5"}}' \
    "2000" \
    ""

# Test 5: Authentication (< 500ms)
test_performance \
    "User Login (Authentication)" \
    "http://localhost:3001/auth/login" \
    "POST" \
    '{"email":"testuser@test.com","password":"Test123!@#"}' \
    "500" \
    ""

echo "════════════════════════════════════════════════════════════════"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    BENCHMARK SUMMARY                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Count results
pass_count=0
slow_count=0
for result in "${results[@]}"; do
    if [ "$result" = "PASS" ]; then
        ((pass_count++))
    else
        ((slow_count++))
    fi
done

total_tests=${#results[@]}

echo "Total Tests: $total_tests"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${YELLOW}Slow: $slow_count${NC}"
echo ""

# Calculate success rate
success_rate=$(echo "scale=2; $pass_count * 100 / $total_tests" | bc)
echo "Success Rate: ${success_rate}%"

if [ "$pass_count" -eq "$total_tests" ]; then
    echo -e "${GREEN}✅ All performance benchmarks met!${NC}"
elif [ "$pass_count" -ge 4 ]; then
    echo -e "${YELLOW}⚠️  Most benchmarks met, some optimization needed${NC}"
else
    echo -e "${RED}❌ Performance needs improvement${NC}"
fi

echo ""
