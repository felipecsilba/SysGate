/**
 * MethodBadge — badge colorido por método HTTP
 * Usado em: Historico, ClienteAPI, EnvioLote
 */

const COR_METODO = {
  GET:    'bg-blue-100 text-blue-700',
  POST:   'bg-green-100 text-green-700',
  PUT:    'bg-yellow-100 text-yellow-700',
  PATCH:  'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

export default function MethodBadge({ metodo, className = '' }) {
  if (!metodo) return null
  const m = metodo.toUpperCase()
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${COR_METODO[m] || 'bg-gray-100 text-gray-600'} ${className}`}
    >
      {m}
    </span>
  )
}
