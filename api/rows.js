// Node.js Vercel Function: public API gateway for the React application.
module.exports = async (request, response) => {
  const protocol = request.headers['x-forwarded-proto'] || 'https'
  const host = request.headers.host
  const target = `${protocol}://${host}/api/sheet`
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['PUT', 'POST', 'PATCH'].includes(request.method) ? JSON.stringify(request.body) : undefined,
    })
    const payload = await upstream.json()
    response.status(upstream.status).json(payload)
  } catch {
    response.status(503).json({ error: 'Google Sheets sync service is unavailable' })
  }
}
