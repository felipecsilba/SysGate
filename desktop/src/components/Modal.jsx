import { useEffect } from 'react'
import Icone from './Icone'

// Janela modal padrão: fundo escurecido, cartão arredondado, Esc fecha.
export default function Modal({ titulo, subtitulo, aberto, onFechar, children, rodape, largura = 'max-w-md' }) {
  useEffect(() => {
    if (!aberto) return
    const tecla = e => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onMouseDown={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${largura} rounded-2xl border border-borda bg-fundo shadow-2xl`}
        onMouseDown={e => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 px-6 pb-2 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-suave">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            title="Fechar"
            className="-mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-suave hover:bg-texto/10 hover:text-texto"
          >
            <Icone nome="fechar" className="h-4 w-4" />
          </button>
        </header>
        <div className="px-6 py-3">{children}</div>
        {rodape && <footer className="flex justify-end gap-2 px-6 pb-5 pt-2">{rodape}</footer>}
      </div>
    </div>
  )
}
