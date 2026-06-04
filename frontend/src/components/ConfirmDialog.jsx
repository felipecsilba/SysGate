/**
 * ConfirmDialog — modal de confirmação genérico
 * Substitui window.confirm() com UI consistente
 * Usado em: Municipios, Scripts, Chamados, Portfolio
 */

export default function ConfirmDialog({
  aberto,
  titulo = 'Confirmar ação',
  mensagem,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  corConfirmar = 'bg-red-600 hover:bg-red-700',
  carregando = false,
  onConfirmar,
  onCancelar,
}) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancelar} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{titulo}</h3>
        {mensagem && <p className="text-sm text-gray-600 mb-5">{mensagem}</p>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancelar}
            disabled={carregando}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {labelCancelar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${corConfirmar}`}
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Aguarde…
              </span>
            ) : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
