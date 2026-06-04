import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// ─── Constantes do grafo ──────────────────────────────────────────────────────

const GW    = 230   // node width
const GHH   = 34    // header height
const GRH   = 24    // row height
const GPV   = 6     // vertical padding inside node
const GHGAP = 90    // horizontal gap between levels
const GVGAP = 18    // vertical gap between siblings
const GMAXR = 18    // max rows shown per node before "…more"
const GMAXC = 28    // max children per node

// ─── Utilitários de layout ────────────────────────────────────────────────────

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

// ─── GrafoCard ────────────────────────────────────────────────────────────────

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

// ─── JsonGrafo ────────────────────────────────────────────────────────────────

export default function JsonGrafo({ parsed, dark }) {
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
