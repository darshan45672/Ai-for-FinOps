#!/bin/bash

# Azure Resource Sync Error Fix Applied
# =====================================

cat << 'EOF'

✅ CHANGES APPLIED:

1. Enhanced error logging in backend/src/azure/azure-scheduler.service.ts:
   - saveSubscription(): Now logs response status, response data, and request data
   - saveResource(): Now logs response status, response data, and request data  
   - saveActivityLog(): Now logs response status, response data, and request data
   - saveResourceCostBreakdown(): Now logs response status, response data, and request data

2. Fixed error handling:
   - saveSubscription() now THROWS errors instead of swallowing them
   - This prevents resources from being saved when subscription fails
   - Root cause: Foreign key constraint - resources need existing subscriptions

3. Added RxJS catchError pattern (NestJS best practice):
   - Using catchError operator to log errors before they're thrown
   - Following official NestJS documentation for HttpService error handling

📋 WHAT TO CHECK:

Check the backend terminal (where you ran `npm run start:dev`) for:

1. Subscription save errors:
   - "Failed to save subscription: <error>"
   - Response status (e.g., 400, 500)
   - Response data (detailed error from database)
   - Request data (the subscription being saved)

2. Resource save errors:
   - "Failed to save resource: <error>"  
   - Response status
   - Response data
   - Request data (the resource being saved)

The detailed logs will show EXACTLY what's failing and why.

🔍 LIKELY ROOT CAUSES:

1. Foreign key constraint violation:
   - Resources reference subscriptions that don't exist
   - Fixed by making saveSubscription() throw errors

2. Database schema mismatch:
   - DTO fields don't match Prisma schema
   - Check logs for validation errors

3. Database connection issues:
   - Database service not running
   - Network timeout

4. Data type mismatches:
   - Enum values (e.g., AzureResourceType)
   - Required vs optional fields

Run this to trigger sync and watch logs:
  curl -X POST http://localhost:3003/azure/sync/resources

Then check your backend terminal for detailed error messages.

EOF
