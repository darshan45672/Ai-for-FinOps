#!/bin/bash

# Quick setup script for AI-for-FinOps

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
    _    ___       __            _____ _       ___             
   / \  |_ _|     / _| ___  _ __|  ___(_)_ __ / _ \ _ __  ___ 
  / _ \  | |_____| |_ / _ \| '__| |_  | | '_ \ | | | '_ \/ __|
 / ___ \ | |_____|  _| (_) | |  |  _| | | | | | |_| | |_) \__ \
/_/   \_\___|    |_|  \___/|_|  |_|   |_|_| |_|\___/| .__/|___/
                                                    |_|        
         Quick Setup Script
EOF
echo -e "${NC}"

echo -e "\n${GREEN}Starting AI-for-FinOps setup...${NC}\n"

# Step 1: Check prerequisites
echo -e "${BLUE}[1/5]${NC} Checking prerequisites..."
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed${NC}"
    echo "Please install Podman: https://podman.io/getting-started/installation"
    exit 1
fi

if ! command -v podman-compose &> /dev/null; then
    echo -e "${RED}Error: Podman Compose is not installed${NC}"
    echo "Install with: brew install podman-compose (macOS)"
    exit 1
fi
echo -e "${GREEN}✓ Prerequisites OK${NC}"

# Step 2: Create .env file
echo -e "\n${BLUE}[2/5]${NC} Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please update passwords and secrets in .env file${NC}"
    
    # Generate random passwords
    if command -v openssl &> /dev/null; then
        POSTGRES_PWD=$(openssl rand -base64 24)
        REDIS_PWD=$(openssl rand -base64 24)
        JWT_SECRET=$(openssl rand -base64 32)
        
        # Update .env with generated passwords
        sed -i.bak "s/finops_password_change_me/$POSTGRES_PWD/" .env
        sed -i.bak "s/redis_password_change_me/$REDIS_PWD/" .env
        sed -i.bak "s/your-super-secret-jwt-key-change-in-production-min-32-chars/$JWT_SECRET/" .env
        rm .env.bak
        
        echo -e "${GREEN}✓ Generated secure passwords${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
fi

# Step 3: Start Podman machine (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "\n${BLUE}[3/5]${NC} Checking Podman machine..."
    if ! podman machine list 2>/dev/null | grep -q "running"; then
        echo "Starting Podman machine..."
        podman machine start || true
    fi
    echo -e "${GREEN}✓ Podman machine ready${NC}"
else
    echo -e "\n${BLUE}[3/5]${NC} Skipping Podman machine check (Linux)"
fi

# Step 4: Build images
echo -e "\n${BLUE}[4/5]${NC} Building container images..."
echo "This may take several minutes on first run..."
if podman-compose build --no-cache; then
    echo -e "${GREEN}✓ Images built successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 5: Start services
echo -e "\n${BLUE}[5/5]${NC} Starting services..."
if podman-compose up -d; then
    echo -e "${GREEN}✓ Services started${NC}"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check status
echo -e "\n${GREEN}=== Setup Complete! ===${NC}\n"

echo -e "${BLUE}Service Status:${NC}"
podman-compose ps

echo -e "\n${BLUE}Access Your Application:${NC}"
echo -e "  Frontend:       ${GREEN}http://localhost:3003${NC}"
echo -e "  Backend API:    ${GREEN}http://localhost:3000${NC}"
echo -e "  Authentication: ${GREEN}http://localhost:3001${NC}"
echo -e "  Database API:   ${GREEN}http://localhost:3002${NC}"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo "  make logs        - View all logs"
echo "  make ps          - Check container status"
echo "  make down        - Stop all services"
echo "  make help        - Show all available commands"

echo -e "\n${BLUE}Documentation:${NC}"
echo "  📚 DOCKER_DEPLOYMENT.md  - Complete deployment guide"
echo "  🚀 QUICKSTART.md         - Quick reference card"
echo "  📖 README.md             - Main documentation"

echo -e "\n${GREEN}Happy coding! 🚀${NC}\n"

# Open browser (optional)
read -p "Open frontend in browser? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open http://localhost:3003
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3003
    fi
fi
