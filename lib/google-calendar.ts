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

// Helper function to safely format local dates into an offset string Google understands
// This converts the date without losing the +05:30 context
function toLocalISOString(date: Date): string {
  const tzo = -date.getTimezoneOffset(),
      dif = tzo >= 0 ? '+' : '-',
      pad = (num: number) => (num < 10 ? '0' : '') + num;
  
  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      dif + pad(Math.floor(Math.abs(tzo) / 60)) +
      ':' + pad(Math.abs(tzo) % 60);
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
        // Use the local offset string and explicitly target Kolkata timezone
        dateTime: toLocalISOString(startTime),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: toLocalISOString(endTime),
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
        dateTime: toLocalISOString(startTime),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: toLocalISOString(endTime),
        timeZone: 'Asia/Kolkata'
      }
    }
  })

  return event.data
}

export async function deleteCalendarEvent(
  eventId: string
) {
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId
  })
}