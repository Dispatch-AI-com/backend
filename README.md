# DispatchAI Backend

This repository contains the backend API for DispatchAI built with NestJS and MongoDB.

## Project Structure

```
dispatchai-backend/
├── src/
│   ├── modules/
│   │   ├── app.module.ts         # Main application module
│   │   ├── database/
│   │   │   └── database.module.ts # MongoDB connection module
│   │   ├── telephony/            # Voice interaction system
│   │   ├── calllog/              # Call record management
│   │   ├── transcript/           # Call transcripts and summaries
│   │   └── health/
│   │       ├── health.controller.ts # Health check endpoints
│   │       ├── health.module.ts    # Health module configuration
│   │       └── health.service.ts   # Health check business logic
│   └── main.ts                   # Application entry point
├── ai/                          # Python AI service
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   └── routers/
│   │       └── ai.py            # AI endpoints (/chat, /reply, /summary)
│   ├── pyproject.toml           # Python dependencies (uv)
│   └── Dockerfile               # AI service container
├── docker-compose.yml           # Docker multi-container setup
├── Dockerfile                   # NestJS API container configuration
├── nest-cli.json                # NestJS CLI configuration
├── package.json                 # Project dependencies
└── tsconfig.json                # TypeScript configuration
```

## Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- MongoDB (local or Docker)
- Python 3.11+ (for AI module)
- uv (Python package manager)

## Getting Started

### Local Development Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run the application:

   ```bash
   pnpm build
   ```

### Docker Setup (DEV)

1. Stop containers:

   ```bash
   docker compose down
   ```

2. Build container & Rebuild containers after code changes:

   ```bash
   docker compose up -d --build 
   ```

3. View logs:

   ```bash
   docker compose logs -f api
   ```

### Docker Setup (UAT)

1. Stop containers:

   ```bash
   docker compose down
   ```

2. Build container & Rebuild containers after code changes:

   ```bash
   docker compose -f docker-compose.uat.yml up -d --build
   ```

## AI Module Setup

The AI module is a Python FastAPI service that provides AI-powered conversation processing for the telephony system.

### Dependencies

The AI module uses [uv](https://docs.astral.sh/uv/) as the Python package manager. Dependencies are defined in `ai/pyproject.toml`:

- **FastAPI**: Web framework for the AI API
- **LangChain OpenAI**: LLM integration for conversation processing
- **Ruff**: Python linting and formatting

### Local Development

To run the AI module locally:

1. Install uv (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Navigate to AI directory and install dependencies:
   ```bash
   cd ai
   uv sync
   ```

3. Run the FastAPI development server:
   ```bash
   uv run fastapi dev app/main.py
   ```

The AI service will be available at `http://localhost:8000` with automatic API documentation at `http://localhost:8000/docs`.

### Docker Deployment

The AI service is automatically included in the Docker Compose setup:

- **Service name**: `dispatchai-ai`
- **Internal port**: 8000
- **Container networking**: The NestJS backend communicates with the AI service via `http://dispatchai-ai:8000`

### AI Endpoints

- `POST /api/ai/chat` - LLM-powered conversation processing
- `POST /api/ai/reply` - Echo/placeholder responses  
- `POST /api/ai/summary` - Generate call summaries and key points

### Integration

The telephony service integrates with the AI module through HTTP calls:
- **Conversation processing**: `telephony.service.ts:125` calls `/api/ai/reply`
- **Call summarization**: `telephony.service.ts:258` calls `/api/ai/summary`

### Health Checks

- `GET /health` - Basic health check


  ```bash
  curl http://localhost:4000/api/health
  ```

  Expected response:

  ```json
  {
    "status": "ok",
    "timestamp": "2025-03-03T14:15:00.000Z",
    "service": "dispatchAI API",
    "environment": "development"
  }
  ```

- `GET /health/db` - Database connection check
  ```bash
  curl http://localhost:4000/api/health/db
  ```
  Expected response:
  ```json
  {
    "status": "ok",
    "database": "MongoDB",
    "connected": true,
    "timestamp": "2025-03-03T14:15:00.000Z"
  }
  ```

## Configuration

### Path Aliases

This project uses TypeScript path aliases with the `@/` prefix to simplify imports:

```typescript
// Instead of relative paths like
import { SomeService } from "../../some/path/some.service";

// Use path aliases
import { SomeService } from "@/modules/some/some.service";
```

These are configured in the `tsconfig.json` file.

## Adding New Modules

To create a new feature module:

1. Create the directory structure:

   ```bash
   mkdir -p src/modules/your-feature
   ```

2. Create the module files:

   ```bash
   touch src/modules/your-feature/your-feature.module.ts
   touch src/modules/your-feature/your-feature.controller.ts
   touch src/modules/your-feature/your-feature.service.ts
   ```

3. Implement your feature logic in these files

4. Import your feature module in the app.module.ts:

   ```typescript
   import { Module } from "@nestjs/common";
   import { DatabaseModule } from "@/modules/database/database.module";
   import { HealthModule } from "@/modules/health/health.module";
   import { YourFeatureModule } from "@/modules/your-feature/your-feature.module";

   @Module({
     imports: [DatabaseModule, HealthModule, YourFeatureModule],
   })
   export class AppModule {}
   ```

## Testing

```bash
# Run all tests
pnpm test
```

```bash
# Run test file
pnpm test path/to/your/test_file.ts
```

### Type Checking

```bash
pnpm run type-check
```

### Linting

```bash
pnpm run lint
```

### API Tests

You can use tools like Postman, cURL, or REST client extensions to test the API endpoints.

Example with cURL:

```bash
curl http://localhost:4000/api/health
```

## Troubleshooting

### Common Issues

1. **Module not found errors**:

   - Check import paths (especially with path aliases)
   - Verify module is properly exported and imported

2. **Endpoints not accessible**:

   - Check if NestJS has registered the routes (look for "Mapped {route}" in logs)
   - Verify controller is properly included in its module
   - Make sure the module is imported in app.module.ts

3. **Docker issues**:
   - If changes aren't reflecting, rebuild with `docker compose up --build -d`
   - Check logs with `docker compose logs -f api`

## Next Steps

- Set up user authentication
- Implement database migrations
- Add validation pipes and DTOs
- Configure CI/CD pipeline

## Swagger

Enter http://localhost:4000/api/docs to view the swagger documentation

