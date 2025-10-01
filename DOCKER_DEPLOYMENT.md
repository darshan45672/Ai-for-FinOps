# 🐳 Container Deployment Guide - AI for FinOps

This guide explains how to build and run the AI-for-FinOps application using **Podman** containers.

## 📋 Prerequisites

- **Podman** installed ([Installation Guide](https://podman.io/getting-started/installation))
- **Podman Compose** installed (for orchestration)
- **Git** (to clone the repository)
- At least **4GB RAM** available
- **10GB** disk space

### Install Podman Compose (if not already installed)

```bash
# macOS (using Homebrew)
brew install podman-compose

# Linux (using pip)
pip3 install podman-compose

# Or download binary
curl -o /usr/local/bin/podman-compose https://raw.githubusercontent.com/containers/podman-compose/main/podman_compose.py
chmod +x /usr/local/bin/podman-compose
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/darshan45672/Ai-for-FinOps.git
cd Ai-for-FinOps
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

**Important:** Update these values in `.env`:
- `POSTGRES_PASSWORD` - Set a strong password
- `REDIS_PASSWORD` - Set a strong password
- `JWT_SECRET` - Use a random 32+ character string

### 3. Build and Start Services

```bash
# Build all images and start services
podman-compose up -d --build

# View logs
podman-compose logs -f

# Check service status
podman-compose ps
```

### 4. Access the Application

Once all services are running:

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3000
- **Authentication API**: http://localhost:3001
- **Database API**: http://localhost:3002
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📦 Service Architecture

```
┌─────────────────┐
│   Frontend      │ :3003
│   (Next.js)     │
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼────────┐    ┌──────────▼───┐
│ Backend    │    │ Authentication│
│ (NestJS)   │    │ (NestJS)      │
│   :3000    │    │    :3001      │
└──┬─────┬───┘    └───┬──────┬───┘
   │     │            │      │
   │  ┌──▼────────────▼──┐   │
   │  │   Database       │   │
   │  │   Service        │   │
   │  │   (NestJS)       │   │
   │  │     :3002        │   │
   │  └──┬───────────┬───┘   │
   │     │           │       │
   │  ┌──▼───────┐  │  ┌────▼────┐
   └─►│PostgreSQL│  └─►│  Redis  │
      │  :5432   │     │  :6379  │
      └──────────┘     └─────────┘
```

## 🛠️ Common Commands

### Start Services

```bash
# Start all services
podman-compose up -d

# Start specific service
podman-compose up -d frontend

# Start with rebuild
podman-compose up -d --build
```

### Stop Services

```bash
# Stop all services
podman-compose down

# Stop and remove volumes (⚠️ deletes data)
podman-compose down -v
```

### View Logs

```bash
# All services
podman-compose logs -f

# Specific service
podman-compose logs -f backend

# Last 100 lines
podman-compose logs --tail=100 frontend
```

### Rebuild Services

```bash
# Rebuild all services
podman-compose build --no-cache

# Rebuild specific service
podman-compose build --no-cache authentication
```

### Execute Commands in Containers

```bash
# Access backend shell
podman-compose exec backend sh

# Run database migrations (example)
podman-compose exec database npm run migration:run

# Check Node version
podman-compose exec frontend node --version
```

### Monitor Resources

```bash
# Check container stats
podman stats

# Inspect specific container
podman inspect ai-finops-backend

# View container processes
podman-compose top
```

## 🔍 Troubleshooting

### Services Won't Start

1. **Check if ports are already in use:**
   ```bash
   lsof -i :3000  # Check if port is in use
   ```

2. **View detailed logs:**
   ```bash
   podman-compose logs backend
   ```

3. **Restart services:**
   ```bash
   podman-compose restart
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   podman-compose exec postgres pg_isready -U finops
   ```

2. **Check database logs:**
   ```bash
   podman-compose logs postgres
   ```

3. **Reset database (⚠️ deletes all data):**
   ```bash
   podman-compose down -v
   podman-compose up -d
   ```

### Build Failures

1. **Clear build cache:**
   ```bash
   podman system prune -a
   ```

2. **Rebuild without cache:**
   ```bash
   podman-compose build --no-cache
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

### Permission Issues (macOS/Linux)

If you encounter permission errors:

```bash
# Fix ownership issues
sudo chown -R $USER:$USER .

# Reset Podman machine (macOS)
podman machine stop
podman machine rm
podman machine init
podman machine start
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** - Generate random passwords for production
3. **Change default secrets** - Update JWT_SECRET and database passwords
4. **Use HTTPS in production** - Set up reverse proxy (Nginx/Traefik)
5. **Limit port exposure** - Only expose necessary ports
6. **Regular updates** - Keep base images and dependencies updated

## 🔄 Production Deployment

For production, consider:

1. **Use external database** - Managed PostgreSQL service
2. **Add reverse proxy** - Nginx or Traefik for HTTPS
3. **Implement monitoring** - Prometheus + Grafana
4. **Set up logging** - Centralized log aggregation
5. **Use secrets management** - Vault or Kubernetes secrets
6. **Enable auto-restart** - `restart: always` in compose file
7. **Resource limits** - Add memory/CPU limits to services

### Example Production Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  backend:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

Run with:
```bash
podman-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Health Checks

All services include health checks. Monitor them with:

```bash
# Check health status
podman ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health info
podman inspect --format='{{.State.Health.Status}}' ai-finops-backend
```

## 🧹 Cleanup

### Remove All Containers and Images

```bash
# Stop and remove containers
podman-compose down

# Remove all AI-FinOps images
podman images | grep ai-finops | awk '{print $3}' | xargs podman rmi

# Clean up unused resources
podman system prune -a
```

### Remove Volumes (⚠️ Deletes All Data)

```bash
podman volume rm ai-for-finops_postgres_data ai-for-finops_redis_data
```

## 📚 Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [Podman Compose Guide](https://github.com/containers/podman-compose)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Getting Help

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/darshan45672/Ai-for-FinOps/issues)
2. Review logs: `podman-compose logs -f`
3. Verify environment variables in `.env`
4. Ensure all prerequisites are met
5. Create a new issue with error details

## 📝 License

See the main repository for license information.
