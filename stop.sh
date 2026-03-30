#!/bin/bash

# OpenVox Stop Script
# Stops both client and server development servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Port configuration (default, will be overridden if we find actual ports)
CLIENT_PORT=3000
SERVER_PORT=4000

# Function to check if a process is running
is_process_running() {
    local pid=$1
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0  # Process is running
    else
        return 1  # Process is not running
    fi
}

# Function to gracefully stop a process
stop_process() {
    local pid=$1
    local name=$2
    local timeout=10
    
    if is_process_running "$pid"; then
        echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
        
        # Send SIGTERM
        kill "$pid" 2>/dev/null || true
        
        # Wait for process to stop
        local count=0
        while [ $count -lt $timeout ] && is_process_running "$pid"; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if is_process_running "$pid"; then
            echo -e "${YELLOW}Force stopping $name...${NC}"
            kill -9 "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        if is_process_running "$pid"; then
            echo -e "${RED}Failed to stop $name${NC}"
            return 1
        else
            echo -e "${GREEN}✓ $name stopped${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}$name is not running${NC}"
        return 0
    fi
}

# Function to find actual port from PID or command line
find_actual_port() {
    local pid=$1
    local default_port=$2
    
    if [ -n "$pid" ] && is_process_running "$pid"; then
        # Try to get port from netstat/ss
        local port=$(netstat -tlnp 2>/dev/null | grep "$pid/" | awk '{print $4}' | cut -d: -f2 | head -1)
        if [ -n "$port" ]; then
            echo $port
            return 0
        fi
        
        # Try lsof
        port=$(lsof -p "$pid" -i -P -n 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
        if [ -n "$port" ]; then
            echo $port
            return 0
        fi
    fi
    
    echo $default_port
    return 0
}

# Main execution
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Stopping OpenVox${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if PID directory exists
if [ ! -d "$PID_DIR" ]; then
    echo -e "${YELLOW}No PID directory found, checking ports directly...${NC}"
else
    # Read PID files
    SERVER_PID=""
    CLIENT_PID=""
    
    if [ -f "$PID_DIR/server.pid" ]; then
        SERVER_PID=$(cat "$PID_DIR/server.pid" 2>/dev/null || echo "")
    fi
    
    if [ -f "$PID_DIR/client.pid" ]; then
        CLIENT_PID=$(cat "$PID_DIR/client.pid" 2>/dev/null || echo "")
    fi
    
    # Stop processes
    if [ -n "$SERVER_PID" ]; then
        SERVER_PORT=$(find_actual_port "$SERVER_PID" $SERVER_PORT)
        stop_process "$SERVER_PID" "OpenVox Server"
        rm -f "$PID_DIR/server.pid"
    else
        echo -e "${YELLOW}No server PID file found${NC}"
    fi
    
    if [ -n "$CLIENT_PID" ]; then
        CLIENT_PORT=$(find_actual_port "$CLIENT_PID" $CLIENT_PORT)
        stop_process "$CLIENT_PID" "OpenVox Client"
        rm -f "$PID_DIR/client.pid"
    else
        echo -e "${YELLOW}No client PID file found${NC}"
    fi
fi

# Additional cleanup: check ports directly
echo -e "${YELLOW}Checking for processes on default ports...${NC}"

for port in 3000 4000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Found process on port $port, stopping it...${NC}"
        fuser -k $port/tcp 2>/dev/null || true
        sleep 1
    fi
done

# Cleanup log files (optional)
if [ "$1" = "--clean-logs" ]; then
    echo -e "${YELLOW}Cleaning up log files...${NC}"
    rm -f "$SCRIPT_DIR/server.log" "$SCRIPT_DIR/client.log"
    echo -e "${GREEN}✓ Log files cleaned${NC}"
fi

# Remove PID directory if empty
if [ -d "$PID_DIR" ] && [ -z "$(ls -A "$PID_DIR")" ]; then
    rmdir "$PID_DIR" 2>/dev/null || true
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}OpenVox stopped successfully${NC}"
echo -e "${BLUE}========================================${NC}"