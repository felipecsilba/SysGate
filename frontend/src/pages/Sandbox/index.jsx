import { useState, useEffect, useMemo } from 'react'
import { endpointsApi, municipiosApi, sistemasApi } from '../../lib/api'
import useMunicipioStore from '../../stores/municipioStore'
import SearchSelect from '../../components/SearchSelect'
import { METODOS, METODO_ACTIVE, nomeRecurso } from './utils'
import AbaRequisicao from './AbaRequisicao'
import AbaEnvioLote from './AbaEnvioLote'

export default function Sandbox() {
  const municipioAtivo = useMunicipioStore((s) => s.municipioAtivo)

  // ── Arrays de dados ────────────────────────────────────────────────────────
  const [municipios, setMunicipios] = useState([])
  const [sistemas, setSistemas] = useState([])
  const [modulos, setModulos] = useState([])
  const [endpoints, setEndpoints] = useState([])

  // ── Cadeia de seleção ──────────────────────────────────────────────────────
  const [municipioSel, setMunicipioSel] = useState('')
  const [sistemaSel, setSistemaSel] = useState('')
  const [moduloSel, setModuloSel] = useState('')
  const [recursoSel, setRecursoSel] = useState('')
  const [endpointSel, setEndpointSel] = useState(null)

  // ── Método e path (editáveis no painel esquerdo) ───────────────────────────
  const [metodo, setMetodo] = useState('GET')
  const [pathCustom, setPathCustom] = useState('')

  // ── Estado compartilhado entre abas ───────────────────────────────────────
  const [camposSelecionados, setCamposSelecionados] = useState({})

  // ── Aba ativa ─────────────────────────────────────────────────────────────
  const [abaAtiva, setAbaAtiva] = useState('requisicao')

  // ── Mount: carrega dados iniciais ──────────────────────────────────────────
  useEffect(() => {
    municipiosApi.listar().then(setMunicipios)
    sistemasApi.listar().then(setSistemas)
    endpointsApi.modulos().then(setModulos)
  }, [])

  // Sincroniza município ativo com o seletor
  useEffect(() => {
    if (municipioAtivo) setMunicipioSel(String(municipioAtivo.id))
  }, [municipioAtivo])

  // ── Cascata: sistema → módulo ──────────────────────────────────────────────
  useEffect(() => {
    const sistemaId = sistemaSel || undefined
    endpointsApi.modulos(sistemaId).then(setModulos)
    setModuloSel('')
    setRecursoSel('')
    setEndpointSel(null)
  }, [sistemaSel])

  // ── Cascata: módulo → endpoints ────────────────────────────────────────────
  useEffect(() => {
    if (!moduloSel) { setEndpoints([]); setRecursoSel(''); setEndpointSel(null); return }
    const sistemaId = sistemaSel || undefined
    endpointsApi.listar(moduloSel, sistemaId).then((eps) => {
      setEndpoints(eps)
      setRecursoSel('')
      setEndpointSel(null)
    })
  }, [moduloSel])

  // ── useMemo: recursos deduplificados ──────────────────────────────────────
  const recursos = useMemo(() => {
    const moduleBase = moduloSel.split(/[\s(]/)[0]
    const byNome = new Map()
    for (const ep of endpoints) {
      const nome = nomeRecurso(ep, moduleBase)
      if (!byNome.has(nome)) {
        byNome.set(nome, { path: ep.path, nome })
      } else {
        const existing = byNome.get(nome)
        if (!ep.path.includes('{') && existing.path.includes('{')) {
          byNome.set(nome, { path: ep.path, nome })
        }
      }
    }
    return Array.from(byNome.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [endpoints, moduloSel])

  // ── useMemo: schema (sem sentinel _exemplo) ────────────────────────────────
  const schema = useMemo(
    () => (endpointSel?.bodySchema || []).filter((c) => !c._exemplo),
    [endpointSel]
  )

  // ── useMemo: schemaExpanded (expande campos object um nível) ───────────────
  const schemaExpanded = useMemo(() => {
    const sentinel = (endpointSel?.bodySchema || []).find((c) => c._exemplo)
    const exJson = sentinel?.json
    const exObj = Array.isArray(exJson) ? exJson[0] : exJson
    const result = []
    for (const c of schema) {
      if (
        c.tipo === 'object' &&
        exObj &&
        typeof exObj[c.campo] === 'object' &&
        exObj[c.campo] !== null &&
        !Array.isArray(exObj[c.campo])
      ) {
        for (const [subKey, subVal] of Object.entries(exObj[c.campo])) {
          const subTipo =
            typeof subVal === 'number' ? 'number'
            : typeof subVal === 'boolean' ? 'boolean'
            : typeof subVal === 'object' && subVal !== null ? 'object'
            : 'string'
          const subMeta = c.subFields?.find((f) => f.campo === subKey)
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
            exemplo:
              subVal !== null && subVal !== undefined
                ? typeof subVal === 'object' ? JSON.stringify(subVal) : String(subVal)
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

  // ── Inicializa camposSelecionados quando endpoint muda (responsabilidade do pai) ──
  useEffect(() => {
    if (!endpointSel) {
      setCamposSelecionados({})
      return
    }
    setMetodo(endpointSel.metodo)
    setPathCustom(endpointSel.path)

    const rawSchema = endpointSel.bodySchema || []
    const campos = rawSchema.filter((c) => !c._exemplo)
    const sentinel = rawSchema.find((c) => c._exemplo)
    const exJson = sentinel?.json
    const exObj = Array.isArray(exJson) ? exJson[0] : exJson

    const sel = {}
    for (const c of campos) {
      if (
        c.tipo === 'object' &&
        exObj &&
        typeof exObj[c.campo] === 'object' &&
        exObj[c.campo] !== null &&
        !Array.isArray(exObj[c.campo])
      ) {
        for (const subKey of Object.keys(exObj[c.campo])) {
          sel[`${c.campo}.${subKey}`] = false
        }
      } else {
        sel[c.campo] = c.obrigatorio || false
      }
    }
    if ('idIntegracao' in sel) sel['idIntegracao'] = true
    for (const key of Object.keys(sel)) {
      if (key === 'idGerado' || key.endsWith('.idGerado')) sel[key] = true
    }
    setCamposSelecionados(sel)
  }, [endpointSel])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRecursoChange = (path) => {
    setRecursoSel(path)
    if (!path) { setEndpointSel(null); setPathCustom(''); return }
    setPathCustom(path)
    const match = endpoints.find((ep) => ep.path === path && ep.metodo === metodo)
    setEndpointSel(match || null)
  }

  // ── Props compartilhadas passadas para as abas ─────────────────────────────
  const sharedProps = {
    municipioSel,
    sistemaSel,
    endpointSel,
    metodo,
    pathCustom,
    schema,
    schemaExpanded,
    camposSelecionados,
    setCamposSelecionados,
    sistemas,
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sandbox</h1>
          <p className="text-sm text-gray-500 mt-1">Execute chamadas às APIs via proxy local</p>
        </div>

        {/* Toggle de abas */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setAbaAtiva('requisicao')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              abaAtiva === 'requisicao'
                ? 'bg-sysgate-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Requisição única
          </button>
          <button
            onClick={() => setAbaAtiva('lote')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              abaAtiva === 'lote'
                ? 'bg-sysgate-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Envio em Lote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* ── Painel esquerdo — cards 1–4 (compartilhados entre abas) ──────── */}
        <div className="space-y-4">

          {/* Card 1 — Município */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">1</span>
              <h3 className="font-semibold text-sm text-gray-700">Município</h3>
            </div>
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

          {/* Card 2 — Sistema */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">2</span>
              <h3 className="font-semibold text-sm text-gray-700">Sistema</h3>
            </div>
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

          {/* Card 3 — Endpoint */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">3</span>
              <h3 className="font-semibold text-sm text-gray-700">Endpoint</h3>
            </div>
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

          {/* Card 4 — Requisição (método + path) */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">4</span>
              <h3 className="font-semibold text-sm text-gray-700">Requisição</h3>
            </div>
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

        {/* ── Painel direito — aba ativa (mount/unmount ao trocar) ──────────── */}
        <div>
          {abaAtiva === 'requisicao'
            ? <AbaRequisicao {...sharedProps} />
            : <AbaEnvioLote {...sharedProps} />}
        </div>
      </div>
    </div>
  )
}
