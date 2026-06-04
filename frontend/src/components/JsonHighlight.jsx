/**
 * JsonHighlight — syntax highlight de JSON reutilizável
 * Suporta tema dark e light
 * Usado em: AnalisadorJson, EnvioLote, ClienteAPI
 */

function highlightJson(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let s = 'color:#facc15'
        if (/^"/.test(match))  s = /:$/.test(match) ? 'color:#93c5fd' : 'color:#4ade80'
        else if (/true|false/.test(match)) s = 'color:#c084fc'
        else if (/null/.test(match))       s = 'color:#6b7280'
        return `<span style="${s}">${match}</span>`
      }
    )
}

function highlightJsonLight(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let s = 'color:#b45309'
        if (/^"/.test(match))  s = /:$/.test(match) ? 'color:#1d4ed8' : 'color:#15803d'
        else if (/true|false/.test(match)) s = 'color:#7c3aed'
        else if (/null/.test(match))       s = 'color:#9ca3af'
        return `<span style="${s}">${match}</span>`
      }
    )
}

/**
 * @param {object|string} value — objeto JS ou string JSON já serializado
 * @param {'dark'|'light'} tema — tema de cores (padrão: dark)
 * @param {string} className — classes adicionais
 * @param {number} maxHeight — altura máxima com scroll (em px, 0 = sem limite)
 */
export default function JsonHighlight({ value, tema = 'dark', className = '', maxHeight = 0 }) {
  let str = ''
  try {
    str = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  } catch {
    str = String(value)
  }

  const html = tema === 'light' ? highlightJsonLight(str) : highlightJson(str)
  const bgClass = tema === 'light' ? 'bg-white text-gray-800' : 'bg-slate-950 text-slate-200'

  return (
    <pre
      className={`font-mono text-xs p-3 rounded-lg overflow-auto ${bgClass} ${className}`}
      style={maxHeight > 0 ? { maxHeight } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Export das funções puras para uso direto
export { highlightJson, highlightJsonLight }
