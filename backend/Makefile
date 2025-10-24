.PHONY: help build run dev test clean install

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	go mod download
	go install github.com/air-verse/air@latest

build: ## Build the application
	go build -o freewriting-api .

run: ## Run the application
	@if [ -z "$$FWD_JWT_SECRET" ]; then \
		echo "Error: FWD_JWT_SECRET environment variable is required"; \
		exit 1; \
	fi
	go run .

dev: ## Run with live reload using Air
	@if [ -z "$$FWD_JWT_SECRET" ]; then \
		echo "Error: FWD_JWT_SECRET environment variable is required"; \
		exit 1; \
	fi
	air

clean: ## Clean build artifacts and database
	rm -f freewriting-api
	rm -rf tmp/
	rm -f *.db *.db-shm *.db-wal
	rm -f build-errors.log

fmt: ## Format code
	go fmt ./...

vet: ## Run go vet
	go vet ./...

tidy: ## Tidy go modules
	go mod tidy

