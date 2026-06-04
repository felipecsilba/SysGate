import { useMemo } from 'react'
import { analyzeJson } from './utils'

export default function JsonEstatisticas({ parsed, rawText, dark }) {
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
