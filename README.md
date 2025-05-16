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
│   │   └── health/
│   │       ├── health.controller.ts # Health check endpoints
│   │       ├── health.module.ts    # Health module configuration
│   │       └── health.service.ts   # Health check business logic
│   └── main.ts                   # Application entry point
├── docker-compose.yml           # Docker multi-container setup
├── Dockerfile                   # Docker container configuration
├── nest-cli.json                # NestJS CLI configuration
├── package.json                 # Project dependencies
└── tsconfig.json                # TypeScript configuration
```

## Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- MongoDB (local or Docker)

## Getting Started

### Local Development Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start a local MongoDB instance:

   ```bash
   # Option 1: Using Docker
   docker run -p 27017:27017 mongo:latest

   # Option 2: Local MongoDB installation
   # Start your local MongoDB service
   ```

3. Run the application:

   ```bash
   # Development mode with hot-reload
   pnpm run dev

   # Production build and run
   pnpm run build
   pnpm run start
   ```

### Docker Setup

1. Build and start the containers:

   ```bash
   docker-compose up -d
   ```

2. Stop containers:

   ```bash
   docker-compose down
   ```

3. Rebuild containers after code changes:

   ```bash
   docker-compose up --build -d
   ```

4. View logs:
   ```bash
   docker-compose logs -f api
   ```

## API Endpoints

### Health Checks

- `GET /health` - Basic health check

  ```bash
  curl http://localhost:3000/health
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
  curl http://localhost:3000/health/db
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

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dispatchai
```

When using Docker Compose, these environment variables are defined in the docker-compose.yml file.

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

### Unit Tests

```bash
# Run all tests
pnpm test
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
curl http://localhost:3000/health
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
   - If changes aren't reflecting, rebuild with `docker-compose up --build -d`
   - Check logs with `docker-compose logs -f api`

## Next Steps

- Set up user authentication
- Implement database migrations
- Add validation pipes and DTOs
- Configure CI/CD pipeline

## Swagger

Enter http://localhost:3000/api-docs to view the swagger documentation
