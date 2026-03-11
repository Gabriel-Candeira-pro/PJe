const fetch = require('node-fetch')

async function createIntervention() {
  const payload = { worker_id: 'worker-1', reason: 'pje-login' }
  const res = await fetch('http://localhost:3000/api/interventions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  console.log('created intervention', data)
}

createIntervention().catch((e) => console.error(e))
