import { useState, useEffect, useRef, useMemo } from 'react'
import { endpointsApi, proxyApi, requisicoesApi, municipiosApi, sistemasApi } from '../lib/api'
import useMunicipioStore from '../stores/municipioStore'
import SearchSelect from '../components/SearchSelect'

// Extrai nome legível do recurso a partir dos dados do endpoint
function nomeRecurso(ep, moduleBase = '') {
  // Tenta extrair após " - ": "...de Economico - Informação Complementar" → "Informação Complementar"
  const idx = ep.nome.lastIndexOf(' - ')
  if (idx !== -1) return ep.nome.slice(idx + 3)

  // Fallback: último segmento do path sem params, split camelCase
  const partes = ep.path.split('/').filter((p) => p && !p.startsWith('{'))
  if (partes.length === 0) return ep.nome
  const ultima = partes[partes.length - 1]
  // split camelCase: "economicosAnexos" → ["economicos", "Anexos"]
  const palavras = ultima.replace(/([A-Z])/g, ' $1').trim().split(/\s+/)
  // Remove prefixo do módulo: ["economicos", "Anexos"] → ["Anexos"]
  if (moduleBase && palavras.length > 1 && palavras[0].toLowerCase() === moduleBase.toLowerCase()) {
    palavras.shift()
  }
  if (palavras.length === 0) return ultima.charAt(0).toUpperCase() + ultima.slice(1)
  palavras[0] = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1)
  return palavras.join(' ')
}

const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const METODO_COLORS = {
  GET: 'bg-blue-100 text-blue-800', POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800', PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
}
const METODO_ACTIVE = {
  GET:    'bg-blue-500   text-white border-blue-500',
  POST:   'bg-green-500  text-white border-green-500',
  PUT:    'bg-yellow-500 text-white border-yellow-500',
  PATCH:  'bg-orange-500 text-white border-orange-500',
  DELETE: 'bg-red-500    text-white border-red-500',
}

function JsonViewer({ data }) {
  const text = JSON.stringify(data, null, 2)
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto text-xs font-mono leading-relaxed scrollbar-thin max-h-[60vh]">
      {text}
    </pre>
  )
}

function extrairId(data) {
  if (!data || typeof data !== 'object') return null
  for (const key of ['id', 'idGerado', 'idEconomico', 'idLote']) {
    const v = data[key]
    if (v != null) {
      if (typeof v === 'number' || typeof v === 'string') return String(v)
      if (typeof v === 'object' && v.id != null) return String(v.id)
    }
  }
  return null
}

