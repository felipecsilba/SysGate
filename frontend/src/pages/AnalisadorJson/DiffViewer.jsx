import { useMemo } from 'react'
import { diffJson, fmtDiffVal } from './utils'

export default function DiffViewer({ parsedA, erroA, parsedB, erroB }) {
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
