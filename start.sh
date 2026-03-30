#!/bin/bash

# OpenVox Start Script
# Starts both client and server development servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$SCRIPT_DIR/client"
SERVER_DIR="$SCRIPT_DIR/server"
PID_DIR="$SCRIPT_DIR/.pids"

# Port configuration
CLIENT_PORT=3000
SERVER_PORT=4000

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to find an available port
find_available_port() {
    local port=$1
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if ! check_port $port; then
            echo $port
            return 0
        fi
        echo -e "${YELLOW}Port $port is already in use, trying $((port + 1))...${NC}" >&2
        port=$((port + 1))
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}Error: Could not find an available port starting from $1${NC}" >&2
    return 1
}

# Function to kill a process by PID file
kill_process() {
    local pid_file=$1
    local name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Force stopping $name...${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
            return 0
        fi
        rm -f "$pid_file"
    fi
    return 1
}

# Function to stop existing servers
stop_existing_servers() {
    echo -e "${YELLOW}Checking for existing servers...${NC}"
    
    local server_stopped=0
    local client_stopped=0
    
    # Stop server if PID file exists
    if kill_process "$PID_DIR/server.pid" "OpenVox Server"; then
        server_stopped=1
    fi
    
    # Stop client if PID file exists
    if kill_process "$PID_DIR/client.pid" "OpenVox Client"; then
        client_stopped=1
    fi
    
    # Also check ports directly in case PID files are missing
    if check_port $SERVER_PORT; then
        echo -e "${YELLOW}Found process on port $SERVER_PORT, stopping it...${NC}"
        fuser -k $SERVER_PORT/tcp 2>/dev/null || true
        server_stopped=1
    fi
    
    if check_port $CLIENT_PORT; then
        echo -e "${YELLOW}Found process on port $CLIENT_PORT, stopping it...${NC}"
        fuser -k $CLIENT_PORT/tcp 2>/dev/null || true
        client_stopped=1
    fi
    
    if [ $server_stopped -eq 1 ] || [ $client_stopped -eq 1 ]; then
        sleep 2  # Give time for processes to stop
    fi
}

# Main execution
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}OpenVox Development Server${NC}"
echo -e "${BLUE}========================================${NC}"

# Stop any existing servers first
stop_existing_servers

# Find available ports
echo -e "${YELLOW}Checking available ports...${NC}"
SERVER_PORT=$(find_available_port $SERVER_PORT)
CLIENT_PORT=$(find_available_port $CLIENT_PORT)

echo -e "${GREEN}Using ports:${NC}"
echo -e "  Server: $SERVER_PORT"
echo -e "  Client: $CLIENT_PORT"

# Start server
echo -e "${YELLOW}Starting OpenVox Server...${NC}"
cd "$SERVER_DIR"
PORT=$SERVER_PORT npm run dev > "$SCRIPT_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_DIR/server.pid"
echo -e "${GREEN}Server started (PID: $SERVER_PORT)${NC}"

# Wait a moment for server to initialize
sleep 3

# Start client
echo -e "${YELLOW}Starting OpenVox Client...${NC}"
cd "$CLIENT_DIR"
PORT=$CLIENT_PORT npm run dev > "$SCRIPT_DIR/client.log" 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > "$PID_DIR/client.pid"
echo -e "${GREEN}Client started (PID: $CLIENT_PID)${NC}"

# Wait for servers to be ready
echo -e "${YELLOW}Waiting for servers to be ready...${NC}"
sleep 5

# Check if servers are running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Server is running on http://localhost:$SERVER_PORT${NC}"
else
    echo -e "${RED}✗ Server failed to start. Check server.log for details.${NC}"
    exit 1
fi

if kill -0 $CLIENT_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Client is running on http://localhost:$CLIENT_PORT${NC}"
else
    echo -e "${RED}✗ Client failed to start. Check client.log for details.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}OpenVox is running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Client: http://localhost:$CLIENT_PORT"
echo -e "Server: http://localhost:$SERVER_PORT"
echo -e "WebSocket: ws://localhost:$SERVER_PORT/ws"
echo ""
echo -e "Logs:"
echo -e "  Server: $SCRIPT_DIR/server.log"
echo -e "  Client: $SCRIPT_DIR/client.log"
echo ""
echo -e "To stop servers, run: ${YELLOW}./stop.sh${NC}"
echo ""

# Show recent log entries
echo -e "${YELLOW}Recent server log:${NC}"
tail -5 "$SCRIPT_DIR/server.log" 2>/dev/null || echo "No server log yet"
echo ""
echo -e "${YELLOW}Recent client log:${NC}"
tail -5 "$SCRIPT_DIR/client.log" 2>/dev/null || echo "No client log yet"