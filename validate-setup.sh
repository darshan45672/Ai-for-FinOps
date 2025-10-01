#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${BLUE}"
cat << "EOF"
    _    ___       __            _____ _       ___             
   / \  |_ _|     / _| ___  _ __|  ___(_)_ __ / _ \ _ __  ___ 
  / _ \  | |_____| |_ / _ \| '__| |_  | | '_ \ | | | '_ \/ __|
 / ___ \ | |_____|  _| (_) | |  |  _| | | | | | |_| | |_) \__ \
/_/   \_\___|    |_|  \___/|_|  |_|   |_|_| |_|\___/| .__/|___/
                                                    |_|        
         Container Setup Validation Script
EOF
echo -e "${NC}"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo -e "\n${BLUE}=== Checking Prerequisites ===${NC}\n"

# Check if Podman is installed
if command -v podman &> /dev/null; then
    PODMAN_VERSION=$(podman --version)
    print_status 0 "Podman installed: $PODMAN_VERSION"
else
    print_status 1 "Podman not found. Please install Podman."
    exit 1
fi

# Check if Podman Compose is installed
if command -v podman-compose &> /dev/null; then
    COMPOSE_VERSION=$(podman-compose --version 2>/dev/null || echo "version unknown")
    print_status 0 "Podman Compose installed: $COMPOSE_VERSION"
else
    print_status 1 "Podman Compose not found. Please install podman-compose."
    print_info "Install with: brew install podman-compose (macOS) or pip3 install podman-compose"
    exit 1
fi

# Check if Make is installed
if command -v make &> /dev/null; then
    MAKE_VERSION=$(make --version | head -n1)
    print_status 0 "Make installed: $MAKE_VERSION"
else
    print_status 1 "Make not found. Please install make."
    exit 1
fi

echo -e "\n${BLUE}=== Checking Required Files ===${NC}\n"

# Check for required files
FILES=(
    "docker-compose.yml"
    "Makefile"
    ".env.example"
    "authentication/Dockerfile"
    "backend/Dockerfile"
    "database/Dockerfile"
    "frontend/Dockerfile"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Found: $file"
    else
        print_status 1 "Missing: $file"
    fi
done

echo -e "\n${BLUE}=== Checking Environment Configuration ===${NC}\n"

# Check for .env file
if [ -f ".env" ]; then
    print_status 0 "Environment file (.env) exists"
    
    # Check for critical environment variables
    if grep -q "POSTGRES_PASSWORD=.*_change_me" .env 2>/dev/null || \
       grep -q "JWT_SECRET=your-" .env 2>/dev/null; then
        print_warning "Default passwords/secrets detected in .env"
        print_info "Please update POSTGRES_PASSWORD, REDIS_PASSWORD, and JWT_SECRET"
    else
        print_status 0 "Environment variables appear to be configured"
    fi
else
    print_warning "No .env file found"
    print_info "Run: make env (or cp .env.example .env)"
fi

echo -e "\n${BLUE}=== Checking Port Availability ===${NC}\n"

# Check if ports are available
PORTS=(3000 3001 3002 3003 5432 6379)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        PROCESS=$(lsof -Pi :$port -sTCP:LISTEN -t | xargs ps -p | tail -n1)
        print_info "Process: $PROCESS"
    else
        print_status 0 "Port $port is available"
    fi
done

echo -e "\n${BLUE}=== Checking Disk Space ===${NC}\n"

# Check available disk space
AVAILABLE_GB=$(df -h . | awk 'NR==2 {print $4}' | sed 's/Gi*//')
print_info "Available disk space: $(df -h . | awk 'NR==2 {print $4}')"

if [ "${AVAILABLE_GB%%.*}" -lt 10 ]; then
    print_warning "Low disk space. At least 10GB recommended."
else
    print_status 0 "Sufficient disk space available"
fi

echo -e "\n${BLUE}=== Checking Node.js Dependencies ===${NC}\n"

# Check for node_modules in each service
SERVICES=("authentication" "backend" "database" "frontend")
for service in "${SERVICES[@]}"; do
    if [ -d "$service/node_modules" ]; then
        print_status 0 "$service: Dependencies installed"
    else
        print_warning "$service: Dependencies not installed"
        print_info "Run: cd $service && npm install"
    fi
done

echo -e "\n${BLUE}=== Podman Machine Status ===${NC}\n"

# Check Podman machine status (macOS/Windows)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if podman machine list 2>/dev/null | grep -q "running"; then
        print_status 0 "Podman machine is running"
    else
        print_warning "Podman machine is not running"
        print_info "Run: podman machine start"
    fi
fi

echo -e "\n${BLUE}=== Summary ===${NC}\n"

# Final recommendations
echo -e "${GREEN}Setup validation complete!${NC}\n"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Create .env file: make env"
    echo "  2. Update .env with your configuration"
    echo "  3. Start services: make up-build"
else
    echo -e "${YELLOW}Ready to start!${NC}"
    echo "  Run: make up-build"
fi

echo -e "\n${BLUE}Useful commands:${NC}"
echo "  make help        - Show all available commands"
echo "  make up-build    - Build and start all services"
echo "  make logs        - View logs from all services"
echo "  make ps          - List running containers"
echo "  make status      - Show detailed status"

echo -e "\n${BLUE}Documentation:${NC}"
echo "  📚 DOCKER_DEPLOYMENT.md  - Complete guide"
echo "  🚀 QUICKSTART.md         - Quick reference"
echo "  📖 README.md             - Main documentation"

echo -e "\n${GREEN}Happy containerizing! 🐳${NC}\n"