export default function ClienteAPI() {
  const municipioAtivo = useMunicipioStore((s) => s.municipioAtivo)
  const [municipios, setMunicipios] = useState([])
  const [municipioSel, setMunicipioSel] = useState('')

  const [sistemas, setSistemas] = useState([])
  const [sistemaSel, setSistemaSel] = useState('')

  const [modulos, setModulos] = useState([])
  const [moduloSel, setModuloSel] = useState('')
  const [endpoints, setEndpoints] = useState([])
  const [recursoSel, setRecursoSel] = useState('')   // path selecionado
  const [endpointSel, setEndpointSel] = useState(null)

  const [metodo, setMetodo] = useState('GET')
  const [pathCustom, setPathCustom] = useState('')
  const [camposSelecionados, setCamposSelecionados] = useState({})
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
  const [abaAtiva, setAbaAtiva] = useState('resposta')
  const bodyRawRef = useRef(null)
  useEffect(() => {
    if (modoBody !== 'raw') return
    requestAnimationFrame(() => {
      const el = bodyRawRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.max(el.scrollHeight, 160) + 'px'
    })
  }, [bodyRaw, modoBody])

  useEffect(() => {
    municipiosApi.listar().then(setMunicipios)
    sistemasApi.listar().then(setSistemas)
    endpointsApi.modulos().then(setModulos)
  }, [])

  useEffect(() => {
    if (municipioAtivo) setMunicipioSel(String(municipioAtivo.id))
  }, [municipioAtivo])

  // Agrupa por nome legível (deduplica paths como /recurso e /recurso/{id})
  const recursos = useMemo(() => {
    const moduleBase = moduloSel.split(/[\s(]/)[0] // "economicos (Econômicos)" → "economicos"
    const byNome = new Map()
    for (const ep of endpoints) {
      const nome = nomeRecurso(ep, moduleBase)
      if (!byNome.has(nome)) {
        byNome.set(nome, { path: ep.path, nome })
      } else {
        const existing = byNome.get(nome)
        // Prefere path sem parâmetros dinâmicos (mais geral / coleção)
        if (!ep.path.includes('{') && existing.path.includes('{')) {
          byNome.set(nome, { path: ep.path, nome })
        }
      }
    }
    return Array.from(byNome.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [endpoints, moduloSel])

  useEffect(() => {
    const sistemaId = sistemaSel || undefined
    endpointsApi.modulos(sistemaId).then(setModulos)
    setModuloSel('')
    setRecursoSel('')
    setEndpointSel(null)
  }, [sistemaSel])

  useEffect(() => {
    if (!moduloSel) { setEndpoints([]); setRecursoSel(''); setEndpointSel(null); return }
    const sistemaId = sistemaSel || undefined
    endpointsApi.listar(moduloSel, sistemaId).then((eps) => {
      setEndpoints(eps)
      setRecursoSel('')
      setEndpointSel(null)
    })
  }, [moduloSel])

  const handleRecursoChange = (path) => {
    setRecursoSel(path)
    if (!path) { setEndpointSel(null); setPathCustom(''); return }
    setPathCustom(path)
    const match = endpoints.find((ep) => ep.path === path && ep.metodo === metodo)
    setEndpointSel(match || null)
  }

  useEffect(() => {
    if (!endpointSel) return
    setMetodo(endpointSel.metodo)
    setPathCustom(endpointSel.path)

    const rawSchema = endpointSel.bodySchema || []
    const exemplaSentinel = rawSchema.find((c) => c._exemplo)
    const campos = rawSchema.filter((c) => !c._exemplo)
    const exJson = exemplaSentinel?.json
    const exObj = Array.isArray(exJson) ? exJson[0] : exJson

    const sel = {}
    const vals = {}
    for (const c of campos) {
      if (c.tipo === 'object' && exObj && typeof exObj[c.campo] === 'object' && exObj[c.campo] !== null && !Array.isArray(exObj[c.campo])) {
        for (const [subKey, subVal] of Object.entries(exObj[c.campo])) {
          const key = `${c.campo}.${subKey}`
          sel[key] = false
          if (subVal !== null && subVal !== undefined) {
            if (typeof subVal === 'object') {
              // idGerado example comes as {id: N} from spec — extract the raw ID
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
        sel[c.campo] = c.obrigatorio || false
        vals[c.campo] = c.exemplo || ''
      }
    }
    // idIntegracao e idGerado sempre obrigatórios
    if ('idIntegracao' in sel) sel['idIntegracao'] = true
    if ('idIntegracao' in vals && !vals['idIntegracao']) vals['idIntegracao'] = 'INTEGRACAO1'
    for (const key of Object.keys(sel)) {
      if (key === 'idGerado' || key.endsWith('.idGerado')) {
        sel[key] = true
        if (!vals[key]) vals[key] = '1'
      }
    }
    setCamposSelecionados(sel)
    setValoresCampos(vals)

    setCampoBusca('')
    // Pré-preenche o JSON raw com o exemplo da spec
    if (exJson !== undefined) {
      setBodyRaw(JSON.stringify(exJson, null, 2))
      // Auto-switch to raw only for array types (objects are now expanded in schema mode)
      const temArray = campos.some((c) => c.tipo?.startsWith('array<'))
      if (temArray) setModoBody('raw')
    } else {
      setBodyRaw('')
    }
  }, [endpointSel])

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
    if (['POST', 'PUT', 'PATCH'].includes(metodo)) {
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
      setAbaAtiva('resposta')
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

  useEffect(() => {
    if (abaAtiva === 'historico') carregarHistorico()
  }, [abaAtiva])

  const temBody = ['POST', 'PUT', 'PATCH'].includes(metodo)
  const schema = (endpointSel?.bodySchema || []).filter((c) => !c._exemplo)

  // Expande campos de tipo 'object' usando o exemplo da spec (um nível de profundidade)
  const schemaExpanded = useMemo(() => {
    const sentinel = (endpointSel?.bodySchema || []).find((c) => c._exemplo)
    const exJson = sentinel?.json
    const exObj = Array.isArray(exJson) ? exJson[0] : exJson
    const result = []
    for (const c of schema) {
      if (c.tipo === 'object' && exObj && typeof exObj[c.campo] === 'object' && exObj[c.campo] !== null && !Array.isArray(exObj[c.campo])) {
        for (const [subKey, subVal] of Object.entries(exObj[c.campo])) {
          const subTipo = typeof subVal === 'number' ? 'number'
            : typeof subVal === 'boolean' ? 'boolean'
            : (typeof subVal === 'object' && subVal !== null ? 'object' : 'string')
          const subMeta = c.subFields?.find((f) => f.campo === subKey)
          // idGerado vem como {id: N} na spec — exibimos só o ID no input,
          // mas ao enviar precisamos reembalar como {id: N}
          const isIdGeradoObj = subKey === 'idGerado' && typeof subVal === 'object' && subVal !== null
          const tipoEfetivo = isIdGeradoObj ? 'number' : (subMeta?.tipo || subTipo)
          result.push({
            campo: `${c.campo}.${subKey}`,
            _displayCampo: subKey,
            _parent: c.campo,
            tipo: tipoEfetivo,
            _wrapAsIdObject: isIdGeradoObj,
            obrigatorio: false,
            descricao: subMeta?.descricao || '',
            exemplo: subVal !== null && subVal !== undefined
              ? (typeof subVal === 'object' ? JSON.stringify(subVal) : String(subVal))
              : '',
            enum: subMeta?.enum || null,
          })
        }
      } else {
        result.push({ ...c, _displayCampo: c.campo, _parent: null })
      }
    }
    return result
  }, [schema, endpointSel])

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cliente API</h1>
          <p className="text-sm text-gray-500 mt-1">Execute chamadas às APIs via proxy local</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Painel esquerdo — configuração 1-4 + executar */}
        <div className="space-y-4">
          {/* Município */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">1. Município</h3>
            <div className="relative">
              <select
                value={municipioSel}
                onChange={(e) => setMunicipioSel(e.target.value)}
                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sysgate-500 focus:border-transparent ${
                  municipioSel
                    ? 'border-sysgate-300 bg-sysgate-50/60 text-gray-800 font-medium'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                <option value="">Selecione um município...</option>
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} {m.ativo ? '(ativo)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <svg className={`w-4 h-4 ${municipioSel ? 'text-sysgate-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 20 20">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">2. Sistema</h3>
            <div className="relative">
              <select
                value={sistemaSel}
                onChange={(e) => setSistemaSel(e.target.value)}
                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sysgate-500 focus:border-transparent ${
                  sistemaSel
                    ? 'border-sysgate-300 bg-sysgate-50/60 text-gray-800 font-medium'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                <option value="">Selecione um sistema...</option>
                {sistemas.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <svg className={`w-4 h-4 ${sistemaSel ? 'text-sysgate-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 20 20">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Seleção de endpoint */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">3. Endpoint</h3>
            <div className="space-y-2">
              <div>
                <label className="label text-xs">Módulo</label>
                <SearchSelect
                  options={modulos.map((m) => ({ value: m, label: m }))}
                  value={moduloSel}
                  onChange={setModuloSel}
                  placeholder="Buscar módulo..."
                  disabled={!sistemaSel}
                />
              </div>
              <div>
                <label className="label text-xs">Recurso</label>
                <SearchSelect
                  options={recursos.map((r) => ({ value: r.path, label: r.nome }))}
                  value={recursoSel}
                  onChange={handleRecursoChange}
                  placeholder="Buscar recurso..."
                  disabled={!moduloSel}
                />
              </div>
            </div>
          </div>

          {/* Método e path */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">4. Requisição</h3>
            <div className="flex gap-2 flex-wrap">
              {METODOS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMetodo(m)
                    const path = endpointSel?.path || pathCustom
                    if (path) {
                      const match = endpoints.find((ep) => ep.path === path && ep.metodo === m)
                      setEndpointSel(match || null)
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border transition-all ${
                    metodo === m
                      ? METODO_ACTIVE[m]
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label text-xs">Path</label>
                <input
                  value={pathCustom}
                  onChange={(e) => setPathCustom(e.target.value)}
                  className="input font-mono"
                  placeholder="/recurso/{id}"
                />
              </div>
            </div>

            {municipioSel && sistemaSel && pathCustom && (() => {
              const base = (sistemas.find((s) => String(s.id) === sistemaSel)?.urlBase || '').replace(/\/$/, '')
              let uniquePath = pathCustom
              const parts = pathCustom.split('/').filter(Boolean)
              for (let i = parts.length; i >= 1; i--) {
                const prefix = '/' + parts.slice(0, i).join('/')
                if (base.endsWith(prefix)) { uniquePath = '/' + parts.slice(i).join('/'); break }
              }
              return (
                <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
                  <p className="text-xs text-gray-400 truncate font-mono">{base}</p>
                  <p className="text-sm font-semibold text-sysgate-600 font-mono break-words">{uniquePath}</p>
                </div>
              )
            })()}
          </div>

        </div>

        {/* Painel direito — body (se houver) + executar + resposta/histórico */}
        <div className="space-y-4">
          {/* Body */}
          {temBody && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700">5. Body</h3>
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
                  <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white">
                    <div className="px-3 pt-2 pb-2 bg-gray-50 border-b border-gray-200 flex-shrink-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Campos</span>
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
                        const TIPO_COR = {
                          string:  'bg-emerald-100 text-emerald-700',
                          number:  'bg-blue-100 text-blue-700',
                          object:  'bg-purple-100 text-purple-700',
                          boolean: 'bg-orange-100 text-orange-700',
                        }
                        const tipoCor = (tipo) => {
                          if (!tipo) return 'bg-gray-100 text-gray-400'
                          if (tipo.startsWith('array')) return 'bg-indigo-100 text-indigo-700'
                          return TIPO_COR[tipo] || 'bg-gray-100 text-gray-400'
                        }
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

                          // Separador visual após idIntegracao
                          if (!isFixed && lastParent === 'FIXED_SEPARATOR') {
                            items.push(
                              <div key="sep-integracao" className="h-px bg-gray-200 mx-2" />
                            )
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
                              <div
                                key={campo.campo}
                                className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 select-none"
                              >
                                <div className="w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center bg-amber-500 border-amber-500">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span className="flex-1 text-xs font-mono font-medium text-amber-800">
                                  {campo._displayCampo}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium flex-shrink-0">obrigatório</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${tipoCor(campo.tipo)}`}>
                                  {campo.tipo}
                                </span>
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
                                <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${tipoCor(campo.tipo)}`}>
                                  {campo.tipo}
                                </span>
                              </div>
                            )
                          }
                        }
                        return items
                      })()}
                    </div>
                  </div>

                  {/* Coluna direita — inputs */}
                  <div className="border border-sysgate-200 rounded-xl overflow-hidden flex flex-col bg-sysgate-50/40">
                    <div className="px-3 py-2 bg-sysgate-100/60 border-b border-sysgate-200 flex-shrink-0">
                      <span className="text-xs font-semibold text-sysgate-600 uppercase tracking-wide">Valores</span>
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
                              isFixed
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-sysgate-100/40 border-sysgate-200/60'
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

                  {/* Botão executar — entre os painéis e o preview */}
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

                  {/* Preview JSON — abaixo do botão */}
                  {bodyPreview && (
                    <pre className="bg-gray-900 text-green-300 rounded-xl p-3 text-xs font-mono overflow-auto scrollbar-thin">
                      {bodyPreview}
                    </pre>
                  )}

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
                  {/* Botão executar — modo raw */}
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

          {/* Resposta / Histórico */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-gray-200">
              {['resposta', 'historico'].map((aba) => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    abaAtiva === aba
                      ? 'border-b-2 border-sysgate-600 text-sysgate-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {aba === 'resposta' ? 'Resposta' : 'Histórico'}
                </button>
              ))}
            </div>

            <div className="p-4">
              {abaAtiva === 'resposta' ? (
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
      </div>
    </div>
  )
}
