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
        dateTime: startTime.toISOString()
      },
      end: {
        dateTime: endTime.toISOString()
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
        dateTime: startTime.toISOString()
      },
      end: {
        dateTime: endTime.toISOString()
      }
    }
  })

  return event.data
}
