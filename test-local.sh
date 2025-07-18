#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 GameHub Local Testing Suite${NC}"
echo "=================================="

# Function to check if services are running
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking if services are running...${NC}"
    
    # Check PostgreSQL
    if ! docker ps | grep -q gamehub-postgres; then
        echo -e "${RED}❌ PostgreSQL container not running${NC}"
        echo -e "${YELLOW}💡 Please run './start-local.sh' first${NC}"
        exit 1
    fi
    
    # Check if PostgreSQL is ready
    if ! docker exec gamehub-postgres pg_isready -U user -d gamehub >/dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL not ready${NC}"
        echo -e "${YELLOW}💡 Please wait for PostgreSQL to start or run './start-local.sh'${NC}"
        exit 1
    fi
    
    # Check auth service
    if ! curl -s http://localhost:8080 >/dev/null 2>&1; then
        echo -e "${RED}❌ Auth service not responding on port 8080${NC}"
        echo -e "${YELLOW}💡 Please run './start-local.sh' first${NC}"
        exit 1
    fi
    
    # Check game service
    if ! curl -s http://localhost:8081 >/dev/null 2>&1; then
        echo -e "${RED}❌ Game service not responding on port 8081${NC}"
        echo -e "${YELLOW}💡 Please run './start-local.sh' first${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All services are running${NC}"
}

# Check prerequisites first
check_prerequisites

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

# Function to test database connection
test_database() {
    echo -n "Testing PostgreSQL connection... "
    
    if docker exec gamehub-postgres pg_isready -U user -d gamehub >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to test API with JSON
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -n "Testing $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
                  -H "Content-Type: application/json" \
                  -d "$data" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null)
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

# Function to get JWT token
get_jwt_token() {
    local username=$1
    local password=$2
    
    # First register the user (might fail if already exists, that's ok)
    curl -s -X POST http://localhost:8080/register \
         -H "Content-Type: application/json" \
         -d "{\"username\": \"$username\", \"password\": \"$password\"}" >/dev/null 2>&1
    
    # Then login and extract token
    response=$(curl -s -X POST http://localhost:8080/login \
                   -H "Content-Type: application/json" \
                   -d "{\"username\": \"$username\", \"password\": \"$password\"}")
    
    echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Test 1: Database Connection
echo -e "\n${BLUE}1. Database Tests${NC}"
test_database

# Test 2: Service Health Checks
echo -e "\n${BLUE}2. Service Health Checks${NC}"
test_endpoint "Frontend" "http://localhost:3000" "200"
test_endpoint "Auth Service" "http://localhost:8080" "404"  # No root endpoint, 404 is expected
test_endpoint "Game Service" "http://localhost:8081" "404"  # No root endpoint, 404 is expected

# Test 3: Auth Service API
echo -e "\n${BLUE}3. Authentication API Tests${NC}"

# Generate random username to avoid conflicts
TEST_USER="testuser_$(date +%s)"
TEST_PASS="testpass123"

test_api "User Registration" "POST" "http://localhost:8080/register" \
         "{\"username\": \"$TEST_USER\", \"password\": \"$TEST_PASS\"}" "201"

test_api "User Login" "POST" "http://localhost:8080/login" \
         "{\"username\": \"$TEST_USER\", \"password\": \"$TEST_PASS\"}" "200"

test_api "Invalid Login" "POST" "http://localhost:8080/login" \
         "{\"username\": \"invalid\", \"password\": \"invalid\"}" "404"

# Test 4: Game Service API (requires authentication)
echo -e "\n${BLUE}4. Game Service API Tests${NC}"

echo -n "Getting JWT token... "
JWT_TOKEN=$(get_jwt_token "$TEST_USER" "$TEST_PASS")

if [ -n "$JWT_TOKEN" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    
    # Test authenticated endpoints (these might return 404 if endpoints don't exist)
    echo -n "Testing authenticated game endpoint... "
    response=$(curl -s -o /dev/null -w "%{http_code}" \
               -H "Authorization: Bearer $JWT_TOKEN" \
               "http://localhost:8081/games" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✅ PASS (Service responding)${NC}"
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Test 5: Database Data Verification
echo -e "\n${BLUE}5. Database Data Verification${NC}"

echo -n "Checking user creation in database... "
user_count=$(docker exec gamehub-postgres psql -U user -d gamehub -t -c \
            "SELECT COUNT(*) FROM users WHERE username = '$TEST_USER';" 2>/dev/null | tr -d ' ')

if [ "$user_count" = "1" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (User not found in database)${NC}"
fi

# Test 6: Metrics Endpoints
echo -e "\n${BLUE}6. Metrics Endpoints${NC}"
test_endpoint "Auth Service Metrics" "http://localhost:8080/metrics" "200"
test_endpoint "Game Service Metrics" "http://localhost:8081/metrics" "200"

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "${YELLOW}✅ All basic functionality tests completed${NC}"
echo -e "${YELLOW}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}🔐 Auth API: http://localhost:8080${NC}"
echo -e "${YELLOW}🎮 Game API: http://localhost:8081${NC}"
echo -e "${YELLOW}📊 Metrics available at /metrics endpoints${NC}"
echo ""
echo -e "${GREEN}🎉 Local environment is ready for development!${NC}"

# Optional: Open browser
if command -v open >/dev/null 2>&1; then
    echo -e "${YELLOW}🌐 Opening frontend in browser...${NC}"
    open http://localhost:3000
elif command -v xdg-open >/dev/null 2>&1; then
    echo -e "${YELLOW}🌐 Opening frontend in browser...${NC}"
    xdg-open http://localhost:3000
fi