from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def push_event_to_google_calendar(
    access_token: str,
    title: str,
    start: str,
    end: str,
    description: str = "",
    location: str = "",
    organizer: str = ""
) -> str:
    """
    Use access_token to push an event to Google Calendar and return the event link
    start/end: ISO format strings, e.g. '2024-04-01T10:00:00+08:00'
    use google calendar api to push event to google calendar
    https://developers.google.com/calendar/api/guides/overview
    """
    creds = Credentials(token=access_token)
    service = build('calendar', 'v3', credentials=creds)
    event = {
        'summary': title,
        'location': location,
        'description': description,
        'start': {
            'dateTime': start,
            'timeZone': 'Australia/Sydney',  
        },
        'end': {
            'dateTime': end,
            'timeZone': 'Australia/Sydney',
        },
        'organizer': {
            'email': organizer
        } if organizer else None,
    }
    # remove None fields
    event = {k: v for k, v in event.items() if v is not None}
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    return created_event.get('htmlLink')