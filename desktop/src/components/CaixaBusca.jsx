import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icone from './Icone'
import { contem } from '../lib/texto'

// Caixa de seleção do app — substitui o <select> nativo (lista quadrada do Windows, sem tema).
// Mostra a escolha atual; ao focar abre a lista; com `buscavel`, digitar filtra sem acento.
// opcoes: [{ valor, rotulo }] · compacta: altura menor (linhas do bloco Valores)
export default function CaixaBusca({ opcoes, valor, onEscolher, placeholder, desabilitado, buscavel = true, compacta = false }) {
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [destaque, setDestaque] = useState(0)
  const [posicao, setPosicao] = useState(null) // lista em portal: não é cortada por blocos com rolagem
  const caixa = useRef(null)
  const lista = useRef(null)

  const atual = opcoes.find(o => o.valor === valor)
  const visiveis = useMemo(() => (buscavel ? opcoes.filter(o => contem(o.rotulo, termo)) : opcoes), [opcoes, termo, buscavel])

  useEffect(() => { setDestaque(Math.max(0, visiveis.findIndex(o => o.valor === valor))) }, [aberto, termo]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!aberto) return
    const fechar = e => { if (!caixa.current?.contains(e.target) && !lista.current?.contains(e.target)) { setAberto(false); setTermo('') } }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])
  // Posiciona a lista pela caixa (abre para cima se faltar espaço) e acompanha rolagem/redimensionamento
  useLayoutEffect(() => {
    if (!aberto) return
    const medir = () => {
      const r = caixa.current?.getBoundingClientRect()
      if (!r) return
      const alturaMax = 288
      const paraCima = window.innerHeight - r.bottom < alturaMax + 12 && r.top > window.innerHeight - r.bottom
      setPosicao({ left: r.left, width: r.width, ...(paraCima ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) })
    }
    medir()
    window.addEventListener('scroll', medir, true)
    window.addEventListener('resize', medir)
    return () => { window.removeEventListener('scroll', medir, true); window.removeEventListener('resize', medir) }
  }, [aberto])
  useEffect(() => { if (aberto) lista.current?.children[destaque]?.scrollIntoView({ block: 'nearest' }) }, [destaque, aberto])

  function escolher(o) {
    onEscolher(o.valor)
    setAberto(false)
    setTermo('')
  }

  function tecla(e) {
    if (!aberto && ['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setAberto(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setDestaque(i => Math.min(i + 1, visiveis.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setDestaque(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && visiveis[destaque]) { e.preventDefault(); escolher(visiveis[destaque]) }
    // Esc com a lista aberta só fecha a lista — não deixa chegar ao Modal (que fecharia junto)
    if (e.key === 'Escape' && aberto) { e.stopPropagation(); setAberto(false); setTermo('') }
  }

  return (
    <div className="relative" ref={caixa}>
      <label
        onMouseDown={e => { if (!buscavel && !desabilitado) { e.preventDefault(); setAberto(a => !a) } }}
        className={`flex items-center gap-2 border bg-fundo transition ${compacta ? 'h-8 rounded-lg px-2.5' : 'h-9 rounded-xl px-3'} ${
          aberto ? 'border-acento ring-2 ring-acento/20' : 'border-borda hover:border-acento/40'
        } ${desabilitado ? 'opacity-50' : buscavel ? '' : 'cursor-pointer'}`}
      >
        <input
          value={aberto && buscavel ? termo : atual?.rotulo ?? ''}
          onChange={e => { setTermo(e.target.value); setAberto(true) }}
          onFocus={() => buscavel && setAberto(true)}
          onKeyDown={tecla}
          readOnly={!buscavel}
          disabled={desabilitado}
          placeholder={aberto && atual ? atual.rotulo : placeholder}
          className={`w-full min-w-0 bg-transparent outline-none placeholder:text-suave/70 ${compacta ? 'font-mono text-xs' : 'text-sm'} ${buscavel ? '' : 'cursor-pointer caret-transparent'}`}
        />
        <Icone nome={buscavel ? 'buscar' : 'baixo'} className={`h-3.5 w-3.5 shrink-0 text-suave transition ${!buscavel && aberto ? 'rotate-180' : ''}`} />
      </label>
      {aberto && !desabilitado && posicao && createPortal(
        <ul ref={lista} style={{ position: 'fixed', ...posicao }} className="z-[70] max-h-72 overflow-y-auto rounded-xl border border-borda bg-fundo p-1 text-texto shadow-xl">
          {visiveis.map((o, i) => {
            const escolhido = o.valor === valor
            return (
              <li key={String(o.valor)}>
                <button
                  type="button"
                  onMouseEnter={() => setDestaque(i)}
                  onClick={() => escolher(o)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left ${compacta ? 'font-mono text-xs' : 'text-sm'} ${
                    escolhido ? 'bg-acento/15 font-medium text-acento' : i === destaque ? 'bg-texto/[0.06]' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{o.rotulo}</span>
                  {escolhido && <Icone nome="check" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
                </button>
              </li>
            )
          })}
          {!visiveis.length && <li className="px-3 py-3 text-center text-xs text-suave">Nada encontrado.</li>}
        </ul>,
        document.body
      )}
    </div>
  )
}
