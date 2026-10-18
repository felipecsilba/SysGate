import Icone from '../components/Icone'
import Pagina from '../components/Pagina'

// Placeholder de cada módulo até ele ser redesenhado.
export default function EmConstrucao({ modulo }) {
  return (
    <Pagina titulo={modulo.rotulo} icone={modulo.icone}>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-acento-suave text-acento">
            <Icone nome={modulo.icone} className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold">{modulo.rotulo}</h3>
          <p className="mt-1.5 text-sm text-suave">{modulo.descricao}</p>
          <span className="mt-5 inline-block rounded-full bg-acento-suave px-3.5 py-1.5 text-xs font-medium text-acento">
            Em construção
          </span>
        </div>
      </div>
    </Pagina>
  )
}
