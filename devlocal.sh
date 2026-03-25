#!/usr/bin/env bash
# Start backend (Go + SQLite) and frontend (Vite) together for local development.
#
# Usage:
#   ./devlocal.sh
#
# Optional environment overrides:
#   FWD_JWT_SECRET     JWT signing secret (default: insecure-secret — local only)
#   FWD_CONFIG_PATH    Backend TOML (default: ./fwd-backend.toml in repo root)
#   VITE_API_URL       API base URL for the UI (default: http://localhost:3000)
#   FWD_UI_CONFIG_PATH UI TOML path (default: ./fwd-ui.toml in repo root)

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    sed -n '2,12p' "$0" | sed 's/^# //' | sed 's/^#//'
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export FWD_CONFIG_PATH="${FWD_CONFIG_PATH:-$SCRIPT_DIR/fwd-backend.toml}"
export FWD_JWT_SECRET="${FWD_JWT_SECRET:-insecure-secret}"

(
    cd "$SCRIPT_DIR/backend"
    exec go run .
) &
BACKEND_PID=$!

cleanup() {
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo ""
        echo -e "${YELLOW}Stopping backend (PID $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

sleep 1
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${RED}Backend failed to start. Check that Go is installed and backend builds.${NC}"
    exit 1
fi

echo -e "${GREEN}Backend running (PID $BACKEND_PID) — API from ${FWD_CONFIG_PATH}${NC}"
echo -e "${GREEN}Starting Vite dev server (Ctrl+C stops both)...${NC}"
echo ""

cd "$SCRIPT_DIR/fwd-ui"
export VITE_API_URL="${VITE_API_URL:-http://localhost:3000}"
export FWD_UI_CONFIG_PATH="${FWD_UI_CONFIG_PATH:-$SCRIPT_DIR/fwd-ui.toml}"

bun run dev
