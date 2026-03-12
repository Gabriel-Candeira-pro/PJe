export function initSplitter(dividerSelector = '#divider', leftSelector = '.left-pane') {
  const divider = document.querySelector(dividerSelector)
  const leftPane = document.querySelector(leftSelector)
  if (!divider || !leftPane) return

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

  let dragging = false
  let startX = 0
  let startLeftWidth = 0

  divider.addEventListener('mousedown', (ev) => {
    dragging = true
    startX = ev.clientX
    startLeftWidth = leftPane.getBoundingClientRect().width
    document.body.style.userSelect = 'none'
  })

  window.addEventListener('mousemove', (ev) => {
    if (!dragging) return
    const dx = ev.clientX - startX
    const newWidth = clamp(startLeftWidth + dx, 150, window.innerWidth - 200)
    leftPane.style.flex = '0 0 ' + newWidth + 'px'
  })

  window.addEventListener('mouseup', () => {
    if (!dragging) return
    dragging = false
    document.body.style.userSelect = ''
  })

  // touch
  divider.addEventListener('touchstart', (ev) => {
    dragging = true
    startX = ev.touches[0].clientX
    startLeftWidth = leftPane.getBoundingClientRect().width
  }, { passive: true })

  window.addEventListener('touchmove', (ev) => {
    if (!dragging) return
    const dx = ev.touches[0].clientX - startX
    const newWidth = clamp(startLeftWidth + dx, 150, window.innerWidth - 200)
    leftPane.style.flex = '0 0 ' + newWidth + 'px'
  }, { passive: true })

  window.addEventListener('touchend', () => { dragging = false })
}
