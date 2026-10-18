import { useEffect, useState } from 'react'
import Icone from './Icone'

// Minimizar / maximizar / fechar desenhados pelo app (a janela não tem moldura do Windows).
// Fora do Electron (aba do navegador em dev) a ponte não existe e nada é exibido.
const janela = window.krakion?.janela

function Botao({ titulo, onClick, perigo, children }) {
  return (
    <button
      type="button"
      title={titulo}
      onClick={onClick}
      className={`nao-arrastar flex h-7 w-7 items-center justify-center rounded-lg text-suave transition ${
        perigo ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-texto/10 hover:text-texto'
      }`}
    >
      {children}
    </button>
  )
}

export default function ControlesJanela({ className = '' }) {
  const [maximizada, setMaximizada] = useState(false)

  useEffect(() => {
    if (!janela) return
    janela.estaMaximizada().then(setMaximizada)
    return janela.aoMudarMaximizada(setMaximizada)
  }, [])

  if (!janela) return null

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <Botao titulo="Minimizar" onClick={janela.minimizar}>
        <Icone nome="minimizar" className="h-3.5 w-3.5" strokeWidth={2} />
      </Botao>
      <Botao titulo={maximizada ? 'Restaurar' : 'Maximizar'} onClick={janela.alternarMaximizar}>
        <Icone nome={maximizada ? 'restaurar' : 'maximizar'} className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Botao>
      <Botao titulo="Fechar" onClick={janela.fechar} perigo>
        <Icone nome="fechar" className="h-3.5 w-3.5" strokeWidth={2} />
      </Botao>
    </div>
  )
}
