import sys
from pathlib import Path
from config import get_settings
from api import health, chat, call, summary, email, dispatch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mcp.server import FastApiMCP

# Add the app directory to Python path for absolute imports
app_dir = Path(__file__).parent
sys.path.insert(0, str(app_dir))


settings = get_settings()

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    debug=settings.debug,
)

# CORS middleware
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
app.include_router(call.router, prefix=settings.api_prefix)
app.include_router(summary.router, prefix=settings.api_prefix)
app.include_router(email.router, prefix=settings.api_prefix)
app.include_router(dispatch.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {
        "message": "AI Service API",
        "version": settings.api_version,
        "environment": settings.environment,
    }


mcp = FastApiMCP(
    app,
    name="Dispatch AI MCP",
    include_operations=[
        "health_ping",
        "send_email_with_ics",
        "send_email_with_google_calendar",
        "send_email_with_outlook_calendar",
    ],

)

mcp.mount_sse(app,mount_path=f"{settings.api_prefix}/mcp")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
