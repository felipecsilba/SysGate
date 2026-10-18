import Busca from '../../components/Busca'
import { contem } from '../../lib/texto'

export default function ListaSistemas({ sistemas, selecionadoId, onSelecionar, busca, onBusca }) {
  const visiveis = sistemas.filter(s => contem(s.nome, busca))

  return (
    <div className="flex w-72 shrink-0 flex-col border-r border-borda">
      <div className="p-3">
        <Busca valor={busca} onMudar={onBusca} placeholder="Buscar sistema…" />
      </div>
      <ul className="flex-1 overflow-y-auto pb-2">
        {visiveis.map(s => {
          const ativo = s.id === selecionadoId
          const total = s._count?.endpoints ?? 0
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelecionar(s.id)}
                className={`w-full px-4 py-2.5 text-left transition ${ativo ? 'bg-texto/[0.06]' : 'hover:bg-texto/[0.03]'}`}
              >
                <span className={`block truncate text-sm ${ativo ? 'font-semibold' : ''}`}>{s.nome}</span>
                <span className="block text-xs text-suave">{total} endpoint{total === 1 ? '' : 's'}</span>
              </button>
            </li>
          )
        })}
        {!visiveis.length && <li className="px-4 py-6 text-center text-sm text-suave">Nenhum sistema encontrado.</li>}
      </ul>
    </div>
  )
}
