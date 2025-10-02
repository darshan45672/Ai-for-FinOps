#!/bin/bash

echo "=== GitHub OAuth Integration Test ==="
echo ""

echo "1. Testing Authentication Service Health..."
AUTH_HEALTH=$(curl -s http://localhost:3001/auth/health)
echo "   Response: $AUTH_HEALTH"
echo ""

echo "2. Testing Database Service Health..."
DB_HEALTH=$(curl -s http://localhost:3002/)
echo "   Response: $DB_HEALTH"
echo ""

echo "3. Testing Frontend Service..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "   Status Code: $FRONTEND_STATUS"
echo ""

echo "4. Testing GitHub OAuth Redirect..."
GITHUB_REDIRECT=$(curl -s -I http://localhost:3001/auth/github | grep Location)
echo "   $GITHUB_REDIRECT"
echo ""

echo "5. Checking GitHub OAuth Configuration..."
echo "   Client ID: Ov23liBUL3wePbTzXoJB"
echo "   Callback URL: http://localhost:3001/auth/github/callback"
echo "   Frontend URL: http://localhost:3000"
echo ""

echo "6. Testing Database GitHub User Lookup Endpoint..."
DB_GITHUB=$(curl -s http://localhost:3002/users/github/test123)
echo "   Response: $DB_GITHUB"
echo ""

echo "7. Checking CORS Configuration..."
CORS_CHECK=$(curl -s -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -I http://localhost:3001/auth/health | grep -i "access-control")
echo "$CORS_CHECK"
echo ""

echo "=== Test Complete ==="
echo ""
echo "Next Steps:"
echo "1. Open your browser to: http://localhost:3000/auth/signin"
echo "2. Click the 'GitHub' button"
echo "3. You should be redirected to GitHub for authorization"
echo "4. After authorizing, you'll be redirected back to: http://localhost:3000/auth/callback"
echo ""
echo "If you see an error, please share:"
echo "- What error message appears"
echo "- At what step does it fail"
echo "- Browser console errors (F12 -> Console)"
