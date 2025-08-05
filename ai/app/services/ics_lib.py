# services/ics_lib.py
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Iterable, Mapping, Optional

from icalendar import Calendar, Event, vCalAddress, vText

def _base_calendar(method: str) -> Calendar:
    cal = Calendar()
    cal.add("prodid", "-//DispatchAI//EN")
    cal.add("version", "2.0")
    cal.add("method", method)
    return cal

def _organizer(addr: str, cn: str = "DispatchAI") -> vCalAddress:
    org = vCalAddress(f"MAILTO:{addr}")
    org.params["cn"] = vText(cn)
    return org

def _add_attendees(evt: Event, attendees: Iterable[str]) -> None:
    for a in attendees or []:
        v = vCalAddress(f"MAILTO:{a}")
        v.params["cn"] = vText(a.split("@")[0])
        v.params["role"] = vText("REQ-PARTICIPANT")
        v.params["rsvp"] = vText("TRUE")
        evt.add("attendee", v, encode=0)

def build_ics_request(
    *,
    uid: str,
    summary: str,
    start: datetime,
    end: datetime,
    description: Optional[str] = None,
    location: Optional[str] = None,
    organizer_email: str = "no-reply@dispatchai.com",
    organizer_name: str = "DispatchAI",
    attendees: Iterable[str] = (),
    sequence: int = 0,
    rrule: Optional[Mapping[str, object]] = None,
    alarm_minutes_before: Optional[int] = None,
) -> str:
    cal = _base_calendar("REQUEST")
    evt = Event()
    evt.add("uid", uid)
    evt.add("dtstamp", datetime.now(timezone.utc))
    evt.add("dtstart", start)
    evt.add("dtend", end)
    evt.add("sequence", sequence)
    evt.add("summary", summary)
    if description:
        evt.add("description", description)
    if location:
        evt.add("location", location)

    evt["organizer"] = _organizer(organizer_email, organizer_name)
    _add_attendees(evt, attendees)

    if rrule:
        # icalendar 接受 dict；freq 必填（"DAILY","WEEKLY","MONTHLY","YEARLY"）
        evt.add("rrule", rrule)

    if alarm_minutes_before is not None:
        from icalendar import Alarm
        alarm = Alarm()
        alarm.add("action", "DISPLAY")
        alarm.add("description", "Reminder")
        alarm.add("trigger", timedelta(minutes=-int(alarm_minutes_before)))
        evt.add_component(alarm)

    cal.add_component(evt)
    ics = cal.to_ical().decode("utf-8")
    return ics.replace("\r\n", "\n").replace("\n", "\r\n")

def build_ics_cancel(
    *,
    uid: str,
    summary: str,
    start: datetime,
    end: datetime,
    organizer_email: str = "no-reply@dispatchai.com",
    organizer_name: str = "DispatchAI",
    attendees: Iterable[str] = (),
    sequence: int = 1,
) -> str:
    cal = _base_calendar("CANCEL")
    evt = Event()
    evt.add("uid", uid)
    evt.add("dtstamp", datetime.now(timezone.utc))
    evt.add("dtstart", start)
    evt.add("dtend", end)
    evt.add("sequence", sequence)
    evt.add("status", "CANCELLED")
    evt.add("summary", summary)

    evt["organizer"] = _organizer(organizer_email, organizer_name)
    _add_attendees(evt, attendees)

    cal.add_component(evt)
    ics = cal.to_ical().decode("utf-8")
    return ics.replace("\r\n", "\n").replace("\n", "\r\n")
