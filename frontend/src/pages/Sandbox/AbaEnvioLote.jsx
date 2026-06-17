import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import { proxyApi } from '../../lib/api'
import { extrairIds, tipoCor } from './utils'
import CsvPreview from './CsvPreview'
import BatchProgress from './BatchProgress'


export default function AbaEnvioLote({
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
}) {
  const [campoBusca, setCampoBusca] = useState('')

  const [csvData, setCsvData] = useState(null)
  const [csvArquivo, setCsvArquivo] = useState(null)
  const [csvSemCabecalho, setCsvSemCabecalho] = useState(false)
  const [mapeamentoCampo, setMapeamentoCampo] = useState({})
  const [modoMapeamento, setModoMapeamento] = useState({})
  const [valoresFixos, setValoresFixos] = useState({})
  const [tamanhoBatch, setTamanhoBatch] = useState(50)
  const [concorrencia, setConcorrencia] = useState(20)

  const [executando, setExecutando] = useState(false)
  const [progresso, setProgresso] = useState([])
  const [concluido, setConcluido] = useState(false)
  const progressoRef = useRef(null)

  // Reseta estado CSV-específico quando endpoint muda
  // camposSelecionados é inicializado pelo pai (index.jsx)
  useEffect(() => {
    setCampoBusca('')
    setMapeamentoCampo({})
    setModoMapeamento({})
    setValoresFixos({})
  }, [endpointSel])

  // Parse do CSV (re-executa ao trocar arquivo ou toggle de cabeçalho)
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

        // Auto-mapeamento: casa nome de coluna CSV com _displayCampo do schema
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

  const handleUploadCSV = (file) => {
    if (!file) return
    setCsvArquivo(file)
  }

  const construirBodyLinha = (linha) => {
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

    setExecutando(true)
    setConcluido(false)
    setProgresso([])

    const linhas = csvData.linhas
    const totalBatches = Math.ceil(linhas.length / tamanhoBatch)
    const resultados = new Array(totalBatches).fill(null)

    const enviarBatch = async (b) => {
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
        resultados[b] = {
          lote: b + 1,
          totalLotes: totalBatches,
          count: batchLinhas.length,
          status: 'ok',
          msg: `${res.statusCode} — ${duracao}ms`,
          resposta: res.data,
          idsGerados,
        }
      } catch (err) {
        resultados[b] = {
          lote: b + 1,
          totalLotes: totalBatches,
          count: batchLinhas.length,
          status: 'erro',
          msg: err.message,
        }
      }
      setProgresso([...resultados].filter(Boolean))
      if (progressoRef.current) {
        progressoRef.current.scrollTop = progressoRef.current.scrollHeight
      }
    }

    // Worker pool: mantém exatamente `concorrencia` lotes em andamento ao mesmo tempo
    let proximoBatch = 0
    const worker = async () => {
      while (proximoBatch < totalBatches) {
        await enviarBatch(proximoBatch++)
      }
    }
    await Promise.allSettled(
      Array.from({ length: Math.min(concorrencia, totalBatches) }, worker)
    )

    setExecutando(false)
    setConcluido(true)
  }

  const totalOk = progresso.filter((p) => p.status === 'ok').length
  const totalErro = progresso.filter((p) => p.status === 'erro').length
  const totalBatches = csvData ? Math.ceil(csvData.linhas.length / tamanhoBatch) : 0
  const percentual = totalBatches ? Math.round((progresso.length / totalBatches) * 100) : 0
  const camposMapeados = schemaExpanded.filter((c) => camposSelecionados[c.campo])

  return (
    <div className="space-y-4">

      {/* 5. Arquivo CSV */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">5</span>
            <h3 className="font-semibold text-sm text-gray-700">Arquivo CSV</h3>
          </div>
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
        <CsvPreview csvData={csvData} csvSemCabecalho={csvSemCabecalho} />
      </div>

      {/* 6. Configuração de lote */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">6</span>
          <h3 className="font-semibold text-sm text-gray-700">Configuração</h3>
        </div>
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
          <label className="label text-xs">Concorrência: <strong>{concorrencia} lotes simultâneos</strong></label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={concorrencia}
            onChange={(e) => setConcorrencia(Number(e.target.value))}
            className="w-full accent-sysgate-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* 7. Mapeamento de campos */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sysgate-600 text-white text-[10px] font-bold leading-none shrink-0">7</span>
          <h3 className="font-semibold text-sm text-gray-700">Mapeamento de campos</h3>
        </div>

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
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${tipoCor(campo.tipo)}`}>{campo.tipo}</span>
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
                          <label className={`text-xs font-mono font-medium w-24 truncate flex-shrink-0 ${isObrigatorio ? 'text-amber-800' : 'text-sysgate-700'}`} title={campo.campo}>
                            {campo._displayCampo}
                            {isObrigatorio && <span className="text-amber-500 ml-0.5">*</span>}
                          </label>

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

      {/* Botão iniciar */}
      <div className="flex justify-end gap-2">
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
      <BatchProgress
        progresso={progresso}
        concluido={concluido}
        percentual={percentual}
        totalOk={totalOk}
        totalErro={totalErro}
        totalBatches={totalBatches}
        municipioSel={municipioSel}
        sistemaSel={sistemaSel}
        pathCustom={pathCustom}
        progressoRef={progressoRef}
      />

      {/* Estado vazio */}
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
  )
}
