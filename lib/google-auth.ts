import { google } from 'googleapis'

// Shared OAuth2 client for all Google integrations (Calendar + Sheets).
// The refresh token must carry every scope used — currently calendar +
// spreadsheets. Re-run scripts/google-auth.js after changing scopes.
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})
