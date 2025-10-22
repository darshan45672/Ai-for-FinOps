#!/bin/bash

# Stop All Microservices Script

echo "=========================================="
echo "Stopping AI for FinOps Microservices"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Service ports
FRONTEND_PORT=3000
AUTH_PORT=3001
DATABASE_PORT=3002
BACKEND_PORT=3003

stop_service() {
    local port=$1
    local name=$2
    
    echo -n "Stopping ${name} (port ${port})... "
    
    if lsof -ti:$port > /dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
        if ! lsof -ti:$port > /dev/null 2>&1; then
            echo "${GREEN}✓ Stopped${NC}"
        else
            echo "${RED}✗ Failed to stop${NC}"
        fi
    else
        echo "${YELLOW}○ Not running${NC}"
    fi
}

stop_service $FRONTEND_PORT "Frontend"
stop_service $AUTH_PORT "Authentication"
stop_service $DATABASE_PORT "Database"
stop_service $BACKEND_PORT "Backend"

echo ""
echo "${GREEN}All services stopped${NC}"
echo ""
