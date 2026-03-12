export function renderList(container, items) {
  container.innerHTML = ''
  if (!Array.isArray(items)) return
  items.forEach(i => {
    const li = document.createElement('li')
    li.innerHTML = `#${i.id || i._id || ''} — ${i.url || ''} — selector: ${i.selector || ''} <button class="fetch-elements" data-id="${i.id}">Ver elementos</button> <button class="open-page" data-url="${i.url || ''}">Visualizar página</button>`
    if (Array.isArray(i.elements) && i.elements.length) {
      const sub = document.createElement('ul')
      i.elements.forEach(e => {
        const subLi = document.createElement('li')
        subLi.textContent = `${e.index}: ${e.text || ''}`
        sub.appendChild(subLi)
      })
      li.appendChild(sub)
    }
    container.appendChild(li)
  })
}

export function readForm(form) {
  const url = (form.querySelector('[name="url"]') || {}).value || ''
  const selector = (form.querySelector('[name="selector"]') || {}).value || ''
  const regras = (form.querySelector('[name="regras"]') || {}).value || ''
  return { url: url.trim(), selector: selector.trim(), regras: regras.trim() }
}

export function resetForm(form) {
  form.reset()
}
