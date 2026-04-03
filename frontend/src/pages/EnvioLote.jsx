import { useState, useRef, useMemo, useEffect } from 'react'
import Papa from 'papaparse'
import { municipiosApi, endpointsApi, proxyApi, sistemasApi } from '../lib/api'
import useMunicipioStore from '../stores/municipioStore'
import SearchSelect from '../components/SearchSelect'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extrairIds(data) {
  if (!data || typeof data !== 'object') return []
  const result = []
  // Extrai ID de nível raiz (idLote, id, idGerado, idEconomico)
  for (const key of ['id', 'idGerado', 'idEconomico', 'idLote']) {
    const v = data[key]
    if (v != null) {
      if (typeof v === 'number' || typeof v === 'string') { result.push(String(v)); break }
      if (typeof v === 'object' && v.id != null) { result.push(String(v.id)); break }
    }
  }
  // Extrai IDs de retorno[] — idGerado pode ser objeto {id:N} ou escalar
  if (Array.isArray(data.retorno)) {
    for (const item of data.retorno) {
      if (!item || typeof item !== 'object') continue
      for (const key of ['idGerado', 'id', 'idEconomico']) {
        const v = item[key]
        if (v != null) {
          let val = null
          if (typeof v === 'number' || typeof v === 'string') val = String(v)
          else if (typeof v === 'object' && v.id != null) val = String(v.id)
          if (val !== null) { result.push(val); break }
        }
      }
    }
  }
  return result
}

function nomeRecurso(ep, moduleBase = '') {
  const idx = ep.nome.lastIndexOf(' - ')
  if (idx !== -1) return ep.nome.slice(idx + 3)
  const partes = ep.path.split('/').filter((p) => p && !p.startsWith('{'))
  if (partes.length === 0) return ep.nome
  const ultima = partes[partes.length - 1]
  const palavras = ultima.replace(/([A-Z])/g, ' $1').trim().split(/\s+/)
  if (moduleBase && palavras.length > 1 && palavras[0].toLowerCase() === moduleBase.toLowerCase()) {
    palavras.shift()
  }
  if (palavras.length === 0) return ultima.charAt(0).toUpperCase() + ultima.slice(1)
  palavras[0] = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1)
  return palavras.join(' ')
}

const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const METODO_ACTIVE = {
  GET:    'bg-blue-500   text-white border-blue-500',
  POST:   'bg-green-500  text-white border-green-500',
  PUT:    'bg-yellow-500 text-white border-yellow-500',
  PATCH:  'bg-orange-500 text-white border-orange-500',
  DELETE: 'bg-red-500    text-white border-red-500',
}

const TIPO_COR = {
  string:  'bg-emerald-100 text-emerald-700',
  number:  'bg-blue-100 text-blue-700',
  object:  'bg-purple-100 text-purple-700',
  boolean: 'bg-orange-100 text-orange-700',
}
function tipoCor(tipo) {
  if (!tipo) return 'bg-gray-100 text-gray-400'
  if (tipo.startsWith('array')) return 'bg-indigo-100 text-indigo-700'
  return TIPO_COR[tipo] || 'bg-gray-100 text-gray-400'
}

