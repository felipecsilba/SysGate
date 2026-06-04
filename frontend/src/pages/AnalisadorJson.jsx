import { useState, useMemo, useRef, useCallback, useEffect } from 'react'

// ─── Paletas de cores ─────────────────────────────────────────────────────────

const DARK = {
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

// Syntax highlight — claro e escuro usam as mesmas cores
function highlightJson(str) {
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

function highlightJsonLight(str) {
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

function analyzeJson(value, depth = 0, stats = null) {
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

function diffJson(a, b, path = '$', out = []) {
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

function fmtDiffVal(v) {
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

// ─── Editor com numeração de linhas ──────────────────────────────────────────

function EditorLinhas({ value, onChange, onCursor, taRef }) {
  const lineNumsRef = useRef()

  const linhas = value ? value.split('\n').length : 1

  const syncScroll = useCallback(() => {
    if (lineNumsRef.current && taRef.current) {
      lineNumsRef.current.scrollTop = taRef.current.scrollTop
    }
  }, [taRef])

  const onKeyUp   = useCallback((e) => { syncScroll(); onCursor(e) }, [syncScroll, onCursor])
  const onClick   = useCallback((e) => { onCursor(e) }, [onCursor])
  const onSelect  = useCallback((e) => { onCursor(e) }, [onCursor])
  const onScroll  = syncScroll

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Numeração */}
      <div
        ref={lineNumsRef}
        className="overflow-hidden shrink-0 pt-4 pb-4 text-right select-none pointer-events-none font-mono text-[12px] leading-relaxed"
        style={{ background: DARK.lineNumBg, color: DARK.lineNum, minWidth: '3rem', paddingRight: '8px', paddingLeft: '8px' }}
      >
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Divisor */}
      <div style={{ width: '1px', background: '#1e293b', flexShrink: 0 }} />
      {/* Textarea */}
      <textarea
        ref={taRef}
        className="flex-1 font-mono text-[13px] p-4 resize-none outline-none leading-relaxed"
        style={{ background: DARK.panel, color: '#e2e8f0', caretColor: DARK.caret }}
        placeholder={'Cole seu JSON aqui...\n\n{\n  "chave": "valor"\n}'}
        value={value}
        onChange={onChange}
        onScroll={onScroll}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onSelect={onSelect}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  )
}

// ─── Tree node ────────────────────────────────────────────────────────────────

const MAX_ITEMS = 200

function JsonNode({ value, keyName, depth, path, onCopyPath, dark }) {
  const [expanded, setExpanded]     = useState(depth < 2)
  const [mostrandoMais, setMais]    = useState(false)

  const isArray      = Array.isArray(value)
  const isObject     = value !== null && typeof value === 'object' && !isArray
  const isExpandable = isArray || isObject
  const entries      = isArray ? value : isObject ? Object.entries(value) : null
  const count        = entries ? (isArray ? value.length : entries.length) : 0

  const currentPath = keyName !== undefined
    ? (typeof keyName === 'number' ? `${path}[${keyName}]` : `${path}.${keyName}`)
    : path

  const colorKey    = dark ? '#93c5fd' : '#1d4ed8'
  const colorStr    = dark ? '#4ade80' : '#15803d'
  const colorNum    = dark ? '#facc15' : '#b45309'
  const colorBool   = dark ? '#c084fc' : '#7c3aed'
  const colorNull   = dark ? '#6b7280' : '#9ca3af'
  const colorBrace  = dark ? '#94a3b8' : '#64748b'
  const colorCount  = dark ? '#475569' : '#94a3b8'
  const hoverBg     = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const renderLeaf = () => {
    if (value === null)            return <span style={{ color: colorNull, fontStyle: 'italic' }}>null</span>
    if (typeof value === 'boolean') return <span style={{ color: colorBool }}>{String(value)}</span>
    if (typeof value === 'number')  return <span style={{ color: colorNum }}>{value}</span>
    if (typeof value === 'string') {
      const d = value.length > 120 ? value.slice(0, 120) + '…' : value
      return <span style={{ color: colorStr }}>"{d}"</span>
    }
    return null
  }

  const visible = useMemo(() => {
    if (!entries) return []
    return mostrandoMais || count <= MAX_ITEMS ? entries : entries.slice(0, MAX_ITEMS)
  }, [entries, mostrandoMais, count])

  return (
    <div className={depth > 0 ? 'ml-4' : ''}>
      <div
        className="flex items-start gap-1 py-0.5 px-1 rounded group cursor-pointer select-none"
        style={{ borderRadius: 4 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={() => { if (isExpandable) setExpanded(v => !v); else onCopyPath(currentPath) }}
      >
        <span className="w-3 text-xs shrink-0 mt-0.5" style={{ color: colorCount }}>
          {isExpandable ? (expanded ? '▼' : '▶') : ' '}
        </span>

        {keyName !== undefined && (
          <button
            className="shrink-0 hover:underline"
            style={{ color: colorKey }}
            onClick={(e) => { e.stopPropagation(); onCopyPath(currentPath) }}
            title={`Copiar path: ${currentPath}`}
          >
            {typeof keyName === 'number' ? `[${keyName}]` : `"${keyName}"`}
            <span style={{ color: colorCount }}>: </span>
          </button>
        )}

        {isExpandable ? (
          <span style={{ color: colorBrace }}>
            {isArray ? '[' : '{'}
            {!expanded && <span style={{ color: colorCount, fontSize: '11px', marginLeft: 4 }}>{count} {isArray ? (count === 1 ? 'item' : 'itens') : (count === 1 ? 'chave' : 'chaves')}</span>}
            {!expanded && <span style={{ color: colorBrace, marginLeft: 2 }}>{isArray ? ']' : '}'}</span>}
          </span>
        ) : (
          <span className="font-mono text-[13px]">
            {renderLeaf()}
            <button
              className="ml-2 text-xs opacity-0 group-hover:opacity-50 hover:!opacity-100"
              style={{ color: colorCount }}
              onClick={(e) => { e.stopPropagation(); onCopyPath(currentPath) }}
              title="Copiar path"
            >⎘</button>
          </span>
        )}
      </div>

      {isExpandable && expanded && (
        <div style={{ borderLeft: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`, marginLeft: 8 }}>
          {visible.map((entry, i) => {
            const [k, v] = isArray ? [i, entry] : entry
            return <JsonNode key={isArray ? i : k} value={v} keyName={k} depth={depth + 1} path={currentPath} onCopyPath={onCopyPath} dark={dark} />
          })}
          {count > MAX_ITEMS && !mostrandoMais && (
            <button
              className="ml-4 my-1 text-xs px-2 py-0.5 rounded"
              style={{ color: '#818cf8', border: `1px solid ${dark ? '#312e81' : '#c7d2fe'}`, background: 'transparent' }}
              onClick={(e) => { e.stopPropagation(); setMais(true) }}
            >+ {count - MAX_ITEMS} itens ocultos</button>
          )}
          <div className="ml-3 text-[13px] py-0.5" style={{ color: colorBrace }}>{isArray ? ']' : '}'}</div>
        </div>
      )}
    </div>
  )
}

// ─── Tabela ───────────────────────────────────────────────────────────────────

function JsonTabela({ data, dark }) {
  const bg    = dark ? '#1e293b' : '#ffffff'
  const bgHdr = dark ? '#0f172a' : '#f8fafc'
  const bdr   = dark ? '#334155' : '#e2e8f0'
  const txt   = dark ? '#e2e8f0' : '#1e293b'
  const txtSub = dark ? '#94a3b8' : '#64748b'

  if (!Array.isArray(data)) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: bg }}>
        <div className="text-center">
          <div className="text-5xl mb-3 select-none" style={{ color: dark ? '#334155' : '#e2e8f0' }}>⊘</div>
          <div className="text-sm font-medium" style={{ color: txtSub }}>Disponível apenas para arrays de objetos</div>
        </div>
      </div>
    )
  }

  const objetos = data.filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
  if (objetos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: bg }}>
        <div className="text-center">
          <div className="text-5xl mb-3 select-none" style={{ color: dark ? '#334155' : '#e2e8f0' }}>⊘</div>
          <div className="text-sm" style={{ color: txtSub }}>Nenhum objeto encontrado no array</div>
        </div>
      </div>
    )
  }

  const colunas = [...new Set(objetos.flatMap((o) => Object.keys(o)))]

  const renderCell = (value) => {
    if (value === undefined) return <span style={{ color: dark ? '#475569' : '#cbd5e1' }}>—</span>
    if (value === null)      return <span style={{ color: dark ? '#6b7280' : '#9ca3af', fontStyle: 'italic', fontSize: 11 }}>null</span>
    if (typeof value === 'boolean') return <span style={{ color: dark ? '#c084fc' : '#7c3aed', fontSize: 12, fontFamily: 'monospace' }}>{String(value)}</span>
    if (typeof value === 'number')  return <span style={{ color: dark ? '#facc15' : '#b45309', fontFamily: 'monospace' }}>{value}</span>
    if (Array.isArray(value))  return <span style={{ color: dark ? '#64748b' : '#94a3b8', fontSize: 11, background: dark ? '#0f172a' : '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>[{value.length}]</span>
    if (typeof value === 'object') return <span style={{ color: dark ? '#64748b' : '#94a3b8', fontSize: 11, background: dark ? '#0f172a' : '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{'{'}{Object.keys(value).length}{'}'}</span>
    const str = String(value)
    return <span style={{ color: txt }} title={str.length > 60 ? str : undefined}>{str.length > 60 ? str.slice(0, 60) + '…' : str}</span>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: bg }}>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th style={{ background: bgHdr, color: txtSub, borderBottom: `1px solid ${bdr}`, padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, width: 40 }}>#</th>
              {colunas.map((col) => (
                <th key={col} style={{ background: bgHdr, color: txt, borderBottom: `1px solid ${bdr}`, padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objetos.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${dark ? '#1e293b' : '#f1f5f9'}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = dark ? '#1e293b' : '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: '8px 12px', fontSize: 11, color: txtSub, fontFamily: 'monospace' }}>{i}</td>
                {colunas.map((col) => (
                  <td key={col} style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 13 }}>{renderCell(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${bdr}`, background: bgHdr, fontSize: 11, color: txtSub }}>
        {objetos.length} registros · {colunas.length} colunas
        {data.length !== objetos.length && ` · ${data.length - objetos.length} item(ns) não-objeto ignorado(s)`}
      </div>
    </div>
  )
}

// ─── Estatísticas ─────────────────────────────────────────────────────────────

function JsonEstatisticas({ parsed, rawText, dark }) {
  const stats = useMemo(() => analyzeJson(parsed), [parsed])
  const formatNum = (n) => n.toLocaleString('pt-BR')

  const bg   = dark ? '#1e293b' : '#ffffff'
  const bdr  = dark ? '#334155' : '#e2e8f0'

  const cards = [
    { label: 'Tamanho',      value: formatNum(rawText.length) + ' chars', sub: (new Blob([rawText]).size / 1024).toFixed(2) + ' KB', h: dark ? '#1d4ed8' : '#1d4ed8', t: '#93c5fd', bg: dark ? '#0f172a' : '#eff6ff', bdr: dark ? '#1e3a5f' : '#bfdbfe' },
    { label: 'Profundidade', value: stats.maxDepth, sub: 'níveis',         h: dark ? '#6d28d9' : '#6d28d9', t: '#c4b5fd', bg: dark ? '#0f0a1e' : '#f5f3ff', bdr: dark ? '#3b1e6e' : '#ddd6fe' },
    { label: 'Chaves',       value: formatNum(stats.keys), sub: 'props',   h: dark ? '#4338ca' : '#4338ca', t: '#a5b4fc', bg: dark ? '#0d0f23' : '#eef2ff', bdr: dark ? '#1e2156' : '#c7d2fe' },
    { label: 'Objetos',      value: formatNum(stats.objects), sub: '{ }',  h: dark ? '#7c3aed' : '#7c3aed', t: '#c084fc', bg: dark ? '#100b1f' : '#faf5ff', bdr: dark ? '#3b1e6e' : '#e9d5ff' },
    { label: 'Arrays',       value: formatNum(stats.arrays), sub: '[ ]',   h: dark ? '#0e7490' : '#0e7490', t: '#67e8f9', bg: dark ? '#061218' : '#ecfeff', bdr: dark ? '#134e4a' : '#a5f3fc' },
    { label: 'Strings',      value: formatNum(stats.strings), sub: '"..."', h: dark ? '#15803d' : '#15803d', t: '#4ade80', bg: dark ? '#071311' : '#f0fdf4', bdr: dark ? '#14532d' : '#bbf7d0' },
    { label: 'Números',      value: formatNum(stats.numbers), sub: '0–9',   h: dark ? '#a16207' : '#a16207', t: '#facc15', bg: dark ? '#1a1200' : '#fefce8', bdr: dark ? '#4d3800' : '#fde047' },
    { label: 'Booleanos',    value: formatNum(stats.booleans), sub: 'true/false', h: dark ? '#c2410c' : '#c2410c', t: '#fb923c', bg: dark ? '#1a0c00' : '#fff7ed', bdr: dark ? '#5e1c00' : '#fed7aa' },
    { label: 'Nulos',        value: formatNum(stats.nulls), sub: 'null',    h: dark ? '#991b1b' : '#991b1b', t: '#f87171', bg: dark ? '#150808' : '#fef2f2', bdr: dark ? '#500d0d' : '#fecaca' },
  ]

  const total = stats.strings + stats.numbers + stats.booleans + stats.nulls
  const tipos = [
    { label: 'Strings',   count: stats.strings,  pct: total > 0 ? Math.round((stats.strings  / total) * 100) : 0, color: '#4ade80' },
    { label: 'Números',   count: stats.numbers,  pct: total > 0 ? Math.round((stats.numbers  / total) * 100) : 0, color: '#facc15' },
    { label: 'Booleanos', count: stats.booleans, pct: total > 0 ? Math.round((stats.booleans / total) * 100) : 0, color: '#c084fc' },
    { label: 'Nulos',     count: stats.nulls,    pct: total > 0 ? Math.round((stats.nulls    / total) * 100) : 0, color: '#94a3b8' },
  ].filter((t) => t.count > 0)

  return (
    <div className="overflow-auto h-full p-5" style={{ background: bg }}>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map((c) => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.bdr}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.h, opacity: 0.7, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.t, fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
            <div style={{ fontSize: 11, color: c.h, opacity: 0.5, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {tipos.length > 0 && (
        <div style={{ background: dark ? '#0f172a' : '#f8fafc', border: `1px solid ${bdr}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? '#64748b' : '#94a3b8', marginBottom: 12 }}>Distribuição de tipos primitivos</div>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2, marginBottom: 12 }}>
            {tipos.map((t) => (
              <div key={t.label} style={{ background: t.color, width: `${t.pct}%`, minWidth: t.pct > 0 ? 4 : 0, borderRadius: 999 }} title={`${t.label}: ${t.count}`} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {tipos.map((t) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }}>{t.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#e2e8f0' : '#1e293b' }}>{t.pct}%</span>
                <span style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8' }}>({formatNum(t.count)})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Diff Viewer ──────────────────────────────────────────────────────────────

function DiffViewer({ parsedA, erroA, parsedB, erroB }) {
  const diffs = useMemo(() => {
    if (parsedA === null || parsedB === null) return null
    return diffJson(parsedA, parsedB)
  }, [parsedA, parsedB])

  const added   = diffs ? diffs.filter(d => d.type === 'added').length   : 0
  const removed = diffs ? diffs.filter(d => d.type === 'removed').length : 0
  const changed = diffs ? diffs.filter(d => d.type === 'changed').length : 0

  const semEntrada = !parsedA && !parsedB && !erroA && !erroB

  if (semEntrada) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0e1a', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 52, color: '#1e293b', marginBottom: 14, userSelect: 'none', fontFamily: 'monospace' }}>⇄</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Cole os JSONs nos painéis acima</div>
        <div style={{ fontSize: 12, color: '#1e293b', marginTop: 6 }}>O resultado da comparação aparecerá aqui</div>
      </div>
    )
  }

  if (!parsedA || !parsedB) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0e1a', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {!parsedA && (
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {erroA ? `JSON A inválido: ${erroA}` : 'Aguardando JSON A…'}
          </div>
        )}
        {!parsedB && (
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {erroB ? `JSON B inválido: ${erroB}` : 'Aguardando JSON B…'}
          </div>
        )}
      </div>
    )
  }

  if (diffs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0e1a', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 52, color: '#14532d', marginBottom: 12, userSelect: 'none' }}>✓</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>JSONs idênticos</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Nenhuma diferença estrutural encontrada</div>
      </div>
    )
  }

  const MAX_DIFF = 500
  const visible  = diffs.slice(0, MAX_DIFF)

  const bgMap  = { added: 'rgba(5,46,22,0.55)',  removed: 'rgba(26,8,8,0.55)',  changed: 'rgba(26,18,0,0.55)' }
  const bdrClr = { added: '#14532d',              removed: '#7f1d1d',            changed: '#713f12' }
  const lblClr = { added: '#4ade80',              removed: '#f87171',            changed: '#fbbf24' }
  const lblTxt = { added: '+',                    removed: '−',                  changed: '≠' }
  const valClr = { added: '#86efac',              removed: '#fca5a5',            changed: '#fde68a' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0e1a' }}>
      {/* Barra de resumo */}
      <div style={{ padding: '9px 16px', borderBottom: '1px solid #1e293b', background: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>Resultado da comparação</span>
        <span style={{ fontSize: 12, color: '#64748b' }}>{diffs.length} diferença{diffs.length !== 1 ? 's' : ''}</span>
        {added   > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80',  background: '#052e16', border: '1px solid #14532d', borderRadius: 6, padding: '2px 10px' }}>+{added} adicionado{added   !== 1 ? 's' : ''}</span>}
        {removed > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171',  background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: 6, padding: '2px 10px' }}>−{removed} removido{removed !== 1 ? 's' : ''}</span>}
        {changed > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24',  background: '#1a1200', border: '1px solid #713f12', borderRadius: 6, padding: '2px 10px' }}>≠ {changed} modificado{changed !== 1 ? 's' : ''}</span>}
        {diffs.length > MAX_DIFF && (
          <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 'auto' }}>
            Exibindo primeiros {MAX_DIFF} de {diffs.length}
          </span>
        )}
      </div>
      {/* Lista de diferenças */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {visible.map((diff, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 16px', borderBottom: '1px solid #0f172a', background: bgMap[diff.type], borderLeft: `3px solid ${bdrClr[diff.type]}` }}
          >
            {/* Ícone de tipo */}
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: bdrClr[diff.type] + '55', color: lblClr[diff.type], fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              {lblTxt[diff.type]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Path */}
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#818cf8', marginBottom: 5, wordBreak: 'break-all', lineHeight: 1.5 }}>{diff.path}</div>
              {/* Valor(es) */}
              {diff.type === 'changed' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <code style={{ fontSize: 12, fontFamily: 'monospace', color: '#fca5a5', background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: 4, padding: '2px 8px', wordBreak: 'break-all' }}>
                    {fmtDiffVal(diff.from)}
                  </code>
                  <span style={{ color: '#475569', fontSize: 12 }}>→</span>
                  <code style={{ fontSize: 12, fontFamily: 'monospace', color: '#86efac', background: '#052e16', border: '1px solid #14532d', borderRadius: 4, padding: '2px 8px', wordBreak: 'break-all' }}>
                    {fmtDiffVal(diff.to)}
                  </code>
                </div>
              )}
              {diff.type !== 'changed' && (
                <code style={{ fontSize: 12, fontFamily: 'monospace', color: valClr[diff.type], background: bgMap[diff.type], border: `1px solid ${bdrClr[diff.type]}`, borderRadius: 4, padding: '2px 8px', wordBreak: 'break-all', display: 'inline-block' }}>
                  {fmtDiffVal(diff.value)}
                </code>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Grafo (JSON Crack style) ────────────────────────────────────────────────

const GW   = 230   // node width
const GHH  = 34    // header height
const GRH  = 24    // row height
const GPV  = 6     // vertical padding inside node
const GHGAP = 90   // horizontal gap between levels
const GVGAP = 18   // vertical gap between siblings
const GMAXR = 18   // max rows shown per node before "…more"
const GMAXC = 28   // max children per node

function gHeight(node) {
  const rRows = Math.min(node.rows.length, GMAXR) + (node.rows.length > GMAXR ? 1 : 0)
  return GHH + (rRows + node.children.length) * GRH + GPV * 2
}

function gBuild(value, key = null, idRef = { n: 0 }) {
  const id = `g${idRef.n++}`
  const node = { id, key, rows: [], children: [], isArray: false }

  if (value === null) { node.rows.push({ k: key ?? 'valor', v: null, t: 'null' }); return node }
  if (typeof value !== 'object') { node.rows.push({ k: key ?? 'valor', v: value, t: typeof value }); return node }

  node.isArray = Array.isArray(value)
  const entries = node.isArray
    ? value.map((v, i) => [`[${i}]`, v])
    : Object.entries(value)

  let cc = 0
  for (const [k, v] of entries) {
    if (v !== null && typeof v === 'object' && cc < GMAXC) {
      node.children.push(gBuild(v, k, idRef)); cc++
    } else if (v !== null && typeof v === 'object') {
      node.rows.push({ k, v: Array.isArray(v) ? '[…]' : '{…}', t: 'trunc' })
    } else {
      node.rows.push({ k, v, t: v === null ? 'null' : typeof v })
    }
  }
  return node
}

function gShift(nodes, dy) {
  for (const n of nodes) { n.y += dy; gShift(n.children, dy) }
}

function gLayout(node, x, y) {
  node.x = x
  if (!node.children.length) { node.y = y; return y + gHeight(node) }
  const cx = x + GW + GHGAP
  let nxt = y
  for (const c of node.children) nxt = gLayout(c, cx, nxt) + GVGAP
  const last = node.children[node.children.length - 1]
  const cBot = last.y + gHeight(last)
  const want = (node.children[0].y + cBot) / 2 - gHeight(node) / 2
  node.y = Math.max(y, want)
  if (node.y > want) gShift(node.children, node.y - want)
  const lastU = node.children[node.children.length - 1]
  return Math.max(lastU.y + gHeight(lastU), node.y + gHeight(node))
}

function gCollect(node, nodes = [], edges = []) {
  nodes.push(node)
  for (const c of node.children) { edges.push({ from: node, to: c }); gCollect(c, nodes, edges) }
  return { nodes, edges }
}

function GrafoCard({ node, dark }) {
  const bgCard = dark ? '#1e293b' : '#ffffff'
  const bgHdr  = dark ? '#0f172a' : '#f1f5f9'
  const bdr    = dark ? '#334155' : '#e2e8f0'
  const rowBdr = dark ? '#1e293b' : '#f8fafc'
  const txtKey = dark ? '#94a3b8' : '#64748b'
  const txtHdr = dark ? '#a5b4fc' : '#4f46e5'
  const txtType = dark ? '#475569' : '#94a3b8'
  const txtLink = dark ? '#818cf8' : '#4338ca'

  const vColor = (t) => {
    if (t === 'null' || t === 'trunc') return dark ? '#6b7280' : '#9ca3af'
    if (t === 'boolean') return dark ? '#c084fc' : '#7c3aed'
    if (t === 'number')  return dark ? '#facc15' : '#b45309'
    return dark ? '#4ade80' : '#15803d'
  }
  const fmtV = (v, t) => {
    if (t === 'null')   return 'null'
    if (t === 'trunc')  return String(v)
    if (t === 'string') { const s = String(v); return '"' + (s.length > 22 ? s.slice(0, 22) + '…' : s) + '"' }
    return String(v)
  }

  const visRows = node.rows.slice(0, GMAXR)
  const extraRows = node.rows.length - visRows.length
  const nh = gHeight(node)
  const totalCount = node.rows.length + node.children.length

  return (
    <div style={{ position: 'absolute', left: node.x, top: node.y, width: GW, height: nh, background: bgCard, border: `1px solid ${bdr}`, borderRadius: 10, overflow: 'hidden', boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div style={{ background: bgHdr, borderBottom: `1px solid ${bdr}`, height: GHH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', gap: 6 }}>
        <span style={{ color: txtHdr, fontWeight: 700, fontSize: 12, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.key !== null && node.key !== undefined ? node.key : '(root)'}
        </span>
        <span style={{ color: txtType, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {node.isArray ? `[ ]` : `{ }`} <span style={{ color: dark ? '#334155' : '#cbd5e1' }}>{totalCount}</span>
        </span>
      </div>
      {/* Rows */}
      <div style={{ paddingTop: GPV, paddingBottom: GPV }}>
        {visRows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', height: GRH, padding: '0 10px', gap: 8, borderBottom: `1px solid ${rowBdr}` }}>
            <span style={{ color: txtKey, fontSize: 11, fontFamily: 'monospace', flex: '0 0 42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.k}</span>
            <span style={{ color: vColor(row.t), fontSize: 11, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtV(row.v, row.t)}</span>
          </div>
        ))}
        {extraRows > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: GRH, fontSize: 11, color: dark ? '#475569' : '#94a3b8', fontStyle: 'italic' }}>
            +{extraRows} mais…
          </div>
        )}
        {node.children.map((child, i) => (
          <div key={`l${i}`} style={{ display: 'flex', alignItems: 'center', height: GRH, padding: '0 10px', gap: 8, borderBottom: `1px solid ${rowBdr}` }}>
            <span style={{ color: txtKey, fontSize: 11, fontFamily: 'monospace', flex: '0 0 42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.key}</span>
            <span style={{ color: txtLink, fontSize: 11, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {child.isArray ? `[ ${child.rows.length + child.children.length} ]` : `{ ${child.rows.length + child.children.length} }`}
            </span>
            <span style={{ color: dark ? '#4f46e5' : '#a5b4fc', fontSize: 10, flexShrink: 0 }}>→</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function JsonGrafo({ parsed, dark }) {
  const [zoom, setZoom]   = useState(1)
  const [pan, setPan]     = useState({ x: 40, y: 30 })
  const [drag, setDrag]   = useState(false)
  const dragRef           = useRef({ sx: 0, sy: 0, px: 40, py: 30 })
  const containerRef      = useRef()
  const fittedRef         = useRef(false)

  const { nodes, edges, bounds } = useMemo(() => {
    if (parsed === null || parsed === undefined) return { nodes: [], edges: [], bounds: { w: 0, h: 0 } }
    const root = gBuild(parsed)
    gLayout(root, 0, 0)
    const { nodes, edges } = gCollect(root)
    const maxX = Math.max(...nodes.map(n => n.x + GW)) + 60
    const maxY = Math.max(...nodes.map(n => n.y + gHeight(n))) + 60
    return { nodes, edges, bounds: { w: maxX, h: maxY } }
  }, [parsed])

  const fitView = useCallback(() => {
    if (!containerRef.current || !bounds.w) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const z = Math.min((width - 80) / bounds.w, (height - 80) / bounds.h, 1.4)
    setZoom(Math.max(0.2, z))
    setPan({ x: 40, y: 30 })
  }, [bounds])

  useEffect(() => {
    if (!fittedRef.current && bounds.w > 0) { fittedRef.current = true; fitView() }
  }, [bounds, fitView])

  useEffect(() => { fittedRef.current = false }, [parsed])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(z => Math.min(Math.max(0.15, z + (e.deltaY < 0 ? 0.1 : -0.1)), 2.5))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    setDrag(true)
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }
  }, [pan])

  const onMouseMove = useCallback((e) => {
    if (!drag) return
    setPan({ x: dragRef.current.px + e.clientX - dragRef.current.sx, y: dragRef.current.py + e.clientY - dragRef.current.sy })
  }, [drag])

  const onMouseUp = useCallback(() => setDrag(false), [])

  const edgePath = (fr, to) => {
    const x1 = fr.x + GW, y1 = fr.y + gHeight(fr) / 2
    const x2 = to.x,      y2 = to.y + gHeight(to) / 2
    const cx = x1 + GHGAP / 2
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
  }

  const bgPage   = dark ? '#070d1a' : '#f1f5f9'
  const dotColor = dark ? '#1e293b' : '#e2e8f0'
  const edgeClr  = dark ? '#4f46e5' : '#a5b4fc'
  const btnS = { background: dark ? '#1e293b' : '#ffffff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, color: dark ? '#94a3b8' : '#64748b', fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
  const nodeCount = nodes.length

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: drag ? 'grabbing' : 'grab', userSelect: 'none',
        background: bgPage,
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
    >
      {/* Controles */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 6, pointerEvents: 'all' }}>
        {nodeCount > 150 && (
          <span style={{ fontSize: 11, color: '#f59e0b', background: dark ? '#1c1000' : '#fffbeb', border: '1px solid #d97706', borderRadius: 6, padding: '4px 8px', alignSelf: 'center' }}>
            ⚠ {nodeCount} nós — pode ser lento
          </span>
        )}
        <button style={btnS} onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}>+</button>
        <button style={btnS} onClick={() => setZoom(z => Math.max(z - 0.15, 0.15))}>−</button>
        <button style={btnS} onClick={fitView}>⊡ Ajustar</button>
        <button style={btnS} onClick={() => { setZoom(1); setPan({ x: 40, y: 30 }) }}>↺</button>
        <span style={{ ...btnS, cursor: 'default', color: dark ? '#475569' : '#94a3b8', pointerEvents: 'none' }}>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Canvas */}
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'relative', width: bounds.w, height: bounds.h }}>
        {/* SVG edges */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: bounds.w, height: bounds.h, overflow: 'visible', pointerEvents: 'none' }}>
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={edgeClr} opacity="0.6" />
            </marker>
          </defs>
          {edges.map((e, i) => (
            <path key={i} d={edgePath(e.from, e.to)} fill="none" stroke={edgeClr} strokeWidth="1.5" opacity="0.5" markerEnd="url(#arrow)" />
          ))}
        </svg>
        {/* Cards */}
        {nodes.map(n => <GrafoCard key={n.id} node={n} dark={dark} />)}
      </div>
    </div>
  )
}

// ─── Exemplo ──────────────────────────────────────────────────────────────────

const EXEMPLO_JSON = `{
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "ativo": true,
    "perfil": null,
    "cargos": ["admin", "editor"],
    "endereco": {
      "rua": "Av. Paulista",
      "numero": 1578,
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310-100"
    },
    "preferencias": {
      "tema": "escuro",
      "idioma": "pt-BR",
      "notificacoes": { "email": true, "sms": false, "push": true }
    }
  },
  "metadata": {
    "versao": "2.1.0",
    "geradoEm": "2026-06-03T10:00:00Z",
    "total": 42,
    "pagina": 1,
    "totalPaginas": 5
  }
}`

const ABAS = [
  { id: 'formatado', label: 'Formatado' },
  { id: 'arvore',    label: 'Visualização em Árvore' },
  { id: 'grafo',     label: 'Grafo' },
  { id: 'tabela',    label: 'Tabela de Dados' },
  { id: 'stats',     label: 'Estatísticas' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AnalisadorJson() {
  const [input, setInput]         = useState('')
  const [parsed, setParsed]       = useState(null)
  const [erro, setErro]           = useState(null)
  const [aba, setAba]             = useState('formatado')
  const [pathCopiado, setPath]    = useState('')
  const [copiado, setCopiado]     = useState(false)
  const [cursor, setCursor]       = useState({ linha: 1, coluna: 1 })
  // Preferência de tema persiste no localStorage
  const [viewerDark, setViewerDark] = useState(() => {
    try { return localStorage.getItem('sysgate-json-viewerDark') === 'true' } catch { return false }
  })
  // Modo: analisador ou comparador
  const [modo, setModo]       = useState('analisar')
  // Estado do JSON B (comparador)
  const [inputB, setInputB]   = useState('')
  const [parsedB, setParsedB] = useState(null)
  const [erroB, setErroB]     = useState(null)

  const taRef   = useRef()
  const taRefB  = useRef()
  const fileRef = useRef()

  const processarInput = useCallback((text) => {
    setInput(text)
    if (!text.trim()) { setParsed(null); setErro(null); return }
    try { setParsed(JSON.parse(text)); setErro(null) }
    catch (e) { setParsed(null); setErro(e.message) }
  }, [])

  const processarInputB = useCallback((text) => {
    setInputB(text)
    if (!text.trim()) { setParsedB(null); setErroB(null); return }
    try { setParsedB(JSON.parse(text)); setErroB(null) }
    catch (e) { setParsedB(null); setErroB(e.message) }
  }, [])

  const atualizarCursor = useCallback((e) => {
    const pos  = e.target.selectionStart
    const before = e.target.value.slice(0, pos)
    const linhas = before.split('\n')
    setCursor({ linha: linhas.length, coluna: linhas[linhas.length - 1].length + 1 })
  }, [])

  const formatado   = useMemo(() => (parsed !== null ? JSON.stringify(parsed, null, 2) : ''), [parsed])
  const highlighted = useMemo(() => formatado ? (viewerDark ? highlightJson(formatado) : highlightJsonLight(formatado)) : '', [formatado, viewerDark])
  const bytes       = useMemo(() => new Blob([input]).size, [input])

  const formatar  = () => { if (parsed  !== null) processarInput(JSON.stringify(parsed, null, 2)) }
  const minificar = () => { if (parsed  !== null) processarInput(JSON.stringify(parsed)) }
  const limpar    = () => processarInput('')

  const formatarB  = () => { if (parsedB !== null) processarInputB(JSON.stringify(parsedB, null, 2)) }
  const minificarB = () => { if (parsedB !== null) processarInputB(JSON.stringify(parsedB)) }
  const limparB    = () => processarInputB('')

  const colar = async () => {
    try { const t = await navigator.clipboard.readText(); processarInput(t) } catch (_) {}
  }

  const colarB = async () => {
    try { const t = await navigator.clipboard.readText(); processarInputB(t) } catch (_) {}
  }

  // Troca JSON A ⇄ JSON B
  const trocarAB = () => {
    const tmpInput  = input
    const tmpInputB = inputB
    processarInput(tmpInputB)
    processarInputB(tmpInput)
  }

  const copiarResultado = async () => {
    const text = formatado || input
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1600)
  }

  const baixar = () => {
    const text = formatado || input
    if (!text) return
    const blob = new Blob([text], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'dados.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const onCopyPath = async (path) => {
    await navigator.clipboard.writeText(path)
    setPath(path)
    setTimeout(() => setPath(''), 2000)
  }

  const carregarArquivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => processarInput(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  // Toggle dark/light — salva no localStorage para persistir entre sessões
  const toggleViewerDark = () => {
    setViewerDark(v => {
      const next = !v
      try { localStorage.setItem('sysgate-json-viewerDark', String(next)) } catch {}
      return next
    })
  }

  // Viewer bg e texto dependem do toggle
  const viewerBg   = viewerDark ? '#1e293b' : '#ffffff'
  const viewerText = viewerDark ? '#e2e8f0' : '#1e293b'

  const btnGhost = { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6 }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: DARK.page }}>

      {/* ── Barra de título ── */}
      <div style={{ background: DARK.toolbar, borderBottom: `1px solid ${DARK.toolbarBdr}`, padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Acento */}
        <div style={{ width: 3, height: 20, borderRadius: 999, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)', flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>Analisador JSON</span>
        <span style={{ fontSize: 12, color: '#475569', marginLeft: 2 }}>
          {modo === 'analisar' ? '— Formate, visualize e analise' : '— Compare duas estruturas JSON'}
        </span>

        {/* Toggle de modo */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setModo('analisar')}
            style={{ padding: '4px 14px', fontSize: 12, fontWeight: modo === 'analisar' ? 700 : 500, background: modo === 'analisar' ? '#4f46e5' : 'transparent', color: modo === 'analisar' ? '#ffffff' : '#64748b', border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            Analisador
          </button>
          <button
            onClick={() => setModo('comparar')}
            style={{ padding: '4px 14px', fontSize: 12, fontWeight: modo === 'comparar' ? 700 : 500, background: modo === 'comparar' ? '#4f46e5' : 'transparent', color: modo === 'comparar' ? '#ffffff' : '#64748b', border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            Comparador
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ background: DARK.toolbar, borderBottom: `1px solid ${DARK.toolbarBdr}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>

        {/* Grupo: Entrada */}
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>
          {modo === 'comparar' ? 'JSON A' : 'Entrada'}
        </span>
        {[
          { label: 'Limpar',    action: limpar,    disabled: !input },
          { label: 'Colar',     action: colar,     disabled: false  },
          { label: 'Formatar',  action: formatar,  disabled: !parsed },
          { label: 'Minificar', action: minificar, disabled: !parsed },
        ].map(({ label, action, disabled }) => (
          <button key={label} onClick={action} disabled={disabled}
            style={{ ...btnGhost, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#334155' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >{label}</button>
        ))}

        {/* Divisor */}
        <div style={{ width: 1, height: 20, background: '#334155', margin: '0 4px' }} />

        {modo === 'comparar' ? (
          /* ── Toolbar específica do comparador ── */
          <>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>JSON B</span>
            {[
              { label: 'Limpar B',    action: limparB,    disabled: !inputB },
              { label: 'Colar B',     action: colarB,     disabled: false   },
              { label: 'Formatar B',  action: formatarB,  disabled: !parsedB },
              { label: 'Minificar B', action: minificarB, disabled: !parsedB },
            ].map(({ label, action, disabled }) => (
              <button key={label} onClick={action} disabled={disabled}
                style={{ ...btnGhost, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#334155' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >{label}</button>
            ))}

            <div style={{ width: 1, height: 20, background: '#334155', margin: '0 4px' }} />

            {/* Trocar A⇄B */}
            <button
              onClick={trocarAB}
              disabled={!input && !inputB}
              style={{ ...btnGhost, opacity: (!input && !inputB) ? 0.35 : 1, cursor: (!input && !inputB) ? 'not-allowed' : 'pointer' }}
              onMouseEnter={(e) => { if (input || inputB) e.currentTarget.style.background = '#334155' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              title="Trocar JSON A e JSON B"
            >A ⇄ B</button>

            <button onClick={() => { processarInput(EXEMPLO_JSON) }}
              style={{ ...btnGhost }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#334155' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >Exemplo em A</button>
          </>
        ) : (
          /* ── Toolbar do analisador ── */
          <>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>Resultado</span>
            <button onClick={copiarResultado} disabled={!parsed}
              style={{ ...btnGhost, opacity: !parsed ? 0.35 : 1, cursor: !parsed ? 'not-allowed' : 'pointer',
                ...(copiado ? { background: '#14532d', border: '1px solid #15803d', color: '#4ade80' } : {}) }}
              onMouseEnter={(e) => { if (parsed && !copiado) e.currentTarget.style.background = '#334155' }}
              onMouseLeave={(e) => { if (!copiado) e.currentTarget.style.background = 'transparent' }}
            >{copiado ? '✓ Copiado' : 'Copiar Resultado'}</button>

            <button onClick={baixar} disabled={!parsed}
              style={{ ...btnGhost, opacity: !parsed ? 0.35 : 1, cursor: !parsed ? 'not-allowed' : 'pointer' }}
              onMouseEnter={(e) => { if (parsed) e.currentTarget.style.background = '#334155' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >Baixar .json</button>

            <label style={{ ...btnGhost, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#334155' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Abrir arquivo
              <input type="file" accept=".json,application/json,text/plain" ref={fileRef} onChange={carregarArquivo} style={{ display: 'none' }} />
            </label>

            <button onClick={() => processarInput(EXEMPLO_JSON)}
              style={{ ...btnGhost }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#334155' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >Exemplo</button>

            {/* Validar — CTA primário */}
            <button
              style={{ background: parsed !== null ? '#4f46e5' : erro ? '#7f1d1d' : '#1e293b', border: 'none', color: '#ffffff', padding: '5px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', marginLeft: 4, transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => {}} disabled
            >
              {parsed !== null ? (
                <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Válido</>
              ) : erro ? (
                <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /> Inválido</>
              ) : (
                <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} /> Validar</>
              )}
            </button>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Modo ANALISADOR ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {modo === 'analisar' && (
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Painel ENTRADA (esquerda) ── */}
          <div className="flex flex-col shrink-0" style={{ width: '34%', background: DARK.panel, borderRight: `1px solid ${DARK.toolbarBdr}` }}>

            {/* Header da entrada com dots macOS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: DARK.panelHdr, borderBottom: `1px solid #1e293b`, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entrada Bruta</span>
              {/* Dots estilo macOS */}
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} title="Limpar" onClick={limpar} className="cursor-pointer" />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} title="Minificar" onClick={minificar} className="cursor-pointer" />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} title="Formatar" onClick={formatar} className="cursor-pointer" />
              </div>
            </div>

            {/* Editor com linhas */}
            <EditorLinhas
              value={input}
              onChange={(e) => processarInput(e.target.value)}
              onCursor={atualizarCursor}
              taRef={taRef}
            />

            {/* Erro inline */}
            {erro && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid #450a0a', background: '#1a0808', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Erro de sintaxe</div>
                <div style={{ fontSize: 12, color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{erro}</div>
              </div>
            )}
          </div>

          {/* ── Painel VISUALIZADOR (direita) ── */}
          <div className="flex flex-col flex-1 min-w-0" style={{ background: viewerBg }}>

            {/* Tabs + toggle dark/light */}
            <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${viewerDark ? '#334155' : '#e2e8f0'}`, background: viewerDark ? '#0f172a' : '#f8fafc', flexShrink: 0 }}>
              {ABAS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  disabled={parsed === null}
                  style={{
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: aba === a.id ? 700 : 500,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: aba === a.id ? '2px solid #6366f1' : '2px solid transparent',
                    color: aba === a.id ? (viewerDark ? '#a5b4fc' : '#4f46e5') : (viewerDark ? '#64748b' : '#94a3b8'),
                    cursor: parsed === null ? 'not-allowed' : 'pointer',
                    opacity: parsed === null ? 0.35 : 1,
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    marginBottom: -1,
                  }}
                >{a.label}</button>
              ))}

              {/* Toggle dark/light do visualizador */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 12, gap: 8 }}>
                {pathCopiado && (
                  <div style={{ fontSize: 11, color: '#818cf8', background: viewerDark ? '#1e1b4b' : '#eef2ff', border: '1px solid #4338ca', borderRadius: 6, padding: '2px 8px', display: 'flex', gap: 4 }}>
                    <span style={{ fontWeight: 700 }}>Path:</span>
                    <span style={{ fontFamily: 'monospace' }}>{pathCopiado}</span>
                  </div>
                )}
                <button
                  onClick={toggleViewerDark}
                  title={viewerDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: `1px solid ${viewerDark ? '#334155' : '#e2e8f0'}`, background: viewerDark ? '#1e293b' : '#ffffff', color: viewerDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {viewerDark ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Claro</>
                  ) : (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Escuro</>
                  )}
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-h-0 overflow-hidden">

              {/* Placeholder */}
              {parsed === null && !erro && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: viewerBg }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 72, fontFamily: 'monospace', color: viewerDark ? '#1e293b' : '#e2e8f0', marginBottom: 16, userSelect: 'none', lineHeight: 1 }}>{'{}'}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: viewerDark ? '#475569' : '#94a3b8' }}>Cole um JSON no painel esquerdo</div>
                    <div style={{ fontSize: 12, color: viewerDark ? '#334155' : '#cbd5e1', marginTop: 6, marginBottom: 20 }}>ou carregue um arquivo para começar</div>
                    <button onClick={() => processarInput(EXEMPLO_JSON)}
                      style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Carregar exemplo
                    </button>
                  </div>
                </div>
              )}

              {/* Erro no visualizador */}
              {parsed === null && erro && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: viewerBg }}>
                  <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 24px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, color: viewerDark ? '#7f1d1d' : '#fca5a5' }}>⚠</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>JSON Inválido</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', background: viewerDark ? '#0f172a' : '#f8fafc', border: `1px solid ${viewerDark ? '#7f1d1d' : '#fecaca'}`, borderRadius: 8, padding: 12, color: viewerDark ? '#fca5a5' : '#dc2626', textAlign: 'left', wordBreak: 'break-all', lineHeight: 1.6 }}>{erro}</div>
                    <div style={{ fontSize: 12, color: viewerDark ? '#475569' : '#94a3b8', marginTop: 10 }}>Corrija a sintaxe no painel esquerdo</div>
                  </div>
                </div>
              )}

              {/* Formatado */}
              {parsed !== null && aba === 'formatado' && (
                <pre
                  className="overflow-auto h-full"
                  style={{ margin: 0, padding: 20, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, background: viewerDark ? '#0d1117' : '#fafafa', color: viewerDark ? '#e2e8f0' : '#1e293b' }}
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              )}

              {/* Árvore */}
              {parsed !== null && aba === 'arvore' && (
                <div
                  className="overflow-auto h-full"
                  style={{ padding: 16, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, background: viewerDark ? '#0d1117' : '#fafafa', color: viewerDark ? '#e2e8f0' : '#1e293b' }}
                >
                  <JsonNode value={parsed} depth={0} path="$" onCopyPath={onCopyPath} dark={viewerDark} />
                </div>
              )}

              {/* Grafo */}
              {parsed !== null && aba === 'grafo' && (
                <JsonGrafo parsed={parsed} dark={viewerDark} />
              )}

              {/* Tabela */}
              {parsed !== null && aba === 'tabela' && (
                <JsonTabela data={parsed} dark={viewerDark} />
              )}

              {/* Estatísticas */}
              {parsed !== null && aba === 'stats' && (
                <JsonEstatisticas parsed={parsed} rawText={input} dark={viewerDark} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Modo COMPARADOR ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {modo === 'comparar' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ── Dois editores lado a lado ── */}
          <div style={{ display: 'flex', flex: '0 0 46%', borderBottom: `1px solid ${DARK.toolbarBdr}`, minHeight: 0 }}>

            {/* JSON A */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${DARK.toolbarBdr}`, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: DARK.panelHdr, borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>JSON A</span>
                  {parsed  !== null && <span style={{ fontSize: 10, color: '#4ade80', background: '#052e16', border: '1px solid #14532d', borderRadius: 4, padding: '1px 6px' }}>Válido</span>}
                  {erro                 && <span style={{ fontSize: 10, color: '#f87171', background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: 4, padding: '1px 6px' }}>Inválido</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', cursor: 'pointer' }} title="Limpar A" onClick={limpar} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block', cursor: 'pointer' }} title="Minificar A" onClick={minificar} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block', cursor: 'pointer' }} title="Formatar A" onClick={formatar} />
                </div>
              </div>
              <EditorLinhas value={input} onChange={(e) => processarInput(e.target.value)} onCursor={atualizarCursor} taRef={taRef} />
              {erro && (
                <div style={{ padding: '7px 14px', borderTop: '1px solid #450a0a', background: '#1a0808', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>{erro}</div>
                </div>
              )}
            </div>

            {/* JSON B */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: DARK.panelHdr, borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>JSON B</span>
                  {parsedB !== null && <span style={{ fontSize: 10, color: '#4ade80', background: '#052e16', border: '1px solid #14532d', borderRadius: 4, padding: '1px 6px' }}>Válido</span>}
                  {erroB               && <span style={{ fontSize: 10, color: '#f87171', background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: 4, padding: '1px 6px' }}>Inválido</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', cursor: 'pointer' }} title="Limpar B" onClick={limparB} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block', cursor: 'pointer' }} title="Minificar B" onClick={minificarB} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block', cursor: 'pointer' }} title="Formatar B" onClick={formatarB} />
                </div>
              </div>
              <EditorLinhas value={inputB} onChange={(e) => processarInputB(e.target.value)} onCursor={() => {}} taRef={taRefB} />
              {erroB && (
                <div style={{ padding: '7px 14px', borderTop: '1px solid #450a0a', background: '#1a0808', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>{erroB}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Resultado do diff ── */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <DiffViewer parsedA={parsed} erroA={erro} parsedB={parsedB} erroB={erroB} />
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 16px', borderTop: `1px solid ${DARK.toolbarBdr}`, background: DARK.statusBar, fontSize: 11, flexShrink: 0 }}>
        {/* Validade */}
        {!input ? (
          <span style={{ color: '#475569' }}>Aguardando entrada…</span>
        ) : parsed !== null ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4ade80', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            JSON {modo === 'comparar' ? 'A ' : ''}Válido
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f87171', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
            JSON {modo === 'comparar' ? 'A ' : ''}Inválido
          </span>
        )}

        {modo === 'comparar' && inputB && (
          <>
            <span style={{ color: '#334155' }}>|</span>
            {parsedB !== null ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4ade80', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                JSON B Válido
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f87171', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                JSON B Inválido
              </span>
            )}
          </>
        )}

        {input && <span style={{ color: '#334155' }}>|</span>}
        {input && <span style={{ color: '#64748b' }}>Linha {cursor.linha}, Coluna {cursor.coluna}</span>}
        <span style={{ color: '#334155' }}>|</span>
        <span style={{ color: '#475569' }}>UTF-8</span>
        {bytes > 0 && (
          <>
            <span style={{ color: '#334155' }}>|</span>
            <span style={{ color: '#475569' }}>{bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} bytes`}</span>
          </>
        )}
        {parsed !== null && modo === 'analisar' && (
          <>
            <span style={{ color: '#334155' }}>|</span>
            <span style={{ color: '#475569' }}>{formatado.split('\n').length} linhas formatadas</span>
          </>
        )}
        {modo === 'analisar' && (
          <span style={{ marginLeft: 'auto', color: '#475569' }}>{ABAS.find(a => a.id === aba)?.label ?? ''}</span>
        )}
        {modo === 'comparar' && (
          <span style={{ marginLeft: 'auto', color: '#475569' }}>Comparador de estruturas</span>
        )}
      </div>
    </div>
  )
}
