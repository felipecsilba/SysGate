import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './stores/temaStore' // aplica o tema antes do primeiro render
import './index.css'

// Dentro do Electron a janela é transparente e o CSS desenha os cantos (html.electron);
// maximizada, os cantos somem (html.maximizada).
const janela = window.krakion?.janela
if (janela) {
  const raiz = document.documentElement
  raiz.classList.add('electron')
  const marcar = maximizada => raiz.classList.toggle('maximizada', maximizada)
  janela.estaMaximizada().then(marcar)
  janela.aoMudarMaximizada(marcar)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
