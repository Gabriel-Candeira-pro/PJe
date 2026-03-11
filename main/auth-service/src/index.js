const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
app.use(cookieParser())

app.get('/auth/login', (req, res) => {
  const sessionId = 'sess-' + Date.now()
  res.cookie('sessionId', sessionId, { httpOnly: true, secure: false })
  res.redirect('/')
})

app.get('/auth/logout', (req, res) => {
  res.clearCookie('sessionId')
  res.json({ ok: true })
})

app.get('/auth/me', (req, res) => {
  const sessionId = req.cookies.sessionId
  if (!sessionId) return res.status(401).json({ error: 'unauthenticated' })
  res.json({ user: { id: 'operator-1', name: 'Operator One', roles: ['operator'] } })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`auth-service listening on ${PORT}`))
