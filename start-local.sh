#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting GameHub Local Development Environment${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL not detected. Starting with Docker...${NC}"
    
    # Check if Docker container already exists
    if docker ps -a --format 'table {{.Names}}' | grep -q gamehub-postgres; then
        echo -e "${YELLOW}📦 Starting existing PostgreSQL container...${NC}"
        docker start gamehub-postgres
    else
        echo -e "${YELLOW}📦 Creating new PostgreSQL container...${NC}"
        docker run --name gamehub-postgres \
          -e POSTGRES_DB=gamehub \
          -e POSTGRES_USER=user \
          -e POSTGRES_PASSWORD=password \
          -p 5432:5432 \
          -d postgres:13
        
        # Wait for PostgreSQL to be ready
        echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
        sleep 10
        
        # Initialize database
        echo -e "${YELLOW}🗄️  Initializing database...${NC}"
        docker exec -i gamehub-postgres psql -U user -d gamehub < init.sql
    fi
else
    echo -e "${GREEN}✅ PostgreSQL is already running${NC}"
fi

# Set environment variables
export POSTGRES_HOST=localhost
export POSTGRES_DB=gamehub
export POSTGRES_USER=user
export POSTGRES_PASSWORD=password

echo -e "${GREEN}🔧 Environment variables set${NC}"

# Function to detect Python command
detect_python() {
    if command -v python3 &> /dev/null; then
        echo "python3"
    elif command -v python &> /dev/null; then
        echo "python"
    else
        echo -e "${RED}❌ Python not found. Please install Python 3.7+${NC}"
        exit 1
    fi
}

# Function to start services in background
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    local python_cmd=$(detect_python)
    
    echo -e "${YELLOW}🚀 Starting $service_name on port $port...${NC}"
    
    cd $service_dir
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating virtual environment for $service_name...${NC}"
        $python_cmd -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt >/dev/null 2>&1
    
    # Start the service in background
    $python_cmd app.py &
    local pid=$!
    echo $pid > ${service_name}.pid
    
    cd ..
    echo -e "${GREEN}✅ $service_name started (PID: $pid)${NC}"
}

# Start backend services
start_service "auth-service" "auth-service" "8080"
start_service "game-service" "game-service" "8081"

# Wait a moment for services to start
sleep 3

# Start frontend
echo -e "${YELLOW}🌐 Starting React frontend...${NC}"
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ All services started!${NC}"
echo -e "${GREEN}🌐 Frontend will be available at: http://localhost:3000${NC}"
echo -e "${GREEN}🔐 Auth Service running on: http://localhost:8080${NC}"
echo -e "${GREEN}🎮 Game Service running on: http://localhost:8081${NC}"
echo ""
echo -e "${YELLOW}📝 To stop all services, run: ./stop-local.sh${NC}"
echo ""

# Start frontend (this will block)
npm start