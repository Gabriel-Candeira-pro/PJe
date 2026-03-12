export function initPreview({ urlInputSelector = '#url', previewSelector = '#preview', formSelector = null } = {}) {
  const urlInput = document.querySelector(urlInputSelector)
  const preview = document.querySelector(previewSelector)
  const form = formSelector ? document.querySelector(formSelector) : null
  if (!urlInput || !preview) return

  function setPreview(url) {
    preview.src = url || 'about:blank'
  }

  urlInput.addEventListener('input', () => {
    setPreview(urlInput.value.trim())
  })

  if (form) {
    form.addEventListener('submit', (ev) => {
      // keep default behavior handled elsewhere; just update preview
      const v = (urlInput.value || '').trim()
      setPreview(v)
    })
  }

  return { setPreview }
}
