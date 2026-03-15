import useMunicipioStore from '../stores/municipioStore'

export default function MunicipioBadge() {
  const municipioAtivo = useMunicipioStore((s) => s.municipioAtivo)

  if (!municipioAtivo) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-xs font-medium text-yellow-700">Nenhum município ativo</span>
      </div>
    )
  }

  const numSistemas = municipioAtivo.municipioSistemas?.length || 0

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-900 leading-tight">
          {municipioAtivo.nome}
        </span>
        <span className="text-xs leading-tight text-green-600">
          {numSistemas} sistema{numSistemas !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
