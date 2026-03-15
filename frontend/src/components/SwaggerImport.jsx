import { useState, useEffect } from 'react'
import { endpointsApi } from '../lib/api'

const METODO_COLORS = {
  GET: 'bg-blue-100 text-blue-800', POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800', PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
}

function PreviewEndpoints({ endpoints }) {
  if (!endpoints?.length) return null
  const porModulo = endpoints.reduce((acc, ep) => {
    ;(acc[ep.modulo] = acc[ep.modulo] || []).push(ep)
    return acc
  }, {})
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto scrollbar-thin">
      {Object.entries(porModulo).map(([modulo, eps]) => (
        <div key={modulo}>
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{modulo}</span>
            <span className="text-xs text-gray-400">{eps.length}</span>
          </div>
          {eps.map((ep, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <span className={`badge text-xs flex-shrink-0 mt-0.5 ${METODO_COLORS[ep.metodo] || ''}`}>{ep.metodo}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{ep.nome}</p>
                <p className="font-mono text-xs text-gray-400 truncate">{ep.path}</p>
                {ep.bodySchema?.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {ep.bodySchema.length} campo{ep.bodySchema.length !== 1 ? 's' : ''} no body
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function TelasSucesso({ sucesso, onNovo, onFechar }) {
  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {sucesso.importados} endpoint{sucesso.importados !== 1 ? 's' : ''} importado{sucesso.importados !== 1 ? 's' : ''}!
      </h3>
      <p className="text-sm text-gray-500 mb-1">
        Spec: <strong>{sucesso.spec.nome}</strong> (v{sucesso.spec.versao})
      </p>
      {sucesso.spec.urlBase && (
        <p className="text-xs font-mono text-gray-400 mb-4">{sucesso.spec.urlBase}</p>
      )}
      <div className="flex gap-2 justify-center mt-4">
        <button onClick={onNovo} className="btn-secondary">Importar outra spec</button>
        <button onClick={onFechar} className="btn-primary">Fechar e usar endpoints</button>
      </div>
    </div>
  )
}

export default function SwaggerImport({ onClose, onImportado, sistemaId = null }) {
  const [modoInput, setModoInput] = useState('url')   // 'url' | 'arquivo'
  const [abaModal, setAbaModal] = useState('importar') // 'importar' | 'historico'

  // Estado URL
  const [swaggerUrl, setSwaggerUrl] = useState('')
  const [headerKey, setHeaderKey] = useState('')
  const [headerVal, setHeaderVal] = useState('')
  const [headersExtras, setHeadersExtras] = useState({})

  // Estado arquivo
  const [specTexto, setSpecTexto] = useState('')
  const [nomeFriendly, setNomeFriendly] = useState('')

  // Estado compartilhado
  const [preview, setPreview] = useState(null)
  const [specs, setSpecs] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(null)

  const carregarHistorico = async () => {
    try { setSpecs(await endpointsApi.swaggerListar()) } catch { /* ignora */ }
  }

  useEffect(() => { carregarHistorico() }, [])

  const resetar = () => {
    setSucesso(null); setPreview(null); setErro('')
    setSwaggerUrl(''); setSpecTexto(''); setNomeFriendly('')
    setHeadersExtras({}); setHeaderKey(''); setHeaderVal('')
  }

  // ── FETCH POR URL ──────────────────────────────────────────────
  const handlePreviewUrl = async () => {
    if (!swaggerUrl.trim()) { setErro('Informe a URL do swagger.json'); return }
    setErro(''); setPreview(null); setCarregando(true)
    try {
      const data = await endpointsApi.swaggerFetchUrlPreview(swaggerUrl.trim(), nomeFriendly || undefined, headersExtras)
      setPreview(data)
      if (!nomeFriendly && data.info?.title) setNomeFriendly(data.info.title)
    } catch (e) { setErro(e.message) }
    finally { setCarregando(false) }
  }

  const handleImportarUrl = async () => {
    if (!swaggerUrl.trim()) { setErro('Informe a URL do swagger.json'); return }
    setErro(''); setImportando(true)
    try {
      const data = await endpointsApi.swaggerFetchUrl(swaggerUrl.trim(), nomeFriendly || undefined, headersExtras, sistemaId)
      setSucesso(data); onImportado && onImportado(data.importados); carregarHistorico()
    } catch (e) { setErro(e.message) }
    finally { setImportando(false) }
  }

  // ── UPLOAD DE ARQUIVO ──────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setSpecTexto(e.target.result); setPreview(null); setErro('')
      try {
        const obj = JSON.parse(e.target.result)
        if (obj.info?.title && !nomeFriendly) setNomeFriendly(obj.info.title)
      } catch { /* ignora */ }
    }
    reader.readAsText(file)
  }

  const handlePreviewArquivo = async () => {
    setErro(''); setPreview(null)
    let spec
    try { spec = JSON.parse(specTexto) } catch { setErro('JSON inválido.'); return }
    setCarregando(true)
    try {
      const data = await endpointsApi.swaggerPreview(nomeFriendly, spec)
      setPreview(data)
    } catch (e) { setErro(e.message) }
    finally { setCarregando(false) }
  }

  const handleImportarArquivo = async () => {
    setErro('')
    let spec
    try { spec = JSON.parse(specTexto) } catch { setErro('JSON inválido.'); return }
    setImportando(true)
    try {
      const data = await endpointsApi.swaggerImportar(nomeFriendly, spec, sistemaId)
      setSucesso(data); onImportado && onImportado(data.importados); carregarHistorico()
    } catch (e) { setErro(e.message) }
    finally { setImportando(false) }
  }

  const deletarSpec = async (id) => {
    if (!confirm('Remover do histórico?\n(Os endpoints gerados não serão removidos.)')) return
    await endpointsApi.swaggerDeletar(id); carregarHistorico()
  }

  const [limpando, setLimpando] = useState(false)
  const limparTudo = async () => {
    if (!confirm('Limpar TODOS os endpoints e specs importadas do Swagger?\n\nMunicípios e scripts serão preservados.')) return
    setLimpando(true)
    try {
      const r = await endpointsApi.limparTudo()
      alert(`Limpeza concluída: ${r.endpointsDeletados} endpoints e ${r.specsDeletadas} specs removidos.`)
      carregarHistorico()
    } catch (e) { alert('Erro: ' + e.message) }
    finally { setLimpando(false) }
  }

  const adicionarHeader = () => {
    if (!headerKey.trim()) return
    setHeadersExtras((h) => ({ ...h, [headerKey.trim()]: headerVal.trim() }))
    setHeaderKey(''); setHeaderVal('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Importar Swagger / OpenAPI</h2>
            <p className="text-xs text-gray-500 mt-0.5">Popula todos os endpoints e body schemas automaticamente</p>
          </div>
          <button onClick={onClose} className="btn-ghost text-gray-500 px-2">✕</button>
        </div>

        {/* Abas do modal */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {[['importar', 'Importar'], ['historico', `Specs salvas (${specs.length})`]].map(([id, label]) => (
            <button key={id} onClick={() => setAbaModal(id)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${abaModal === id ? 'border-b-2 border-sysgate-600 text-sysgate-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {abaModal === 'importar' ? (
            sucesso ? (
              <TelasSucesso sucesso={sucesso} onNovo={resetar} onFechar={onClose} />
            ) : (
              <div className="space-y-5">
                {/* Toggle URL / Arquivo */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => { setModoInput('url'); setPreview(null); setErro('') }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${modoInput === 'url' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    🔗 Buscar por URL
                    <span className="ml-1.5 text-xs text-sysgate-600 font-semibold">Recomendado</span>
                  </button>
                  <button onClick={() => { setModoInput('arquivo'); setPreview(null); setErro('') }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${modoInput === 'arquivo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    📄 Upload de arquivo
                  </button>
                </div>

                {modoInput === 'url' ? (
                  /* ── MODO URL ── */
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 space-y-1">
                      <p><strong>Dica:</strong> Você pode colar o URL da página de docs (ex: <code className="bg-blue-100 px-1 rounded">/docs</code>) — o sistema tentará encontrar o JSON automaticamente.</p>
                      <p className="text-blue-700">Se não funcionar: F12 → Network → Fetch/XHR → recarregue → copie o URL da requisição <strong>.json</strong> (que pode ter <code className="bg-blue-100 px-1 rounded">?access_token=...</code>).</p>
                    </div>

                    <div>
                      <label className="label">URL do swagger.json / openapi.json <span className="text-red-500">*</span></label>
                      <input
                        value={swaggerUrl}
                        onChange={(e) => { setSwaggerUrl(e.target.value); setPreview(null) }}
                        className="input font-mono text-xs"
                        placeholder="https://tributos.suite.betha.cloud/.../swagger.json"
                        onKeyDown={(e) => e.key === 'Enter' && handlePreviewUrl()}
                      />
                    </div>

                    <div>
                      <label className="label">Nome amigável <span className="text-xs text-gray-400">(opcional — detectado automaticamente)</span></label>
                      <input value={nomeFriendly} onChange={(e) => setNomeFriendly(e.target.value)}
                        className="input" placeholder="Ex: API Tributos v2" />
                    </div>

                    {/* Headers extras (ex: Authorization) */}
                    <div>
                      <label className="label">
                        Headers adicionais <span className="text-xs text-gray-400">(se a URL exigir autenticação)</span>
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input value={headerKey} onChange={(e) => setHeaderKey(e.target.value)}
                          className="input w-40 text-xs font-mono" placeholder="Authorization" />
                        <input value={headerVal} onChange={(e) => setHeaderVal(e.target.value)}
                          className="input flex-1 text-xs font-mono" placeholder="Bearer eyJ..."
                          onKeyDown={(e) => e.key === 'Enter' && adicionarHeader()} />
                        <button onClick={adicionarHeader} className="btn-secondary text-xs px-3">+ Add</button>
                      </div>
                      {Object.keys(headersExtras).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(headersExtras).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2 text-xs font-mono bg-gray-50 rounded px-2 py-1">
                              <span className="text-gray-500">{k}:</span>
                              <span className="text-gray-700 flex-1 truncate">{v}</span>
                              <button onClick={() => setHeadersExtras((h) => { const n = { ...h }; delete n[k]; return n })}
                                className="text-red-400 hover:text-red-600">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {erro && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>}

                    {preview && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          ✅ {preview.total} endpoint{preview.total !== 1 ? 's' : ''} encontrado{preview.total !== 1 ? 's' : ''}
                          {preview.info?.title && <span className="font-normal text-gray-500"> — {preview.info.title}</span>}
                        </p>
                        <PreviewEndpoints endpoints={preview.endpoints} />
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={handlePreviewUrl} disabled={!swaggerUrl || carregando} className="btn-secondary flex-1">
                        {carregando ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />Buscando...</span> : '🔍 Pré-visualizar'}
                      </button>
                      <button onClick={handleImportarUrl} disabled={!swaggerUrl || importando} className="btn-primary flex-1">
                        {importando ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importando...</span> : '⬆ Importar para o banco'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── MODO ARQUIVO ── */
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-sysgate-400 hover:bg-blue-50/30 transition-colors">
                      <span className="text-xl mb-1">📄</span>
                      <span className="text-sm font-medium text-gray-600">
                        {specTexto ? '✅ Arquivo carregado — clique para trocar' : 'Selecionar swagger.json'}
                      </span>
                      <input type="file" accept=".json,.yaml,.yml" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                    </label>

                    <div>
                      <label className="label">Nome amigável</label>
                      <input value={nomeFriendly} onChange={(e) => setNomeFriendly(e.target.value)}
                        className="input" placeholder="Ex: API Tributos v2" />
                    </div>

                    {specTexto && (
                      <textarea value={specTexto} onChange={(e) => { setSpecTexto(e.target.value); setPreview(null) }}
                        className="code-area w-full h-28 resize-y" spellCheck={false} />
                    )}

                    {erro && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>}

                    {preview && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          ✅ {preview.total} endpoint{preview.total !== 1 ? 's' : ''} encontrado{preview.total !== 1 ? 's' : ''}
                        </p>
                        <PreviewEndpoints endpoints={preview.endpoints} />
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={handlePreviewArquivo} disabled={!specTexto || carregando} className="btn-secondary flex-1">
                        {carregando ? 'Analisando...' : '🔍 Pré-visualizar'}
                      </button>
                      <button onClick={handleImportarArquivo} disabled={!specTexto || importando} className="btn-primary flex-1">
                        {importando ? 'Importando...' : '⬆ Importar para o banco'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── HISTÓRICO ── */
            <div className="space-y-4">
              {specs.length > 0 && (
                <button
                  onClick={limparTudo}
                  disabled={limpando}
                  className="w-full py-2 px-4 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {limpando ? 'Limpando...' : '🗑 Limpar tudo — apagar todos endpoints e specs importadas'}
                </button>
              )}
              {specs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhuma spec importada ainda.</div>
              ) : (
                <div className="space-y-3">
                  {specs.map((s) => (
                    <div key={s.id} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{s.nome}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {s.versao && <span className="badge badge-blue text-xs">OpenAPI {s.versao}</span>}
                            <span className="badge badge-gray text-xs">{s.totalEndpoints} endpoints</span>
                          </div>
                          {s.urlBase && <p className="font-mono text-xs text-gray-400 mt-1">{s.urlBase}</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(s.criadoEm).toLocaleString('pt-BR')}</p>
                        </div>
                        <button onClick={() => deletarSpec(s.id)} className="btn-ghost text-xs text-red-600 hover:bg-red-50 flex-shrink-0">Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
