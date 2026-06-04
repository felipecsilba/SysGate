/**
 * StatusBadge — badge colorido por status code HTTP
 * Usado em: Historico, ClienteAPI
 */

function corStatus(code) {
  if (!code && code !== 0) return 'bg-gray-100 text-gray-500'
  if (code >= 200 && code < 300) return 'bg-green-100 text-green-700'
  if (code >= 300 && code < 400) return 'bg-blue-100 text-blue-700'
  if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-700'
  if (code >= 500)               return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

export default function StatusBadge({ code, className = '' }) {
  if (code === undefined || code === null) return null
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${corStatus(code)} ${className}`}
    >
      {code}
    </span>
  )
}
