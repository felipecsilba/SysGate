import Icone from './Icone'
import ControlesJanela from './ControlesJanela'

// Moldura de todo módulo: cabeçalho (arrasta a janela) + conteúdo em cartão arredondado.
// `acoes` = botões do módulo, à direita do título, antes dos controles da janela.
export default function Pagina({ titulo, icone, acoes, children }) {
  return (
    <>
      <header className="arrastar flex h-14 shrink-0 items-center gap-3 pl-6 pr-3">
        {icone && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda text-suave">
            <Icone nome={icone} className="h-4 w-4" />
          </span>
        )}
        <h2 className="truncate text-[15px] font-semibold">{titulo}</h2>
        <div className="flex-1" />
        {acoes && <div className="flex items-center gap-1">{acoes}</div>}
        <ControlesJanela className="ml-2 border-l border-borda pl-2" />
      </header>

      <section className="mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-borda bg-fundo">
        {children}
      </section>
    </>
  )
}
