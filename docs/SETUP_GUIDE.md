# AI-FinOps Setup Guide

Complete setup instructions for the AI-FinOps microservices platform.

## Prerequisites

- **Node.js**: v20 or higher
- **Podman**: v5.6.1 or higher (or Docker)
- **podman-compose**: v1.5.0 or higher
- **Neon Account**: For PostgreSQL database (https://console.neon.tech)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/darshan45672/Ai-for-FinOps.git
cd Ai-for-FinOps

# Checkout dev branch
git checkout dev
```

### 2. Configure Neon Database

1. Go to https://console.neon.tech
2. Create a new project
3. Copy your connection string (both pooled and direct)
4. The connection string format:
   ```
   postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
   ```

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```env
# Neon PostgreSQL Database
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# JWT Secrets (Change these in production!)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-characters"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS and Frontend
CORS_ORIGIN="http://localhost:3003"
FRONTEND_URL="http://localhost:3003"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_AUTH_URL="http://localhost:3001"

# Node Environment
NODE_ENV=development
```

### 4. Setup Database Service

```bash
cd database

# Install dependencies
npm install

# Copy root .env
cp ../.env .env

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Verify setup
npm run start:dev
```

Visit http://localhost:3002/api/docs to verify database service is running.

### 5. Setup Authentication Service

```bash
cd ../authentication

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_SERVICE_URL="http://database:3002"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-characters"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
EOF

# Verify setup
npm run start:dev
```

Visit http://localhost:3001/api/docs to verify authentication service is running.

### 6. Setup Backend Service

```bash
cd ../backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_SERVICE_URL="http://database:3002"
AUTH_SERVICE_URL="http://authentication:3001"
PORT=3000
NODE_ENV=development
EOF

# Start service
npm run start:dev
```

### 7. Setup Frontend Service

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_AUTH_URL="http://localhost:3001"
EOF

# Start frontend
npm run dev
```

Visit http://localhost:3003 to access the application.

## Docker/Podman Deployment

### Build All Services

```bash
# From root directory
podman-compose build
```

### Start All Services

```bash
podman-compose up -d
```

### Check Status

```bash
podman-compose ps
```

Expected output:
```
NAME                    IMAGE                    STATUS
ai-finops-frontend      localhost/frontend       Up (healthy)
ai-finops-backend       localhost/backend        Up (healthy)
ai-finops-auth          localhost/authentication Up (healthy)
ai-finops-database      localhost/database       Up (healthy)
ai-finops-postgres      postgres:16-alpine       Up (healthy)
ai-finops-redis         redis:7-alpine           Up (healthy)
```

### View Logs

```bash
# All services
podman-compose logs -f

# Specific service
podman-compose logs -f database
podman-compose logs -f authentication
```

### Stop Services

```bash
podman-compose down
```

## Verify Installation

### 1. Check Services

```bash
# Database Service
curl http://localhost:3002/health

# Authentication Service
curl http://localhost:3001/auth/health

# Backend Service
curl http://localhost:3000/health

# Frontend
curl http://localhost:3003
```

### 2. Test Authentication

```bash
# Register a user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### 3. Access API Documentation

- **Database Service**: http://localhost:3002/api/docs
- **Authentication Service**: http://localhost:3001/api/docs

## Development Workflow

### Running Individual Services

Each service can be run independently:

```bash
# Terminal 1: Database Service
cd database
npm run start:dev

# Terminal 2: Authentication Service
cd authentication
npm run start:dev

# Terminal 3: Backend Service
cd backend
npm run start:dev

# Terminal 4: Frontend
cd frontend
npm run dev
```

### Database Migrations

```bash
cd database

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npm run prisma:migrate

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npm run prisma:studio
```

### Building for Production

```bash
# Build all services
cd database && npm run build && cd ..
cd authentication && npm run build && cd ..
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Or use Docker
podman-compose build --no-cache
```

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to Neon database

**Solution**:
```bash
# 1. Verify DATABASE_URL format
echo $DATABASE_URL

# 2. Test connection
cd database
npx prisma db pull

# 3. Check Neon console
# Visit https://console.neon.tech and verify database is active
```

### Authentication Service Can't Reach Database Service

**Problem**: Error connecting to http://database:3002

**Solution**:
```bash
# 1. Check if database service is running
curl http://localhost:3002/health

# 2. For local development (not Docker), update DATABASE_SERVICE_URL
# In authentication/.env
DATABASE_SERVICE_URL="http://localhost:3002"

# 3. For Docker, verify network
podman network inspect ai-for-finops_finops-network
```

### Port Already in Use

**Problem**: Port 3000/3001/3002/3003 already in use

**Solution**:
```bash
# Find process using the port
lsof -ti:3001

# Kill the process
kill -9 $(lsof -ti:3001)

# Or change port in .env files
# database/.env: PORT=3012
# authentication/.env: PORT=3011
```

### Prisma Client Generation Fails

**Problem**: Cannot find Prisma Client

**Solution**:
```bash
cd database

# Regenerate Prisma Client
npm run prisma:generate

# If still fails, delete and reinstall
rm -rf node_modules
npm install
npm run prisma:generate
```

### Docker Build Fails

**Problem**: Docker build errors

**Solution**:
```bash
# Clean build
podman-compose down -v
podman system prune -a -f

# Rebuild without cache
podman-compose build --no-cache

# Check Dockerfile
cat database/Dockerfile
```

### JWT Token Errors

**Problem**: Invalid token or signature errors

**Solution**:
```bash
# 1. Ensure JWT secrets are consistent
# Check authentication/.env
grep JWT .env

# 2. Verify secrets are at least 32 characters
# 3. Ensure no extra spaces or quotes in .env

# 4. Restart authentication service
podman restart ai-finops-auth
```

## Service Ports

- **Frontend**: http://localhost:3003
- **Backend**: http://localhost:3000
- **Authentication**: http://localhost:3001
- **Database**: http://localhost:3002
- **PostgreSQL** (if using local): localhost:5432
- **Redis** (if using): localhost:6379

## Environment Variables Reference

### Root .env
```env
DATABASE_URL              # Neon PostgreSQL connection string
DIRECT_URL               # Neon direct connection string
JWT_SECRET               # Access token secret (32+ chars)
JWT_EXPIRES_IN           # Access token expiry (15m)
JWT_REFRESH_SECRET       # Refresh token secret (32+ chars)
JWT_REFRESH_EXPIRES_IN   # Refresh token expiry (7d)
CORS_ORIGIN             # Allowed CORS origin
FRONTEND_URL            # Frontend URL
NODE_ENV                # development/production
```

### Authentication Service
```env
DATABASE_SERVICE_URL     # Database service URL
JWT_SECRET              # Must match root .env
JWT_EXPIRES_IN          # Must match root .env
JWT_REFRESH_SECRET      # Must match root .env
JWT_REFRESH_EXPIRES_IN  # Must match root .env
PORT                    # Service port (3001)
```

### Database Service
```env
DATABASE_URL            # Neon connection string
DIRECT_URL             # Neon direct connection
PORT                   # Service port (3002)
FRONTEND_URL           # For CORS
```

### Backend Service
```env
DATABASE_SERVICE_URL    # Database service URL
AUTH_SERVICE_URL       # Authentication service URL
PORT                   # Service port (3000)
```

### Frontend Service
```env
NEXT_PUBLIC_API_URL         # Backend service URL
NEXT_PUBLIC_AUTH_URL        # Authentication service URL
```

## Next Steps

1. **Explore API Documentation**:
   - Database: http://localhost:3002/api/docs
   - Authentication: http://localhost:3001/api/docs

2. **Read Architecture Guide**:
   - `/docs/MICROSERVICES_ARCHITECTURE.md`

3. **Review Service Documentation**:
   - Database: `/database/DATABASE_SERVICE_GUIDE.md`
   - Authentication: `/authentication/AUTHENTICATION_GUIDE.md`

4. **Check Branching Strategy**:
   - `/docs/BRANCHING_STRATEGY.md`

5. **Contributing**:
   - `/CONTRIBUTING.md`

## Support

- **Issues**: Check service logs first
- **Documentation**: See `/docs` folder
- **API Testing**: Use Swagger UI
- **Database**: Use Prisma Studio (`npm run prisma:studio`)

## Production Checklist

- [ ] Change all JWT secrets to strong random strings
- [ ] Use production Neon database
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Review security settings
- [ ] Test all endpoints
- [ ] Load test services
- [ ] Document deployment procedure
