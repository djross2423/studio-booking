import { google } from 'googleapis'
import { oauth2Client } from './google-auth'

const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

// Sheet must have a tab named "Ledger" with a header row:
// Date | Type | Amount | Category | Description | Source | CreatedAt
const RANGE = 'Ledger!A:G'

export type LedgerRow = {
  occurredOn: Date
  type: string
  amount: number
  category?: string | null
  description: string
  source: string
  createdAt: Date
}

// Best-effort append of a ledger row. Never throws — logs on failure so a Sheet
// outage doesn't break the DB write (same pattern as the Calendar sync).
export async function appendTransactionRow(row: LedgerRow): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  if (!spreadsheetId) {
    console.warn('GOOGLE_SHEETS_ID not set — skipping Sheet append')
    return false
  }
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            row.occurredOn.toISOString().split('T')[0],
            row.type,
            row.amount,
            row.category || '',
            row.description,
            row.source,
            row.createdAt.toISOString(),
          ],
        ],
      },
    })
    return true
  } catch (err) {
    console.error('Failed to append transaction row to Google Sheet', err)
    return false
  }
}
