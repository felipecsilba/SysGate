import { useState, useMemo } from 'react'
import { highlightJson, highlightJsonLight } from './utils'

const MAX_ITEMS = 200

export default function JsonNode({ value, keyName, depth, path, onCopyPath, dark }) {
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
