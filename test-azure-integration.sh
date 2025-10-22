#!/bin/bash

# Test Azure Integration
# This script tests the Azure cloud resource monitoring integration

echo "=========================================="
echo "Azure Integration Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:3003"
DATABASE_URL="http://localhost:3002"

# Check if services are running
echo "1. Checking if services are running..."
echo ""

# Check Backend Service
echo -n "   Backend Service (port 3003): "
if curl -s "$BACKEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "   Please start: cd backend && npm run start:dev"
fi

# Check Database Service
echo -n "   Database Service (port 3002): "
if curl -s "$DATABASE_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "   Please start: cd database && npm run start:dev"
fi

echo ""
echo "2. Testing Azure Configuration..."
echo ""

# Test Azure Status
echo "   Testing Azure credentials configuration..."
AZURE_STATUS=$(curl -s "$BACKEND_URL/azure/status")
echo "   Response: $AZURE_STATUS"

# Test Azure Connection
echo ""
echo "   Testing Azure connection..."
AZURE_CONNECTION=$(curl -s "$BACKEND_URL/azure/test-connection")
echo "   Response: $AZURE_CONNECTION"

echo ""
echo "3. Testing Database Service Endpoints..."
echo ""

# Test Statistics Endpoint
echo "   GET /azure/statistics"
curl -s "$DATABASE_URL/azure/statistics" | jq '.' || curl -s "$DATABASE_URL/azure/statistics"

echo ""
echo "4. Manual Sync Triggers..."
echo ""

echo "   Would you like to trigger a manual sync? (y/n)"
read -r TRIGGER_SYNC

if [ "$TRIGGER_SYNC" = "y" ]; then
    echo ""
    echo "   Triggering resource sync..."
    curl -X POST "$BACKEND_URL/azure/sync/resources"
    echo ""
    echo ""
    echo "   Triggering cost sync..."
    curl -X POST "$BACKEND_URL/azure/sync/costs"
    echo ""
    echo ""
    echo "   ${YELLOW}Check the logs for sync progress${NC}"
fi

echo ""
echo "5. Viewing Recent Sync Logs..."
echo ""
curl -s "$DATABASE_URL/azure/sync-logs?limit=5" | jq '.' || curl -s "$DATABASE_URL/azure/sync-logs?limit=5"

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. If Azure credentials are configured, test connection should succeed"
echo "2. Trigger manual syncs to test data flow"
echo "3. Check sync logs for success/failure status"
echo "4. View statistics to see synced resources and costs"
echo ""
echo "Monitor cron jobs:"
echo "- Resources sync: Every hour"
echo "- Costs sync: Daily at midnight"
echo ""
