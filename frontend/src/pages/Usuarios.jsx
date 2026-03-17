import { useState, useEffect } from 'react'
import { usuariosApi } from '../lib/api'
import useAuthStore from '../stores/authStore'

const ROLE_LABELS = { admin: 'Admin', operador: 'Operador' }
const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-700', operador: 'bg-blue-100 text-blue-700' }

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Usuarios() {
  const usuarioLogado = useAuthStore((s) => s.usuario)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Painel lateral
  const [painelAberto, setPainelAberto] = useState(false)
  const [modoSenha, setModoSenha] = useState(false)
  const [editando, setEditando] = useState(null) // null = novo usuário

  // Formulário criar/editar
  const [form, setForm] = useState({ login: '', senha: '', nome: '', role: 'operador', ativo: true })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const carregar = async () => {
    try {
      setCarregando(true)
      setErro('')
      const data = await usuariosApi.listar()
      setUsuarios(data)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => {
    setEditando(null)
    setModoSenha(false)
    setForm({ login: '', senha: '', nome: '', role: 'operador', ativo: true })
    setErroForm('')
    setPainelAberto(true)
  }

  const abrirEditar = (u) => {
    setEditando(u)
    setModoSenha(false)
    setForm({ login: u.login, nome: u.nome, role: u.role, ativo: u.ativo, senha: '' })
    setErroForm('')
    setPainelAberto(true)
  }

  const abrirSenha = (u) => {
    setEditando(u)
    setModoSenha(true)
    setNovaSenha('')
    setErroForm('')
    setPainelAberto(true)
  }

  const fecharPainel = () => {
    setPainelAberto(false)
    setEditando(null)
    setModoSenha(false)
    setErroForm('')
  }

  const salvar = async () => {
    setErroForm('')
    setSalvando(true)
    try {
      if (modoSenha) {
        await usuariosApi.alterarSenha(editando.id, novaSenha)
      } else if (editando) {
        await usuariosApi.atualizar(editando.id, { nome: form.nome, role: form.role, ativo: form.ativo })
      } else {
        await usuariosApi.criar({ login: form.login, senha: form.senha, nome: form.nome, role: form.role })
      }
      await carregar()
      fecharPainel()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (u) => {
    if (!window.confirm(`Excluir o usuário "${u.login}"? Esta ação não pode ser desfeita.`)) return
    try {
      await usuariosApi.deletar(u.id)
      await carregar()
      if (painelAberto && editando?.id === u.id) fecharPainel()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Tabela */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all ${painelAberto ? 'max-w-[calc(100%-26rem)]' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usuários do Sistema</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Logado como <span className="font-medium">{usuarioLogado?.nome}</span> ({usuarioLogado?.role})
            </p>
          </div>
          <button onClick={abrirNovo} className="btn btn-primary text-sm">
            + Novo Usuário
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{erro}</div>
        )}

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Login</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Criado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>
              )}
              {!carregando && usuarios.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum usuário encontrado</td></tr>
              )}
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${editando?.id === u.id && painelAberto ? 'bg-sysgate-50' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-gray-800">{u.login}</td>
                  <td className="px-4 py-3 text-gray-700">{u.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatarData(u.criadoEm)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => abrirEditar(u)} className="text-xs text-gray-500 hover:text-sysgate-600 px-2 py-1 rounded hover:bg-gray-100">
                        Editar
                      </button>
                      <button onClick={() => abrirSenha(u)} className="text-xs text-gray-500 hover:text-sysgate-600 px-2 py-1 rounded hover:bg-gray-100">
                        Senha
                      </button>
                      <button
                        onClick={() => excluir(u)}
                        disabled={u.id === usuarioLogado?.id}
                        title={u.id === usuarioLogado?.id ? 'Você não pode excluir seu próprio usuário' : 'Excluir usuário'}
                        className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Painel lateral */}
      {painelAberto && (
        <div className="w-96 shrink-0">
          <div className="card h-fit">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">
                {modoSenha
                  ? `Alterar Senha — ${editando?.login}`
                  : editando
                  ? `Editar — ${editando.login}`
                  : 'Novo Usuário'}
              </h2>
              <button onClick={fecharPainel} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>

            {modoSenha ? (
              /* Formulário de senha */
              <div className="space-y-4">
                <div>
                  <label className="label">Nova Senha *</label>
                  <div className="relative">
                    <input
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Mínimo 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {mostrarNovaSenha ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                {erroForm && <p className="text-sm text-red-600">{erroForm}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={salvar} disabled={salvando} className="btn btn-primary flex-1 text-sm">
                    {salvando ? 'Salvando...' : 'Alterar Senha'}
                  </button>
                  <button onClick={fecharPainel} className="btn btn-secondary text-sm">Cancelar</button>
                </div>
              </div>
            ) : (
              /* Formulário criar/editar */
              <div className="space-y-4">
                {!editando && (
                  <>
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2">
                      O usuário será criado como <strong>inativo</strong>. Após criar, ative-o na tabela para liberar o acesso.
                    </div>
                    <div>
                      <label className="label">Login *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Ex: joao.silva"
                        value={form.login}
                        onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Nome *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nome de exibição"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </div>

                {!editando && (
                  <div>
                    <label className="label">Senha *</label>
                    <div className="relative">
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        className="input pr-10"
                        placeholder="Mínimo 6 caracteres"
                        value={form.senha}
                        onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {mostrarSenha ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editando && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={form.ativo}
                      onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                      className="w-4 h-4 rounded text-sysgate-600"
                    />
                    <label htmlFor="ativo" className="text-sm text-gray-700">Usuário ativo</label>
                  </div>
                )}

                {erroForm && <p className="text-sm text-red-600">{erroForm}</p>}

                <div className="flex gap-2 pt-1">
                  <button onClick={salvar} disabled={salvando} className="btn btn-primary flex-1 text-sm">
                    {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar Usuário'}
                  </button>
                  <button onClick={fecharPainel} className="btn btn-secondary text-sm">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
