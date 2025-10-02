# AI for FinOps

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Podman](https://img.shields.io/badge/Podman-892CA0?style=for-the-badge&logo=podman&logoColor=white)](https://podman.io/)

A comprehensive AI-powered FinOps platform built with microservices architecture that enables businesses to analyze, optimize, and take action on their cloud usage through intelligent chat-based interactions.

## 🎯 Overview

AI for FinOps is a revolutionary platform that transforms how businesses manage their cloud financial operations. By combining artificial intelligence with real-time cloud resource monitoring, it provides actionable insights through an intuitive chat interface, enabling organizations to optimize costs, improve resource utilization, and make data-driven decisions.

## ✨ Key Features

- **🤖 AI-Powered Analysis**: Advanced AI algorithms analyze cloud usage patterns and provide intelligent recommendations
- **💬 Chat-Based Interface**: Intuitive ChatGPT-like interface for natural language queries and interactions
- **☁️ Multi-Cloud Integration**: Seamlessly connects with major cloud platforms (AWS, Azure, GCP, etc.)
- **📊 Real-Time Monitoring**: Live monitoring of cloud resources and cost tracking
- **🔐 Secure Authentication**: JWT-based authentication with refresh tokens and session management
- **🏗️ Microservices Architecture**: Independent, scalable services for better maintainability
- **📱 Responsive Design**: Mobile-first design with support for all devices
- **🎨 Theme Support**: Dark, light, and system theme options
- **⚡ Performance Optimized**: Built with modern technologies for optimal performance
- **🐳 Containerized**: Podman/Docker support for easy deployment

## 🏗️ Microservices Architecture

The platform follows a microservices architecture with four independent services:

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI-FinOps Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐                                             │
│  │   Frontend     │  Next.js 15 (Port 3003)                     │
│  │   Service      │  React, TailwindCSS, shadcn/ui             │
│  └────────┬───────┘                                             │
│           │                                                      │
│      ┌────▼──────────┬──────────────┬──────────────┐           │
│      │               │              │              │            │
│  ┌───▼──────────┐ ┌──▼─────────┐ ┌─▼────────────┐ │           │
│  │Authentication│ │  Backend   │ │   Database   │ │           │
│  │   Service    │ │  Service   │ │   Service    │ │           │
│  │ (Port 3001)  │ │(Port 3000) │ │ (Port 3002)  │ │           │
│  │ JWT, Passport│ │  Business  │ │Prisma, Neon  │ │           │
│  └──────┬───────┘ └────┬───────┘ └──────┬───────┘ │           │
│         │              │                 │         │            │
│         └──────────────┴─────────────────┘         │            │
│                        │                            │            │
│               ┌────────▼────────────────────────────▼─────┐     │
│               │   Neon Serverless PostgreSQL Database     │     │
│               └───────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Services

#### 🎨 Frontend Service (Port 3003)
- **Technology**: Next.js 15, React, TailwindCSS, shadcn/ui
- **Responsibility**: User interface and client-side logic
- **Features**: SSR, authentication UI, chat interface, theme management

#### 🔐 Authentication Service (Port 3001)
- **Technology**: NestJS, Passport.js, JWT, bcrypt
- **Responsibility**: User authentication and authorization
- **Features**: Registration, login, token management, role-based access control
- **API Docs**: http://localhost:3001/api/docs

#### 🗄️ Database Service (Port 3002)
- **Technology**: NestJS, Prisma ORM, Neon PostgreSQL
- **Responsibility**: All database operations and data management
- **Features**: User CRUD, token management, session management, migrations
- **API Docs**: http://localhost:3002/api/docs

#### � Backend Service (Port 3000)
- **Technology**: NestJS
- **Responsibility**: Business logic and AI integrations
- **Features**: FinOps calculations, analytics, AI/ML model integrations

### Technology Stack

#### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **React Hook Form + Zod** - Form validation

#### Backend Services
- **NestJS 11** - Progressive Node.js framework
- **Prisma ORM 6** - Type-safe database client
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens for auth
- **bcrypt** - Password hashing
- **Swagger/OpenAPI** - API documentation
- **TypeScript** - Server-side type safety

#### Database
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Prisma Migrations** - Schema versioning

#### Deployment
- **Podman/Docker** - Container orchestration
- **Redis** - Caching and session storage (optional)
- **Nginx** - Reverse proxy (production)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ 
- **npm** or **yarn**
- **Podman** 5.6.1+ (or Docker)
- **podman-compose** 1.5.0+
- **Neon Account** - For PostgreSQL database ([Get it here](https://console.neon.tech))

### Quick Start

#### Option 1: Using Podman/Docker (Recommended) 🐳

```bash
# 1. Clone the repository
git clone https://github.com/darshan45672/Ai-for-FinOps.git
cd Ai-for-FinOps

# 2. Setup Neon Database
# - Go to https://console.neon.tech
# - Create a new project
# - Copy your connection string

# 3. Create .env file in root directory
cat > .env << EOF
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
JWT_SECRET="your-32-character-secret-key"
JWT_REFRESH_SECRET="your-32-character-refresh-secret"
EOF

# 4. Build and start all services
podman-compose build
podman-compose up -d

# 5. Run database migrations
podman exec -it ai-finops-database npm run prisma:migrate

# 6. Check status
podman-compose ps
```

**Access the application:**
- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3000
- **Authentication API**: http://localhost:3001/api/docs
- **Database API**: http://localhost:3002/api/docs

#### Option 2: Manual Installation

**1. Setup Database Service**
```bash
cd database
npm install
# Create .env with DATABASE_URL
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

**2. Setup Authentication Service**
```bash
cd authentication
npm install
# Create .env with DATABASE_SERVICE_URL and JWT secrets
npm run start:dev
```

**3. Setup Backend Service**
```bash
cd backend
npm install
# Create .env with service URLs
npm run start:dev
```

**4. Setup Frontend**
```bash
cd frontend
npm install
# Create .env.local with API URLs
npm run dev
```

### 📖 Detailed Setup

For comprehensive setup instructions, see:
- **[Complete Setup Guide](docs/SETUP_GUIDE.md)** - Step-by-step installation
- **[Microservices Architecture](docs/MICROSERVICES_ARCHITECTURE.md)** - System design
- **[Database Service Guide](database/DATABASE_SERVICE_GUIDE.md)** - Database operations
- **[Authentication Guide](authentication/AUTHENTICATION_GUIDE.md)** - Auth implementation
   cd Ai-for-FinOps
   ```

2. **Install dependencies for all services**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Authentication Service
   cd ../authentication
   npm install
   
   # Backend Service
   cd ../backend
   npm install
   
   # Database Service
   cd ../database
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files for each service
   cp frontend/.env.example frontend/.env.local
   cp authentication/.env.example authentication/.env
   cp backend/.env.example backend/.env
   cp database/.env.example database/.env
   ```

4. **Start Development Servers**
   ```bash
   # Frontend (Port 3000)
   cd frontend
   npm run dev
   
   # Authentication Service (Port 3001)
   cd authentication
   npm run start:dev
   
   # Backend Service (Port 3002)
   cd backend
   npm run start:dev
   
   # Database Service (Port 3003)
   cd database
   npm run start:dev
   ```

## 📖 Usage

### Chat Interface

The main interface provides a ChatGPT-like experience for interacting with your cloud data:

1. **Ask Questions**: "What are my highest cost resources this month?"
2. **Get Recommendations**: "How can I optimize my EC2 instances?"
3. **Take Actions**: "Scale down unused resources in development environment"
4. **Generate Reports**: "Create a cost analysis report for the last quarter"

### Authentication

Access the authentication pages:
- Sign In: `/auth/signin`
- Register: `/auth/register`
- Forgot Password: `/auth/forgot-password`

### Themes

Switch between themes using the theme toggle in the interface:
- 🌞 Light Mode
- 🌙 Dark Mode
- 💻 System Mode (follows OS preference)

## 🛠️ Development

### Project Structure

```
frontend/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat interface components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts
├── lib/               # Utility functions
└── types/             # TypeScript type definitions

authentication/
├── src/               # NestJS source code
├── test/              # Test files
└── package.json       # Dependencies and scripts

backend/
├── src/               # NestJS source code
├── test/              # Test files
└── package.json       # Dependencies and scripts

database/
├── src/               # NestJS source code
├── test/              # Test files
└── package.json       # Dependencies and scripts
```

### Available Scripts

Each service includes these npm scripts:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Container Management with Makefile

Quick commands for Podman container management:

```bash
make help            # Show all available commands
make up              # Start all services
make down            # Stop all services
make logs            # View logs from all services
make ps              # List running containers
make restart         # Restart all services
make clean           # Remove stopped containers
make backup-db       # Backup PostgreSQL database
make status          # Show detailed status
```

📚 See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete documentation.

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Chat-based interface
- ✅ Authentication system
- ✅ Basic architecture setup
- ✅ Theme support

### Phase 2 (Upcoming)
- 🔄 AI Engine integration
- 🔄 Cloud platform connectors
- 🔄 Real-time cost monitoring
- 🔄 Basic recommendations

### Phase 3 (Future)
- 📋 Advanced analytics
- 📋 Custom dashboards
- 📋 Automated actions
- 📋 Multi-tenant support
- 📋 API marketplace

### Phase 4 (Long-term)
- 📋 Machine learning models
- 📋 Predictive analytics
- 📋 Enterprise integrations
- 📋 Mobile applications

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Guidelines

1. Follow TypeScript best practices
2. Use conventional commit messages
3. Add tests for new features
4. Update documentation
5. Ensure responsive design

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [NestJS](https://nestjs.com/) for the progressive Node.js framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Contact

- **Author**: Darshan Dinesh Bhandary
- **GitHub**: [@darshan45672](https://github.com/darshan45672)
- **Repository**: [Ai-for-FinOps](https://github.com/darshan45672/Ai-for-FinOps)

---

<div align="center">
  <strong>🚀 Transforming FinOps with AI, one conversation at a time.</strong>
</div>