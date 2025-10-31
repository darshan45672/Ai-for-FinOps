#!/bin/bash

# Quick Restart Script for AI Service
# Run this after code changes to apply the latest fixes

echo "🔄 Restarting AI Service with Latest Fixes"
echo "=========================================="
echo ""

# Navigate to AI directory
cd "$(dirname "$0")/ai" || exit 1

echo "📍 Current directory: $(pwd)"
echo ""

# Check if service is running
if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  AI service is currently running on port 3004"
    echo "   Please stop it first (Ctrl+C in the running terminal)"
    echo ""
    echo "   Then run this script again, or manually start:"
    echo "   cd ai && npm run start:dev"
    exit 0
else
    echo "✅ Port 3004 is available"
fi

# Check if database service is running
if ! lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Database service is NOT running on port 3002"
    echo "   Start it first with: cd database && npm run start:dev"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""
echo "🚀 Starting AI service with enhanced system instructions..."
echo ""
echo "Expected behavior after this fix:"
echo "  ✅ AI calls tools immediately for Azure queries"
echo "  ✅ AI trusts and displays ALL tool results"
echo "  ✅ NO apologies like 'unable to list' or 'tool limitations'"
echo "  ✅ Confident presentation of complete data"
echo ""
echo "Test with: 'list all my resource groups'"
echo ""
echo "Starting service..."
echo "=================="
echo ""

npm run start:dev
