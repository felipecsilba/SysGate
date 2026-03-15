import { useState, useEffect } from 'react'
import { municipiosApi, sistemasApi } from '../lib/api'
import useMunicipioStore from '../stores/municipioStore'

const VAZIO_MUN = { nome: '', observacoes: '' }
const VAZIO_TOKEN = { sistemaId: '', token: '', ambiente: 'homologacao' }

export default function Municipios() {
  const [municipios, setMunicipios] = useState([])
  const [carregando, setCarregando] = useState(true)

  // Modal criar/editar município
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VAZIO_MUN)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Painel de tokens
  const [municipioSel, setMunicipioSel] = useState(null)
  const [tokens, setTokens] = useState([])
  const [carregandoTokens, setCarregandoTokens] = useState(false)

  // Modal de token
  const [modalToken, setModalToken] = useState(false)
  const [formToken, setFormToken] = useState(VAZIO_TOKEN)
  const [erroToken, setErroToken] = useState('')
  const [salvandoToken, setSalvandoToken] = useState(false)
  const [mostrarToken, setMostrarToken] = useState(false)
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

  // Município selecionado
  const selecionarMunicipio = (m) => {
    if (municipioSel?.id === m.id) {
      setMunicipioSel(null)
      setTokens([])
    } else {
      setMunicipioSel(m)
      carregarTokens(m.id)
    }
  }

  // Modal município
  const abrirCriar = () => { setForm(VAZIO_MUN); setEditando(null); setErroForm(''); setModalAberto(true) }
  const abrirEditar = (m) => {
    setForm({ nome: m.nome, observacoes: m.observacoes || '' })
    setEditando(m)
    setErroForm('')
    setModalAberto(true)
  }
  const fecharModal = () => { setModalAberto(false); setEditando(null) }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
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
      if (municipioSel?.id === m.id) { setMunicipioSel(null); setTokens([]) }
      await carregar()
      await recarregarStore()
    } catch (e) {
      alert('Erro ao deletar: ' + e.message)
    }
  }

  // Modal token
  const abrirModalToken = async () => {
    setFormToken(VAZIO_TOKEN)
    setErroToken('')
    setMostrarToken(false)
    const lista = await sistemasApi.listar()
    setSistemas(lista)
    setModalToken(true)
  }

  const fecharModalToken = () => { setModalToken(false) }

  const salvarToken = async (e) => {
    e.preventDefault()
    if (!formToken.sistemaId) { setErroToken('Selecione um sistema'); return }
    setSalvandoToken(true)
    setErroToken('')
    try {
      await municipiosApi.salvarToken(municipioSel.id, {
        sistemaId: Number(formToken.sistemaId),
        token: formToken.token,
        ambiente: formToken.ambiente,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie municípios e seus tokens por sistema</p>
        </div>
        <button onClick={abrirCriar} className="btn-primary">
          + Novo município
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Tabela principal */}
        <div className="card overflow-hidden flex-1">
          {carregando ? (
            <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
          ) : municipios.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhum município cadastrado.{' '}
              <button onClick={abrirCriar} className="text-sysgate-600 underline">Adicione o primeiro.</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Sistemas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {municipios.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => selecionarMunicipio(m)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      municipioSel?.id === m.id ? 'bg-sysgate-50 border-l-2 border-sysgate-500' : m.ativo ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      {m.ativo ? (
                        <span className="badge-green badge">● Ativo</span>
                      ) : (
                        <span className="badge-gray badge">○ Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.nome}</td>
                    <td className="px-4 py-3">
                      {m._count?.municipioSistemas > 0 ? (
                        <span className="badge badge-green">{m._count.municipioSistemas} sistema{m._count.municipioSistemas !== 1 ? 's' : ''}</span>
                      ) : (
                        <span className="badge badge-gray text-xs">Nenhum</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {!m.ativo && (
                          <button onClick={() => ativar(m.id)} className="btn-secondary text-xs py-1">
                            Ativar
                          </button>
                        )}
                        <button onClick={() => abrirEditar(m)} className="btn-ghost text-xs py-1">
                          Editar
                        </button>
                        <button onClick={() => deletar(m)} className="btn-ghost text-xs py-1 text-red-600 hover:bg-red-50">
                          Deletar
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
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{municipioSel.nome}</p>
                <p className="text-xs text-gray-500">Tokens por sistema</p>
              </div>
              <button onClick={() => { setMunicipioSel(null); setTokens([]) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="p-4 space-y-2">
              {carregandoTokens ? (
                <p className="text-xs text-gray-400 text-center py-4">Carregando...</p>
              ) : tokens.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum sistema configurado.</p>
              ) : (
                tokens.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{v.sistema.nome}</p>
                      <span className={`badge text-xs ${v.ambiente === 'producao' ? 'badge-red' : 'badge-green'}`}>
                        {v.ambiente === 'producao' ? '⚠ Produção' : 'Homologação'}
                      </span>
                    </div>
                    <button
                      onClick={() => removerToken(v.sistema.id)}
                      className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={abrirModalToken}
                className="w-full btn-secondary text-xs py-2 mt-2"
              >
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando ? 'Editar município' : 'Novo município'}
              </h2>
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
                  required
                />
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  className="input resize-none"
                  rows={2}
                  placeholder="Notas internas sobre este município..."
                />
              </div>

              {erroForm && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  {erroForm}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={salvando}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar município'}
                </button>
                <button type="button" onClick={fecharModal} className="btn-secondary">
                  Cancelar
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar token</h2>
              <p className="text-sm text-gray-500">{municipioSel?.nome}</p>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800"
                  >
                    {mostrarToken ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Ambiente <span className="text-red-500">*</span></label>
                <select
                  value={formToken.ambiente}
                  onChange={(e) => setFormToken((f) => ({ ...f, ambiente: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="homologacao">Homologação</option>
                  <option value="producao">Produção</option>
                </select>
                {formToken.ambiente === 'producao' && (
                  <p className="mt-1 text-xs text-red-600">⚠ Cuidado — ações neste ambiente afetam dados reais!</p>
                )}
              </div>

              {erroToken && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  {erroToken}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={salvandoToken}>
                  {salvandoToken ? 'Salvando...' : 'Salvar token'}
                </button>
                <button type="button" onClick={fecharModalToken} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
