# Microservices Port Configuration

This project uses a microservices architecture with the following port assignments:

## 🚀 Service Ports

| Service          | Port | URL                        | Purpose                           |
|------------------|------|----------------------------|-----------------------------------|
| **Frontend**     | 3000 | http://localhost:3000      | Next.js UI (React)                |
| **Authentication**| 3001 | http://localhost:3001      | Auth & OAuth (NestJS)             |
| **Database**     | 3002 | http://localhost:3002      | Data API & Prisma (NestJS)        |
| **Backend**      | 3003 | http://localhost:3003      | Azure Integration (NestJS)        |

## 📁 Service Configurations

### Frontend (Port 3000)
- **Framework**: Next.js 15.5.4 with React 19
- **Config File**: `frontend/package.json`
- **Environment**: `frontend/.env`
  ```env
  NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
  NEXT_PUBLIC_DATABASE_API_URL=http://localhost:3002
  NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3003
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- **Start Command**: `npm run dev` (runs on port 3000)

### Authentication Service (Port 3001)
- **Framework**: NestJS
- **Config File**: `authentication/.env`
- **Key Settings**:
  ```env
  PORT=3001
  DATABASE_SERVICE_URL=http://localhost:3002
  FRONTEND_URL=http://localhost:3000
  GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
  ```
- **Features**:
  - JWT authentication
  - GitHub OAuth
  - Session management
  - Password reset
- **Start Command**: `npm run start:dev`

### Database Service (Port 3002)
- **Framework**: NestJS with Prisma ORM
- **Database**: PostgreSQL (Neon - Cloud Hosted)
- **Config File**: `database/.env`
- **Key Settings**:
  ```env
  PORT=3002
  DATABASE_URL=postgresql://...
  ```
- **Features**:
  - User management
  - Azure resource data storage
  - Cost records
  - Sync logs
- **Start Command**: `npm run start:dev`

### Backend Service (Port 3003)
- **Framework**: NestJS
- **Config File**: `backend/.env`
- **Key Settings**:
  ```env
  PORT=3003
  DATABASE_SERVICE_URL=http://localhost:3002
  AZURE_TENANT_ID=...
  AZURE_CLIENT_ID=...
  AZURE_CLIENT_SECRET=...
  ```
- **Features**:
  - Azure SDK integration
  - Service Principal authentication
  - Scheduled cron jobs (hourly resources, daily costs)
  - Azure resource management
- **Start Command**: `npm run start:dev`

## 🔧 Quick Start

### Option 1: Automated Startup (Recommended)
```bash
# Make scripts executable
chmod +x start-services.sh stop-services.sh

# Start all services
./start-services.sh

# Stop all services
./stop-services.sh
```

### Option 2: Manual Startup
```bash
# Terminal 1 - Database Service (must start first)
cd database && npm run start:dev

# Terminal 2 - Authentication Service
cd authentication && npm run start:dev

# Terminal 3 - Backend Service
cd backend && npm run start:dev

# Terminal 4 - Frontend
cd frontend && npm run dev
```

## 🔍 Service Health Checks

### Check if services are running:
```bash
# Check all ports
lsof -i :3000 -i :3001 -i :3002 -i :3003

# Check specific service
curl http://localhost:3000  # Frontend
curl http://localhost:3001  # Authentication
curl http://localhost:3002  # Database
curl http://localhost:3003/azure/status  # Backend
```

### Test Azure Integration:
```bash
# Check Azure credentials
curl http://localhost:3003/azure/status

# Test Azure connection
curl http://localhost:3003/azure/test-connection

# Trigger manual sync
curl -X POST http://localhost:3003/azure/sync/resources
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :<port>

# Kill process
lsof -ti:<port> | xargs kill -9

# Example: Kill all services
lsof -ti:3000 -ti:3001 -ti:3002 -ti:3003 | xargs kill -9
```

### Service Won't Start
1. Check if port is available
2. Verify environment variables in `.env` files
3. Check logs in `logs/` directory
4. Ensure dependencies installed: `npm install`

### Database Connection Issues
1. Ensure Database Service (port 3002) is running first
2. Check DATABASE_SERVICE_URL in other services' .env files
3. Verify Prisma migration: `cd database && npx prisma migrate status`

## 📊 Service Dependencies

```
Frontend (3000)
    ├── → Authentication Service (3001)
    ├── → Database Service (3002)
    └── → Backend Service (3003)

Authentication Service (3001)
    └── → Database Service (3002)

Backend Service (3003)
    ├── → Database Service (3002)
    └── → Azure Cloud API

Database Service (3002)
    └── → PostgreSQL (Neon Cloud)
```

**Start Order**: Database → Authentication → Backend → Frontend

## 📝 Development Tips

### Hot Reload
All services support hot reload in development mode:
- **Frontend**: Next.js Turbopack (ultra-fast)
- **NestJS Services**: Watch mode with instant compilation

### Logs
When using the automated startup script, logs are saved to:
- `logs/frontend.log`
- `logs/authentication.log`
- `logs/database.log`
- `logs/backend.log`

View logs in real-time:
```bash
tail -f logs/backend.log
```

### Environment Variables
- Never commit `.env` files to git
- Use `.env.example` as templates
- Frontend env vars must start with `NEXT_PUBLIC_`

## 🔐 Security Notes

1. **Ports are for local development only**
2. **Production**: Use reverse proxy (Nginx) and SSL
3. **Credentials**: Rotate secrets regularly
4. **Azure**: Use Service Principal with minimal permissions
5. **Database**: Use connection pooling in production

## 📚 Additional Documentation

- [Azure Integration Guide](backend/AZURE_INTEGRATION_GUIDE.md)
- [Database API Reference](database/AZURE_API_REFERENCE.md)
- [Quick Start Guide](AZURE_QUICK_START.md)
- [Authentication Guide](authentication/AUTHENTICATION_GUIDE.md)

## 🎯 Next Steps

1. Start all services: `./start-services.sh`
2. Open frontend: http://localhost:3000
3. Test Azure integration: `./test-azure-integration.sh`
4. View Azure statistics: `curl http://localhost:3002/azure/statistics`
