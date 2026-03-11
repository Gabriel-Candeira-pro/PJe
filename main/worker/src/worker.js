const fetch = require('node-fetch')

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

async function retryOnConnRefused(fn, opts = {}) {
  const maxAttempts = opts.maxAttempts || 5
  const baseDelay = opts.baseDelay || 500
  const maxJitter = opts.jitter || 200

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const code = err && err.code
      const shouldRetry = code === 'ECONNREFUSED'

      if (!shouldRetry || attempt === maxAttempts) {
        throw err
      }

      const jitter = Math.floor(Math.random() * maxJitter)
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter
      console.warn(`attempt ${attempt} failed with ${code}, retrying in ${delay}ms`)
      await sleep(delay)
    }
  }
}

async function createIntervention() {
  const payload = { worker_id: 'worker-1', reason: 'pje-login' }

  const doPost = async () => {
    const res = await fetch('http://localhost:3000/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const err = new Error(`HTTP ${res.status} - ${text}`)
      err.code = `HTTP_${res.status}`
      throw err
    }

    return res.json()
  }

  const data = await retryOnConnRefused(doPost, { maxAttempts: 5, baseDelay: 500, jitter: 200 })
  console.log('created intervention', data)
}

createIntervention().catch((e) => console.error(e))
