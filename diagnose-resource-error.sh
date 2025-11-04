#!/bin/bash

# Quick diagnostic script to check the resource save error
# Run this after triggering the sync

echo "Checking recent resource sync errors..."
echo ""

# Test a single resource save directly
echo "Testing direct resource save to database..."

curl -s -X POST http://localhost:3002/azure/resources \
  -H "Content-Type: application/json" \
  -d '{
    "resources": [{
      "resourceId": "/subscriptions/test/resourceGroups/test/providers/Microsoft.Web/sites/test",
      "name": "test-app",
      "type": "WEB_APP",
      "resourceType": "Microsoft.Web/sites",
      "location": "eastus",
      "resourceGroup": "test-rg",
      "subscriptionId": "test-subscription-id",
      "status": "RUNNING",
      "sku": "S1",
      "tags": {},
      "properties": {}
    }]
  }' | jq '.'

echo ""
echo "If you see an error above, that's the issue."
echo "Check the backend terminal for detailed error logs with:"
echo "  - Response status"
echo "  - Response data"
echo "  - Request data"
