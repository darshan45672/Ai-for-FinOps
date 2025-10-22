# Azure Integration - Quick Start Guide

## 🚀 Quick Start (3 Steps)

### 1. Start Services
```bash
# Terminal 1 - Database Service
cd database && npm run start:dev

# Terminal 2 - Backend Service  
cd backend && npm run start:dev
```

### 2. Configure (Optional - if not already set)
Edit `/backend/.env`:
```env
AZURE_SUBSCRIPTION_ID=your-subscription-id-here
```

### 3. Test
```bash
./test-azure-integration.sh
```

## 📋 Key Endpoints

### Backend Service (Port 3003)
```bash
# Test connection
curl http://localhost:3003/azure/test-connection

# Trigger syncs
curl -X POST http://localhost:3003/azure/sync/resources
curl -X POST http://localhost:3003/azure/sync/costs
```

### Database Service (Port 3002)
```bash
# View statistics
curl http://localhost:3002/azure/statistics

# View resources
curl http://localhost:3002/azure/resources

# View costs
curl http://localhost:3002/azure/costs/summary

# View sync logs
curl http://localhost:3002/azure/sync-logs?limit=5
```

## 🕐 Automatic Syncing

- **Hourly**: Resources synced every hour
- **Daily**: Costs synced at midnight

## 📁 Important Files

### Configuration
- `/backend/.env` - Azure credentials
- `/backend/.env.example` - Template

### Documentation
- `/docs/AZURE_INTEGRATION_SUMMARY.md` - Complete overview
- `/backend/AZURE_INTEGRATION_GUIDE.md` - Backend setup
- `/database/AZURE_API_REFERENCE.md` - API docs

### Code
- `/backend/src/azure/` - Azure integration (3 files)
- `/database/src/azure/` - Database API (3 files)

## 🔑 Azure Credentials (Already Configured)

✅ Configured in `/backend/.env`  
⚠️ Subscription ID: Needs to be set

To configure your Azure Service Principal:
1. Copy your credentials to `/backend/.env`
2. See `.env.example` for the required format

## 🛠️ Common Commands

```bash
# View Azure subscriptions
az account list --output table

# Check service status
curl http://localhost:3003/azure/status

# Manual resource sync
curl -X POST http://localhost:3003/azure/sync/resources

# View latest sync logs
curl http://localhost:3002/azure/sync-logs?limit=1

# View resource count by type
curl http://localhost:3002/azure/statistics | jq '.resourcesByType'

# View cost summary
curl http://localhost:3002/azure/costs/summary | jq
```

## ✅ What Works Now

1. ✅ Service Principal authentication
2. ✅ Fetch Azure subscriptions
3. ✅ Fetch all resources across subscriptions
4. ✅ Fetch cost data (last 30 days)
5. ✅ Store everything in PostgreSQL
6. ✅ Hourly/daily automatic syncing
7. ✅ Manual sync triggers
8. ✅ RESTful API to query data
9. ✅ Statistics and aggregations
10. ✅ Sync logging and error tracking

## 🎯 Next: Build Frontend

Now that the backend is complete, you can:

1. **View Real Data**: Use curl commands above
2. **Build Dashboards**: Create React components to visualize:
   - Resource inventory by type/location
   - Cost trends and breakdowns
   - Top spending services/resource groups
3. **Add Features**:
   - Cost alerts
   - Resource compliance checking
   - Optimization recommendations

## 📞 Need Help?

1. Check logs: Backend service shows sync progress
2. Review docs: `/docs/AZURE_INTEGRATION_SUMMARY.md`
3. Test connection: `curl http://localhost:3000/azure/test-connection`
4. Check database: View sync logs for errors
