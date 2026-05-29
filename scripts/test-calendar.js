require('dotenv').config()

const { google } = require('googleapis')

async function test() {
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

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: 'Raw Music Studio Test',
      start: {
        dateTime: new Date(Date.now() + 3600000).toISOString()
      },
      end: {
        dateTime: new Date(Date.now() + 7200000).toISOString()
      }
    }
  })

  console.log(event.data.htmlLink)
}

test().catch(console.error)
