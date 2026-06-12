import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Deploy troca os hashes dos chunks: abas abertas com o bundle antigo falham ao
// carregar páginas lazy (tela branca). O Vite emite vite:preloadError nesse caso —
// recarrega para buscar o index.html novo; o guard de 10s evita loop de reload.
window.addEventListener('vite:preloadError', (event) => {
  const ultimoReload = Number(sessionStorage.getItem('krakion-chunk-reload') || 0)
  if (Date.now() - ultimoReload < 10000) return
  sessionStorage.setItem('krakion-chunk-reload', String(Date.now()))
  event.preventDefault()
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
