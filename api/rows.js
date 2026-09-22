require('dotenv').config()
const { google } = require('googleapis')

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1nsbiN1FXZa7LekCrP_gdzwjBqiR1RF9AWuJgskIt-Pc'
const RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:C'
const DEMO_ROWS = [
  { id: 'r1', a: 'One', b: 'North', c: 'Active' },
  { id: 'r2', a: 'Two', b: 'South', c: 'Active' },
  { id: 'r3', a: 'Three', b: 'East', c: 'Pending' },
  { id: 'r4', a: 'Four', b: 'West', c: 'Active' },
]

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

async function getSheetsClient() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!rawJson) {
    return null
  }

  const serviceAccount = JSON.parse(rawJson)
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const client = await auth.getClient()
  return google.sheets({ version: 'v4', auth: client })
}

function normalizeRows(values) {
  const body = values && values[0] && values[0].length && values[0][0] === 'A' && values[0][1] === 'B' && values[0][2] === 'C'
    ? values.slice(1)
    : values

  return (body || []).map((row, index) => ({
    id: `r${index + 1}`,
    a: (row[0] ?? ''),
    b: (row[1] ?? ''),
    c: (row[2] ?? ''),
  }))
}

async function handleGet() {
  const sheets = await getSheetsClient()

  if (!sheets) {
    return { rows: DEMO_ROWS, mode: 'demo' }
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  })

  return { rows: normalizeRows(response.data.values || []), mode: 'live' }
}

async function handlePut(rows) {
  const sheets = await getSheetsClient()

  if (!sheets) {
    return { rows, mode: 'demo' }
  }

  const values = [['A', 'B', 'C'], ...rows.map((row) => [row.a || '', row.b || '', row.c || ''])]

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: RANGE,
    requestBody: {},
  })

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })

  return { rows, mode: 'live' }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const payload = await handleGet()
      return sendJson(res, 200, payload)
    }

    if (req.method === 'PUT') {
      const body = await getBody(req)
      const rows = Array.isArray(body.rows) ? body.rows : []
      const payload = await handlePut(rows)
      return sendJson(res, 200, payload)
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error('rows api error:', error)
    return sendJson(res, 503, { error: error.message || 'Google Sheets sync service is unavailable' })
  }
}
