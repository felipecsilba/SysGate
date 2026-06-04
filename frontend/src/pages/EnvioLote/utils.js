export function extrairIds(data) {
  if (!data || typeof data !== 'object') return []
  const result = []
  // Extrai ID de nível raiz (idLote, id, idGerado, idEconomico)
  for (const key of ['id', 'idGerado', 'idEconomico', 'idLote']) {
    const v = data[key]
    if (v != null) {
      if (typeof v === 'number' || typeof v === 'string') { result.push(String(v)); break }
      if (typeof v === 'object' && v.id != null) { result.push(String(v.id)); break }
    }
  }
  // Extrai IDs de retorno[] — idGerado pode ser objeto {id:N} ou escalar
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
