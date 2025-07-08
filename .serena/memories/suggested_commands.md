# Suggested Development Commands

## Package Management
```bash
# Install dependencies
pnpm install

# Add new dependency
pnpm add <package-name>
```

## Development
```bash
# Start development server (NestJS)
pnpm run dev

# Build application
pnpm run build

# Start production
pnpm run start
```

## Code Quality
```bash
# Run linting and formatting
pnpm run lint

# Type checking
pnpm run type-check

# Run tests
pnpm run test
```

## Docker Operations
```bash
# Development environment
docker compose up -d --build
docker compose logs -f api

# UAT environment
docker compose -f docker-compose.uat.yml up -d --build

# Stop containers
docker compose down
```

## AI Service (Python)
```bash
# Navigate to AI directory
cd ai/

# Install dependencies (using uv)
uv sync

# Run AI service
uv run python -m app.main

# Run tests
uv run pytest
```

## Health Checks
```bash
# API health check
curl http://localhost:4000/api/health

# Database health check
curl http://localhost:4000/api/health/db
```

## Useful Tools
- **Swagger Documentation**: http://localhost:4000/api/docs
- **Git Operations**: Standard git commands for version control
- **File Operations**: Use ls, find, grep for file exploration
- **Log Viewing**: docker compose logs -f [service-name]