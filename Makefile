.PHONY: help build up down restart logs clean prune health ps env

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '${GREEN}AI-FinOps Podman Commands${NC}'
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${NC} ${GREEN}<target>${NC}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

env: ## Create .env file from .env.example
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "${GREEN}✓${NC} Created .env file from .env.example"; \
		echo "${YELLOW}⚠${NC}  Please update .env with your configuration"; \
	else \
		echo "${YELLOW}⚠${NC}  .env file already exists"; \
	fi

build: ## Build all container images
	@echo "${GREEN}Building all services...${NC}"
	podman-compose build --no-cache

build-service: ## Build specific service (use: make build-service SERVICE=backend)
	@echo "${GREEN}Building $(SERVICE)...${NC}"
	podman-compose build --no-cache $(SERVICE)

up: ## Start all services in detached mode
	@echo "${GREEN}Starting all services...${NC}"
	podman-compose up -d
	@echo "${GREEN}✓${NC} Services started. Use 'make logs' to view logs"
	@echo "${GREEN}✓${NC} Frontend: http://localhost:3003"

up-build: ## Build and start all services
	@echo "${GREEN}Building and starting all services...${NC}"
	podman-compose up -d --build

down: ## Stop and remove all services
	@echo "${RED}Stopping all services...${NC}"
	podman-compose down

down-volumes: ## Stop services and remove volumes (⚠️  deletes data)
	@echo "${RED}⚠️  WARNING: This will delete all data!${NC}"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		podman-compose down -v; \
		echo "${RED}✓${NC} Services stopped and volumes removed"; \
	else \
		echo "${YELLOW}Cancelled${NC}"; \
	fi

restart: ## Restart all services
	@echo "${YELLOW}Restarting all services...${NC}"
	podman-compose restart

restart-service: ## Restart specific service (use: make restart-service SERVICE=backend)
	@echo "${YELLOW}Restarting $(SERVICE)...${NC}"
	podman-compose restart $(SERVICE)

logs: ## View logs from all services
	podman-compose logs -f

logs-service: ## View logs from specific service (use: make logs-service SERVICE=backend)
	podman-compose logs -f $(SERVICE)

ps: ## List all running containers
	@echo "${GREEN}Container Status:${NC}"
	@podman-compose ps

health: ## Check health status of all services
	@echo "${GREEN}Health Status:${NC}"
	@podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

stats: ## Show resource usage statistics
	@echo "${GREEN}Resource Usage:${NC}"
	@podman stats --no-stream

shell-backend: ## Open shell in backend container
	@podman-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	@podman-compose exec frontend sh

shell-auth: ## Open shell in authentication container
	@podman-compose exec authentication sh

shell-database: ## Open shell in database service container
	@podman-compose exec database sh

shell-postgres: ## Open PostgreSQL shell
	@podman-compose exec postgres psql -U finops -d ai_finops

shell-redis: ## Open Redis CLI
	@podman-compose exec redis redis-cli -a redis_password

clean: ## Remove stopped containers and unused images
	@echo "${YELLOW}Cleaning up...${NC}"
	podman container prune -f
	podman image prune -f
	@echo "${GREEN}✓${NC} Cleanup complete"

prune: ## Deep clean (removes all unused data)
	@echo "${RED}⚠️  WARNING: This will remove all unused containers, networks, and images!${NC}"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		podman system prune -a -f; \
		echo "${GREEN}✓${NC} System pruned"; \
	else \
		echo "${YELLOW}Cancelled${NC}"; \
	fi

test-backend: ## Run backend tests
	@podman-compose exec backend npm test

test-auth: ## Run authentication tests
	@podman-compose exec authentication npm test

test-database: ## Run database service tests
	@podman-compose exec database npm test

dev-frontend: ## Run frontend in development mode
	@echo "${GREEN}Starting frontend in development mode...${NC}"
	cd frontend && npm run dev

dev-backend: ## Run backend in development mode
	@echo "${GREEN}Starting backend in development mode...${NC}"
	cd backend && npm run start:dev

install-all: ## Install dependencies for all services
	@echo "${GREEN}Installing dependencies...${NC}"
	cd authentication && npm install
	cd backend && npm install
	cd database && npm install
	cd frontend && npm install
	@echo "${GREEN}✓${NC} All dependencies installed"

update-images: ## Pull latest base images
	@echo "${GREEN}Pulling latest images...${NC}"
	podman pull docker.io/library/node:20-alpine
	podman pull docker.io/library/postgres:16-alpine
	podman pull docker.io/library/redis:7-alpine

backup-db: ## Backup PostgreSQL database
	@echo "${GREEN}Creating database backup...${NC}"
	@mkdir -p backups
	@podman-compose exec -T postgres pg_dump -U finops ai_finops > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}✓${NC} Backup created in backups/ directory"

restore-db: ## Restore PostgreSQL database (use: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "${RED}Error: Please specify FILE=backup.sql${NC}"; \
		exit 1; \
	fi
	@echo "${YELLOW}Restoring database from $(FILE)...${NC}"
	@cat $(FILE) | podman-compose exec -T postgres psql -U finops -d ai_finops
	@echo "${GREEN}✓${NC} Database restored"

validate: ## Validate docker-compose.yml
	@echo "${GREEN}Validating compose file...${NC}"
	@podman-compose config > /dev/null && echo "${GREEN}✓${NC} Compose file is valid"

ports: ## Show all exposed ports
	@echo "${GREEN}Exposed Ports:${NC}"
	@echo "Frontend:       http://localhost:3003"
	@echo "Backend:        http://localhost:3000"
	@echo "Authentication: http://localhost:3001"
	@echo "Database API:   http://localhost:3002"
	@echo "PostgreSQL:     localhost:5432"
	@echo "Redis:          localhost:6379"

status: ## Show detailed status of all services
	@echo "${GREEN}=== Service Status ===${NC}"
	@make ps
	@echo ""
	@echo "${GREEN}=== Health Checks ===${NC}"
	@make health
	@echo ""
	@echo "${GREEN}=== Network Information ===${NC}"
	@podman network ls | grep finops || echo "No networks found"
	@echo ""
	@echo "${GREEN}=== Volume Information ===${NC}"
	@podman volume ls | grep finops || echo "No volumes found"

.DEFAULT_GOAL := help
