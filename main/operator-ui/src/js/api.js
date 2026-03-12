export const API_BASE = (function() {
  if (typeof window !== 'undefined' && window.__API_BASE) return window.__API_BASE
  try {
    if (typeof location !== 'undefined' && location.protocol && location.protocol.startsWith('http')) {
      const base = location.origin + '/api'
      console.debug('api.js: using API_BASE from location.origin', base)
      return base
    }
  } catch (e) {}
  const fallback = 'http://localhost:3000/api'
  console.debug('api.js: using fallback API_BASE', fallback)
  return fallback
})()

export async function getInterventions() {
  const res = await fetch(`${API_BASE}/interventions`)
  if (!res.ok) throw new Error('Falha ao buscar intervenções')
  return res.json()
}

export async function createIntervention(payload) {
  const res = await fetch(`${API_BASE}/interventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => null)
    throw new Error(txt || 'Falha ao criar intervenção')
  }
  return res.json()
}

export async function fetchElements(id) {
  const res = await fetch(`${API_BASE}/interventions/${id}/fetch`, {
    method: 'POST'
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => null)
    throw new Error(txt || 'Falha ao buscar elementos')
  }
  return res.json()
}

export async function postFetch(url, selector) {
  const res = await fetch(`${API_BASE}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, selector })
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => null)
    throw new Error(txt || 'Falha ao executar fetch no servidor')
  }
  return res.json()
}
