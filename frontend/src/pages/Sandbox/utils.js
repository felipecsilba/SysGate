// ─── Extração de IDs ──────────────────────────────────────────────────────────

// Singular — usado pela aba de requisição única (resposta simples)
export function extrairId(data) {
  if (!data || typeof data !== 'object') return null
  for (const key of ['id', 'idGerado', 'idEconomico', 'idLote']) {
    const v = data[key]
    if (v != null) {
      if (typeof v === 'number' || typeof v === 'string') return String(v)
      if (typeof v === 'object' && v.id != null) return String(v.id)
    }
  }
  return null
}

// Plural — usado pela aba de envio em lote (respostas array + retorno[])
export function extrairIds(data) {
  if (!data || typeof data !== 'object') return []
  const result = []
  for (const key of ['id', 'idGerado', 'idEconomico', 'idLote']) {
    const v = data[key]
    if (v != null) {
      if (typeof v === 'number' || typeof v === 'string') { result.push(String(v)); break }
      if (typeof v === 'object' && v.id != null) { result.push(String(v.id)); break }
    }
  }
  if (Array.isArray(data.retorno)) {
    for (const item of data.retorno) {
      if (!item || typeof item !== 'object') continue
      for (const key of ['idGerado', 'id', 'idEconomico']) {
        const v = item[key]
        if (v != null) {
          let val = null
          if (typeof v === 'number' || typeof v === 'string') val = String(v)
          else if (typeof v === 'object' && v.id != null) val = String(v.id)
          if (val !== null) { result.push(val); break }
        }
      }
    }
  }
  return result
}

// ─── Nome legível do recurso ──────────────────────────────────────────────────

export function nomeRecurso(ep, moduleBase = '') {
  const idx = ep.nome.lastIndexOf(' - ')
  if (idx !== -1) return ep.nome.slice(idx + 3)
  const partes = ep.path.split('/').filter((p) => p && !p.startsWith('{'))
  if (partes.length === 0) return ep.nome
  const ultima = partes[partes.length - 1]
  const palavras = ultima.replace(/([A-Z])/g, ' $1').trim().split(/\s+/)
  if (moduleBase && palavras.length > 1 && palavras[0].toLowerCase() === moduleBase.toLowerCase()) {
    palavras.shift()
  }
  if (palavras.length === 0) return ultima.charAt(0).toUpperCase() + ultima.slice(1)
  palavras[0] = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1)
  return palavras.join(' ')
}

// ─── Syntax highlight JSON ────────────────────────────────────────────────────

// Versão objeto — usada por BatchProgress e AbaEnvioLote (dangerouslySetInnerHTML)
export function highlightJson(obj) {
  const str = JSON.stringify(obj, null, 2)
  return str.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#93c5fd">${match}</span>`
        return `<span style="color:#86efac">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span style="color:#c084fc">${match}</span>`
      if (/null/.test(match)) return `<span style="color:#6b7280">${match}</span>`
      return `<span style="color:#fde68a">${match}</span>`
    }
  )
}

// ─── Constantes HTTP ──────────────────────────────────────────────────────────

export const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export const METODO_COLORS = {
  GET:    'bg-blue-100 text-blue-800',
  POST:   'bg-green-100 text-green-800',
  PUT:    'bg-yellow-100 text-yellow-800',
  PATCH:  'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
}

export const METODO_ACTIVE = {
  GET:    'bg-blue-500   text-white border-blue-500',
  POST:   'bg-green-500  text-white border-green-500',
  PUT:    'bg-yellow-500 text-white border-yellow-500',
  PATCH:  'bg-orange-500 text-white border-orange-500',
  DELETE: 'bg-red-500    text-white border-red-500',
}

// ─── Cores de tipo de campo ───────────────────────────────────────────────────

export const TIPO_COR = {
  string:  'bg-emerald-100 text-emerald-700',
  number:  'bg-blue-100 text-blue-700',
  object:  'bg-purple-100 text-purple-700',
  boolean: 'bg-orange-100 text-orange-700',
}

export function tipoCor(tipo) {
  if (!tipo) return 'bg-gray-100 text-gray-400'
  if (tipo.startsWith('array')) return 'bg-indigo-100 text-indigo-700'
  return TIPO_COR[tipo] || 'bg-gray-100 text-gray-400'
}
