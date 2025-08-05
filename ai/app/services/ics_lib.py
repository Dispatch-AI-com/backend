# services/ics_lib.py
from __future__ import annotations
from typing import Iterable, Mapping, Optional
import pendulum
from datetime import timedelta
from ics import Calendar, Event, DisplayAlarm


def _rrule_to_str(rrule: Mapping[str, object]) -> str:
    """
    把 {"freq":"WEEKLY","interval":1,"byday":["MO","WE"]} 转成
    "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE"
    """
    parts = []
    for k, v in rrule.items():
        key = str(k).upper()
        if isinstance(v, (list, tuple)):
            val = ",".join(str(x) for x in v)
        else:
            val = str(v)
        parts.append(f"{key}={val}")
    return ";".join(parts)


def build_ics_request(
    *,
    uid: str,
    summary: str,
    start: pendulum.DateTime,
    end: pendulum.DateTime,
    description: Optional[str] = None,
    location: Optional[str] = None,
    organizer_email: str = "no-reply@dispatchai.com",
    organizer_name: str = "DispatchAI",
    attendees: Iterable[str] = (),
    sequence: int = 0,
    rrule: Optional[Mapping[str, object]] = None,
    alarm_minutes_before: Optional[int] = None,
) -> str:
    cal = Calendar()
    cal.method = "REQUEST"

    ev = Event()
    ev.uid = uid
    ev.name = summary
    ev.begin = start
    ev.end = end

    if description:
        ev.description = description
    if location:
        ev.location = location

    ev.organizer = f"CN={organizer_name}:mailto:{organizer_email}"

    for a in attendees or []:
        cn = a.split("@")[0]
        ev.attendees.add(f"CN={cn}:mailto:{a}")

    if rrule:
        ev.extra.append(("RRULE", _rrule_to_str(rrule)))

    if alarm_minutes_before is not None:
        # ⚠️ 这里改成 timedelta，不能再用 int
        ev.alarms.append(
            DisplayAlarm(trigger=timedelta(minutes=-int(alarm_minutes_before)))
        )

    cal.events.add(ev)
    return cal.serialize()


def build_ics_cancel(
    *,
    uid: str,
    summary: str,
    start: pendulum.DateTime,
    end: pendulum.DateTime,
    organizer_email: str = "no-reply@dispatchai.com",
    organizer_name: str = "DispatchAI",
    attendees: Iterable[str] = (),
    sequence: int = 1,
) -> str:
    cal = Calendar()
    cal.method = "CANCEL"

    ev = Event()
    ev.uid = uid
    ev.name = summary
    ev.begin = start
    ev.end = end
    ev.status = "CANCELLED"

    ev.organizer = f"CN={organizer_name}:mailto:{organizer_email}"

    for a in attendees or []:
        cn = a.split("@")[0]
        ev.attendees.add(f"CN={cn}:mailto:{a}")

    cal.events.add(ev)
    return cal.serialize()
