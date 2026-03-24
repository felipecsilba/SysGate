import { useState, useEffect } from 'react'
import { sistemasApi, endpointsApi } from '../lib/api'
import SwaggerImport from '../components/SwaggerImport'
import useAuthStore from '../stores/authStore'

const METODO_COLORS = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
}

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
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
          <button onClick={onFechar} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nome <span className="text-red-500">*</span></label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input" placeholder="Ex: Tributos" autoFocus />
          </div>
          <div>
            <label className="label">URL Base <span className="text-red-500">*</span></label>
            <input value={urlBase} onChange={(e) => setUrlBase(e.target.value)} className="input font-mono text-xs"
              placeholder="https://tributos.betha.cloud/service-layer-tributos" />
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
          <button onClick={onFechar} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <IconX />
          </button>
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
  const usuario = useAuthStore(state => state.usuario)
  const isAdmin = usuario?.role === 'admin'

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
  const [buscaEndpoint, setBuscaEndpoint] = useState('')

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
    setBuscaEndpoint('')
    carregarDetalhe(s.id)
    carregarEndpoints(s.id)
  }

  const fecharPainel = () => {
    setSistemaSel(null)
    setDetalhe(null)
    setEndpoints([])
    setBuscaEndpoint('')
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
      if (sistemaSel?.id === id) fecharPainel()
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

  const endpointsFiltrados = endpoints.filter((ep) => {
    if (!buscaEndpoint.trim()) return true
    const q = buscaEndpoint.toLowerCase()
    return (
      ep.nome?.toLowerCase().includes(q) ||
      ep.path?.toLowerCase().includes(q) ||
      ep.modulo?.toLowerCase().includes(q) ||
      ep.metodo?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1 h-6 rounded-full bg-sysgate-600" />
            <h1 className="text-2xl font-bold text-gray-900">Sistemas</h1>
          </div>
          <p className="text-sm text-gray-400 ml-3">Gerencie sistemas, importe Swaggers e endpoints</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setSistemaEditando(null); setModalAberto(true) }}
            className="btn-primary gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo Sistema
          </button>
        )}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Tabela de sistemas */}
        <div className="flex-1 min-w-0">
          {carregando ? (
            <div className="card p-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
              Carregando...
            </div>
          ) : sistemas.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">Nenhum sistema cadastrado</p>
              <p className="text-sm text-gray-400 mb-4">
                {isAdmin ? 'Crie um sistema para organizar seus endpoints por produto' : 'Nenhum sistema disponível ainda.'}
              </p>
              {isAdmin && (
                <button onClick={() => { setSistemaEditando(null); setModalAberto(true) }} className="btn-primary">
                  Criar primeiro sistema
                </button>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nome</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">URL Base</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Endpoints</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Specs</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sistemas.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => selecionarSistema(s)}
                      className={`cursor-pointer transition-colors ${
                        sistemaSel?.id === s.id
                          ? 'bg-sysgate-50/60'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                            sistemaSel?.id === s.id ? 'bg-sysgate-500' : 'bg-transparent'
                          }`} />
                          <span className="font-medium text-gray-900">{s.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[220px] truncate">{s.urlBase}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sysgate-50 text-sysgate-700">
                          {s._count?.endpoints ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge badge-gray text-[11px]">{s._count?.swaggerSpecs ?? 0}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-0.5 justify-end">
                            <button
                              onClick={() => { setSistemaEditando(s); setModalAberto(true) }}
                              className="p-1.5 rounded-md text-gray-300 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors"
                              title="Editar"
                            >
                              <IconEdit />
                            </button>
                            <button
                              onClick={() => handleDeletar(s.id)}
                              className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Deletar"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Painel de detalhe */}
        {sistemaSel && (
          <div className="w-96 flex-shrink-0 flex flex-col">
            {carregandoDetalhe ? (
              <div className="card p-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
                Carregando...
              </div>
            ) : detalhe ? (
              <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
                {/* Header do painel */}
                <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-white to-sysgate-50/30 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Sistema selecionado</p>
                    <h3 className="font-semibold text-gray-900 truncate">{detalhe.nome}</h3>
                    <p className="font-mono text-[11px] text-gray-400 mt-0.5 truncate">{detalhe.urlBase}</p>
                  </div>
                  <button
                    onClick={fecharPainel}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 mt-0.5"
                    title="Fechar painel"
                  >
                    <IconX />
                  </button>
                </div>

                {/* Abas */}
                <div className="flex border-b border-gray-200 flex-shrink-0">
                  {[
                    ['info', 'Informações'],
                    ['specs', `Specs (${detalhe._count?.swaggerSpecs ?? 0})`],
                    ['endpoints', `Endpoints (${detalhe._count?.endpoints ?? 0})`],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setAbaDetalhe(id)}
                      className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
                        abaDetalhe === id
                          ? 'border-b-2 border-sysgate-600 text-sysgate-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Aba: Informações */}
                {abaDetalhe === 'info' && (
                  <div className="p-4 space-y-4">
                    {detalhe.descricao && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {detalhe.descricao}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center bg-sysgate-50 rounded-xl py-3 border border-sysgate-100/50">
                        <div className="text-2xl font-bold text-sysgate-700">{detalhe._count?.endpoints ?? 0}</div>
                        <div className="text-[11px] text-sysgate-600 font-medium mt-0.5">Endpoints</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-xl py-3 border border-gray-100">
                        <div className="text-2xl font-bold text-gray-700">{detalhe._count?.swaggerSpecs ?? 0}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">Specs</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSwaggerAberto(true)}
                          className="btn-primary w-full text-xs"
                        >
                          Importar Swagger
                        </button>
                        <button
                          onClick={() => { setSistemaEditando(detalhe); setModalAberto(true) }}
                          className="btn-secondary w-full text-xs"
                        >
                          Editar sistema
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba: Specs */}
                {abaDetalhe === 'specs' && (
                  <div className="flex flex-col flex-1 min-h-0">
                    {isAdmin && (
                      <div className="p-3 border-b border-gray-100 flex-shrink-0">
                        <button onClick={() => setSwaggerAberto(true)} className="btn-primary w-full text-xs">
                          + Importar nova spec
                        </button>
                      </div>
                    )}
                    <div className="overflow-y-auto scrollbar-thin flex-1 p-3 space-y-2">
                      {detalhe.swaggerSpecs?.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">
                          Nenhuma spec importada para este sistema.
                        </p>
                      ) : (
                        detalhe.swaggerSpecs?.map((spec) => (
                          <div key={spec.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{spec.nome}</p>
                                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                  {spec.versao && (
                                    <span className="badge badge-blue text-[10px]">v{spec.versao}</span>
                                  )}
                                  <span className="badge badge-gray text-[10px]">
                                    {spec.totalEndpoints} endpoints
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(spec.criadoEm).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => deletarSpec(spec.id)}
                                  className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                  title="Remover spec"
                                >
                                  <IconTrash />
                                </button>
                              )}
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
                    {/* Busca */}
                    <div className="p-3 border-b border-gray-100 flex-shrink-0">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <IconSearch />
                        </span>
                        <input
                          type="text"
                          placeholder="Buscar por nome, path ou módulo..."
                          value={buscaEndpoint}
                          onChange={(e) => setBuscaEndpoint(e.target.value)}
                          className="input pl-8 text-xs py-1.5"
                        />
                      </div>
                    </div>

                    {carregandoEndpoints ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
                        <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
                        Carregando...
                      </div>
                    ) : endpointsFiltrados.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">
                        {buscaEndpoint ? 'Nenhum endpoint encontrado para essa busca.' : 'Nenhum endpoint. Importe um Swagger para popular.'}
                      </p>
                    ) : (
                      <div className="overflow-y-auto scrollbar-thin flex-1">
                        {endpointsFiltrados.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-start gap-2 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 group transition-colors"
                          >
                            <span className={`badge text-[10px] flex-shrink-0 mt-0.5 ${METODO_COLORS[ep.metodo] || ''}`}>
                              {ep.metodo}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-800 truncate">{ep.nome}</p>
                              <p className="font-mono text-[10px] text-gray-400 truncate">{ep.path}</p>
                              {ep.modulo && (
                                <span className="badge badge-gray text-[10px] mt-0.5">{ep.modulo}</span>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => { setEndpointEditando(ep); setModalEndpoint(true) }}
                                className="p-1 rounded-md text-gray-300 hover:text-sysgate-600 hover:bg-sysgate-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                title="Editar endpoint"
                              >
                                <IconEdit />
                              </button>
                            )}
                          </div>
                        ))}
                        {buscaEndpoint && (
                          <p className="text-[10px] text-gray-400 text-center py-3">
                            {endpointsFiltrados.length} de {endpoints.length} endpoints
                          </p>
                        )}
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
