#!/bin/bash

# Microservices Startup Script
# This script starts all services on their designated ports

echo "=========================================="
echo "Starting AI for FinOps Microservices"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Service ports
FRONTEND_PORT=3000
AUTH_PORT=3001
DATABASE_PORT=3002
BACKEND_PORT=3003

# Kill any existing processes on these ports
echo "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
lsof -ti:$AUTH_PORT | xargs kill -9 2>/dev/null
lsof -ti:$DATABASE_PORT | xargs kill -9 2>/dev/null
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
sleep 2

echo ""
echo "${GREEN}Starting services...${NC}"
echo ""

# Start Database Service (must start first as other services depend on it)
echo "${BLUE}1. Starting Database Service on port ${DATABASE_PORT}...${NC}"
cd database
npm run start:dev > ../logs/database.log 2>&1 &
DATABASE_PID=$!
cd ..
sleep 3

# Start Authentication Service
echo "${BLUE}2. Starting Authentication Service on port ${AUTH_PORT}...${NC}"
cd authentication
npm run start:dev > ../logs/authentication.log 2>&1 &
AUTH_PID=$!
cd ..
sleep 3

# Start Backend Service
echo "${BLUE}3. Starting Backend Service on port ${BACKEND_PORT}...${NC}"
cd backend
npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Start Frontend
echo "${BLUE}4. Starting Frontend on port ${FRONTEND_PORT}...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo "${GREEN}=========================================="
echo "All services started successfully!"
echo "==========================================${NC}"
echo ""
echo "Service URLs:"
echo "  ${GREEN}Frontend:${NC}        http://localhost:${FRONTEND_PORT}"
echo "  ${GREEN}Authentication:${NC}  http://localhost:${AUTH_PORT}"
echo "  ${GREEN}Database:${NC}        http://localhost:${DATABASE_PORT}"
echo "  ${GREEN}Backend (Azure):${NC} http://localhost:${BACKEND_PORT}"
echo ""
echo "Process IDs:"
echo "  Database:       ${DATABASE_PID}"
echo "  Authentication: ${AUTH_PID}"
echo "  Backend:        ${BACKEND_PID}"
echo "  Frontend:       ${FRONTEND_PID}"
echo ""
echo "Logs are available in the 'logs/' directory"
echo ""
echo "To stop all services, run: ${YELLOW}./stop-services.sh${NC}"
echo ""
echo "Press Ctrl+C to view logs (services will continue running in background)"
echo ""

# Wait a bit and check if services are running
sleep 5

echo "${YELLOW}Checking service status...${NC}"
echo ""

check_service() {
    local port=$1
    local name=$2
    if lsof -i:$port > /dev/null 2>&1; then
        echo "  ${GREEN}✓${NC} ${name} is running on port ${port}"
    else
        echo "  ${RED}✗${NC} ${name} is NOT running on port ${port}"
    fi
}

check_service $FRONTEND_PORT "Frontend"
check_service $AUTH_PORT "Authentication"
check_service $DATABASE_PORT "Database"
check_service $BACKEND_PORT "Backend"

echo ""
echo "${GREEN}Setup complete!${NC}"
echo ""
