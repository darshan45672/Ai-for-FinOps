#!/bin/bash

# Response Formatting Validation Test
# Tests the new formatting enhancement with real Azure queries

echo "=========================================="
echo "Response Formatting Enhancement Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AI_SERVICE_URL="http://localhost:3004"
AUTH_SERVICE_URL="http://localhost:3001"

# Test user credentials
TEST_EMAIL="testuser@test.com"
TEST_PASSWORD="Test123!@#"

echo -e "${BLUE}Step 1: Login and get JWT token${NC}"
echo "--------------------------------------------"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "${AUTH_SERVICE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

JWT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$JWT_TOKEN" == "null" ] || [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get JWT token${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Successfully obtained JWT token${NC}"
echo ""

# Get user ID
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.userId')
echo "User ID: $USER_ID"
echo ""

echo -e "${BLUE}Step 2: Test Formatting - Large Resource Group List${NC}"
echo "--------------------------------------------"
echo "Query: 'List all my Azure resource groups'"
echo ""

# Note: This test assumes you have WebSocket connection
# For HTTP testing, we'll create a simple test

# Create a test file to simulate the query
cat > /tmp/test-formatting.js << 'EOF'
const io = require('socket.io-client');

const socket = io('http://localhost:3004', {
  transports: ['websocket'],
  reconnection: false
});

const userId = process.argv[2];
const message = process.argv[3];

socket.on('connect', () => {
  console.log('Connected to AI service');
  
  socket.emit('chat_message', {
    userId: userId,
    message: message,
    timestamp: new Date().toISOString()
  });
});

socket.on('chat_response', (data) => {
  console.log('\n========== AI RESPONSE ==========');
  console.log(data.response);
  console.log('=================================\n');
  
  // Check for formatting indicators
  const response = data.response;
  const hasFormatting = 
    response.includes('**') ||        // Bold text
    response.includes('📍') ||        // Location emoji
    response.includes('💡') ||        // Insight emoji
    response.includes('|') ||         // Table
    response.includes('###') ||       // Headers
    response.includes('- **');        // Formatted lists
  
  if (hasFormatting) {
    console.log('✅ Response contains formatted elements');
  } else {
    console.log('❌ Response does not appear to be formatted');
  }
  
  // Check if it's NOT a raw comma-separated list
  const isRawList = 
    response.includes(', ') && 
    !response.includes('**') && 
    !response.includes('\n');
  
  if (isRawList) {
    console.log('❌ Response appears to be a raw comma-separated list');
  } else {
    console.log('✅ Response is NOT a raw comma-separated list');
  }
  
  socket.disconnect();
  process.exit(0);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  process.exit(1);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.error('Timeout waiting for response');
  process.exit(1);
}, 60000);
EOF

echo -e "${YELLOW}Note: This is a manual test. Please perform the following:${NC}"
echo ""
echo "1. Open your browser to: http://localhost:3000"
echo "2. Login with: $TEST_EMAIL / $TEST_PASSWORD"
echo "3. In the chat, send: 'List all my Azure resource groups'"
echo ""
echo "Expected formatted response should include:"
echo "  ✅ Bold headers (** **)"
echo "  ✅ Emojis (📍 💡 🏷️ ⚙️)"
echo "  ✅ Grouped by location"
echo "  ✅ Common naming patterns"
echo "  ✅ Summary statistics"
echo "  ✅ Suggested next steps"
echo ""
echo "It should NOT include:"
echo "  ❌ Raw comma-separated list: 'Az-CI-test, AzureBackupRG_eastus2_1, ...'"
echo ""

echo -e "${BLUE}Step 3: Additional Test Queries${NC}"
echo "--------------------------------------------"
echo ""
echo "Test these queries in the chat interface:"
echo ""
echo "1. Resource Groups (Small List):"
echo "   Query: 'Show me resource groups in East US'"
echo "   Expected: Numbered list with details (if < 20 items)"
echo ""
echo "2. Virtual Machines:"
echo "   Query: 'Show me all virtual machines'"
echo "   Expected: Table format with Status, Location, Cost"
echo ""
echo "3. Cost Analysis:"
echo "   Query: 'What were my Azure costs last month?'"
echo "   Expected: Cost summary with breakdown and trends"
echo ""
echo "4. Recommendations:"
echo "   Query: 'How can I optimize my Azure costs?'"
echo "   Expected: Formatted list with savings and actions"
echo ""

echo -e "${BLUE}Step 4: Validation Checklist${NC}"
echo "--------------------------------------------"
echo ""
echo "For each test query, verify:"
echo ""
echo "[ ] Response uses Markdown formatting (**, ###, tables)"
echo "[ ] Response includes emojis for visual scanning"
echo "[ ] Large lists (50+) are summarized, not dumped"
echo "[ ] Data is grouped by location/status/type"
echo "[ ] Response includes suggested next steps"
echo "[ ] Response looks professional and readable"
echo "[ ] NO raw comma-separated lists"
echo ""

echo -e "${GREEN}=========================================="
echo "Test Setup Complete"
echo "==========================================${NC}"
echo ""
echo "Please manually test in the browser and validate the formatting."
echo ""
echo -e "${YELLOW}Pro Tip:${NC} Take screenshots of before/after for documentation"
echo ""

# Cleanup
rm -f /tmp/test-formatting.js
