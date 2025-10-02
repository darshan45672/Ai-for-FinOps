# AI-FinOps Microservices Architecture

## Overview

AI-FinOps is built using a microservices architecture with four independent services that communicate via RESTful APIs. Each service has a specific responsibility and can be developed, deployed, and scaled independently.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI-FinOps Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐                                             │
│  │   Frontend     │  Next.js 15 (Port 3003)                     │
│  │   Service      │                                              │
│  └────────┬───────┘                                             │
│           │                                                      │
│           │ HTTP Requests                                        │
│           │                                                      │
│      ┌────▼──────────┬──────────────┬──────────────┐           │
│      │               │              │              │            │
│  ┌───▼──────────┐ ┌──▼─────────┐ ┌─▼────────────┐ │           │
│  │Authentication│ │  Backend   │ │   Database   │ │           │
│  │   Service    │ │  Service   │ │   Service    │ │           │
│  │ (Port 3001)  │ │(Port 3000) │ │ (Port 3002)  │ │           │
│  └──────┬───────┘ └────┬───────┘ └──────┬───────┘ │           │
│         │              │                 │         │            │
│         │              │                 │         │            │
│         └──────────────┴─────────────────┘         │            │
│                        │                            │            │
│                        │ Prisma ORM                 │            │
│                        │                            │            │
│               ┌────────▼────────────────────────────▼─────┐     │
│               │   Neon Serverless PostgreSQL Database     │     │
│               └───────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### 1. Frontend Service (Port 3003)

**Technology**: Next.js 15, React, TailwindCSS, shadcn/ui  
**Responsibility**: User interface and client-side logic

**Key Features**:
- Server-side rendering (SSR) and static generation
- Authentication UI (login, register, forgot password)
- Chat interface for AI interactions
- Responsive design with dark/light mode
- Theme management

**API Consumption**:
- Calls Authentication Service for auth operations
- Calls Backend Service for business logic
- Manages JWT tokens in localStorage/cookies

**Environment Variables**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
```

### 2. Authentication Service (Port 3001)

**Technology**: NestJS 11, Passport.js, JWT, bcrypt  
**Responsibility**: User authentication and authorization

**Key Features**:
- User registration and login
- JWT token generation and validation
- Refresh token management
- Password hashing with bcrypt
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Swagger API documentation

**Database Operations**:
- Communicates with Database Service via HTTP
- No direct database access
- Uses DatabaseClientService for all data operations

**Environment Variables**:
```env
DATABASE_SERVICE_URL=http://database:3002
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
```

**API Endpoints**:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get user profile
- `GET /auth/health` - Health check

### 3. Database Service (Port 3002)

**Technology**: NestJS 11, Prisma ORM, Neon PostgreSQL  
**Responsibility**: All database operations and data management

**Key Features**:
- User CRUD operations
- Refresh token management
- Session management
- Data validation with DTOs
- Prisma migrations
- Swagger API documentation

**Database**:
- Direct connection to Neon PostgreSQL
- Prisma ORM for type-safe queries
- Migration management
- Schema versioning

**Environment Variables**:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db
DIRECT_URL=postgresql://user:pass@ep-xxx.neon.tech/db
PORT=3002
FRONTEND_URL=http://localhost:3003
```

**API Endpoints**:

**Users**:
- `POST /users` - Create user
- `GET /users` - List users
- `GET /users/:id` - Get user by ID
- `GET /users/email/:email` - Get user by email
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (soft delete)

**Refresh Tokens**:
- `POST /refresh-tokens` - Create refresh token
- `GET /refresh-tokens/:token` - Get refresh token
- `DELETE /refresh-tokens/:token` - Delete refresh token
- `DELETE /refresh-tokens/user/:userId` - Delete all user tokens
- `POST /refresh-tokens/cleanup` - Clean expired tokens

**Sessions**:
- `POST /sessions` - Create session
- `GET /sessions/user/:userId` - Get user sessions
- `DELETE /sessions/:id` - Delete session
- `DELETE /sessions/user/:userId` - Delete all user sessions
- `POST /sessions/cleanup` - Clean expired sessions

### 4. Backend Service (Port 3000)

**Technology**: NestJS 11  
**Responsibility**: Business logic and AI integrations

**Key Features**:
- AI/ML model integrations
- FinOps calculations and analytics
- Cost optimization recommendations
- Business logic processing

**Future Integrations**:
- Cloud provider APIs (AWS, Azure, GCP)
- AI/ML models for cost prediction
- Reporting and analytics
- Third-party integrations

**Environment Variables**:
```env
DATABASE_SERVICE_URL=http://database:3002
AUTH_SERVICE_URL=http://authentication:3001
PORT=3000
```

## Data Flow

### Authentication Flow

```
1. User submits credentials to Frontend
   ↓
2. Frontend sends POST /auth/login to Authentication Service
   ↓
3. Authentication Service requests user data from Database Service
   ↓
4. Database Service queries Neon PostgreSQL and returns user
   ↓
5. Authentication Service validates password and generates JWT
   ↓
6. Authentication Service stores refresh token via Database Service
   ↓
7. Authentication Service returns tokens to Frontend
   ↓
8. Frontend stores tokens and includes in subsequent requests
```

### Protected Resource Access Flow

```
1. Frontend sends request with JWT to Backend Service
   ↓
2. Backend Service validates JWT (or calls Auth Service)
   ↓
3. Backend Service requests data from Database Service
   ↓
4. Database Service queries database and returns data
   ↓
5. Backend Service processes and returns to Frontend
```

