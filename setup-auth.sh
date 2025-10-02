#!/bin/bash

# Setup script for authentication service with Neon PostgreSQL

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
    _         _   _                _   _           _   _             
   / \  _   _| |_| |__   ___ _ __ | |_(_) ___ __ _| |_(_) ___  _ __  
  / _ \| | | | __| '_ \ / _ \ '_ \| __| |/ __/ _` | __| |/ _ \| '_ \ 
 / ___ \ |_| | |_| | | |  __/ | | | |_| | (_| (_| | |_| | (_) | | | |
/_/   \_\__,_|\__|_| |_|\___|_| |_|\__|_|\___\__,_|\__|_|\___/|_| |_|
                                                                      
                  Setup with Neon PostgreSQL
EOF
echo -e "${NC}"

echo -e "\n${GREEN}Setting up authentication service...${NC}\n"

# Check if in correct directory
if [ ! -f "authentication/package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root${NC}"
    exit 1
fi

# Step 1: Check Node.js
echo -e "${BLUE}[1/7]${NC} Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

# Step 2: Install dependencies
echo -e "\n${BLUE}[2/7]${NC} Installing dependencies..."
cd authentication
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Setup environment file
echo -e "\n${BLUE}[3/7]${NC} Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    
    # Generate secrets
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        
        sed -i.bak "s|your-super-secret-jwt-key-change-in-production-min-32-characters-here|$JWT_SECRET|" .env
        sed -i.bak "s|your-super-secret-refresh-token-key-change-in-production|$JWT_REFRESH_SECRET|" .env
        rm .env.bak 2>/dev/null || true
        
        echo -e "${GREEN}✓ Generated secure JWT secrets${NC}"
    fi
    
    echo -e "${YELLOW}⚠  IMPORTANT: Update DATABASE_URL in authentication/.env with your Neon connection string${NC}"
else
    echo -e "${YELLOW}⚠  .env file already exists${NC}"
fi

# Step 4: Ask for Neon connection string
echo -e "\n${BLUE}[4/7]${NC} Neon PostgreSQL configuration..."
echo -e "${YELLOW}Do you have a Neon PostgreSQL connection string? (y/n)${NC}"
read -r has_neon

if [[ $has_neon =~ ^[Yy]$ ]]; then
    echo -e "Please enter your Neon connection string:"
    echo -e "${YELLOW}(Format: postgresql://user:pass@host.neon.tech/dbname?sslmode=require)${NC}"
    read -r neon_url
    
    if [ ! -z "$neon_url" ]; then
        # Update .env file
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$neon_url\"|" .env
        sed -i.bak "s|DIRECT_URL=.*|DIRECT_URL=\"$neon_url\"|" .env
        rm .env.bak 2>/dev/null || true
        echo -e "${GREEN}✓ Updated DATABASE_URL${NC}"
        
        # Test connection
        echo -e "\n${BLUE}Testing database connection...${NC}"
        if npx prisma db pull --force 2>/dev/null; then
            echo -e "${GREEN}✓ Database connection successful${NC}"
        else
            echo -e "${YELLOW}⚠  Could not connect to database. Please verify your connection string.${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠  Please create a Neon database at: https://console.neon.tech${NC}"
    echo -e "${YELLOW}   Then update DATABASE_URL in authentication/.env${NC}"
fi

# Step 5: Generate Prisma Client
echo -e "\n${BLUE}[5/7]${NC} Generating Prisma Client..."
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Step 6: Run migrations (if DATABASE_URL is set)
if grep -q "neon.tech" .env 2>/dev/null; then
    echo -e "\n${BLUE}[6/7]${NC} Running database migrations..."
    echo -e "${YELLOW}Do you want to run migrations now? (y/n)${NC}"
    read -r run_migrations
    
    if [[ $run_migrations =~ ^[Yy]$ ]]; then
        if npm run prisma:migrate -- --name init; then
            echo -e "${GREEN}✓ Migrations completed${NC}"
        else
            echo -e "${YELLOW}⚠  Migrations skipped or failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠  Skipped migrations. Run 'npm run prisma:migrate' when ready${NC}"
    fi
else
    echo -e "\n${BLUE}[6/7]${NC} ${YELLOW}Skipping migrations (DATABASE_URL not configured)${NC}"
fi

# Step 7: Build the application
echo -e "\n${BLUE}[7/7]${NC} Building application..."
npm run build
echo -e "${GREEN}✓ Build complete${NC}"

# Summary
echo -e "\n${GREEN}=== Setup Complete! ===${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. ${YELLOW}Configure Neon Database:${NC}"
echo -e "   - Go to: https://console.neon.tech"
echo -e "   - Create a database named: ai_finops"
echo -e "   - Update DATABASE_URL in authentication/.env"

echo -e "\n2. ${YELLOW}Run Migrations:${NC}"
echo -e "   cd authentication"
echo -e "   npm run prisma:migrate"

echo -e "\n3. ${YELLOW}Start the Service:${NC}"
echo -e "   npm run start:dev"

echo -e "\n4. ${YELLOW}Test the API:${NC}"
echo -e "   http://localhost:3001/api/docs"

echo -e "\n${BLUE}Documentation:${NC}"
echo -e "   📚 authentication/AUTHENTICATION_GUIDE.md"

echo -e "\n${BLUE}Quick Commands:${NC}"
echo -e "   npm run start:dev        - Start development server"
echo -e "   npm run prisma:studio    - Open database GUI"
echo -e "   npm run prisma:migrate   - Run migrations"

echo -e "\n${GREEN}Happy coding! 🚀${NC}\n"
