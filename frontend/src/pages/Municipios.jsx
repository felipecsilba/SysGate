import { useState, useEffect } from 'react'
import { municipiosApi, sistemasApi } from '../lib/api'
import useMunicipioStore from '../stores/municipioStore'

const VAZIO_MUN = { nome: '', observacoes: '' }
const VAZIO_TOKEN = { sistemaId: '', token: '' }

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

export default function Municipios() {
  const [municipios, setMunicipios] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VAZIO_MUN)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [municipioSel, setMunicipioSel] = useState(null)
  const [tokens, setTokens] = useState([])
  const [carregandoTokens, setCarregandoTokens] = useState(false)

  const [modalToken, setModalToken] = useState(false)
  const [formToken, setFormToken] = useState(VAZIO_TOKEN)
  const [erroToken, setErroToken] = useState('')
  const [salvandoToken, setSalvandoToken] = useState(false)
  const [mostrarToken, setMostrarToken] = useState(false)
  const [tokenRevelado, setTokenRevelado] = useState(null)
  const [sistemas, setSistemas] = useState([])

  const { carregarMunicipios: recarregarStore, ativarMunicipio } = useMunicipioStore()

  const carregar = async () => {
    setCarregando(true)
    try {
      const data = await municipiosApi.listar()
      setMunicipios(data)
    } finally {
      setCarregando(false)
    }
  }

  const carregarTokens = async (id) => {
    setCarregandoTokens(true)
    try {
      const data = await municipiosApi.tokens(id)
      setTokens(data)
    } finally {
      setCarregandoTokens(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const selecionarMunicipio = (m) => {
    if (municipioSel?.id === m.id) {
      setMunicipioSel(null)
      setTokens([])
    } else {
      setMunicipioSel(m)
      carregarTokens(m.id)
    }
  }

  const fecharPainel = () => { setMunicipioSel(null); setTokens([]) }

  const abrirCriar = () => { setForm(VAZIO_MUN); setEditando(null); setErroForm(''); setModalAberto(true) }
  const abrirEditar = (m) => {
    setForm({ nome: m.nome, observacoes: m.observacoes || '' })
    setEditando(m); setErroForm(''); setModalAberto(true)
  }
  const fecharModal = () => { setModalAberto(false); setEditando(null) }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true); setErroForm('')
    try {
      if (editando) {
        const updated = await municipiosApi.atualizar(editando.id, form)
        if (municipioSel?.id === editando.id) setMunicipioSel(updated)
      } else {
        await municipiosApi.criar(form)
      }
      await carregar()
      await recarregarStore()
      fecharModal()
    } catch (e) {
      setErroForm(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const ativar = async (id) => {
    try {
      await ativarMunicipio(id)
      await carregar()
    } catch (e) {
      alert('Erro ao ativar: ' + e.message)
    }
  }

  const deletar = async (m) => {
    if (!confirm(`Deletar "${m.nome}"? Esta ação também remove o histórico de requisições.`)) return
    try {
      await municipiosApi.deletar(m.id)
      if (municipioSel?.id === m.id) fecharPainel()
      await carregar()
      await recarregarStore()
    } catch (e) {
      alert('Erro ao deletar: ' + e.message)
    }
  }

  const abrirModalToken = async () => {
    setFormToken(VAZIO_TOKEN); setErroToken(''); setMostrarToken(false)
    const lista = await sistemasApi.listar()
    setSistemas(lista)
    setModalToken(true)
  }

  const fecharModalToken = () => { setModalToken(false) }

  const salvarToken = async (e) => {
    e.preventDefault()
    if (!formToken.sistemaId) { setErroToken('Selecione um sistema'); return }
    setSalvandoToken(true); setErroToken('')
    try {
      await municipiosApi.salvarToken(municipioSel.id, {
        sistemaId: Number(formToken.sistemaId),
        token: formToken.token,
      })
      await carregarTokens(municipioSel.id)
      await carregar()
      fecharModalToken()
    } catch (e) {
      setErroToken(e.message)
    } finally {
      setSalvandoToken(false)
    }
  }

  const removerToken = async (sistemaId) => {
    if (!confirm('Remover este token?')) return
    try {
      await municipiosApi.removerToken(municipioSel.id, sistemaId)
      await carregarTokens(municipioSel.id)
      await carregar()
    } catch (e) {
      alert('Erro ao remover: ' + e.message)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1 h-6 rounded-full bg-sysgate-600" />
            <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          </div>
          <p className="text-sm text-gray-400 ml-3">Gerencie municípios e seus tokens por sistema</p>
        </div>
        <button onClick={abrirCriar} className="btn-primary gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo município
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Tabela principal */}
        <div className="card overflow-hidden flex-1">
          {carregando ? (
            <div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
              Carregando...
            </div>
          ) : municipios.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
                  <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4"/>
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">Nenhum município cadastrado</p>
              <p className="text-sm text-gray-400 mb-4">Adicione um município para começar</p>
              <button onClick={abrirCriar} className="btn-primary">Adicionar primeiro município</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nome</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sistemas</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {municipios.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => selecionarMunicipio(m)}
                    className={`cursor-pointer transition-colors ${
                      municipioSel?.id === m.id
                        ? 'bg-sysgate-50/60'
                        : m.ativo
                        ? 'bg-green-50/20 hover:bg-green-50/40'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${municipioSel?.id === m.id ? 'bg-sysgate-500' : 'bg-transparent'}`} />
                        {m.ativo ? (
                          <span className="badge-green badge text-[11px]">● Ativo</span>
                        ) : (
                          <span className="badge-gray badge text-[11px]">○ Inativo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.nome}</td>
                    <td className="px-4 py-3">
                      {m._count?.municipioSistemas > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sysgate-50 text-sysgate-700">
                          {m._count.municipioSistemas} sistema{m._count.municipioSistemas !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="badge badge-gray text-[11px]">Nenhum</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        {!m.ativo && (
                          <button
                            onClick={() => ativar(m.id)}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors mr-1"
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          onClick={() => abrirEditar(m)}
                          className="p-1.5 rounded-md text-gray-300 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors"
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => deletar(m)}
                          className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Deletar"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Painel de tokens */}
        {municipioSel && (
          <div className="card w-80 shrink-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-white to-sysgate-50/30 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Município selecionado</p>
                <p className="font-semibold text-gray-900 text-sm truncate">{municipioSel.nome}</p>
                <p className="text-xs text-gray-400">Tokens por sistema</p>
              </div>
              <button
                onClick={fecharPainel}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 mt-0.5"
                title="Fechar painel"
              >
                <IconX />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {carregandoTokens ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
                  <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : tokens.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Nenhum sistema configurado.</p>
              ) : (
                tokens.map((v) => {
                  const revelado = tokenRevelado === v.sistema.id
                  return (
                    <div key={v.id} className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-800 truncate">{v.sistema.nome}</p>
                        <button
                          onClick={() => removerToken(v.sistema.id)}
                          className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 ml-1"
                          title="Remover token"
                        >
                          <IconTrash />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 text-[10px] font-mono text-gray-500 truncate bg-white border border-gray-200 rounded px-2 py-1">
                          {revelado ? v.token : (v.token.slice(0, 8) + '••••••••••••••••••••')}
                        </code>
                        <button
                          title={revelado ? 'Ocultar' : 'Revelar token'}
                          onClick={() => setTokenRevelado(revelado ? null : v.sistema.id)}
                          className="shrink-0 text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
                        >
                          {revelado
                            ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          }
                        </button>
                        <button
                          title="Copiar token"
                          onClick={() => navigator.clipboard.writeText(v.token)}
                          className="shrink-0 text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              <button onClick={abrirModalToken} className="w-full btn-secondary text-xs py-2 mt-1">
                + Adicionar sistema
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar município */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando ? 'Editar município' : 'Novo município'}
              </h2>
              <button onClick={fecharModal} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <IconX />
              </button>
            </div>
            <form onSubmit={salvar} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Nome do município <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="input"
                  placeholder="Ex: Florianópolis"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="label">Observações <span className="text-xs text-gray-400">(opcional)</span></label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  className="input resize-none"
                  rows={2}
                  placeholder="Notas internas sobre este município..."
                />
              </div>
              {erroForm && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erroForm}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={fecharModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={salvando}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar município'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal adicionar token */}
      {modalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Adicionar token</h2>
                <p className="text-xs text-gray-400">{municipioSel?.nome}</p>
              </div>
              <button onClick={fecharModalToken} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <IconX />
              </button>
            </div>
            <form onSubmit={salvarToken} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Sistema <span className="text-red-500">*</span></label>
                <select
                  value={formToken.sistemaId}
                  onChange={(e) => setFormToken((f) => ({ ...f, sistemaId: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Selecione um sistema...</option>
                  {sistemas.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Token Bearer <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={mostrarToken ? 'text' : 'password'}
                    value={formToken.token}
                    onChange={(e) => setFormToken((f) => ({ ...f, token: e.target.value }))}
                    className="input pr-16"
                    placeholder="eyJhbGci..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarToken((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 font-medium"
                  >
                    {mostrarToken ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>
              {erroToken && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erroToken}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={fecharModalToken} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={salvandoToken}>
                  {salvandoToken ? 'Salvando...' : 'Salvar token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
