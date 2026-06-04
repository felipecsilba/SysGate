import { highlightJson, highlightJsonLight } from './utils'

export default function BuscaResultados({ results, termo, dark }) {
  const bg     = dark ? '#0d1117' : '#fafafa'
  const bdr    = dark ? '#1e293b' : '#f1f5f9'
  const bgHdr  = dark ? '#0f172a' : '#f8fafc'
  const hdrBdr = dark ? '#1e293b' : '#e2e8f0'
  const txtSub = dark ? '#64748b' : '#94a3b8'

  const fmtVal = (v) => {
    if (v === null) return <span style={{ color: dark ? '#6b7280' : '#9ca3af', fontStyle: 'italic' }}>null</span>
    if (typeof v === 'boolean') return <span style={{ color: dark ? '#c084fc' : '#7c3aed' }}>{String(v)}</span>
    if (typeof v === 'number')  return <span style={{ color: dark ? '#facc15' : '#b45309' }}>{v}</span>
    if (typeof v === 'string')  { const s = v.length > 80 ? v.slice(0, 80) + '…' : v; return <span style={{ color: dark ? '#4ade80' : '#15803d' }}>"{s}"</span> }
    if (Array.isArray(v)) return <span style={{ color: dark ? '#64748b' : '#94a3b8' }}>[{v.length} itens]</span>
    if (typeof v === 'object')  return <span style={{ color: dark ? '#64748b' : '#94a3b8' }}>{`{${Object.keys(v).length} chaves}`}</span>
    return <span>{String(v)}</span>
  }

  if (results.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, color: dark ? '#1e293b' : '#e2e8f0', marginBottom: 12, userSelect: 'none', lineHeight: 1 }}>◌</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: dark ? '#475569' : '#94a3b8', marginBottom: 6 }}>Nenhum resultado para "{termo}"</div>
          <div style={{ fontSize: 12, color: dark ? '#334155' : '#cbd5e1' }}>Tente um termo diferente</div>
        </div>
      </div>
    )
  }

  const MAX_RESULTS = 300
  const visible = results.slice(0, MAX_RESULTS)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg }}>
      <div style={{ padding: '7px 16px', borderBottom: `1px solid ${hdrBdr}`, background: bgHdr, fontSize: 11, color: txtSub, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, color: dark ? '#a5b4fc' : '#4f46e5' }}>{results.length}</span>
        <span>resultado{results.length !== 1 ? 's' : ''} para</span>
        <code style={{ background: dark ? '#1e293b' : '#f1f5f9', border: `1px solid ${hdrBdr}`, borderRadius: 4, padding: '1px 6px', fontSize: 11, color: dark ? '#fbbf24' : '#b45309' }}>{termo}</code>
        {results.length >= 500 && <span style={{ color: '#f59e0b' }}>(máx. 500)</span>}
        {results.length > MAX_RESULTS && <span style={{ color: txtSub }}>· exibindo {MAX_RESULTS}</span>}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {visible.map((r, i) => (
          <div key={i}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 16px', borderBottom: `1px solid ${bdr}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = dark ? '#0f172a' : '#f8fafc' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, marginTop: 2,
              color:      r.matchIn === 'key' ? (dark ? '#818cf8' : '#4f46e5') : (dark ? '#4ade80' : '#15803d'),
              background: r.matchIn === 'key' ? (dark ? '#1e1b4b' : '#eef2ff') : (dark ? '#052e16' : '#f0fdf4'),
              border: `1px solid ${r.matchIn === 'key' ? (dark ? '#312e81' : '#c7d2fe') : (dark ? '#14532d' : '#bbf7d0')}`,
              borderRadius: 4, padding: '2px 6px',
            }}>{r.matchIn === 'key' ? 'chave' : 'valor'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: dark ? '#818cf8' : '#4338ca', marginBottom: 3, wordBreak: 'break-all', lineHeight: 1.5 }}>{r.path}</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{fmtVal(r.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
