import datetime

# generate ics file
def generate_ics(title, start, duration_minutes, description='', location='', organizer=''):
    dt_start = datetime.datetime.fromisoformat(start)
    dt_end = dt_start + datetime.timedelta(minutes=duration_minutes)
    dtstamp = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    uid = f"{dtstamp}-{title.replace(' ', '')}@dispatchai"

    ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DispatchAI//EN
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{dtstamp}
DTSTART:{dt_start.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{dt_end.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{location}
ORGANIZER;CN=DispatchAI:MAILTO:{organizer}
END:VEVENT
END:VCALENDAR
"""
    return ics