# Code Style and Conventions

## TypeScript/NestJS Conventions
- **Imports**: Use path aliases with `@/` prefix (e.g., `@/modules/health/health.service`)
- **Naming**: 
  - Classes: PascalCase (e.g., `HealthService`)
  - Files: kebab-case (e.g., `health.service.ts`)
  - Variables/functions: camelCase
- **Module Structure**: Controller → Service → Repository pattern
- **Decorators**: Use NestJS decorators (`@Controller`, `@Injectable`, `@Get`, etc.)

## Python/FastAPI Conventions
- **Imports**: Relative imports for local modules (e.g., `from .models import Message`)
- **Naming**:
  - Classes: PascalCase (e.g., `CustomerServiceLangGraph`)
  - Files: snake_case (e.g., `customer_validators.py`)
  - Functions: snake_case (e.g., `process_name_collection`)
- **Type Hints**: Use typing module for type annotations
- **Docstrings**: Google-style docstrings for functions and classes

## File Organization
- **NestJS**: Group by feature modules in `src/modules/`
- **Python AI**: Separate concerns into modules:
  - `routers/`: API endpoints
  - `prompt/`: LLM prompt templates
  - `validate/`: Data validation functions
  - `services/`: Business logic

## API Design
- **REST Endpoints**: Use standard HTTP verbs
- **Request/Response**: Use Pydantic models for validation
- **Error Handling**: Proper HTTP status codes and error messages

## Documentation
- **Code Comments**: Explain complex business logic
- **Type Annotations**: Required for all function parameters and returns
- **README**: Keep project documentation updated