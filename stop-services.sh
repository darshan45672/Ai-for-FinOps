#!/bin/bash

# AI for FinOps - Stop All Services
# This script stops Database, Authentication, and Frontend services

echo "🛑 Stopping AI for FinOps Microservices..."
echo ""

# Check if PIDs file exists
if [ ! -f "logs/pids.txt" ]; then
    echo "❌ No running services found (logs/pids.txt missing)"
    echo "   Services might have been stopped already or weren't started with start-services.sh"
    exit 1
fi

# Read PIDs from file
source logs/pids.txt

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local pid=$1
    local name=$2
    
    if ps -p $pid > /dev/null 2>&1; then
        echo "  Stopping $name (PID: $pid)..."
        kill $pid
        sleep 1
        
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            echo "  Force stopping $name..."
            kill -9 $pid
        fi
        echo "  ✓ $name stopped"
    else
        echo "  ℹ $name (PID: $pid) not running"
    fi
}

# Stop all services
stop_service $DATABASE_PID "Database Service"
stop_service $AUTH_PID "Authentication Service"
stop_service $FRONTEND_PID "Frontend"

# Clean up PIDs file
rm logs/pids.txt

echo ""
echo "${GREEN}✅ All services stopped successfully!${NC}"
echo ""
echo "📝 Logs are still available in the 'logs' directory"
echo "   To clear logs, run: rm -rf logs/*.log"
