# AI for FinOps 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)

**A fully autonomous agentic AI system for Azure FinOps** - Combining Google Gemini 2.0 Flash, Context7 RAG, Azure MCP integration, and intelligent context engineering to provide real-time cloud cost optimization through natural language conversations.

---

## 🎯 Overview

AI for FinOps is a **next-generation intelligent FinOps platform** that revolutionizes Azure cloud financial management. Unlike traditional FinOps tools, this system is a **fully autonomous AI agent** that:

- **Understands Natural Language**: Ask questions like "What are my Azure costs this month?" or "Find unused resources"
- **Autonomous Tool Usage**: Automatically discovers and executes 200+ Azure MCP tools without manual configuration
- **Context-Aware**: Maintains conversation history, learns from past interactions, and provides personalized insights
- **Documentation Grounded**: Integrates Context7 MCP for real-time Azure documentation to ensure accurate, up-to-date recommendations
- **Proactive Recommendations**: Daily cost snapshots with AI-generated optimization suggestions
- **Self-Healing**: Intelligent retry mechanisms, caching strategies, and error recovery

**Built with:**
- **Google Gemini 2.0 Flash** - Advanced function calling and multi-turn reasoning
- **Context7 MCP** - Real-time Azure documentation retrieval
- **Azure MCP Servers** - 8 specialized servers with 200+ tools
- **Smart Context Engineering** - 6-layer context aggregation system
- **NestJS Microservices** - Scalable, maintainable architecture

---

## 🆕 Recent Updates

### Response Formatting Enhancement (January 2025)
**Status:** ✅ Complete | **Test Now:** [Quick Start Guide](./FORMATTING_QUICK_START.md)

Significantly improved AI response formatting for better user experience:

**Before:**
```
Az-CI-test, AzureBackupRG_eastus2_1, BackupCenterTest, ... [219 total]
```

**After:**
```markdown
I found **219 resource groups**. Here's a summary:

📍 **By Location:**
- East US: 45 RGs | West US: 32 RGs

🏷️ **Patterns:**
- prod-*: 67 RGs | dev-*: 89 RGs

💡 What would you like to do?
```

**What's New:**
- ✅ Structured formatting with emojis, bold, headers, tables
- ✅ Intelligent sizing: Detailed lists (< 20 items), summaries (50+ items)
- ✅ Grouped by location, status, naming patterns
- ✅ Actionable insights and suggested next steps
- ✅ Context7 integration for Azure best practices

**Documentation:**
- [Quick Start Guide](./FORMATTING_QUICK_START.md) - Test the enhancement now
- [Implementation Summary](./docs/FORMATTING_IMPLEMENTATION_SUMMARY.md) - Technical details
- [Complete Enhancement Guide](./docs/RESPONSE_FORMATTING_ENHANCEMENT.md) - Full documentation

---

## ✨ Key Features

### 🤖 Autonomous AI Agent
- **Function Calling**: Gemini 2.0 Flash autonomously selects and executes Azure tools
- **Multi-Turn Reasoning**: Handles complex queries requiring multiple tool calls
- **Context Persistence**: Remembers conversation history across sessions
- **Smart Context Building**: Aggregates user, Azure, conversation, historical, documentation, and tool contexts
- **📝 Formatted Responses**: Professional, readable output with emojis and structure *(NEW)*

### 💬 Intelligent Chat Interface
- ChatGPT-like natural language interface
- Real-time streaming responses (SSE)
- Multi-turn conversations with context awareness
- Conversation management and history

### ☁️ Azure Integration
- **8 Azure MCP Servers**: App Configuration, Confidential Ledger, AZQR, Azure CLI, Grafana, Managed Lustre, Redis, SQL, Workbooks
- **200+ Tools**: Azure Resource Graph, Cost Management, Resource Health, Monitoring, Diagnostics
- **Dynamic Tool Discovery**: Automatically finds and integrates new Azure tools
- **Real-Time Data**: Live queries to Azure APIs for current resource state

### 📊 Cost Optimization
- **Daily Cost Snapshots**: Automated collection via cron jobs
- **Cost Trend Analysis**: Historical cost tracking and visualization
- **AI Recommendations**: Intelligent cost optimization suggestions
- **Potential Savings**: Quantified savings estimates for each recommendation
- **Recommendation Tracking**: Status management (Pending, Accepted, Completed)

### 🔍 Context7 RAG Integration
- Real-time Azure documentation retrieval
- Library resolution for Azure services
- Documentation caching (1-hour TTL)
- Grounded responses based on official Microsoft docs

### 🏗️ Microservices Architecture
- **Frontend**: Next.js 15 with React 19 and Tailwind CSS
- **Authentication Service**: JWT-based auth with OAuth (GitHub)
- **Database Service**: Prisma ORM with PostgreSQL
- **Backend Service**: Azure API integration and cron jobs
- **AI Service**: Gemini AI, Context7, and MCP gateway

### ⚡ Performance & Reliability
- **Redis Caching**: Multi-layer caching (docs, user, Azure, tools)
- **Rate Limiting**: Exponential backoff retry for API limits
- **Error Recovery**: Graceful degradation and user-friendly errors
- **Smart Pagination**: Efficient data loading
- **Response Streaming**: Real-time AI responses

---

## 🏗️ Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                          │
│              Next.js 15 Frontend (Port 3000)                   │
└────────────┬───────────────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                        │
│         JWT Auth + GitHub OAuth (Port 3001)                    │
└────────────┬───────────────────────────────────────────────────┘
             │
      ┌──────┴──────┬─────────────┬────────────────┐
      │             │             │                │
