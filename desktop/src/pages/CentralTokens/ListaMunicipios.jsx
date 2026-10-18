import Busca from '../../components/Busca'
import { contem } from '../../lib/texto'
import { resumoValidade } from '../../lib/validade'

// Aviso de validade ao lado do nome: vermelho se algum token venceu, âmbar se vence em até 3 dias
function AvisoValidade({ municipio }) {
  const { vencidos, venceEmDias } = resumoValidade((municipio.municipioSistemas || []).map(v => v.dataVencimento))
  if (vencidos) {
    return (
      <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400" title="Token vencido — renove na Central de Tokens">
        {vencidos} vencido{vencidos === 1 ? '' : 's'}
      </span>
    )
  }
  if (venceEmDias !== null) {
    return (
      <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
        vence {venceEmDias === 1 ? 'amanhã' : `em ${venceEmDias} dias`}
      </span>
    )
  }
  return null
}

export default function ListaMunicipios({ municipios, selecionadoId, onSelecionar, busca, onBusca }) {
  const visiveis = municipios.filter(m => contem(m.nome, busca))

  return (
    <div className="flex w-72 shrink-0 flex-col border-r border-borda">
      <div className="p-3">
        <Busca valor={busca} onMudar={onBusca} placeholder="Buscar município…" />
      </div>
      <ul className="flex-1 overflow-y-auto pb-2">
        {visiveis.map(m => {
          const ativo = m.id === selecionadoId
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelecionar(m.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                  ativo ? 'bg-texto/[0.06]' : 'hover:bg-texto/[0.03]'
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${m.ativo ? 'bg-emerald-500' : 'bg-transparent'}`} title={m.ativo ? 'Município ativo' : undefined} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${ativo ? 'font-semibold' : ''}`}>{m.nome}</span>
                  <span className="block text-xs text-suave">
                    {m._count?.municipioSistemas ?? 0} token{(m._count?.municipioSistemas ?? 0) === 1 ? '' : 's'}
                    {m.ativo && ' · ativo'}
                  </span>
                </span>
                <AvisoValidade municipio={m} />
              </button>
            </li>
          )
        })}
        {!visiveis.length && <li className="px-4 py-6 text-center text-sm text-suave">Nenhum município encontrado.</li>}
      </ul>
    </div>
  )
}
