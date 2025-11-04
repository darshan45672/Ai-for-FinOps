#!/bin/bash

# Test Cost Data Collection Flow
# ================================

set -e

BACKEND_URL="http://localhost:3003"
DATABASE_URL="http://localhost:3002"

echo "======================================"
echo "Cost Data Collection Diagnostics"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check services
echo -e "${YELLOW}[1/6] Checking services...${NC}"
curl -sf "${DATABASE_URL}/health" > /dev/null 2>&1 && echo -e "${GREEN}✓ Database service running${NC}" || echo -e "${RED}✗ Database service down${NC}"
curl -sf "${BACKEND_URL}/" > /dev/null 2>&1 && echo -e "${GREEN}✓ Backend service running${NC}" || echo -e "${RED}✗ Backend service down${NC}"
echo ""

# 2. Check Azure connection
echo -e "${YELLOW}[2/6] Checking Azure connection...${NC}"
AZURE_TEST=$(curl -s "${BACKEND_URL}/azure/test-connection")
echo "$AZURE_TEST" | jq '.'
echo ""

# 3. Check users in database
echo -e "${YELLOW}[3/6] Checking users...${NC}"
USER_COUNT=$(curl -s "${DATABASE_URL}/users" | jq '. | length')
echo -e "Users in database: ${USER_COUNT}"
echo ""

# 4. Check current cost records
echo -e "${YELLOW}[4/6] Current cost record counts...${NC}"
SERVICE_COSTS=$(curl -s "${DATABASE_URL}/cost-tracking/service-costs" | jq '. | length')
RESOURCE_BREAKDOWNS=$(curl -s "${DATABASE_URL}/cost-tracking/resource-cost-breakdowns" | jq '. | length')
OLD_COSTS=$(curl -s "${DATABASE_URL}/azure/costs" | jq '. | length')
OLD_SNAPSHOTS=$(curl -s "${DATABASE_URL}/azure/cost-snapshots" | jq '. | length')

echo -e "Service Costs (NEW): ${SERVICE_COSTS}"
echo -e "Resource Breakdowns (NEW): ${RESOURCE_BREAKDOWNS}"
echo -e "Old Cost Records: ${OLD_COSTS}"
echo -e "Old Cost Snapshots: ${OLD_SNAPSHOTS}"
echo ""

# 5. Trigger cost snapshot collection
echo -e "${YELLOW}[5/6] Triggering cost snapshot collection...${NC}"
echo -e "${GREEN}This will collect real cost data from Azure API${NC}"
TRIGGER_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/azure/sync/cost-snapshots")
echo "$TRIGGER_RESPONSE" | jq '.'
echo ""

echo -e "${YELLOW}Waiting 30 seconds for collection to complete...${NC}"
echo -e "${YELLOW}CHECK YOUR BACKEND TERMINAL for logs:${NC}"
echo -e "  - 'Starting daily cost snapshot collection with granular tracking...'"
echo -e "  - 'Collecting cost snapshots for X users'"
echo -e "  - 'Generating cost details report for subscription...'"
echo -e "  - 'Cost report generation started. Operation ID: ...'"
echo -e "  - 'Cost report ready. Download URL obtained.'"
echo -e "  - 'Parsed X cost records from CSV'"
echo -e "  - 'Saved service cost for...'"
echo -e "  - 'Saved resource breakdown for...'"
echo ""

for i in {30..1}; do
  echo -ne "  Waiting: $i seconds remaining...\r"
  sleep 1
done
echo ""

# 6. Check updated counts
echo -e "${YELLOW}[6/6] Checking updated cost record counts...${NC}"
SERVICE_COSTS_AFTER=$(curl -s "${DATABASE_URL}/cost-tracking/service-costs" | jq '. | length')
RESOURCE_BREAKDOWNS_AFTER=$(curl -s "${DATABASE_URL}/cost-tracking/resource-cost-breakdowns" | jq '. | length')
OLD_SNAPSHOTS_AFTER=$(curl -s "${DATABASE_URL}/azure/cost-snapshots" | jq '. | length')

echo -e "Service Costs (NEW): ${SERVICE_COSTS} → ${SERVICE_COSTS_AFTER}"
echo -e "Resource Breakdowns (NEW): ${RESOURCE_BREAKDOWNS} → ${RESOURCE_BREAKDOWNS_AFTER}"
echo -e "Old Cost Snapshots: ${OLD_SNAPSHOTS} → ${OLD_SNAPSHOTS_AFTER}"
echo ""

# Check if any new records were added
NEW_SERVICE_COSTS=$((SERVICE_COSTS_AFTER - SERVICE_COSTS))
NEW_BREAKDOWNS=$((RESOURCE_BREAKDOWNS_AFTER - RESOURCE_BREAKDOWNS))
NEW_SNAPSHOTS=$((OLD_SNAPSHOTS_AFTER - OLD_SNAPSHOTS))

if [ $NEW_SERVICE_COSTS -gt 0 ] || [ $NEW_BREAKDOWNS -gt 0 ]; then
    echo -e "${GREEN}✓ SUCCESS! Cost data was collected:${NC}"
    [ $NEW_SERVICE_COSTS -gt 0 ] && echo -e "  - ${NEW_SERVICE_COSTS} new service cost records"
    [ $NEW_BREAKDOWNS -gt 0 ] && echo -e "  - ${NEW_BREAKDOWNS} new resource breakdowns"
    [ $NEW_SNAPSHOTS -gt 0 ] && echo -e "  - ${NEW_SNAPSHOTS} new cost snapshots"
else
    echo -e "${RED}✗ NO NEW COST DATA COLLECTED${NC}"
    echo ""
    echo -e "${YELLOW}TROUBLESHOOTING:${NC}"
    echo -e "1. Check backend terminal for error messages"
    echo -e "2. Look for these errors:"
    echo -e "   - 'Failed to fetch cost data for subscription...'"
    echo -e "   - 'Cost report generation failed...'"
    echo -e "   - 'Failed to save service cost...'"
    echo -e "   - 'Failed to save resource breakdown...'"
    echo -e "3. Verify Azure credentials have Cost Management Reader role"
    echo -e "4. Check if subscription has any cost data for yesterday"
fi

echo ""
echo "======================================"
echo "Diagnostics Complete"
echo "======================================"
