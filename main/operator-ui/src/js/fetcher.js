import * as api from './api.js'

export function initFetcher({ inputSelector = '#left-url-input', buttonSelector = '#left-fetch-btn', previewSelector = '#preview' } = {}) {
  const input = document.querySelector(inputSelector)
  const btn = document.querySelector(buttonSelector)
  const preview = document.querySelector(previewSelector)
  if (!input || !btn || !preview) return

  async function showElementsForUrl(url) {
    try {
      btn.disabled = true
      // try direct server fetch endpoint first
      try {
        const resp = await api.postFetch(url, 'body *')
        const elements = resp && resp.elements ? resp.elements : []
        renderElementsPreview(preview, elements)
        return
      } catch (err) {
        console.warn('postFetch failed, falling back to intervention flow:', err)
      }

      // fallback: create intervention + trigger fetch
      const payload = { worker_id: 'operator-ui', url: url, selector: 'body *' }
      const created = await api.createIntervention(payload)
      const id = created && (created.id || created._id || created.id)
      if (id) {
        await api.fetchElements(id)
      }
      const list = await api.getInterventions()
      const item = Array.isArray(list) ? list.find(i => String(i.id) === String(id) || String(i._id) === String(id)) : null
      const elements = (item && item.elements) || []
      renderElementsPreview(preview, elements)
    } catch (err) {
      alert('Falha ao explorar a página: ' + (err.message || err))
    } finally {
      btn.disabled = false
    }
  }

  btn.addEventListener('click', () => {
    const url = (input.value || '').trim()
    if (!url) return alert('Forneça uma URL')
    showElementsForUrl(url)
  })
}

function renderElementsPreview(preview, elements) {
  const body = ['<html><head><meta charset="utf-8"><title>Preview - elements</title></head><body>']
  body.push('<h1>Elements extracted</h1>')
  body.push('<ol>')
  (elements || []).slice(0, 200).forEach(e => {
    body.push('<li>')
    body.push('<div><strong>Index:</strong> ' + (e.index != null ? e.index : '') + '</div>')
    body.push('<div><strong>Text:</strong> ' + escapeHtml(e.text || '') + '</div>')
    body.push('<div><details><summary>HTML</summary><pre>' + escapeHtml(e.html || '') + '</pre></details></div>')
    body.push('</li>')
  })
  body.push('</ol>')
  body.push('</body></html>')
  preview.srcdoc = body.join('\n')
}

function escapeHtml(s) {
  return String(s).replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}

function escapeHtml(s) {
  return String(s).replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}
