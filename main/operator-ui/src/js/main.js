import * as api from './api.js'
import * as ui from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('list')
  const form = document.getElementById('intervention-form')

  async function load() {
    try {
      const data = await api.getInterventions()
      ui.renderList(listEl, data)
    } catch (err) {
      console.error('Erro ao carregar intervenções:', err)
    }
  }

  // handle clicks on "Ver elementos" buttons
  if (listEl) {
    listEl.addEventListener('click', async (ev) => {
      // abrir página em nova aba
      const openBtn = ev.target.closest && ev.target.closest('.open-page')
      if (openBtn) {
        const url = openBtn.getAttribute('data-url')
        if (url) {
          window.open(url, '_blank', 'noopener')
        }
        return
      }

      // pedir ao servidor para buscar elementos
      const btn = ev.target.closest && ev.target.closest('.fetch-elements')
      if (!btn) return
      const id = btn.getAttribute('data-id')
      try {
        btn.disabled = true
        await api.fetchElements(id)
        await load()
      } catch (err) {
        alert('Falha ao buscar elementos: ' + (err.message || err))
      } finally {
        btn.disabled = false
      }
    })
  }

  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      const payload = ui.readForm(form)
      try {
        await api.createIntervention(payload)
        ui.resetForm(form)
        load()
      } catch (err) {
        alert('Falha ao criar intervenção: ' + (err.message || err))
      }
    })
  }

  setInterval(load, 5000)
  load()
})
