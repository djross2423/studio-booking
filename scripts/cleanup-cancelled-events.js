require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { google } = require('googleapis')

const prisma = new PrismaClient()

async function run() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  })

  const calendar = google.calendar({
    version: 'v3',
    auth
  })

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'cancelled',
      googleEventId: {
        not: null
      }
    }
  })

  console.log(`Found ${bookings.length} cancelled bookings`)

  for (const booking of bookings) {
    try {
      console.log(`Deleting ${booking.googleEventId}`)

      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: booking.googleEventId
      })

      console.log(`Deleted booking ${booking.id}`)
    } catch (err) {
      console.error(`Failed booking ${booking.id}`, err.message)
    }
  }

  await prisma.$disconnect()
}

run().catch(console.error)
