/**
 * Toast — notificação inline reutilizável
 * Usado em: AnalisadorJson (path copiado), ClienteAPI, EnvioLote
 *
 * @param {boolean} visivel — controla a visibilidade
 * @param {string} mensagem — texto a exibir
 * @param {'success'|'info'|'warning'|'error'} tipo — estilo visual
 * @param {string} className — classes adicionais
 */
export default function Toast({ visivel, mensagem, tipo = 'success', className = '' }) {
  if (!visivel) return null

  const estilos = {
    success: 'bg-green-600 text-white',
    info:    'bg-sysgate-600 text-white',
    warning: 'bg-yellow-500 text-white',
    error:   'bg-red-600 text-white',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md
        transition-all duration-200 ${estilos[tipo] || estilos.success} ${className}`}
    >
      {tipo === 'success' && (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {mensagem}
    </div>
  )
}
