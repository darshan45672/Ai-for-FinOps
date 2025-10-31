#!/bin/bash

# Test script for Gemini AI improvements
# This script helps you test if the system instructions fix is working

echo "🧪 Gemini AI Test Script"
echo "========================"
echo ""

# Check if services are running
echo "📋 Pre-flight checks..."
echo ""

# Check database service
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Database service is running on port 3002"
else
    echo "❌ Database service is NOT running on port 3002"
    echo "   Start it with: cd database && npm run start:dev"
    exit 1
fi

# Check AI service
if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ AI service is running on port 3004"
else
    echo "❌ AI service is NOT running on port 3004"
    echo "   Start it with: cd ai && npm run start:dev"
    exit 1
fi

echo ""
echo "✅ All services are running!"
echo ""
echo "📝 Test Cases to Try:"
echo ""
echo "1. Basic Count Test:"
echo "   → 'How many resource groups do I have?'"
echo "   Expected: Returns count (219) with tool call"
echo ""
echo "2. List Test (THE FIX):"
echo "   → 'List all my resource groups'"
echo "   Expected: Should now work! Lists all 219 resource groups"
echo ""
echo "3. Filtered Resources:"
echo "   → 'Show me all virtual machines'"
echo "   Expected: Lists VMs with details"
echo ""
echo "4. Azure Summary:"
echo "   → 'Give me an overview of my Azure resources'"
echo "   Expected: Summary with counts by type/location"
echo ""
echo "5. Cost Query:"
echo "   → 'What are my Azure costs for October 2025?'"
echo "   Expected: Cost breakdown by service"
echo ""
echo "🔍 How to Verify Success:"
echo ""
echo "1. Check logs: tail -f ../logs/ai.log"
echo "   Look for: [ChatGeminiService] Executing function: get_resource_groups_count"
echo ""
echo "2. Check response:"
echo "   - Should NOT say 'I cannot list...'"
echo "   - Should NOT ask 'Would you like me to...'"
echo "   - SHOULD immediately use tools"
echo "   - SHOULD return actual data"
echo ""
echo "🚀 Ready to test! Open your chat interface and try the queries above."
echo ""
