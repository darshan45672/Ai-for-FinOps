# 🚀 Quick Reference - AI for FinOps with Podman

## Essential Commands

### Start & Stop
```bash
make up              # Start all services
make down            # Stop all services
make restart         # Restart all services
make up-build        # Build and start
```

### Monitoring
```bash
make logs            # View all logs
make logs-service SERVICE=backend    # View specific service logs
make ps              # List containers
make health          # Check health status
make stats           # Resource usage
```

### Development
```bash
make shell-backend   # Open backend shell
make shell-frontend  # Open frontend shell
make shell-postgres  # Open PostgreSQL shell
make shell-redis     # Open Redis CLI
```

### Database
```bash
make backup-db                    # Backup database
make restore-db FILE=backup.sql   # Restore database
```

### Maintenance
```bash
make clean           # Remove stopped containers
make prune           # Deep clean (all unused data)
make update-images   # Pull latest base images
```

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3003 | 3003 |
| Backend | http://localhost:3000 | 3000 |
| Authentication | http://localhost:3001 | 3001 |
| Database API | http://localhost:3002 | 3002 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

## Environment Variables

Key variables in `.env`:
- `POSTGRES_PASSWORD` - Database password
- `REDIS_PASSWORD` - Redis password
- `JWT_SECRET` - JWT signing key (32+ chars)
- `NODE_ENV` - Environment (development/production)

## Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Service Won't Start
```bash
# Check logs
make logs-service SERVICE=backend

# Restart specific service
make restart-service SERVICE=backend
```

### Database Connection Failed
```bash
# Check PostgreSQL
podman-compose exec postgres pg_isready -U finops

# Restart database
make restart-service SERVICE=postgres
```

### Build Failures
```bash
# Clear cache and rebuild
make prune
make up-build
```

## File Structure

```
Ai-for-FinOps/
├── docker-compose.yml       # Container orchestration
├── .env.example            # Environment template
├── Makefile               # Command shortcuts
├── DOCKER_DEPLOYMENT.md   # Full documentation
├── authentication/
│   ├── Dockerfile         # Auth service container
│   └── .dockerignore      # Build exclusions
├── backend/
│   ├── Dockerfile         # Backend service container
│   └── .dockerignore
├── database/
│   ├── Dockerfile         # Database service container
│   └── .dockerignore
└── frontend/
    ├── Dockerfile         # Frontend container
    └── .dockerignore
```

## Health Checks

All services include health checks:
```bash
# Check health status
podman ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health info
podman inspect --format='{{.State.Health.Status}}' ai-finops-backend
```

## Resource Limits

Default limits per service:
- CPU: 1 core
- Memory: 512MB (frontend/backend), 1GB (database)

Modify in `docker-compose.yml` under `deploy.resources.limits`

## Security Notes

⚠️ **Before Production:**
1. Change all default passwords in `.env`
2. Use strong JWT_SECRET (32+ random chars)
3. Don't expose database ports publicly
4. Enable HTTPS with reverse proxy
5. Regular security updates

## Useful Aliases

Add to `~/.zshrc`:
```bash
alias dcu='make up'
alias dcd='make down'
alias dcl='make logs'
alias dcs='make status'
alias dcr='make restart'
```

## Links

- 📚 [Full Documentation](DOCKER_DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/darshan45672/Ai-for-FinOps/issues)
- 🤝 [Contributing](CONTRIBUTING.md)
- 📖 [Podman Docs](https://docs.podman.io/)

---

**Need Help?** Run `make help` for all available commands