## Communication

### Service-to-Service Communication

All services communicate via HTTP/REST APIs:

```typescript
// Authentication Service → Database Service
const user = await fetch('http://database:3002/users/email/user@example.com');

// Backend Service → Database Service
const data = await fetch('http://database:3002/users');

// Backend Service → Authentication Service
const validToken = await fetch('http://authentication:3001/auth/validate');
```

### Docker Internal Networking

Services use Docker container names for communication:

```yaml
# docker-compose.yml
authentication:
  environment:
    DATABASE_SERVICE_URL: http://database:3002
  depends_on:
    - database

backend:
  environment:
    DATABASE_SERVICE_URL: http://database:3002
    AUTH_SERVICE_URL: http://authentication:3001
  depends_on:
    - database
    - authentication
```

## Database Schema

### User Table
```sql
CREATE TABLE "User" (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT,
  role        TEXT DEFAULT 'USER',
  status      TEXT DEFAULT 'ACTIVE',
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

### RefreshToken Table
```sql
CREATE TABLE "RefreshToken" (
  id          TEXT PRIMARY KEY,
  token       TEXT UNIQUE NOT NULL,
  user_id     TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Session Table
```sql
CREATE TABLE "Session" (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

## Deployment

### Local Development with Podman

```bash
# Build all services
podman-compose build

# Start all services
podman-compose up -d

# Check status
podman-compose ps

# View logs
podman-compose logs -f [service_name]
```

### Individual Service Development

```bash
# Database Service
cd database
npm run start:dev

# Authentication Service
cd authentication
npm run start:dev

# Backend Service
cd backend
npm run start:dev

# Frontend Service
cd frontend
npm run dev
```

## Environment Configuration

### Root .env File

```env
# Database
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (if using)
REDIS_PASSWORD="redis_password"

# Frontend URLs
CORS_ORIGIN="http://localhost:3003"
FRONTEND_URL="http://localhost:3003"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_AUTH_URL="http://localhost:3001"
```

## Development Workflow

### Adding New Features

1. **Database Schema Changes**:
   ```bash
   cd database
   # Edit prisma/schema.prisma
   npm run prisma:migrate
   ```

2. **API Endpoints** (Database Service):
   ```bash
   # Add DTOs in src/users/dto/
   # Add service methods in src/users/users.service.ts
   # Add controller endpoints in src/users/users.controller.ts
   ```

3. **Authentication Logic** (Authentication Service):
   ```bash
   # Update src/auth/auth.service.ts
   # Update database client calls
   ```

4. **Business Logic** (Backend Service):
   ```bash
   # Add modules, controllers, services
   # Call Database/Auth services as needed
   ```

5. **UI** (Frontend):
   ```bash
   # Add components in components/
   # Add pages in app/
   # Call backend APIs
   ```

## Testing

### API Testing with Swagger

- **Database Service**: http://localhost:3002/api/docs
- **Authentication Service**: http://localhost:3001/api/docs

### Manual Testing

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

## Monitoring and Health Checks

All services expose health check endpoints:

```bash
# Frontend
curl http://localhost:3003

# Authentication
curl http://localhost:3001/auth/health

# Database
curl http://localhost:3002/health

# Backend
curl http://localhost:3000/health
```

Docker health checks are configured in docker-compose.yml.

## Security Considerations

1. **JWT Tokens**:
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Tokens stored in database for revocation

2. **Password Security**:
   - bcrypt hashing with salt rounds
   - Minimum 8 characters
   - No plain text storage

3. **CORS**:
   - Configured per service
   - Whitelist specific origins

4. **Environment Variables**:
   - Never commit secrets
   - Use .env files
   - Different secrets per environment

5. **Network Security**:
   - Services communicate via internal Docker network
   - Only necessary ports exposed

## Troubleshooting

### Service Won't Start

```bash
# Check logs
podman logs [container_name]

# Check dependencies
podman-compose ps

# Restart service
podman restart [container_name]
```

### Database Connection Issues

```bash
# Test connection
cd database
npx prisma db pull

# Check environment
echo $DATABASE_URL
```

### Authentication Issues

```bash
# Check JWT secrets
cd authentication
cat .env | grep JWT

# Test database service
curl http://localhost:3002/health
```

## Documentation

- **Database Service**: `/database/DATABASE_SERVICE_GUIDE.md`
- **Authentication Service**: `/authentication/AUTHENTICATION_GUIDE.md`
- **API Documentation**: Swagger UI on each service
- **Branching Strategy**: `/docs/BRANCHING_STRATEGY.md`

## Support and Contributing

- Follow the branching strategy in `/docs/BRANCHING_STRATEGY.md`
- See `/CONTRIBUTING.md` for contribution guidelines
- Check `/CODE_OF_CONDUCT.md` for community standards

## Future Enhancements

- [ ] Add API Gateway for unified entry point
- [ ] Implement service mesh for better inter-service communication
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Implement centralized logging (ELK stack)
- [ ] Add message queue for async operations (RabbitMQ/Redis)
- [ ] Implement circuit breakers for resilience
- [ ] Add comprehensive test coverage
- [ ] Set up CI/CD pipelines
- [ ] Implement rate limiting
- [ ] Add monitoring and alerting (Prometheus/Grafana)
