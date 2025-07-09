# AI Backend DDD Architecture

## Overview
The AI backend has been restructured using Domain-Driven Design (DDD) principles, providing a clean, maintainable, and scalable architecture for the AI service that handles call summaries and chat responses.

## Directory Structure

```
app/
├── core/                    # Core business logic and configurations
│   ├── __init__.py
│   └── config.py           # Pydantic-based application settings
├── domain/                  # Domain models, entities, and business logic
│   ├── __init__.py
│   ├── entities.py         # Domain entities (Call, ConversationMessage, CallSummary, ServiceInfo)
│   ├── value_objects.py    # Value objects (CallSid, MessageContent, AIPrompt, etc.)
│   └── services.py         # Domain services (ConversationFormatService, SummaryParsingService, etc.)
├── infrastructure/          # External dependencies and adapters
│   ├── __init__.py
│   ├── llm_adapter.py      # LLM service adapters (OpenAI, Mock)
│   └── llm_factory.py      # Factory for creating LLM adapters
├── services/               # Application services layer
│   ├── __init__.py
│   ├── ai_service.py       # Main AI application service
│   └── service_factory.py  # Service factory and dependency injection
├── routers/                # API routers
│   ├── __init__.py
│   ├── ai.py              # AI endpoints with DDD integration
│   └── health.py          # Health check endpoints
├── utils/                  # Utility functions and helpers
│   ├── __init__.py
│   ├── validation.py      # Input validation utilities
│   └── datetime_utils.py  # Date/time utilities
├── test/                   # Test modules
│   ├── __init__.py
│   ├── test_domain_entities.py     # Domain entity tests
│   ├── test_domain_services.py     # Domain service tests
│   └── test_prompt_integration.py  # Integration tests
├── dependencies.py         # FastAPI dependency injection
└── main.py                 # Main FastAPI application
```

## Architecture Layers

### 1. Domain Layer (`app/domain/`)
Contains the core business logic and domain models.

**Entities:**
- `ConversationMessage`: Represents a message in a conversation with speaker type and timestamp
- `Call`: Represents a phone call with conversation history and metadata
- `CallSummary`: Represents a generated AI summary of a call
- `ServiceInfo`: Information about booked services

**Value Objects:**
- `CallSid`: Twilio Call SID with validation
- `MessageContent`: Message content with validation rules
- `SummaryText`: Summary text with length constraints
- `KeyPoint`: Individual key points from summaries
- `AIPrompt`: AI prompts with optional context

**Domain Services:**
- `ConversationFormatService`: Formats conversations for AI processing
- `SummaryParsingService`: Parses AI responses into structured data
- `CallSummaryService`: Creates call summaries from AI responses
- `ConversationValidationService`: Validates conversation data integrity

### 2. Infrastructure Layer (`app/infrastructure/`)
Handles external dependencies and technical implementations.

**LLM Adapters:**
- `LLMAdapter`: Abstract base class for LLM providers
- `OpenAILLMAdapter`: OpenAI implementation using LangChain
- `MockLLMAdapter`: Mock implementation for testing
- `LLMFactory`: Factory for creating appropriate LLM adapters

### 3. Application Services Layer (`app/services/`)
Orchestrates domain services and coordinates business operations.

**Services:**
- `AIService`: Main application service for AI operations
- `ServiceFactory`: Factory for creating and managing service instances with dependency injection

### 4. Core Layer (`app/core/`)
Contains application-wide configurations and settings.

**Configuration:**
- `Settings`: Pydantic-based configuration with environment variable support
- Support for different environments (development, staging, production)
- LLM provider configuration
- CORS and security settings

### 5. API Layer (`app/routers/`)
FastAPI routers implementing the REST API.

**Endpoints:**
- `/ai/chat`: Generate chat responses using LLM
- `/ai/reply`: Echo endpoint for testing
- `/ai/summary`: Generate AI-powered call summaries
- `/health`: Health check endpoint

### 6. Utilities (`app/utils/`)
Common utility functions used across the application.

**Validation:**
- Call SID format validation
- Message content validation
- Conversation data structure validation
- Service information validation

**DateTime Utilities:**
- UTC timestamp handling
- Flexible timestamp parsing
- Timezone-aware datetime operations

## Key Features

### 1. **Clean Architecture**
- Clear separation of concerns across layers
- Business logic isolated in domain layer
- Infrastructure concerns abstracted away
- Testable and maintainable code structure

