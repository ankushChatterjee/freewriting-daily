# Configuration Guide

This project uses separate TOML configuration files for the backend and frontend components.

## Configuration Files

### `fwd-backend.toml` - Backend API Configuration (Runtime)

Located in the project root, this file configures the Go backend server.

**Configuration Options:**

```toml
# Server configuration
port = 3000  # Port the API server will listen on

# Database configuration
database_path = "./freewriting.db"  # Path to SQLite database file

# JWT configuration
jwt_expiry = "720h"  # JWT token expiry time (h=hours, m=minutes, s=seconds)

# Application configuration
minimum_words = 13  # Minimum words required to count towards daily streak
```

**Important:** The JWT secret must be set via the `FWD_JWT_SECRET` environment variable and is required for the backend to start.

### `fwd-ui.toml` - Frontend UI Configuration (Build Time)

Located in the project root, this file configures the React frontend application.

**Configuration Options:**

```toml
# API configuration
api_url = "http://localhost:3000"  # Backend API URL

# Application configuration
minimum_words = 13  # Minimum words to count towards streak (should match backend)
```

## Using Custom Configuration Paths

Both the backend and frontend support custom configuration file paths via environment variables.

### Backend

Set the `FWD_CONFIG_PATH` environment variable to point to your custom config file:

```bash
# Using custom config path
export FWD_CONFIG_PATH=/path/to/my-custom-backend.toml
cd backend && go run .
```

**Default behavior:** If `FWD_CONFIG_PATH` is not set, the backend looks for `fwd-backend.toml` in:
1. Current directory (backend/)
2. Parent directory (project root)

### Frontend

Set the `FWD_UI_CONFIG_PATH` environment variable to point to your custom config file:

```bash
# Using custom config path
export FWD_UI_CONFIG_PATH=/path/to/my-custom-ui.toml
cd fwd-ui && bun run dev
```

**Default behavior:** If `FWD_UI_CONFIG_PATH` is not set, the frontend looks for `fwd-ui.toml` in the project root.

## Environment Variables

Both components support environment variable overrides with the `FWD_` prefix.

### Backend Environment Variables

```bash
# Required
export FWD_JWT_SECRET="your-super-secret-jwt-key"

# Optional (override config file values)
export FWD_PORT=8080
export FWD_DATABASE_PATH="/var/lib/freewriting/data.db"
export FWD_JWT_EXPIRY="168h"  # 7 days
export FWD_MINIMUM_WORDS=50
```

### Frontend Environment Variables

The frontend uses Vite's environment variable system:

```bash
# Override config file values
export VITE_API_URL="https://api.example.com"
export VITE_MINIMUM_WORDS=50
```

## Configuration Priority

The configuration is resolved in the following order (highest to lowest priority):

1. **Environment variables** - Override everything
2. **Custom config file** - Via `FWD_CONFIG_PATH` or `FWD_UI_CONFIG_PATH`
3. **Default config file** - `fwd-backend.toml` or `fwd-ui.toml`
4. **Built-in defaults** - Hardcoded fallback values

## Examples

### Development Setup

For local development, use the default configuration files:

```bash
# Terminal 1 - Backend
cd backend
export FWD_JWT_SECRET="dev-secret-key-change-in-production"
go run .

# Terminal 2 - Frontend
cd fwd-ui
bun run dev
```

### Production Setup

For production, you might want to use environment variables:

```bash
# Backend
export FWD_JWT_SECRET="$(openssl rand -base64 32)"
export FWD_PORT=8080
export FWD_DATABASE_PATH="/var/lib/freewriting/data.db"
cd backend && ./freewriting-daily

# Frontend (build)
export VITE_API_URL="https://api.yourdomain.com"
cd fwd-ui && bun run build
```

### Multiple Environments

You can maintain separate config files for different environments:

```bash
# Development
export FWD_CONFIG_PATH=./config/dev-backend.toml
export FWD_UI_CONFIG_PATH=./config/dev-ui.toml

# Staging
export FWD_CONFIG_PATH=./config/staging-backend.toml
export FWD_UI_CONFIG_PATH=./config/staging-ui.toml

# Production
export FWD_CONFIG_PATH=/etc/freewriting/backend.toml
export FWD_UI_CONFIG_PATH=/etc/freewriting/ui.toml
```

## Notes

- The `minimum_words` setting should be kept in sync between backend and frontend configs
- The JWT secret should never be committed to version control
- For production, always use strong, randomly generated JWT secrets
- The database path is relative to the backend binary's working directory
- Frontend environment variables must be prefixed with `VITE_` to be exposed to the client

