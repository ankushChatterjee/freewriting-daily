.PHONY: help build clean build-frontend build-backend-all build-backend-linux-arm64 build-backend-linux-amd64 build-backend-macos-arm64

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: clean build-frontend build-backend-all ## Build all platforms and create distribution packages
	@echo "✅ Build complete. Just keep writing."

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf build/
	rm -rf fwd-ui/dist/

build-frontend: ## Build the frontend
	@echo "🎨 Building frontend..."
	cd fwd-ui && bun install && bun run build

build-backend-all: build-backend-linux-arm64 build-backend-linux-amd64 build-backend-macos-arm64 ## Build backend for all platforms

build-backend-linux-arm64: build-frontend ## Build for Linux ARM64
	@echo "🔨 Building backend for linux-arm64..."
	@mkdir -p build/linux-arm64/public
	cd backend && GOOS=linux GOARCH=arm64 go build -o ../build/linux-arm64/fwd-backend .
	cp -r fwd-ui/dist/* build/linux-arm64/public/
	cp -r backend/migrations build/linux-arm64/
	@echo "✅ linux-arm64 build complete"

build-backend-linux-amd64: build-frontend ## Build for Linux AMD64
	@echo "🔨 Building backend for linux-amd64..."
	@mkdir -p build/linux-amd64/public
	cd backend && GOOS=linux GOARCH=amd64 go build -o ../build/linux-amd64/fwd-backend .
	cp -r fwd-ui/dist/* build/linux-amd64/public/
	cp -r backend/migrations build/linux-amd64/
	@echo "✅ linux-amd64 build complete"

build-backend-macos-arm64: build-frontend ## Build for macOS ARM64
	@echo "🔨 Building backend for macos-arm64..."
	@mkdir -p build/macos-arm64/public
	cd backend && GOOS=darwin GOARCH=arm64 go build -o ../build/macos-arm64/fwd-backend .
	cp -r fwd-ui/dist/* build/macos-arm64/public/
	cp -r backend/migrations build/macos-arm64/
	@echo "✅ macos-arm64 build complete"

dev-backend: ## Run backend in development mode
	cd backend && make dev

dev-frontend: ## Run frontend in development mode
	cd fwd-ui && bun run dev

dev: ## Run both backend and frontend in development mode (in separate terminals)
	@echo "Run 'make dev-backend' in one terminal and 'make dev-frontend' in another"

