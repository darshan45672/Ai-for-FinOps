# Database Service Documentation

## Overview

The Database Service is a dedicated microservice responsible for all database operations in the AI-FinOps platform. It uses Prisma ORM with Neon serverless PostgreSQL and exposes RESTful APIs for data access.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AI-FinOps Platform                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────┐      ┌─────────────────┐      │
│  │  Authentication │─────▶│    Database     │      │
│  │    Service      │      │    Service      │      │
│  │   (Port 3001)   │      │   (Port 3002)   │      │
│  └─────────────────┘      └────────┬────────┘      │
│           │                         │               │
│           │                         │               │
│  ┌────────▼─────────┐      ┌───────▼────────┐     │
│  │     Backend      │      │  Neon Postgres │     │
│  │    Service       │      │    Database    │     │
│  │   (Port 3000)    │      └────────────────┘     │
│  └──────────────────┘                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Features

- **User Management**: Complete CRUD operations for users
- **Refresh Token Management**: Token storage, validation, and cleanup
- **Session Management**: User session tracking and management
- **Data Validation**: Input validation using class-validator
- **API Documentation**: Swagger/OpenAPI documentation
- **Database Migrations**: Prisma migrations for schema management

## Technology Stack

- **Framework**: NestJS 11
- **ORM**: Prisma 6.16.3
- **Database**: Neon Serverless PostgreSQL
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Setup Instructions

### 1. Install Dependencies

```bash
cd database
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `database` directory:

```env
# Neon PostgreSQL Database
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# Server Configuration
PORT=3002
NODE_ENV=development
FRONTEND_URL="http://localhost:3003"
```

#### Getting Your Neon Database URL:

1. Go to https://console.neon.tech
2. Create a new project or select an existing one
3. Copy the connection string (both pooled and direct)
4. Update your `.env` file

### 3. Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create the database schema
- Generate Prisma Client
- Apply all migrations

### 4. Start the Service

#### Development Mode:
```bash
npm run start:dev
```

#### Production Mode:
```bash
npm run build
npm run start:prod
```

The service will start on `http://localhost:3002`

### 5. Access API Documentation

Once the service is running, visit:
- **Swagger UI**: http://localhost:3002/api/docs

## Database Schema

### User Model

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String
  name          String?
  role          UserRole       @default(USER)
  status        UserStatus     @default(ACTIVE)
  refreshTokens RefreshToken[]
  sessions      Session[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}
```

**Roles**: USER, ADMIN, SUPER_ADMIN  
**Statuses**: ACTIVE, INACTIVE, SUSPENDED, DELETED

### RefreshToken Model

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

### Session Model

```prisma
model Session {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  ipAddress String?
  userAgent String?
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

## API Endpoints

### User Endpoints

#### Create User
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "hashedPassword123",
  "name": "John Doe",
  "role": "USER"
}
```

#### Get All Users
```http
GET /users?skip=0&take=10
```

#### Get User by ID
```http
GET /users/:id
```

#### Get User by Email
```http
GET /users/email/:email
```

#### Update User
```http
PUT /users/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

#### Delete User (Soft Delete)
```http
DELETE /users/:id
```

### Refresh Token Endpoints

#### Create Refresh Token
```http
POST /refresh-tokens
Content-Type: application/json

{
  "token": "refresh_token_string",
  "userId": "user_id",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

#### Get Refresh Token
```http
GET /refresh-tokens/:token
```

#### Delete Refresh Token
```http
DELETE /refresh-tokens/:token
```

#### Delete All User's Refresh Tokens
```http
DELETE /refresh-tokens/user/:userId
```

#### Clean Expired Tokens
```http
POST /refresh-tokens/cleanup
```

### Session Endpoints

#### Create Session
```http
POST /sessions
Content-Type: application/json

{
  "userId": "user_id",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

#### Get User Sessions
```http
GET /sessions/user/:userId
```

#### Delete Session
```http
DELETE /sessions/:id
```

#### Delete All User's Sessions
```http
DELETE /sessions/user/:userId
```

#### Clean Expired Sessions
```http
POST /sessions/cleanup
```

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:prod

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Managing Migrations

#### Create a New Migration:
```bash
cd database
npx prisma migrate dev --name your_migration_name
```

#### Apply Migrations in Production:
```bash
npx prisma migrate deploy
```

#### Reset Database (Development Only):
```bash
npx prisma migrate reset
```

## Integration with Other Services

### Authentication Service Integration

The Authentication Service calls the Database Service APIs:

```typescript
// In Authentication Service
const user = await fetch('http://database:3002/users/email/user@example.com')
  .then(res => res.json());
```

### Docker Networking

Services communicate via Docker internal network:

```yaml
# docker-compose.yml
authentication:
  environment:
    DATABASE_SERVICE_URL: http://database:3002
  depends_on:
    database:
      condition: service_healthy
```

## Error Handling

The service returns standard HTTP status codes:

- **200**: Success
- **201**: Created
- **204**: No Content (delete operations)
- **400**: Bad Request (validation errors)
- **404**: Not Found
- **409**: Conflict (duplicate email)
- **500**: Internal Server Error

Error Response Format:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Security Considerations

1. **Password Hashing**: Passwords should be hashed before sending to this service
2. **Input Validation**: All inputs are validated using DTOs
3. **SQL Injection**: Protected by Prisma's parameterized queries
4. **CORS**: Configure FRONTEND_URL environment variable

## Monitoring and Health Checks

### Health Check Endpoint
```http
GET /health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Docker Health Check
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3002/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
cd database
npx prisma db pull

# Check connection string format
echo $DATABASE_URL
```

### Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Resolve migration conflicts
npx prisma migrate resolve --applied "<migration_name>"
```

### Container Issues

```bash
# Check container logs
podman logs ai-finops-database

# Restart container
podman restart ai-finops-database
```

## Development Tips

### Adding New Models

1. Update `prisma/schema.prisma`
2. Create migration: `npm run prisma:migrate`
3. Generate DTOs in `src/users/dto/`
4. Add service methods in `src/users/users.service.ts`
5. Add controller endpoints in `src/users/users.controller.ts`
6. Update Swagger documentation

### Testing APIs

Use the Swagger UI at http://localhost:3002/api/docs for interactive testing.

Or use curl:

```bash
# Create user
curl -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "hashedPassword",
    "name": "Test User"
  }'

# Get users
curl http://localhost:3002/users
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3002
DATABASE_URL="<your-neon-production-url>"
DIRECT_URL="<your-neon-direct-url>"
FRONTEND_URL="https://your-production-domain.com"
```

### Docker Build and Run

```bash
# Build image
podman build -t ai-finops-database:latest ./database

# Run container
podman run -d \
  --name ai-finops-database \
  -p 3002:3002 \
  --env-file ./database/.env \
  ai-finops-database:latest
```

## Support

For issues or questions:
- Check Swagger documentation: http://localhost:3002/api/docs
- Review logs: `podman logs ai-finops-database`
- Consult Prisma docs: https://www.prisma.io/docs
- Neon documentation: https://neon.tech/docs
