require('dotenv').config()
const { google } = require('googleapis')
const readline = require('readline')

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback/google'
)

const scopes = [
  'https://www.googleapis.com/auth/calendar'
]

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
})

console.log('\nOpen this URL:\n')
console.log(authUrl)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('\nPaste code here: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code)

  console.log('\nREFRESH TOKEN:\n')
  console.log(tokens.refresh_token)

  rl.close()
})
