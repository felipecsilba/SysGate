// ─── Paleta de cores (dark) ───────────────────────────────────────────────────

export const DARK = {
  page:       '#0f172a',   // slate-900
  toolbar:    '#1e293b',   // slate-800
  toolbarBdr: '#334155',   // slate-700
  panel:      '#0d1117',   // github dark
  panelHdr:   '#161b27',
  lineNum:    '#374151',
  lineNumBg:  '#0f172a',
  caret:      '#818cf8',
  statusBar:  '#0a0e1a',
}

// ─── Syntax highlight ─────────────────────────────────────────────────────────

export function highlightJson(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let s = 'color:#facc15'                             // number  — yellow
        if (/^"/.test(match))  s = /:$/.test(match) ? 'color:#93c5fd' : 'color:#4ade80'  // key=blue, str=green
        else if (/true|false/.test(match)) s = 'color:#c084fc'   // boolean — purple
        else if (/null/.test(match))       s = 'color:#6b7280'   // null    — gray
        return `<span style="${s}">${match}</span>`
      }
    )
}

export function highlightJsonLight(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let s = 'color:#b45309'                            // number  — amber dark
        if (/^"/.test(match))  s = /:$/.test(match) ? 'color:#1d4ed8' : 'color:#15803d' // key=blue, str=green
        else if (/true|false/.test(match)) s = 'color:#7c3aed'  // boolean — violet
        else if (/null/.test(match))       s = 'color:#9ca3af'  // null    — gray
        return `<span style="${s}">${match}</span>`
      }
    )
}

// ─── JSON analysis ────────────────────────────────────────────────────────────

export function analyzeJson(value, depth = 0, stats = null) {
  if (!stats) stats = { keys: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, arrays: 0, objects: 0, maxDepth: 0 }
  stats.maxDepth = Math.max(stats.maxDepth, depth)
  if (value === null) { stats.nulls++ }
  else if (typeof value === 'string')  { stats.strings++ }
  else if (typeof value === 'number')  { stats.numbers++ }
  else if (typeof value === 'boolean') { stats.booleans++ }
  else if (Array.isArray(value))  { stats.arrays++;  value.forEach((i) => analyzeJson(i, depth + 1, stats)) }
  else if (typeof value === 'object') {
    stats.objects++
    Object.keys(value).forEach((k) => { stats.keys++; analyzeJson(value[k], depth + 1, stats) })
  }
  return stats
}

// ─── Diff JSON ────────────────────────────────────────────────────────────────

export function diffJson(a, b, path = '$', out = []) {
  if (Object.is(a, b)) return out
  const aIsObj = a !== null && typeof a === 'object'
  const bIsObj = b !== null && typeof b === 'object'
  // Tipos incompatíveis ou primitivos diferentes
  if (!aIsObj || !bIsObj || Array.isArray(a) !== Array.isArray(b)) {
    out.push({ path, type: 'changed', from: a, to: b })
    return out
  }
  // Ambos são objetos ou arrays — percorre chaves
  const keysA   = new Set(Object.keys(a))
  const keysB   = new Set(Object.keys(b))
  const allKeys = new Set([...keysA, ...keysB])
  for (const k of allKeys) {
    const sub = Array.isArray(a) ? `${path}[${k}]` : `${path}.${k}`
    if (!keysA.has(k)) {
      out.push({ path: sub, type: 'added', value: b[k] })
    } else if (!keysB.has(k)) {
      out.push({ path: sub, type: 'removed', value: a[k] })
    } else {
      diffJson(a[k], b[k], sub, out)
    }
  }
  return out
}

export function fmtDiffVal(v) {
  if (v === null)      return 'null'
  if (v === undefined) return '—'
  if (typeof v === 'object') {
    const s = JSON.stringify(v)
    return s.length > 80 ? s.slice(0, 80) + '…' : s
  }
  const s = String(v)
  if (typeof v === 'string') return `"${s.length > 80 ? s.slice(0, 80) + '…' : s}"`
  return s.length > 80 ? s.slice(0, 80) + '…' : s
}

// ─── Busca no JSON ────────────────────────────────────────────────────────────

export function buscaJson(value, termo, path = '$', results = []) {
  if (!termo || results.length >= 500) return results
  const t = termo.toLowerCase()
  if (Array.isArray(value)) {
    value.forEach((item, i) => buscaJson(item, termo, `${path}[${i}]`, results))
    return results
  }
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const sub = `${path}.${k}`
      if (k.toLowerCase().includes(t)) results.push({ path: sub, matchIn: 'key', key: k, value: v })
      buscaJson(v, termo, sub, results)
    }
    return results
  }
  const s = value === null ? 'null' : String(value)
  if (s.toLowerCase().includes(t)) results.push({ path, matchIn: 'value', value })
  return results
}
