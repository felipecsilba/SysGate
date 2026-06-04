import { useState, useEffect, useRef, useMemo } from 'react'
import { proxyApi, requisicoesApi } from '../../lib/api'
import { extrairId, METODO_COLORS, METODO_ACTIVE, tipoCor } from './utils'

// Versão string — highlight de JSON já serializado (usado no CodeBlock interno)
function highlightJsonStr(str) {
  const escaped = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#a5b4fc">${match}</span>`
        return `<span style="color:#86efac">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span style="color:#f9a8d4">${match}</span>`
      if (/null/.test(match)) return `<span style="color:#94a3b8;font-style:italic">${match}</span>`
      return `<span style="color:#fde68a">${match}</span>`
    }
  )
}

function CodeBlock({ text, title = 'JSON', maxH = '60vh' }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/60 shadow-md">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700/60">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
        </div>
        <span className="text-[11px] text-gray-500 font-mono ml-1">{title}</span>
      </div>
      <pre
        className="bg-gray-950 p-4 overflow-auto text-xs font-mono leading-relaxed scrollbar-thin"
        style={{ maxHeight: maxH }}
        dangerouslySetInnerHTML={{ __html: highlightJsonStr(text) }}
      />
    </div>
  )
}

function JsonViewer({ data }) {
  return <CodeBlock text={JSON.stringify(data, null, 2)} maxH="60vh" />
}

