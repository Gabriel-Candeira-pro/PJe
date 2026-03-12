import { initSplitter } from './splitter.js'
import { initPreview } from './preview.js'
import { initFetcher } from './fetcher.js'
import './main.js'

document.addEventListener('DOMContentLoaded', () => {
  initSplitter('#divider', '.left-pane')
  initPreview({ urlInputSelector: '#url', previewSelector: '#preview', formSelector: '#intervention-form' })
  initFetcher({ inputSelector: '#left-url-input', buttonSelector: '#left-fetch-btn', previewSelector: '#preview' })
})
