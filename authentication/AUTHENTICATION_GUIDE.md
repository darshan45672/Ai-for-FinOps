# Authentication Service Documentation

## Overview

The Authentication Service handles user authentication and authorization in the AI-FinOps platform. It works as a microservice that communicates with the Database Service for data operations and provides JWT-based authentication.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Authentication Flow                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────┐         ┌─────────────────┐           │
│  │Frontend │────────▶│ Authentication  │           │
│  │         │         │    Service      │           │
│  └─────────┘         │   (Port 3001)   │           │
│       ▲              └────────┬────────┘           │
│       │                       │                     │
│       │  JWT Token            │ HTTP Requests      │
│       │                       │                     │
│       │              ┌────────▼────────┐           │
│       └──────────────│    Database     │           │
│                      │    Service      │           │
│                      │   (Port 3002)   │           │
│                      └─────────────────┘           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Features

- **User Registration**: Create new user accounts
- **User Login**: Authenticate users and issue JWT tokens
- **Token Refresh**: Refresh access tokens using refresh tokens
- **Token Management**: Store and validate refresh tokens
- **Protected Routes**: JWT-based route protection
- **Role-Based Access**: Support for USER, ADMIN, and SUPER_ADMIN roles
- **API Documentation**: Swagger/OpenAPI documentation

## Technology Stack

- **Framework**: NestJS 11
- **Authentication**: Passport.js with JWT strategy
- **Password Hashing**: bcrypt
- **HTTP Client**: Axios for Database Service communication
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Setup and Run

```bash
cd authentication
npm install
npm run start:dev
```

Visit http://localhost:3001/api/docs for API documentation.

## API Endpoints

### Register
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecureP@ss123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecureP@ss123"}'
```

### Get Profile (Protected)
```bash
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

For complete documentation, see DATABASE_SERVICE_GUIDE.md in the database folder.
