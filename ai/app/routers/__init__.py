from .health import router as health_router
from .ai import router as ai_router
from .email import router as email_router
from .calendar import router as calendar_router
from .flow_email_calendar import router as flow_email_calendar_router

routers = (
    health_router,
    ai_router,
    email_router,
    calendar_router,
    flow_email_calendar_router,
)

__all__ = ["routers"]
