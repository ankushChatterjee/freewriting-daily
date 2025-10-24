#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Show usage if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Usage: $0 [PACKAGE_PATH]"
    echo ""
    echo "Start the Freewriting Daily servers (UI and Backend) in the background"
    echo ""
    echo "Arguments:"
    echo "  PACKAGE_PATH    Path to the package folder (default: ./package)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Use default ./package"
    echo "  $0 ./build/macos-arm64       # Use specific package"
    echo "  $0 /path/to/package          # Use absolute path"
    echo ""
    echo "Stopping:"
    echo "  ./stoplocal.sh               # Stop all servers"
    exit 0
fi

# Get package path from argument or use default
PACKAGE_PATH=${1:-./package}

# Resolve to absolute path
if [[ "$PACKAGE_PATH" != /* ]]; then
    PACKAGE_PATH="$(pwd)/$PACKAGE_PATH"
fi

# Check if package folder exists
if [ ! -d "$PACKAGE_PATH" ]; then
    echo -e "${RED}Error: Package folder '$PACKAGE_PATH' does not exist${NC}"
    exit 1
fi

# Check if public folder exists inside package
PUBLIC_PATH="$PACKAGE_PATH/public"
if [ ! -d "$PUBLIC_PATH" ]; then
    echo -e "${RED}Error: Public folder not found at '$PUBLIC_PATH'${NC}"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set config file paths
export FWD_CONFIG_PATH="$SCRIPT_DIR/fwd-backend.toml"
export FWD_UI_CONFIG_PATH="$SCRIPT_DIR/fwd-ui.toml"

# Check if config files exist
if [ ! -f "$FWD_CONFIG_PATH" ]; then
    echo -e "${YELLOW}Warning: Backend config file not found at '$FWD_CONFIG_PATH'${NC}"
    echo -e "${YELLOW}Backend will use default configuration${NC}"
fi

if [ ! -f "$FWD_UI_CONFIG_PATH" ]; then
    echo -e "${YELLOW}Warning: UI config file not found at '$FWD_UI_CONFIG_PATH'${NC}"
    echo -e "${YELLOW}UI will use default configuration${NC}"
fi

# Backend binary path (in the package folder)
BACKEND_BINARY="$PACKAGE_PATH/fwd-backend"

# Check if backend binary exists
if [ ! -f "$BACKEND_BINARY" ]; then
    echo -e "${RED}Error: Backend binary not found at '$BACKEND_BINARY'${NC}"
    exit 1
fi

# Make sure backend binary is executable
chmod +x "$BACKEND_BINARY"

# Log files
UI_LOG="$SCRIPT_DIR/ui-server.log"
BACKEND_LOG="$SCRIPT_DIR/backend.log"
PID_FILE="$SCRIPT_DIR/.fwd-servers.pid"

# Clear previous logs
> "$UI_LOG"
> "$BACKEND_LOG"

# UI Server port (must be > 1024 to avoid needing sudo)
UI_PORT=7500

echo -e "${GREEN}Starting servers...${NC}"
echo -e "  Backend config: ${YELLOW}$FWD_CONFIG_PATH${NC}"
echo -e "  UI config:      ${YELLOW}$FWD_UI_CONFIG_PATH${NC}"
echo ""

# Start UI server on port 7500
echo -e "${GREEN}Starting UI server on port $UI_PORT...${NC}"
echo -e "  Public folder: ${YELLOW}$PUBLIC_PATH${NC}"
echo -e "  Logs: ${YELLOW}$UI_LOG${NC}"

cd "$PUBLIC_PATH"
python3 -m http.server $UI_PORT --bind 0.0.0.0 > "$UI_LOG" 2>&1 &
UI_PID=$!

# Check if UI server started successfully
sleep 1
if ! ps -p $UI_PID > /dev/null; then
    echo -e "${RED}Failed to start UI server${NC}"
    cat "$UI_LOG"
    exit 1
fi

cd "$SCRIPT_DIR"

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
echo -e "  Backend binary: ${YELLOW}$BACKEND_BINARY${NC}"
echo -e "  Logs: ${YELLOW}$BACKEND_LOG${NC}"

cd "$PACKAGE_PATH"
./fwd-backend > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Check if backend started successfully
sleep 1
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}Failed to start backend server${NC}"
    cat "$BACKEND_LOG"
    kill $UI_PID 2>/dev/null
    exit 1
fi

cd "$SCRIPT_DIR"

# Save PIDs to file for later cleanup
echo "$UI_PID" > "$PID_FILE"
echo "$BACKEND_PID" >> "$PID_FILE"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} THE FREEWRITING DAILY ${NC} - ${YELLOW}All Systems Operational${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}UI Server:${NC}    http://localhost:$UI_PORT"
echo -e "  ${YELLOW}Network:${NC}      http://$(hostname -I | awk '{print $1}' || echo '0.0.0.0'):$UI_PORT"
echo ""
echo -e "  ${YELLOW}PIDs:${NC}         UI=$UI_PID, Backend=$BACKEND_PID"
echo -e "  ${YELLOW}Logs:${NC}         tail -f $UI_LOG"
echo -e "                tail -f $BACKEND_LOG"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}To stop servers, run:${NC} ./stoplocal.sh"
echo -e "${YELLOW}Or manually:${NC}          kill $UI_PID $BACKEND_PID"
echo ""

