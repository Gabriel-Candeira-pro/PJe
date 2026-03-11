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
