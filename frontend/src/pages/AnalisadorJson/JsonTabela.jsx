import { useState, useMemo } from 'react'
import { highlightJson, highlightJsonLight } from './utils'

export default function JsonTabela({ data, dark }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const bg     = dark ? '#1e293b' : '#ffffff'
  const bgHdr  = dark ? '#0f172a' : '#f8fafc'
  const bdr    = dark ? '#334155' : '#e2e8f0'
  const txt    = dark ? '#e2e8f0' : '#1e293b'
  const txtSub = dark ? '#94a3b8' : '#64748b'

  const objetos = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
  }, [data])

  const colunas = useMemo(() => [...new Set(objetos.flatMap((o) => Object.keys(o)))], [objetos])

  const objetosOrdenados = useMemo(() => {
    if (!sortCol) return objetos
    return [...objetos].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      if (av === undefined && bv === undefined) return 0
      if (av === undefined) return 1
      if (bv === undefined) return -1
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(typeof av === 'object' ? JSON.stringify(av) : av)
            .localeCompare(String(typeof bv === 'object' ? JSON.stringify(bv) : bv), 'pt-BR', { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [objetos, sortCol, sortDir])

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

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const exportarCSV = () => {
    const escape = (v) => {
      if (v === null || v === undefined) return ''
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [
      colunas.map(escape).join(','),
      ...objetosOrdenados.map(row => colunas.map(col => escape(row[col])).join(',')),
    ]
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'dados.csv'; a.click()
    URL.revokeObjectURL(url)
  }

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
                <th key={col}
                  onClick={() => handleSort(col)}
                  style={{ background: bgHdr, color: sortCol === col ? (dark ? '#a5b4fc' : '#4f46e5') : txt, borderBottom: `1px solid ${bdr}`, padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = dark ? '#1e293b' : '#f1f5f9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = bgHdr }}
                >
                  {col}
                  {sortCol === col && (
                    <span style={{ marginLeft: 5, fontSize: 10, color: dark ? '#818cf8' : '#6366f1' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                  {sortCol !== col && (
                    <span style={{ marginLeft: 5, fontSize: 10, color: dark ? '#334155' : '#e2e8f0', opacity: 0 }} className="sort-hint">⇅</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objetosOrdenados.map((row, i) => (
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
      {/* Footer: info + exportar */}
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${bdr}`, background: bgHdr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: txtSub }}>
          {objetos.length} registros · {colunas.length} colunas
          {sortCol && <span style={{ marginLeft: 8, color: dark ? '#818cf8' : '#6366f1' }}>· <strong>{sortCol}</strong> {sortDir === 'asc' ? '▲' : '▼'}</span>}
          {data.length !== objetos.length && ` · ${data.length - objetos.length} item(ns) não-objeto ignorado(s)`}
        </span>
        <button
          onClick={exportarCSV}
          style={{ background: 'transparent', border: `1px solid ${bdr}`, color: txtSub, padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = dark ? '#1e293b' : '#f1f5f9' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          ↓ Exportar CSV
        </button>
      </div>
    </div>
  )
}
