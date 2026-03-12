const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(bodyParser.json())
app.use(cookieParser())

const interventions = new Map()
const http = require('http')
const https = require('https')
const cheerio = require('cheerio')

function fetchHtml(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url)
      const lib = parsed.protocol === 'https:' ? https : http
      const opts = { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36' } }
      const req = lib.request(parsed, opts, (res) => {
        const { statusCode, headers } = res
        if (statusCode >= 300 && statusCode < 400 && headers.location && maxRedirects > 0) {
          const loc = new URL(headers.location, parsed).toString()
          res.resume()
          return resolve(fetchHtml(loc, maxRedirects - 1))
        }
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve({ statusCode, headers, body: data }))
      })
      req.on('error', (err) => reject(err))
      req.end()
    } catch (err) { reject(err) }
  })
}

function requireAuth(req, res, next) {
  const sessionId = req.cookies.sessionId
  if (!sessionId) return res.status(401).json({ error: 'unauthenticated' })
  req.user = { id: 'operator-1', name: 'Operator One', roles: ['operator'] }
  next()
}

app.post('/api/interventions', (req, res) => {
  const { worker_id, reason } = req.body || {}
  if (!worker_id) return res.status(400).json({ error: 'worker_id required' })
  const id = uuidv4()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const item = { id, worker_id, reason: reason || null, status: 'pending', created_at: new Date().toISOString(), expires_at: expiresAt }
  interventions.set(id, item)
  res.json({ id, expires_at: expiresAt })
})

// Allow worker to post extracted elements for an intervention
app.post('/api/interventions/:id/elements', (req, res) => {
  const id = req.params.id
  const { elements } = req.body || {}
  const item = interventions.get(id)
  if (!item) return res.status(404).json({ error: 'not found' })
  item.elements = Array.isArray(elements) ? elements : []
  interventions.set(id, item)
  res.json({ ok: true })
})

// Trigger server-side fetch+extraction for a given intervention (PoC)
app.post('/api/interventions/:id/fetch', async (req, res) => {
  const id = req.params.id
  const item = interventions.get(id)
  if (!item) return res.status(404).json({ error: 'not found' })
  const { url, selector } = item
  if (!url || !selector) return res.status(400).json({ error: 'url and selector required on intervention' })
  try {
    const r = await fetchHtml(url)
    const html = r.body
    const $ = cheerio.load(html)
    const list = []
    $(selector).each((i, el) => {
      list.push({ index: i, text: $(el).text().trim(), html: $.html(el) })
    })
    item.elements = list
    interventions.set(id, item)
    res.json({ ok: true, count: list.length })
  } catch (err) {
    console.error('fetch error', err)
    res.status(500).json({ error: 'fetch failed', detail: String(err) })
  }
})

// Quick fetch endpoint: POST { url, selector } -> extracts elements (useful for UI testing)
app.post('/api/fetch', async (req, res) => {
  const { url, selector } = req.body || {}
  if (!url || !selector) return res.status(400).json({ error: 'url and selector required' })
  try {
    const r = await fetchHtml(url)
    const html = r.body
    const $ = cheerio.load(html)
    const list = []
    $(selector).each((i, el) => {
      list.push({ index: i, text: $(el).text().trim(), html: $.html(el) })
    })
    res.json({ ok: true, count: list.length, elements: list })
  } catch (err) {
    console.error('fetch error', err)
    res.status(500).json({ error: 'fetch failed', detail: String(err) })
  }
})

app.get('/api/interventions', (req, res) => {
  const list = Array.from(interventions.values())
  res.json(list)
})

app.get('/api/interventions/:id', requireAuth, (req, res) => {
  const id = req.params.id
  const item = interventions.get(id)
  if (!item) return res.status(404).json({ error: 'not found' })
  res.json(item)
})

app.post('/api/interventions/:id/passphrase', requireAuth, (req, res) => {
  const id = req.params.id
  const { passphrase } = req.body || {}
  if (!passphrase) return res.status(400).json({ error: 'passphrase required' })
  const item = interventions.get(id)
  if (!item) return res.status(404).json({ error: 'not found' })
  if (item.status !== 'pending') return res.status(409).json({ error: 'invalid state' })
  item.status = 'used'
  item.used_by = req.user.id
  item.used_at = new Date().toISOString()
  interventions.set(id, item)
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`api-gateway listening on ${PORT}`))
