from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.ses_calendar import generate_ics
from app.services.google_calendar import push_event_to_google_calendar

router = APIRouter(
    prefix="/calendar",
    tags=["calendar"],
    responses={404: {"description": "Not found"}},
)

class CalendarArgs(BaseModel):
    title: str = Field(..., description="事件标题")
    start: str = Field(..., description="开始时间，ISO格式")
    end: str = Field(..., description="结束时间，ISO格式")
    description: str = Field('', description="事件描述")
    location: str = Field('', description="事件地点")
    organizer: str = Field('', description="组织者邮箱")
    access_token: str = Field('', description="Google Calendar OAuth2 access_token")

@router.post("/generate", summary="生成ICS日历内容")
async def generate_calendar(args: CalendarArgs):
    ics_content = generate_ics(
        title=args.title,
        start=args.start,
        duration_minutes=60,  # 你可以根据start/end计算
        description=args.description,
        location=args.location,
        organizer=args.organizer,
    )
    return {"ics": ics_content}

@router.post("/push", summary="直推事件到Google Calendar")
async def push_calendar(args: CalendarArgs):
    if not args.access_token:
        raise HTTPException(status_code=400, detail="access_token is required")
    try:
        event_link = push_event_to_google_calendar(
            access_token=args.access_token,
            title=args.title,
            start=args.start,
            end=args.end,
            description=args.description,
            location=args.location,
            organizer=args.organizer,
        )
        return {"event_link": event_link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))