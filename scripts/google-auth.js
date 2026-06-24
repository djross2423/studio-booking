require('dotenv').config()
const { google } = require('googleapis')
const http = require('http')

// Auto-capture flow: this script spins up a tiny local web server, Google
// redirects the browser back to it after you grant access, and it reads the
// auth code straight off the URL — no copy/paste, no 404.
//
// One-time setup: add this exact URL to your OAuth client's
// "Authorized redirect URIs" in Google Cloud Console:
//   http://localhost:5555/oauth2callback
// (Port 3000 is left for `next dev`; override with OAUTH_PORT if 5555 is busy.)

const PORT = Number(process.env.OAUTH_PORT) || 5555
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
)

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets'
]

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  // Force the consent screen so Google always returns a refresh_token.
  prompt: 'consent'
})

function reply(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:40px;background:#1A1A24;color:#F5F5F7">
    <h2>${message}</h2><p>You can close this tab and return to the terminal.</p></body>`)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404)
    res.end()
    return
  }

  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')

  if (error) {
    reply(res, 400, `Authorization failed: ${error}`)
    console.error('\nAuthorization was denied or failed:', error)
    server.close()
    process.exit(1)
  }

  if (!code) {
    reply(res, 400, 'No authorization code received.')
    return
  }

  try {
    // URLSearchParams already decoded the code, so getToken receives it clean.
    const { tokens } = await oauth2Client.getToken(code)
    reply(res, 200, 'Authorized! Refresh token printed in your terminal.')

    if (!tokens.refresh_token) {
      console.warn(
        '\n⚠ No refresh_token returned. Remove this app\'s access at ' +
        'https://myaccount.google.com/permissions and run this script again ' +
        '(Google only returns a refresh token on first consent).'
      )
    } else {
      console.log('\nREFRESH TOKEN (put this in .env and Vercel as GOOGLE_REFRESH_TOKEN):\n')
      console.log(tokens.refresh_token)
    }
  } catch (e) {
    reply(res, 500, 'Token exchange failed — see terminal.')
    console.error('\nToken exchange failed:', e.message || e)
  } finally {
    server.close()
    // Give the response a moment to flush before exiting.
    setTimeout(() => process.exit(0), 100)
  }
})

server.listen(PORT, () => {
  console.log(`\nListening on ${REDIRECT_URI}`)
  console.log('\n1. Make sure that exact URL is in your OAuth client\'s Authorized redirect URIs.')
  console.log('2. Open this URL in your browser, sign in, and grant access:\n')
  console.log(authUrl)
  console.log('\nWaiting for the redirect...')
})