┌─────▼─────┐  ┌───▼────┐  ┌────▼────┐  ┌───────▼──────┐
│  Backend  │  │   AI   │  │Database │  │   Azure MCP  │
│  Service  │  │Service │  │ Service │  │   Gateway    │
│ (Port     │  │(Port   │  │(Port    │  │              │
│  3003)    │  │ 3004)  │  │ 3002)   │  │              │
└─────┬─────┘  └───┬────┘  └────┬────┘  └───────┬──────┘
      │            │             │               │
      │     ┌──────┴─────┐       │      ┌────────▼────────┐
      │     │  Context   │       │      │  8 Azure MCP    │
      │     │  Engine    │       │      │    Servers      │
      │     │  (6 layers)│       │      │  (200+ tools)   │
      │     └──────┬─────┘       │      └────────┬────────┘
      │            │             │               │
┌─────▼────────────▼─────────────▼───────────────▼────────┐
│                    DATA LAYER                            │
│  PostgreSQL (Prisma)  │  Redis Cache  │  Azure APIs     │
└──────────────────────────────────────────────────────────┘
```

### 6-Layer Context Engine

The heart of the AI system is the **Context Service** that aggregates information from 6 sources:

1. **User Context**: Profile, preferences, Azure credentials
2. **Azure Context**: Current subscriptions, resource groups, resources
3. **Conversation History**: Past messages and context snapshots
4. **Historical Context**: Cost snapshots, previous recommendations
5. **Documentation Context**: Real-time Azure docs via Context7 MCP
6. **Tool Context**: Available MCP tools and schemas

This rich context is fed to Gemini 2.0 Flash for intelligent, personalized responses.

### Microservices

| Service | Port | Purpose | Technology |
|---------|------|---------|------------|
| **Frontend** | 3000 | User interface | Next.js 15, React 19, Tailwind CSS |
| **Authentication** | 3001 | User auth, JWT, OAuth | NestJS, Passport, JWT |
| **Database** | 3002 | Data persistence API | NestJS, Prisma, PostgreSQL |
| **Backend** | 3003 | Azure integration, cron jobs | NestJS, Azure SDK, @nestjs/schedule |
| **AI** | 3004 | AI agent, context, MCP gateway | NestJS, Gemini 2.0, Context7, MCP |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js v20+**
- **npm v10+**
- **PostgreSQL** (or Neon serverless)
- **Redis** (local or Azure Cache)
- **Azure Account** with valid credentials
- **Gemini API Key** from Google AI Studio

### Environment Setup

Create `.env` files for each service:

**database/.env**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/finops
REDIS_URL=redis://localhost:6379
PORT=3002
```

**backend/.env**
```env
DATABASE_SERVICE_URL=http://localhost:3002
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_SUBSCRIPTION_ID=your-subscription-id
PORT=3003
```

**ai/.env**
```env
DATABASE_SERVICE_URL=http://localhost:3002
GEMINI_API_KEY=your-gemini-api-key
REDIS_URL=redis://localhost:6379
PORT=3004
```

**authentication/.env**
```env
DATABASE_SERVICE_URL=http://localhost:3002
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
PORT=3001
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_AI_URL=http://localhost:3004
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/darshan45672/Ai-for-FinOps.git
cd Ai-for-FinOps

# 2. Install dependencies for all services
cd database && npm install && cd ..
cd backend && npm install && cd ..
cd ai && npm install && cd ..
cd authentication && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Setup database schema
cd database
npx prisma migrate deploy
npx prisma generate
cd ..

# 4. Start all services
./start-services.sh
```

### Using Start Script

```bash
# Start all services in the background
./start-services.sh

# Check service status
tail -f logs/database.log
tail -f logs/backend.log
tail -f logs/ai.log
tail -f logs/authentication.log
tail -f logs/frontend.log

# Stop all services
./stop-services.sh
```

### Access Points

- **Frontend**: http://localhost:3000
- **Authentication API**: http://localhost:3001
- **Database API**: http://localhost:3002
- **Backend API**: http://localhost:3003
- **AI API**: http://localhost:3004

---

## 📚 Documentation

Comprehensive guides are available in the `docs/` directory:

### Core Documentation
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Detailed installation and configuration
- **[Microservices Architecture](docs/MICROSERVICES_ARCHITECTURE.md)** - System design and architecture
- **[Azure Integration](docs/AZURE_INTEGRATION_SUMMARY.md)** - Azure MCP setup and usage

### Phase Guides
- **[Phase 9: Cost Snapshots](docs/PHASE_9_IMPLEMENTATION.md)** - Background jobs and cost tracking
- **[Gemini Rate Limiting](docs/GEMINI_RATE_LIMITING.md)** - Handling API rate limits

### Phase 10 Documentation (NEW!)
- **[End-to-End Testing Guide](docs/END_TO_END_TESTING_GUIDE.md)** - Comprehensive testing procedures
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment to Azure

### Feature Guides
- **[Authentication Flow](docs/AUTHENTICATION_FLOW_GUIDE.md)** - Auth implementation details
- **[Azure Data Flow](docs/AZURE_DATA_FLOW.md)** - Data flow diagrams
- **[Profile Features](docs/PROFILE_QUICK_REFERENCE.md)** - User profile management

---

We've provided convenient scripts to start/stop all services:

```bash
# Start all services
./start-services.sh

# Stop all services
./stop-services.sh
```

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

- **Node.js v20+** – Required for frontend and backend
- **npm v10+** or **yarn** – Package manager
- **Podman v5.6.1+** (or **Docker**) – Optional, for containerized deployment
- **podman-compose v1.5.0+** – Only if using Podman for orchestration
- **Neon Account** – For PostgreSQL database ([Get it here](https://console.neon.tech))

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