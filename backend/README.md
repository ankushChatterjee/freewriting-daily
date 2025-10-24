## Prerequisites

- Go 1.24 or higher
- Air (for development)

## Configuration

The app can be configured via `config.toml` or environment variables. Environment variables take precedence.

### config.toml
```toml
[server]
port = 3000

[database]
path = "./freewriting.db"

[jwt]
expiry = "720h"  # 30 days
```

### Environment Variables

- `FWD_SERVER_PORT` - Server port (default: 3000)
- `FWD_DATABASE_PATH` - Database file path (default: ./freewriting.db)
- `FWD_JWT_SECRET` - **Required** - Secret key for JWT signing
- `FWD_JWT_EXPIRY` - JWT expiration duration (default: 720h)

## Installation

1. Install dependencies:
```bash
go mod download
```

2. Install Air for development:
```bash
go install github.com/air-verse/air@latest
```

### Development (with live reload)

```bash
# Set JWT secret
export FWD_JWT_SECRET="your-secret-key-here"

# Run with Air
air
```