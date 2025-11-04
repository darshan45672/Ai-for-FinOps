#!/bin/bash

# Test Azure Resource Sync
# This script triggers the Azure resource sync and monitors the logs for errors

set -e

BACKEND_URL="http://localhost:3003"
DATABASE_URL="http://localhost:3002"

echo "======================================"
echo "Azure Resource Sync Error Diagnostics"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo -e "${YELLOW}[1/4] Checking service health...${NC}"
if ! curl -sf "${DATABASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Database service is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database service is healthy${NC}"

if ! curl -sf "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend service is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend service is healthy${NC}"
echo ""

# Check Azure credentials
echo -e "${YELLOW}[2/4] Checking Azure credentials...${NC}"
AZURE_CHECK=$(curl -s "${BACKEND_URL}/azure/subscriptions" | jq -r 'length')
if [ "$AZURE_CHECK" -eq "0" ] || [ "$AZURE_CHECK" == "null" ]; then
    echo -e "${RED}✗ Azure credentials not configured or invalid${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Azure credentials are configured (${AZURE_CHECK} subscriptions)${NC}"
echo ""

# Check current resource count
echo -e "${YELLOW}[3/4] Checking current database state...${NC}"
CURRENT_RESOURCES=$(curl -s "${DATABASE_URL}/azure/resources" | jq -r 'length')
echo -e "Current resources in database: ${CURRENT_RESOURCES}"
echo ""

# Trigger resource sync
echo -e "${YELLOW}[4/4] Triggering Azure resource sync...${NC}"
echo "This will fetch resources from Azure and save them to the database."
echo "Watch the backend service logs for detailed error messages."
echo ""

SYNC_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/azure/sync/resources")
echo "Sync triggered: $SYNC_RESPONSE"
echo ""

# Wait for sync to complete (resources sync runs in background)
echo -e "${YELLOW}Waiting for sync to complete (30 seconds)...${NC}"
sleep 30

# Check updated resource count
echo ""
echo -e "${YELLOW}Checking updated database state...${NC}"
UPDATED_RESOURCES=$(curl -s "${DATABASE_URL}/azure/resources" | jq -r 'length')
echo -e "Updated resources in database: ${UPDATED_RESOURCES}"
echo ""

# Check sync logs
echo -e "${YELLOW}Fetching recent sync logs...${NC}"
SYNC_LOGS=$(curl -s "${DATABASE_URL}/azure/sync-logs" | jq -r '.[-1]')
echo "Latest sync log:"
echo "$SYNC_LOGS" | jq '.'
echo ""

# Compare counts
NEW_RESOURCES=$((UPDATED_RESOURCES - CURRENT_RESOURCES))
if [ $NEW_RESOURCES -gt 0 ]; then
    echo -e "${GREEN}✓ Successfully synced ${NEW_RESOURCES} new resources${NC}"
else
    echo -e "${RED}✗ No new resources synced. Check backend logs for errors.${NC}"
    echo ""
    echo -e "${YELLOW}To view backend logs, check the terminal where backend service is running.${NC}"
    echo -e "${YELLOW}Look for ERROR messages from [AzureSchedulerService]${NC}"
fi

echo ""
echo "======================================"
echo "Diagnostics Complete"
echo "======================================"
