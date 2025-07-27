#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping GameHub Local Development Environment${NC}"

# Stop backend services
for service in auth-service game-service; do
    if [ -f "${service}.pid" ]; then
        pid=$(cat ${service}.pid)
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}🛑 Stopping $service (PID: $pid)...${NC}"
            kill $pid
            rm ${service}.pid
            echo -e "${GREEN}✅ $service stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service was not running${NC}"
            rm ${service}.pid
        fi
    fi
done

# Stop any remaining Python processes (optional)
pkill -f "python app.py" 2>/dev/null

# Stop PostgreSQL Docker container (optional)
if docker ps --format 'table {{.Names}}' | grep -q gamehub-postgres; then
    echo -e "${YELLOW}🛑 Stopping PostgreSQL container...${NC}"
    docker stop gamehub-postgres
    echo -e "${GREEN}✅ PostgreSQL container stopped${NC}"
fi

echo -e "${GREEN}✅ All services stopped${NC}"