export default function AbaRequisicao({
  municipioSel,
  sistemaSel,
  endpointSel,
  metodo,
  pathCustom,
  schema,
  schemaExpanded,
  camposSelecionados,
  setCamposSelecionados,
}) {
  const [valoresCampos, setValoresCampos] = useState({})
  const [bodyRaw, setBodyRaw] = useState('')
  const [modoBody, setModoBody] = useState('schema') // 'schema' | 'raw'
  const [campoBusca, setCampoBusca] = useState('')

  const [resposta, setResposta] = useState(null)
  const [idConsulta, setIdConsulta] = useState(null)
  const [consultandoResultado, setConsultandoResultado] = useState(false)
  const [respostaConsulta, setRespostaConsulta] = useState(null)
  const [executando, setExecutando] = useState(false)
  const [historico, setHistorico] = useState([])
  const [subAba, setSubAba] = useState('resposta') // 'resposta' | 'historico'
  const bodyRawRef = useRef(null)

  // Auto-resize do textarea raw
  useEffect(() => {
    if (modoBody !== 'raw') return
    requestAnimationFrame(() => {
      const el = bodyRawRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.max(el.scrollHeight, 160) + 'px'
    })
  }, [bodyRaw, modoBody])

  // Inicializa valoresCampos, bodyRaw e modoBody quando o endpoint muda
  // camposSelecionados é inicializado pelo pai (index.jsx)
  useEffect(() => {
    if (!endpointSel) {
      setValoresCampos({})
      setBodyRaw('')
      setCampoBusca('')
      setModoBody('schema')
      setResposta(null)
      setIdConsulta(null)
      setRespostaConsulta(null)
      return
    }

    const rawSchema = endpointSel.bodySchema || []
    const campos = rawSchema.filter((c) => !c._exemplo)
    const exemplaSentinel = rawSchema.find((c) => c._exemplo)
    const exJson = exemplaSentinel?.json
    const exObj = Array.isArray(exJson) ? exJson[0] : exJson

    const vals = {}
    for (const c of campos) {
      if (c.tipo === 'object' && exObj && typeof exObj[c.campo] === 'object' && exObj[c.campo] !== null && !Array.isArray(exObj[c.campo])) {
        for (const [subKey, subVal] of Object.entries(exObj[c.campo])) {
          const key = `${c.campo}.${subKey}`
          if (subVal !== null && subVal !== undefined) {
            if (typeof subVal === 'object') {
              vals[key] = subKey === 'idGerado'
                ? String(subVal.id ?? subVal.idGerado ?? 1)
                : JSON.stringify(subVal)
            } else {
              vals[key] = String(subVal)
            }
          } else {
            vals[key] = ''
          }
        }
      } else {
        vals[c.campo] = c.exemplo || ''
      }
    }
    if ('idIntegracao' in vals && !vals['idIntegracao']) vals['idIntegracao'] = 'INTEGRACAO1'
    for (const key of Object.keys(vals)) {
      if (key === 'idGerado' || key.endsWith('.idGerado')) {
        if (!vals[key]) vals[key] = '1'
      }
    }
    setValoresCampos(vals)
    setCampoBusca('')

    if (exJson !== undefined) {
      setBodyRaw(JSON.stringify(exJson, null, 2))
      const temArray = campos.some((c) => c.tipo?.startsWith('array<'))
      if (temArray) setModoBody('raw')
    } else {
      setBodyRaw('')
    }
  }, [endpointSel])

  // Carrega histórico ao abrir a aba
  useEffect(() => {
    if (subAba === 'historico') carregarHistorico()
  }, [subAba])

  const temBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)

  const schemaSelecionado = schemaExpanded.filter((c) => camposSelecionados[c.campo])

  const bodyPreview = useMemo(() => {
    if (!schemaExpanded.length) return ''
    const obj = {}
    for (const c of schemaExpanded) {
      if (camposSelecionados[c.campo] && valoresCampos[c.campo] !== '') {
        const val = valoresCampos[c.campo]
        const numVal = (c.tipo === 'number' || c.tipo === 'integer') ? Number(val) : val
        const typedVal = c._wrapAsIdObject ? { id: numVal } : numVal
        if (c._parent) {
          if (!obj[c._parent]) obj[c._parent] = {}
          obj[c._parent][c._displayCampo] = typedVal
        } else {
          obj[c.campo] = typedVal
        }
      }
    }
    return Object.keys(obj).length ? JSON.stringify(obj, null, 2) : ''
  }, [schemaExpanded, camposSelecionados, valoresCampos])

  const carregarHistorico = async () => {
    const data = await requisicoesApi.listar({ municipioId: municipioSel || undefined })
    setHistorico(data)
  }

  const executar = async () => {
    if (!municipioSel) { alert('Selecione um município'); return }
    if (!sistemaSel) { alert('Selecione um sistema'); return }
    if (!pathCustom) { alert('Informe o path do endpoint'); return }
    setExecutando(true)
    setResposta(null)

    let body = undefined
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)) {
      if (modoBody === 'schema' && schemaExpanded.length > 0) {
        body = {}
        for (const c of schemaExpanded) {
          if (camposSelecionados[c.campo] && valoresCampos[c.campo] !== '') {
            const val = valoresCampos[c.campo]
            const numVal = (c.tipo === 'number' || c.tipo === 'integer') ? Number(val) : val
            const typedVal = c._wrapAsIdObject ? { id: numVal } : numVal
            if (c._parent) {
              if (!body[c._parent]) body[c._parent] = {}
              body[c._parent][c._displayCampo] = typedVal
            } else {
              body[c.campo] = typedVal
            }
          }
        }
      } else if (bodyRaw.trim()) {
        try { body = JSON.parse(bodyRaw) } catch { alert('JSON inválido no body'); setExecutando(false); return }
      }
    }

    try {
      const res = await proxyApi.executar({
        municipioId: Number(municipioSel),
        sistemaId: Number(sistemaSel),
        endpointId: endpointSel?.id || null,
        path: pathCustom,
        metodo,
        body,
        tipo: 'individual',
      })
      setResposta(res)
      setIdConsulta(extrairId(res.data))
      setRespostaConsulta(null)
      setSubAba('resposta')
      carregarHistorico()
    } catch (e) {
      setResposta({ error: e.message })
      setIdConsulta(null)
    } finally {
      setExecutando(false)
    }
  }

  const consultarResultado = async () => {
    if (!idConsulta) return
    setConsultandoResultado(true)
    try {
      const res = await proxyApi.executar({
        municipioId: Number(municipioSel),
        sistemaId: Number(sistemaSel),
        path: pathCustom.replace(/\/$/, '') + '/' + idConsulta,
        metodo: 'GET',
        tipo: 'individual',
      })
      setRespostaConsulta(res)
      carregarHistorico()
    } catch (e) {
      setRespostaConsulta({ error: e.message })
    } finally {
      setConsultandoResultado(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Body */}
      {temBody && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">5</span>
              <h3 className="font-semibold text-sm text-gray-700">Body</h3>
            </div>
            {schema.length > 0 && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setModoBody('schema')}
                  className={`px-3 py-1 rounded-md transition-all ${modoBody === 'schema' ? 'bg-white text-sysgate-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Schema
                </button>
                <button
                  onClick={() => setModoBody('raw')}
                  className={`px-3 py-1 rounded-md transition-all ${modoBody === 'raw' ? 'bg-white text-sysgate-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  JSON raw
                </button>
              </div>
            )}
          </div>

          {modoBody === 'schema' && schema.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 h-96">
              {/* Coluna esquerda — checkboxes */}
              <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">
                <div className="px-3 pt-2.5 pb-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex-shrink-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Campos</span>
                    </div>
                    {(() => {
                      const alternaveis = schemaExpanded.filter((c) => c.campo !== 'idIntegracao' && c._displayCampo !== 'idGerado')
                      const todos = alternaveis.length > 0 && alternaveis.every((c) => camposSelecionados[c.campo])
                      return (
                        <button
                          onClick={() => {
                            const novoEstado = {}
                            for (const c of alternaveis) novoEstado[c.campo] = !todos
                            setCamposSelecionados((s) => ({ ...s, ...novoEstado }))
                          }}
                          className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                            todos
                              ? 'bg-sysgate-100 text-sysgate-700 hover:bg-sysgate-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {todos ? 'Desmarcar todos' : 'Selecionar todos'}
                        </button>
                      )
                    })()}
                  </div>
                  <div className="relative">
                    <svg className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                      type="text"
                      value={campoBusca}
                      onChange={(e) => setCampoBusca(e.target.value)}
                      placeholder="Buscar campo..."
                      className="w-full pl-6 pr-6 py-1 text-xs rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sysgate-400 focus:border-transparent"
                    />
                    {campoBusca && (
                      <button
                        onClick={() => setCampoBusca('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-gray-100">
                  {(() => {
                    const busca = campoBusca.trim().toLowerCase()
                    const camposFiltrados = busca
                      ? schemaExpanded.filter((c) => {
                          const isFixed = c.campo === 'idIntegracao' || c._displayCampo === 'idGerado'
                          return isFixed || c._displayCampo.toLowerCase().includes(busca)
                        })
                      : schemaExpanded
                    const items = []
                    let lastParent = undefined
                    for (const campo of camposFiltrados) {
                      const isFixed = campo.campo === 'idIntegracao' || campo._displayCampo === 'idGerado'

                      if (!isFixed && lastParent === 'FIXED_SEPARATOR') {
                        items.push(<div key="sep-integracao" className="h-px bg-gray-200 mx-2" />)
                        lastParent = undefined
                      }

                      if (campo._parent && campo._parent !== lastParent) {
                        items.push(
                          <div key={`hdr-${campo._parent}`} className="px-3 py-1.5 bg-gray-50">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{campo._parent}</span>
                          </div>
                        )
                        lastParent = campo._parent
                      } else if (!campo._parent) {
                        if (isFixed) lastParent = 'FIXED_SEPARATOR'
                        else lastParent = null
                      }

                      if (isFixed) {
                        items.push(
                          <div key={campo.campo} className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 select-none">
                            <div className="w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center bg-amber-500 border-amber-500">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <span className="flex-1 text-xs font-mono font-medium text-amber-800">{campo._displayCampo}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium flex-shrink-0">obrigatório</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${tipoCor(campo.tipo)}`}>{campo.tipo}</span>
                          </div>
                        )
                      } else {
                        const checked = camposSelecionados[campo.campo] || false
                        items.push(
                          <div
                            key={campo.campo}
                            onClick={() => setCamposSelecionados((s) => ({ ...s, [campo.campo]: !s[campo.campo] }))}
                            className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors select-none ${
                              campo._parent ? 'pl-5' : ''
                            } ${checked ? 'bg-sysgate-50 hover:bg-sysgate-100/70' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                              checked ? 'bg-sysgate-600 border-sysgate-600' : 'border-gray-300 bg-white'
                            }`}>
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span className={`flex-1 text-xs font-mono font-medium truncate ${checked ? 'text-sysgate-700' : 'text-gray-700'}`}>
                              {campo._displayCampo}
                              {campo.obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${tipoCor(campo.tipo)}`}>{campo.tipo}</span>
                          </div>
                        )
                      }
                    }
                    return items
                  })()}
                </div>
              </div>

              {/* Coluna direita — inputs */}
              <div className="border border-sysgate-200/60 rounded-xl overflow-hidden flex flex-col shadow-sm" style={{background: 'linear-gradient(to bottom, #eef2ff22, #fff)'}}>
                <div className="px-3 py-2.5 bg-gradient-to-r from-sysgate-600 to-violet-600 border-b border-sysgate-500/30 flex-shrink-0 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Valores</span>
                </div>
                {schemaSelecionado.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-gray-400 text-center p-4">
                      Marque os campos ao lado para preencher os valores
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
                    {schemaSelecionado.map((campo) => {
                      const isFixed = campo.campo === 'idIntegracao' || campo._displayCampo === 'idGerado'
                      return (
                        <div key={campo.campo} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border ${
                          isFixed ? 'bg-amber-50 border-amber-200' : 'bg-sysgate-100/40 border-sysgate-200/60'
                        }`}>
                          <label className={`text-sm font-medium w-28 truncate flex-shrink-0 ${isFixed ? 'text-amber-800' : 'text-sysgate-700'}`} title={campo.campo}>
                            {campo._displayCampo}
                            {isFixed && <span className="text-amber-500 ml-0.5">*</span>}
                            {!isFixed && campo.obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          {campo.enum?.length > 0 ? (
                            <select
                              value={valoresCampos[campo.campo] || ''}
                              onChange={(e) => setValoresCampos((v) => ({ ...v, [campo.campo]: e.target.value }))}
                              className={`flex-1 border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                                isFixed
                                  ? 'bg-white border-amber-200 focus:ring-amber-400'
                                  : 'bg-gray-50 border-gray-200 focus:ring-sysgate-500 focus:bg-white'
                              }`}
                            >
                              <option value="">— selecione —</option>
                              {campo.enum.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={valoresCampos[campo.campo] || ''}
                              onChange={(e) => setValoresCampos((v) => ({ ...v, [campo.campo]: e.target.value }))}
                              className={`flex-1 border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                                isFixed
                                  ? 'bg-white border-amber-200 focus:ring-amber-400'
                                  : 'bg-gray-50 border-gray-200 focus:ring-sysgate-500 focus:bg-white'
                              }`}
                              placeholder={campo.tipo}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

              {/* Botão executar */}
              <div className="flex justify-end">
                <button
                  onClick={executar}
                  disabled={executando || !municipioSel || !pathCustom}
                  className="btn-primary px-6 py-2.5"
                >
                  {executando ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Executando...
                    </span>
                  ) : (
                    '▶ Executar requisição'
                  )}
                </button>
              </div>

              {/* Preview JSON */}
              {bodyPreview && <CodeBlock text={bodyPreview} maxH="240px" />}

            </div>
          ) : (
            <>
              <textarea
                ref={bodyRawRef}
                value={bodyRaw}
                onChange={(e) => setBodyRaw(e.target.value)}
                className="code-area w-full overflow-hidden"
                style={{ minHeight: '160px', resize: 'none' }}
                placeholder={'{\n  "campo": "valor"\n}'}
              />
              <div className="flex justify-end">
                <button
                  onClick={executar}
                  disabled={executando || !municipioSel || !pathCustom}
                  className="btn-primary px-6 py-2.5"
                >
                  {executando ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Executando...
                    </span>
                  ) : (
                    '▶ Executar requisição'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botão executar para GET/métodos sem body */}
      {!temBody && (
        <div className="flex justify-end">
          <button
            onClick={executar}
            disabled={executando || !municipioSel || !pathCustom}
            className="btn-primary px-6 py-2.5"
          >
            {executando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executando...
              </span>
            ) : (
              '▶ Executar requisição'
            )}
          </button>
        </div>
      )}

      {/* Resposta / Histórico */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200">
          {['resposta', 'historico'].map((aba) => (
            <button
              key={aba}
              onClick={() => setSubAba(aba)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                subAba === aba
                  ? 'border-b-2 border-sysgate-600 text-sysgate-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {aba === 'resposta' ? 'Resposta' : 'Histórico'}
            </button>
          ))}
        </div>

        <div className="p-4">
          {subAba === 'resposta' ? (
            resposta ? (
              <div className="space-y-3">
                {resposta.statusCode && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`badge text-sm px-3 py-1 font-mono ${
                      resposta.statusCode < 300 ? 'badge-green' :
                      resposta.statusCode < 400 ? 'badge-yellow' : 'badge-red'
                    }`}>
                      {resposta.statusCode}
                    </span>
                    <span className="text-gray-500">{resposta.duracaoMs}ms</span>
                    <span className={`badge text-xs ${METODO_COLORS[resposta.metodo] || ''}`}>
                      {resposta.metodo}
                    </span>
                  </div>
                )}
                {resposta.headers && Object.values(resposta.headers).some(Boolean) && (
                  <div className="text-xs font-mono text-gray-500 bg-gray-50 rounded p-2 space-y-0.5">
                    {Object.entries(resposta.headers)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k}><span className="text-gray-400">{k}:</span> {v}</div>
                      ))}
                  </div>
                )}
                <JsonViewer data={resposta.data ?? resposta} />
                {idConsulta && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        ID gerado:{' '}
                        <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{idConsulta}</code>
                      </span>
                      <button
                        onClick={consultarResultado}
                        disabled={consultandoResultado}
                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        {consultandoResultado ? (
                          <>
                            <span className="w-3 h-3 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                            Consultando...
                          </>
                        ) : (
                          '↻ Consultar resultado'
                        )}
                      </button>
                    </div>
                    {respostaConsulta && (
                      <div className="space-y-1.5">
                        {respostaConsulta.statusCode && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-mono px-2 py-0.5 rounded font-semibold ${
                              respostaConsulta.statusCode < 300 ? 'bg-green-100 text-green-700' :
                              respostaConsulta.statusCode < 400 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>{respostaConsulta.statusCode}</span>
                            <span className="text-gray-400">{respostaConsulta.duracaoMs}ms</span>
                          </div>
                        )}
                        <JsonViewer data={respostaConsulta.data ?? respostaConsulta} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">
                Execute uma requisição para ver a resposta aqui
              </div>
            )
          ) : (
            <div className="space-y-2 max-h-[28rem] overflow-y-auto scrollbar-thin">
              {historico.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem histórico</p>
              ) : (
                historico.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-xs ${METODO_COLORS[r.metodo] || ''}`}>{r.metodo}</span>
                      <span className={`text-xs font-mono ${r.statusCode < 300 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.statusCode}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(r.criadoEm).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-600 truncate">{r.url}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
