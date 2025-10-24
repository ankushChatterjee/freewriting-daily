#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.fwd-servers.pid"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}No running servers found (PID file missing)${NC}"
    echo -e "${YELLOW}Searching for processes manually...${NC}"
    
    # Try to find and kill Python HTTP server on port 7500
    UI_PIDS=$(lsof -ti:7500 2>/dev/null)
    if [ ! -z "$UI_PIDS" ]; then
        echo -e "${YELLOW}Found UI server(s) on port 7500${NC}"
        kill $UI_PIDS 2>/dev/null
        echo -e "${GREEN}UI server(s) stopped${NC}"
    fi
    
    # Try to find and kill fwd-backend
    BACKEND_PIDS=$(pgrep -f "fwd-backend" 2>/dev/null)
    if [ ! -z "$BACKEND_PIDS" ]; then
        echo -e "${YELLOW}Found backend server(s)${NC}"
        kill $BACKEND_PIDS 2>/dev/null
        echo -e "${GREEN}Backend server(s) stopped${NC}"
    fi
    
    if [ -z "$UI_PIDS" ] && [ -z "$BACKEND_PIDS" ]; then
        echo -e "${RED}No servers found running${NC}"
    fi
    
    exit 0
fi

# Read PIDs from file
UI_PID=$(head -n 1 "$PID_FILE")
BACKEND_PID=$(tail -n 1 "$PID_FILE")

echo -e "${YELLOW}Stopping servers...${NC}"

# Stop UI server
if [ ! -z "$UI_PID" ]; then
    if ps -p $UI_PID > /dev/null 2>&1; then
        kill $UI_PID 2>/dev/null
        echo -e "${GREEN}✓ UI server stopped (PID: $UI_PID)${NC}"
    else
        echo -e "${YELLOW}✗ UI server not running (PID: $UI_PID)${NC}"
    fi
fi

# Stop backend server
if [ ! -z "$BACKEND_PID" ]; then
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Backend server stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}✗ Backend server not running (PID: $BACKEND_PID)${NC}"
    fi
fi

# Remove PID file
rm -f "$PID_FILE"

echo ""
echo -e "${GREEN}Servers stopped successfully${NC}"

