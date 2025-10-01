# AI for FinOps

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A comprehensive AI-powered FinOps platform that enables businesses to analyze, optimize, and take action on their cloud usage through intelligent chat-based interactions.

## 🎯 Overview

AI for FinOps is a revolutionary platform that transforms how businesses manage their cloud financial operations. By combining artificial intelligence with real-time cloud resource monitoring, it provides actionable insights through an intuitive chat interface, enabling organizations to optimize costs, improve resource utilization, and make data-driven decisions.

## ✨ Key Features

- **🤖 AI-Powered Analysis**: Advanced AI algorithms analyze cloud usage patterns and provide intelligent recommendations
- **💬 Chat-Based Interface**: Intuitive ChatGPT-like interface for natural language queries and interactions
- **☁️ Multi-Cloud Integration**: Seamlessly connects with major cloud platforms (AWS, Azure, GCP, etc.)
- **📊 Real-Time Monitoring**: Live monitoring of cloud resources and cost tracking
- **🔐 Secure Authentication**: Enterprise-grade authentication and authorization system
- **📱 Responsive Design**: Mobile-first design with support for all devices
- **🎨 Theme Support**: Dark, light, and system theme options
- **⚡ Performance Optimized**: Built with modern technologies for optimal performance

## 🏗️ Architecture

The platform follows a microservices architecture with dedicated modules:

```
AI for FinOps/
├── 🤖 authentication/     # Authentication & Authorization Service
├── 🔧 backend/           # Core Backend API Service
├── 🗄️ database/          # Database Management Service
├── 🎨 frontend/          # React/Next.js Frontend Application
└── 📊 [Future Modules]   # AI Engine, Analytics, Integrations...
```

### Technology Stack

#### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **React Hook Form + Zod** - Form validation

#### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Server-side type safety
- **RESTful APIs** - Standard API architecture

#### Authentication
- **JWT Tokens** - Secure authentication
- **Role-based Access Control** - Granular permissions
- **Social Login Integration** - Google, GitHub, Twitter

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Quick Start with Podman 🐳

The easiest way to get started is using containers:

```bash
# 1. Clone the repository
git clone https://github.com/darshan45672/Ai-for-FinOps.git
cd Ai-for-FinOps

# 2. Create environment file
make env

# 3. Build and start all services
make up-build

# 4. View logs
make logs
```

**Access the application:**
- Frontend: http://localhost:3003
- Backend API: http://localhost:3000
- Authentication: http://localhost:3001

📚 **Full container documentation**: See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/darshan45672/Ai-for-FinOps.git
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