# 🚀 Quick Reference Card

## Service URLs

| Service | Local URL | API Docs | Port |
|---------|-----------|----------|------|
| Frontend | http://localhost:3003 | N/A | 3003 |
| Backend | http://localhost:3000 | - | 3000 |
| Authentication | http://localhost:3001 | [Swagger](http://localhost:3001/api/docs) | 3001 |
| Database | http://localhost:3002 | [Swagger](http://localhost:3002/api/docs) | 3002 |

## Quick Start

```bash
# Option 1: Podman (Recommended)
podman-compose up -d

# Option 2: Individual Services
cd database && npm run start:dev &
cd authentication && npm run start:dev &
cd backend && npm run start:dev &
cd frontend && npm run dev
```

## Common Commands

### Podman
```bash
# Build and start
podman-compose up -d --build

# Stop services
podman-compose down

# View logs
podman-compose logs -f [service_name]

# Restart service
podman restart ai-finops-[service_name]
```

### Database
```bash
cd database

# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database (dev only!)
npx prisma migrate reset
```

### Testing
```bash
# Test database service
curl http://localhost:3002/health

# Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## Environment Variables

### Root .env
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
JWT_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"
```

### Database Service (.env)
```env
DATABASE_URL="..." # Neon connection string
PORT=3002
```

### Authentication Service (.env)
```env
DATABASE_SERVICE_URL="http://database:3002"
JWT_SECRET="..." # Must match root
JWT_REFRESH_SECRET="..." # Must match root
PORT=3001
```

## Service Communication

```
Frontend (3003)
    │
    ├─→ Authentication (3001) ──→ Database (3002) ──→ Neon PostgreSQL
    │
    └─→ Backend (3000) ──────────→ Database (3002) ──→ Neon PostgreSQL
```

## Health Checks

```bash
# All services
curl http://localhost:3003  # Frontend
curl http://localhost:3000/health  # Backend
curl http://localhost:3001/auth/health  # Auth
curl http://localhost:3002/health  # Database
```

## Troubleshooting

### Can't connect to database
```bash
# Check if database service is running
curl http://localhost:3002/health

# Check Neon connection
cd database
npx prisma db pull
```

### Services can't communicate
```bash
# Check Docker network
podman network inspect ai-for-finops_finops-network

# For local dev (not Docker), update URLs in .env:
DATABASE_SERVICE_URL="http://localhost:3002"
```

### Port already in use
```bash
# Find and kill process
lsof -ti:3001
kill -9 $(lsof -ti:3001)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](SETUP_GUIDE.md) | Complete setup instructions |
| [Architecture](MICROSERVICES_ARCHITECTURE.md) | System design |
| [Database Service](../database/DATABASE_SERVICE_GUIDE.md) | Database API |
| [Authentication](../authentication/AUTHENTICATION_GUIDE.md) | Auth API |
| [Separation Summary](MICROSERVICES_SEPARATION.md) | What changed |

## Git Workflow

```bash
# Always work on dev branch
git checkout dev

# Create feature branch
git checkout -b feature/your-feature

# Commit and push
git add .
git commit -m "feat: your feature"
git push origin feature/your-feature

# Create PR to dev branch
```

See [Branching Strategy](BRANCHING_STRATEGY.md) for details.

## Key Files

```
Ai-for-FinOps/
├── docker-compose.yml          # Container orchestration
├── .env                        # Root environment config
├── authentication/
│   ├── .env                   # Auth service config
│   ├── src/auth/              # Auth logic
│   └── src/database-client/   # HTTP client for DB service
├── database/
│   ├── .env                   # Database config
│   ├── prisma/schema.prisma   # Database schema
│   └── src/users/             # User management API
├── backend/
│   └── src/                   # Business logic
└── frontend/
    ├── app/                   # Next.js pages
    └── components/            # React components
```

## Need Help?

1. Check service logs: `podman logs ai-finops-[service]`
2. Read documentation in `/docs`
3. Test APIs with Swagger UI
4. Check health endpoints
5. Verify environment variables

## Production Checklist

- [ ] Change all JWT secrets to strong random values
- [ ] Use production Neon database
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Review security settings
- [ ] Test all endpoints
- [ ] Load test services
