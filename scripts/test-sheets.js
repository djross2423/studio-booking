require('dotenv').config()
const { google } = require('googleapis')

// Usage:
//   node scripts/test-sheets.js                # uses GOOGLE_SHEETS_ID from .env
//   node scripts/test-sheets.js <SPREADSHEET_ID>   # test a specific id (overrides env)
//
// Walks the whole Sheets chain and prints a verdict for each step so we know
// exactly what's wrong: bad id, expired token, missing scope, or no access.

const sheetId = process.argv[2] || process.env.GOOGLE_SHEETS_ID || ''
const RANGE = 'Ledger!A:G'

function line(ok, label, detail) {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
}

async function main() {
  console.log('\n--- Google Sheets diagnostic ---\n')

  // 1. The id itself
  if (!sheetId) {
    line(false, 'GOOGLE_SHEETS_ID', 'not set (pass one as an argument or set it in .env)')
    return
  }
  if (sheetId.startsWith('AIza')) {
    line(false, 'GOOGLE_SHEETS_ID format', `"${sheetId.slice(0, 6)}…" looks like an API KEY, not a spreadsheet id`)
    console.log('   → Get the id from the sheet URL: /spreadsheets/d/<THIS>/edit\n')
    return
  }
  line(true, 'GOOGLE_SHEETS_ID format', `${sheetId.slice(0, 6)}… (${sheetId.length} chars)`)

  // 2. OAuth client + token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

  let accessToken
  try {
    const r = await oauth2Client.getAccessToken()
    accessToken = r.token
    line(true, 'Refresh token', 'exchanged for an access token OK')
  } catch (e) {
    line(false, 'Refresh token', (e && e.message) || String(e))
    console.log('   → Token is invalid/expired/revoked. Re-run: node scripts/google-auth.js\n')
    return
  }

  // 3. Granted scopes
  try {
    const info = await oauth2Client.getTokenInfo(accessToken)
    const scopes = info.scopes || []
    const hasSheets = scopes.some((s) => s.includes('spreadsheets'))
    line(hasSheets, 'Spreadsheets scope', hasSheets ? 'present' : `MISSING. Granted: ${scopes.join(', ')}`)
    if (!hasSheets) {
      console.log('   → Token lacks the spreadsheets scope. Re-run: node scripts/google-auth.js\n')
      return
    }
  } catch (e) {
    line(false, 'Token info', (e && e.message) || String(e))
  }

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  // 4. Can we read the spreadsheet? (distinguishes 403 vs 404)
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
    const tabs = (meta.data.sheets || []).map((s) => s.properties.title)
    line(true, 'Sheet access', `opened "${meta.data.properties.title}"`)
    const hasLedger = tabs.includes('Ledger')
    line(hasLedger, 'Ledger tab', hasLedger ? 'found' : `missing. Tabs present: ${tabs.join(', ')}`)
    if (!hasLedger) {
      console.log('   → Add a tab named exactly "Ledger".\n')
      return
    }
  } catch (e) {
    const code = e && (e.code || e.status)
    line(false, 'Sheet access', `${code} ${(e && e.message) || ''}`)
    if (code === 403) console.log('   → Share the sheet (Editor) with the account you authorized with, and enable the Sheets API.\n')
    else if (code === 404) console.log('   → Either the id is wrong, OR the authorized account has no access (Google returns 404 then). Share it (Editor).\n')
    return
  }

  // 5. Actually append a test row
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[new Date().toISOString().split('T')[0], 'TEST', 0, '', 'diagnostic — safe to delete', 'test', new Date().toISOString()]] },
    })
    line(true, 'Append row', 'SUCCESS — check the Ledger tab for a TEST row (delete it after)')
    console.log('\n🎉 Everything works. If Vercel still fails, its env var / redeploy is the issue, not the sheet.\n')
  } catch (e) {
    line(false, 'Append row', `${e && (e.code || e.status)} ${(e && e.message) || ''}`)
  }
}

main().catch((e) => console.error(e))
