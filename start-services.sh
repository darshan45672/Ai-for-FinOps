#!/bin/bash

# AI for FinOps - Start All Services
# This script starts Database, Authentication, and Frontend services

echo "🚀 Starting AI for FinOps Microservices..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "database" ] || [ ! -d "authentication" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "${BLUE}Step 1/3:${NC} Starting Database Service (Port 3002)..."
cd database
npm run start:dev > ../logs/database.log 2>&1 &
DATABASE_PID=$!
echo "  ✓ Database Service started (PID: $DATABASE_PID)"
cd ..

sleep 3

echo "${BLUE}Step 2/3:${NC} Starting Authentication Service (Port 3001)..."
cd authentication
npm run start:dev > ../logs/authentication.log 2>&1 &
AUTH_PID=$!
echo "  ✓ Authentication Service started (PID: $AUTH_PID)"
cd ..

sleep 3

echo "${BLUE}Step 3/3:${NC} Starting Frontend (Port 3003)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  ✓ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo "📱 Application URLs:"
echo "  Frontend:        http://localhost:3003"
echo "  Sign In:         http://localhost:3003/auth/signin"
echo "  Register:        http://localhost:3003/auth/register"
echo ""
echo "🔧 API Documentation:"
echo "  Auth Service:    http://localhost:3001/api/docs"
echo "  Database Service: http://localhost:3002/api/docs"
echo ""
echo "📊 Service Status:"
echo "  Database Service: PID $DATABASE_PID"
echo "  Auth Service:     PID $AUTH_PID"
echo "  Frontend:         PID $FRONTEND_PID"
echo ""
echo "${YELLOW}💡 To stop all services, run:${NC}"
echo "   kill $DATABASE_PID $AUTH_PID $FRONTEND_PID"
echo ""
echo "📝 Logs are available in the 'logs' directory"
echo ""

# Save PIDs to a file for easy stopping
mkdir -p logs
echo "DATABASE_PID=$DATABASE_PID" > logs/pids.txt
echo "AUTH_PID=$AUTH_PID" >> logs/pids.txt
echo "FRONTEND_PID=$FRONTEND_PID" >> logs/pids.txt

echo "⏳ Waiting for services to fully initialize (this may take 30-60 seconds)..."
sleep 10

echo "${GREEN}🎉 Ready to go! Open http://localhost:3003 in your browser${NC}"
