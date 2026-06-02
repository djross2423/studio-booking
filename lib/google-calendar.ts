import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
})

// ⚡ DROP THE NEW FUNCTION RIGHT HERE:
function forceIndianISOString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const yyyy = getValue('year');
  const mm = getValue('month');
  const dd = getValue('day');
  let hh = getValue('hour');
  const min = getValue('minute');
  const ss = getValue('second');

  if (hh === '24') hh = '00';

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
}

export async function createCalendarEvent(
  title: string,
  startTime: Date,
  endTime: Date,
  description?: string
) {
  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: title,
      description,
      start: {
        // Updated to use the new bulletproof formatter
        dateTime: forceIndianISOString(startTime),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: forceIndianISOString(endTime),
        timeZone: 'Asia/Kolkata'
      }
    }
  })

  return event.data
}

export async function updateCalendarEvent(
  eventId: string,
  title: string,
  startTime: Date,
  endTime: Date,
  description?: string
) {
  const event = await calendar.events.update({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    requestBody: {
      summary: title,
      description,
      start: {
        // Updated to use the new bulletproof formatter
        dateTime: forceIndianISOString(startTime),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: forceIndianISOString(endTime),
        timeZone: 'Asia/Kolkata'
      }
    }
  })

  return event.data
}

export async function deleteCalendarEvent(eventId: string) {
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId
  })
}