### 2. **Configuration Management**
```python
# Environment-based configuration
class Settings(BaseSettings):
    environment: Environment = Environment.DEVELOPMENT
    llm_provider: LLMProvider = LLMProvider.OPENAI
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    # ... more settings
```

### 3. **Dependency Injection**
```python
# Service factory pattern
@router.post("/chat")
async def chat_endpoint(
    body: MessageIn,
    ai_service: AIService = Depends(get_ai_service)
):
    # Implementation uses injected service
```

### 4. **Extensible LLM Support**
```python
# Easy to add new LLM providers
class LLMFactory:
    @staticmethod
    def create_adapter(provider: LLMProvider, **kwargs) -> LLMAdapter:
        if provider == LLMProvider.OPENAI:
            return OpenAILLMAdapter(**kwargs)
        elif provider == LLMProvider.MOCK:
            return MockLLMAdapter(**kwargs)
        # Add more providers here
```

### 5. **Comprehensive Validation**
```python
# Input validation at multiple levels
def validate_call_data(call_sid: str, conversation: List[Dict]) -> bool:
    # Validates call SID format
    # Validates conversation structure
    # Validates message content
```

### 6. **Domain-Driven Design**
```python
# Rich domain models with behavior
class Call:
    def add_message(self, message: ConversationMessage) -> None:
        self.conversation.append(message)
    
    def generate_conversation_text(self) -> str:
        # Business logic stays in domain
```

## Benefits

### 1. **Maintainability**
- Code organized by business concepts
- Clear dependencies between components
- Easy to understand and modify business logic
- Consistent error handling and validation

### 2. **Testability**
- Each layer can be tested independently
- Mock implementations for external dependencies
- Comprehensive unit tests for domain logic
- Integration tests for API endpoints

### 3. **Scalability**
- Easy to add new LLM providers
- Simple to extend with new business features
- Configuration-driven behavior
- Modular architecture supports team development

### 4. **Type Safety**
- Strong typing throughout the codebase
- Pydantic models for data validation
- Clear contracts between layers
- Compile-time error detection

### 5. **Performance**
- Efficient dependency injection
- Configurable LLM settings
- Optimized conversation processing
- Minimal overhead from architecture

## Usage Examples

### 1. **Chat Response**
```python
POST /api/ai/chat
{
    "callSid": "CA123456789",
    "message": "Hello, I need help"
}
```

### 2. **Call Summary**
```python
POST /api/ai/summary
{
    "callSid": "CA123456789",
    "conversation": [
        {
            "speaker": "customer",
            "message": "I have a water leak",
            "timestamp": "2024-03-21T10:00:00Z"
        }
    ],
    "serviceInfo": {
        "name": "Emergency Plumbing",
        "booked": true
    }
}
```

### 3. **Configuration**
```bash
# Environment variables
OPENAI_API_KEY=your_api_key
LLM_PROVIDER=openai
ENVIRONMENT=production
DEBUG=false
```

## Testing

### 1. **Domain Tests**
```python
# Test domain entities
def test_create_valid_call():
    call = Call(call_sid="CA123", conversation=[])
    assert call.message_count == 0
```

### 2. **Service Tests**
```python
# Test application services
async def test_generate_chat_response():
    service = AIService(mock_llm_adapter)
    response = await service.generate_chat_response("CA123", "Hello")
    assert response is not None
```

### 3. **Integration Tests**
```python
# Test API endpoints
async def test_chat_endpoint():
    response = await client.post("/api/ai/chat", json=test_data)
    assert response.status_code == 200
```

## Deployment

The architecture supports various deployment scenarios:

1. **Development**: Use mock LLM adapter for testing
2. **Staging**: Use OpenAI with reduced rate limits
3. **Production**: Full OpenAI integration with monitoring

## Future Enhancements

1. **Additional LLM Providers**: Easy to add Azure OpenAI, Anthropic Claude, etc.
2. **Caching**: Add Redis caching for frequent requests
3. **Monitoring**: Add observability and metrics
4. **Authentication**: Enhanced security features
5. **Rate Limiting**: API rate limiting and quotas

## Conclusion

This DDD architecture provides a solid foundation for the AI backend service, with clear separation of concerns, comprehensive testing, and excellent maintainability. The design supports future growth and modifications while maintaining code quality and performance.