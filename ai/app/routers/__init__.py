from .health import router as health_router
from .ai import router as ai_router
from .email import router as email_router

routers = (
    health_router,
    ai_router,
    email_router,
)

__all__ = ["routers"]
