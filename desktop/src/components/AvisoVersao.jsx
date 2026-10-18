import { useEffect, useState } from 'react'
import Icone from './Icone'

// Faixa "Nova versão disponível" (modo atalho). O main avisa quando dist/, backend/ ou electron/ mudam:
// 'interface' → Recarregar (só a tela); 'completo' → Reiniciar (backend e banco sobem de novo).
const ponte = window.krakion?.app

export default function AvisoVersao() {
  const [tipo, setTipo] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => ponte?.aoNovaVersao(novo => setTipo(atual => (atual === 'completo' ? atual : novo))), [])

  if (!tipo) return null
  const reiniciar = tipo === 'completo'

  function agir() {
    setOcupado(true)
    reiniciar ? ponte.reiniciar() : ponte.recarregar()
  }

  // No RODAPÉ, de propósito: no topo a faixa ficava sobre a área de arrastar a janela, e o
  // Windows engolia o clique de mouse (no-drag não vale para elemento fixo por cima do drag).
  return (
    <div className="nao-arrastar fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-borda bg-fundo py-1.5 pl-4 pr-1.5 text-sm shadow-lg">
      <span className="h-2 w-2 rounded-full bg-acento" />
      <span>
        Nova versão disponível
        <span className="text-suave">{reiniciar ? ' · o app reinicia em alguns segundos' : ''}</span>
      </span>
      <button type="button" className="botao-primario h-7 rounded-full px-3 text-xs" onClick={agir} disabled={ocupado}>
        {ocupado ? 'Aguarde…' : reiniciar ? 'Reiniciar' : 'Recarregar'}
      </button>
      <button
        type="button"
        title="Depois"
        onClick={() => setTipo(null)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-suave hover:bg-texto/10 hover:text-texto"
      >
        <Icone nome="fechar" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
