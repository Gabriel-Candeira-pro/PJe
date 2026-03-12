const http = require('http')
const port = process.env.PORT || 3000
let items = []

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (req.method === 'GET' && req.url === '/api/interventions') {
    return sendJson(res, 200, items)
  }

  if (req.method === 'POST' && req.url === '/api/interventions') {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try {
        const body = data ? JSON.parse(data) : {}
        const id = items.length + 1
        const it = { id, ...body }
        items.push(it)
        return sendJson(res, 201, it)
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        return res.end('invalid json')
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('not found')
})

server.listen(port, '0.0.0.0', () => console.log('mock api running on', port, 'host 0.0.0.0'))
