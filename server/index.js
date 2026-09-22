require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const path = require('path')
const app = express()

const PYTHON_URL = (process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

function pythonCandidates() {
  const base = PYTHON_URL.replace(/\/$/, '')
  const unique = new Set()
  ;[
    `${base}/rows`,
    `${base}/`,
    base,
  ].forEach((url) => unique.add(url))
  return [...unique]
}

async function proxyToPython(method, req, res) {
  let lastError = null

  for (const url of pythonCandidates()) {
    try {
      const response = await axios({
        method,
        url,
        data: method === 'GET' ? undefined : req.body,
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      })
      return res.status(response.status).json(response.data)
    } catch (error) {
      lastError = error
      const status = error.response?.status
      if (status !== 404 && status !== 405) {
        break
      }
    }
  }

  const payload = lastError?.response?.data || { error: 'Python sync service is unavailable' }
  const code = lastError?.response?.status || 503
  return res.status(code).json(payload)
}

app.use(cors()); app.use(express.json())
app.get('/api/rows', (req, res) => proxyToPython('GET', req, res))
app.put('/api/rows', (req, res) => proxyToPython('PUT', req, res))
app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')))
app.listen(process.env.PORT || 3001, () => console.log('Node API listening on port 3001'))
