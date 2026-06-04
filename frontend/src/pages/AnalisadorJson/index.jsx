import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { DARK, highlightJson, highlightJsonLight, buscaJson } from './utils'
import { EXEMPLO_JSON, ABAS } from './constants'
import JsonNode from './JsonNode'
import JsonTabela from './JsonTabela'
import JsonEstatisticas from './JsonEstatisticas'
import BuscaResultados from './BuscaResultados'
import DiffViewer from './DiffViewer'
import JsonGrafo from './JsonGrafo'

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
  // Busca no visualizador
  const [busca, setBusca]     = useState('')
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

  const resultadosBusca = useMemo(() => {
    if (!busca.trim() || parsed === null) return []
    return buscaJson(parsed, busca.trim())
  }, [parsed, busca])

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
      <div style={{ background: DARK.toolbar, borderBottom: `1px solid ${DARK.toolbarBdr}`, padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 0 }}>
        {/* Acento */}
        <div style={{ width: 3, height: 20, borderRadius: 999, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)', flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', flexShrink: 0, whiteSpace: 'nowrap' }}>Analisador JSON</span>
        <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
          {modo === 'analisar' ? '— Formate, visualize e analise' : '— Compare duas estruturas JSON'}
        </span>

        {/* Toggle de modo — flexShrink:0 garante que nunca some da tela */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 2, background: '#0f172a', border: '1px solid #4f46e5', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setModo('analisar')}
            style={{ padding: '4px 14px', fontSize: 12, fontWeight: modo === 'analisar' ? 700 : 500, background: modo === 'analisar' ? '#4f46e5' : 'transparent', color: modo === 'analisar' ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          >
            Analisador
          </button>
          <button
            onClick={() => setModo('comparar')}
            style={{ padding: '4px 14px', fontSize: 12, fontWeight: modo === 'comparar' ? 700 : 500, background: modo === 'comparar' ? '#4f46e5' : 'transparent', color: modo === 'comparar' ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
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

            {/* Barra de busca */}
            {parsed !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: `1px solid ${viewerDark ? '#1e293b' : '#f1f5f9'}`, background: viewerDark ? '#0f172a' : '#f8fafc', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={viewerDark ? '#475569' : '#94a3b8'} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Buscar chave ou valor…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: viewerDark ? '#e2e8f0' : '#1e293b', caretColor: '#818cf8' }}
                />
                {busca && (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 700, color: viewerDark ? '#818cf8' : '#6366f1', background: viewerDark ? '#1e1b4b' : '#eef2ff', border: `1px solid ${viewerDark ? '#312e81' : '#c7d2fe'}`, borderRadius: 10, padding: '1px 8px' }}>
                      {resultadosBusca.length}
                    </span>
                    <button onClick={() => setBusca('')} style={{ background: 'transparent', border: 'none', color: viewerDark ? '#475569' : '#94a3b8', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }} title="Limpar busca">✕</button>
                  </>
                )}
              </div>
            )}

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

              {/* Busca */}
              {parsed !== null && busca.trim() && (
                <BuscaResultados results={resultadosBusca} termo={busca.trim()} dark={viewerDark} />
              )}

              {/* Formatado */}
              {parsed !== null && !busca.trim() && aba === 'formatado' && (
                <pre
                  className="overflow-auto h-full"
                  style={{ margin: 0, padding: 20, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, background: viewerDark ? '#0d1117' : '#fafafa', color: viewerDark ? '#e2e8f0' : '#1e293b' }}
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              )}

              {/* Árvore */}
              {parsed !== null && !busca.trim() && aba === 'arvore' && (
                <div
                  className="overflow-auto h-full"
                  style={{ padding: 16, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, background: viewerDark ? '#0d1117' : '#fafafa', color: viewerDark ? '#e2e8f0' : '#1e293b' }}
                >
                  <JsonNode value={parsed} depth={0} path="$" onCopyPath={onCopyPath} dark={viewerDark} />
                </div>
              )}

              {/* Grafo */}
              {parsed !== null && !busca.trim() && aba === 'grafo' && (
                <JsonGrafo parsed={parsed} dark={viewerDark} />
              )}

              {/* Tabela */}
              {parsed !== null && !busca.trim() && aba === 'tabela' && (
                <JsonTabela data={parsed} dark={viewerDark} />
              )}

              {/* Estatísticas */}
              {parsed !== null && !busca.trim() && aba === 'stats' && (
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
