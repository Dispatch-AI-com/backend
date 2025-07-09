from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import get_settings
from .routers import health
from .routers import chat
from .routers import call_summary


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 AI Service starting up...")
    yield
    # Shutdown
    print("🔥 AI Service shutting down...")


def create_app() -> FastAPI:
    """Create FastAPI application with DDD architecture."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        debug=settings.debug,
        description="AI Service API for call summaries and chat interactions",
        lifespan=lifespan
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
    )

    # Include routers
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(chat.router, prefix=settings.api_prefix)
    app.include_router(call_summary.router, prefix=settings.api_prefix)

    return app


# Create the app instance
app = create_app()


@app.get("/")
async def root():
    """Root endpoint with service information."""
    settings = get_settings()
    return {
        "message": "AI Service API - DDD Architecture",
        "status": "running",
        "version": settings.api_version,
        "environment": settings.environment,
        "endpoints": {
            "health": "/api/health",
            "chat": "/api/ai/chat",
            "summary": "/api/ai/summary",
            "docs": "/docs",
            "openapi": "/openapi.json"
        }
    }


@app.get("/info")
async def service_info():
    """Service information endpoint."""
    settings = get_settings()
    return {
        "service": "AI Backend Service",
        "version": settings.api_version,
        "environment": settings.environment,
        "llm_provider": settings.llm_provider,
        "debug": settings.debug,
        "features": [
            "Call Summary Generation",
            "Chat Response Generation", 
            "Emergency Response Handling",
            "Customer Service Support"
        ]
    }
