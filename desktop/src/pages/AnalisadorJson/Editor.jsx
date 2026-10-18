import { useRef } from 'react'

// Textarea com números de linha; a linha do erro fica marcada na régua.
export default function Editor({ valor, onMudar, onCursor, linhaErro, placeholder, editorRef }) {
  const reguaRef = useRef(null)
  const total = valor ? valor.split('\n').length : 1

  function rolar(e) {
    if (reguaRef.current) reguaRef.current.scrollTop = e.target.scrollTop
  }

  function atualizarCursor(e) {
    onCursor?.(e.target.value, e.target.selectionStart)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden font-mono text-[13px] leading-[1.6]">
      <div ref={reguaRef} aria-hidden className="shrink-0 select-none overflow-hidden border-r border-borda bg-painel py-3 text-right text-suave/70">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`px-2.5 tabular-nums ${i + 1 === linhaErro ? 'bg-perigo/15 font-semibold text-perigo' : ''}`}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={editorRef}
        value={valor}
        onChange={e => { onMudar(e.target.value); atualizarCursor(e) }}
        onScroll={rolar}
        onClick={atualizarCursor}
        onKeyUp={atualizarCursor}
        onSelect={atualizarCursor}
        onKeyDown={e => {
          // Tab insere 2 espaços em vez de sair do campo
          if (e.key !== 'Tab') return
          e.preventDefault()
          const el = e.target
          const { selectionStart: ini, selectionEnd: fim } = el
          onMudar(valor.slice(0, ini) + '  ' + valor.slice(fim))
          requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = ini + 2 })
        }}
        spellCheck={false}
        wrap="off"
        placeholder={placeholder}
        className="min-w-0 flex-1 resize-none bg-transparent px-3 py-3 outline-none placeholder:text-suave/60"
      />
    </div>
  )
}