export default function EnvioLote() {
  const municipioAtivo = useMunicipioStore((s) => s.municipioAtivo)
  const [municipios, setMunicipios] = useState([])
  const [municipioSel, setMunicipioSel] = useState('')
  const [sistemas, setSistemas] = useState([])
  const [sistemaSel, setSistemaSel] = useState('')
  const [modulos, setModulos] = useState([])
  const [moduloSel, setModuloSel] = useState('')
  const [endpoints, setEndpoints] = useState([])
  const [recursoSel, setRecursoSel] = useState('')
  const [endpointSel, setEndpointSel] = useState(null)
  const [metodo, setMetodo] = useState('POST')
  const [pathCustom, setPathCustom] = useState('')

  const [campoBusca, setCampoBusca] = useState('')

  const [csvData, setCsvData] = useState(null)
  const [csvArquivo, setCsvArquivo] = useState(null)
  const [csvSemCabecalho, setCsvSemCabecalho] = useState(false)
  const [camposSelecionados, setCamposSelecionados] = useState({})
  const [mapeamentoCampo, setMapeamentoCampo] = useState({})
  const [modoMapeamento, setModoMapeamento] = useState({})  // { [campo]: 'csv' | 'fixo' }
  const [valoresFixos, setValoresFixos] = useState({})      // { [campo]: string }
  const [delay, setDelay] = useState(200)
  const [tamanhoBatch, setTamanhoBatch] = useState(50)

  const [executando, setExecutando] = useState(false)
  const [progresso, setProgresso] = useState([])
  const [concluido, setConcluido] = useState(false)
  const [consultasLote, setConsultasLote] = useState({})
  const [consultasResultado, setConsultasResultado] = useState({})
  const [consultandoTodos, setConsultandoTodos] = useState(false)
  const abortRef = useRef(false)
  const progressoRef = useRef(null)

  useEffect(() => {
    municipiosApi.listar().then(setMunicipios)
    sistemasApi.listar().then(setSistemas)
    endpointsApi.modulos().then(setModulos)
    if (municipioAtivo) setMunicipioSel(String(municipioAtivo.id))
  }, [municipioAtivo])

  useEffect(() => {
    const sistemaId = sistemaSel || undefined
    endpointsApi.modulos(sistemaId).then(setModulos)
    setModuloSel('')
    setRecursoSel('')
    setEndpoints([])
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

  const handleRecursoChange = (path) => {
    setRecursoSel(path)
    if (!path) { setEndpointSel(null); setPathCustom(''); return }
    setPathCustom(path)
    const match = endpoints.find((ep) => ep.path === path && ep.metodo === metodo)
    setEndpointSel(match || null)
  }

  const schema = (endpointSel?.bodySchema || []).filter((c) => !c._exemplo)

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
            enum: subMeta?.enum || null,
          })
        }
      } else {
        result.push({ ...c, _displayCampo: c.campo, _parent: null })
      }
    }
    return result
  }, [schema, endpointSel])

  useEffect(() => {
    if (!endpointSel) return
    setMetodo(endpointSel.metodo)
    setPathCustom(endpointSel.path)
    const initSel = {}
    for (const c of schemaExpanded) {
      initSel[c.campo] = c.obrigatorio || false
    }
    if ('idIntegracao' in initSel) initSel['idIntegracao'] = true
    for (const key of Object.keys(initSel)) {
      if (key === 'idGerado' || key.endsWith('.idGerado')) initSel[key] = true
    }
    setCampoBusca('')
    setCamposSelecionados(initSel)
    setMapeamentoCampo({})
    setModoMapeamento({})
    setValoresFixos({})
  }, [endpointSel])

  const handleUploadCSV = (file) => {
    if (!file) return
    setCsvArquivo(file)
  }

  useEffect(() => {
    if (!csvArquivo) return
    Papa.parse(csvArquivo, {
      header: !csvSemCabecalho,
      skipEmptyLines: true,
      complete: (resultado) => {
        let colunas, linhas
        if (csvSemCabecalho) {
          const rows = resultado.data
          const numCols = rows[0]?.length || 0
          colunas = Array.from({ length: numCols }, (_, i) =>
            numCols <= 26 ? String.fromCharCode(65 + i) : `Col${i + 1}`
          )
          linhas = rows.map((row) => {
            const obj = {}
            colunas.forEach((col, i) => { obj[col] = row[i] ?? '' })
            return obj
          })
        } else {
          colunas = resultado.meta.fields || []
          linhas = resultado.data
        }
        setCsvData({ colunas, linhas })
        setProgresso([])
        setConcluido(false)
        const autoSel = {}
        const autoMap = {}
        for (const c of schemaExpanded) {
          const match = colunas.find((col) => col.toLowerCase() === c._displayCampo.toLowerCase())
          if (match) {
            autoSel[c.campo] = true
            autoMap[c.campo] = match
          }
        }
        if (schemaExpanded.some((c) => c.campo === 'idIntegracao')) {
          autoSel['idIntegracao'] = true
        }
        for (const c of schemaExpanded) {
          if (c.campo === 'idGerado' || c._displayCampo === 'idGerado') autoSel[c.campo] = true
        }
        setCamposSelecionados(autoSel)
        setMapeamentoCampo(autoMap)
      },
      error: (err) => alert('Erro ao parsear CSV: ' + err.message),
    })
  }, [csvArquivo, csvSemCabecalho])

  const construirBodyLinha = (linha) => {
    // DELETE sem schema: usa colunas do CSV diretamente como campos do body
    if (schemaExpanded.length === 0) {
      const body = {}
      for (const [key, val] of Object.entries(linha)) {
        const num = Number(val)
        body[key] = val !== '' && !isNaN(num) ? num : val
      }
      return body
    }
    const body = {}
    for (const c of schemaExpanded) {
      if (!camposSelecionados[c.campo]) continue
      const modo = modoMapeamento[c.campo] || 'csv'
      let valor
      if (modo === 'fixo') {
        valor = valoresFixos[c.campo]
        if (valor === undefined || valor === '') continue
      } else {
        const colCSV = mapeamentoCampo[c.campo]
        if (!colCSV || linha[colCSV] === undefined) continue
        valor = linha[colCSV]
      }
      const numVal = (c.tipo === 'number' || c.tipo === 'integer') ? Number(valor) : valor
      const typedVal = c._wrapAsIdObject ? { id: Number(valor) } : numVal
      if (c._parent) {
        if (!body[c._parent]) body[c._parent] = {}
        body[c._parent][c._displayCampo] = typedVal
      } else {
        body[c.campo] = typedVal
      }
    }
    return body
  }

  const iniciarEnvio = async () => {
    if (!municipioSel) { alert('Selecione um município'); return }
    if (!sistemaSel) { alert('Selecione um sistema'); return }
    if (!pathCustom) { alert('Informe o path'); return }
    if (!csvData) { alert('Faça upload de um CSV'); return }

    abortRef.current = false
    setExecutando(true)
    setConcluido(false)
    setProgresso([])
    setConsultasLote({})

    const linhas = csvData.linhas
    const totalBatches = Math.ceil(linhas.length / tamanhoBatch)
    const resultados = []

    for (let b = 0; b < totalBatches; b++) {
      if (abortRef.current) {
        resultados.push({ lote: b + 1, totalLotes: totalBatches, status: 'abortado', msg: 'Abortado pelo usuário', count: 0 })
        break
      }

      const batchLinhas = linhas.slice(b * tamanhoBatch, (b + 1) * tamanhoBatch)
      const bodyArray = batchLinhas.map(construirBodyLinha)

      const inicio = Date.now()
      try {
        const res = await proxyApi.executar({
          municipioId: Number(municipioSel),
          sistemaId: Number(sistemaSel),
          endpointId: endpointSel?.id || null,
          path: pathCustom,
          metodo,
          body: metodo === 'GET' ? undefined : bodyArray,
          tipo: 'lote',
        })
        const duracao = Date.now() - inicio
        const idsGerados = Array.isArray(res.data)
          ? res.data.flatMap(extrairIds)
          : extrairIds(res.data)
        resultados.push({
          lote: b + 1,
          totalLotes: totalBatches,
          count: batchLinhas.length,
          status: 'ok',
          msg: `${res.statusCode} — ${duracao}ms`,
          resposta: res.data,
          idsGerados,
        })
      } catch (err) {
        resultados.push({
          lote: b + 1,
          totalLotes: totalBatches,
          count: batchLinhas.length,
          status: 'erro',
          msg: err.message,
        })
      }

      setProgresso([...resultados])
      if (progressoRef.current) {
        progressoRef.current.scrollTop = progressoRef.current.scrollHeight
      }
      if (b < totalBatches - 1) await sleep(delay)
    }

    setExecutando(false)
    setConcluido(true)
  }

  const abortar = () => { abortRef.current = true }

  const consultarLote = async (chave, loteId) => {
    setConsultasResultado((prev) => ({ ...prev, [chave]: { consultando: true, aberto: true } }))
    try {
      const res = await proxyApi.executar({
        municipioId: Number(municipioSel),
        sistemaId: Number(sistemaSel),
        path: pathCustom.replace(/\/$/, '') + '/' + loteId,
        metodo: 'GET',
        tipo: 'individual',
      })
      setConsultasResultado((prev) => ({
        ...prev,
        [chave]: { consultando: false, aberto: true, statusCode: res.statusCode, data: res.data },
      }))
    } catch (e) {
      setConsultasResultado((prev) => ({
        ...prev,
        [chave]: { consultando: false, aberto: true, statusCode: null, data: { error: e.message } },
      }))
    }
  }

  const toggleResultado = (chave) => {
    setConsultasResultado((prev) => ({
      ...prev,
      [chave]: { ...prev[chave], aberto: !prev[chave]?.aberto },
    }))
  }

  const highlightJson = (obj) => {
    const str = JSON.stringify(obj, null, 2)
    return str.replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span style="color:#93c5fd">${match}</span>`
          return `<span style="color:#86efac">${match}</span>`
        }
        if (/true|false/.test(match)) return `<span style="color:#c084fc">${match}</span>`
        if (/null/.test(match)) return `<span style="color:#6b7280">${match}</span>`
        return `<span style="color:#fde68a">${match}</span>`
      }
    )
  }

  const consultarLinhaLote = async (linha, idGerado, pathEnviado) => {
    setConsultasLote((prev) => ({ ...prev, [linha]: { ...prev[linha], consultando: true } }))
    try {
      const res = await proxyApi.executar({
        municipioId: Number(municipioSel),
        sistemaId: Number(sistemaSel),
        path: (pathEnviado || pathCustom).replace(/\/$/, '') + '/' + idGerado,
        metodo: 'GET',
        tipo: 'individual',
      })
      setConsultasLote((prev) => ({
        ...prev,
        [linha]: { consultando: false, statusCode: res.statusCode, data: res.data },
      }))
    } catch (e) {
      setConsultasLote((prev) => ({
        ...prev,
        [linha]: { consultando: false, statusCode: null, data: { error: e.message } },
      }))
    }
  }

  const exportarCSV = () => {
    const rows = progresso.map((p) => ({
      lote: p.lote,
      itens: p.count,
      status: p.status,
      mensagem: p.msg,
      ids_gerados: (p.idsGerados || []).join(','),
      total_ids: (p.idsGerados || []).length,
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_lote_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalOk = progresso.filter((p) => p.status === 'ok').length
  const totalErro = progresso.filter((p) => p.status === 'erro').length
  const totalBatches = csvData ? Math.ceil(csvData.linhas.length / tamanhoBatch) : 0
  const percentual = totalBatches ? Math.round((progresso.length / totalBatches) * 100) : 0

  // Campos selecionados (exceto idIntegracao que é sempre mostrado à parte)
  const camposMapeados = schemaExpanded.filter((c) => camposSelecionados[c.campo])

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Envio em Lote via CSV</h1>
        <p className="text-sm text-gray-500 mt-1">Processe múltiplos registros sequencialmente a partir de um arquivo CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

        {/* ── Coluna esquerda — configuração ── */}
        <div className="space-y-4">

          {/* 1. Município */}
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
                  <option key={m.id} value={m.id}>{m.nome} {m.ativo ? '(ativo)' : ''}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <svg className={`w-4 h-4 ${municipioSel ? 'text-sysgate-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 20 20">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Sistema */}
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

          {/* 3. Endpoint */}
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

          {/* 4. Requisição */}
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
            <div>
              <label className="label text-xs">Path</label>
              <input
                value={pathCustom}
                onChange={(e) => setPathCustom(e.target.value)}
                className="input font-mono"
                placeholder="/recurso/{id}"
              />
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

          {/* 5. Arquivo CSV */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700">5. Arquivo CSV</h3>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <div
                  onClick={() => setCsvSemCabecalho((v) => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${csvSemCabecalho ? 'bg-sysgate-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${csvSemCabecalho ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-gray-500">Sem cabeçalho</span>
              </label>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-sysgate-400 hover:bg-sysgate-50/30 transition-colors">
              <svg className="w-6 h-6 text-gray-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Clique para selecionar o CSV</span>
              <span className="text-xs text-gray-400 mt-0.5">ou arraste e solte</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleUploadCSV(e.target.files[0])}
              />
            </label>
            {csvData && (
              <>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-medium">
                    {csvData.linhas.length} linha{csvData.linhas.length !== 1 ? 's' : ''} · {csvData.colunas.length} coluna{csvData.colunas.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Preview table: linhas como linhas, colunas como colunas */}
                <div className="overflow-auto rounded-lg border border-gray-200 max-h-48">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="bg-gray-50 sticky top-0">
                        <th className="px-2 py-1.5 text-gray-400 font-normal text-left border-b border-r border-gray-200 whitespace-nowrap">#</th>
                        {csvData.colunas.map((col, idx) => {
                          const letra = idx < 26 ? String.fromCharCode(65 + idx) : `C${idx + 1}`
                          return (
                            <th key={col} title={!csvSemCabecalho ? col : undefined} className="px-2 py-1.5 text-left border-b border-gray-200 whitespace-nowrap">
                              <span className="font-bold text-sysgate-600">{letra}</span>
                              {!csvSemCabecalho && (
                                <div className="text-gray-400 font-normal truncate max-w-[70px]" title={col}>{col}</div>
                              )}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.linhas.slice(0, 3).map((linha, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-2 py-1 font-mono font-bold text-gray-400 border-r border-gray-200 whitespace-nowrap">{i + 1}</td>
                          {csvData.colunas.map((col) => (
                            <td key={col} className="px-2 py-1 text-gray-600 max-w-[90px] truncate font-mono" title={String(linha[col] ?? '')}>
                              {String(linha[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* 6. Configuração */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">6. Configuração</h3>
            <div>
              <label className="label text-xs">Itens por lote: <strong>{tamanhoBatch}</strong></label>
              <input
                type="range"
                min={1}
                max={200}
                step={1}
                value={tamanhoBatch}
                onChange={(e) => setTamanhoBatch(Number(e.target.value))}
                className="w-full accent-sysgate-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>1</span>
                <span>200</span>
              </div>
            </div>
            <div>
              <label className="label text-xs">Delay entre lotes: <strong>{delay}ms</strong></label>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full accent-sysgate-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0ms</span>
                <span>5000ms</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Coluna direita — mapeamento + progresso ── */}
        <div className="space-y-4">

          {/* 7. Mapeamento de campos */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">7. Mapeamento de campos</h3>

            {!endpointSel ? (
              <div className="flex items-center justify-center h-64 text-center">
                <div className="text-gray-400">
                  <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                  <p className="text-sm font-medium">Selecione um endpoint para ver os campos</p>
                </div>
              </div>
            ) : schemaExpanded.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center gap-2 px-4">
                {metodo === 'DELETE' && csvData ? (
                  <>
                    <p className="text-sm font-medium text-gray-700">Mapeamento automático pelo CSV</p>
                    <p className="text-xs text-gray-400">As colunas do seu CSV serão usadas diretamente como campos do body. Renomeie as colunas conforme a API espera (ex: <span className="font-mono bg-gray-100 px-1 rounded">id</span>).</p>
                    <div className="bg-gray-900 rounded-lg px-3 py-2 text-left w-full max-w-xs">
                      <p className="text-xs text-gray-400 mb-1">Exemplo de body por linha:</p>
                      <pre className="text-xs text-green-400 font-mono">{JSON.stringify(Object.fromEntries(csvData.colunas.map((col) => { const v = csvData.linhas[0]?.[col] ?? ''; const n = Number(v); return [col, v !== '' && !isNaN(n) ? n : v] })), null, 2)}</pre>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Este endpoint não possui campos de body definidos na spec.</p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 h-96">

                  {/* Painel esquerdo — campos do schema */}
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
                            lastParent = isFixed ? 'FIXED_SEPARATOR' : null
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

                  {/* Painel direito — mapeamento para coluna CSV */}
                  <div className="border border-sysgate-200 rounded-xl overflow-hidden flex flex-col bg-sysgate-50/40">
                    <div className="px-3 py-2 bg-sysgate-100/60 border-b border-sysgate-200 flex-shrink-0">
                      <span className="text-xs font-semibold text-sysgate-600 uppercase tracking-wide">
                        Valores
                        {csvData && <span className="ml-1.5 text-sysgate-400 normal-case font-normal">({csvData.colunas.length} colunas CSV)</span>}
                      </span>
                    </div>

                    {camposMapeados.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center p-4">
                        <p className="text-xs text-sysgate-400 text-center">Marque os campos ao lado</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
                        {camposMapeados.map((campo) => {
                          const isObrigatorio = campo.campo === 'idIntegracao' || campo._displayCampo === 'idGerado'
                          const modo = modoMapeamento[campo.campo] || 'csv'
                          return (
                            <div key={campo.campo} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 border ${
                              isObrigatorio ? 'bg-amber-50 border-amber-200' : 'bg-sysgate-100/40 border-sysgate-200/60'
                            }`}>
                              {/* Nome do campo */}
                              <label className={`text-xs font-mono font-medium w-24 truncate flex-shrink-0 ${isObrigatorio ? 'text-amber-800' : 'text-sysgate-700'}`} title={campo.campo}>
                                {campo._displayCampo}
                                {isObrigatorio && <span className="text-amber-500 ml-0.5">*</span>}
                              </label>

                              {/* Toggle CSV / Fixo */}
                              <div className={`flex rounded overflow-hidden border flex-shrink-0 text-xs ${isObrigatorio ? 'border-amber-300' : 'border-sysgate-300'}`}>
                                <button
                                  onClick={() => setModoMapeamento((m) => ({ ...m, [campo.campo]: 'csv' }))}
                                  className={`px-1.5 py-1 transition-colors ${
                                    modo === 'csv'
                                      ? isObrigatorio ? 'bg-amber-500 text-white' : 'bg-sysgate-600 text-white'
                                      : 'bg-white text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  CSV
                                </button>
                                <button
                                  onClick={() => setModoMapeamento((m) => ({ ...m, [campo.campo]: 'fixo' }))}
                                  className={`px-1.5 py-1 transition-colors border-l ${isObrigatorio ? 'border-amber-300' : 'border-sysgate-300'} ${
                                    modo === 'fixo'
                                      ? isObrigatorio ? 'bg-amber-500 text-white' : 'bg-sysgate-600 text-white'
                                      : 'bg-white text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  Fixo
                                </button>
                              </div>

                              {/* Input: coluna CSV ou valor fixo */}
                              <div className="flex-1 relative min-w-0">
                                {modo === 'csv' ? (
                                  <>
                                    <select
                                      value={mapeamentoCampo[campo.campo] || ''}
                                      onChange={(e) => setMapeamentoCampo((m) => ({ ...m, [campo.campo]: e.target.value }))}
                                      disabled={!csvData}
                                      className={`w-full appearance-none pl-2 pr-6 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-2 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isObrigatorio
                                          ? 'border-amber-200 bg-white focus:ring-amber-400 text-gray-800'
                                          : mapeamentoCampo[campo.campo]
                                            ? 'border-sysgate-300 bg-white text-gray-800 focus:ring-sysgate-500'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 focus:ring-sysgate-500'
                                      }`}
                                    >
                                      <option value="">{csvData ? '— coluna CSV —' : '— sem CSV —'}</option>
                                      {(csvData?.colunas || []).map((col, idx) => {
                                        const letra = idx < 26 ? String.fromCharCode(65 + idx) : `C${idx + 1}`
                                        const amostra = csvData.linhas[0]?.[col]
                                        const amostraStr = amostra !== undefined ? String(amostra).slice(0, 18) : ''
                                        const label = csvSemCabecalho
                                          ? `${letra}  —  ${amostraStr}`
                                          : `${letra} — ${col}${amostraStr ? `  (${amostraStr})` : ''}`
                                        return <option key={col} value={col}>{label}</option>
                                      })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                                      <svg className={`w-3 h-3 ${isObrigatorio ? 'text-amber-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 20 20">
                                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </div>
                                  </>
                                ) : campo.enum?.length > 0 ? (
                                  <div className="relative w-full">
                                    <select
                                      value={valoresFixos[campo.campo] || ''}
                                      onChange={(e) => setValoresFixos((v) => ({ ...v, [campo.campo]: e.target.value }))}
                                      className={`w-full appearance-none pl-2 pr-6 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                                        isObrigatorio
                                          ? 'border-amber-200 bg-white focus:ring-amber-400 text-gray-800'
                                          : 'border-gray-200 bg-white focus:ring-sysgate-500 text-gray-800'
                                      }`}
                                    >
                                      <option value="">— selecione —</option>
                                      {campo.enum.map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                      ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                                      <svg className={`w-3 h-3 ${isObrigatorio ? 'text-amber-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 20 20">
                                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={valoresFixos[campo.campo] || ''}
                                    onChange={(e) => setValoresFixos((v) => ({ ...v, [campo.campo]: e.target.value }))}
                                    placeholder="valor fixo para todas as linhas"
                                    className={`w-full px-2 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                                      isObrigatorio
                                        ? 'border-amber-200 bg-white focus:ring-amber-400'
                                        : 'border-gray-200 bg-white focus:ring-sysgate-500'
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview JSON amostra — formato array (lote) com syntax highlight */}
                {(() => {
                  const temAlgumValor = camposMapeados.some((c) => {
                    const modo = modoMapeamento[c.campo] || 'csv'
                    return modo === 'fixo' ? valoresFixos[c.campo] : mapeamentoCampo[c.campo]
                  })
                  if (!temAlgumValor) return null
                  const totalLinhas = csvData?.linhas.length || 0
                  const totalBatchesPrevia = Math.ceil(totalLinhas / tamanhoBatch)
                  const itensNoLote = Math.min(tamanhoBatch, totalLinhas)
                  const maxPrevia = Math.min(5, itensNoLote)
                  const linhasPrevia = csvData?.linhas.slice(0, maxPrevia) || [{}]
                  const restante = itensNoLote - maxPrevia

                  const linhasJson = ['[']
                  linhasPrevia.forEach((linha, i) => {
                    const body = construirBodyLinha(linha)
                    const pretty = JSON.stringify(body, null, 2)
                    const indented = pretty.split('\n').map((l) => `  ${l}`).join('\n')
                    linhasJson.push(indented + (i < linhasPrevia.length - 1 || restante > 0 ? ',' : ''))
                  })
                  if (restante > 0) {
                    linhasJson.push(`\n  // ... +${restante} item${restante !== 1 ? 's' : ''} neste lote`)
                  }
                  linhasJson.push(']')
                  const jsonStr = linhasJson.join('\n')

                  const highlighted = jsonStr.replace(
                    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|\/\/[^\n]*)/g,
                    (match) => {
                      if (match.startsWith('//')) return `<span style="color:#4b5563;font-style:italic">${match}</span>`
                      if (/^"/.test(match)) {
                        if (/:$/.test(match)) return `<span style="color:#93c5fd">${match}</span>`
                        return `<span style="color:#86efac">${match}</span>`
                      }
                      if (/true|false/.test(match)) return `<span style="color:#c084fc">${match}</span>`
                      if (/null/.test(match)) return `<span style="color:#6b7280">${match}</span>`
                      return `<span style="color:#fde68a">${match}</span>`
                    }
                  )

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-500">
                          Prévia — Lote 1/{totalBatchesPrevia}
                          <span className="ml-1.5 text-gray-400 font-normal">{itensNoLote} {itensNoLote !== 1 ? 'itens' : 'item'} por lote</span>
                        </p>
                        <span className="text-xs text-gray-400">mostrando {maxPrevia}/{itensNoLote}</span>
                      </div>
                      <pre
                        className="bg-gray-950 rounded-xl px-4 py-3 text-xs font-mono overflow-auto scrollbar-thin max-h-80 leading-5"
                        style={{ color: '#e5e7eb' }}
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                      />
                    </div>
                  )
                })()}
              </>
            )}
          </div>

          {/* Botão iniciar — entre mapeamento e progresso */}
          <div className="flex justify-end gap-2">
            {executando && (
              <button onClick={abortar} className="btn-danger px-5 py-2.5">
                Abortar
              </button>
            )}
            <button
              onClick={iniciarEnvio}
              disabled={executando || !csvData || !municipioSel || !sistemaSel || !pathCustom}
              className="btn-primary px-6 py-2.5"
            >
              {executando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Lote {progresso.length}/{totalBatches}...
                </span>
              ) : (
                csvData
                  ? `▶ Iniciar envio (${totalBatches} lote${totalBatches !== 1 ? 's' : ''} · ${csvData.linhas.length} itens)`
                  : '▶ Iniciar envio'
              )}
            </button>
          </div>

          {/* Progresso */}
          {progresso.length > 0 && (
            <>
              <div className="card p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Progresso</span>
                  <span className="text-gray-500">Lote {progresso.length}/{totalBatches} ({percentual}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-sysgate-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">{totalOk} lote{totalOk !== 1 ? 's' : ''} ok</span>
                  <span className="text-red-600 font-medium">{totalErro} erro{totalErro !== 1 ? 's' : ''}</span>
                  {(() => {
                    const total = progresso.reduce((acc, p) => acc + (p.idsGerados?.length || 0), 0)
                    return total > 0 ? <span className="text-sysgate-600 font-medium">{total} IDs gerados</span> : null
                  })()}
                </div>
                {concluido && (() => {
                  const todosIds = progresso.flatMap((p) => p.idsGerados || [])
                  return (
                    <div className="flex gap-2 mt-1">
                      {todosIds.length > 0 && (
                        <button
                          onClick={() => navigator.clipboard.writeText(todosIds.join('\n'))}
                          className="btn-secondary flex-1 justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar {todosIds.length} IDs
                        </button>
                      )}
                      <button onClick={exportarCSV} className="btn-secondary flex-1 justify-center">
                        Exportar relatório CSV
                      </button>
                    </div>
                  )
                })()}
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-200 text-sm font-semibold text-gray-700">
                  Log de execução
                </div>
                <div
                  ref={progressoRef}
                  className="divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin"
                >
                  {progresso.map((p, i) => (
                    <div key={i} className={`px-4 py-3 ${p.status === 'erro' ? 'bg-red-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                          p.status === 'ok' ? 'bg-green-500' : p.status === 'erro' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-700">
                              Lote {p.lote}/{p.totalLotes}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.count} itens</span>
                            <span className={`text-xs font-mono ${p.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                              {p.msg}
                            </span>
                            {p.idsGerados?.length > 0 && (
                              <button
                                onClick={() => navigator.clipboard.writeText(p.idsGerados.join('\n'))}
                                className="ml-auto text-xs text-sysgate-600 hover:text-sysgate-800 font-medium flex items-center gap-1 flex-shrink-0"
                                title="Copiar IDs deste lote"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {p.idsGerados.length} IDs
                              </button>
                            )}
                          </div>
                          {p.idsGerados?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {p.idsGerados.slice(0, 30).map((id, j) => {
                                const chave = `${p.lote}-${id}`
                                const consulta = consultasResultado[chave]
                                const jaConsultado = !!consulta?.statusCode
                                return (
                                  <div key={j} className="flex items-center gap-0.5">
                                    <span
                                      className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-l cursor-pointer hover:bg-green-100"
                                      title="Clique para copiar"
                                      onClick={() => navigator.clipboard.writeText(id)}
                                    >
                                      {id}
                                    </span>
                                    {jaConsultado && (
                                      <button
                                        onClick={() => toggleResultado(chave)}
                                        title={consulta?.aberto ? 'Recolher' : 'Expandir'}
                                        className={`text-xs px-1.5 py-0.5 border-y font-medium transition-colors ${
                                          consulta?.aberto
                                            ? 'bg-sysgate-600 text-white border-sysgate-600'
                                            : 'bg-white text-sysgate-500 border-green-200 hover:bg-sysgate-50'
                                        }`}
                                      >
                                        {consulta?.aberto ? '▲' : '▼'}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => consultarLote(chave, id)}
                                      disabled={consulta?.consultando}
                                      title={jaConsultado ? 'Reprocessar GET' : 'Consultar GET'}
                                      className={`text-xs px-1.5 py-0.5 rounded-r border font-medium transition-colors flex items-center gap-0.5 ${
                                        jaConsultado
                                          ? 'bg-white text-gray-500 border-green-200 hover:bg-gray-50'
                                          : 'bg-white text-sysgate-600 border-green-200 hover:bg-sysgate-50'
                                      }`}
                                    >
                                      {consulta?.consultando
                                        ? <span className="w-3 h-3 border-2 border-sysgate-300 border-t-sysgate-600 rounded-full animate-spin inline-block" />
                                        : jaConsultado ? '↺' : '▼ GET'
                                      }
                                    </button>
                                  </div>
                                )
                              })}
                              {p.idsGerados.length > 30 && (
                                <span className="text-xs text-gray-400 self-center">+{p.idsGerados.length - 30} mais</span>
                              )}
                            </div>
                          )}
                          {/* Resultados expandidos por ID */}
                          {p.idsGerados?.map((id) => {
                            const chave = `${p.lote}-${id}`
                            const consulta = consultasResultado[chave]
                            if (!consulta?.aberto || consulta?.consultando) return null
                            return (
                              <div key={chave} className="mt-1 rounded-lg overflow-hidden border border-gray-700">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-300">GET /{id}</span>
                                    {consulta.statusCode && (
                                      <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                                        consulta.statusCode < 300 ? 'bg-green-900 text-green-300' :
                                        consulta.statusCode < 400 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                                      }`}>{consulta.statusCode}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(consulta.data, null, 2))}
                                    className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    copiar
                                  </button>
                                </div>
                                <pre
                                  className="bg-gray-950 px-3 py-2.5 text-xs font-mono overflow-auto scrollbar-thin max-h-64 leading-5"
                                  style={{ color: '#e5e7eb' }}
                                  dangerouslySetInnerHTML={{ __html: highlightJson(consulta.data) }}
                                />
                              </div>
                            )
                          })}
                          {p.status === 'erro' && p.resposta !== undefined && (
                            <p className="text-xs text-red-500 font-mono truncate">
                              {JSON.stringify(p.resposta).slice(0, 150)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Painel de todos os IDs gerados */}
              {concluido && (() => {
                const todosIds = progresso.flatMap((p) => p.idsGerados || [])
                if (todosIds.length === 0) return null
                return (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        IDs gerados
                        <span className="ml-2 text-xs font-normal text-gray-400">{todosIds.length} registros</span>
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(todosIds.join('\n'))}
                        className="flex items-center gap-1.5 text-xs text-sysgate-600 hover:text-sysgate-800 font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar todos
                      </button>
                    </div>
                    <div className="p-3 max-h-48 overflow-y-auto scrollbar-thin">
                      <div className="flex flex-wrap gap-1">
                        {todosIds.map((id, i) => (
                          <span
                            key={i}
                            className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded cursor-pointer hover:bg-green-100 transition-colors"
                            title="Clique para copiar"
                            onClick={() => navigator.clipboard.writeText(id)}
                          >
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Monitor de lotes — status por ID */}
              {concluido && (() => {
                const todosIdsComLote = progresso.flatMap((p) =>
                  (p.idsGerados || []).map((id) => ({ id, lote: p.lote }))
                )
                if (todosIdsComLote.length === 0) return null

                const getStatus = (chave) => {
                  const c = consultasResultado[chave]
                  if (!c || !c.statusCode) return 'pendente'
                  if (c.consultando) return 'consultando'
                  if (c.statusCode < 200 || c.statusCode >= 300) return 'erro'
                  const statusLote = c.data?.statusLote
                  if (statusLote === 'NAO_PROCESSADO') return 'pendente'
                  if (statusLote === 'ERRO' || statusLote === 'FALHA') return 'erro'
                  return 'sucesso'
                }

                const pendentes = todosIdsComLote.filter(({ id, lote }) => getStatus(`${lote}-${id}`) === 'pendente')
                const nSucesso = todosIdsComLote.filter(({ id, lote }) => getStatus(`${lote}-${id}`) === 'sucesso').length
                const nErro = todosIdsComLote.filter(({ id, lote }) => getStatus(`${lote}-${id}`) === 'erro').length

                const consultarTodosPendentes = async () => {
                  setConsultandoTodos(true)
                  for (const { id, lote } of pendentes) {
                    const chave = `${lote}-${id}`
                    await consultarLote(chave, id)
                    await sleep(300)
                  }
                  setConsultandoTodos(false)
                }

                const CORES = {
                  pendente: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
                  consultando: 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse cursor-wait',
                  sucesso: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100',
                  erro: 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100',
                }

                return (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold text-gray-700 shrink-0">Monitor de lotes</span>
                        <div className="flex items-center gap-2 text-xs">
                          {nSucesso > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{nSucesso} ✓</span>}
                          {nErro > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">{nErro} ✗</span>}
                          {pendentes.length > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{pendentes.length} pendentes</span>}
                        </div>
                      </div>
                      {pendentes.length > 0 && (
                        <button
                          onClick={consultarTodosPendentes}
                          disabled={consultandoTodos}
                          className="flex items-center gap-1.5 text-xs bg-sysgate-600 text-white px-3 py-1.5 rounded-lg hover:bg-sysgate-700 disabled:opacity-50 transition-colors shrink-0 font-medium"
                        >
                          {consultandoTodos
                            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Consultando...</>
                            : <>↺ Consultar {pendentes.length} pendentes</>
                          }
                        </button>
                      )}
                    </div>
                    <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
                      <div className="flex flex-wrap gap-1.5">
                        {todosIdsComLote.map(({ id, lote }, i) => {
                          const chave = `${lote}-${id}`
                          const status = getStatus(chave)
                          const consulta = consultasResultado[chave]
                          return (
                            <button
                              key={i}
                              onClick={() => status !== 'consultando' && consultarLote(chave, id)}
                              disabled={status === 'consultando'}
                              title={
                                status === 'sucesso' ? `${consulta.statusCode} — clique para reprocessar` :
                                status === 'erro' ? `${consulta.statusCode} — clique para reprocessar` :
                                'Clique para consultar'
                              }
                              className={`text-xs font-mono border px-2 py-1 rounded transition-all flex items-center gap-1 ${CORES[status]}`}
                            >
                              {status === 'consultando' && (
                                <span className="w-2.5 h-2.5 border border-blue-400 border-t-blue-700 rounded-full animate-spin shrink-0" />
                              )}
                              {status === 'sucesso' && <span className="shrink-0 font-bold">✓</span>}
                              {status === 'erro' && <span className="shrink-0 font-bold">✗</span>}
                              <span>{id}</span>
                              {consulta?.statusCode && (
                                <span className="opacity-50 text-[10px] font-sans shrink-0">{consulta.statusCode}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {/* Estado vazio — sem CSV ainda */}
          {!csvData && !executando && (
            <div className="card p-10 flex flex-col items-center justify-center text-center text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Faça upload de um CSV para começar</p>
              <p className="text-xs mt-1">O progresso da execução aparecerá aqui</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
