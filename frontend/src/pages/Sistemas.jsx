import { useState, useEffect } from 'react'
import { sistemasApi, endpointsApi } from '../lib/api'
import SwaggerImport from '../components/SwaggerImport'

const METODO_COLORS = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
}

function ModalSistema({ sistema, onSalvar, onFechar }) {
  const [nome, setNome] = useState(sistema?.nome || '')
  const [urlBase, setUrlBase] = useState(sistema?.urlBase || '')
  const [descricao, setDescricao] = useState(sistema?.descricao || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nome.trim() || !urlBase.trim()) { setErro('Nome e URL Base são obrigatórios'); return }
    setSalvando(true); setErro('')
    try {
      const data = { nome: nome.trim(), urlBase: urlBase.trim(), descricao: descricao.trim() || null }
      const resultado = sistema
        ? await sistemasApi.atualizar(sistema.id, data)
        : await sistemasApi.criar(data)
      onSalvar(resultado)
    } catch (e) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{sistema ? 'Editar Sistema' : 'Novo Sistema'}</h2>
          <button onClick={onFechar} className="btn-ghost text-gray-500 px-2">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nome <span className="text-red-500">*</span></label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input" placeholder="Ex: Tributos" autoFocus />
          </div>
          <div>
            <label className="label">URL Base <span className="text-red-500">*</span></label>
            <input value={urlBase} onChange={(e) => setUrlBase(e.target.value)} className="input font-mono text-xs"
              placeholder="https://tributos.betha.cloud/service-layer-tributos/api" />
          </div>
          <div>
            <label className="label">Descrição <span className="text-xs text-gray-400">(opcional)</span></label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="input h-20 resize-none"
              placeholder="Descreva este sistema..." />
          </div>
          {erro && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary flex-1">
              {salvando ? 'Salvando...' : sistema ? 'Salvar' : 'Criar Sistema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalEndpoint({ endpoint, onSalvar, onFechar }) {
  const [modulo, setModulo] = useState(endpoint?.modulo || '')
  const [nome, setNome] = useState(endpoint?.nome || '')
  const [path, setPath] = useState(endpoint?.path || '')
  const [metodo, setMetodo] = useState(endpoint?.metodo || 'GET')
  const [descricao, setDescricao] = useState(endpoint?.descricao || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!modulo.trim() || !nome.trim() || !path.trim()) {
      setErro('Módulo, nome e path são obrigatórios'); return
    }
    setSalvando(true); setErro('')
    try {
      await endpointsApi.atualizar(endpoint.id, { modulo, nome, path, metodo, descricao })
      onSalvar()
    } catch (e) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Editar Endpoint</h2>
          <button onClick={onFechar} className="btn-ghost text-gray-500 px-2">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Módulo <span className="text-red-500">*</span></label>
              <input value={modulo} onChange={(e) => setModulo(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Método</label>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="input">
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Nome <span className="text-red-500">*</span></label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Path <span className="text-red-500">*</span></label>
            <input value={path} onChange={(e) => setPath(e.target.value)} className="input font-mono text-xs" placeholder="/recurso/{id}" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="input" />
          </div>
          {erro && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary flex-1">
              {salvando ? 'Salvando...' : 'Salvar endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Sistemas() {
  const [sistemas, setSistemas] = useState([])
  const [sistemaSel, setSistemaSel] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [sistemaEditando, setSistemaEditando] = useState(null)
  const [swaggerAberto, setSwaggerAberto] = useState(false)

  const [abaDetalhe, setAbaDetalhe] = useState('info')
  const [endpoints, setEndpoints] = useState([])
  const [carregandoEndpoints, setCarregandoEndpoints] = useState(false)
  const [endpointEditando, setEndpointEditando] = useState(null)
  const [modalEndpoint, setModalEndpoint] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try { setSistemas(await sistemasApi.listar()) } catch { /* ignora */ }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  const carregarDetalhe = async (id) => {
    setCarregandoDetalhe(true)
    try { setDetalhe(await sistemasApi.obter(id)) } catch { /* ignora */ }
    finally { setCarregandoDetalhe(false) }
  }

  const carregarEndpoints = async (sistemaId) => {
    setCarregandoEndpoints(true)
    try {
      const data = await endpointsApi.listar(undefined, sistemaId)
      setEndpoints(data)
    } catch { /* ignora */ }
    finally { setCarregandoEndpoints(false) }
  }

  const selecionarSistema = (s) => {
    setSistemaSel(s)
    setAbaDetalhe('info')
    carregarDetalhe(s.id)
    carregarEndpoints(s.id)
  }

  const handleSalvar = (resultado) => {
    setModalAberto(false); setSistemaEditando(null)
    carregar()
    if (sistemaSel?.id === resultado.id) carregarDetalhe(resultado.id)
  }

  const handleDeletar = async (id) => {
    if (!confirm('Deletar este sistema?\n\nEndpoints e specs vinculados não serão removidos.')) return
    try {
      await sistemasApi.deletar(id)
      if (sistemaSel?.id === id) { setSistemaSel(null); setDetalhe(null); setEndpoints([]) }
      carregar()
    } catch (e) { alert('Erro: ' + e.message) }
  }

  const handleImportado = () => {
    setSwaggerAberto(false)
    if (sistemaSel) {
      carregarDetalhe(sistemaSel.id)
      carregarEndpoints(sistemaSel.id)
    }
    carregar()
  }

  const deletarSpec = async (specId) => {
    if (!confirm('Remover esta spec?\n\nOs endpoints gerados por ela não serão removidos.')) return
    try {
      await endpointsApi.swaggerDeletar(specId)
      if (sistemaSel) carregarDetalhe(sistemaSel.id)
    } catch (e) { alert('Erro: ' + e.message) }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistemas</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os sistemas, importe Swaggers e gerencie endpoints</p>
        </div>
        <button onClick={() => { setSistemaEditando(null); setModalAberto(true) }} className="btn-primary">
          + Novo Sistema
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Tabela de sistemas */}
        <div className="flex-1 min-w-0">
          {carregando ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>
          ) : sistemas.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">⚙</div>
              <p className="text-gray-600 font-medium mb-1">Nenhum sistema cadastrado</p>
              <p className="text-sm text-gray-400 mb-4">Crie um sistema para organizar seus endpoints por produto</p>
              <button onClick={() => { setSistemaEditando(null); setModalAberto(true) }} className="btn-primary">
                + Criar primeiro sistema
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">URL Base</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoints</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Specs</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sistemas.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => selecionarSistema(s)}
                      className={`border-b border-gray-100 last:border-0 cursor-pointer hover:bg-blue-50/40 transition-colors ${sistemaSel?.id === s.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{s.nome}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[220px] truncate">{s.urlBase}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge badge-blue text-xs">{s._count?.endpoints ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge badge-gray text-xs">{s._count?.swaggerSpecs ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => { setSistemaEditando(s); setModalAberto(true) }}
                            className="btn-ghost text-xs text-gray-500 px-2 py-1"
                          >Editar</button>
                          <button
                            onClick={() => handleDeletar(s.id)}
                            className="btn-ghost text-xs text-red-500 hover:bg-red-50 px-2 py-1"
                          >Deletar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Painel de detalhe com abas */}
        {sistemaSel && (
          <div className="w-96 flex-shrink-0 flex flex-col">
            {carregandoDetalhe ? (
              <div className="card p-6 text-center text-gray-400 text-sm">Carregando...</div>
            ) : detalhe ? (
              <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
                {/* Header do sistema */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-base">{detalhe.nome}</h3>
                  <p className="font-mono text-xs text-gray-400 mt-0.5 truncate">{detalhe.urlBase}</p>
                </div>

                {/* Barra de abas */}
                <div className="flex border-b border-gray-200 flex-shrink-0">
                  {[
                    ['info', 'Informações'],
                    ['specs', `Specs (${detalhe._count?.swaggerSpecs ?? 0})`],
                    ['endpoints', `Endpoints (${detalhe._count?.endpoints ?? 0})`],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setAbaDetalhe(id)}
                      className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                        abaDetalhe === id
                          ? 'border-b-2 border-sysgate-600 text-sysgate-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Aba: Informações */}
                {abaDetalhe === 'info' && (
                  <div className="p-5 space-y-4">
                    {detalhe.descricao && (
                      <p className="text-sm text-gray-500">{detalhe.descricao}</p>
                    )}
                    <div className="flex gap-3">
                      <div className="flex-1 text-center bg-blue-50 rounded-lg py-2">
                        <div className="text-xl font-bold text-blue-700">{detalhe._count?.endpoints ?? 0}</div>
                        <div className="text-xs text-blue-600">Endpoints</div>
                      </div>
                      <div className="flex-1 text-center bg-gray-50 rounded-lg py-2">
                        <div className="text-xl font-bold text-gray-700">{detalhe._count?.swaggerSpecs ?? 0}</div>
                        <div className="text-xs text-gray-500">Specs</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSistemaEditando(detalhe); setModalAberto(true) }}
                        className="btn-secondary flex-1 text-xs"
                      >
                        Editar sistema
                      </button>
                      <button
                        onClick={() => setSwaggerAberto(true)}
                        className="btn-primary flex-1 text-xs"
                      >
                        Importar Swagger
                      </button>
                    </div>
                  </div>
                )}

                {/* Aba: Specs */}
                {abaDetalhe === 'specs' && (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 border-b border-gray-100 flex-shrink-0">
                      <button
                        onClick={() => setSwaggerAberto(true)}
                        className="btn-primary w-full text-xs"
                      >
                        + Importar nova spec
                      </button>
                    </div>
                    <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
                      {detalhe.swaggerSpecs?.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">
                          Nenhuma spec importada para este sistema.
                        </p>
                      ) : (
                        detalhe.swaggerSpecs?.map((spec) => (
                          <div key={spec.id} className="border border-gray-100 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{spec.nome}</p>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {spec.versao && (
                                    <span className="badge badge-blue text-xs">v{spec.versao}</span>
                                  )}
                                  <span className="badge badge-gray text-xs">
                                    {spec.totalEndpoints} endpoints
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(spec.criadoEm).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <button
                                onClick={() => deletarSpec(spec.id)}
                                className="btn-ghost text-xs text-red-600 hover:bg-red-50 flex-shrink-0 px-2"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Aba: Endpoints */}
                {abaDetalhe === 'endpoints' && (
                  <div className="flex flex-col flex-1 min-h-0">
                    {carregandoEndpoints ? (
                      <p className="text-xs text-gray-400 text-center py-6">Carregando...</p>
                    ) : endpoints.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">
                        Nenhum endpoint. Importe um Swagger para popular.
                      </p>
                    ) : (
                      <div className="overflow-y-auto scrollbar-thin flex-1">
                        {endpoints.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-start gap-2 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 group"
                          >
                            <span className={`badge text-xs flex-shrink-0 mt-0.5 ${METODO_COLORS[ep.metodo] || ''}`}>
                              {ep.metodo}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-800 truncate">{ep.nome}</p>
                              <p className="font-mono text-xs text-gray-400 truncate">{ep.path}</p>
                              {ep.modulo && (
                                <span className="badge badge-gray text-xs mt-0.5">{ep.modulo}</span>
                              )}
                            </div>
                            <button
                              onClick={() => { setEndpointEditando(ep); setModalEndpoint(true) }}
                              className="btn-ghost text-xs px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              Editar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalSistema
          sistema={sistemaEditando}
          onSalvar={handleSalvar}
          onFechar={() => { setModalAberto(false); setSistemaEditando(null) }}
        />
      )}

      {swaggerAberto && sistemaSel && (
        <SwaggerImport
          sistemaId={sistemaSel.id}
          onClose={() => setSwaggerAberto(false)}
          onImportado={handleImportado}
        />
      )}

      {modalEndpoint && endpointEditando && (
        <ModalEndpoint
          endpoint={endpointEditando}
          onSalvar={() => {
            setModalEndpoint(false)
            setEndpointEditando(null)
            if (sistemaSel) carregarEndpoints(sistemaSel.id)
          }}
          onFechar={() => { setModalEndpoint(false); setEndpointEditando(null) }}
        />
      )}
    </div>
  )
}
